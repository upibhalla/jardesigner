import React, { useState, useEffect, useCallback } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';

// Define fieldOptions outside the component to avoid re-creation on render
// This resolves the useCallback dependency warning from the previous step.
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];

// Initial state for a new adaptor entry
const createNewAdaptor = () => ({
    source: '', // Required
    sourceField: fieldOptions[0], // Default to first field option, Required
    destination: '', // Required -> dest
    destinationField: fieldOptions[0], // Default to first field option, Required -> destField
    baseline: '0.0', // Required (number)
    slope: '1.0', // Required (number)
});


const AdaptorsMenuBox = ({ onConfigurationChange }) => { // Accept prop
    // State for Adaptors
    const [adaptors, setAdaptors] = useState([createNewAdaptor()]); // Start with one default adaptor
    const [activeAdaptor, setActiveAdaptor] = useState(0);

    // --- Adaptor Handlers ---
    const addAdaptor = useCallback(() => {
        setAdaptors((prev) => [...prev, createNewAdaptor()]);
        setActiveAdaptor(adaptors.length);
    }, [adaptors.length]); // fieldOptions is now stable, no need to include

    const removeAdaptor = useCallback((indexToRemove) => {
        setAdaptors((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveAdaptor((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateAdaptor = useCallback((index, key, value) => {
        setAdaptors((prevAdaptors) =>
            prevAdaptors.map((adaptor, i) =>
                i === index ? { ...adaptor, [key]: value } : adaptor
            )
        );
        // useEffect below handles calling onConfigurationChange
    }, []);


    // --- NEW: Format Data for Schema ---
    const getAdaptorData = useCallback(() => {
        return adaptors.map(adaptorState => {
             // Basic validation: Ensure required fields have values
             if (!adaptorState.source || !adaptorState.sourceField || !adaptorState.destination || !adaptorState.destinationField) {
                 console.warn("Skipping adaptor due to missing required fields (source/dest path or field):", adaptorState);
                 return null; // Skip invalid adaptor configurations
             }
             const baselineNum = parseFloat(adaptorState.baseline);
             const slopeNum = parseFloat(adaptorState.slope);

             // Check if baseline and slope are valid numbers
             if (isNaN(baselineNum) || isNaN(slopeNum)) {
                 console.warn("Skipping adaptor due to invalid baseline or slope:", adaptorState);
                 return null; // Skip if conversion fails
             }

            // Convert state values to schema format
            const adaptorSchemaItem = {
                source: adaptorState.source,
                sourceField: adaptorState.sourceField,
                dest: adaptorState.destination, // Map key: destination -> dest
                destField: adaptorState.destinationField, // Map key: destinationField -> destField
                baseline: baselineNum, // Convert to number
                slope: slopeNum, // Convert to number
            };
            return adaptorSchemaItem;

        }).filter(item => item !== null); // Filter out invalid entries

    }, [adaptors]); // Depends on adaptors state

    // --- NEW: useEffect to call the prop when adaptors state changes ---
    useEffect(() => {
        if (onConfigurationChange) {
            const adaptorData = getAdaptorData();
            onConfigurationChange({ adaptors: adaptorData }); // Pass array under 'adaptors' key
        }
    }, [adaptors, getAdaptorData, onConfigurationChange]); // Dependencies
    // --- END NEW ---


    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Adaptors Configuration</Typography>

            {/* Adaptor Tabs */}
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeAdaptor} onChange={(e, nv) => setActiveAdaptor(nv)} variant="scrollable" scrollButtons="auto" aria-label="Adaptor configurations">
                    {adaptors.map((adaptor, index) => (
                         // Improve tab label
                        <Tab key={index} label={`${adaptor.sourceField || '?'} -> ${adaptor.destinationField || '?'}`} />
                    ))}
                     <IconButton onClick={addAdaptor} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>

            {/* Adaptor Tab Content */}
             {adaptors.length > 0 && activeAdaptor < adaptors.length && adaptors[activeAdaptor] && (
                 <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={1.5}>
                          {/* Left Column: Source, Source Field, Baseline */}
                         <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Source Path" required value={adaptors[activeAdaptor].source}
                                 onChange={(e) => updateAdaptor(activeAdaptor, 'source', e.target.value)} sx={{ mb: 1 }}/>
                             <TextField select fullWidth size="small" label="Source Field" required value={adaptors[activeAdaptor].sourceField}
                                 onChange={(e) => updateAdaptor(activeAdaptor, 'sourceField', e.target.value)} sx={{ mb: 1 }}>
                                 {fieldOptions.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                             </TextField>
                             <TextField fullWidth size="small" label="Baseline" required type="number" value={adaptors[activeAdaptor].baseline}
                                 onChange={(e) => updateAdaptor(activeAdaptor, 'baseline', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }}/>
                         </Grid>
                          {/* Right Column: Destination, Destination Field, Slope */}
                         <Grid item xs={12} sm={6}>
                              <TextField fullWidth size="small" label="Destination Path (dest)" required value={adaptors[activeAdaptor].destination}
                                 onChange={(e) => updateAdaptor(activeAdaptor, 'destination', e.target.value)} sx={{ mb: 1 }}/>
                              <TextField select fullWidth size="small" label="Destination Field (destField)" required value={adaptors[activeAdaptor].destinationField}
                                 onChange={(e) => updateAdaptor(activeAdaptor, 'destinationField', e.target.value)} sx={{ mb: 1 }}>
                                  {fieldOptions.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                              </TextField>
                              <TextField fullWidth size="small" label="Slope" required type="number" value={adaptors[activeAdaptor].slope}
                                 onChange={(e) => updateAdaptor(activeAdaptor, 'slope', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }}/>
                         </Grid>
                     </Grid>

                     {/* Remove Adaptor Button */}
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeAdaptor(activeAdaptor)} sx={{ marginTop: '16px' }}>
                         Remove Adaptor {activeAdaptor + 1}
                     </Button>
                 </Box>
            )}
             {adaptors.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No adaptors defined.</Typography>}
        </Box>
    );
};

export default AdaptorsMenuBox;
