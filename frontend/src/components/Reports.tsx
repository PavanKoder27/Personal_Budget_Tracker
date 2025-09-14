import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Paper, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, LinearProgress, Fade, Collapse, Chip, TextField, Divider } from '@mui/material';
import PageHeading from './shared/PageHeading';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import api from '../services/api';
import AnimatedButton from './shared/AnimatedButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, ChartTooltip, Legend);

interface Summary { income: number; expenses: number; savings: number; categoryBreakdown: Record<string, number>; }
interface BudgetStatusItem { category: string; budget: number; spent: number; remaining: number; percentage: number; }
interface CategoryRow extends BudgetStatusItem { share: number; overBudget?: boolean; fastGrowth?: boolean; underUtilized?: boolean; suggestion?: string; projected?: number; projectedOver?: boolean; }

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [view, setView] = useState<'pie' | 'bar' | 'line'>('pie');
  const [tab, setTab] = useState<'charts' | 'categories' | 'insights'>('charts');
  const [insightMetrics, setInsightMetrics] = useState<any>(null);
  const [habitTips, setHabitTips] = useState<string[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusItem[]>([]);
  const [editingBudgetCat, setEditingBudgetCat] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState<number>(0);
  const [savingInsights, setSavingInsights] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchSummary = async () => {
    try { const res = await api.get<Summary>(`/transactions/summary?month=${month}&year=${year}`); setSummary(res.data);} catch(e){console.error(e);} };
  const fetchBudgetStatus = async () => {
    setLoadingBudgets(true);
    try { const res = await api.get<BudgetStatusItem[]>(`/budget/status?month=${month}&year=${year}`); setBudgetStatus(res.data);} catch(e){ console.error(e);} finally { setLoadingBudgets(false);} };
  const fetchMonthTransactions = async () => {
    setLoadingTx(true);
    try {
      const startDate = new Date(year, month-1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23,59,59,999).toISOString();
      const res = await api.get<any[]>(`/transactions?startDate=${startDate}&endDate=${endDate}`);
      setTransactions(res.data.filter(t=> t.type==='expense'));
    } catch(e){ console.error(e);} finally { setLoadingTx(false);} };

  useEffect(()=>{ fetchSummary(); fetchBudgetStatus(); fetchMonthTransactions(); }, [month, year]);

  // Derived category rows merging budgets + summary share
  const categoryRows: CategoryRow[] = useMemo(()=>{
    if(!summary) return [];
    const totalExpenses = summary.expenses || 1;
    const txByCat: Record<string, number> = { ...summary.categoryBreakdown };
    // ensure any budget category appears even if no spending
    budgetStatus.forEach(b=> { if(!(b.category in txByCat)) txByCat[b.category]=0; });
    const growthMap: Record<string, boolean> = {}; // placeholder for fast growth detection (simple – >130% of average of month subset of transactions weeks)
    // simple growth heuristic: if a category > 50% of its budget by first 40% of month days
    const today = new Date();
    const inTargetMonth = today.getMonth()+1 === month && today.getFullYear() === year;
    const day = inTargetMonth ? today.getDate() : new Date(year, month, 0).getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    const progressPoint = day / daysInMonth;
    const rows = Object.keys(txByCat).map(cat => {
      const spent = txByCat[cat];
      const budgetEnt = budgetStatus.find(b=> b.category===cat);
      const budget = budgetEnt?.budget || 0;
      const percentage = budget ? (spent / budget) * 100 : 0;
      const remaining = budget ? budget - spent : 0;
      const overBudget = budget>0 && spent > budget;
      const underUtilized = budget>0 && progressPoint>0.5 && percentage < 35; // behind pace
      const fastGrowth = budget>0 && progressPoint<0.4 && percentage>55; // early burn
      // Projection based on linear pace (spent so far / elapsed days * total days)
      const projected = progressPoint>0 ? spent / progressPoint : spent;
      const projectedOver = budget>0 && projected > budget;
      let suggestion='';
      if(overBudget) suggestion = `Reduce ${cat} discretionary spend by 10% next week to realign.`;
      else if(fastGrowth) suggestion = `Spending in ${cat} is front-loaded. Consider pausing non-essential purchases.`;
      else if(underUtilized) suggestion = `You're under budget in ${cat}. Optionally reallocate some funds elsewhere or save them.`;
      else if(projectedOver) suggestion = `On track to exceed budget in ${cat}. Target daily spend ≤ ₹${budget/daysInMonth | 0}.`;
      return { category: cat, budget, spent, remaining, percentage, share: spent/totalExpenses*100, overBudget, underUtilized, fastGrowth, suggestion, projected, projectedOver };
    });
    return rows.sort((a,b)=> b.spent - a.spent);
  }, [summary, budgetStatus, month, year]);

  useEffect(()=>{
    if(!summary) { setSavingInsights(''); return; }
    if(!categoryRows.length){ setSavingInsights('No expenses for this period. Start tracking to get personalized tips.'); return; }
    const top = categoryRows.slice(0,3);
    const overs = categoryRows.filter(r=> r.overBudget);
    const early = categoryRows.filter(r=> r.fastGrowth);
    const under = categoryRows.filter(r=> r.underUtilized);
    const lines: string[] = [];
    lines.push(`Total savings this month: ₹${(summary.income - summary.expenses).toLocaleString()}.`);
    if(top.length){
      lines.push(`Top categories: ${top.map(t=> `${t.category} (${t.share.toFixed(1)}%)`).join(', ')}.`);
    }
  if(overs.length) lines.push(`Over budget now: ${overs.map(o=> o.category).join(', ')} — trim these first.`);
  const projectedOvers = categoryRows.filter(r=> !r.overBudget && r.projectedOver);
  if(projectedOvers.length) lines.push(`Projected to exceed budget: ${projectedOvers.map(p=> p.category).join(', ')} (act early).`);
    if(early.length) lines.push(`Early spend spike: ${early.map(o=> o.category).join(', ')}; slow down to avoid end-of-month squeeze.`);
    if(under.length) lines.push(`Under budget: ${under.map(o=> o.category).join(', ')}; potential to reallocate or boost savings.`);
    const potential = top[0];
    if(potential) {
      const save10 = potential.spent * 0.10;
      lines.push(`Cutting 10% from ${potential.category} could free about ₹${save10.toFixed(0)} for savings.`);
    }
    setSavingInsights(lines.join(' '));
  }, [categoryRows, summary]);

  // Compute broader insight metrics
  useEffect(()=>{
    if(!summary) { setInsightMetrics(null); setHabitTips([]); return; }
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyBurn = summary.expenses / daysInMonth;
    const savingsRate = summary.income ? (summary.savings / summary.income) * 100 : 0;
    const peakCategory = categoryRows[0] ? { category: categoryRows[0].category, share: categoryRows[0].share } : null;
    const discretionaryKeywords = ['food','eat','dining','restaurant','entertain','travel','shopping','tickets','entertainment'];
    let discretionaryTotal = 0;
    categoryRows.forEach(r=>{ if(discretionaryKeywords.some(k=> r.category.toLowerCase().includes(k))) discretionaryTotal += r.spent; });
    const discretionaryShare = summary.expenses? (discretionaryTotal / summary.expenses) *100 : 0;
    // weekend share based on transactions list
    let weekendTotal = 0; transactions.forEach(t=> { const d=new Date(t.date); const day=d.getDay(); if(day===0||day===6) weekendTotal += t.amount; });
    const weekendShare = summary.expenses? (weekendTotal / summary.expenses) *100 : 0;
    const overspendingCategories = categoryRows.filter(r=> r.overBudget).map(r=> r.category);
  const projectedOvers = categoryRows.filter(r=> r.projectedOver).map(r=> r.category);
  setInsightMetrics({ dailyBurn, savingsRate, peakCategory, discretionaryShare, weekendShare, overspendingCategories, projectedOvers });

    // Habit tips
    const tips: string[] = [];
    if(savingsRate < 10) tips.push('Aim to raise your savings rate above 10% by trimming non-essential categories.');
    if(discretionaryShare > 55) tips.push('Discretionary spending exceeds 55% of expenses; set micro-limits for top fun categories.');
    if(weekendShare > 50) tips.push('Over half of spending happens on weekends—plan a capped weekend budget.');
  if(overspendingCategories.length) tips.push(`Rebalance budgets: ${overspendingCategories.join(', ')} already over limits.`);
  if(categoryRows.some(r=> r.projectedOver && !r.overBudget)) tips.push('Act now on categories projected to exceed budgets before they actually do.');
    if(dailyBurn && summary.income && (dailyBurn*daysInMonth) > summary.income) tips.push('Monthly burn rate is on track to exceed income—freeze variable spend for a few days.');
    if(!tips.length) tips.push('Great job! Your spending pattern is balanced. Maintain by reviewing budgets weekly.');
    setHabitTips(tips);
  }, [summary, categoryRows, transactions, month, year]);

  const beginEdit = (cat: string, current: number) => { setEditingBudgetCat(cat); setBudgetDraft(current || 0); };
  const saveBudget = async (cat: string) => {
    try {
      await api.post('/budget', { category: cat, amount: budgetDraft, month, year });
      setEditingBudgetCat(null); fetchBudgetStatus();
    } catch(e){ console.error(e); }
  };

  const gradientFor = (r: CategoryRow) => {
    if(r.overBudget) return 'linear-gradient(90deg,#dc2626,#ef4444)';
    if(r.fastGrowth) return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    if(r.underUtilized) return 'linear-gradient(90deg,#2563eb,#3b82f6)';
    return 'linear-gradient(90deg,#6366f1,#8b5cf6)';
  };

  const labels = summary ? Object.keys(summary.categoryBreakdown) : [];
  const values = summary ? Object.values(summary.categoryBreakdown) : [];

  const pieData = { labels, datasets:[{ data: values, backgroundColor: labels.map((_,i)=>`hsl(${i*55%360} 70% 55%)`), borderColor:'#fff', borderWidth:2 }] };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 18, padding: 12 } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ₹${ctx.parsed.toLocaleString()}` } }
    },
    layout: { padding: 8 }
  } as const;
  const barData = { labels, datasets:[{ label:'Expenses', data: values, backgroundColor:'linear-gradient(90deg,#6366f1,#8b5cf6)' }] } as any;
  const lineData = { labels, datasets:[{ label:'Expenses Trend', data: values, fill:false, tension:.4, borderColor:'#6366f1', pointBackgroundColor:'#8b5cf6' }] };

  return (
    <Box sx={{ ml: { md: -0.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <PageHeading emoji="📈" title="Reports & Insights" />
        <ToggleButtonGroup exclusive value={view} onChange={(_,v)=> v && setView(v)} size="small" color="primary">
          <ToggleButton value="pie">Pie</ToggleButton>
          <ToggleButton value="bar">Bar</ToggleButton>
          <ToggleButton value="line">Line</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Tabs value={tab} onChange={(_,v)=> setTab(v)} sx={{ mb:2 }}>
        <Tab value="charts" label="Charts" />
        <Tab value="categories" label="Categories & Budgets" />
        <Tab value="insights" label="Insights" />
      </Tabs>

      {tab==='charts' && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={9} md={8.5}>
            <Paper sx={{ p:3, borderRadius:4, height:440, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
              {summary && view==='pie' && (
                <Box sx={{ flex:1, position:'relative' }}>
                  <Box sx={{ position:'absolute', inset:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Box sx={{ width:'100%', maxWidth:380, height:'100%', maxHeight:360 }}>
                      <Pie data={pieData} options={pieOptions} />
                    </Box>
                  </Box>
                </Box>
              )}
              {summary && view==='bar' && <Bar data={barData} options={{responsive:true, maintainAspectRatio:false}} />}
              {summary && view==='line' && <Line data={lineData} options={{responsive:true, maintainAspectRatio:false}} />}
              {!summary && <Typography>Loading...</Typography>}
            </Paper>
          </Grid>
          <Grid item xs={12} lg={3} md={3.5}>
            <Paper sx={{ p:3, borderRadius:4, mb:3, height: 180, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Summary</Typography>
              <Typography variant="body2">Income: ₹{summary?.income.toLocaleString()}</Typography>
              <Typography variant="body2">Expenses: ₹{summary?.expenses.toLocaleString()}</Typography>
              <Typography variant="body2" fontWeight={600}>Savings: ₹{summary?.savings.toLocaleString()}</Typography>
            </Paper>
            <Paper sx={{ p:3, borderRadius:4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Filters</Typography>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Month</InputLabel>
                <Select value={month} label="Month" onChange={e=>setMonth(Number(e.target.value))}>{Array.from({length:12}).map((_,i)=><MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>)}</Select>
              </FormControl>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Year</InputLabel>
                <Select value={year} label="Year" onChange={e=>setYear(Number(e.target.value))}>{[year-1,year,year+1].map(y=> <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select>
              </FormControl>
              <AnimatedButton onClick={()=>{ fetchSummary(); fetchBudgetStatus(); fetchMonthTransactions(); }} sx={{ mt:1 }}>Refresh</AnimatedButton>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab==='categories' && (
        <Fade in timeout={500}>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p:3, borderRadius:4 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Category Budgets & Spend</Typography>
                  {!categoryRows.length && <Typography variant="body2" color="text.secondary">No spending data yet.</Typography>}
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
                    {categoryRows.map(r=>{
                      const editing = editingBudgetCat===r.category;
                      return (
                        <Collapse key={r.category} in timeout={400}>
                          <Paper elevation={0} sx={{ p:2, borderRadius:3, background:'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', backdropFilter:'blur(4px)', position:'relative', overflow:'hidden' }}>
                            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                              <Typography fontWeight={600}>{r.category}</Typography>
                              <Box display='flex' gap={1} flexWrap='wrap'>
                                {r.overBudget && <Chip size='small' color='error' label='Over Budget' />}
                                {r.fastGrowth && <Chip size='small' color='warning' label='Fast Growth' />}
                                {r.underUtilized && <Chip size='small' color='info' label='Under Used' />}
                              </Box>
                            </Box>
                            <Box display='flex' alignItems='center' gap={2}>
                              <Box flexGrow={1}>
                                <LinearProgress variant='determinate' value={Math.min(100, r.budget? (r.spent/r.budget*100): 0)} sx={{ height:10, borderRadius:5, '& .MuiLinearProgress-bar':{ background: gradientFor(r) } }} />
                              </Box>
                              <Typography variant='caption' sx={{ width:110, textAlign:'right' }}>₹{r.spent.toFixed(0)} / {r.budget? `₹${r.budget.toFixed(0)}`:'—'}</Typography>
                            </Box>
                            <Box display='flex' justifyContent='space-between' mt={1} alignItems='center' flexWrap='wrap' gap={1}>
                              <Typography variant='caption' color='text.secondary'>Share {r.share.toFixed(1)}% {r.budget? `• ${r.percentage.toFixed(0)}% of budget`: ''}</Typography>
                              {r.budget>0 && (
                                <Typography variant='caption' color={r.projectedOver? 'error.main':'text.secondary'}>
                                  {(() => { const pj = r.projected ?? r.spent; return `Projected: ₹${pj.toFixed(0)} ${r.projectedOver ? `(≈ +₹${(pj - r.budget).toFixed(0)} over)` : ''}`; })()}
                                </Typography>
                              )}
                              {editing ? (
                                <Box display='flex' gap={1} alignItems='center'>
                                  <TextField size='small' type='number' value={budgetDraft} onChange={e=>setBudgetDraft(Number(e.target.value))} sx={{ width:100 }} />
                                  <AnimatedButton size='small' onClick={()=> saveBudget(r.category)}>Save</AnimatedButton>
                                  <AnimatedButton size='small' color='inherit' onClick={()=> setEditingBudgetCat(null)}>Cancel</AnimatedButton>
                                </Box>
                              ) : (
                                <AnimatedButton size='small' onClick={()=> beginEdit(r.category, r.budget)}> {r.budget? 'Edit Budget':'Add Budget'} </AnimatedButton>
                              )}
                            </Box>
                            {r.suggestion && <Typography variant='caption' sx={{ display:'block', mt:0.5 }} color='text.secondary'>{r.suggestion}</Typography>}
                          </Paper>
                        </Collapse>
                      );
                    })}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p:3, borderRadius:4, mb:3 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>Spending Coach</Typography>
                  <Typography variant='body2' sx={{ whiteSpace:'pre-line' }}>{savingInsights}</Typography>
                </Paper>
                <Paper sx={{ p:3, borderRadius:4, mb:3 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>Projection</Typography>
                  {(() => {
                    const totalBudget = categoryRows.reduce((s,c)=> s + (c.budget||0), 0);
                    const totalSpent = categoryRows.reduce((s,c)=> s + c.spent, 0);
                    const anyBudget = totalBudget>0;
                    const today = new Date();
                    const inTargetMonth = today.getMonth()+1 === month && today.getFullYear() === year;
                    const day = inTargetMonth ? today.getDate() : new Date(year, month, 0).getDate();
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const progressPoint = day / daysInMonth;
                    const projectedTotal = progressPoint>0? totalSpent / progressPoint : totalSpent;
                    const diff = anyBudget? projectedTotal - totalBudget : 0;
                    return (
                      <Box>
                        <Typography variant='body2'>Projected Month Spend: <strong>₹{projectedTotal.toFixed(0)}</strong></Typography>
                        {anyBudget && <Typography variant='body2'>Total Budgets: <strong>₹{totalBudget.toFixed(0)}</strong></Typography>}
                        {anyBudget && <Typography variant='caption' color={diff>0? 'error.main':'success.main'}>
                          {diff>0? `On pace to exceed by ₹${diff.toFixed(0)}` : `On pace to save ₹${Math.abs(diff).toFixed(0)}`}
                        </Typography>}
                        {!anyBudget && <Typography variant='caption' color='text.secondary'>Set budgets to enable overrun projections.</Typography>}
                      </Box>
                    );
                  })()}
                </Paper>
                <Paper sx={{ p:3, borderRadius:4 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>Actions</Typography>
                  <Typography variant='caption' color='text.secondary'>Refine budgets as your month progresses.</Typography>
                  <Divider sx={{ my:1 }} />
                  <AnimatedButton size='small' onClick={()=> categoryRows.forEach(r=> { if(!r.budget) beginEdit(r.category,0); })}>Add Budgets For All</AnimatedButton>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {tab==='insights' && (
        <Fade in timeout={400}>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p:3, borderRadius:4, mb:3 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>Monthly Financial Summary</Typography>
                  {!summary && <Typography variant='body2'>Loading...</Typography>}
                  {summary && (
                    <Box display='flex' flexDirection='column' gap={1.2}>
                      <Typography variant='body2'>Savings Rate: <strong>{insightMetrics?.savingsRate.toFixed(1)}%</strong></Typography>
                      <Typography variant='body2'>Daily Burn (avg): <strong>₹{insightMetrics?.dailyBurn.toFixed(0)}</strong></Typography>
                      <Typography variant='body2'>Peak Category Share: <strong>{insightMetrics?.peakCategory?.category} {insightMetrics?.peakCategory?.share.toFixed(1)}%</strong></Typography>
                      <Typography variant='body2'>Discretionary Share: <strong>{insightMetrics?.discretionaryShare.toFixed(1)}%</strong></Typography>
                      <Typography variant='body2'>Weekend Spend Share: <strong>{insightMetrics?.weekendShare.toFixed(1)}%</strong></Typography>
                      {insightMetrics?.overspendingCategories.length>0 && (
                        <Typography variant='body2' color='error'>Overspending Alerts: {insightMetrics.overspendingCategories.join(', ')}</Typography>
                      )}
                    </Box>
                  )}
                </Paper>
                <Paper sx={{ p:3, borderRadius:4 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>Smart Habit Suggestions</Typography>
                  {!habitTips.length && <Typography variant='body2' color='text.secondary'>Not enough data yet for suggestions.</Typography>}
                  <Box component='ul' sx={{ m:0, pl:3 }}>
                    {habitTips.map((t,i)=>(<Fade in key={t} style={{ transitionDelay: `${i*60}ms` }}><li><Typography variant='body2'>{t}</Typography></li></Fade>))}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p:3, borderRadius:4, mb:3 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>At a Glance</Typography>
                  <Box display='flex' flexWrap='wrap' gap={1}>
                    {insightMetrics && ['savingsRate','dailyBurn','discretionaryShare','weekendShare'].map(key=> (
                      <Chip key={key} label={`${key.replace(/([A-Z])/g,' $1')}: ${ typeof insightMetrics[key]==='number'? insightMetrics[key].toFixed(1): insightMetrics[key] }${key.includes('Rate')|| key.includes('Share')? '%':''}`} color='primary' variant='outlined' />
                    ))}
                  </Box>
                </Paper>
                <Paper sx={{ p:3, borderRadius:4 }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom>Data Refresh</Typography>
                  <Typography variant='caption' color='text.secondary' display='block'>Insights recalc each time you change filters.</Typography>
                  <AnimatedButton size='small' sx={{ mt:1 }} onClick={()=>{ fetchSummary(); fetchBudgetStatus(); fetchMonthTransactions(); }}>Recalculate</AnimatedButton>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default Reports;
