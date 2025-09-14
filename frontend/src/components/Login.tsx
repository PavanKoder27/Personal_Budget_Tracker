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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from './AnimatedBackground';

export interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // OTP mode removed: simplifying to password-only authentication
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedEmail');
      if (saved) {
        setEmail(saved);
      }
    } catch (error) {
      console.error('Error loading saved email:', error);
    }
  }, []);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Removed OTP countdown effect (no longer needed)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      setErrorDetails('Email and password are required to sign in.');
      return;
    }
    if (!email.includes('@')) {
      setError('Invalid email format');
      setErrorDetails('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    setErrorDetails('');
    try {
      await login(email, password);
      localStorage.setItem('savedEmail', email);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Sign in failed');
      setErrorDetails(error?.response?.data?.message || error.message || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  // requestOtp removed (OTP feature deprecated)

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
      <Container maxWidth="xs" sx={{ 
        position: 'relative', 
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: '100vh', md: 'auto' },
        py: { xs: 6, md: 0 }
      }}>
        <Slide direction="up" in={true} timeout={800}>
      <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 4,
        position: 'relative',
        zIndex: 3,
              background: darkMode
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: darkMode
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: darkMode
                ? '0 32px 64px rgba(0,0,0,0.5)'
                : '0 32px 64px rgba(99, 102, 241, 0.15)',
              transition: 'all 0.5s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: darkMode
                  ? '0 40px 80px rgba(139, 92, 246, 0.3)'
                  : '0 40px 80px rgba(99, 102, 241, 0.25)',
              }
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  background: darkMode
                    ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                    : 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  textShadow: darkMode
                    ? '0 0 30px rgba(168, 85, 247, 0.5)'
                    : '0 0 25px rgba(30, 64, 175, 0.6)',
                  filter: darkMode
                    ? 'none'
                    : 'drop-shadow(0 2px 8px rgba(30, 64, 175, 0.3))',
                }}
              >
                💰 Budget Tracker
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b',
                  mb: 1,
                  textShadow: darkMode
                    ? 'none'
                    : '0 2px 4px rgba(30, 41, 59, 0.2)',
                }}
              >
                Welcome Back! 👋
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                  fontWeight: 600,
                  textShadow: darkMode
                    ? 'none'
                    : '0 1px 2px rgba(71, 85, 105, 0.2)',
                }}
              >
                Sign in to manage your finances with style
              </Typography>
            </Box>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="📧 Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
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
                      transform: 'scale(1.01)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: darkMode ? '#a855f7' : '#6366f1',
                      borderWidth: 2,
                      boxShadow: darkMode
                        ? '0 0 0 3px rgba(168, 85, 247, 0.1)'
                        : '0 0 0 3px rgba(99, 102, 241, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: darkMode ? '#cbd5e1' : '#64748b',
                    fontWeight: 500,
                  },
                  '& .MuiOutlinedInput-input': {
                    color: darkMode ? '#f1f5f9' : '#1e293b',
                    fontWeight: 500,
                  },
                }}
              />
              {
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="🔒 Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 3,
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
                      transform: 'scale(1.01)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: darkMode ? '#a855f7' : '#6366f1',
                      borderWidth: 2,
                      boxShadow: darkMode
                        ? '0 0 0 3px rgba(168, 85, 247, 0.1)'
                        : '0 0 0 3px rgba(99, 102, 241, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: darkMode ? '#cbd5e1' : '#64748b',
                    fontWeight: 500,
                  },
                  '& .MuiOutlinedInput-input': {
                    color: darkMode ? '#f1f5f9' : '#1e293b',
                    fontWeight: 500,
                  },
                }}
              />
              }

              {/* OTP UI removed */}

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    backgroundColor: darkMode
                      ? 'rgba(220, 38, 38, 0.15)'
                      : 'rgba(239, 68, 68, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: darkMode
                      ? '1px solid rgba(220, 38, 38, 0.4)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    color: darkMode ? '#fca5a5' : '#dc2626',
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: darkMode ? '#fca5a5' : '#dc2626',
                    },
                  }}
                >
                  <AlertTitle>{error}</AlertTitle>
                  {errorDetails && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: darkMode ? 'rgba(252, 165, 165, 0.8)' : '#991b1b',
                        fontWeight: 500,
                      }}
                    >
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
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  textTransform: 'none',
                  color: 'white',
                  background: loading
                    ? (darkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.5)')
                    : (darkMode
                        ? 'linear-gradient(45deg, #a855f7 30%, #3b82f6 90%)'
                        : 'linear-gradient(45deg, #6366f1, #8b5cf6)'),
                  boxShadow: darkMode
                    ? '0 8px 32px rgba(168, 85, 247, 0.4)'
                    : '0 8px 32px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: loading ? 'none' : 'translateY(-2px)',
                    boxShadow: loading ? 'none' : (darkMode
                      ? '0 12px 40px rgba(168, 85, 247, 0.6)'
                      : '0 12px 24px rgba(99, 102, 241, 0.4)'),
                    background: loading
                      ? (darkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.5)')
                      : (darkMode
                          ? 'linear-gradient(45deg, #9333ea 30%, #2563eb 90%)'
                          : 'linear-gradient(45deg, #4f46e5, #7c3aed)'),
                  },
                  '&:disabled': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
                }}
              >
                {loading ? 'Signing In...' : 'Sign In ✨'}
              </Button>
              {/* Toggle button removed (OTP deprecated) */}
            </Box>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                    mb: 1
                  }}
                >
                  Don't have an account?
                </Typography>
                <Button
                  onClick={() => navigate('/register')}
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
                    background: darkMode
                      ? 'rgba(168, 85, 247, 0.1)'
                      : 'rgba(99, 102, 241, 0.05)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: darkMode ? '#9333ea' : '#4f46e5',
                      background: darkMode
                        ? 'rgba(168, 85, 247, 0.2)'
                        : 'rgba(99, 102, 241, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: darkMode
                        ? '0 8px 32px rgba(168, 85, 247, 0.3)'
                        : '0 8px 32px rgba(99, 102, 241, 0.2)',
                    }
                  }}
                >
                  ✨ Create Account
                </Button>
              </Box>
          </Paper>
        </Slide>
      </Container>
    </Box>
  );
};

export default Login;
