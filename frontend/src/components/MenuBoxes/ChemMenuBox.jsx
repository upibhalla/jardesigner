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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper function to map component type to schema source string
const getChemSourceString = (componentType) => {
    switch (componentType) {
        case 'Oscillator': return 'makeChemOscillator()';
        case 'Bistable':   return 'makeChemBistable()';
        case 'LTP':        return 'makeChemLTP()';
        case 'STP':        return 'makeChemSTP()';
        case 'betaAd':     return 'makeChemBetaAR()';
        case 'mGluR':      return 'makeChem_mGluR()';
        case 'EGFR':       return 'makeChemEGFR()';
        case 'CaMKII':     return 'makeChemCaMKII()';
        // For SBML, kkit, User Func, In-memory, the source is handled differently
        default:           return componentType; // Fallback
    }
};

// Helper to map schema type/source back to component type display name
const getComponentTypeFromSchema = (schemaType, schemaSource) => {
    if (schemaType === 'sbml') return 'SBML';
    if (schemaType === 'kkit') return 'kkit';
    if (schemaType === 'in_memory') return 'In-memory';
    // For builtins, try to find the matching option based on source string
    const options = prototypeTypeOptions.filter(opt => !['SBML', 'kkit', 'User Func', 'In-memory'].includes(opt));
    const match = options.find(opt => getChemSourceString(opt) === schemaSource || opt === schemaSource);
    if (match) return match;
    // Fallback for 'User Func' or unknown builtins
    if (schemaSource && schemaSource.includes('Func')) return 'User Func'; // Heuristic
    return schemaSource || 'Unknown'; // Fallback
};


// Define prototype type options outside the component
const prototypeTypeOptions = [
    'Oscillator', 'Bistable', 'LTP', 'STP', 'betaAd', 'mGluR', 'EGFR', 'CaMKII',
    'SBML', 'kkit', 'User Func', 'In-memory'
];

// Define location options with display names
const locationOptions = [
    'Dendrite', 'Spine', 'PSD', 'Endo', 'Presyn_spine', 'Presyn_dend'
];

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default state creators
const createDefaultChemPrototype = () => ({
    type: prototypeTypeOptions[0],
    name: prototypeTypeOptions[0],
    file: '', // Not directly used unless type is 'User Func' and source is file
    source: '', // For SBML, kkit, etc.
    manualName: false,
});
const createDefaultChemDistribution = () => ({
    prototype: '',
    location: locationOptions[0], // Use display name default
    path: 'soma',
    diffusionLength_um: '', // Initialize diffusion length (in um) as empty string
});


// Accept currentConfig prop: { chemProto: [], chemDistrib: [] }
const ChemMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [prototypes, setPrototypes] = useState(() => {
        console.log("ChemMenuBox: Initializing prototypes from props", currentConfig?.chemProto);
        const initialProtos = currentConfig?.chemProto?.map(p => {
            const componentType = getComponentTypeFromSchema(p.type, p.source);
            let sourceValue = '';
            // Only populate source field if it's relevant for the component type
            if (['SBML', 'kkit', 'User Func', 'In-memory'].includes(componentType)) {
                sourceValue = p.source || '';
            }
            return {
                type: componentType,
                name: p.name,
                file: '', // File isn't directly stored in schema this way
                source: sourceValue,
                // Check if the loaded name is different from the *derived* component type name
                manualName: p.name !== componentType,
            };
        }) || [];
        return initialProtos.length > 0 ? initialProtos : [createDefaultChemPrototype()];
    });

    const [distributions, setDistributions] = useState(() => {
        console.log("ChemMenuBox: Initializing distributions from props", currentConfig?.chemDistrib);
        // Map schema type back to component location display name
        const mapSchemaDistribTypeToLocation = (type) => {
            switch(type) {
                case 'dend': return 'Dendrite';
                case 'spine': return 'Spine';
                case 'psd': return 'PSD';
                case 'endo': return 'Endo';
                case 'presyn_spine': return 'Presyn_spine';
                case 'presyn_dend': return 'Presyn_dend';
                default:
                    console.warn(`ChemMenuBox: Unknown distribution type '${type}' found in config, defaulting to 'Dendrite'.`);
                    return 'Dendrite'; // Fallback
            }
        };
        const initialDists = currentConfig?.chemDistrib?.map(d => {
            // Convert diffusionLength from meters (schema) to micrometers (state)
            let diffusionLength_um = ''; // Default to empty string
            if (d.diffusionLength !== undefined && d.diffusionLength !== null && !isNaN(Number(d.diffusionLength))) {
                diffusionLength_um = String(Number(d.diffusionLength) * 1e6); // Convert m to µm
            }

            return {
                prototype: d.proto,
                location: mapSchemaDistribTypeToLocation(d.type), // Use the mapping function
                path: d.path,
                diffusionLength_um: diffusionLength_um, // Store converted value or default
            };
        }) || [];
        return initialDists.length > 0 ? initialDists : [createDefaultChemDistribution()];
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
        setPrototypes((prev) => [...prev, createDefaultChemPrototype()]);
        setActivePrototype(prototypesRef.current.length); // Use ref
    }, []);

    const removePrototype = useCallback((indexToRemove) => {
        const currentPrototypes = prototypesRef.current;
        const removedProtoName = currentPrototypes[indexToRemove]?.name;
        setPrototypes((prev) => prev.filter((_, i) => i !== indexToRemove));
        // Reset distributions using the removed prototype
        setDistributions(prevDists => prevDists.map(dist =>
            dist.prototype === removedProtoName ? { ...dist, prototype: '' } : dist
        ));
        setActivePrototype((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updatePrototype = useCallback((index, key, value) => {
        console.log(`ChemMenuBox Proto: Local state change - Index ${index}, Key ${key}: ${value}`);
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) => {
                if (i === index) {
                    const updatedProto = { ...proto, [key]: value };
                    // If type changes, update name ONLY if manualName is false
                    if (key === 'type' && !updatedProto.manualName) {
                        updatedProto.name = value; // Update name to match new type
                    }
                    // If type changes and it's not one requiring a source, clear source
                    if (key === 'type' && !['SBML', 'kkit', 'User Func', 'In-memory'].includes(value)) {
                         updatedProto.source = '';
                    }
                    return updatedProto;
                }
                return proto;
            })
        );
    }, []);

    // Handler specifically for when the name is manually edited
    const setCustomPrototypeName = useCallback((index, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) =>
                i === index ? { ...proto, name: value, manualName: true } : proto // Set manualName flag
            )
        );
    }, []);

    const addDistribution = useCallback(() => {
        setDistributions((prev) => [...prev, createDefaultChemDistribution()]);
        setActiveDistribution(distributionsRef.current.length); // Use ref
    }, []);

    const removeDistribution = useCallback((indexToRemove) => {
        setDistributions((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveDistribution((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateDistribution = useCallback((index, key, value) => {
        console.log(`ChemMenuBox Distrib: Local state change - Index ${index}, Key ${key}: ${value}`);
        setDistributions((prevDists) =>
            prevDists.map((dist, i) =>
                i === index ? { ...dist, [key]: value } : dist
            )
        );
    }, []);
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getChemDataForUnmount = () => {
        const currentPrototypes = prototypesRef.current;
        const currentDistributions = distributionsRef.current;
        console.log("ChemMenuBox: Formatting final local state for push:", { prototypes: currentPrototypes, distributions: currentDistributions });

        // Format Prototypes
        const chemProtoData = currentPrototypes.map(protoState => {
            let schemaType = "builtin";
            let schemaSource = "";
            const componentType = protoState.type;

            if (componentType === 'SBML') { schemaType = 'sbml'; schemaSource = protoState.source; }
            else if (componentType === 'kkit') { schemaType = 'kkit'; schemaSource = protoState.source; }
            else if (componentType === 'In-memory') { schemaType = 'in_memory'; schemaSource = protoState.source; }
            else if (componentType === 'User Func') {
                schemaType = 'builtin'; // Or 'func' if schema supported it
                schemaSource = protoState.source || protoState.name;
            } else {
                schemaType = 'builtin';
                schemaSource = getChemSourceString(componentType);
            }

            // Basic Validation
            if (!protoState.name) { console.warn("Skipping chem prototype due to missing name:", protoState); return null; }
            if (['sbml', 'kkit', 'in_memory'].includes(schemaType) && !schemaSource) { console.warn(`Skipping chem prototype '${protoState.name}' due to missing source for type '${schemaType}':`, protoState); return null; }
            if (componentType === 'User Func' && !protoState.source) { console.warn(`Skipping chem prototype '${protoState.name}' due to missing source for type 'User Func':`, protoState); return null; }
            if (schemaType === 'builtin' && !schemaSource && componentType !== 'User Func') { console.warn(`Skipping chem prototype '${protoState.name}' because source couldn't be determined for type '${componentType}':`, protoState); return null; }

            return { type: schemaType, source: schemaSource, name: protoState.name };
        }).filter(p => p !== null);

        // Format Distributions
        const chemDistribData = currentDistributions.map(distState => {
            // Map display location name back to schema type value
            let schemaDistribType = 'dend'; // Default
            switch(distState.location) {
                case 'Dendrite': schemaDistribType = 'dend'; break;
                case 'Spine': schemaDistribType = 'spine'; break;
                case 'PSD': schemaDistribType = 'psd'; break;
                case 'Endo': schemaDistribType = 'endo'; break;
                case 'Presyn_spine': schemaDistribType = 'presyn_spine'; break;
                case 'Presyn_dend': schemaDistribType = 'presyn_dend'; break;
                default:
                    console.warn(`ChemMenuBox: Unknown location '${distState.location}' during save, defaulting to 'dend'.`);
                    schemaDistribType = 'dend';
            }

            // Ensure prototype name exists in the *valid* list being saved
            const selectedProtoExists = chemProtoData.some(p => p.name === distState.prototype);

            if (!selectedProtoExists || !distState.prototype || !distState.path) {
                 console.warn("Skipping chem distribution due to missing/invalid prototype reference or path:", distState);
                 return null;
             }

            // Handle diffusionLength conversion (µm -> m) and optional inclusion
            const length_um_str = distState.diffusionLength_um;
            let diffusionLengthProp = {}; // Empty object if not valid or not provided
            if (length_um_str !== undefined && length_um_str !== null && length_um_str.trim() !== '') {
                const length_um = parseFloat(length_um_str);
                if (!isNaN(length_um) && length_um >= 0) {
                    const length_m = length_um * 1e-6; // Convert µm to m
                    diffusionLengthProp = { diffusionLength: length_m }; // Property to be added
                } else {
                     console.warn(`ChemMenuBox: Invalid diffusion length value '${length_um_str}' for distribution with proto '${distState.prototype}', skipping field.`);
                }
            }


            // Combine base properties with the optional diffusionLength
            return {
                proto: distState.prototype,
                path: distState.path,
                type: schemaDistribType,
                ...diffusionLengthProp // Spread the diffusionLength property if valid, otherwise spreads nothing
            };
        }).filter(item => item !== null);

        return { chemProto: chemProtoData, chemDistrib: chemDistribData };
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("ChemMenuBox: Mounted, setting up unmount cleanup.");
        // Store the initial config stringified to compare on unmount
        const initialConfigString = JSON.stringify({
             chemProto: currentConfig?.chemProto || [],
             chemDistrib: currentConfig?.chemDistrib || []
        });

        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("ChemMenuBox: Unmounting, checking for changes before push.");
                const finalConfigData = getChemDataForUnmount();
                const finalConfigString = JSON.stringify(finalConfigData);

                // Only push if the data has actually changed from initial load
                if (finalConfigString !== initialConfigString) {
                    console.log("ChemMenuBox: Changes detected, pushing final state up.");
                    latestOnConfigurationChange(finalConfigData); // Push object with both keys
                } else {
                    console.log("ChemMenuBox: No changes detected, skipping push on unmount.");
                }
            } else {
                console.warn("ChemMenuBox: onConfigurationChange not available on unmount.");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // IMPORTANT: Empty dependency array


    // --- JSX Rendering (uses local state) ---
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
             {prototypes.length > 0 && activePrototype >= 0 && activePrototype < prototypes.length && prototypes[activePrototype] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                             <TextField select fullWidth size="small" label="Type" value={prototypes[activePrototype].type}
                                onChange={(e) => updatePrototype(activePrototype, 'type', e.target.value)}>
                                {prototypeTypeOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                            {/* Conditionally show Source field */}
                             {['SBML', 'kkit', 'User Func', 'In-memory'].includes(prototypes[activePrototype].type) && (
                                <TextField fullWidth size="small" label="Source (File/Function/ID)" value={prototypes[activePrototype].source}
                                    onChange={(e) => updatePrototype(activePrototype, 'source', e.target.value)} sx={{ marginTop: '8px' }}
                                    required // Mark as required visually
                                    helperText={prototypes[activePrototype].type === 'User Func' ? "e.g., my_func or path/to/file.py" : "e.g., path/to/model.xml or ID"}
                                    />
                            )}
                         </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Prototype Name" value={prototypes[activePrototype].name}
                                 onChange={(e) => setCustomPrototypeName(activePrototype, e.target.value)} // Use specific handler
                                 helperText="Defaults to Type. Edit for uniqueness." required/>
                         </Grid>
                    </Grid>
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePrototype(activePrototype)} sx={{ marginTop: '16px' }}>
                        Remove Proto '{prototypes[activePrototype].name}'
                    </Button>
                </Box>
            )}
             {prototypes.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No chemical prototypes defined.</Typography>}

             {/* === Distributions Section === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>Distributions</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeDistribution} onChange={(e, nv) => setActiveDistribution(nv)} variant="scrollable" scrollButtons="auto" aria-label="Chemical Distributions">
                     {distributions.map((d, i) => <Tab key={i} label={`${d.prototype || 'Select Proto'} @ ${d.path || '?'}`} />)}
                     <IconButton onClick={addDistribution} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>
            {distributions.length > 0 && activeDistribution >= 0 && activeDistribution < distributions.length && distributions[activeDistribution] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     {/* --- UPDATED Grid layout for two rows --- */}
                     <Grid container spacing={1.5}>
                         {/* Row 1: Prototype & Path */}
                         <Grid item xs={12} sm={6}> {/* Takes half width on small screens and up */}
                             <TextField select fullWidth size="small" label="Prototype" required value={distributions[activeDistribution].prototype}
                                 onChange={(e) => updateDistribution(activeDistribution, 'prototype', e.target.value)}>
                                <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                {prototypes.filter(p => p.name).map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </TextField>
                         </Grid>
                          <Grid item xs={12} sm={6}> {/* Takes half width on small screens and up */}
                             <TextField fullWidth size="small" label="Path" required value={distributions[activeDistribution].path}
                                onChange={(e) => updateDistribution(activeDistribution, 'path', e.target.value)} />
                         </Grid>

                         {/* Row 2: Location & Diffusion Length */}
                          <Grid item xs={12} sm={6}> {/* Takes half width on small screens and up */}
                              <TextField select fullWidth size="small" label="Location (-> Type)" required value={distributions[activeDistribution].location}
                                 onChange={(e) => updateDistribution(activeDistribution, 'location', e.target.value)}>
                                 {locationOptions.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
                             </TextField>
                          </Grid>
                          <Grid item xs={12} sm={6}> {/* Takes half width on small screens and up */}
                              <TextField
                                  fullWidth
                                  size="small"
                                  label="Diffusion Length (µm)"
                                  type="number"
                                  value={distributions[activeDistribution].diffusionLength_um}
                                  onChange={(e) => updateDistribution(activeDistribution, 'diffusionLength_um', e.target.value)}
                                  InputProps={{ inputProps: { min: 0, step: 'any' } }} // Allow non-negative floats
                                  helperText="Optional"
                              />
                          </Grid>
                     </Grid>
                     {/* --- END UPDATED Grid layout --- */}
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

