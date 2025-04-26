import React from 'react';
import { Box, Typography } from '@mui/material';

const GraphWindow = () => {
  return (
    <Box style={{ padding: '16px', background: '#e0e0e0', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>Graph Display</Typography>
      <Box style={{ height: '200px', background: '#fff', borderRadius: '4px' }}></Box>
    </Box>
  );
};

export default GraphWindow;

