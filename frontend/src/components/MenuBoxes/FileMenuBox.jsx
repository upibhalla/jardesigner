import React, { useState, useRef } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem
} from '@mui/material';
import Ajv from 'ajv';
// Schema might be needed for validation during load
// import schema from '../../rdesigneurSchema.json'; // Adjust path if needed

// Component signature includes setJsonContent and getCurrentJsonData
const FileMenuBox = ({ setJsonContent, getCurrentJsonData }) => {
    // States for "Save Model"
    const [modelFileName, setModelFileName] = useState('model');
    const [modelFileType, setModelFileType] = useState('json'); // Currently only supports JSON

    const fileInputRef = useRef();

    // Validate JSON structure (optional, but good practice)
    const validateJson = (jsonContent) => {
        // Simple check if it's an object
        if (typeof jsonContent !== 'object' || jsonContent === null) {
            alert('Invalid JSON structure: Not an object.');
            return false;
        }
        // Add schema validation if needed (requires schema import)
        /*
        try {
            const ajv = new Ajv();
            const validate = ajv.compile(schema); // Make sure schema is imported
            const valid = validate(jsonContent);

            if (!valid) {
                console.error('Schema Validation errors:', validate.errors);
                alert(`Invalid JSON structure:\n${ajv.errorsText(validate.errors)}`);
                return false;
            }
            return true;
        } catch (error) {
             console.error("Error loading or compiling schema:", error);
             alert("Could not load or compile the JSON schema for validation.");
             return false; // Cannot validate
        }
        */
       return true; // Basic validation passed
    };

    // --- handleSaveModel using showSaveFilePicker with fallback ---
    const handleSaveModel = async () => {
        if (!getCurrentJsonData) {
            alert("Error: Cannot access current JSON data to save.");
            console.error("FileMenuBox: getCurrentJsonData prop is missing.");
            return;
        }
        const currentJsonData = getCurrentJsonData();
        if (!currentJsonData) {
            alert("Error: No JSON data available to save.");
            console.error("FileMenuBox: getCurrentJsonData returned null or undefined.");
            return;
        }

        if (modelFileType !== 'json') {
             alert(`Saving as type '${modelFileType}' is not currently supported. Please select JSON.`);
             return;
        }

        const jsonDataString = JSON.stringify(currentJsonData, null, 2);
        const suggestedName = `${modelFileName || 'model'}.json`;
        const blob = new Blob([jsonDataString], { type: 'application/json' });

        // Try using the File System Access API
        if (window.showSaveFilePicker) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writableStream = await fileHandle.createWritable();
                await writableStream.write(blob);
                await writableStream.close();
                console.log('File saved successfully using showSaveFilePicker.');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file with showSaveFilePicker:', err);
                    alert(`Could not save file using Save As dialog: ${err.message}`);
                } else {
                    console.log('User cancelled the save dialog.');
                }
            }
        } else {
            // Fallback download method
            console.warn("showSaveFilePicker is not supported, using fallback download.");
            try {
                 const link = document.createElement('a');
                 link.href = URL.createObjectURL(blob);
                 link.download = suggestedName;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 setTimeout(() => URL.revokeObjectURL(link.href), 100);
                 console.log('File download initiated using fallback method.');
            } catch (fallbackErr) {
                 console.error('Error during fallback save:', fallbackErr);
                 alert(`Could not initiate file download: ${fallbackErr.message}`);
            }
        }
    };

    // handleLoadModel - Loads, validates, and updates the parent state
    const handleLoadModel = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            try {
                const jsonData = JSON.parse(fileContent);
                // Validate the structure before updating
                if (validateJson(jsonData)) {
                    if (setJsonContent) {
                         // Pass the raw string content up for the parent to handle parsing and state update
                         setJsonContent(fileContent);
                    }
                     console.log('Loaded Model Content Sent to App:', jsonData);
                }
            } catch (error) {
                alert('Error parsing model file: ' + error.message);
                console.error('Error parsing model file:', error);
            }
        };
        reader.readAsText(file);
         // Reset file input to allow loading the same file again
         if (fileInputRef.current) {
             fileInputRef.current.value = '';
         }
    };

    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            {/* === Save Model Section === */}
            <Typography variant="h6" gutterBottom>Save Current Model Config</Typography>
            <Grid container spacing={1.5} sx={{ mb: 3, p: 1.5, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                 <Grid item xs={12} sm={7}>
                    <TextField fullWidth size="small" label="Suggested File Name" value={modelFileName}
                        onChange={(e) => setModelFileName(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={5}>
                     <TextField select fullWidth size="small" label="File Type (JSON only)" value={modelFileType}
                         onChange={(e) => setModelFileType(e.target.value)} disabled>
                         <MenuItem value="json">JSON</MenuItem>
                     </TextField>
                 </Grid>
                 <Grid item xs={12}>
                    <Button variant="contained" fullWidth sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={handleSaveModel}>
                        Save Model (.json)
                    </Button>
                </Grid>
            </Grid>

            {/* === Load Model Section === */}
            <Typography variant="h6" gutterBottom>Load Model Config</Typography>
             <Grid container spacing={1.5} sx={{ mb: 3, p: 1.5, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                 <Grid item xs={12}>
                    <Button variant="contained" fullWidth sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={() => fileInputRef.current?.click()}>
                        Load Model Config (.json)
                    </Button>
                     <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoadModel} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default FileMenuBox;
