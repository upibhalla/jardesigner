import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

const JsonText = ({ jsonContent }) => {
  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        JSON File Content
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={20}
        value={jsonContent}
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
      />
    </Box>
  );
};

export default JsonText;

