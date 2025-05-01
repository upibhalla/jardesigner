import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    MenuItem,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper function for name mapping (remains the same)
const getNameFromType = (type) => {
    switch (type) {
        case 'Passive': return 'passive';
        case 'Excitatory With Ca': return 'excCa';
        case 'Excitatory': return 'exc';
        case 'User Function': return 'user';
        default: return `unknown_${Date.now().toString().slice(-4)}`;
    }
};

// Helper function to determine component type from schema source/type
const getComponentTypeFromSchema = (schemaType, schemaSource) => {
    if (schemaType === 'func') return 'User Function'; // Map 'func' schema type
    // Map schema source back to component type name for builtins
    if (schemaSource === 'makeActiveSpine()') return 'Excitatory With Ca';
    if (schemaSource === 'makeExcSpine()') return 'Excitatory';
    if (schemaSource === 'makePassiveSpine()') return 'Passive';
    // Add other mappings if needed, fallback to source itself or a default
    return schemaSource || 'Excitatory'; // Fallback
};

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default states for component
const createDefaultPrototype = () => ({
    type: 'Excitatory', name: 'exc', source: 'makeExcSpine()',
    shaftDiameter: '0.2', shaftLength: '1', headDiameter: '0.5', headLength: '0.5',
    gluRGbar: '200.0', nmdaRGbar: '80.0',
    // Tau values are local only, not from schema
    gluRTau1: '2.0', gluRTau2: '9.0', nmdaRTau1: '20.0', nmdaRTau2: '20.0',
});
const createDefaultDistribution = () => ({
    prototype: '', path: 'dend', spacing: '10.0', minSpacing: '1.0',
    sizeScale: '1.0', sizeStdDev: '0.5', angle: '0.0', angleStdDev: '6.2832',
});


// Accept currentConfig prop: { spineProto: [], spineDistrib: [] }
const SpineMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [prototypes, setPrototypes] = useState(() => {
        console.log("SpineMenuBox: Initializing prototypes from props", currentConfig?.spineProto);
        const initialProtos = currentConfig?.spineProto?.map(p => {
            const componentType = getComponentTypeFromSchema(p.type, p.source);
            return {
                type: componentType,
                name: p.name,
                source: p.source, // Store original source for reference if needed
                // Convert meters (schema) back to microns (state string)
                shaftDiameter: safeToString(p.shaftDia * 1e6, createDefaultPrototype().shaftDiameter),
                shaftLength: safeToString(p.shaftLen * 1e6, createDefaultPrototype().shaftLength),
                headDiameter: safeToString(p.headDia * 1e6, createDefaultPrototype().headDiameter),
                headLength: safeToString(p.headLen * 1e6, createDefaultPrototype().headLength),
                // Populate Gbars if present in schema (only for activeSpine)
                gluRGbar: safeToString(p.gluGbar, createDefaultPrototype().gluRGbar),
                nmdaRGbar: safeToString(p.nmdaGbar, createDefaultPrototype().nmdaRGbar),
                // Keep local-only tau values at their defaults
                gluRTau1: createDefaultPrototype().gluRTau1,
                gluRTau2: createDefaultPrototype().gluRTau2,
                nmdaRTau1: createDefaultPrototype().nmdaRTau1,
                nmdaRTau2: createDefaultPrototype().nmdaRTau2,
            };
        }) || [];
        return initialProtos.length > 0 ? initialProtos : [createDefaultPrototype()];
    });

    const [distributions, setDistributions] = useState(() => {
        console.log("SpineMenuBox: Initializing distributions from props", currentConfig?.spineDistrib);
        const initialDists = currentConfig?.spineDistrib?.map(d => ({
            prototype: d.proto,
            path: d.path,
            // Convert meters (schema) back to microns (state string)
            spacing: safeToString(d.spacing * 1e6, createDefaultDistribution().spacing),
            minSpacing: safeToString(d.minSpacing * 1e6, createDefaultDistribution().minSpacing),
            sizeScale: safeToString(d.sizeScale, createDefaultDistribution().sizeScale),
            sizeStdDev: safeToString(d.sizeSdev, createDefaultDistribution().sizeStdDev), // Map schema key back
            angle: safeToString(d.angle, createDefaultDistribution().angle),
            angleStdDev: safeToString(d.angleSdev, createDefaultDistribution().angleStdDev), // Map schema key back
        })) || [];
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
        setActivePrototype(prototypesRef.current.length); // Use ref for correct length
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
         console.log(`SpineMenuBox Proto: Local state change - Index ${index}, Key ${key}: ${value}`);
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) => {
                if (i === index) {
                    const updatedProto = { ...proto, [key]: value };
                    // Auto-update source AND name based on type
                    if (key === 'type') {
                        updatedProto.name = getNameFromType(value); // Auto-update name
                        // Update source based on new type
                        if (value === 'Excitatory With Ca') updatedProto.source = 'makeActiveSpine()';
                        else if (value === 'Excitatory') updatedProto.source = 'makeExcSpine()';
                        else if (value === 'Passive') updatedProto.source = 'makePassiveSpine()';
                        else if (value === 'User Function') updatedProto.source = 'userFuncSpine'; // Example
                        else updatedProto.source = '';
                    }
                    return updatedProto;
                }
                return proto;
            })
        );
    }, []);

    const addDistribution = useCallback(() => {
        setDistributions((prev) => [...prev, createDefaultDistribution()]);
        setActiveDistribution(distributionsRef.current.length); // Use ref
    }, []);

    const removeDistribution = useCallback((indexToRemove) => {
        setDistributions((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveDistribution((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateDistribution = useCallback((index, key, value) => {
         console.log(`SpineMenuBox Distrib: Local state change - Index ${index}, Key ${key}: ${value}`);
        setDistributions((prevDists) =>
            prevDists.map((dist, i) =>
                i === index ? { ...dist, [key]: value } : dist
            )
        );
    }, []);
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getSpineDataForUnmount = () => {
        const currentPrototypes = prototypesRef.current;
        const currentDistributions = distributionsRef.current;
        console.log("SpineMenuBox: Formatting final local state for push:", { prototypes: currentPrototypes, distributions: currentDistributions });

        // Format Prototypes
        const spineProtoData = currentPrototypes.map(protoState => {
             let schemaType = "builtin";
             let schemaSource = protoState.source || ""; // Use source derived from type selection
             if (protoState.type === 'User Function') {
                  schemaType = "func";
                  // For func type, source might be function name or path, potentially stored in protoState.source
                  schemaSource = protoState.source || protoState.name; // Use source field or name as fallback
             }

             const protoSchemaItem = {
                 type: schemaType,
                 source: schemaSource,
                 name: protoState.name || getNameFromType(protoState.type), // Fallback name generation
                 // Convert microns (state) back to meters (schema)
                 shaftDia: (parseFloat(protoState.shaftDiameter) || 0) * 1e-6,
                 shaftLen: (parseFloat(protoState.shaftLength) || 0) * 1e-6,
                 headDia: (parseFloat(protoState.headDiameter) || 0) * 1e-6,
                 headLen: (parseFloat(protoState.headLength) || 0) * 1e-6,
             };

             // Conditionally add Gbar values based on source
             if (schemaSource === 'activeSpine') {
                 protoSchemaItem.gluGbar = parseFloat(protoState.gluRGbar) || 0;
                 protoSchemaItem.nmdaGbar = parseFloat(protoState.nmdaRGbar) || 0;
             }
              // Basic validation for prototype
             if (!protoSchemaItem.name || !protoSchemaItem.source) {
                 console.warn("Skipping prototype due to missing name or source:", protoState);
                 return null;
             }
             return protoSchemaItem;
         }).filter(p => p !== null);

        // Format Distributions
        const spineDistribData = currentDistributions.map(distState => {
            // Ensure prototype name exists in the *valid* list being saved
            const selectedProtoExists = spineProtoData.some(p => p.name === distState.prototype);
             if (!selectedProtoExists || !distState.prototype || !distState.path) {
                  console.warn("Skipping distribution due to missing/invalid prototype or path:", distState);
                  return null;
             }

             return {
                 proto: distState.prototype,
                 path: distState.path,
                 // Convert microns (state) back to meters (schema)
                 spacing: (parseFloat(distState.spacing) || 0) * 1e-6,
                 minSpacing: (parseFloat(distState.minSpacing) || 0) * 1e-6,
                 sizeScale: parseFloat(distState.sizeScale) || 1,
                 sizeSdev: parseFloat(distState.sizeStdDev) || 0.5, // Map state key back
                 angle: parseFloat(distState.angle) || 0,
                 angleSdev: parseFloat(distState.angleStdDev) || 6.2831853, // Map state key back
             };
         }).filter(d => d !== null);

        return { spineProto: spineProtoData, spineDistrib: spineDistribData };
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("SpineMenuBox: Mounted, setting up unmount cleanup.");
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("SpineMenuBox: Unmounting, pushing final state up.");
                const configData = getSpineDataForUnmount();
                latestOnConfigurationChange(configData); // Push object with both keys
            } else {
                console.warn("SpineMenuBox: onConfigurationChange not available on unmount.");
            }
        };
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (uses local state) ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Spine Definitions</Typography>

            {/* === Prototypes Section === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Prototypes</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activePrototype} onChange={(e, nv) => setActivePrototype(nv)} variant="scrollable" scrollButtons="auto" aria-label="Spine Prototypes">
                    {prototypes.map((p, i) => <Tab key={i} label={p.name || `Proto ${i + 1}`} />)}
                    <Button onClick={addPrototype} startIcon={<AddIcon />} sx={{ minWidth: 'auto', padding: '6px 8px', marginLeft: '10px', alignSelf: 'center' }}>Add Proto</Button>
                </Tabs>
            </Box>
            {prototypes.length > 0 && activePrototype < prototypes.length && prototypes[activePrototype] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={1.5}>
                         {/* Row 1: Type, Name */}
                        <Grid item xs={6}>
                            <TextField select fullWidth size="small" label="Type" value={prototypes[activePrototype].type}
                                onChange={(e) => updatePrototype(activePrototype, 'type', e.target.value)}>
                                {['Excitatory With Ca', 'Excitatory', 'Passive', 'User Function'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="Prototype Name" value={prototypes[activePrototype].name}
                                onChange={(e) => updatePrototype(activePrototype, 'name', e.target.value)} // Allow manual edit
                                helperText="Auto-updated on Type change. Edit if needed." />
                        </Grid>
                         {/* Row 2: Source (Readonly) */}
                        <Grid item xs={12}>
                             <TextField fullWidth size="small" label="Source (auto)" value={prototypes[activePrototype].source} InputProps={{ readOnly: true }} variant="filled" />
                        </Grid>
                        {/* Row 3: Shaft D/L */}
                         <Grid item xs={6}>
                            <TextField fullWidth size="small" label="Shaft Diameter (μm)" type="number" value={prototypes[activePrototype].shaftDiameter}
                                onChange={(e) => updatePrototype(activePrototype, 'shaftDiameter', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="Shaft Length (μm)" type="number" value={prototypes[activePrototype].shaftLength}
                                onChange={(e) => updatePrototype(activePrototype, 'shaftLength', e.target.value)} />
                        </Grid>
                        {/* Row 4: Head D/L */}
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="Head Diameter (μm)" type="number" value={prototypes[activePrototype].headDiameter}
                                onChange={(e) => updatePrototype(activePrototype, 'headDiameter', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="Head Length (μm)" type="number" value={prototypes[activePrototype].headLength}
                                onChange={(e) => updatePrototype(activePrototype, 'headLength', e.target.value)} />
                        </Grid>

                        {/* Conditional Receptor Fields */}
                        {(prototypes[activePrototype].source === 'activeSpine') && ( // Check source for conditional fields
                            <>
                                <Grid item xs={12}><Typography variant="caption" display="block" gutterBottom>Receptor Params (Only for 'activeSpine' source)</Typography></Grid>
                                <Grid item xs={6}><TextField fullWidth size="small" label="GluR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].gluRGbar} onChange={(e) => updatePrototype(activePrototype, 'gluRGbar', e.target.value)} /></Grid>
                                <Grid item xs={6}><TextField fullWidth size="small" label="NMDAR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].nmdaRGbar} onChange={(e) => updatePrototype(activePrototype, 'nmdaRGbar', e.target.value)} /></Grid>
                                {/* Tau fields are local only */}
                             </>
                        )}
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePrototype(activePrototype)} sx={{ marginTop: '16px' }}>
                        Remove Proto '{prototypes[activePrototype].name}'
                    </Button>
                </Box>
            )}
            {prototypes.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No spine prototypes defined.</Typography>}


            {/* === Distributions Section === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>Distributions</Typography>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeDistribution} onChange={(e, nv) => setActiveDistribution(nv)} variant="scrollable" scrollButtons="auto" aria-label="Spine Distributions">
                    {distributions.map((d, i) => <Tab key={i} label={`${d.prototype || 'Select Proto'} @ ${d.path || '?'}`} />)}
                    <Button onClick={addDistribution} startIcon={<AddIcon />} sx={{ minWidth: 'auto', padding: '6px 8px', marginLeft: '10px', alignSelf: 'center' }}>Add Dist</Button>
                </Tabs>
            </Box>
             {distributions.length > 0 && activeDistribution < distributions.length && distributions[activeDistribution] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={1.5}>
                        <Grid item xs={6}> {/* Proto selection */}
                             <TextField select fullWidth size="small" label="Prototype" required value={distributions[activeDistribution].prototype}
                                onChange={(e) => updateDistribution(activeDistribution, 'prototype', e.target.value)}>
                                <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                {/* Filter prototype list to show only valid ones */}
                                {prototypes.filter(p => p.name).map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}> {/* Path */}
                             <TextField fullWidth size="small" label="Path (e.g., dend, /cell/dend_1)" required value={distributions[activeDistribution].path}
                                onChange={(e) => updateDistribution(activeDistribution, 'path', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}> {/* Spacing */}
                             <TextField fullWidth size="small" label="Spacing (μm)" type="number" value={distributions[activeDistribution].spacing}
                                onChange={(e) => updateDistribution(activeDistribution, 'spacing', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}> {/* Min Spacing */}
                             <TextField fullWidth size="small" label="Min Spacing (μm)" type="number" value={distributions[activeDistribution].minSpacing}
                                onChange={(e) => updateDistribution(activeDistribution, 'minSpacing', e.target.value)} />
                        </Grid>
                         <Grid item xs={6}> {/* Size Scale */}
                            <TextField fullWidth size="small" label="Size Scale" type="number" value={distributions[activeDistribution].sizeScale}
                                onChange={(e) => updateDistribution(activeDistribution, 'sizeScale', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}> {/* Size StdDev -> sizeSdev */}
                            <TextField fullWidth size="small" label="Size Std Dev" type="number" value={distributions[activeDistribution].sizeStdDev}
                                onChange={(e) => updateDistribution(activeDistribution, 'sizeStdDev', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}> {/* Angle */}
                             <TextField fullWidth size="small" label="Angle (rad)" type="number" value={distributions[activeDistribution].angle}
                                onChange={(e) => updateDistribution(activeDistribution, 'angle', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}> {/* Angle StdDev -> angleSdev */}
                             <TextField fullWidth size="small" label="Angle Std Dev (rad)" type="number" value={distributions[activeDistribution].angleStdDev}
                                onChange={(e) => updateDistribution(activeDistribution, 'angleStdDev', e.target.value)} />
                        </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeDistribution(activeDistribution)} sx={{ marginTop: '16px' }}>
                        Remove Distribution {activeDistribution + 1}
                    </Button>
                </Box>
             )}
             {distributions.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No spine distributions defined.</Typography>}

        </Box>
    );
};

export default SpineMenuBox;

