import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton, // Keep for AddIcon
    MenuItem,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon

// Define fieldOptions outside the component for stability
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];
// Define typeOptions outside
const typeOptions = ['Field', 'Periodic Synapse', 'Random Synapse'];

// Initial state for a new stim entry
const createNewStim = () => ({
    path: '', // Required
    field: 'Vm', // Required only if type is 'Field'
    relativePath: '.', // Optional -> relpath
    geometryExpression: '1', // Optional -> geomExpr (default '1')
    stimulusExpression: '', // Required -> expr
    type: 'Field', // Component type ('Field', 'Periodic Synapse', 'Random Synapse') -> schema type
    weight: '1.0', // Required only if type is 'Periodic Synapse' or 'Random Synapse'
});


const StimMenuBox = ({ onConfigurationChange }) => { // Accept prop
    const [stims, setStims] = useState([createNewStim()]); // Start with one default stim
    const [activeStim, setActiveStim] = useState(0);


    // --- Stim Handlers ---
    const addStim = useCallback(() => {
        setStims((prev) => [...prev, createNewStim()]);
        setActiveStim(stims.length);
    }, [stims.length]);

    const removeStim = useCallback((indexToRemove) => {
        setStims((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveStim((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateStim = useCallback((index, key, value) => {
        setStims((prevStims) =>
            prevStims.map((stim, i) =>
                i === index ? { ...stim, [key]: value } : stim
            )
        );
        // useEffect below handles calling onConfigurationChange
    }, []);


    // --- NEW: Format Data for Schema ---
    const getStimData = useCallback(() => {
        return stims.map(stimState => {
            let schemaType = 'field'; // Default schema type
            if (stimState.type === 'Periodic Synapse') schemaType = 'periodicsyn';
            if (stimState.type === 'Random Synapse') schemaType = 'randsyn';

            const stimSchemaItemBase = {
                type: schemaType,
                path: stimState.path || "", // Required
                // Optional fields included if not default/empty
                ...(stimState.relativePath && stimState.relativePath !== '.' && { relpath: stimState.relativePath }),
                ...(stimState.geometryExpression && stimState.geometryExpression !== '1' && { geomExpr: stimState.geometryExpression }),
                expr: stimState.stimulusExpression || "", // Required
            };

            // Add type-specific required fields and perform validation
            if (schemaType === 'field') {
                if (!stimSchemaItemBase.path || !stimState.field || !stimSchemaItemBase.expr) {
                     console.warn("Skipping 'field' stim due to missing required fields (path, field, expr):", stimState);
                     return null;
                }
                stimSchemaItemBase.field = stimState.field; // Add field specific to 'field' type
            } else { // 'periodicsyn' or 'randsyn'
                 const weightNum = parseFloat(stimState.weight);
                 if (!stimSchemaItemBase.path || isNaN(weightNum) || !stimSchemaItemBase.expr || !stimSchemaItemBase.relpath) { // relpath also required for syn types
                     console.warn(`Skipping '${schemaType}' stim due to missing required fields (path, relpath, weight, expr):`, stimState);
                     return null;
                 }
                 stimSchemaItemBase.weight = weightNum; // Add weight specific to 'syn' types
                 // Ensure relpath is present, even if default '.'
                 if (!stimSchemaItemBase.relpath) stimSchemaItemBase.relpath = '.';

            }

            return stimSchemaItemBase;

        }).filter(item => item !== null); // Filter out invalid entries

    }, [stims]); // Depends on stims state

    // --- NEW: useEffect to call the prop when stims state changes ---
    useEffect(() => {
        if (onConfigurationChange) {
            const stimData = getStimData();
            onConfigurationChange({ stims: stimData }); // Pass array under 'stims' key
        }
    }, [stims, getStimData, onConfigurationChange]); // Dependencies
    // --- END NEW ---


    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Stimulus Configuration</Typography>

             {/* Stim Tabs */}
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeStim} onChange={(e, nv) => setActiveStim(nv)} variant="scrollable" scrollButtons="auto" aria-label="Stimulus configurations">
                     {stims.map((stim, index) => (
                          // Improve tab label
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
