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

// Helper function to map component type to schema source string
const getChannelSourceString = (componentType) => {
    switch (componentType) {
        case 'Na_HH':   return 'make_HH_Na()';
        case 'Na':      return 'make_Na()';
        case 'KDR_HH':  return 'make_HH_K()';
        case 'KDR':     return 'make_K_DR()';
        case 'K_A':     return 'make_K_A()';
        case 'Ca':      return 'make_Ca()';
        case 'LCa':     return 'make_LCa()';
        case 'Ca_conc': return 'make_Ca_conc()';
        case 'K_AHP':   return 'make_K_AHP()';
        case 'K_C':     return 'make_K_C()';
        case 'gluR':    return 'make_glu()';
        case 'NMDAR':   return 'make_NMDA()';
        case 'GABAR':   return 'make_GABA()';
        case 'leak':    return 'make_leak()';
        default:        return componentType; // Fallback
    }
};

// Define prototype type options outside the component
const prototypeTypeOptions = [
    'Na_HH', 'Na', 'KDR_HH', 'KDR', 'K_A', 'Ca', 'LCa', 'Ca_conc',
    'K_AHP', 'K_C', 'gluR', 'NMDAR', 'GABAR', 'leak', 'File'
];

// Helper to safely convert value to string for text fields
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default states
const createDefaultPrototype = () => ({
    type: prototypeTypeOptions[0],
    name: prototypeTypeOptions[0],
    file: '',
    manualName: false,
});
const createDefaultDistribution = () => ({
    prototype: '',
    path: 'soma',
    maxConductance: '1.0',
    caTau: '0.013',
});


// Accept currentConfig prop: { chanProto: [], chanDistrib: [] }
const ElecMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [prototypes, setPrototypes] = useState(() => {
        const initialProtos = currentConfig?.chanProto?.map(p => {
            // Map schema back to component state structure
            let componentType = p.source; // Default assumption for builtin
            let file = '';
            if (p.type === 'neuroml') {
                componentType = 'File';
                file = p.source || '';
            }
            // Find the matching type display name if possible
            const matchingTypeOption = prototypeTypeOptions.find(opt => getChannelSourceString(opt) === p.source || opt === p.source);
            if (matchingTypeOption && p.type !== 'neuroml') {
                 componentType = matchingTypeOption;
            }

            return {
                type: componentType,
                name: p.name,
                file: file,
                // Assume manual name if name doesn't match type (after mapping)
                manualName: p.name !== componentType,
            };
        }) || [];
        // Ensure there's at least one prototype to start with
        return initialProtos.length > 0 ? initialProtos : [createDefaultPrototype()];
    });

    const [distributions, setDistributions] = useState(() => {
        const initialDists = currentConfig?.chanDistrib?.map(d => ({
            prototype: d.proto,
            path: d.path,
            // Initialize both fields, UI will show the relevant one
            maxConductance: safeToString(d.Gbar, '0'), // Default to '0' if Gbar missing
            caTau: safeToString(d.tau, '0.013'), // Default if tau missing
        })) || [];
         // Ensure there's at least one distribution to start with
        return initialDists.length > 0 ? initialDists : [createDefaultDistribution()];
    });

    const [activePrototype, setActivePrototype] = useState(0);
    const [activeDistribution, setActiveDistribution] = useState(0);
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const prototypesRef = useRef(prototypes);
    useEffect(() => { prototypesRef.current = prototypes; }, [prototypes]);
    const distributionsRef = useRef(distributions);
    useEffect(() => { distributionsRef.current = distributions; }, [distributions]);


    // --- Handlers ONLY update LOCAL state ---
    const addPrototype = useCallback(() => {
        setPrototypes((prev) => [...prev, createDefaultPrototype()]);
        setActivePrototype(prototypes.length); // Use state before update for index
    }, [prototypes]); // Depend on prototypes to get correct length

    const removePrototype = useCallback((indexToRemove) => {
        const removedProtoName = prototypesRef.current[indexToRemove]?.name; // Use ref for latest name
        setPrototypes((prev) => prev.filter((_, i) => i !== indexToRemove));
        // Reset distributions using the removed prototype
        setDistributions(prevDists => prevDists.map(dist =>
            dist.prototype === removedProtoName ? { ...dist, prototype: '' } : dist
        ));
        setActivePrototype((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []); // No external dependencies needed

    const updatePrototype = useCallback((index, key, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) => {
                if (i === index) {
                    const updatedProto = { ...proto, [key]: value };
                    if (key === 'type' && !updatedProto.manualName) {
                        updatedProto.name = value;
                    }
                    if (key === 'type' && value !== 'File') {
                        updatedProto.file = '';
                    }
                    return updatedProto;
                }
                return proto;
            })
        );
    }, []);

    const setCustomPrototypeName = useCallback((index, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) =>
                i === index ? { ...proto, name: value, manualName: true } : proto
            )
        );
    }, []);

    const addDistribution = useCallback(() => {
        setDistributions((prev) => [...prev, createDefaultDistribution()]);
        setActiveDistribution(distributions.length); // Use state before update
    }, [distributions]); // Depend on distributions to get correct length

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
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getElecDataForUnmount = () => {
        // Use refs to get latest state
        const currentPrototypes = prototypesRef.current;
        const currentDistributions = distributionsRef.current;
        console.log("ElecMenuBox: Formatting final local state for push:", { prototypes: currentPrototypes, distributions: currentDistributions });

        // Format Prototypes (same logic as before, but using refs)
        const chanProtoData = currentPrototypes.map(protoState => {
            let schemaType = "builtin";
            let schemaSource = "";
            if (protoState.type === 'File') {
                schemaType = "neuroml";
                schemaSource = protoState.file || "";
            } else {
                schemaSource = getChannelSourceString(protoState.type);
            }
            if (!protoState.name || !schemaSource) { return null; } // Basic validation
            return { type: schemaType, source: schemaSource, name: protoState.name };
        }).filter(p => p !== null);

        // Format Distributions (same logic as before, but using refs)
        const chanDistribData = currentDistributions.map(distState => {
            const distribSchemaItem = { proto: distState.prototype || "", path: distState.path || "soma" };
            const selectedPrototype = currentPrototypes.find(p => p.name === distState.prototype); // Find in current prototypes ref

            if (selectedPrototype && selectedPrototype.type === 'Ca_conc') {
                 distribSchemaItem.tau = parseFloat(distState.caTau) || 0.013;
            } else {
                 distribSchemaItem.Gbar = parseFloat(distState.maxConductance) || 0;
            }
            if (!distribSchemaItem.proto || !distribSchemaItem.path || (distribSchemaItem.Gbar === undefined && distribSchemaItem.tau === undefined)) {
                 return null; // Validation
             }
            return distribSchemaItem;
        }).filter(item => item !== null);

        return { chanProto: chanProtoData, chanDistrib: chanDistribData };
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("ElecMenuBox: Mounted, setting up unmount cleanup.");
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("ElecMenuBox: Unmounting, pushing final state up.");
                const configData = getElecDataForUnmount();
                latestOnConfigurationChange(configData);
            } else {
                console.warn("ElecMenuBox: onConfigurationChange not available on unmount.");
            }
        };
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (uses local state) ---
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


             {/* === Distributions Section === */}
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
                                {/* Filter prototype list to show only valid ones */}
                                {prototypes.filter(p => p.name).map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </TextField>
                             <TextField fullWidth size="small" label="Path" required value={distributions[activeDistribution].path}
                                onChange={(e) => updateDistribution(activeDistribution, 'path', e.target.value)} sx={{ marginTop: '8px' }}/>
                         </Grid>
                         <Grid item xs={12} sm={6}>
                             {/* Conditional Input: Gbar or Tau */}
                             {/* Find prototype based on SELECTED name in the distribution state */}
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
