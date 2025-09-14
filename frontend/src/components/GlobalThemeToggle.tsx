import React from 'react';
import { Fab, useTheme as useMUITheme } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const GlobalThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const muiTheme = useMUITheme();

  return (
    <Fab
      size="medium"
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        background: darkMode
          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        color: 'white',
        transition: 'all 0.3s ease-in-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: 9999,
        '&:hover': {
          transform: 'scale(1.1) rotate(15deg)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          background: darkMode
            ? 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)'
            : 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
        },
      }}
      onClick={toggleDarkMode}
    >
      {darkMode ? '☀️' : '🌙'}
    </Fab>
  );
};

export default GlobalThemeToggle;
