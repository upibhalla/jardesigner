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
const getChannelSourceString = (componentType) => {
    switch (componentType) {
        case 'Na_HH':   return 'make_HH_Na()';
        case 'Na':      return 'Make_Na()'; // Note: Case difference from user list, assuming this is intended
        case 'KDR_HH':  return 'make_HH_K()';
        case 'KDR':     return 'make_K_DR()'; // Changed from 'K'
        case 'K_A':     return 'make_K_A()';
        case 'Ca':      return 'make_Ca()';
        case 'LCa':     return 'make_LCa()'; // Added
        case 'Ca_conc': return 'make_Ca_conc()';
        case 'K_AHP':   return 'make_K_AHP()'; // Added () for consistency, adjust if needed
        case 'K_C':     return 'make_K_C()';
        case 'gluR':    return 'make_glu()';
        case 'NMDAR':   return 'make_NMDA()';
        case 'GABAR':   return 'make_GABA()'; // Added
        case 'leak':    return 'make_leak()';
        // For 'File' type, the source will be the file path, handled separately
        // For unknown types, maybe return the type itself or an error indicator
        default:        return componentType;
    }
};
// --- END NEW HELPER ---


// --- UPDATED: Dropdown options list ---
// Define prototype type options outside the component
const prototypeTypeOptions = [
    'Na_HH', 'Na', 'KDR_HH', 'KDR', 'K_A', 'Ca', 'LCa', 'Ca_conc',
    'K_AHP', 'K_C', 'gluR', 'NMDAR', 'GABAR', 'leak', 'File'
];
// --- END UPDATED ---


// Initial state creators
const createNewElecPrototype = () => {
    const defaultType = prototypeTypeOptions[0]; // Use the first option from the list
    return {
        type: defaultType,
        name: defaultType, // Default name matches type initially
        file: '', // Only used if type is 'File'
        manualName: false, // Flag for custom naming
    };
};

const createNewElecDistribution = () => ({
    prototype: '', // Name of a defined prototype
    path: 'soma', // Default path
    maxConductance: '1.0', // Gbar (Default, units depend on channel)
    caTau: '0.013', // Tau (Only for Ca_conc, units s)
});


const ElecMenuBox = ({ onConfigurationChange }) => { // Accept prop
    // State for Prototypes
    const [prototypes, setPrototypes] = useState([createNewElecPrototype()]); // Start with one
    const [activePrototype, setActivePrototype] = useState(0);

    // State for Distributions
    const [distributions, setDistributions] = useState([createNewElecDistribution()]); // Start with one
    const [activeDistribution, setActiveDistribution] = useState(0);

    // --- Prototype Handlers ---
    const addPrototype = useCallback(() => {
        setPrototypes((prev) => [...prev, createNewElecPrototype()]);
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
                     // Clear file path if type is changed away from 'File'
                     if (key === 'type' && value !== 'File') {
                         updatedProto.file = '';
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
        setDistributions((prev) => [...prev, createNewElecDistribution()]);
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
    const getElecData = useCallback(() => {
        // Format Prototypes
        const chanProtoData = prototypes.map(protoState => {
            let schemaType = "builtin"; // Default schema type
            let schemaSource = ""; // Initialize source

            if (protoState.type === 'File') {
                schemaType = "neuroml"; // Schema type for file-based
                schemaSource = protoState.file || ""; // Source is the file path
            } else {
                // Use the helper function to get the mapped source string
                schemaSource = getChannelSourceString(protoState.type);
            }

            // Validate required fields
            if (!protoState.name || !schemaSource) {
                 console.warn("Skipping prototype due to missing name or source:", protoState);
                 return null; // Skip invalid prototype
             }


            return {
                type: schemaType,
                source: schemaSource,
                name: protoState.name, // Use custom name or default name
            };
        }).filter(p => p !== null); // Filter out skipped prototypes

        // Format Distributions (logic remains the same)
        const chanDistribData = distributions.map(distState => {
            const distribSchemaItem = {
                proto: distState.prototype || "", // Name from chanProto
                path: distState.path || "soma",
            };

            // Conditionally add Gbar or tau based on the selected prototype name/type
            // IMPORTANT: This relies on finding the *current* prototype definition
            // If a prototype is deleted, distributions using it might become invalid
            const selectedPrototype = prototypes.find(p => p.name === distState.prototype);
            if (selectedPrototype && selectedPrototype.type === 'Ca_conc') {
                 distribSchemaItem.tau = parseFloat(distState.caTau) || 0.013;
            } else {
                 distribSchemaItem.Gbar = parseFloat(distState.maxConductance) || 0;
            }

            // Ensure required fields for distribution are present
             if (!distribSchemaItem.proto || !distribSchemaItem.path) {
                 console.warn("Skipping distribution due to missing prototype or path:", distState);
                 return null; // Skip this entry if essential fields are missing
             }
             // Ensure either Gbar or tau is validly defined
             if (distribSchemaItem.Gbar === undefined && distribSchemaItem.tau === undefined) {
                  console.warn("Skipping distribution due to missing Gbar/tau:", distState);
                  return null;
             }


            return distribSchemaItem;
        }).filter(item => item !== null); // Filter out any null entries skipped above

        return { chanProto: chanProtoData, chanDistrib: chanDistribData };

    }, [prototypes, distributions]); // Depends on both state arrays


    // useEffect hook remains the same
    useEffect(() => {
        if (onConfigurationChange) {
            const elecData = getElecData();
            onConfigurationChange(elecData); // Pass object with both keys
        }
    }, [prototypes, distributions, getElecData, onConfigurationChange]);


    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Channel Definitions</Typography>

            {/* === Prototypes Section === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Prototypes</Typography>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activePrototype} onChange={(e, nv) => setActivePrototype(nv)} variant="scrollable" scrollButtons="auto" aria-label="Channel Prototypes">
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
                            {prototypes[activePrototype].type === 'File' && (
                                <TextField fullWidth size="small" label="NeuroML File (.channel.nml)" value={prototypes[activePrototype].file}
                                    onChange={(e) => updatePrototype(activePrototype, 'file', e.target.value)} sx={{ marginTop: '8px' }} required />
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Prototype Name" value={prototypes[activePrototype].name}
                                 onChange={(e) => setCustomPrototypeName(activePrototype, e.target.value)}
                                 helperText="Defaults to Type. Edit for uniqueness." required />
                        </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePrototype(activePrototype)} sx={{ marginTop: '16px' }}>
                        Remove Proto '{prototypes[activePrototype].name}'
                    </Button>
                </Box>
            )}
            {prototypes.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No channel prototypes defined.</Typography>}


             {/* === Distributions Section (JSX remains the same) === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>Distributions</Typography>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeDistribution} onChange={(e, nv) => setActiveDistribution(nv)} variant="scrollable" scrollButtons="auto" aria-label="Channel Distributions">
                     {distributions.map((d, i) => <Tab key={i} label={`${d.prototype || 'Select Proto'} @ ${d.path || '?'}`} />)}
                     <IconButton onClick={addDistribution} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>
            {distributions.length > 0 && activeDistribution < distributions.length && distributions[activeDistribution] && (
                 <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                             <TextField select fullWidth size="small" label="Prototype" required value={distributions[activeDistribution].prototype}
                                 onChange={(e) => updateDistribution(activeDistribution, 'prototype', e.target.value)}>
                                <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                {prototypes.map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </TextField>
                             <TextField fullWidth size="small" label="Path" required value={distributions[activeDistribution].path}
                                onChange={(e) => updateDistribution(activeDistribution, 'path', e.target.value)} sx={{ marginTop: '8px' }}/>
                         </Grid>
                         <Grid item xs={12} sm={6}>
                             {/* Conditional Input: Gbar or Tau */}
                            {prototypes.find(p => p.name === distributions[activeDistribution].prototype)?.type === 'Ca_conc' ? (
                                 <TextField fullWidth size="small" label="Ca Tau (s)" type="number" required value={distributions[activeDistribution].caTau}
                                    onChange={(e) => updateDistribution(activeDistribution, 'caTau', e.target.value)}
                                    helperText="Time constant for Ca_conc" />
                             ) : (
                                 <TextField fullWidth size="small" label="Gbar (Max Conductance)" type="number" required value={distributions[activeDistribution].maxConductance}
                                    onChange={(e) => updateDistribution(activeDistribution, 'maxConductance', e.target.value)}
                                    helperText="Units depend on channel type" />
                             )}
                        </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeDistribution(activeDistribution)} sx={{ marginTop: '16px' }}>
                         Remove Distribution {activeDistribution + 1}
                     </Button>
                </Box>
             )}
            {distributions.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No channel distributions defined.</Typography>}
        </Box>
    );
};

export default ElecMenuBox;

