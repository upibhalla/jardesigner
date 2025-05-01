import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Define fieldOptions and typeOptions outside
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];
const typeOptions = ['Field', 'Periodic Synapse', 'Random Synapse'];

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default state for a new stim entry in the component
const createDefaultStim = () => ({
    path: '',
    field: fieldOptions[0], // Default field
    relativePath: '.',
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

// Accept currentConfig prop (should be jsonData.stims array)
const StimMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [stims, setStims] = useState(() => {
        console.log("StimMenuBox: Initializing stims from props", currentConfig);
        const initialStims = currentConfig?.map(s => ({
            path: s.path || '',
            field: s.field || fieldOptions[0], // Populate field if present
            relativePath: s.relpath || '.',
            geometryExpression: s.geomExpr || '1',
            stimulusExpression: s.expr || '',
            type: mapSchemaTypeToComponent(s.type), // Map schema type back
            weight: safeToString(s.weight, '1.0'), // Populate weight if present
        })) || [];
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


    // --- Handlers ONLY update LOCAL state ---
    const addStim = useCallback(() => {
        setStims((prev) => [...prev, createDefaultStim()]);
        setActiveStim(stimsRef.current.length); // Use ref for correct length before state update
    }, []); // No dependency needed

    const removeStim = useCallback((indexToRemove) => {
        setStims((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveStim((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []); // No dependency needed

    const updateStim = useCallback((index, key, value) => {
         console.log(`StimMenuBox: Local state change - Index ${index}, Key ${key}: ${value}`);
        setStims((prevStims) =>
            prevStims.map((stim, i) =>
                i === index ? { ...stim, [key]: value } : stim
            )
        );
    }, []); // No dependency needed
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getStimDataForUnmount = () => {
        const currentStims = stimsRef.current; // Use ref for latest state
        console.log("StimMenuBox: Formatting final local state for push:", currentStims);

        return currentStims.map(stimState => {
            let schemaType = 'field'; // Default schema type
            if (stimState.type === 'Periodic Synapse') schemaType = 'periodicsyn';
            if (stimState.type === 'Random Synapse') schemaType = 'randsyn';

            const stimSchemaItemBase = {
                type: schemaType,
                path: stimState.path || "",
                ...(stimState.relativePath && stimState.relativePath !== '.' && { relpath: stimState.relativePath }),
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
                 // Check required fields for synapse types
                 if (!stimSchemaItemBase.path || isNaN(weightNum) || !stimSchemaItemBase.expr || !stimState.relativePath) { // Use stimState.relativePath for check
                     console.warn(`Skipping '${schemaType}' stim due to missing required fields (path, relpath, weight, expr):`, stimState);
                     return null;
                 }
                 stimSchemaItemBase.weight = weightNum;
                  // Ensure relpath is present for synapse types, even if default '.'
                 if (!stimSchemaItemBase.relpath) stimSchemaItemBase.relpath = '.';
            }
            return stimSchemaItemBase;
        }).filter(item => item !== null); // Filter out invalid entries
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("StimMenuBox: Mounted, setting up unmount cleanup.");
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("StimMenuBox: Unmounting, pushing final state up.");
                const configData = getStimDataForUnmount();
                latestOnConfigurationChange({ stims: configData }); // Pass array under 'stims' key
            } else {
                console.warn("StimMenuBox: onConfigurationChange not available on unmount.");
            }
        };
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (uses local state) ---
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
              {stims.length > 0 && activeStim < stims.length && stims[activeStim] && (
                  <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                      <Grid container spacing={1.5}>
                           {/* Row 1: Path, Type */}
                          <Grid item xs={12} sm={6}>
                              <TextField fullWidth size="small" label="Path" required value={stims[activeStim].path}
                                  onChange={(e) => updateStim(activeStim, 'path', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                               <TextField select fullWidth size="small" label="Type" required value={stims[activeStim].type}
                                  onChange={(e) => updateStim(activeStim, 'type', e.target.value)}>
                                   {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                               </TextField>
                          </Grid>

                           {/* Row 2: Conditionally show Field or Weight, plus RelPath */}
                           <Grid item xs={12} sm={6}>
                               {stims[activeStim].type === 'Field' ? (
                                    <TextField select fullWidth size="small" label="Field (for Type='Field')" required={stims[activeStim].type === 'Field'} value={stims[activeStim].field}
                                        onChange={(e) => updateStim(activeStim, 'field', e.target.value)}>
                                         <MenuItem value=""><em>Select Field...</em></MenuItem>
                                        {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                    </TextField>
                               ) : (
                                     <TextField fullWidth size="small" label="Weight (for Synapse Types)" type="number" required={stims[activeStim].type !== 'Field'} value={stims[activeStim].weight}
                                        onChange={(e) => updateStim(activeStim, 'weight', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }}/>
                               )}
                           </Grid>
                           <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Relative Path (Optional for Field, Required for Synapse)"
                                   required={stims[activeStim].type !== 'Field'} // Required for syn types in schema
                                   value={stims[activeStim].relativePath}
                                   onChange={(e) => updateStim(activeStim, 'relativePath', e.target.value)} />
                           </Grid>

                            {/* Row 3: GeomExpr, StimExpr */}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Geometry Expr (Optional)" defaultValue="1" value={stims[activeStim].geometryExpression}
                                    onChange={(e) => updateStim(activeStim, 'geometryExpression', e.target.value)} />
                            </Grid>
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Stimulus Expr (Required)" required value={stims[activeStim].stimulusExpression}
                                    onChange={(e) => updateStim(activeStim, 'stimulusExpression', e.target.value)} />
                            </Grid>
                      </Grid>

                      {/* Remove Stim Button */}
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeStim(activeStim)} sx={{ marginTop: '16px' }}>
                          Remove Stim {activeStim + 1}
                      </Button>
                  </Box>
             )}
              {stims.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No stimuli defined.</Typography>}
        </Box>
    );
};

export default StimMenuBox;
