import React, { useState, ChangeEvent } from 'react';
import { TransactionFormProps, TransactionFormData } from '../types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  SelectChangeEvent,
  FormLabel,
  Box,
  Typography,
  Slide,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import api from '../services/api';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const categories = [
  { value: 'Food & Dining', emoji: '🍔', color: '#ef4444' },
  { value: 'Transportation', emoji: '🚗', color: '#3b82f6' },
  { value: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { value: 'Entertainment', emoji: '🎬', color: '#8b5cf6' },
  { value: 'Bills & Utilities', emoji: '📱', color: '#f59e0b' },
  { value: 'Healthcare', emoji: '🏥', color: '#10b981' },
  { value: 'Education', emoji: '📚', color: '#6366f1' },
  { value: 'Travel', emoji: '✈️', color: '#06b6d4' },
  { value: 'Income', emoji: '💰', color: '#10b981' },
  { value: 'Other', emoji: '📝', color: '#6b7280' },
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onClose,
  onSuccess,
  transaction,
}) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [formData, setFormData] = useState<TransactionFormData>(() => {
    const base: TransactionFormData = {
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isTemplate: false,
      recurrence: {
        active: false,
        frequency: 'monthly',
        interval: 1,
        occurrencesLeft: null,
        endDate: null,
      }
    };
    if (transaction) {
      return {
        ...base,
        ...transaction,
        isTemplate: transaction.isTemplate ?? false,
        recurrence: transaction.recurrence ? {
          active: !!transaction.recurrence.active,
          frequency: transaction.recurrence.frequency || 'monthly',
            interval: transaction.recurrence.interval || 1,
            occurrencesLeft: transaction.recurrence.occurrencesLeft ?? null,
            endDate: transaction.recurrence.endDate || null,
            nextRunAt: transaction.recurrence.nextRunAt,
        } : base.recurrence
      } as TransactionFormData;
    }
    return base;
  });

  const [showRecurrence, setShowRecurrence] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = { ...formData };
      // Derive nextRunAt from selected date if creating template & recurrence active
      if (payload.isTemplate && payload.recurrence?.active) {
        if (!payload.recurrence.nextRunAt) {
          payload.recurrence.nextRunAt = new Date(payload.date).toISOString();
        }
      } else {
        // If not a template, ensure flags reset
        payload.isTemplate = false;
        if (payload.recurrence) payload.recurrence.active = false;
      }
      if (transaction?._id) {
        await api.put(`/transactions/${transaction._id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof TransactionFormData) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    setFormData((prev: TransactionFormData) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const updateRecurrence = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...(prev.recurrence || { active: false, frequency: 'monthly', interval: 1 }),
        [field]: value,
      }
    }));
  };

  return (
    <>
      {/* Comprehensive 3D Floating Background Icons for Transaction Form */}
      {open && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1200, overflow: 'hidden' }}>
          {/* Food & Dining Icons */}
          <Box sx={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            fontSize: '2.8rem',
            color: 'rgba(251, 191, 36, 0.35)',
            filter: 'drop-shadow(0 0 18px rgba(251, 191, 36, 0.3))',
            textShadow: '0 0 35px rgba(251, 191, 36, 0.3)',
            '@keyframes floatFormFood': {
              '0%, 100%': {
                transform: 'rotateY(12deg) translateY(0px) translateX(0px)',
              },
              '50%': {
                transform: 'rotateY(-12deg) translateY(-15px) translateX(8px)',
              },
            },
            animation: 'floatFormFood 4.5s ease-in-out infinite',
          }}>
            🍕
          </Box>


          {/* Recurrence / Template Toggle */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Button
                variant={formData.isTemplate ? 'contained' : 'outlined'}
                color={formData.isTemplate ? 'primary' : 'inherit'}
                onClick={() => setFormData(prev => ({ ...prev, isTemplate: !prev.isTemplate }))}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: formData.isTemplate ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : undefined,
                  boxShadow: formData.isTemplate ? '0 8px 24px -4px rgba(99,102,241,0.4)' : undefined,
                }}
              >
                {formData.isTemplate ? '🧩 Template Enabled' : '🧩 Make This A Recurring Template'}
              </Button>
              {formData.isTemplate && (
                <Button
                  variant="text"
                  onClick={() => setShowRecurrence(p => !p)}
                  sx={{ fontWeight: 600 }}
                >
                  {showRecurrence ? 'Hide Recurrence Settings ▲' : 'Show Recurrence Settings ▼'}
                </Button>
              )}
            </Box>
            <Fade in={formData.isTemplate && showRecurrence} mountOnEnter unmountOnExit>
              <Box sx={{
                p: 2.5,
                mt: 1,
                borderRadius: 3,
                background: darkMode ? 'linear-gradient(135deg, rgba(51,65,85,0.55) 0%, rgba(30,41,59,0.55) 100%)' : 'linear-gradient(135deg,#f1f5f9 0%, #ffffff 70%)',
                border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(99,102,241,0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔁 Recurrence Pattern
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.recurrence?.frequency || 'monthly'}
                    label="Frequency"
                    onChange={(e) => updateRecurrence('frequency', e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="custom">Custom (Every N Days)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="number"
                  label={formData.recurrence?.frequency === 'custom' ? 'Every N Days' : 'Interval'}
                  value={formData.recurrence?.interval || 1}
                  onChange={(e) => updateRecurrence('interval', Math.max(1, parseInt(e.target.value)||1))}
                  sx={{ mb: 2 }}
                  InputProps={{ inputProps: { min: 1 } }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Occurrences (leave blank = infinite)"
                  value={formData.recurrence?.occurrencesLeft ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateRecurrence('occurrencesLeft', v === '' ? null : Math.max(1, parseInt(v)||1));
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="date"
                  label="End Date (optional)"
                  value={formData.recurrence?.endDate ? String(formData.recurrence.endDate).split('T')[0] : ''}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => updateRecurrence('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={<Radio checked={!!formData.recurrence?.active} onChange={() => updateRecurrence('active', true)} />}
                    label="Active"
                  />
                  <FormControlLabel
                    control={<Radio checked={!formData.recurrence?.active} onChange={() => updateRecurrence('active', false)} />}
                    label="Paused"
                  />
                </Box>
                <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.8 }}>
                  When saved as a template, no balance changes until each occurrence materializes. The first generation will use the selected Date as the initial next run time.
                </Typography>
              </Box>
            </Fade>
          </Box>
          {/* ...existing floating icon boxes (unchanged, truncated for brevity)... */}
        </Box>
      )}

      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Transition}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 4,
            background: darkMode
              ? 'linear-gradient(150deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.96) 60%, rgba(51,65,85,0.94) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,250,255,0.94) 100%)',
            backdropFilter: 'blur(28px)',
            border: darkMode
              ? '1px solid rgba(148,163,184,0.18)'
              : '1px solid rgba(99,102,241,0.25)',
            boxShadow: darkMode
              ? '0 25px 55px -10px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 22px 50px -10px rgba(99,102,241,0.25)',
            position: 'relative',
            zIndex: 1300,
          }
        }}
      >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{
          background: darkMode
            ? 'linear-gradient(120deg,#4f46e5 0%,#7c3aed 45%,#9333ea 75%,#3b82f6 100%)'
            : 'linear-gradient(120deg,#6366f1 0%,#8b5cf6 50%,#6366f1 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.45rem',
          letterSpacing: '.5px',
          textShadow: '0 4px 18px rgba(0,0,0,.35)',
          borderRadius: '16px 16px 0 0',
          position: 'relative',
          overflow: 'hidden',
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 25% 120%, rgba(255,255,255,0.3), transparent 60%)',
            mixBlendMode: 'overlay'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {transaction ? '✏️ Edit Transaction' : '➕ Add Transaction'}
            {loading && (
              <Typography variant="body2" sx={{ ml: 'auto', opacity: 0.9 }}>
                💾 Saving...
              </Typography>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            background: darkMode ? 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(51,65,85,0.6) 100%)' : 'linear-gradient(135deg,#f8fafc 0%,#ffffff 100%)',
            border: darkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(226,232,240,0.7)',
            boxShadow: darkMode ? '0 8px 25px -6px rgba(0,0,0,0.45)' : '0 6px 18px -4px rgba(99,102,241,0.15)'
          }}>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              💳 Transaction Type
            </FormLabel>
            <RadioGroup
              row
              value={formData.type}
              onChange={handleChange('type')}
              sx={{ gap: 2 }}
            >
              <FormControlLabel
                value="income"
                control={<Radio sx={{ 
                  '&.Mui-checked': { 
                    color: '#10b981'
                  }
                }} />}
                label={
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    background: formData.type === 'income' ? (darkMode ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)') : 'transparent',
                    border: formData.type === 'income' ? '2px solid #10b981' : '2px solid transparent',
                    transition: 'all 300ms ease'
                  }}>
                    📈 <Typography sx={{ fontWeight: 600 }}>Income</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="expense"
                control={<Radio sx={{ 
                  '&.Mui-checked': { 
                    color: '#ef4444'
                  }
                }} />}
                label={
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    background: formData.type === 'expense' ? (darkMode ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)') : 'transparent',
                    border: formData.type === 'expense' ? '2px solid #ef4444' : '2px solid transparent',
                    transition: 'all 300ms ease'
                  }}>
                    📉 <Typography sx={{ fontWeight: 600 }}>Expense</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <Box sx={{ height: 1, background: darkMode ? 'linear-gradient(90deg, rgba(148,163,184,0.2), rgba(99,102,241,0.4), rgba(148,163,184,0.2))' : 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(139,92,246,0.3), rgba(99,102,241,0.15))', borderRadius: 2, mb: 3 }} />

          <TextField
            fullWidth
            label="💰 Amount"
            type="number"
            value={formData.amount}
            onChange={handleChange('amount')}
            required
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(6px)',
                '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
                '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
                '&.Mui-focused fieldset': { borderColor: '#8b5cf6', boxShadow: darkMode ? '0 0 0 3px rgba(139,92,246,0.25)' : '0 0 0 3px rgba(99,102,241,0.25)' },
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
                },
              }
            }}
          />

      <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ fontWeight: 600 }}>🎯 Category</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, category: e.target.value }))
              }
              required
              sx={{
                borderRadius: 3,
        background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(6px)',
        '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
        '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
        '&.Mui-focused fieldset': { borderColor: '#8b5cf6', boxShadow: darkMode ? '0 0 0 3px rgba(139,92,246,0.2)' : '0 0 0 3px rgba(99,102,241,0.2)' },
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
                },
              }}
            >
              {categories.map((category) => (
                <MenuItem 
                  key={category.value} 
                  value={category.value}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      background: `${category.color}15`,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2rem' }}>{category.emoji}</span>
                    <Typography>{category.value}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

      <TextField
            fullWidth
            label="📝 Description"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={2}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
        background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(6px)',
        '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
        '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
        '&.Mui-focused fieldset': { borderColor: '#6366f1', boxShadow: darkMode ? '0 0 0 3px rgba(99,102,241,0.25)' : '0 0 0 3px rgba(99,102,241,0.25)' },
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
                },
              }
            }}
          />

          <TextField
            fullWidth
            label="📅 Date"
            type="date"
            value={formData.date}
            onChange={handleChange('date')}
            required
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(6px)',
                '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
                '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
                '&.Mui-focused fieldset': { borderColor: '#8b5cf6', boxShadow: darkMode ? '0 0 0 3px rgba(139,92,246,0.25)' : '0 0 0 3px rgba(99,102,241,0.25)' },
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
                },
              }
            }}
          />

          {/* Recurrence / Template Toggle */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Button
                variant={formData.isTemplate ? 'contained' : 'outlined'}
                color={formData.isTemplate ? 'primary' : 'inherit'}
                onClick={() => setFormData(prev => ({ ...prev, isTemplate: !prev.isTemplate }))}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: formData.isTemplate ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : undefined,
                  boxShadow: formData.isTemplate ? '0 8px 24px -4px rgba(99,102,241,0.4)' : undefined,
                }}
              >
                {formData.isTemplate ? '🧩 Template Enabled' : '🧩 Make This A Recurring Template'}
              </Button>
              {formData.isTemplate && (
                <Button
                  variant="text"
                  onClick={() => setShowRecurrence(p => !p)}
                  sx={{ fontWeight: 600 }}
                >
                  {showRecurrence ? 'Hide Recurrence Settings ▲' : 'Show Recurrence Settings ▼'}
                </Button>
              )}
            </Box>
            <Fade in={formData.isTemplate && showRecurrence} mountOnEnter unmountOnExit>
              <Box sx={{
                p: 2.5,
                mt: 1,
                borderRadius: 3,
                background: darkMode ? 'linear-gradient(135deg, rgba(51,65,85,0.55) 0%, rgba(30,41,59,0.55) 100%)' : 'linear-gradient(135deg,#f1f5f9 0%, #ffffff 70%)',
                border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(99,102,241,0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔁 Recurrence Pattern
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.recurrence?.frequency || 'monthly'}
                    label="Frequency"
                    onChange={(e) => updateRecurrence('frequency', e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="custom">Custom (Every N Days)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="number"
                  label={formData.recurrence?.frequency === 'custom' ? 'Every N Days' : 'Interval'}
                  value={formData.recurrence?.interval || 1}
                  onChange={(e) => updateRecurrence('interval', Math.max(1, parseInt(e.target.value)||1))}
                  sx={{ mb: 2 }}
                  InputProps={{ inputProps: { min: 1 } }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Occurrences (leave blank = infinite)"
                  value={formData.recurrence?.occurrencesLeft ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateRecurrence('occurrencesLeft', v === '' ? null : Math.max(1, parseInt(v)||1));
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="date"
                  label="End Date (optional)"
                  value={formData.recurrence?.endDate ? String(formData.recurrence.endDate).split('T')[0] : ''}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => updateRecurrence('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={<Radio checked={!!formData.recurrence?.active} onChange={() => updateRecurrence('active', true)} />}
                    label="Active"
                  />
                  <FormControlLabel
                    control={<Radio checked={!formData.recurrence?.active} onChange={() => updateRecurrence('active', false)} />}
                    label="Paused"
                  />
                </Box>
                <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.8 }}>
                  When saved as a template, no balance changes until each occurrence materializes. The first generation will use the selected Date as the initial next run time.
                </Typography>
              </Box>
            </Fade>
          </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            size="large"
            sx={{ 
              fontWeight: 600,
              borderWidth: 2,
              color: darkMode ? '#e2e8f0' : undefined,
              borderColor: darkMode ? 'rgba(148,163,184,0.4)' : undefined,
              background: darkMode ? 'rgba(30,41,59,0.4)' : undefined,
              '&:hover': {
                borderWidth: 2,
                background: darkMode ? 'rgba(51,65,85,0.55)' : undefined,
              }
            }}
          >
            ❌ Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            size="large"
            sx={{
              fontWeight: 700,
              px: 3,
              background: formData.type === 'income' 
                ? 'linear-gradient(45deg, #10b981, #34d399)' 
                : 'linear-gradient(45deg, #ef4444, #f87171)',
              '&:hover': {
                background: formData.type === 'income' 
                  ? 'linear-gradient(45deg, #059669, #10b981)' 
                  : 'linear-gradient(45deg, #dc2626, #ef4444)',
              },
              '&:disabled': {
                background: '#9ca3af',
              }
            }}
          >
            {loading ? '💾 Saving...' : (transaction ? '✏️ Update' : '💾 Save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
    </>
  );
};

export default TransactionForm;
