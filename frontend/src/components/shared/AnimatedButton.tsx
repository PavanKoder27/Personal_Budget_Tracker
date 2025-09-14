import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 14,
  padding: theme.spacing(1.2, 3),
  backdropFilter: 'blur(12px)',
  transition: 'transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s, background .35s',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(59,130,246,0.25) 100%)'
    : 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: theme.palette.mode === 'dark' ? '#fff' : '#1e293b',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
    : '0 6px 18px -4px rgba(0,0,0,0.15)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-30%',
    width: '60%',
    height: '100%',
    background: 'linear-gradient(120deg, rgba(255,255,255,0.25), rgba(255,255,255,0))',
    transform: 'skewX(-25deg)',
    animation: 'shine 4.5s ease-in-out infinite',
  },
  '@keyframes shine': {
    '0%': { transform: 'translateX(-100%) skewX(-25deg)' },
    '50%': { transform: 'translateX(120%) skewX(-25deg)' },
    '100%': { transform: 'translateX(120%) skewX(-25deg)' },
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.03)',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(59,130,246,0.35) 100%)'
      : 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.25) 100%)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 14px 32px -6px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)'
      : '0 12px 28px -6px rgba(0,0,0,0.25)',
  },
  '&:active': {
    transform: 'translateY(-1px) scale(.99)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 16px -2px rgba(0,0,0,0.6)'
      : '0 4px 14px -2px rgba(0,0,0,0.25)',
  },
  '&.Mui-disabled': {
    opacity: .6,
    cursor: 'not-allowed',
    transform: 'none'
  }
}));

const AnimatedButton: React.FC<ButtonProps> = (props) => {
  return <StyledButton {...props} />;
};

export default AnimatedButton;
