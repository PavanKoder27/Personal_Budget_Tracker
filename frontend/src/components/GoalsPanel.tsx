import React, { useEffect, useState } from 'react';
import { Goal } from '../types';
import api from '../services/api';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button, LinearProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Tooltip, Fade
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import dayjs from 'dayjs';

interface GoalFormState {
  _id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  deadline?: string;
  notes?: string;
}

const emptyGoal: GoalFormState = { name: '', targetAmount: 0, currentAmount: 0 };

const categories = [
  'Emergency Fund','Travel','Education','Investment','Health','Gadgets','Gift','Other'
];

const GoalsPanel: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<GoalFormState>(emptyGoal);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
  const res = await api.get('/goals');
  setGoals((res.data as Goal[]) || []);
    } catch (e) {
      console.error('Failed loading goals', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyGoal); setFormOpen(true); };
  const openEdit = (g: Goal) => { setForm({ ...g, deadline: g.deadline ? g.deadline.split('T')[0] : undefined }); setFormOpen(true); };

  const save = async () => {
    if (!form.name || form.targetAmount <= 0) return;
    setSaving(true);
    try {
      if (form._id) {
        await api.put(`/goals/${form._id}`, form);
      } else {
        await api.post('/goals', form);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      console.error('Save goal failed', e);
    } finally { setSaving(false); }
  };

  const del = async (g: Goal) => {
    if (!g._id) return;
    if (!window.confirm(`Delete goal "${g.name}"?`)) return;
    try {
      await api.delete(`/goals/${g._id}`);
      await load();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const progressPct = (g: Goal) => g.targetAmount ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
  const remaining = (g: Goal) => Math.max(0, g.targetAmount - g.currentAmount);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          🎯 Savings Goals
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={openNew} sx={{ borderRadius: 3 }}>
          New Goal
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        {goals.map(goal => {
          const pct = progressPct(goal);
          const urgent = goal.deadline && dayjs(goal.deadline).diff(dayjs(), 'day') <= 14 && remaining(goal) > 0;
          return (
            <Grid item xs={12} sm={6} md={4} key={goal._id}>
              <Fade in timeout={600}>
                <Card elevation={4} sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 4,
                  background: 'linear-gradient(145deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                  backdropFilter: 'blur(6px)',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: pct >= 100 ? 'linear-gradient(135deg,#10b98155,#34d39933)' : 'linear-gradient(135deg,#6366f155,#8b5cf633)',
                    opacity: 0.35
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                        {goal.name}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit"><IconButton onClick={() => openEdit(goal)} size="small"><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton onClick={() => del(goal)} size="small"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                      Target: {goal.targetAmount.toLocaleString()} • Saved: {goal.currentAmount.toLocaleString()} • Left: {remaining(goal).toLocaleString()}
                    </Typography>
                    <LinearProgress variant="determinate" value={pct} sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 1.5,
                      background: 'rgba(255,255,255,0.15)',
                      '& .MuiLinearProgress-bar': {
                        background: pct >= 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                      }
                    }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight={600}>{pct.toFixed(1)}%</Typography>
                      {goal.deadline && (
                        <Typography variant="caption" color={urgent ? 'error' : 'text.secondary'}>
                          {dayjs(goal.deadline).format('MMM D, YYYY')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  {goal.notes && (
                    <Box sx={{ px: 2.5, pb: 2 }}>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>{goal.notes}</Typography>
                    </Box>
                  )}
                  {pct >= 100 && (
                    <Box sx={{ position: 'absolute', top: 8, right: -28, transform: 'rotate(35deg)' }}>
                      <Typography fontWeight={700} sx={{ color: '#10b981', textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>Achieved ✅</Typography>
                    </Box>
                  )}
                  {urgent && pct < 100 && (
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <Typography fontSize={12} fontWeight={700} color="warning.main">⚠️ Urgent</Typography>
                    </Box>
                  )}
                  <CardActions sx={{ justifyContent: 'space-between', px: 2.5, pb: 2 }}>
                    <Button size="small" onClick={() => openEdit(goal)}>Update</Button>
                    {pct < 100 && (
                      <Button size="small" onClick={() => openEdit({ ...goal })}>
                        Add Funds
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          );
        })}
        {!loading && goals.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6, opacity: 0.8 }}>
              <Typography variant="h6" gutterBottom>No goals yet</Typography>
              <Typography variant="body2">Create your first savings goal to start tracking progress.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form._id ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth margin="normal" label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <TextField fullWidth margin="normal" type="number" label="Target Amount" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: parseFloat(e.target.value) || 0 }))} />
          <TextField fullWidth margin="normal" type="number" label="Current Amount" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: parseFloat(e.target.value) || 0 }))} />
          <TextField select fullWidth margin="normal" label="Category" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value || undefined }))}>
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField fullWidth margin="normal" type="date" label="Deadline" InputLabelProps={{ shrink: true }} value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value || undefined }))} />
          <TextField fullWidth margin="normal" label="Notes" multiline rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name || form.targetAmount <= 0} variant="contained">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsPanel;
