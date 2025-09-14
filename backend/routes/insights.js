const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const { Group, GroupExpense } = require('../models/Group');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: recent months expenses grouped
async function getRecentMonthlyExpenses(userId, months = 3){
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months-1), 1);
  const tx = await Transaction.find({ user: userId, type: 'expense', date: { $gte: start } });
  const byMonth = {};
  tx.forEach(t => {
    const k = `${t.date.getFullYear()}-${t.date.getMonth()+1}`;
    byMonth[k] = (byMonth[k] || 0) + t.amount;
  });
  return Object.values(byMonth);
}

router.get('/health', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const month = now.getMonth()+1; const year = now.getFullYear();
    const monthStart = new Date(year, month-1, 1); const monthEnd = new Date(year, month, 0);

    const tx = await Transaction.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } });
    let income = 0, expense = 0; const catExpense = {};
    tx.forEach(t=> { if(t.type==='income') income += t.amount; else { expense += t.amount; catExpense[t.category] = (catExpense[t.category]||0)+t.amount; } });

    // Savings Rate
    const savings = income - expense;
    const savingsRate = income > 0 ? savings / income : 0;

    // Budget adherence
    const budgets = await Budget.find({ user: userId, month, year });
    let underOrOn = 0; let totalBudgets = budgets.length; let discretionaryTotal = 0;
    budgets.forEach(b => {
      const spent = catExpense[b.category] || 0;
      if (spent <= b.amount) underOrOn++;
    });
    const budgetAdherence = totalBudgets ? underOrOn / totalBudgets : 0;

    // Volatility inverse (lower std dev => higher score)
    const monthsArr = await getRecentMonthlyExpenses(userId, 3);
    let volatilityScore = 1; // default high if insufficient data
    if(monthsArr.length >= 2){
      const avg = monthsArr.reduce((a,b)=>a+b,0)/monthsArr.length;
      const variance = monthsArr.reduce((a,b)=> a + Math.pow(b-avg,2), 0) / monthsArr.length;
      const std = Math.sqrt(variance);
      volatilityScore = avg > 0 ? 1 - Math.min(std/avg, 1) : 1; // clamp
    }

    // Discretionary ratio (approx: categories not essentials) simple heuristic
    const essentialCats = ['Bills & Utilities','Healthcare','Education'];
    let discretionary = 0; let totalExp = 0;
    Object.entries(catExpense).forEach(([cat,amt])=> { totalExp += amt; if(!essentialCats.includes(cat)) discretionary += amt; });
    const discretionaryRatio = totalExp>0 ? discretionary/totalExp : 0;

    // Composite weighting
    const components = [
      { key: 'savingsRate', value: savingsRate, weight: 0.35 },
      { key: 'budgetAdherence', value: budgetAdherence, weight: 0.25 },
      { key: 'volatilityInverse', value: volatilityScore, weight: 0.20 },
      { key: 'discretionaryBalance', value: 1 - discretionaryRatio, weight: 0.20 }
    ];
    const score = components.reduce((s,c)=> s + (c.value * c.weight), 0);

    const recommendations = [];
    if (savingsRate < 0.1) recommendations.push('Increase savings rate above 10% by reducing discretionary outflows.');
    if (budgetAdherence < 0.6) recommendations.push('Review categories exceeding budgets and adjust targets or spending.');
    if (volatilityScore < 0.5) recommendations.push('Stabilize monthly expenses; consider smoothing large one-off costs.');
    if (discretionaryRatio > 0.55) recommendations.push('Discretionary spending above 55% of total – set a cap.');

    res.json({ score: Number(score.toFixed(3)), components, recommendations });
  } catch(err){
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/checklist', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const txCount = await Transaction.countDocuments({ user: userId });
    const budgetCount = await Budget.countDocuments({ user: userId });
    const goalCount = await Goal.countDocuments({ user: userId });
    const groups = await Group.find({ 'members.user': userId });
    const groupCount = groups.length;
    const invitedMember = groups.some(g => g.members.some(m => m.isPlaceholder));

    const tasks = [
      { key: 'addedFirstTransaction', done: txCount > 0 },
      { key: 'createdBudget', done: budgetCount > 0 },
      { key: 'createdGoal', done: goalCount > 0 },
      { key: 'createdGroup', done: groupCount > 0 },
      { key: 'invitedMember', done: invitedMember }
    ];
    const completed = tasks.filter(t=>t.done).length;
    const progress = tasks.length ? completed / tasks.length : 0;
    res.json({ tasks, progress });
  } catch(err){
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
