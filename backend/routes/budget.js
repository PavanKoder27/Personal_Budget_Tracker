const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Get budgets
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const budgets = await Budget.find({
      user: req.user._id,
      month: targetMonth,
      year: targetYear
    });
    
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create/Update budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;
    
    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        category,
        month,
        year
      },
      { amount },
      { upsert: true, new: true }
    );
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get budget status
router.get('/status', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    const budgets = await Budget.find({
      user: req.user._id,
      month: targetMonth,
      year: targetYear
    });
    
    const expenses = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    });
    
    const categorySpending = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    const budgetStatus = budgets.map(budget => ({
      category: budget.category,
      budget: budget.amount,
      spent: categorySpending[budget.category] || 0,
      remaining: budget.amount - (categorySpending[budget.category] || 0),
      percentage: ((categorySpending[budget.category] || 0) / budget.amount) * 100
    }));
    
    res.json(budgetStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
