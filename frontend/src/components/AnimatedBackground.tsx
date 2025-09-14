import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const AnimatedBackground: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  return (
    <Box sx={{ 
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'none', // ensure clicks pass through to form
      background: darkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 70%, #1e1b4b 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #e2e8f0 70%, #f8fafc 100%)',
      // subtle radial vignette to focus on form
      '&:before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: darkMode
          ? 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.07), transparent 60%)'
          : 'radial-gradient(circle at 70% 50%, rgba(0,0,0,0.04), transparent 65%)',
      }
    }}>
      {/* Floating 3D Icons */}
      
      {/* Money Icon */}
      <Box sx={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        fontSize: '4rem',
        opacity: 0.9,
        color: '#FFD700',
        animation: 'float1 6s ease-in-out infinite',
        transform: 'rotateY(15deg) rotateX(-10deg)',
        textShadow: '0 0 30px rgba(255, 215, 0, 0.8)',
        filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))',
        '@keyframes float1': {
          '0%, 100%': { 
            transform: 'rotateY(15deg) rotateX(-10deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(-15deg) rotateX(10deg) translateY(-20px) scale(1.1)',
          },
        }
      }}>
        💰
      </Box>

      {/* Credit Card Icon */}
      <Box sx={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        fontSize: '3.5rem',
        opacity: 0.8,
        color: '#96CEBC',
        animation: 'float2 8s ease-in-out infinite',
        transform: 'rotateY(-20deg) rotateZ(10deg)',
        textShadow: '0 0 25px rgba(150, 206, 180, 0.8)',
        filter: 'drop-shadow(0 0 18px rgba(150, 206, 180, 0.6))',
        '@keyframes float2': {
          '0%, 100%': { 
            transform: 'rotateY(-20deg) rotateZ(10deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(20deg) rotateZ(-10deg) translateY(15px) scale(1.1)',
          },
        }
      }}>
        💳
      </Box>

      {/* Piggy Bank Icon */}
      <Box sx={{
        position: 'absolute',
        top: '25%',
        right: '8%',
        fontSize: '3.5rem',
        opacity: 0.85,
        color: '#f971a1ff',
        animation: 'float3 7s ease-in-out infinite',
        transform: 'rotateY(25deg) rotateX(-15deg)',
        textShadow: '0 0 28px rgba(253, 121, 168, 0.7)',
        filter: 'drop-shadow(0 0 20px rgba(253, 121, 168, 0.6))',
        '@keyframes float3': {
          '0%, 100%': { 
            transform: 'rotateY(25deg) rotateX(-15deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(-25deg) rotateX(15deg) translateY(-25px) scale(1.1)',
          },
        }
      }}>
        🐷
      </Box>

      {/* Chart Icon */}
      <Box sx={{
        position: 'absolute',
        top: '70%',
        left: '8%',
        fontSize: '3.8rem',
        opacity: 0.9,
        color: '#45B7D1',
        animation: 'float4 9s ease-in-out infinite',
        transform: 'rotateY(-15deg) rotateZ(-5deg)',
        textShadow: '0 0 30px rgba(69, 183, 209, 0.8)',
        filter: 'drop-shadow(0 0 25px rgba(69, 183, 209, 0.7))',
        '@keyframes float4': {
          '0%, 100%': { 
            transform: 'rotateY(-15deg) rotateZ(-5deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(15deg) rotateZ(5deg) translateY(-30px) scale(1.15)',
          },
        }
      }}>
        📊
      </Box>

      {/* Rocket Icon */}
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        fontSize: '4rem',
        opacity: 0.9,
        color: '#FF6B6B',
        animation: 'float5 5s ease-in-out infinite',
        transform: 'rotateY(10deg) rotateX(-20deg)',
        textShadow: '0 0 35px rgba(255, 107, 107, 0.8)',
        filter: 'drop-shadow(0 0 25px rgba(255, 107, 107, 0.7))',
        '@keyframes float5': {
          '0%, 100%': { 
            transform: 'rotateY(10deg) rotateX(-20deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(-10deg) rotateX(20deg) translateY(-35px) scale(1.2)',
          },
        }
      }}>
        🚀
      </Box>

      {/* Bank Icon */}
      <Box sx={{
        position: 'absolute',
        top: '45%',
        left: '5%',
        fontSize: '3.2rem',
        opacity: 0.8,
        color: '#4ECDC4',
        animation: 'float6 10s ease-in-out infinite',
        transform: 'rotateY(-30deg) rotateZ(15deg)',
        textShadow: '0 0 25px rgba(78, 205, 196, 0.7)',
        filter: 'drop-shadow(0 0 20px rgba(78, 205, 196, 0.6))',
        '@keyframes float6': {
          '0%, 100%': { 
            transform: 'rotateY(-30deg) rotateZ(15deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(30deg) rotateZ(-15deg) translateY(-18px) scale(1.1)',
          },
        }
      }}>
        🏦
      </Box>

      {/* Gem Icon */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        right: '35%',
        fontSize: '3rem',
        opacity: 0.85,
        color: '#9B59B6',
        animation: 'float7 12s ease-in-out infinite',
        transform: 'rotateY(20deg) rotateX(-25deg)',
        textShadow: '0 0 30px rgba(155, 89, 182, 0.8)',
        filter: 'drop-shadow(0 0 22px rgba(155, 89, 182, 0.6))',
        '@keyframes float7': {
          '0%, 100%': { 
            transform: 'rotateY(20deg) rotateX(-25deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(-20deg) rotateX(25deg) translateY(-22px) scale(1.1)',
          },
        }
      }}>
        💎
      </Box>

      {/* Trophy Icon */}
      <Box sx={{
        position: 'absolute',
        bottom: '35%',
        left: '30%',
        fontSize: '3.5rem',
        opacity: 0.9,
        color: '#F39C12',
        animation: 'float8 8s ease-in-out infinite',
        transform: 'rotateY(-10deg) rotateZ(-10deg)',
        textShadow: '0 0 32px rgba(243, 156, 18, 0.8)',
        filter: 'drop-shadow(0 0 24px rgba(243, 156, 18, 0.7))',
        '@keyframes float8': {
          '0%, 100%': { 
            transform: 'rotateY(-10deg) rotateZ(-10deg) translateY(0px) scale(1)',
          },
          '50%': { 
            transform: 'rotateY(10deg) rotateZ(10deg) translateY(-28px) scale(1.15)',
          },
        }
      }}>
        🏆
      </Box>
    </Box>
  );
};

export default AnimatedBackground;
