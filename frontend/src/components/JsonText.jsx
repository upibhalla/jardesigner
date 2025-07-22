// src/components/JsonText.jsx

import React, { useCallback } from 'react';
import { Box, TextField, Button } from '@mui/material';

const JsonText = ({ jsonString, setActiveMenu }) => {
  const handleRefreshClick = useCallback(() => {
    if (setActiveMenu) {
        setActiveMenu(null);
    }
  }, [setActiveMenu]);

  return (
    <Box sx={{
      height: '100%',
      p: 2,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Button
        variant="contained"
        onClick={handleRefreshClick}
        sx={{ mb: 2, flexShrink: 0 }}
      >
        Show Model JSON
      </Button>

      <TextField
        fullWidth
        multiline
        // MODIFIED: Value is now only the original jsonString
        value={jsonString || ''}
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
        sx={{
          flexGrow: 1,
          '& .MuiInputBase-root': {
            height: '100%',
            alignItems: 'flex-start',
          },
        }}
      />
    </Box>
  );
};

export default JsonText;
