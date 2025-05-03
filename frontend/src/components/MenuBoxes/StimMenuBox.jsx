import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton,
    MenuItem,
    Button,
    FormHelperText // Import FormHelperText for warnings
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Define fieldOptions and typeOptions outside
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit' // Added nInit based on instructions
];
const typeOptions = ['Field', 'Periodic Synapse', 'Random Synapse'];

// --- ADDED: Define which fields are considered chemical fields ---
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- UPDATED: Default state for a new stim entry ---
const createDefaultStim = () => ({
    path: '',
    field: fieldOptions[0], // Default field
    // Replace relativePath with chemProto and childPath
    chemProto: '.', // Default for non-chem fields
    childPath: '',
    geometryExpression: '1',
    stimulusExpression: '',
    type: typeOptions[0], // Default type 'Field'
    weight: '1.0',
});

// Helper to map schema type back to component type
const mapSchemaTypeToComponent = (schemaType) => {
    if (schemaType === 'field') return 'Field';
    if (schemaType === 'periodicsyn') return 'Periodic Synapse';
    if (schemaType === 'randsyn') return 'Random Synapse';
    return typeOptions[0]; // Default to 'Field' if unknown
};

// --- UPDATED: Accept getChemProtos prop ---
const StimMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {

    // --- UPDATED: Initialize state from props ---
    const [stims, setStims] = useState(() => {
        console.log("StimMenuBox: Initializing stims from props", currentConfig);
        const initialStims = currentConfig?.map(s => {
            const field = s.field || fieldOptions[0];
            const isChemField = chemFields.includes(field);
            let initialChemProto = '.'; // Default for non-chem
            let initialChildPath = '';

            // Parse relpath based on isChemField (Instruction 8)
            if (isChemField) {
                const relpath = s.relpath || '';
                const slashIndex = relpath.indexOf('/');
                if (slashIndex !== -1) {
                    initialChemProto = relpath.substring(0, slashIndex);
                    initialChildPath = relpath.substring(slashIndex + 1);
                } else {
                    // If no slash, assume it might be just the proto or just the path?
                    // For safety, let's put it in childPath and leave proto empty initially,
                    // requiring user correction if needed. Or assign proto? Let's default proto to empty.
                    console.warn(`StimMenuBox Init: Chem field '${field}' found but relpath '${relpath}' missing '/' separator. Assigning to Child Path.`);
                    initialChemProto = ''; // Or maybe relpath if it's expected to be proto? Needs clarification.
                    initialChildPath = relpath;
                }
            } else {
                // Not a chem field, relpath goes directly to childPath
                initialChildPath = s.relpath || '';
            }

            return {
                path: s.path || '',
                field: field,
                chemProto: initialChemProto, // Use parsed value
                childPath: initialChildPath, // Use parsed value
                geometryExpression: s.geomExpr || '1',
                stimulusExpression: s.expr || '',
                type: mapSchemaTypeToComponent(s.type), // Map schema type back
                weight: safeToString(s.weight, '1.0'), // Populate weight if present
            };
        }) || [];
        // Ensure there's at least one stim entry to start with
        return initialStims.length > 0 ? initialStims : [createDefaultStim()];
    });
    const [activeStim, setActiveStim] = useState(0);
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const stimsRef = useRef(stims);
    useEffect(() => { stimsRef.current = stims; }, [stims]);
    // --- ADDED: Ref for getChemProtos ---
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);


    // --- Handlers ONLY update LOCAL state ---
    const addStim = useCallback(() => {
        setStims((prev) => [...prev, createDefaultStim()]);
        setActiveStim(stimsRef.current.length);
    }, []);

    const removeStim = useCallback((indexToRemove) => {
        setStims((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveStim((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateStim = useCallback((index, key, value) => {
         console.log(`StimMenuBox: Local state change - Index ${index}, Key ${key}: ${value}`);
        setStims((prevStims) =>
            prevStims.map((stim, i) => {
                if (i === index) {
                    const updatedStim = { ...stim, [key]: value };
                    // --- ADDED: Reset chemProto if field changes from chem to non-chem ---
                    if (key === 'field') {
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(stim.field);
                        if (wasChem && !isNowChem) {
                            updatedStim.chemProto = '.'; // Reset proto to default non-chem value
                            // Keep childPath as it might still be relevant
                        } else if (!wasChem && isNowChem) {
                            updatedStim.chemProto = ''; // Reset proto to empty for chem field selection
                        }
                    }
                    return updatedStim;
                }
                return stim;
            })
        );
    }, []);
    // --- END Handlers ---


    // --- UPDATED: Function to format local state for pushing up ---
    const getStimDataForUnmount = () => {
        const currentStims = stimsRef.current; // Use ref for latest state
        console.log("StimMenuBox: Formatting final local state for push:", currentStims);

        return currentStims.map(stimState => {
            let schemaType = 'field'; // Default schema type
            if (stimState.type === 'Periodic Synapse') schemaType = 'periodicsyn';
            if (stimState.type === 'Random Synapse') schemaType = 'randsyn';

            // Determine if the current field is a chemical field (Instruction 2)
            const isChemField = chemFields.includes(stimState.field);
            let relpathValue = undefined;

            // Construct relpath based on isChemField (Instruction 7)
            if (isChemField) {
                // Instruction 5: Both are required if isChemField
                if (stimState.chemProto && stimState.childPath) {
                    relpathValue = `${stimState.chemProto}/${stimState.childPath}`; // Instruction 7.1
                } else {
                    console.warn(`Skipping '${schemaType}' stim with chem field '${stimState.field}' due to missing Chem Prototype or Child Object Path:`, stimState);
                    return null; // Validation fail
                }
            } else {
                // Instruction 7.2: Use childPath if not empty
                if (stimState.childPath && stimState.childPath !== '') {
                     relpathValue = stimState.childPath;
                }
                // Ensure non-chem fields don't use the default '.' proto value for relpath
                if (stimState.chemProto !== '.') {
                    // This case shouldn't happen if state logic is correct, but as a safeguard:
                     console.warn(`StimMenuBox Save: Non-chemical field '${stimState.field}' unexpectedly has chemProto '${stimState.chemProto}'. Ignoring proto.`);
                }
            }

            // Base schema item
            const stimSchemaItemBase = {
                type: schemaType,
                path: stimState.path || "",
                ...(relpathValue !== undefined && { relpath: relpathValue }), // Add relpath if constructed
                ...(stimState.geometryExpression && stimState.geometryExpression !== '1' && { geomExpr: stimState.geometryExpression }),
                expr: stimState.stimulusExpression || "",
            };

            // Add type-specific required fields and perform validation
            if (schemaType === 'field') {
                if (!stimSchemaItemBase.path || !stimState.field || !stimSchemaItemBase.expr) {
                     console.warn("Skipping 'field' stim due to missing required fields (path, field, expr):", stimState);
                     return null;
                }
                stimSchemaItemBase.field = stimState.field;
            } else { // 'periodicsyn' or 'randsyn'
                 const weightNum = parseFloat(stimState.weight);
                 // Synapse types always require a path and relpath (constructed or direct)
                 if (!stimSchemaItemBase.path || isNaN(weightNum) || !stimSchemaItemBase.expr || relpathValue === undefined) {
                     console.warn(`Skipping '${schemaType}' stim due to missing required fields (path, weight, expr, or valid relpath components):`, stimState);
                     return null;
                 }
                 stimSchemaItemBase.weight = weightNum;
            }
            return stimSchemaItemBase;
        }).filter(item => item !== null); // Filter out invalid entries
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("StimMenuBox: Mounted, setting up unmount cleanup.");
         // Store the initial config stringified to compare on unmount
         const initialConfigString = JSON.stringify(currentConfig || []);

        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("StimMenuBox: Unmounting, checking for changes before push.");
                const finalConfigData = getStimDataForUnmount();
                 // Stringify the formatted data for comparison
                 const finalConfigString = JSON.stringify(finalConfigData);

                 // Only push if the data has actually changed
                 if (finalConfigString !== initialConfigString) {
                     console.log("StimMenuBox: Changes detected, pushing final state up.");
                    latestOnConfigurationChange({ stims: finalConfigData }); // Pass array under 'stims' key
                 } else {
                     console.log("StimMenuBox: No changes detected, skipping push on unmount.");
                 }
            } else {
                console.warn("StimMenuBox: onConfigurationChange not available on unmount.");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // IMPORTANT: Empty dependency array


    // --- JSX Rendering (uses local state) ---
    // --- ADDED: Get available chem protos ---
    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];

    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Stimulus Configuration</Typography>

             {/* Stim Tabs */}
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeStim} onChange={(e, nv) => setActiveStim(nv)} variant="scrollable" scrollButtons="auto" aria-label="Stimulus configurations">
                     {stims.map((stim, index) => (
                         <Tab key={index} label={`${stim.type || 'New'} @ ${stim.path || '?'}`} />
                     ))}
                      <IconButton onClick={addStim} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                  </Tabs>
              </Box>

             {/* Stim Tab Content */}
              {stims.length > 0 && activeStim >= 0 && activeStim < stims.length && stims[activeStim] && (() => {
                  // Determine if the current field is chemical (Instruction 2)
                  const currentStim = stims[activeStim];
                  const isChemField = chemFields.includes(currentStim.field);
                  const chemProtosAvailable = availableChemProtos.length > 0;
                  const showChemProtoWarning = isChemField && !chemProtosAvailable; // Instruction 4

                  return (
                      <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                          <Grid container spacing={1.5}>
                              {/* Row 1: Path, Type */}
                              <Grid item xs={12} sm={6}>
                                  <TextField fullWidth size="small" label="Path" required value={currentStim.path}
                                      onChange={(e) => updateStim(activeStim, 'path', e.target.value)} />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                  <TextField select fullWidth size="small" label="Type" required value={currentStim.type}
                                      onChange={(e) => updateStim(activeStim, 'type', e.target.value)}>
                                      {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                  </TextField>
                              </Grid>

                              {/* Row 2: Field (always shown), Conditional Weight */}
                              <Grid item xs={12} sm={6}>
                                  {/* Field is always relevant for determining isChemField */}
                                  <TextField select fullWidth size="small" label="Field" required={currentStim.type === 'Field'} value={currentStim.field}
                                      onChange={(e) => updateStim(activeStim, 'field', e.target.value)}>
                                      <MenuItem value=""><em>Select Field...</em></MenuItem>
                                      {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                  </TextField>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                  {/* Weight only shown for Synapse types */}
                                  {currentStim.type !== 'Field' && (
                                      <TextField fullWidth size="small" label="Weight (for Synapse Types)" type="number" required={currentStim.type !== 'Field'} value={currentStim.weight}
                                          onChange={(e) => updateStim(activeStim, 'weight', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }} />
                                  )}
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
                                              value={currentStim.chemProto}
                                              onChange={(e) => updateStim(activeStim, 'chemProto', e.target.value)}
                                              error={showChemProtoWarning || !currentStim.chemProto} // Highlight if warning or empty
                                              helperText={showChemProtoWarning ? "Warning: No Chem Prototypes defined in Signaling." : (!currentStim.chemProto ? "Required" : "")} // Instruction 4 warning
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
                                              value={currentStim.childPath}
                                              onChange={(e) => updateStim(activeStim, 'childPath', e.target.value)}
                                              error={!currentStim.childPath} // Highlight if empty
                                              helperText={!currentStim.childPath ? "Required" : ""}
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
                                              value={currentStim.chemProto} // Should be '.'
                                              onChange={(e) => updateStim(activeStim, 'chemProto', e.target.value)} // Keep handler for consistency
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
                                              value={currentStim.childPath}
                                              onChange={(e) => updateStim(activeStim, 'childPath', e.target.value)}
                                          />
                                      </Grid>
                                  </>
                              )}
                              {/* --- END UPDATED Row 3 --- */}


                              {/* Row 4: GeomExpr, StimExpr */}
                              <Grid item xs={12} sm={6}>
                                  <TextField fullWidth size="small" label="Geometry Expr (Optional)" defaultValue="1" value={currentStim.geometryExpression}
                                      onChange={(e) => updateStim(activeStim, 'geometryExpression', e.target.value)} />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                  <TextField fullWidth size="small" label="Stimulus Expr (Required)" required value={currentStim.stimulusExpression}
                                      onChange={(e) => updateStim(activeStim, 'stimulusExpression', e.target.value)} />
                              </Grid>
                          </Grid>

                          {/* Remove Stim Button */}
                          <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeStim(activeStim)} sx={{ marginTop: '16px' }}>
                              Remove Stim {activeStim + 1}
                          </Button>
                      </Box>
                  );
              })()}
              {stims.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No stimuli defined.</Typography>}
        </Box>
    );
};

export default StimMenuBox;
