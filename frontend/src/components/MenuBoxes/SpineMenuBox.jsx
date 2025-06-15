import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    MenuItem,
    Button,
    Tooltip,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './SpineMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Helper Functions ---
const getNameFromType = (type) => {
    switch (type) {
        case 'Passive': return 'passive';
        case 'Excitatory With Ca': return 'excCa';
        case 'Excitatory': return 'exc';
        case 'User Function': return 'user';
        default: return `unknown_${Date.now().toString().slice(-4)}`;
    }
};

const getComponentTypeFromSchema = (schemaType, schemaSource) => {
    if (schemaType === 'func') return 'User Function';
    if (schemaSource === 'makeActiveSpine()') return 'Excitatory With Ca';
    if (schemaSource === 'makeExcSpine()') return 'Excitatory';
    if (schemaSource === 'makePassiveSpine()') return 'Passive';
    return schemaSource || 'Excitatory';
};
// --- Unit Conversion Helpers ---
const toMeters = (microns) => {
    const meterValue = (parseFloat(microns) * 1e-6 || 0);
    return Number(formatFloat(meterValue));
};
const toMicrons = (meters) => {
    const micronValue = (parseFloat(meters) || 0) * 1e6;
    return formatFloat(micronValue);
};

const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default State Definitions ---
const createDefaultPrototype = () => ({
    type: 'Excitatory', name: 'exc', source: 'makeExcSpine()',
    shaftDiameter: '0.2', shaftLength: '1', headDiameter: '0.5', headLength: '0.5',
    gluRGbar: '200.0', nmdaRGbar: '80.0',
    gluRTau1: '2.0', gluRTau2: '9.0', nmdaRTau1: '20.0', nmdaRTau2: '20.0',
});
const createDefaultDistribution = () => ({
    prototype: '', path: 'dend', spacing: '10.0', minSpacing: '1.0',
    sizeScale: '1.0', sizeStdDev: '0.5', angle: '0.0', angleStdDev: '6.2832',
});

// --- Reusable HelpField Component ---
const HelpField = React.memo(({ id, label, value, onChange, type = "text", fullWidth = true, ...props }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField {...props} fullWidth={fullWidth} size="small" label={label} variant="outlined" type={type}
                value={value} onChange={(e) => onChange(id, e.target.value)} />
            <Tooltip title={props.helptext} placement="right">
                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
        </Box>
    );
});


// --- Main Component ---
const SpineMenuBox = ({ onConfigurationChange, currentConfig }) => {
    const [prototypes, setPrototypes] = useState(() => {
        const initialProtos = currentConfig?.spineProto?.map(p => {
            const componentType = getComponentTypeFromSchema(p.type, p.source);
            return {
                type: componentType,
                name: p.name,
                source: p.source,
                shaftDiameter: toMicrons(p.shaftDia) || createDefaultPrototype().shaftDiameter,
                shaftLength: toMicrons(p.shaftLen) || createDefaultPrototype().shaftLength,
                headDiameter: toMicrons(p.headDia) || createDefaultPrototype().headDiameter,
                headLength: toMicrons(p.headLen) || createDefaultPrototype().headLength,
                gluRGbar: safeToString(p.gluGbar, createDefaultPrototype().gluRGbar),
                nmdaRGbar: safeToString(p.nmdaGbar, createDefaultPrototype().nmdaRGbar),
                gluRTau1: createDefaultPrototype().gluRTau1,
                gluRTau2: createDefaultPrototype().gluRTau2,
                nmdaRTau1: createDefaultPrototype().nmdaRTau1,
                nmdaRTau2: createDefaultPrototype().nmdaRTau2,
            };
        }) || [];
        return initialProtos.length > 0 ? initialProtos : [createDefaultPrototype()];
    });

    const [distributions, setDistributions] = useState(() => {
        const initialDists = currentConfig?.spineDistrib?.map(d => ({
            prototype: d.proto,
            path: d.path,
            spacing: toMicrons(d.spacing) || createDefaultDistribution().spacing,
            minSpacing: toMicrons(d.minSpacing) || createDefaultDistribution().minSpacing,
            sizeScale: safeToString(d.sizeScale, createDefaultDistribution().sizeScale),
            sizeStdDev: safeToString(d.sizeSdev, createDefaultDistribution().sizeStdDev),
            angle: safeToString(d.angle, createDefaultDistribution().angle),
            angleStdDev: safeToString(d.angleSdev, createDefaultDistribution().angleStdDev),
        })) || [];
        return initialDists.length > 0 ? initialDists : [createDefaultDistribution()];
    });

    const [activePrototype, setActivePrototype] = useState(0);
    const [activeDistribution, setActiveDistribution] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const prototypesRef = useRef(prototypes);
    useEffect(() => { prototypesRef.current = prototypes; }, [prototypes]);
    const distributionsRef = useRef(distributions);
    useEffect(() => { distributionsRef.current = distributions; }, [distributions]);

    const addPrototype = useCallback(() => {
        setPrototypes((prev) => [...prev, createDefaultPrototype()]);
        setActivePrototype(prototypesRef.current.length);
    }, []);

    const removePrototype = useCallback((indexToRemove) => {
        const removedProtoName = prototypesRef.current[indexToRemove]?.name;
        setPrototypes((prev) => prev.filter((_, i) => i !== indexToRemove));
        setDistributions(prevDists => prevDists.map(dist =>
            dist.prototype === removedProtoName ? { ...dist, prototype: '' } : dist
        ));
        setActivePrototype((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updatePrototype = useCallback((index, key, value) => {
        setPrototypes((prevPrototypes) =>
            prevPrototypes.map((proto, i) => {
                if (i === index) {
                    const updatedProto = { ...proto, [key]: value };
                    if (key === 'type') {
                        updatedProto.name = getNameFromType(value);
                        if (value === 'Excitatory With Ca') updatedProto.source = 'makeActiveSpine()';
                        else if (value === 'Excitatory') updatedProto.source = 'makeExcSpine()';
                        else if (value === 'Passive') updatedProto.source = 'makePassiveSpine()';
                        else if (value === 'User Function') updatedProto.source = 'userFuncSpine';
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
        setActiveDistribution(distributionsRef.current.length);
    }, []);

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

    useEffect(() => {
        const getSpineDataForUnmount = () => {
            const currentPrototypes = prototypesRef.current;
            const currentDistributions = distributionsRef.current;

            const spineProtoData = currentPrototypes.map(protoState => {
                 let schemaType = "builtin";
                 let schemaSource = protoState.source || "";
                 if (protoState.type === 'User Function') {
                      schemaType = "func";
                      schemaSource = protoState.source || protoState.name;
                 }

                 const protoSchemaItem = {
                     type: schemaType,
                     source: schemaSource,
                     name: protoState.name || getNameFromType(protoState.type),
                     shaftDia: (toMeters(protoState.shaftDiameter) || 0),
                     shaftLen: (toMeters(protoState.shaftLength) || 0),
                     headDia: (toMeters(protoState.headDiameter) || 0),
                     headLen: (toMeters(protoState.headLength) || 0),
                 };

                 if (schemaSource === 'makeActiveSpine()') {
                     protoSchemaItem.gluGbar = parseFloat(protoState.gluRGbar) || 0;
                     protoSchemaItem.nmdaGbar = parseFloat(protoState.nmdaRGbar) || 0;
                 }
                 if (!protoSchemaItem.name || !protoSchemaItem.source) return null;
                 return protoSchemaItem;
             }).filter(p => p !== null);

            const spineDistribData = currentDistributions.map(distState => {
                const selectedProtoExists = spineProtoData.some(p => p.name === distState.prototype);
                 if (!selectedProtoExists || !distState.prototype || !distState.path) return null;

                 return {
                     proto: distState.prototype,
                     path: distState.path,
                     spacing: (toMeters(distState.spacing) || 0),
                     minSpacing: (toMeters(distState.minSpacing) || 0),
                     sizeScale: parseFloat(distState.sizeScale) || 1,
                     sizeSdev: parseFloat(distState.sizeStdDev) || 0.5,
                     angle: parseFloat(distState.angle) || 0,
                     angleSdev: parseFloat(distState.angleStdDev) || 6.2831853,
                 };
             }).filter(d => d !== null);

            return { spineProto: spineProtoData, spineDistrib: spineDistribData };
        };

        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getSpineDataForUnmount();
                onConfigurationChangeRef.current(configData);
            }
        };
    }, []);

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Spine Definitions</Typography>

            {/* === Prototypes Section === */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>Prototypes</Typography>
                <Tooltip title={helpText.headings.prototypes} placement="right">
                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activePrototype} onChange={(e, nv) => setActivePrototype(nv)} variant="scrollable" scrollButtons="auto" aria-label="Spine Prototypes">
                    {prototypes.map((p, i) => <Tab key={i} label={p.name || `Proto ${i + 1}`} />)}
                    <Button onClick={addPrototype} startIcon={<AddIcon />} sx={{ minWidth: 'auto', p: '6px 8px', ml: '10px', alignSelf: 'center' }}>Add Proto</Button>
                </Tabs>
            </Box>
            {prototypes[activePrototype] && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={2}>
                         <Grid item xs={6}>
                            <HelpField id="type" label="Type" value={prototypes[activePrototype].type} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.type} select>
                                {['Excitatory With Ca', 'Excitatory', 'Passive', 'User Function'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </HelpField>
                        </Grid>
                        <Grid item xs={6}>
                            <HelpField id="name" label="Prototype Name" value={prototypes[activePrototype].name} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.name} />
                        </Grid>
                        <Grid item xs={12}>
                             <HelpField id="source" label="Source (auto)" value={prototypes[activePrototype].source} onChange={() => {}} helptext={helpText.prototypes.source} InputProps={{ readOnly: true }} variant="filled" />
                        </Grid>
                         <Grid item xs={6}>
                            <HelpField id="shaftDiameter" label="Shaft Diameter (μm)" type="number" value={prototypes[activePrototype].shaftDiameter} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.shaftDiameter} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="shaftLength" label="Shaft Length (μm)" type="number" value={prototypes[activePrototype].shaftLength} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.shaftLength} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="headDiameter" label="Head Diameter (μm)" type="number" value={prototypes[activePrototype].headDiameter} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.headDiameter} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="headLength" label="Head Length (μm)" type="number" value={prototypes[activePrototype].headLength} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.headLength} />
                        </Grid>
                        {(prototypes[activePrototype].source === 'makeActiveSpine()') && (
                            <>
                                <Grid item xs={12}><Typography variant="caption" display="block">Receptor Params</Typography></Grid>
                                <Grid item xs={6}><HelpField id="gluRGbar" label="GluR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].gluRGbar} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.gluRGbar} /></Grid>
                                <Grid item xs={6}><HelpField id="nmdaRGbar" label="NMDAR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].nmdaRGbar} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.nmdaRGbar} /></Grid>
                             </>
                        )}
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePrototype(activePrototype)} sx={{ mt: 2 }}>
                        Remove '{prototypes[activePrototype].name}'
                    </Button>
                </Box>
            )}

            {/* === Distributions Section === */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>Distributions</Typography>
                <Tooltip title={helpText.headings.distributions} placement="right">
                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
            </Box>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeDistribution} onChange={(e, nv) => setActiveDistribution(nv)} variant="scrollable" scrollButtons="auto" aria-label="Spine Distributions">
                    {distributions.map((d, i) => <Tab key={i} label={`${d.prototype || 'New'} @ ${d.path || '?'}`} />)}
                    <Button onClick={addDistribution} startIcon={<AddIcon />} sx={{ minWidth: 'auto', p: '6px 8px', ml: '10px', alignSelf: 'center' }}>Add Dist</Button>
                </Tabs>
            </Box>
             {distributions[activeDistribution] && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <HelpField id="prototype" label="Prototype" select value={distributions[activeDistribution].prototype} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.prototype}>
                                <MenuItem value=""><em>Select...</em></MenuItem>
                                {prototypes.filter(p => p.name).map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </HelpField>
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="path" label="Path" value={distributions[activeDistribution].path} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.path}/>
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="spacing" label="Spacing (μm)" type="number" value={distributions[activeDistribution].spacing} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.spacing}/>
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="minSpacing" label="Min Spacing (μm)" type="number" value={distributions[activeDistribution].minSpacing} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.minSpacing}/>
                        </Grid>
                         <Grid item xs={6}>
                            <HelpField id="sizeScale" label="Size Scale" type="number" value={distributions[activeDistribution].sizeScale} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.sizeScale}/>
                        </Grid>
                        <Grid item xs={6}>
                            <HelpField id="sizeStdDev" label="Size Std Dev" type="number" value={distributions[activeDistribution].sizeStdDev} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.sizeStdDev}/>
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="angle" label="Angle (rad)" type="number" value={distributions[activeDistribution].angle} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.angle}/>
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="angleStdDev" label="Angle Std Dev (rad)" type="number" value={distributions[activeDistribution].angleStdDev} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.angleStdDev}/>
                        </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeDistribution(activeDistribution)} sx={{ mt: 2 }}>
                        Remove Distribution
                    </Button>
                </Box>
             )}
        </Box>
    );
};

export default SpineMenuBox;
