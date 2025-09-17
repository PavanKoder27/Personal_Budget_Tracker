import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  emoji?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  emoji = '✨',
}) => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        my: 6,
        p: 4,
        borderRadius: 4,
        textAlign: 'center',
        mx: 'auto',
        maxWidth: 720,
        background: dark
          ? 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(51,65,85,0.7))'
          : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
        border: dark ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(99,102,241,0.2)',
        boxShadow: dark
          ? '0 10px 30px rgba(0,0,0,0.25)'
          : '0 10px 30px rgba(99,102,241,0.15)',
      }}
    >
      <Typography variant="h3" component="div" sx={{ mb: 1.5 }}>
        {emoji}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {actionText && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ borderRadius: 3 }}>
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
