import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Tabs, Tab, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Constants
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

// Component receives onConfigurationChange and optionally currentConfig.files to initialize
const SimOutputMenuBox = ({ onConfigurationChange, currentConfig = [] }) => {
    // Initialize state from currentConfig.files if provided and valid, otherwise default
    const initializeFiles = () => {
        if (Array.isArray(currentConfig) && currentConfig.length > 0) {
            // Convert numbers back to strings for input fields, provide defaults if missing
            return currentConfig.map(file => ({
                file: file.file || '',
                type: file.type || outputTypeOptions[0],
                path: file.path || '',
                field: file.field || fieldOptions[0],
                dt: (file.dt !== undefined && file.dt !== null) ? String(file.dt) : '0.1',
                relpath: file.relpath || '',
                flushSteps: (file.flushSteps !== undefined && file.flushSteps !== null) ? String(file.flushSteps) : '1',
            }));
        }
        return [createNewOutputFile()]; // Default if no valid config passed
    };

    // State for managing the 'files' array
    const [outputFiles, setOutputFiles] = useState(initializeFiles);
    const [activeOutputFileIndex, setActiveOutputFileIndex] = useState(0);

    // --- Handlers for Output Files ---
    const addOutputFile = useCallback(() => {
        setOutputFiles((prev) => [...prev, createNewOutputFile()]);
        // Set active index to the newly added tab
        setActiveOutputFileIndex(outputFiles.length); // Index will be the current length before update
    }, [outputFiles.length]); // Dependency ensures index calculation is based on current length

    const removeOutputFile = useCallback((indexToRemove) => {
        setOutputFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
        // Adjust active index: if it was the removed tab or after, shift left. Stay at 0 if becomes empty.
        setActiveOutputFileIndex((prev) => {
            if (prev === indexToRemove) {
                return Math.max(0, prev - 1); // Go to previous tab, or 0 if first was removed
            } else if (prev > indexToRemove) {
                return prev - 1; // Shift left if an earlier tab was removed
            }
            return prev; // Stay same if a later tab was removed
        });
    }, []); // No dependencies needed as it uses the index passed

     const updateOutputFile = useCallback((index, key, value) => {
        setOutputFiles((prevFiles) =>
            prevFiles.map((fileEntry, i) =>
                i === index ? { ...fileEntry, [key]: value } : fileEntry
            )
        );
    }, []); // No dependencies needed

    // Format 'files' Data for JSON output
     const getFileData = useCallback(() => {
        return outputFiles.map(fileState => {
             // Basic validation: Check required fields
             if (!fileState.file || !fileState.type || !fileState.path || !fileState.field || !fileState.dt) {
                 console.warn("SimOutputMenuBox: Skipping file entry due to missing required fields (file, type, path, field, dt):", fileState);
                 return null; // Skip invalid configurations
             }
             const dtNum = parseFloat(fileState.dt);
             const flushStepsInt = parseInt(fileState.flushSteps, 10);

              // Check if dt is valid number > 0
             if (isNaN(dtNum) || dtNum <= 0) {
                 console.warn("SimOutputMenuBox: Skipping file entry due to invalid dt:", fileState);
                 return null;
             }
             // Check if flushSteps is valid integer >= 1 if provided and not empty/default '1'
             if (fileState.flushSteps && (isNaN(flushStepsInt) || flushStepsInt < 1)) {
                  console.warn("SimOutputMenuBox: Skipping file entry due to invalid flushSteps:", fileState);
                 return null;
             }

            const fileSchemaItem = {
                file: fileState.file,
                type: fileState.type,
                path: fileState.path,
                field: fileState.field,
                dt: dtNum, // Convert to number
                 // Optional fields included only if non-empty/valid
                ...(fileState.relpath && { relpath: fileState.relpath }),
                ...( (!isNaN(flushStepsInt) && flushStepsInt >= 1 && String(fileState.flushSteps).trim() !== '') && { flushSteps: flushStepsInt }), // Include if valid integer >= 1 and not empty
            };
             return fileSchemaItem;

        }).filter(item => item !== null); // Filter out invalid entries
    }, [outputFiles]); // Correctly depends on outputFiles state

     // useEffect hook to report changes upstream
     useEffect(() => {
        if (onConfigurationChange) {
            const fileData = getFileData();
            onConfigurationChange({ files: fileData }); // Pass array under 'files' key
        }
    }, [outputFiles, getFileData, onConfigurationChange]); // Dependencies

    // --- JSX Rendering ---
    return (
        <Box sx={{ mt: 3 }}> {/* Add margin-top for spacing if rendered below FileMenuBox */}
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
             {outputFiles.length > 0 && activeOutputFileIndex >= 0 && activeOutputFileIndex < outputFiles.length && outputFiles[activeOutputFileIndex] && (
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

export default SimOutputMenuBox;
