import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Fade,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Zoom,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PieChartIcon from '@mui/icons-material/PieChart';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import GoalsPanel from './GoalsPanel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

const DashboardComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [health, setHealth] = useState<{score:number; recommendations:string[]} | null>(null);
  const [goalsMini, setGoalsMini] = useState<any[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [showAnomaly, setShowAnomaly] = useState(true);
  const [anomalyExpanded, setAnomalyExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  // Goal dialog state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    notes: ''
  });
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Salary',
    'Freelance',
    'Investment',
    'Other'
  ];

  useEffect(() => {
    fetchTransactions();
    fetchHealth();
    fetchGoalsMini();
    fetchAnomalies();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await api.get('/insights/health');
      setHealth(res.data as { score:number; recommendations:string[] });
    } catch (e) { console.error('health fetch failed', e); } finally { setLoadingHealth(false); }
  };

  const fetchGoalsMini = async () => {
    try {
      const res = await api.get('/goals');
      setGoalsMini((res.data as any[]).slice(0,3));
    } catch (e) { /* ignore */ }
  };

  const fetchAnomalies = async () => {
    try {
      const res = await api.get('/transactions/anomalies');
      setAnomalies(res.data as any[]);
      setShowAnomaly(true);
    } catch (e) { /* ignore */ }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      const data = response.data as Transaction[] | { data: Transaction[] };
      setTransactions(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
      };
      
      const response = await api.post('/transactions', transactionData);
      const newTxn = response.data as Transaction;
      setTransactions([newTxn, ...transactions]);
      setNewTransaction({
        description: '',
        amount: '',
        category: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      });
      setOpen(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return;
    try {
      setCreatingGoal(true);
      const payload = {
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        deadline: newGoal.deadline || undefined,
        notes: newGoal.notes || undefined
      };
      const res = await api.post('/goals', payload);
      const created = res.data;
      // Optimistically update mini list
      setGoalsMini(prev => [created, ...prev].slice(0,3));
      setNewGoal({ name:'', targetAmount:'', deadline:'', notes:'' });
      setGoalDialogOpen(false);
    } catch (e) {
      console.error('Failed creating goal', e);
      alert('Failed to create goal');
    } finally {
      setCreatingGoal(false);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Enhanced color scheme for better UX
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // Category breakdown for expenses with colors
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Pie chart data for expense categories
  const pieChartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: colorPalette.slice(0, Object.keys(expensesByCategory).length),
        borderColor: '#fff',
        borderWidth: 3,
        hoverBorderWidth: 5,
        hoverBorderColor: '#fff',
        hoverOffset: 15,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: darkMode ? 'rgba(168, 85, 247, 0.5)' : 'rgba(102, 126, 234, 0.5)',
        borderWidth: 1,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Fade in={loading} timeout={500}>
            <Box>
              <Typography variant="h4" sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                mb: 3
              }}>
                ✨ Loading your financial insights...
              </Typography>
              <LinearProgress 
                sx={{ 
                  mt: 2, 
                  height: 6, 
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  }
                }} 
              />
            </Box>
          </Fade>
        </Box>
      </Container>
    );
  }

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }
      }}
    >
      <Fade in={!loading} timeout={800}>
        <Box>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ py: 4 }}>
          <Slide direction="down" in={!loading} timeout={600}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  background: darkMode
                    ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                    : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center',
                  mb: 1,
                  textShadow: darkMode
                    ? '0 0 30px rgba(168, 85, 247, 0.5)'
                    : '0 3px 10px rgba(30, 58, 138, 0.4)',
                  filter: darkMode ? 'none' : 'drop-shadow(2px 2px 4px rgba(30, 58, 138, 0.3))',
                  '& .emoji': {
                    background: 'none !important',
                    WebkitBackgroundClip: 'initial !important',
                    backgroundClip: 'initial !important',
                    WebkitTextFillColor: 'initial !important',
                    color: 'initial !important',
                    fontSize: '1.2em',
                    textShadow: darkMode 
                      ? '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6)' 
                      : '0 0 15px rgba(255, 215, 0, 0.9), 0 0 25px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.4)',
                    filter: darkMode 
                      ? 'brightness(1.3) saturate(1.2)' 
                      : 'brightness(1.4) saturate(1.3) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))',
                  }
                }}
              >
                <span className="emoji">💰</span> Smart Budget Dashboard
              </Typography>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  textAlign: 'center',
                  mb: 4,
                  color: darkMode 
                    ? 'rgba(255, 255, 255, 0.8)' 
                    : '#1e3a8a',
                  fontWeight: 600,
                  textShadow: darkMode 
                    ? 'none' 
                    : '0 2px 5px rgba(30, 58, 138, 0.3)',
                  '& .rocket-emoji': {
                    fontSize: '1.2em',
                    textShadow: darkMode 
                      ? '0 0 15px rgba(255, 100, 50, 0.8), 0 0 30px rgba(255, 100, 50, 0.6)' 
                      : '0 0 12px rgba(255, 100, 50, 0.9), 0 0 20px rgba(255, 100, 50, 0.7), 0 2px 4px rgba(0, 0, 0, 0.4)',
                    filter: darkMode 
                      ? 'brightness(1.3) saturate(1.2)' 
                      : 'brightness(1.4) saturate(1.3) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))',
                  }
                }}
              >
                Welcome back, {user?.name || 'User'}! <span className="rocket-emoji">🚀</span> Track your finances with style
              </Typography>

              {/* Enhanced Financial Summary Cards */}
              <Grid container spacing={3} sx={{ mt: 2 }}>
            {[
              {
                title: 'Total Income',
                value: totalIncome,
                icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
                color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                count: transactions.filter(t => t.type === 'income').length,
                delay: 0
              },
              {
                title: 'Total Expenses', 
                value: totalExpenses,
                icon: <TrendingDownIcon sx={{ fontSize: 40 }} />,
                color: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
                count: transactions.filter(t => t.type === 'expense').length,
                delay: 200
              },
              {
                title: 'Net Balance',
                value: balance,
                icon: <AccountBalanceWalletIcon sx={{ fontSize: 40 }} />,
                color: balance >= 0 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'linear-gradient(135deg, #ff9a9e 0%, #f093fb 100%)',
                count: balance >= 0 ? 'Surplus' : 'Deficit',
                delay: 400
              },
              {
                title: 'Total Transactions',
                value: transactions.length,
                icon: <PieChartIcon sx={{ fontSize: 40 }} />,
                color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                count: 'Records',
                delay: 600
              }
            ].map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Zoom in={!loading} timeout={1000} style={{ transitionDelay: `${card.delay}ms` }}>
                  <Card 
                    sx={{ 
                      background: darkMode
                        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode
                        ? '1px solid rgba(168, 85, 247, 0.2)'
                        : '1px solid rgba(99, 102, 241, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': { 
                        transform: 'translateY(-12px) scale(1.03)',
                        boxShadow: darkMode
                          ? '0 25px 50px rgba(168, 85, 247, 0.4)'
                          : '0 25px 50px rgba(99, 102, 241, 0.3)',
                        background: darkMode
                          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.95) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
                        border: darkMode
                          ? '1px solid rgba(168, 85, 247, 0.4)'
                          : '1px solid rgba(99, 102, 241, 0.4)',
                      },
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: card.color,
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box 
                          sx={{ 
                            opacity: 0.9,
                            color: darkMode ? '#a855f7' : '#6366f1',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1) rotate(5deg)',
                            }
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography 
                            variant="h4" 
                            component="div" 
                            sx={{ 
                              fontWeight: 'bold', 
                              lineHeight: 1,
                              color: darkMode ? '#f1f5f9' : '#1e293b',
                              background: darkMode
                                ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)'
                                : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {typeof card.value === 'number' && card.title !== 'Total Transactions' 
                              ? `₹${card.value.toLocaleString()}` 
                              : card.value}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: darkMode ? '#e2e8f0' : '#334155',
                        }}
                      >
                        {card.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          opacity: 0.8,
                          color: darkMode ? '#cbd5e1' : '#64748b',
                          fontWeight: 500,
                        }}
                      >
                        {typeof card.count === 'number' ? `${card.count} transactions` : card.count}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>

        {/* Main Content Area */}
        <Grid container spacing={4} sx={{ mt: 3 }}>
          {/* Transactions List */}
          <Grid item xs={12} lg={8}>
            <Slide direction="up" in={!loading} timeout={800} style={{ transitionDelay: '300ms' }}>
              <Paper 
                sx={{ 
                  p: 4, 
                  borderRadius: 3,
                  background: darkMode 
                    ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(51, 65, 85, 0.9) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: darkMode 
                    ? '0 10px 35px -8px rgba(0,0,0,0.6), 0 4px 12px -2px rgba(15,23,42,0.4)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                  border: darkMode 
                    ? '1px solid rgba(148, 163, 184, 0.18)'
                    : '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(18px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': darkMode ? {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 20% 15%, rgba(168,85,247,0.15), transparent 60%), radial-gradient(circle at 80% 85%, rgba(59,130,246,0.12), transparent 55%)',
                    pointerEvents: 'none'
                  } : {},
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: darkMode
                        ? 'linear-gradient(135deg, #c084fc 0%, #60a5fa 100%)'
                        : 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: darkMode ? 'drop-shadow(0 0 6px rgba(96,165,250,0.25))' : 'drop-shadow(1px 1px 3px rgba(15, 23, 42, 0.2))',
                    }}
                  >
                    📋 Recent Transactions
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{ 
                      background: darkMode
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      boxShadow: darkMode
                        ? '0 8px 26px -6px rgba(99,102,241,0.45)'
                        : '0 8px 25px rgba(102, 126, 234, 0.4)',
                      '&:hover': { 
                        background: darkMode
                          ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)'
                          : 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: darkMode
                          ? '0 12px 34px -4px rgba(99,102,241,0.55)'
                          : '0 8px 30px rgba(102, 126, 234, 0.55)'
                      }
                    }}
                  >
                    Add Transaction
                  </Button>
                </Box>
                {/* Transaction items styling override for dark mode readability */}
                <Box sx={{
                  '& .recent-txn-item': {
                    background: darkMode
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                      : 'linear-gradient(90deg, #fff, #f8fafc)',
                    border: darkMode
                      ? '1px solid rgba(148,163,184,0.12)'
                      : '1px solid rgba(226,232,240,0.7)',
                    boxShadow: darkMode
                      ? '0 4px 14px -4px rgba(0,0,0,0.45)'
                      : '0 4px 14px -4px rgba(0,0,0,0.08)',
                    '&:hover': {
                      background: darkMode
                        ? 'linear-gradient(90deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))'
                        : 'linear-gradient(90deg, #ffffff, #f1f5f9)',
                      transform: 'translateY(-3px)',
                      boxShadow: darkMode
                        ? '0 10px 28px -6px rgba(0,0,0,0.65)'
                        : '0 12px 30px -6px rgba(0,0,0,0.12)'
                    },
                    transition: 'all .35s',
                    borderRadius: 3,
                  },
                  '& .recent-txn-title': {
                    fontWeight: 600,
                    letterSpacing: .3,
                    color: darkMode ? 'rgba(241,245,249,0.95)' : '#1e293b',
                    textShadow: darkMode ? '0 0 6px rgba(0,0,0,0.4)' : 'none'
                  },
                  '& .recent-txn-category': {
                    fontWeight: 600,
                    color: darkMode ? '#f0abfc' : '#b45309'
                  }
                }}>
                  {transactions.length === 0 ? (
                    <Fade in timeout={1000}>
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography 
                          variant="h4" 
                          color="textSecondary" 
                          gutterBottom
                          sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          🚀 Start Your Financial Journey
                        </Typography>
                        <Typography 
                          variant="h6" 
                          color="textSecondary" 
                          sx={{ 
                            mb: 4, 
                            opacity: darkMode ? 0.7 : 0.8,
                            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                            fontWeight: 500,
                          }}
                        >
                          No transactions yet. Add your first income or expense to begin tracking!
                        </Typography>
                        <Button 
                          variant="contained" 
                          size="large"
                          startIcon={<AddIcon />}
                          onClick={() => setOpen(true)}
                          sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            px: 6, 
                            py: 2,
                            fontSize: '1.1rem',
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)'
                            }
                          }}
                        >
                          Add Your First Transaction
                        </Button>
                      </Box>
                    </Fade>
                  ) : (
                    <List sx={{ maxHeight: 500, overflow: 'auto', pr: 1 }}>
                      {transactions.slice(0, 10).map((transaction, index) => (
                        <Zoom 
                          key={transaction._id}
                          in={!loading} 
                          timeout={800}
                          style={{ transitionDelay: `${index * 100}ms` }}
                        >
                          <ListItem 
                            className="recent-txn-item"
                            sx={{ 
                              border: '2px solid transparent',
                              borderRadius: 3, 
                              mb: 2,
                              background: transaction.type === 'income' 
                                ? (darkMode ? 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.10) 100%)' : 'linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%)')
                                : (darkMode ? 'linear-gradient(135deg, rgba(255,159,64,0.20) 0%, rgba(255,159,64,0.10) 100%)' : 'linear-gradient(135deg, #fff3e0 0%, #fdf8f0 100%)'),
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              boxShadow: darkMode ? '0 6px 18px -4px rgba(0,0,0,0.55)' : 'none',
                              '&:hover': { 
                                transform: 'translateX(8px) scale(1.02)',
                                boxShadow: darkMode ? '0 10px 30px -6px rgba(0,0,0,0.7)' : '0 8px 25px rgba(0,0,0,0.1)',
                                borderColor: transaction.type === 'income' ? (darkMode ? 'rgba(34,197,94,0.8)' : '#4caf50') : (darkMode ? 'rgba(255,159,64,0.8)' : '#ff9800'),
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="h6" className="recent-txn-title" sx={{ 
                                      fontWeight: 'bold', 
                                      color: darkMode ? 'rgba(241,245,249,0.95)' : '#0f172a',
                                      letterSpacing: .2,
                                      '& .transaction-emoji': {
                                        fontSize: '1.2em',
                                        textShadow: transaction.type === 'income' 
                                          ? (darkMode 
                                            ? '0 0 12px rgba(34,197,94,0.9), 0 0 26px rgba(34,197,94,0.6)' 
                                            : '0 0 12px rgba(34,197,94,0.8), 0 0 20px rgba(34,197,94,0.6)')
                                          : (darkMode 
                                            ? '0 0 12px rgba(255,159,64,0.9), 0 0 26px rgba(255,159,64,0.6)' 
                                            : '0 0 12px rgba(255,159,64,0.9), 0 0 20px rgba(255,159,64,0.7)'),
                                        filter: 'saturate(1.2)'
                                      }
                                    }}>
                                      <span className="transaction-emoji">{transaction.type === 'income' ? '💰' : '💸'}</span> {transaction.description}
                                    </Typography>
                                    <Chip 
                                      label={transaction.category} 
                                      size="small" 
                                      className="recent-txn-category"
                                      sx={{ 
                                        mt: 1,
                                        background: transaction.type === 'income' 
                                          ? (darkMode ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)')
                                          : (darkMode ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'),
                                        color: '#fff',
                                        fontWeight: 600,
                                        boxShadow: darkMode ? '0 4px 14px -2px rgba(0,0,0,0.6)' : 'none',
                                        '&:hover': { transform: 'scale(1.05)' }
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ display:'block', mt: .75, color: darkMode ? 'rgba(226,232,240,0.75)' : 'rgba(55,65,81,0.9)' }}>
                                      {new Date(transaction.date).toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign:'right' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: transaction.type === 'income' ? (darkMode ? '#4ade80':'#16a34a') : (darkMode ? '#fb923c' : '#d97706') }}>
                                      {transaction.type === 'expense' && '-'}₹{transaction.amount.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                        </Zoom>
                      ))}
                    </List>
                )}
                {/* Close styling wrapper Box for recent transactions */}
                </Box>
                {/* (Financial Health & Goals relocated below main grid) */}
              </Paper>
            </Slide>
          </Grid>

          {/* Pie Chart & Categories */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              {/* Expense Categories Progress */}
              <Grid item xs={12}>
                <Slide direction="left" in={!loading} timeout={800} style={{ transitionDelay: '400ms' }}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: darkMode
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: darkMode
                        ? '0 10px 30px rgba(0,0,0,0.3)'
                        : '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold', 
                        mb: 3,
                        background: darkMode
                          ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                          : 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: darkMode ? 'none' : 'drop-shadow(1px 1px 3px rgba(15, 23, 42, 0.2))',
                      }}
                    >
                      📊 Top Expense Categories
                    </Typography>
                    {topExpenseCategories.length === 0 ? (
                      <Typography 
                        sx={{ 
                          textAlign: 'center', 
                          py: 3,
                          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'textSecondary'
                        }}
                      >
                        💡 No expenses recorded yet
                      </Typography>
                    ) : (
                      <Box>
                        {topExpenseCategories.map(([category, amount], index) => (
                          <Fade 
                            key={category} 
                            in={!loading} 
                            timeout={1000}
                            style={{ transitionDelay: `${500 + index * 200}ms` }}
                          >
                            <Box sx={{ mb: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {category}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                                  ₹{amount.toLocaleString()}
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={(amount / totalExpenses) * 100} 
                                sx={{ 
                                  height: 10, 
                                  borderRadius: 5,
                                  background: 'rgba(102, 126, 234, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    background: `linear-gradient(90deg, ${colorPalette[index]}, ${colorPalette[index]}dd)`,
                                    borderRadius: 5,
                                  }
                                }}
                              />
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                {((amount / totalExpenses) * 100).toFixed(1)}% of total expenses
                              </Typography>
                            </Box>
                          </Fade>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Slide>
              </Grid>

              {/* Pie Chart */}
              <Grid item xs={12}>
                <Slide direction="left" in={!loading} timeout={800} style={{ transitionDelay: '600ms' }}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: darkMode
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: darkMode
                        ? '0 10px 30px rgba(0,0,0,0.3)'
                        : '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold', 
                        mb: 3,
                        textAlign: 'center',
                        background: darkMode
                          ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                          : 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: darkMode ? 'none' : 'drop-shadow(1px 1px 3px rgba(15, 23, 42, 0.2))',
                      }}
                    >
                      🥧 Expense Distribution
                    </Typography>
                    {Object.keys(expensesByCategory).length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography 
                          sx={{ 
                            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'textSecondary'
                          }}
                        >
                          📈 Add expenses to see the distribution chart
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ height: 300, position: 'relative' }}>
                        <Pie data={pieChartData} options={pieChartOptions} />
                      </Box>
                    )}
                  </Paper>
                </Slide>
              </Grid>
            </Grid>
            {/* Anomaly Banner */}
            {anomalies.length > 0 && showAnomaly && (
              <Slide in direction="down" timeout={600} mountOnEnter unmountOnExit>
                <Card sx={{
                  mt:2,
                  mb:1,
                  p:2,
                  borderRadius:4,
                  display:'flex',
                  flexDirection:'column',
                  gap:1,
                  background: darkMode ? 'linear-gradient(90deg, rgba(127,29,29,0.85), rgba(153,27,27,0.8))' : 'linear-gradient(90deg,#fee2e2,#fecaca)',
                  color: darkMode ? '#fecaca':'#7f1d1d',
                  position:'relative'
                }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                    <WarningAmberIcon />
                    <Typography variant="subtitle1" fontWeight={700} flexGrow={1}>
                      Potential Overspend Anomaly Detected
                    </Typography>
                    <Button size="small" onClick={() => setAnomalyExpanded(p=>!p)} sx={{ textTransform:'none' }}>
                      {anomalyExpanded ? 'Collapse' : 'Details'}
                    </Button>
                    <Button size="small" onClick={() => setShowAnomaly(false)} sx={{ textTransform:'none' }}>Dismiss</Button>
                  </Box>
                  <Fade in={anomalyExpanded} unmountOnExit>
                    <Box>
                      {anomalies.slice(0,3).map(a => (
                        <Box key={a._id} sx={{ mb:1.2, pl:0.5 }}>
                          <Typography variant="body2" fontWeight={600}>{a.category} • ₹{a.amount.toLocaleString()}</Typography>
                          {a.anomaly?.reason && <Typography variant="caption" sx={{ opacity:0.8 }}>{a.anomaly.reason}</Typography>}
                        </Box>
                      ))}
                      {anomalies.length > 3 && (
                        <Typography variant="caption" sx={{ opacity:0.75 }}>+ {anomalies.length - 3} more anomalies this month</Typography>
                      )}
                      <Box sx={{ mt:1, display:'flex', gap:1 }}>
                        <Button size="small" variant="outlined" onClick={fetchAnomalies}>Refresh</Button>
                        <Button size="small" variant="contained" color="warning" href="#/reports" sx={{ textTransform:'none' }}>View Reports</Button>
                      </Box>
                    </Box>
                  </Fade>
                </Card>
              </Slide>
            )}

          </Grid>
        </Grid>
            </Box>
          </Slide>

        {/* Add Transaction Dialog */}
        <Dialog 
          open={open} 
          onClose={() => setOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: darkMode 
                ? 'linear-gradient(145deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.95) 60%, rgba(51,65,85,0.93) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(250,250,255,0.94) 100%)',
              backdropFilter: 'blur(28px)',
              border: darkMode
                ? '1px solid rgba(148,163,184,0.15)'
                : '1px solid rgba(99,102,241,0.25)',
              boxShadow: darkMode 
                ? '0 20px 50px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)'
                : '0 18px 45px -10px rgba(99,102,241,0.25)',
              color: darkMode ? '#e2e8f0' : '#1e293b'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: darkMode
              ? 'linear-gradient(120deg, #4f46e5 0%, #7c3aed 40%, #9333ea 70%, #3b82f6 100%)'
              : 'linear-gradient(120deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
            color: 'white',
            fontWeight: 700,
            letterSpacing: '.5px',
            textShadow: '0 4px 18px rgba(0,0,0,.35)',
            borderRadius: '16px 16px 0 0',
            position: 'relative',
            overflow: 'hidden',
            '&:after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 25% 120%, rgba(255,255,255,0.25), transparent 60%)',
              mixBlendMode: 'overlay',
              pointerEvents: 'none'
            },
            '& .dialog-emoji': {
              fontSize: '1.2em',
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))',
              animation: 'pulseGold 3s ease-in-out infinite'
            },
            '@keyframes pulseGold': {
              '0%,100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))' },
              '50%': { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 14px rgba(255, 215, 0, 0.9))' }
            }
          }}>
            <span className="dialog-emoji">💰</span> Add New Transaction
          </DialogTitle>
          <DialogContent sx={{ mt: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  placeholder="e.g., Grocery shopping, Salary, Rent"
                  InputLabelProps={{ sx: { color: darkMode ? 'rgba(226,232,240,0.8)' : undefined } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(6px)',
                      '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
                      '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
                      '&.Mui-focused fieldset': { borderColor: '#8b5cf6', boxShadow: darkMode ? '0 0 0 3px rgba(139,92,246,0.25)' : '0 0 0 3px rgba(99,102,241,0.25)' }
                    },
                    '& input': { color: darkMode ? '#f1f5f9' : undefined }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount (₹)"
                  type="number"
                  fullWidth
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  placeholder="0.00"
                  InputLabelProps={{ sx: { color: darkMode ? 'rgba(226,232,240,0.8)' : undefined } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(6px)',
                      '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
                      '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
                      '&.Mui-focused fieldset': { borderColor: '#10b981', boxShadow: darkMode ? '0 0 0 3px rgba(16,185,129,0.25)' : '0 0 0 3px rgba(16,185,129,0.25)' }
                    },
                    '& input': { color: darkMode ? '#f1f5f9' : undefined }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: darkMode ? 'rgba(226,232,240,0.8)' : undefined }}>Type</InputLabel>
                  <Select
                    value={newTransaction.type}
                    label="Type"
                    onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'income' | 'expense'})}
                    sx={{
                      borderRadius: 3,
                      background: darkMode ? 'rgba(30,41,59,0.5)' : undefined,
                      '& .MuiMenuItem-root .option-emoji': {
                        fontSize: '1.1em',
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.7), 0 0 15px rgba(255, 215, 0, 0.5)',
                        filter: 'brightness(1.2) saturate(1.1)',
                      }
                    }}
                  >
                    <MenuItem value="income">
                      <span className="option-emoji">💰</span> Income
                    </MenuItem>
                    <MenuItem value="expense">
                      <span className="option-emoji">💸</span> Expense
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: darkMode ? 'rgba(226,232,240,0.8)' : undefined }}>Category</InputLabel>
                  <Select
                    value={newTransaction.category}
                    label="Category"
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    sx={{
                      borderRadius: 3,
                      background: darkMode ? 'rgba(30,41,59,0.5)' : undefined,
                      '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : undefined },
                      '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : undefined },
                      '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  InputLabelProps={{ shrink: true, sx: { color: darkMode ? 'rgba(226,232,240,0.8)' : undefined } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: darkMode ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
                      '& fieldset': { borderColor: darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(99,102,241,0.35)' },
                      '&:hover fieldset': { borderColor: darkMode ? '#6366f1' : '#4f46e5' },
                      '&.Mui-focused fieldset': { borderColor: '#8b5cf6', boxShadow: darkMode ? '0 0 0 3px rgba(139,92,246,0.25)' : '0 0 0 3px rgba(99,102,241,0.25)' }
                    },
                    '& input': { color: darkMode ? '#f1f5f9' : undefined }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddTransaction} 
              variant="contained"
              disabled={!newTransaction.description || !newTransaction.amount || !newTransaction.category}
              sx={{ 
                background: newTransaction.type === 'income'
                  ? 'linear-gradient(135deg,#10b981 0%,#34d399 100%)'
                  : 'linear-gradient(135deg,#ef4444 0%,#f87171 100%)',
                px: 3
              }}
            >
              Add Transaction
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add transaction"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: darkMode
              ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: darkMode
              ? '0 8px 32px rgba(168, 85, 247, 0.4)'
              : '0 8px 32px rgba(102, 126, 234, 0.4)',
            '&:hover': { 
              background: darkMode
                ? 'linear-gradient(135deg, #9333ea 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'scale(1.1)',
              boxShadow: darkMode
                ? '0 12px 40px rgba(168, 85, 247, 0.6)'
                : '0 12px 40px rgba(102, 126, 234, 0.6)',
            }
          }}
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>
        {/* Goal Creation Dialog */}
        <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create a Goal</DialogTitle>
          <DialogContent dividers sx={{ pt:2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  fullWidth
                  value={newGoal.name}
                  onChange={(e)=>setNewGoal({...newGoal, name:e.target.value})}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Amount"
                  type="number"
                  fullWidth
                  value={newGoal.targetAmount}
                  onChange={(e)=>setNewGoal({...newGoal, targetAmount:e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Deadline"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newGoal.deadline}
                  onChange={(e)=>setNewGoal({...newGoal, deadline:e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  minRows={3}
                  value={newGoal.notes}
                  onChange={(e)=>setNewGoal({...newGoal, notes:e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> setGoalDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!newGoal.name || !newGoal.targetAmount || creatingGoal}
              onClick={handleCreateGoal}
            >{creatingGoal ? 'Saving...' : 'Create Goal'}</Button>
          </DialogActions>
        </Dialog>
            {/* UML Architecture Link Section */}
            {/* Stacked Financial Health & Goals Section */}
            <Box sx={{ mt: 10 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, background: darkMode ? 'linear-gradient(90deg,#6366f1,#10b981)' : 'linear-gradient(90deg,#1e3a8a,#10b981)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Wellness & Goals</Typography>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <Card sx={{ p:3, borderRadius:4, background: darkMode ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'linear-gradient(135deg,#ffffff,#f1f5f9)', position:'relative', overflow:'hidden' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb:2 }}>🩺 Financial Health</Typography>
                    {health ? (
                      <Box sx={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        <Box sx={{ position:'relative', width:140, height:140 }}>
                          <svg width={140} height={140}>
                            <circle cx={70} cy={70} r={60} stroke={darkMode? 'rgba(148,163,184,0.2)':'#e2e8f0'} strokeWidth={12} fill="none" />
                            <circle cx={70} cy={70} r={60} strokeLinecap="round" stroke="url(#gradHealthMain)" strokeWidth={12} fill="none" strokeDasharray={`${Math.round((health.score)*2*Math.PI*60)} ${Math.round(2*Math.PI*60)}`} transform="rotate(-90 70 70)" style={{ transition:'stroke-dasharray 1s ease'}} />
                            <defs>
                              <linearGradient id="gradHealthMain" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor={health.score>0.7? '#10b981':'#8b5cf6'} />
                              </linearGradient>
                            </defs>
                            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="26" fontWeight="700" fill={darkMode? '#f1f5f9':'#1e293b'}>{Math.round(health.score*100)}</text>
                          </svg>
                        </Box>
                        <Box sx={{ flex:1, minWidth:240 }}>
                          <Typography variant="body2" sx={{ mb:1 }}>Composite score summarizing savings rate, budget adherence & variance stability.</Typography>
                          {health.recommendations.slice(0,3).map((r,i)=>(
                            <Chip key={i} label={r} size="small" sx={{ mr:1, mb:1 }} />
                          ))}
                          {health.recommendations.length===0 && <Chip label="Looking good – keep it up!" color="success" size="small" />}
                          <Button size="small" sx={{ mt:1, textTransform:'none' }} onClick={fetchHealth}>Refresh</Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ py:3 }}>{loadingHealth ? <LinearProgress /> : <Button onClick={fetchHealth}>Load Health</Button>}</Box>
                    )}
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ p:3, borderRadius:4, background: darkMode ? 'linear-gradient(135deg,#1e293b,#334155)' : 'linear-gradient(135deg,#ffffff,#f8fafc)' }}>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                      <Typography variant="h6" fontWeight={700}>🎯 Goals Snapshot</Typography>
                      <Button variant="contained" size="small" onClick={() => setGoalDialogOpen(true)} sx={{ textTransform:'none', borderRadius:2 }}>Add Goal</Button>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                      {goalsMini.map(g => {
                        const pct = g.targetAmount ? Math.min(100, (g.currentAmount / g.targetAmount)*100) : 0;
                        return (
                          <Box key={g._id} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                            <Box sx={{ flexGrow:1 }}>
                              <Typography variant="body2" fontWeight={600}>{g.name}</Typography>
                              <LinearProgress variant="determinate" value={pct} sx={{ height:6, borderRadius:3, '& .MuiLinearProgress-bar':{ background: pct>=100? 'linear-gradient(90deg,#10b981,#34d399)': 'linear-gradient(90deg,#6366f1,#8b5cf6)'} }} />
                            </Box>
                            <Typography variant="caption" sx={{ width:40, textAlign:'right', fontWeight:600 }}>{pct.toFixed(0)}%</Typography>
                          </Box>
                        );
                      })}
                      {goalsMini.length===0 && <Typography variant="body2" sx={{ opacity:0.7 }}>No goals yet – create one!</Typography>}
                      <Box sx={{ display:'flex', gap:1, mt:0.5 }}>
                        <Button size="small" onClick={fetchGoalsMini} sx={{ textTransform:'none' }}>Refresh</Button>
                        <Button size="small" variant="outlined" onClick={() => navigate('/goals')} sx={{ textTransform:'none' }}>View All</Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mt: 6, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, background: darkMode ? 'linear-gradient(90deg,#6366f1,#a855f7)' : 'linear-gradient(90deg,#1e3a8a,#6366f1)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Explore the Architecture</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>Dive into an interactive UML-style view of models, routes, controllers & utilities.</Typography>
              <Button
                onClick={() => navigate('/uml')}
                variant="contained"
                size="large"
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  px: 4,
                  py: 1.4,
                  borderRadius: 3,
                  background: darkMode
                    ? 'linear-gradient(135deg,#4338ca,#6366f1,#7c3aed)'
                    : 'linear-gradient(135deg,#1e3a8a,#6366f1,#3b82f6)',
                  boxShadow: darkMode ? '0 8px 24px -6px rgba(0,0,0,0.6)' : '0 8px 24px -6px rgba(99,102,241,0.55)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(120deg,rgba(255,255,255,0.25),transparent 60%)',
                    opacity: 0,
                    transition: 'opacity .6s'
                  },
                  '&:hover:before': { opacity: 1 },
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: darkMode ? '0 12px 32px -8px rgba(0,0,0,0.7)' : '0 12px 32px -8px rgba(99,102,241,0.6)' }
                }}
              >View UML Diagram →</Button>
            </Box>
          </Box>
  </Container>
  </Box>
      </Fade>
    </Box>
  );
};

export default DashboardComponent;
