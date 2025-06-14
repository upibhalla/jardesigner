import React, { useCallback } from 'react';
import { Box, TextField, Button } from '@mui/material';

// The 'setActiveMenu' prop is now used again by the button's handler.
const JsonText = ({ jsonString, setActiveMenu }) => {
  // This handler's purpose is to close any open menu box on the left.
  const handleRefreshClick = useCallback(() => {
    if (setActiveMenu) {
        setActiveMenu(null);
    } else {
        console.warn("JsonText: setActiveMenu function not provided.");
    }
  }, [setActiveMenu]);

  return (
    // This Box now uses a flex layout to correctly position the button and the text field.
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
        sx={{ mb: 2, flexShrink: 0 }} // Margin bottom and ensures the button doesn't shrink
      >
        Show Model JSON
      </Button>

      {/* The TextField is now a flex item that grows to fill the available space. */}
      <TextField
        fullWidth
        multiline
        value={jsonString || ''}
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
        sx={{
          flexGrow: 1, // This is the key to making the text field fill remaining space.
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
