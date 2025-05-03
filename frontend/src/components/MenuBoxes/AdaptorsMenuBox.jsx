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

// Define fieldOptions outside the component
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default state for a new adaptor entry in the component
const createDefaultAdaptor = () => ({
    source: '',
    sourceField: fieldOptions[0],
    destination: '', // Component state uses 'destination'
    destinationField: fieldOptions[0], // Component state uses 'destinationField'
    baseline: '0.0',
    slope: '1.0',
});

// Accept currentConfig prop (should be jsonData.adaptors array)
const AdaptorsMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [adaptors, setAdaptors] = useState(() => {
        console.log("AdaptorsMenuBox: Initializing adaptors from props", currentConfig);
        const initialAdaptors = currentConfig?.map(a => ({
            source: a.source || '',
            sourceField: a.sourceField || fieldOptions[0],
            destination: a.dest || '', // Map schema 'dest' back to component 'destination'
            destinationField: a.destField || fieldOptions[0], // Map schema 'destField' back
            baseline: safeToString(a.baseline, createDefaultAdaptor().baseline), // Convert number to string
            slope: safeToString(a.slope, createDefaultAdaptor().slope), // Convert number to string
        })) || [];
        // Ensure there's at least one adaptor entry to start with
        return initialAdaptors.length > 0 ? initialAdaptors : [createDefaultAdaptor()];
    });
    const [activeAdaptor, setActiveAdaptor] = useState(0);
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const adaptorsRef = useRef(adaptors);
    useEffect(() => { adaptorsRef.current = adaptors; }, [adaptors]);


    // --- Handlers ONLY update LOCAL state ---
    const addAdaptor = useCallback(() => {
        setAdaptors((prev) => [...prev, createDefaultAdaptor()]);
        setActiveAdaptor(adaptorsRef.current.length); // Use ref for correct length before state update
    }, []); // No dependency needed

    const removeAdaptor = useCallback((indexToRemove) => {
        setAdaptors((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveAdaptor((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []); // No dependency needed

    const updateAdaptor = useCallback((index, key, value) => {
        console.log(`AdaptorsMenuBox: Local state change - Index ${index}, Key ${key}: ${value}`);
        setAdaptors((prevAdaptors) =>
            prevAdaptors.map((adaptor, i) =>
                i === index ? { ...adaptor, [key]: value } : adaptor
            )
        );
    }, []); // No dependency needed

    const handleTabChange = (event, newValue) => {
        setActiveAdaptor(newValue);
    };
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getAdaptorDataForUnmount = () => {
        const currentAdaptors = adaptorsRef.current; // Use ref for latest state
        console.log("AdaptorsMenuBox: Formatting final local state for push:", currentAdaptors);

        return currentAdaptors.map(adaptorState => {
             // Basic validation
             if (!adaptorState.source || !adaptorState.sourceField || !adaptorState.destination || !adaptorState.destinationField) {
                 console.warn("Skipping adaptor due to missing required fields:", adaptorState);
                 return null;
             }
             const baselineNum = parseFloat(adaptorState.baseline);
             const slopeNum = parseFloat(adaptorState.slope);
             if (isNaN(baselineNum) || isNaN(slopeNum)) {
                 console.warn("Skipping adaptor due to invalid baseline or slope:", adaptorState);
                 return null;
             }

            // Convert state values back to schema format
            const adaptorSchemaItem = {
                source: adaptorState.source,
                sourceField: adaptorState.sourceField,
                dest: adaptorState.destination, // Map component 'destination' back to schema 'dest'
                destField: adaptorState.destinationField, // Map component 'destinationField' back
                baseline: baselineNum, // Convert string to number
                slope: slopeNum, // Convert string to number
            };
            return adaptorSchemaItem;

        }).filter(item => item !== null); // Filter out invalid entries
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("AdaptorsMenuBox: Mounted, setting up unmount cleanup.");
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("AdaptorsMenuBox: Unmounting, pushing final state up.");
                const configData = getAdaptorDataForUnmount();
                latestOnConfigurationChange({ adaptors: configData }); // Pass array under 'adaptors' key
            } else {
                console.warn("AdaptorsMenuBox: onConfigurationChange not available on unmount.");
            }
        };
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (uses local state) ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Adaptors Configuration</Typography>

            {/* Adaptor Tabs */}
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeAdaptor} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" aria-label="Adaptor configurations">
                    {adaptors.map((adaptor, index) => (
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
