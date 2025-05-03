import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Tabs, Tab, IconButton,
    FormHelperText // Import FormHelperText for warnings
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Constants
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit' // Added nInit based on instructions
];
// Define output file type options based on schema
const outputTypeOptions = ['nsdf', 'hdf5', 'tsv', 'csv', 'xml'];

// --- ADDED: Define which fields are considered chemical fields ---
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// --- UPDATED: Default state creator ---
const createNewOutputFile = () => ({
    file: '', // Required: Output filename
    type: outputTypeOptions[0], // Required: File type enum
    path: '', // Required: Data source path
    field: fieldOptions[0], // Required: Data source field
    dt: '0.1', // Required: Sampling interval (number)
    // Replace relpath with chemProto and childPath
    chemProto: '.', // Default for non-chem fields
    childPath: '',
    flushSteps: '1', // Optional (integer)
});

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};


// --- UPDATED: Component signature to accept getChemProtos ---
const SimOutputMenuBox = ({ onConfigurationChange, currentConfig = [], getChemProtos }) => {

    // --- UPDATED: Initialize state from props ---
    const initializeFiles = useCallback(() => {
        const defaults = createNewOutputFile();
        if (Array.isArray(currentConfig) && currentConfig.length > 0) {
            return currentConfig.map(file => {
                const field = file.field || fieldOptions[0];
                const isChemField = chemFields.includes(field);
                let initialChemProto = '.'; // Default for non-chem
                let initialChildPath = '';

                // Parse relpath based on isChemField (Instruction 8)
                if (isChemField) {
                    const relpath = file.relpath || '';
                    const slashIndex = relpath.indexOf('/');
                    if (slashIndex !== -1) {
                        initialChemProto = relpath.substring(0, slashIndex);
                        initialChildPath = relpath.substring(slashIndex + 1);
                    } else {
                        console.warn(`SimOutputMenuBox Init: Chem field '${field}' found but relpath '${relpath}' missing '/' separator. Assigning to Child Path.`);
                        initialChemProto = ''; // Default to empty, user needs to select
                        initialChildPath = relpath;
                    }
                } else {
                    // Not a chem field, relpath goes directly to childPath
                    initialChildPath = file.relpath || ''; // Assign relpath directly
                }

                return {
                    file: file.file || '',
                    type: file.type || outputTypeOptions[0],
                    path: file.path || '',
                    field: field,
                    dt: safeToString(file.dt, defaults.dt),
                    chemProto: initialChemProto, // Use parsed value
                    childPath: initialChildPath, // Use parsed value
                    flushSteps: safeToString(file.flushSteps, defaults.flushSteps),
                };
            });
        }
        return [createNewOutputFile()]; // Default if no valid config passed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentConfig]); // Rerun initialization if currentConfig changes


    // State for managing the 'files' array
    const [outputFiles, setOutputFiles] = useState(initializeFiles);
    const [activeOutputFileIndex, setActiveOutputFileIndex] = useState(0);

    // --- ADDED: Ref for getChemProtos ---
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);


    // --- Handlers for Output Files ---
    const addOutputFile = useCallback(() => {
        setOutputFiles((prev) => [...prev, createNewOutputFile()]);
        setActiveOutputFileIndex(outputFiles.length);
    }, [outputFiles.length]);

    const removeOutputFile = useCallback((indexToRemove) => {
        setOutputFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveOutputFileIndex((prev) => {
            if (prev === indexToRemove) {
                return Math.max(0, prev - 1);
            } else if (prev > indexToRemove) {
                return prev - 1;
            }
            return prev;
        });
    }, []);

    // --- UPDATED: updateOutputFile handler ---
     const updateOutputFile = useCallback((index, key, value) => {
        setOutputFiles((prevFiles) =>
            prevFiles.map((fileEntry, i) => {
                if (i === index) {
                     const updatedFile = { ...fileEntry, [key]: value };
                     // --- ADDED: Reset chemProto if field changes ---
                     if (key === 'field') {
                         const isNowChem = chemFields.includes(value);
                         const wasChem = chemFields.includes(fileEntry.field);
                         if (wasChem && !isNowChem) {
                             updatedFile.chemProto = '.'; // Reset proto to default non-chem value
                             // Keep childPath as it might still be relevant
                         } else if (!wasChem && isNowChem) {
                             updatedFile.chemProto = ''; // Reset proto to empty for chem field selection
                         }
                     }
                     return updatedFile;
                }
                return fileEntry;
            })
        );
    }, []);


    // --- UPDATED: Format 'files' Data for JSON output ---
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

             // Determine if the current field is a chemical field (Instruction 2)
             const isChemField = chemFields.includes(fileState.field);
             let relpathValue = undefined;

             // Construct relpath based on isChemField (Instruction 7)
             if (isChemField) {
                 // Instruction 5: Both are required if isChemField
                 if (fileState.chemProto && fileState.childPath) {
                     relpathValue = `${fileState.chemProto}/${fileState.childPath}`; // Instruction 7.1
                 } else {
                     console.warn(`Skipping output file '${fileState.file}' with chem field '${fileState.field}' due to missing Chem Prototype or Child Object Path:`, fileState);
                     return null; // Validation fail
                 }
             } else {
                 // Instruction 7.2: Use childPath if not empty
                 if (fileState.childPath && fileState.childPath !== '') {
                      relpathValue = fileState.childPath;
                 }
                  // Ensure non-chem fields don't use the default '.' proto value for relpath
                  if (fileState.chemProto !== '.') {
                      console.warn(`SimOutputMenuBox Save: Non-chemical field '${fileState.field}' unexpectedly has chemProto '${fileState.chemProto}'. Ignoring proto.`);
                  }
             }

            // Base schema item
            const fileSchemaItem = {
                file: fileState.file,
                type: fileState.type,
                path: fileState.path,
                field: fileState.field,
                dt: dtNum, // Convert to number
            };

            // Add optional fields
            if (relpathValue !== undefined) {
                 fileSchemaItem.relpath = relpathValue;
            }
            if (!isNaN(flushStepsInt) && flushStepsInt >= 1 && String(fileState.flushSteps).trim() !== '') {
                 fileSchemaItem.flushSteps = flushStepsInt;
            }

             return fileSchemaItem;

        }).filter(item => item !== null); // Filter out invalid entries
    }, [outputFiles]); // Correctly depends on outputFiles state


     // useEffect hook to report changes upstream (no change needed here)
     useEffect(() => {
        if (onConfigurationChange) {
            const fileData = getFileData();
            onConfigurationChange({ files: fileData }); // Pass array under 'files' key
        }
    }, [outputFiles, getFileData, onConfigurationChange]); // Dependencies


    // --- JSX Rendering ---
    // --- ADDED: Get available chem protos ---
    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];

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
             {outputFiles.length > 0 && activeOutputFileIndex >= 0 && activeOutputFileIndex < outputFiles.length && outputFiles[activeOutputFileIndex] && (() => {
                 // Determine if the current field is chemical (Instruction 2)
                 const currentFile = outputFiles[activeOutputFileIndex];
                 const isChemField = chemFields.includes(currentFile.field);
                 const chemProtosAvailable = availableChemProtos.length > 0;
                 const showChemProtoWarning = isChemField && !chemProtosAvailable; // Instruction 4

                 return (
                     <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                         <Grid container spacing={1.5}>
                             {/* Row 1: Filename, Type */}
                             <Grid item xs={12} sm={7}>
                                 <TextField fullWidth size="small" label="Output Filename (e.g., output.h5)" required value={currentFile.file}
                                     onChange={(e) => updateOutputFile(activeOutputFileIndex, 'file', e.target.value)} />
                             </Grid>
                             <Grid item xs={12} sm={5}>
                                 <TextField select fullWidth size="small" label="File Type" required value={currentFile.type}
                                     onChange={(e) => updateOutputFile(activeOutputFileIndex, 'type', e.target.value)}>
                                     {outputTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                 </TextField>
                             </Grid>

                             {/* Row 2: Path, Field */}
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Data Source Path" required value={currentFile.path}
                                     onChange={(e) => updateOutputFile(activeOutputFileIndex, 'path', e.target.value)} />
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                 <TextField select fullWidth size="small" label="Data Source Field" required value={currentFile.field}
                                     onChange={(e) => updateOutputFile(activeOutputFileIndex, 'field', e.target.value)}>
                                     <MenuItem value=""><em>Select Field...</em></MenuItem>
                                     {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                 </TextField>
                             </Grid>

                             {/* --- UPDATED Row 3: Conditional Path Inputs (Instruction 3) --- */}
                              {isChemField ? (
                                  <>
                                      {/* Case: isChemField is TRUE */}
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              select
                                              fullWidth
                                              size="small"
                                              label="Chem Prototype"
                                              required // Instruction 5
                                              value={currentFile.chemProto}
                                              onChange={(e) => updateOutputFile(activeOutputFileIndex, 'chemProto', e.target.value)}
                                              error={showChemProtoWarning || !currentFile.chemProto} // Highlight if warning or empty
                                              helperText={showChemProtoWarning ? "Warning: No Chem Prototypes defined in Signaling." : (!currentFile.chemProto ? "Required" : "")} // Instruction 4 warning
                                          >
                                              <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                              {/* Instruction 4: Options from getChemProtos */}
                                              {availableChemProtos.map(protoName => (
                                                  <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>
                                              ))}
                                          </TextField>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              fullWidth
                                              size="small"
                                              label="Child Object Path"
                                              required // Instruction 5
                                              value={currentFile.childPath}
                                              onChange={(e) => updateOutputFile(activeOutputFileIndex, 'childPath', e.target.value)}
                                              error={!currentFile.childPath} // Highlight if empty
                                              helperText={!currentFile.childPath ? "Required" : ""}
                                          />
                                      </Grid>
                                  </>
                              ) : (
                                  <>
                                      {/* Case: isChemField is FALSE */}
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              select
                                              fullWidth
                                              disabled // Only '.' allowed
                                              size="small"
                                              label="Chem Prototype"
                                              value={currentFile.chemProto} // Should be '.'
                                              onChange={(e) => updateOutputFile(activeOutputFileIndex, 'chemProto', e.target.value)} // Keep handler for consistency
                                          >
                                              {/* Instruction 4: Only '.' allowed */}
                                              <MenuItem value=".">.</MenuItem>
                                          </TextField>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              fullWidth
                                              size="small"
                                              label="Relative Path (Optional)" // Label change
                                              value={currentFile.childPath}
                                              onChange={(e) => updateOutputFile(activeOutputFileIndex, 'childPath', e.target.value)}
                                          />
                                      </Grid>
                                  </>
                              )}
                              {/* --- END UPDATED Row 3 --- */}

                             {/* Row 4: Dt, Flush Steps */}
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Sampling Interval dt (s)" required type="number" value={currentFile.dt}
                                     onChange={(e) => updateOutputFile(activeOutputFileIndex, 'dt', e.target.value)} InputProps={{ inputProps: { min: 1e-7, step: 0.01 } }}/>
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Flush Steps (Optional, >=1)" type="number" value={currentFile.flushSteps}
                                     onChange={(e) => updateOutputFile(activeOutputFileIndex, 'flushSteps', e.target.value)} InputProps={{ inputProps: { min: 1, step: 1 } }}/>
                             </Grid>
                         </Grid>

                         {/* Remove File Button */}
                         <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeOutputFile(activeOutputFileIndex)} sx={{ marginTop: '16px' }}>
                             Remove Output File {activeOutputFileIndex + 1}
                         </Button>
                     </Box>
                 );
             })()}
             {outputFiles.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No simulation output files defined.</Typography>}
        </Box>
    );
};

export default SimOutputMenuBox;

