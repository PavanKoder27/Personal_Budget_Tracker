const express = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

const router = express.Router();

// List goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create goal
router.post('/', auth, async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, category, deadline, notes } = req.body;
    if (!name || targetAmount == null) {
      return res.status(400).json({ message: 'Name and targetAmount required' });
    }
    const goal = await Goal.create({ user: req.user._id, name, targetAmount, currentAmount, category, deadline, notes });
    res.status(201).json(goal);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Goal name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
