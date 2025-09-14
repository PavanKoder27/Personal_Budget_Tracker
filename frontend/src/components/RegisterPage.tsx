import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Slide,
  IconButton,
  InputAdornment
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from './AnimatedBackground';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedEmail');
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  const validate = (): boolean => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Missing fields');
      setErrorDetails('Please fill in name, email, password and confirmation.');
      return false;
    }
    if (name.trim().length < 2) {
      setError('Invalid name');
      setErrorDetails('Name must be at least 2 characters long.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email');
      setErrorDetails('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Weak password');
      setErrorDetails('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords mismatch');
      setErrorDetails('Password and confirmation do not match.');
      return false;
    }
    setError('');
    setErrorDetails('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      localStorage.setItem('savedEmail', email.trim().toLowerCase());
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      setError('Registration failed');
      setErrorDetails(msg);
    } finally {
      setLoading(false);
    }
  };

  const commonTextFieldSx = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      backgroundColor: darkMode ? 'rgba(30, 27, 75, 0.6)' : 'rgba(248, 250, 252, 0.8)',
      borderRadius: 3,
      transition: 'all 0.3s ease-in-out',
      '& fieldset': {
        borderColor: darkMode ? 'rgba(139, 92, 246, 0.5)' : '#cbd5e1',
        borderWidth: 1.5,
      },
      '&:hover fieldset': {
        borderColor: darkMode ? '#8b5cf6' : '#6366f1',
        transform: 'scale(1.01)'
      },
      '&.Mui-focused fieldset': {
        borderColor: darkMode ? '#a855f7' : '#6366f1',
        borderWidth: 2,
        boxShadow: darkMode
          ? '0 0 0 3px rgba(168, 85, 247, 0.1)'
          : '0 0 0 3px rgba(99, 102, 241, 0.1)'
      }
    },
    '& .MuiInputLabel-root': {
      color: darkMode ? '#cbd5e1' : '#64748b',
      fontWeight: 500
    },
    '& .MuiOutlinedInput-input': {
      color: darkMode ? '#f1f5f9' : '#1e293b',
      fontWeight: 500
    }
  } as const;

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <AnimatedBackground />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, py: { xs: 6, md: 0 } }}>
        <Slide direction="up" in={true} timeout={700}>
          <Paper elevation={24} sx={{
            p: 4,
            borderRadius: 4,
            position: 'relative',
            background: darkMode
              ? 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: darkMode
              ? '1px solid rgba(139, 92, 246, 0.3)'
              : '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: darkMode
              ? '0 32px 64px rgba(0,0,0,0.5)'
              : '0 32px 64px rgba(99,102,241,0.15)',
            transition: 'all 0.5s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode
                ? '0 40px 80px rgba(139, 92, 246, 0.3)'
                : '0 40px 80px rgba(99, 102, 241, 0.25)'
            }
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" sx={{
                fontWeight: 800,
                background: darkMode
                  ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                  : 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                textShadow: darkMode
                  ? '0 0 30px rgba(168,85,247,0.5)'
                  : '0 0 25px rgba(30,64,175,0.6)'
              }}>
                ✨ Create Account
              </Typography>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: darkMode ? 'rgba(255,255,255,0.85)' : '#1e293b'
              }}>
                Start tracking your budgets today
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                label="👤 Full Name"
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                required
                sx={commonTextFieldSx}
              />
              <TextField
                label="📧 Email Address"
                fullWidth
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                required
                sx={commonTextFieldSx}
              />
              <TextField
                label="🔒 Password"
                fullWidth
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                sx={commonTextFieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                label="🔐 Confirm Password"
                fullWidth
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                sx={commonTextFieldSx}
              />

              {error && (
                <Alert severity="error" sx={{
                  mb: 2,
                  backgroundColor: darkMode ? 'rgba(220,38,38,0.15)' : 'rgba(239,68,68,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: darkMode ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(239,68,68,0.3)',
                  color: darkMode ? '#fca5a5' : '#dc2626',
                  borderRadius: 2
                }}>
                  <AlertTitle>{error}</AlertTitle>
                  {errorDetails && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                      {errorDetails}
                    </Typography>
                  )}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  textTransform: 'none',
                  color: 'white',
                  background: loading
                    ? (darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(99,102,241,0.5)')
                    : (darkMode
                        ? 'linear-gradient(45deg,#a855f7 30%,#3b82f6 90%)'
                        : 'linear-gradient(45deg,#6366f1,#8b5cf6)'),
                  boxShadow: darkMode
                    ? '0 8px 32px rgba(168,85,247,0.4)'
                    : '0 8px 32px rgba(99,102,241,0.4)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: loading ? 'none' : 'translateY(-2px)',
                    boxShadow: loading ? 'none' : (darkMode
                      ? '0 12px 40px rgba(168,85,247,0.6)'
                      : '0 12px 24px rgba(99,102,241,0.4)'),
                    background: loading
                      ? (darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(99,102,241,0.5)')
                      : (darkMode
                          ? 'linear-gradient(45deg,#9333ea 30%,#2563eb 90%)'
                          : 'linear-gradient(45deg,#4f46e5,#7c3aed)')
                  },
                  '&:disabled': { color: 'rgba(255,255,255,0.7)' }
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account 🚀'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: darkMode ? 'rgba(255,255,255,0.75)' : 'text.secondary' }}>
                  Already have an account?
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontSize: '1rem',
                    color: darkMode ? '#a855f7' : '#6366f1',
                    borderColor: darkMode ? '#a855f7' : '#6366f1',
                    borderWidth: 2,
                    background: darkMode ? 'rgba(168,85,247,0.1)' : 'rgba(99,102,241,0.05)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: darkMode ? '#9333ea' : '#4f46e5',
                      background: darkMode ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: darkMode
                        ? '0 8px 32px rgba(168,85,247,0.3)'
                        : '0 8px 32px rgba(99,102,241,0.2)'
                    }
                  }}
                >
                  Go to Sign In
                </Button>
              </Box>
            </Box>
          </Paper>
        </Slide>
      </Container>
    </Box>
  );
};

export default RegisterPage;
