import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Tabs, Tab, IconButton
} from '@mui/material';
import Ajv from 'ajv';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Constants (fieldOptions, outputTypeOptions) remain the same
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];
// Define output file type options based on schema
const outputTypeOptions = ['nsdf', 'hdf5', 'tsv', 'csv', 'xml'];


const createNewOutputFile = () => ({
    file: '', // Required: Output filename
    type: outputTypeOptions[0], // Required: File type enum
    path: '', // Required: Data source path
    field: fieldOptions[0], // Required: Data source field
    dt: '0.1', // Required: Sampling interval (number), User requested default 0.1
    relpath: '', // Optional
    flushSteps: '1', // Optional (integer)
});



// Component signature already includes getCurrentJsonData from your provided file
const FileMenuBox = ({ setJsonContent, onConfigurationChange, getCurrentJsonData }) => {
    // States for "Save Model"
    const [modelFileName, setModelFileName] = useState('model');
    const [modelFileType, setModelFileType] = useState('json');

    // State for managing the 'files' array
    const [outputFiles, setOutputFiles] = useState([createNewOutputFile()]);
    const [activeOutputFileIndex, setActiveOutputFileIndex] = useState(0);

    const fileInputRef = useRef();

    // validateJson remains the same
    const validateJson = (jsonContent) => {
        // Note: Using require might not work in all environments (e.g., browser builds without specific config)
        // Consider fetching or importing the schema differently if needed.
        try {
            // Assuming schema file is correctly located relative to this file
            const schema = require('../../rdesigneurSchema.json');
            const ajv = new Ajv();
            const validate = ajv.compile(schema);
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
    };

    // --- UPDATED handleSaveModel with showSaveFilePicker ---
    const handleSaveModel = async () => { // Make function async
        // Check if the function to get data is provided
        if (!getCurrentJsonData) {
            alert("Error: Cannot access current JSON data to save.");
            console.error("handleSaveModel: getCurrentJsonData prop is missing.");
            return;
        }
        const currentJsonData = getCurrentJsonData();
        if (!currentJsonData) {
            alert("Error: No JSON data available to save.");
            console.error("handleSaveModel: getCurrentJsonData returned null or undefined.");
            return;
        }

        // Only handle JSON saving for now
        if (modelFileType !== 'json') {
             alert(`Saving as type '${modelFileType}' is not currently supported by this function. Please select JSON.`);
             return;
        }

        const jsonDataString = JSON.stringify(currentJsonData, null, 2);
        const suggestedName = `${modelFileName || 'model'}.json`;
        const blob = new Blob([jsonDataString], { type: 'application/json' });

        // Try using the File System Access API (showSaveFilePicker)
        if (window.showSaveFilePicker) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });

                // Create a FileSystemWritableFileStream to write to.
                const writableStream = await fileHandle.createWritable();

                // Write the blob to the stream
                await writableStream.write(blob);

                // Close the file and write the contents to disk.
                await writableStream.close();
                console.log('File saved successfully using showSaveFilePicker.');

            } catch (err) {
                // Handle errors, user cancellation is common
                if (err.name === 'AbortError') {
                    console.log('User cancelled the save dialog.');
                } else {
                    console.error('Error saving file with showSaveFilePicker:', err);
                    alert(`Could not save file: ${err.message}`);
                    // Optionally fall back to the old method here if desired on error
                    // fallbackSave(blob, suggestedName); // Need to define fallbackSave if used here
                }
            }
        } else {
            // Fallback for browsers that don't support showSaveFilePicker
            console.warn("showSaveFilePicker is not supported, using fallback download method.");
            try {
                 const link = document.createElement('a');
                 link.href = URL.createObjectURL(blob);
                 link.download = suggestedName; // Use the suggested name for download
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 // Revoke the object URL after a short delay
                 setTimeout(() => URL.revokeObjectURL(link.href), 100);
                 console.log('File download initiated using fallback method.');
            } catch (fallbackErr) {
                 console.error('Error during fallback save:', fallbackErr);
                 alert(`Could not initiate file download: ${fallbackErr.message}`);
            }
        }
    };
    // --- END UPDATED handleSaveModel ---


    // handleLoadModel remains the same as in your provided file
    const handleLoadModel = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            try {
                const jsonData = JSON.parse(fileContent);
                if (validateJson(jsonData)) {
                    // Propagate the loaded and validated content string upwards
                    if (setJsonContent) {
                         setJsonContent(JSON.stringify(jsonData, null, 2));
                    }
                     console.log('Loaded Model:', jsonData);
                }
            } catch (error) {
                alert('Error parsing model file: ' + error.message);
                console.error('Error parsing model file:', error);
            }
        };
        reader.readAsText(file);
         // Reset file input value so onChange fires again for the same file
         if (fileInputRef.current) {
             fileInputRef.current.value = '';
         }
    };

    // Handlers for Output Files remain the same
    const addOutputFile = useCallback(() => {
        setOutputFiles((prev) => [...prev, createNewOutputFile()]);
        setActiveOutputFileIndex(outputFiles.length);
    }, [outputFiles.length]);
    const removeOutputFile = useCallback((indexToRemove) => {
        setOutputFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveOutputFileIndex((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

     const updateOutputFile = useCallback((index, key, value) => {
        setOutputFiles((prevFiles) =>
            prevFiles.map((fileEntry, i) =>
                i === index ? { ...fileEntry, [key]: value } : fileEntry
            )
        );
        // useEffect below handles calling onConfigurationChange
    }, []);

    // Format 'files' Data (getFileData) remains the same
     const getFileData = useCallback(() => {
        return outputFiles.map(fileState => {
             // Basic validation: Check required fields
             if (!fileState.file || !fileState.type || !fileState.path || !fileState.field || !fileState.dt) {
                 console.warn("Skipping file entry due to missing required fields (file, type, path, field, dt):", fileState);
                 return null; // Skip invalid configurations
             }
             const dtNum = parseFloat(fileState.dt);
             const flushStepsInt = parseInt(fileState.flushSteps, 10);

              // Check if dt is valid number > 0
             if (isNaN(dtNum) || dtNum <= 0) {
                 console.warn("Skipping file entry due to invalid dt:", fileState);
                 return null;
             }
             // Check if flushSteps is valid integer >= 1 if provided
             if (fileState.flushSteps && (isNaN(flushStepsInt) || flushStepsInt < 1)) {
                  console.warn("Skipping file entry due to invalid flushSteps:", fileState);
                 return null;
             }

            const fileSchemaItem = {
                file: fileState.file,
                type: fileState.type,
                path: fileState.path,
                field: fileState.field,
                dt: dtNum, // Convert to number
                 // Optional fields included only if valid/non-default
                ...(fileState.relpath && { relpath: fileState.relpath }),
                ...( (!isNaN(flushStepsInt) && flushStepsInt > 1) && { flushSteps: flushStepsInt }), // Only include if > 1
            };
             return fileSchemaItem;

        }).filter(item => item !== null); // Filter out invalid entries
    }, [outputFiles]); // Depends on outputFiles state

     // useEffect hook remains the same
     useEffect(() => {
        if (onConfigurationChange) {
            const fileData = getFileData();
            onConfigurationChange({ files: fileData }); // Pass array under 'files' key
        }
    }, [outputFiles, getFileData, onConfigurationChange]); // Dependencies


    // --- JSX Rendering (remains the same as your provided file, but Save button calls new handleSaveModel) ---
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
                        onClick={handleSaveModel}> {/* This button triggers the updated function */}
                        Save Model Config As...
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

             {/* === Files Output Configuration Section === */}
            <Typography variant="h6" gutterBottom>Define Simulation Output Files</Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeOutputFileIndex} onChange={(e, nv) => setActiveOutputFileIndex(nv)} variant="scrollable" scrollButtons="auto" aria-label="Output file configurations">
                     {outputFiles.map((fileEntry, index) => (
                         <Tab key={index} label={fileEntry.file || `File ${index + 1}`} />
                     ))}
                     <IconButton onClick={addOutputFile} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                  </Tabs>
              </Box>

              {/* Output File Tab Content */}
              {outputFiles.length > 0 && activeOutputFileIndex < outputFiles.length && outputFiles[activeOutputFileIndex] && (
                  <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                       <Grid container spacing={1.5}>
                            {/* Row 1: Filename, Type */}
                           <Grid item xs={12} sm={7}>
                               <TextField fullWidth size="small" label="Output Filename (e.g., output.h5)" required value={outputFiles[activeOutputFileIndex].file}
                                   onChange={(e) => updateOutputFile(activeOutputFileIndex, 'file', e.target.value)} />
                           </Grid>
                            <Grid item xs={12} sm={5}>
                               <TextField select fullWidth size="small" label="File Type" required value={outputFiles[activeOutputFileIndex].type}
                                   onChange={(e) => updateOutputFile(activeOutputFileIndex, 'type', e.target.value)}>
                                   {outputTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                               </TextField>
                           </Grid>
                           {/* Row 2: Path, Field */}
                           <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Data Source Path" required value={outputFiles[activeOutputFileIndex].path}
                                    onChange={(e) => updateOutputFile(activeOutputFileIndex, 'path', e.target.value)} />
                           </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select fullWidth size="small" label="Data Source Field" required value={outputFiles[activeOutputFileIndex].field}
                                    onChange={(e) => updateOutputFile(activeOutputFileIndex, 'field', e.target.value)}>
                                     <MenuItem value=""><em>Select Field...</em></MenuItem>
                                     {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </TextField>
                           </Grid>
                           {/* Row 3: Dt, RelPath */}
                             <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Sampling Interval dt (s)" required type="number" value={outputFiles[activeOutputFileIndex].dt}
                                    onChange={(e) => updateOutputFile(activeOutputFileIndex, 'dt', e.target.value)} InputProps={{ inputProps: { min: 1e-7, step: 0.01 } }}/>
                           </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Relative Path (Optional)" value={outputFiles[activeOutputFileIndex].relpath}
                                    onChange={(e) => updateOutputFile(activeOutputFileIndex, 'relpath', e.target.value)} />
                           </Grid>
                             {/* Row 4: Flush Steps */}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Flush Steps (Optional, >=1)" type="number" value={outputFiles[activeOutputFileIndex].flushSteps}
                                    onChange={(e) => updateOutputFile(activeOutputFileIndex, 'flushSteps', e.target.value)} InputProps={{ inputProps: { min: 1, step: 1 } }}/>
                           </Grid>
                      </Grid>

                      {/* Remove File Button */}
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeOutputFile(activeOutputFileIndex)} sx={{ marginTop: '16px' }}>
                         Remove Output File {activeOutputFileIndex + 1}
                     </Button>
                  </Box>
             )}
              {outputFiles.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No simulation output files defined.</Typography>}

        </Box>
    );
};

export default FileMenuBox;
