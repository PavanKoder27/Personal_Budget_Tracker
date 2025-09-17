const express = require('express');
const { Group, GroupExpense, Settlement } = require('../models/Group');
const auth = require('../middleware/auth');

const router = express.Router();

// Utility: return a plain object version of a group preserving original member.user id
async function toObjectWithUserId(groupDoc) {
  if (!groupDoc) return groupDoc;
  const raw = groupDoc.toObject();
  // Preserve the original ObjectId for placeholders or when populate yields null
  raw.members = (raw.members || []).map(m => ({
    ...m,
    userId: m.user // original id before populate
  }));
  // Populate for convenience (adds members.user with user doc if exists)
  await Group.populate(raw, { path: 'members.user', select: 'name email profilePicture' });
  return raw;
}

// Get user's groups
router.get('/', auth, async (req, res) => {
  try {
    const docs = await Group.find({ 'members.user': req.user._id });
    const groups = await Promise.all(docs.map(g => toObjectWithUserId(g)));
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single group (populated) if member
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if(!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.some(m => m.user && m.user.toString() === req.user._id.toString());
    if(!isMember) return res.status(403).json({ message: 'Not a member' });
    const out = await toObjectWithUserId(group);
    res.json(out);
  } catch(error){
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = new Group({
      name,
      description,
      members: [{
        user: req.user._id,
        name: req.user.name,
        isAdmin: true
      }],
      createdBy: req.user._id
    });
    
  await group.save();
  const out = await toObjectWithUserId(group);
  res.status(201).json(out);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    const trimmed = (name || '').trim();
    if(!trimmed) return res.status(400).json({ message: 'Name required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if user is admin
    const userMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!userMember || !userMember.isAdmin) return res.status(403).json({ message: 'Not authorized' });

    // Prevent duplicate name (case-insensitive) for easier UX clarity
    const nameExists = group.members.some(m => (m.name || '').toLowerCase() === trimmed.toLowerCase());
    if(nameExists) return res.status(400).json({ message: 'Member name already exists' });

    let finalUserId = userId;
    console.log('[ADD MEMBER] incoming', { groupId: req.params.id, body: req.body, trimmed });
    // If email provided try to find user by email
    if(!finalUserId && email){
      const existing = await require('../models/User').findOne({ email: email.toLowerCase() });
      console.log('[ADD MEMBER] lookup by email', email, 'found?', !!existing);
      if(existing) finalUserId = existing._id;
    }
    // Try matching by exact name if still no user and no email
    if(!finalUserId && !email){
      const existingByName = await require('../models/User').findOne({ name: trimmed });
      console.log('[ADD MEMBER] lookup by name', trimmed, 'found?', !!existingByName);
      if(existingByName) finalUserId = existingByName._id;
    }
    // If still not found create placeholder ObjectId (non-auth member). Need 'new'.
    let isPlaceholder = false;
    if(!finalUserId) {
      const mongoose = require('mongoose');
      finalUserId = new mongoose.Types.ObjectId();
      isPlaceholder = true;
      console.log('[ADD MEMBER] created placeholder ObjectId', String(finalUserId));
    }
    else console.log('[ADD MEMBER] resolved existing userId', String(finalUserId));
    const exists = group.members.find(m => m.user && m.user.toString() === String(finalUserId));
    if (exists) return res.status(400).json({ message: 'Member already in group' });

  group.members.push({ user: finalUserId, name: trimmed, isAdmin: false, isPlaceholder });
    console.log('[ADD MEMBER] pushing member', { finalUserId: String(finalUserId), name: trimmed });
    await group.save();
    console.log('[ADD MEMBER] group saved. Members count now', group.members.length);

    // Return refreshed group populated for UI convenience
  const populated = await toObjectWithUserId(await Group.findById(group._id));
  console.log('[ADD MEMBER] success respond groupId', group._id);
  res.json(populated);
  } catch (error) {
    console.error('[ADD MEMBER] error', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update group metadata (name/description) - admin only
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);
    if(!group) return res.status(404).json({ message: 'Group not found' });
    const admin = group.members.find(m => m.user.toString() === req.user._id.toString() && m.isAdmin);
    if(!admin) return res.status(403).json({ message: 'Not authorized' });
    if(typeof name === 'string' && name.trim()) group.name = name.trim();
    if(typeof description === 'string') group.description = description;
  await group.save();
  const populated = await toObjectWithUserId(await Group.findById(group._id));
  res.json(populated);
  } catch(error){
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Promote/Demote member (toggle isAdmin) - admin only
router.patch('/:id/members/:memberId/role', auth, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const group = await Group.findById(req.params.id);
    if(!group) return res.status(404).json({ message: 'Group not found' });
    const admin = group.members.find(m => m.user.toString() === req.user._id.toString() && m.isAdmin);
    if(!admin) return res.status(403).json({ message: 'Not authorized' });
    const member = group.members.id(req.params.memberId) || group.members.find(m => m._id.toString() === req.params.memberId);
    if(!member) return res.status(404).json({ message: 'Member not found' });
    member.isAdmin = !!isAdmin;
    // Ensure at least one admin remains
    if(!group.members.some(m => m.isAdmin)) { member.isAdmin = true; }
  await group.save();
  const populated = await toObjectWithUserId(await Group.findById(group._id));
  res.json(populated);
  } catch(error){
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove member - admin only (cannot remove last admin or self if only admin)
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if(!group) return res.status(404).json({ message: 'Group not found' });
    const admin = group.members.find(m => m.user.toString() === req.user._id.toString() && m.isAdmin);
    if(!admin) return res.status(403).json({ message: 'Not authorized' });
    const index = group.members.findIndex(m => m._id.toString() === req.params.memberId);
    if(index === -1) return res.status(404).json({ message: 'Member not found' });
    const target = group.members[index];
    // Prevent removing last admin
    if(target.isAdmin){
      const otherAdmins = group.members.filter(m => m.isAdmin && m._id.toString() !== target._id.toString());
      if(otherAdmins.length === 0) return res.status(400).json({ message: 'Cannot remove the last admin' });
    }
    group.members.splice(index,1);
    await group.save();
    const populated = await Group.findById(group._id).populate('members.user','name email');
    res.json(populated);
  } catch(error){
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add group expense
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const { amount, description, splits, category } = req.body;
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is member
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Basic validation
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }
    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ message: 'At least one split is required' });
    }

    // Normalize and validate splits: valid ObjectId and member of group
    const mongoose = require('mongoose');
    const memberIds = new Set(group.members.map(m => m.user.toString()));
    let sum = 0;
    const normSplits = [];
    for (const s of splits) {
      if (!s || s.amount == null || typeof s.amount !== 'number' || s.amount < 0) {
        return res.status(400).json({ message: 'Each split must include a non-negative amount' });
      }
      let uid = s.user;
      if (!uid || typeof uid !== 'string') {
        return res.status(400).json({ message: 'Each split must include a valid user id' });
      }
      // Validate ObjectId
      try { uid = new mongoose.Types.ObjectId(uid).toString(); } catch { return res.status(400).json({ message: 'Invalid split user id' }); }
      if (!memberIds.has(uid)) {
        return res.status(400).json({ message: 'Split includes a user that is not a member of this group' });
      }
      sum += s.amount;
      normSplits.push({ user: uid, amount: s.amount });
    }
    // Allow tiny rounding mismatch
    if (Math.abs(sum - amount) > 0.05) {
      return res.status(400).json({ message: `Splits total (${sum}) does not equal amount (${amount})` });
    }

    const expense = new GroupExpense({
      group: req.params.id,
      paidBy: req.user._id,
      amount,
      description,
      category: category || 'General',
      splits: normSplits
    });
    
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    // Provide friendlier error for common cast/validation errors
    if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
      return res.status(400).json({ message: 'Invalid expense data', error: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List expenses (recent first)
router.get('/:id/expenses', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });
    const expenses = await GroupExpense.find({ group: req.params.id }).sort({ date:-1 }).limit(100);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get group balances
router.get('/:id/balances', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    const expenses = await GroupExpense.find({ group: req.params.id });
    const settlements = await Settlement.find({ group: req.params.id });
    
    // Calculate balances
    const balances = {};
    
    // Initialize balances
    group.members.forEach(member => {
      balances[member.user.toString()] = 0;
    });
    
    // Process expenses
    expenses.forEach(expense => {
      // Person who paid gets positive balance
      balances[expense.paidBy.toString()] += expense.amount;
      
      // People who owe get negative balance
      expense.splits.forEach(split => {
        balances[split.user.toString()] -= split.amount;
      });
    });
    
    // Process settlements
    settlements.forEach(settlement => {
      balances[settlement.paidBy.toString()] -= settlement.amount;
      balances[settlement.paidTo.toString()] += settlement.amount;
    });
    
    res.json(balances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Settlement suggestions (minimal-ish greedy) - returns recommended transfers
router.get('/:id/settlements/suggest', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if(!group) return res.status(404).json({ message: 'Group not found' });
    const expenses = await GroupExpense.find({ group: req.params.id });
    const settlements = await Settlement.find({ group: req.params.id });
    const balances = {};
    group.members.forEach(m => { balances[m.user.toString()] = 0; });
    expenses.forEach(ex => {
      balances[ex.paidBy.toString()] += ex.amount;
      ex.splits.forEach(s => { balances[s.user.toString()] -= s.amount; });
    });
    settlements.forEach(s => { balances[s.paidBy.toString()] -= s.amount; balances[s.paidTo.toString()] += s.amount; });
    const debtors = []; const creditors = [];
    Object.entries(balances).forEach(([uid, val]) => {
      if (val < -0.01) debtors.push({ uid, amount: -val });
      else if (val > 0.01) creditors.push({ uid, amount: val });
    });
    debtors.sort((a,b)=> b.amount - a.amount);
    creditors.sort((a,b)=> b.amount - a.amount);
    const transfers = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length){
      const d = debtors[i]; const c = creditors[j];
      const amt = Math.min(d.amount, c.amount);
      transfers.push({ from: d.uid, to: c.uid, amount: Number(amt.toFixed(2)) });
      d.amount -= amt; c.amount -= amt;
      if(d.amount <= 0.01) i++;
      if(c.amount <= 0.01) j++;
    }
    res.json({ transfers });
  } catch(error){
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record settlement
router.post('/:id/settlements', auth, async (req, res) => {
  try {
    const { paidTo, amount } = req.body;
    
    const settlement = new Settlement({
      group: req.params.id,
      paidBy: req.user._id,
      paidTo,
      amount
    });
    
    await settlement.save();
    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete group (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('[DELETE GROUP] request by', req.user._id, 'group', req.params.id);
    const group = await Group.findById(req.params.id);
    if(!group) { console.log('[DELETE GROUP] not found'); return res.status(404).json({ message: 'Group not found' }); }
    const admin = group.members.find(m => m.user.toString() === req.user._id.toString() && m.isAdmin);
    if(!admin) { console.log('[DELETE GROUP] not authorized'); return res.status(403).json({ message: 'Not authorized' }); }
    await GroupExpense.deleteMany({ group: group._id });
    await Settlement.deleteMany({ group: group._id });
    await group.deleteOne();
    console.log('[DELETE GROUP] success');
    res.json({ message: 'Group deleted' });
  } catch(error){
    console.error('[DELETE GROUP] error', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
