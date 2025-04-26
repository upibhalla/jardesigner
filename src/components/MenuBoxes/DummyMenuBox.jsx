import React from 'react';
import { Box, Typography } from '@mui/material';

const DummyMenuBox = ({ title }) => {
  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        {title} Menu Box
      </Typography>
      <Typography>This is a placeholder for the {title} menu box.</Typography>
    </Box>
  );
};

export default DummyMenuBox;

