import React, { useState, useCallback } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material'; // Added Button, Alert
// IMPORTANT: Schema validation requires a library like 'ajv'
// import Ajv from 'ajv'; // Example import - cannot be executed here

// --- Placeholder for schema validation ---
// In a real application, you would initialize Ajv, possibly outside the component
// const ajv = new Ajv();
// let schemaValidator = null; // Will hold the compiled schema validator

const JsonText = ({ getCurrentJsonData, schema }) => { // Renamed props
  const [displayedJson, setDisplayedJson] = useState('');
  const [validationResult, setValidationResult] = useState(null); // To show validation status

  // --- Compile schema validator (run once or when schema changes) ---
  // Note: This compilation step needs to happen carefully in a real app.
  // Using useEffect might be appropriate if the schema prop could change.
  // if (schema && !schemaValidator) {
  //   try {
  //     schemaValidator = ajv.compile(schema);
  //     console.log("Schema compiled successfully for validation.");
  //   } catch (error) {
  //     console.error("Failed to compile schema:", error);
  //     setValidationResult({ type: 'error', message: `Failed to compile schema: ${error.message}` });
  //   }
  // }
  // --- End Placeholder ---

  const handleRefreshClick = useCallback(() => {
    if (getCurrentJsonData) {
      const currentData = getCurrentJsonData();
      const jsonString = JSON.stringify(currentData, null, 2);
      setDisplayedJson(jsonString);

      // --- Perform Schema Validation (Requires Library) ---
      setValidationResult(null); // Clear previous result
      // if (schemaValidator) { // Check if validator was compiled
      //   const isValid = schemaValidator(currentData);
      //   if (isValid) {
      //     setValidationResult({ type: 'success', message: 'JSON is valid according to the schema.' });
      //   } else {
      //     // Format Ajv errors for display
      //     const errorMessages = schemaValidator.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
      //     setValidationResult({ type: 'error', message: `JSON is invalid: ${errorMessages}` });
      //     console.error("Schema validation errors:", schemaValidator.errors);
      //   }
      // } else if (schema) {
      //   setValidationResult({ type: 'warning', message: 'Schema available but validator could not be compiled.' });
      // } else {
      //    setValidationResult({ type: 'info', message: 'No schema provided for validation.' });
      // }
       // --- Placeholder Message (since we can't run validation) ---
        setValidationResult({ type: 'info', message: 'Schema validation requires integrating a library like Ajv.' });
      // --- End Schema Validation ---

    } else {
      setDisplayedJson('Error: Function to get current JSON data not provided.');
       setValidationResult({ type: 'error', message: 'Cannot perform validation.' });
    }
  }, [getCurrentJsonData, schema]); // Add schema to dependencies

  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        Text View of JSON File
      </Typography>
      <Button variant="contained" onClick={handleRefreshClick} style={{ marginBottom: '10px' }}>
        Show/Refresh JSON & Validate
      </Button>

      {/* Display Validation Result */}
      {validationResult && (
        <Alert severity={validationResult.type} style={{ marginBottom: '10px' }}>
          {validationResult.message}
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        rows={18} // Adjusted rows slightly
        value={displayedJson} // Use local state
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
      />
    </Box>
  );
};

export default JsonText;
