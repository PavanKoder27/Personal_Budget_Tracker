import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface PageHeadingProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  mb?: number;
  delayMs?: number;
}

const PageHeading: React.FC<PageHeadingProps> = ({ emoji, title, subtitle, align='left', mb=3, delayMs=120 }) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  return (
    <Fade in timeout={600} style={{ transitionDelay: `${delayMs}ms` }}>
      <Box sx={{ textAlign: align, mb }}>
        <Typography 
          variant="h4" 
          sx={{
            fontWeight: 'bold',
            lineHeight: 1.15,
            background: darkMode
              ? 'linear-gradient(135deg,#a855f7 0%,#3b82f6 45%,#6366f1 100%)'
              : 'linear-gradient(135deg,#1e3a8a 0%,#4f46e5 50%,#7c3aed 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: darkMode ? 'none' : 'drop-shadow(1px 1px 3px rgba(15,23,42,0.18))',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            position: 'relative',
            '& .heading-emoji': {
              background: 'none !important',
              WebkitTextFillColor: 'initial !important',
              color: 'initial',
              fontSize: '1.15em',
              lineHeight: 1,
              textShadow: darkMode
                ? '0 0 18px rgba(255,215,0,0.55),0 0 36px rgba(255,215,0,0.35)'
                : '0 0 10px rgba(255,215,0,0.7),0 2px 4px rgba(0,0,0,0.35)',
              filter: darkMode
                ? 'brightness(1.25) saturate(1.25)'
                : 'brightness(1.35) saturate(1.3) drop-shadow(1px 1px 2px rgba(0,0,0,0.35))'
            }
          }}
        >
          {emoji && <span className="heading-emoji" role="img" aria-label="emoji">{emoji}</span>}
          <span>{title}</span>
        </Typography>
        {subtitle && (
          <Typography 
            variant="subtitle1" 
            sx={{
              mt: 1,
              fontWeight: 600,
              color: darkMode ? 'rgba(255,255,255,0.75)' : '#1e3a8a',
              textShadow: darkMode ? 'none' : '0 2px 5px rgba(30,58,138,0.25)',
              letterSpacing: '.25px'
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default PageHeading;
