const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// Get all budgets for a user
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Budget status with spending progress
router.get('/status', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = month ? parseInt(month) : (now.getMonth() + 1);
    const y = year ? parseInt(year) : now.getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    const budgets = await Budget.find({ user: req.user.id });
    const txns = await Transaction.find({ user: req.user.id, type: 'expense', date: { $gte: start, $lte: end } });
    const spentByCat = txns.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    const status = budgets.map(b => {
      const spent = spentByCat[b.category] || 0;
      const remaining = Math.max(0, b.amount - spent);
      const percentage = b.amount === 0 ? 0 : Math.min(100, (spent / b.amount) * 100);
      return { category: b.category, budget: b.amount, spent, remaining, percentage: Number(percentage.toFixed(2)) };
    });
    res.json(status);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// Export budgets
router.get('/export', auth, async (req, res) => {
  try {
    const list = await Budget.find({ user: req.user.id }).sort({ category: 1 });
    const { format = 'csv' } = req.query;
    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename="budgets.json"');
      return res.json(list);
    }
    const header = 'category,amount,period\n';
    const rows = list.map(b => [
      '"' + (b.category || '').replace(/"/g,'""') + '"',
      b.amount,
      b.period || ''
    ].join(','));
    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="budgets.csv"');
    res.send(csv);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// Create a new budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    const newBudget = new Budget({
      user: req.user.id,
      category,
      amount,
      period
    });
    const budget = await newBudget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Update a budget
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ msg: 'Budget not found' });
    if (budget.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
    
    budget.category = category || budget.category;
    budget.amount = amount || budget.amount;
    budget.period = period || budget.period;
    
    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ msg: 'Budget not found' });
    if (budget.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
    
    await budget.remove();
    res.json({ msg: 'Budget removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
