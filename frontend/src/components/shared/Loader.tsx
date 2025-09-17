import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

const Loader: React.FC<LoaderProps> = ({ label = 'Loading…', fullScreen }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        ...(fullScreen
          ? { position: 'fixed', inset: 0, zIndex: 1500 }
          : { width: '100%', minHeight: 120 }),
      }}
    >
      <CircularProgress thickness={4} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default Loader;
