import React, { useState, useEffect, useCallback } from 'react';
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

// --- NEW: Helper function to map component type to schema source string ---
const getChemSourceString = (componentType) => {
    switch (componentType) {
        case 'Oscillator': return 'makeChemOscillator()';
        case 'Bistable':   return 'makeChemBistable()';
        case 'LTP':        return 'makeChemLTP()';
        case 'STP':        return 'makeChemSTP()';
        case 'betaAd':     return 'makeChemBetaAR()'; // Added
        case 'mGluR':      return 'makeChem_mGluR()'; // Added
        case 'EGFR':       return 'makeChemEGFR()';   // Added
        case 'CaMKII':     return 'makeChemCaMKII()'; // Added
        // For SBML, kkit, User Func, In-memory, the source is handled differently
        // Return the type itself as a fallback for unmapped built-ins
        default:           return componentType;
    }
};
// --- END NEW HELPER ---

// --- UPDATED: Dropdown options list including new types ---
// Define prototype type options outside the component
const prototypeTypeOptions = [
    'Oscillator', 'Bistable', 'LTP', 'STP', 'betaAd', 'mGluR', 'EGFR', 'CaMKII', // Added new types
    'SBML', 'kkit', 'User Func', 'In-memory' // Existing types requiring source input
];
// --- END UPDATED ---


// Initial state creators
const createNewChemPrototype = () => {
    const defaultType = prototypeTypeOptions[0]; // Use the first option
    return {
        type: defaultType, // Component's internal type
        name: defaultType, // Default name matches type initially
        file: '', // Potentially used by 'User Func' if source is a file path
        source: '', // Used for SBML, kkit, User Func, In-memory
        manualName: false, // Flag for custom naming
    };
};

const createNewChemDistribution = () => ({
    prototype: '', // Name of a defined prototype
    location: 'Dendrite', // Component location maps to schema type
    path: 'soma', // Default path
});


const ChemMenuBox = ({ onConfigurationChange }) => { // Accept prop
    // State for Prototypes
    const [prototypes, setPrototypes] = useState([createNewChemPrototype()]); // Start with one
    const [activePrototype, setActivePrototype] = useState(0);

    // State for Distributions
    const [distributions, setDistributions] = useState([createNewChemDistribution()]); // Start with one
    const [activeDistribution, setActiveDistribution] = useState(0);

    // --- Prototype Handlers ---
    const addPrototype = useCallback(() => {
        setPrototypes((prev) => [...prev, createNewChemPrototype()]);
        setActivePrototype(prototypes.length);
    }, [prototypes.length]);

    const removePrototype = useCallback((indexToRemove) => {
        const removedProtoName = prototypes[indexToRemove]?.name;
        setPrototypes((prev) => prev.filter((_, i) => i !== indexToRemove));
        // Also remove/reset distributions using this prototype
        setDistributions(prevDists => prevDists.map(dist =>
            dist.prototype === removedProtoName ? { ...dist, prototype: '' } : dist
        ));
        setActivePrototype((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, [prototypes]); // Depends on prototypes to get name

    const updatePrototype = useCallback((index, key, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) => {
                if (i === index) {
                    const updatedProto = { ...proto, [key]: value };
                    // Automatically update Prototype Name from Type, unless manually overridden
                    if (key === 'type' && !updatedProto.manualName) {
                        updatedProto.name = value; // Set name = type
                    }
                    // Clear source field if type is changed to one that doesn't use it
                    if (key === 'type' && !['SBML', 'kkit', 'User Func', 'In-memory'].includes(value)) {
                         updatedProto.source = '';
                    }
                    return updatedProto;
                }
                return proto;
            })
        );
    }, []);

    // Handle setting a custom Prototype Name, marks it as manual
    const setCustomPrototypeName = useCallback((index, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) =>
                i === index ? { ...proto, name: value, manualName: true } : proto
            )
        );
    }, []);


    // --- Distribution Handlers ---
    const addDistribution = useCallback(() => {
        setDistributions((prev) => [...prev, createNewChemDistribution()]);
        setActiveDistribution(distributions.length);
    }, [distributions.length]);

    const removeDistribution = useCallback((indexToRemove) => {
        setDistributions((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveDistribution((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateDistribution = useCallback((index, key, value) => {
        setDistributions((prevDists) =>
            prevDists.map((dist, i) =>
                i === index ? { ...dist, [key]: value } : dist
            )
        );
    }, []);


    // --- MODIFIED: Format Data for Schema with new source mapping ---
    const getChemData = useCallback(() => {
        // Format Prototypes
        const chemProtoData = prototypes.map(protoState => {
            let schemaType = "builtin"; // Default schema type
            let schemaSource = ""; // Initialize source

            const componentType = protoState.type;

            // Map component types requiring source input to schema types/sources
            if (componentType === 'SBML') { schemaType = 'sbml'; schemaSource = protoState.source; }
            else if (componentType === 'kkit') { schemaType = 'kkit'; schemaSource = protoState.source; }
            else if (componentType === 'In-memory') { schemaType = 'in_memory'; schemaSource = protoState.source; }
            else if (componentType === 'User Func') {
                // Schema doesn't explicitly list 'func', map to 'builtin' and use source
                schemaType = 'builtin'; // Or handle as error/omit if schema strict
                schemaSource = protoState.source || protoState.name; // Use source field or name
            } else {
                // For other types (Oscillator, Bistable, LTP, STP, betaAd, etc.),
                // schema type is 'builtin', use helper for source string
                schemaType = 'builtin';
                schemaSource = getChemSourceString(componentType);
            }

            // Validate required fields (name is always required)
            if (!protoState.name) {
                 console.warn("Skipping prototype due to missing name:", protoState);
                 return null;
            }
            // Validate source if required by schema type
            if (['sbml', 'kkit', 'in_memory'].includes(schemaType) && !schemaSource) {
                 console.warn(`Source field is required for prototype '${protoState.name}' of type '${schemaType}' but is empty.`);
                 return null; // Skip invalid prototype
            }
            // Ensure source is not empty even for builtins (should be function call string)
             if (schemaType === 'builtin' && !schemaSource) {
                  console.warn(`Could not determine source string for builtin prototype '${protoState.name}' of type '${componentType}'.`);
                  return null; // Skip invalid prototype
             }


            return {
                type: schemaType,
                source: schemaSource, // Use mapped or direct source
                name: protoState.name, // Use custom name or default name
            };
        }).filter(p => p !== null); // Filter out skipped prototypes

        // Format Distributions (logic remains the same)
        const chemDistribData = distributions.map(distState => {
            // Map component location to schema type
            let schemaDistribType = distState.location?.toLowerCase() || 'dend';
            if (distState.location === 'Presyn_spine') schemaDistribType = 'presyn_spine';
            if (distState.location === 'Presyn_dend') schemaDistribType = 'presyn_dend';

            // Ensure prototype name exists in the valid prototypes list
            const selectedProtoExists = chemProtoData.some(p => p.name === distState.prototype);

            if (!selectedProtoExists || !distState.prototype || !distState.path || !schemaDistribType) {
                 console.warn("Skipping chem distribution due to missing/invalid prototype, path, or location:", distState);
                 return null;
             }

            return {
                proto: distState.prototype,
                path: distState.path,
                type: schemaDistribType,
            };
        }).filter(item => item !== null);

        return { chemProto: chemProtoData, chemDistrib: chemDistribData };

    }, [prototypes, distributions]); // Depends on both state arrays


    // useEffect hook remains the same
    useEffect(() => {
        if (onConfigurationChange) {
            const chemData = getChemData();
            onConfigurationChange(chemData); // Pass object with both keys
        }
    }, [prototypes, distributions, getChemData, onConfigurationChange]);


    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Chemical Signaling Definitions</Typography>

            {/* === Prototypes Section === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Prototypes</Typography>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activePrototype} onChange={(e, nv) => setActivePrototype(nv)} variant="scrollable" scrollButtons="auto" aria-label="Chemical Prototypes">
                    {prototypes.map((p, i) => <Tab key={i} label={p.name || `Proto ${i + 1}`} />)}
                    <IconButton onClick={addPrototype} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                </Tabs>
            </Box>
             {prototypes.length > 0 && activePrototype < prototypes.length && prototypes[activePrototype] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                             {/* UPDATED: Use prototypeTypeOptions for mapping */}
                             <TextField select fullWidth size="small" label="Type" value={prototypes[activePrototype].type}
                                onChange={(e) => updatePrototype(activePrototype, 'type', e.target.value)}>
                                {prototypeTypeOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                            {/* Conditionally show Source field */}
                             {['SBML', 'kkit', 'User Func', 'In-memory'].includes(prototypes[activePrototype].type) && (
                                <TextField fullWidth size="small" label="Source (File/Function/ID)" value={prototypes[activePrototype].source}
                                    onChange={(e) => updatePrototype(activePrototype, 'source', e.target.value)} sx={{ marginTop: '8px' }}
                                    required // Mark as required visually
                                    />
                            )}
                         </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Prototype Name" value={prototypes[activePrototype].name}
                                 onChange={(e) => setCustomPrototypeName(activePrototype, e.target.value)}
                                 helperText="Defaults to Type. Edit for uniqueness." required/>
                         </Grid>
                    </Grid>
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePrototype(activePrototype)} sx={{ marginTop: '16px' }}>
                        Remove Proto '{prototypes[activePrototype].name}'
                    </Button>
                </Box>
            )}
             {prototypes.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No chemical prototypes defined.</Typography>}

             {/* === Distributions Section (JSX remains the same) === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>Distributions</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeDistribution} onChange={(e, nv) => setActiveDistribution(nv)} variant="scrollable" scrollButtons="auto" aria-label="Chemical Distributions">
                     {distributions.map((d, i) => <Tab key={i} label={`${d.prototype || 'Select Proto'} @ ${d.path || '?'}`} />)}
                     <IconButton onClick={addDistribution} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>
            {distributions.length > 0 && activeDistribution < distributions.length && distributions[activeDistribution] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={1.5}>
                         <Grid item xs={12} sm={4}>
                             <TextField select fullWidth size="small" label="Prototype" required value={distributions[activeDistribution].prototype}
                                 onChange={(e) => updateDistribution(activeDistribution, 'prototype', e.target.value)}>
                                <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                {/* Filter prototypes list to show only valid ones */}
                                {prototypes.filter(p => p.name).map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </TextField>
                         </Grid>
                          <Grid item xs={12} sm={4}>
                             <TextField fullWidth size="small" label="Path" required value={distributions[activeDistribution].path}
                                onChange={(e) => updateDistribution(activeDistribution, 'path', e.target.value)} />
                         </Grid>
                          <Grid item xs={12} sm={4}>
                              <TextField select fullWidth size="small" label="Location (-> Type)" required value={distributions[activeDistribution].location}
                                 onChange={(e) => updateDistribution(activeDistribution, 'location', e.target.value)}>
                                 {[ 'Dendrite', 'Spine', 'PSD', 'Endo', 'Presyn_spine', 'Presyn_dend' ]
                                     .map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
                             </TextField>
                          </Grid>
                     </Grid>
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeDistribution(activeDistribution)} sx={{ marginTop: '16px' }}>
                         Remove Distribution {activeDistribution + 1}
                     </Button>
                 </Box>
             )}
             {distributions.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No chemical distributions defined.</Typography>}
        </Box>
    );
};

export default ChemMenuBox;

