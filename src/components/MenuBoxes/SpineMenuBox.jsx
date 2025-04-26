import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    // IconButton, // Removed as per previous step
    MenuItem,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// --- NEW: Helper function for name mapping ---
const getNameFromType = (type) => {
    switch (type) {
        case 'Passive': return 'passive';
        case 'Excitatory With Ca': return 'excCa';
        case 'Excitatory': return 'exc';
        case 'User Function': return 'user';
        default: return `unknown_${Date.now().toString().slice(-4)}`; // Fallback
    }
};
// --- END NEW ---

// --- MODIFIED: Use mapping in initial state creator ---
const createNewPrototype = () => {
    const defaultType = 'Excitatory'; // Default type
    const defaultName = getNameFromType(defaultType); // Derive name from type
    const defaultSource = 'excitatorySpine'; // Auto-set based on default type

    return {
        type: defaultType,
        name: defaultName, // Use derived name
        source: defaultSource,
        shaftDiameter: '0.2', // microns
        shaftLength: '1', // microns
        headDiameter: '0.5', // microns
        headLength: '0.5', // microns
        gluRGbar: '200.0',
        nmdaRGbar: '80.0',
        gluRTau1: '2.0',
        gluRTau2: '9.0',
        nmdaRTau1: '20.0',
        nmdaRTau2: '20.0',
    };
};
// --- END MODIFIED ---


const createNewDistribution = () => ({
    prototype: '',
    path: 'dend',
    spacing: '10.0', // microns
    minSpacing: '1.0', // microns
    sizeScale: '1.0',
    sizeStdDev: '0.5',
    angle: '0.0', // radians
    angleStdDev: '6.2832',
});


const SpineMenuBox = ({ onConfigurationChange }) => {
    const [prototypes, setPrototypes] = useState([createNewPrototype()]);
    const [activePrototype, setActivePrototype] = useState(0);
    const [distributions, setDistributions] = useState([createNewDistribution()]);
    const [activeDistribution, setActiveDistribution] = useState(0);

    const addPrototype = useCallback(() => {
        setPrototypes((prev) => [...prev, createNewPrototype()]);
        setActivePrototype(prototypes.length);
    }, [prototypes.length]);

    const removePrototype = useCallback((indexToRemove) => {
        const removedProtoName = prototypes[indexToRemove]?.name;
        setPrototypes((prev) => prev.filter((_, i) => i !== indexToRemove));
        setDistributions(prevDists => prevDists.map(dist =>
            dist.prototype === removedProtoName ? { ...dist, prototype: '' } : dist
        ));
        setActivePrototype((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, [prototypes]);

    // --- MODIFIED: Update name when type changes ---
    const updatePrototype = useCallback((index, key, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) => {
                if (i === index) {
                    const updatedProto = { ...proto, [key]: value };

                    // Auto-update source AND name based on type
                    if (key === 'type') {
                        // Update name based on the new type
                        updatedProto.name = getNameFromType(value);

                        // Update source
                        if (value === 'Excitatory With Ca') updatedProto.source = 'activeSpine';
                        else if (value === 'Excitatory') updatedProto.source = 'excitatorySpine';
                        else if (value === 'Passive') updatedProto.source = 'passiveSpine';
                        else if (value === 'User Function') updatedProto.source = 'userFuncSpine'; // Example source name
                        else updatedProto.source = ''; // Default or clear
                    }
                    return updatedProto;
                }
                return proto;
            })
        );
    }, []);
    // --- END MODIFIED ---


    const addDistribution = useCallback(() => {
        setDistributions((prev) => [...prev, createNewDistribution()]);
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

    const getSpineData = useCallback(() => {
        // ... (Formatting logic remains the same as previous step)
        const spineProtoData = prototypes.map(protoState => {
             let schemaType = "builtin";
             let schemaSource = protoState.source || "";
             if (protoState.type === 'User Function') {
                  schemaType = "func";
                  schemaSource = protoState.source || protoState.name;
             }

             const protoSchemaItem = {
                 type: schemaType,
                 source: schemaSource,
                 name: protoState.name || getNameFromType(protoState.type), // Use current name, fallback if empty
                 shaftDia: (parseFloat(protoState.shaftDiameter) || 0) * 1e-6,
                 shaftLen: (parseFloat(protoState.shaftLength) || 0) * 1e-6,
                 headDia: (parseFloat(protoState.headDiameter) || 0) * 1e-6,
                 headLen: (parseFloat(protoState.headLength) || 0) * 1e-6,
             };

             if (schemaSource === 'activeSpine') {
                 protoSchemaItem.gluGbar = parseFloat(protoState.gluRGbar) || 0;
                 protoSchemaItem.nmdaGbar = parseFloat(protoState.nmdaRGbar) || 0;
             }
             return protoSchemaItem;
         });

         const spineDistribData = distributions.map(distState => {
            // Ensure prototype name exists before trying to use it
            const selectedProtoExists = prototypes.some(p => p.name === distState.prototype);
             return {
                 proto: selectedProtoExists ? distState.prototype : "", // Use selected name, or empty if invalid
                 path: distState.path || "dend",
                 spacing: (parseFloat(distState.spacing) || 10e-6),
                 minSpacing: (parseFloat(distState.minSpacing) || 1e-6),
                 sizeScale: parseFloat(distState.sizeScale) || 1,
                 sizeSdev: parseFloat(distState.sizeStdDev) || 0.5,
                 angle: parseFloat(distState.angle) || 0,
                 angleSdev: parseFloat(distState.angleStdDev) || 6.2831853,
             };
         });

        return { spineProto: spineProtoData, spineDistrib: spineDistribData };

    }, [prototypes, distributions]);

    useEffect(() => {
        if (onConfigurationChange) {
            const spineData = getSpineData();
            onConfigurationChange(spineData);
        }
    }, [prototypes, distributions, getSpineData, onConfigurationChange]);

    // --- JSX Rendering Code (Mostly unchanged, ensures Name field updates visually) ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Spine Definitions</Typography>

            {/* === Prototypes Section === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Prototypes</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activePrototype} onChange={(e, nv) => setActivePrototype(nv)} variant="scrollable" scrollButtons="auto" aria-label="Spine Prototypes">
                    {/* Display current name from state */}
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
                            {/* Name field now reflects state, which is updated by type change */}
                            <TextField fullWidth size="small" label="Prototype Name" value={prototypes[activePrototype].name}
                                onChange={(e) => updatePrototype(activePrototype, 'name', e.target.value)}
                                helperText="Auto-updated on Type change. Edit if needed for uniqueness." />
                        </Grid>
                        {/* ... rest of prototype fields ... */}
                         <Grid item xs={12}>
                             <TextField fullWidth size="small" label="Source (auto)" value={prototypes[activePrototype].source} InputProps={{ readOnly: true }} variant="filled" />
                        </Grid>
                         <Grid item xs={6}>
                            <TextField fullWidth size="small" label="Shaft Diameter (μm)" type="number" value={prototypes[activePrototype].shaftDiameter}
                                onChange={(e) => updatePrototype(activePrototype, 'shaftDiameter', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="Shaft Length (μm)" type="number" value={prototypes[activePrototype].shaftLength}
                                onChange={(e) => updatePrototype(activePrototype, 'shaftLength', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="Head Diameter (μm)" type="number" value={prototypes[activePrototype].headDiameter}
                                onChange={(e) => updatePrototype(activePrototype, 'headDiameter', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="Head Length (μm)" type="number" value={prototypes[activePrototype].headLength}
                                onChange={(e) => updatePrototype(activePrototype, 'headLength', e.target.value)} />
                        </Grid>
                        {(prototypes[activePrototype].type === 'Excitatory With Ca' || prototypes[activePrototype].type === 'Excitatory') && (
                             <>
                                <Grid item xs={12}><Typography variant="caption" display="block" gutterBottom>Receptor Params (Relevant if Source is 'activeSpine')</Typography></Grid>
                                <Grid item xs={6}><TextField fullWidth size="small" label="GluR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].gluRGbar} onChange={(e) => updatePrototype(activePrototype, 'gluRGbar', e.target.value)} /></Grid>
                                <Grid item xs={6}><TextField fullWidth size="small" label="NMDAR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].nmdaRGbar} onChange={(e) => updatePrototype(activePrototype, 'nmdaRGbar', e.target.value)} /></Grid>
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
            {/* ... rest of distribution JSX ... */}
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
                             <TextField select fullWidth size="small" label="Prototype" value={distributions[activeDistribution].prototype}
                                onChange={(e) => updateDistribution(activeDistribution, 'prototype', e.target.value)}>
                                <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                {prototypes.map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}> {/* Path */}
                             <TextField fullWidth size="small" label="Path (e.g., dend, /cell/dend_1)" value={distributions[activeDistribution].path}
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
