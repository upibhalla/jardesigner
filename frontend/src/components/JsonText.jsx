import React, { useState, useCallback } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
// import Ajv from 'ajv'; // Schema validation requires library

// Accept jsonString and setActiveMenu props
const JsonText = ({ jsonString, schema, setActiveMenu }) => {
  // No local state needed for displayedJson anymore
  const [validationResult, setValidationResult] = useState(null);
  // Placeholder for schema validator
  // let schemaValidator = null;

  // --- MODIFIED: handleRefreshClick ONLY closes menu ---
  const handleRefreshClick = useCallback(() => {
    console.log("JsonText: Refresh clicked.");

    // 1. Close any currently open menu box
    if (setActiveMenu) {
        console.log("JsonText: Closing active menu.");
        setActiveMenu(null); // This triggers unmount and state update in App.jsx
    } else {
        console.warn("JsonText: setActiveMenu function not provided.");
    }

    // 2. Perform validation on the NEXT render cycle (when jsonString prop updates)
    // We can use a simple effect for this, or do it here (less ideal)
    // For simplicity, let's just show the placeholder validation message immediately
    setValidationResult(null); // Clear previous result
    setValidationResult({ type: 'info', message: 'Schema validation requires integrating a library like Ajv.' });
    // A more robust validation would likely happen in an effect watching jsonString

  }, [setActiveMenu]); // Only depends on setActiveMenu now

  // Optional: Effect to run validation when the jsonString prop changes
  // useEffect(() => {
  //    console.log("JsonText: jsonString prop changed, re-validating...");
  //    if (schema) {
  //       // ... (Compile schema if needed) ...
  //       // try {
  //       //    const data = JSON.parse(jsonString || '{}');
  //       //    // ... (Run ajv validation) ...
  //       //    // setValidationResult(...)
  //       // } catch (e) {
  //       //    setValidationResult({ type: 'error', message: 'Invalid JSON format.' });
  //       // }
  //    }
  // }, [jsonString, schema]);

  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        Text View of JSON File
      </Typography>
       {/* --- MODIFIED: Button Text --- */}
      <Button variant="contained" onClick={handleRefreshClick} style={{ marginBottom: '10px' }}>
        Show model json
      </Button>
       {/* --- END MODIFIED --- */}

      {/* Display Validation Result */}
      {validationResult && (
        <Alert severity={validationResult.type} style={{ marginBottom: '10px' }}>
          {validationResult.message}
        </Alert>
      )}

      {/* --- MODIFIED: Use jsonString prop directly --- */}
      <TextField
        fullWidth
        multiline
        rows={18}
        value={jsonString || ''} // Display the prop directly
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
        key={jsonString} // Add key to force re-render if needed, though usually not required
      />
       {/* --- END MODIFIED --- */}
    </Box>
  );
};

export default JsonText;

