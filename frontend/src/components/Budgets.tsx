import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, ButtonGroup, Button, Skeleton } from '@mui/material';
import PageHeading from './shared/PageHeading';
import AnimatedButton from './shared/AnimatedButton';
import api from '../services/api';
import { Budget, BudgetStatusItem } from '../types';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EmptyState from './shared/EmptyState';

const categories = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Salary', 'Investment', 'Other'
];

const Budgets: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [status, setStatus] = useState<BudgetStatusItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Budget>({ category: '', amount: 0, month, year });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get<BudgetStatusItem[]>('/budgets/status');
      setStatus(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSubmit = async () => {
    if (!form.category || !form.amount) return;
    setLoading(true);
    try {
      await api.post('/budgets', form);
      setOpen(false);
      setForm({ category: '', amount: 0, month, year });
      fetchStatus();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <PageHeading emoji="📊" title="Budgets" />
        <Box display="flex" gap={1} alignItems="center">
          <AnimatedButton startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add / Update Budget</AnimatedButton>
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={()=> window.open('/api/budgets/export?format=csv','_blank')}>CSV</Button>
            <Button onClick={()=> window.open('/api/budgets/export?format=json','_blank')}>JSON</Button>
          </ButtonGroup>
        </Box>
      </Box>
      <Grid container spacing={3}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Skeleton variant="text" width={180} height={28} />
                <Skeleton variant="text" width={260} height={20} />
                <Skeleton variant="rectangular" height={12} sx={{ borderRadius: 6, my: 1 }} />
                <Skeleton variant="text" width={180} height={16} />
              </Paper>
            </Grid>
          ))
        ) : status.length === 0 ? (
          <Grid item xs={12}>
            <EmptyState
              emoji="📊"
              title="No budgets set for this month"
              description="Create category-wise budgets to track your spending against targets."
              actionText="Add Budget"
              onAction={() => setOpen(true)}
            />
          </Grid>
        ) : (
        status.map(item => {
          const pct = Math.min(100, Math.round(item.percentage));
          const over = pct >= 100;
          return (
            <Grid item xs={12} md={6} lg={4} key={item.category}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 4, position:'relative', overflow:'hidden', background: darkMode ? 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(51,65,85,0.85))' : 'linear-gradient(135deg,#ffffff,#f1f5f9)', backdropFilter:'blur(12px)' }}>
                <Typography variant="h6" fontWeight={600} mb={1}>{item.category}</Typography>
                <Typography variant="body2" mb={1} color="text.secondary">Budget: ₹{item.budget.toLocaleString()} | Spent: ₹{item.spent.toLocaleString()}</Typography>
                <LinearProgress variant="determinate" value={pct} sx={{ height:10, borderRadius:5, mb:1, background: over ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { background: over ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)' } }} />
                <Typography variant="caption" fontWeight={500} color={over ? 'error.main' : 'text.secondary'}>
                  {over ? 'Overspent!' : `${pct}% used · Remaining ₹${item.remaining.toLocaleString()}`}
                </Typography>
              </Paper>
            </Grid>
          );
        }))
        }
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight:700, display:'flex', alignItems:'center', justifyContent:'space-between' }}>Set Budget <IconButton onClick={()=>setOpen(false)}><CloseIcon/></IconButton></DialogTitle>
        <DialogContent dividers>
          <TextField select label="Category" fullWidth margin="normal" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            {categories.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField type="number" label="Amount" fullWidth margin="normal" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} />
        </DialogContent>
        <DialogActions sx={{ p:2.5 }}>
          <AnimatedButton onClick={()=>setOpen(false)} color="inherit">Cancel</AnimatedButton>
          <AnimatedButton onClick={handleSubmit} disabled={loading}>{loading? 'Saving...' : 'Save Budget'}</AnimatedButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budgets;
