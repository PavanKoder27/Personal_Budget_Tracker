const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const Stats = require('../models/Stats');

const router = express.Router();

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, q } = req.query;

    let filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (q) {
      try {
        filter.description = new RegExp(q, 'i');
      } catch (_) {
        // fallback: ignore invalid regex patterns
      }
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create transaction
router.post('/', auth, async (req, res) => {
  try {
    const body = req.body;
    const transaction = new Transaction({ ...body, user: req.user._id });
    // Anomaly detection only for expenses ≥ minimal threshold
    if (transaction.type === 'expense' && transaction.amount > 0) {
      const stat = await Stats.findOneAndUpdate(
        { user: req.user._id, category: transaction.category, type: transaction.type },
        {},
        { upsert: true, new: true }
      );
      // Welford update
      let { count, mean, M2 } = stat;
      const x = transaction.amount;
      const prevMean = mean;
      count += 1;
      mean += (x - mean) / count;
      M2 += (x - prevMean) * (x - mean);
      stat.count = count; stat.mean = mean; stat.M2 = M2; stat.lastAmount = x; stat.updatedAt = new Date();
      // Compute std dev if count >1
      let std = 0;
      if (count > 1) std = Math.sqrt(M2 / count);
      const threshold = mean + 2 * std;
      if (count > 5 && x > threshold) {
        transaction.anomaly.isAnomaly = true;
        transaction.anomaly.score = std ? (x - mean) / std : 0;
        transaction.anomaly.reason = `Amount ${x} exceeds mean (${mean.toFixed(2)}) + 2σ (${std.toFixed(2)})`;
      }
      await stat.save();
    }
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Recent anomalies endpoint
router.get('/anomalies', auth, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30*24*60*60*1000); // last 30 days
    const anomalies = await Transaction.find({ user: req.user._id, 'anomaly.isAnomaly': true, date: { $gte: since } })
      .sort({ date: -1 })
      .limit(50);
    res.json(anomalies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Transaction.distinct('category', { user: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
    
    res.json({
      income,
      expenses,
      savings: income - expenses,
      categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export transactions (CSV or JSON)
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'csv', type, category, startDate, endDate } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const list = await Transaction.find(filter).sort({ date: -1 });
    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.json"');
      return res.json(list);
    }
    // CSV
    const header = 'date,type,category,description,amount\n';
    const rows = list.map(t => [
      new Date(t.date).toISOString(),
      t.type,
      '"' + (t.category || '').replace(/"/g,'""') + '"',
      '"' + (t.description || '').replace(/"/g,'""') + '"',
      t.amount
    ].join(','));
    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
