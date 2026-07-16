import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './SpineMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';
import { getCompartmentOptions, OPTION_USER_SPECIFIED, warnSingleSegExpr } from '../../utils/menuHelpers';
import ExprHelpField from '../ExprHelpField';

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

// Return number (optionally scaled) if parseable, otherwise return expression string as-is.
const numOrExpr = (str, defaultVal, scaleFn) => {
    if (!str || String(str).trim() === '') return defaultVal;
    const n = Number(str); // Number() is strict: Number("100*p") === NaN, parseFloat would give 100
    if (isNaN(n)) return str;
    return scaleFn ? scaleFn(n) : n;
};

// Warn if numeric spacing (µm) exceeds the dendrite length for parametric morphologies.
const spacingDendWarn = (spacingMicrons, cellProto) => {
    const n = Number(spacingMicrons);
    if (isNaN(n)) return null; // expression — skip
    if (!cellProto || (cellProto.type !== 'ballAndStick' && cellProto.type !== 'branchedCell')) return null;
    if (!cellProto.dendLen) return null;
    if (n * 1e-6 > cellProto.dendLen)
        return `Spacing (${n} µm) exceeds dendrite length (${(cellProto.dendLen * 1e6).toFixed(0)} µm) — no spines will be placed`;
    return null;
};

// --- Default State Definitions ---
const createDefaultPrototype = () => ({
    type: 'Excitatory', name: 'exc', source: 'makeExcSpine()',
    shaftDiameter: '0.2', shaftLength: '1', headDiameter: '0.5', headLength: '0.5',
    amparGbar: '200.0', nmdarGbar: '80.0',
    amparTau1: '2.0', amparTau2: '9.0', nmdarTau1: '20.0', nmdarTau2: '20.0',
    CaTau: '0.013', 
});
const createDefaultDistribution = () => ({
    prototype: '', path: 'dend#', spacing: '10.0', minSpacing: '1.0',
    sizeScale: '1.0', sizeStdDev: '0.5', angle: '0.0', angleStdDev: '6.2832',
    randSeed: '1234', 
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
const SpineMenuBox = ({ onConfigurationChange, currentConfig, elecPaths = [], cellProto, flushRef }) => {
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
                amparGbar: safeToString(p.amparGbar, createDefaultPrototype().amparGbar),
                nmdarGbar: safeToString(p.nmdarGbar, createDefaultPrototype().nmdarGbar),
                CaTau: safeToString(p.CaTau, createDefaultPrototype().CaTau), 
                amparTau1: createDefaultPrototype().amparTau1,
                amparTau2: createDefaultPrototype().amparTau2,
                nmdarTau1: createDefaultPrototype().nmdarTau1,
                nmdarTau2: createDefaultPrototype().nmdarTau2,
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
            randSeed: safeToString(d.randSeed, createDefaultDistribution().randSeed), 
        })) || [];
        return initialDists.length > 0 ? initialDists : [createDefaultDistribution()];
    });

    const [activePrototype, setActivePrototype] = useState(0);
    const [activeDistribution, setActiveDistribution] = useState(0);

    // --- State for User Specified Path Dialog ---
    const [customPathDialogOpen, setCustomPathDialogOpen] = useState(false);
    const [tempCustomPath, setTempCustomPath] = useState('');
    const [pendingDistIndex, setPendingDistIndex] = useState(null);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const prototypesRef = useRef(prototypes);
    useEffect(() => { prototypesRef.current = prototypes; }, [prototypes]);
    const distributionsRef = useRef(distributions);
    useEffect(() => { distributionsRef.current = distributions; }, [distributions]);

    // --- Helper to generate path options ---
    const pathOptions = useMemo(() => {
        // We only use elecPaths because spines cannot be put on spines
        const opts = getCompartmentOptions(elecPaths);
        
        // Ensure the current value is in the list if it's not standard
        if (distributions[activeDistribution]) {
            const currentVal = distributions[activeDistribution].path;
            if (currentVal && !opts.includes(currentVal) && currentVal !== OPTION_USER_SPECIFIED) {
                 // Insert it before the last option (which is usually User Specified)
                 const last = opts.pop();
                 opts.push(currentVal);
                 opts.push(last);
            }
        }
        return opts;
    }, [elecPaths, distributions, activeDistribution]);


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

    // --- Custom Path Handling ---
    const handlePathChange = (index, newValue) => {
        if (newValue === OPTION_USER_SPECIFIED) {
            setPendingDistIndex(index);
            setTempCustomPath('');
            setCustomPathDialogOpen(true);
        } else {
            updateDistribution(index, 'path', newValue);
        }
    };

    const handleSaveCustomPath = () => {
        if (pendingDistIndex !== null && tempCustomPath.trim() !== "") {
            updateDistribution(pendingDistIndex, 'path', tempCustomPath.trim());
        }
        setCustomPathDialogOpen(false);
        setPendingDistIndex(null);
    };

    const getSpineData = useCallback(() => {
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

             if (schemaSource === 'makeActiveSpine()' || schemaSource === 'makeExcSpine()') {
                 protoSchemaItem.amparGbar = parseFloat(protoState.amparGbar) || 0;
                 protoSchemaItem.nmdarGbar = parseFloat(protoState.nmdarGbar) || 0;
             }
             if (schemaSource === 'makeActiveSpine()') {
                protoSchemaItem.CaTau = parseFloat(protoState.CaTau) || 13.0;
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
                 spacing: numOrExpr(distState.spacing, 0, x => x * 1e-6),
                 minSpacing: numOrExpr(distState.minSpacing, 0, x => x * 1e-6),
                 sizeScale: numOrExpr(distState.sizeScale, 1),
                 sizeSdev: numOrExpr(distState.sizeStdDev, 0.5),
                 angle: numOrExpr(distState.angle, 0),
                 angleSdev: numOrExpr(distState.angleStdDev, 6.2831853),
                 randSeed: parseInt(distState.randSeed, 10) || 1234,
             };
         }).filter(d => d !== null);

        return { spineProto: spineProtoData, spineDistrib: spineDistribData };
    }, []);

    useEffect(() => {
        return () => {
            if (onConfigurationChangeRef.current) {
                onConfigurationChangeRef.current(getSpineData());
            }
        };
    }, [getSpineData]);

    useEffect(() => {
        if (!flushRef) return;
        flushRef.current = getSpineData;
        return () => { flushRef.current = null; };
    }, [flushRef, getSpineData]);

    const activeProto = prototypes[activePrototype];
    const isExcOrExcCa = activeProto?.source === 'makeActiveSpine()' || activeProto?.source === 'makeExcSpine()';
    const isExcCa = activeProto?.source === 'makeActiveSpine()';

    const shaftDiaNum = Number(activeProto?.shaftDiameter);
    const shaftDiaError = activeProto && (isNaN(shaftDiaNum) || shaftDiaNum <= 0) ? 'Must be > 0' : null;
    const shaftDiaWarn = !shaftDiaError && activeProto && (shaftDiaNum < 0.05 || shaftDiaNum > 1.0) ? 'Typical range 0.05–1.0 µm' : null;

    const shaftLenNum = Number(activeProto?.shaftLength);
    const shaftLenError = activeProto && (isNaN(shaftLenNum) || shaftLenNum <= 0) ? 'Must be > 0' : null;
    const shaftLenWarn = !shaftLenError && activeProto && (shaftLenNum < 0.1 || shaftLenNum > 5.0) ? 'Typical range 0.1–5.0 µm' : null;

    const headDiaNum = Number(activeProto?.headDiameter);
    const headDiaError = activeProto && (isNaN(headDiaNum) || headDiaNum <= 0) ? 'Must be > 0' : null;
    const headDiaWarn = !headDiaError && activeProto && (headDiaNum < 0.1 || headDiaNum > 5.0) ? 'Typical range 0.1–5.0 µm' : null;

    const headLenNum = Number(activeProto?.headLength);
    const headLenError = activeProto && (isNaN(headLenNum) || headLenNum <= 0) ? 'Must be > 0' : null;
    const headLenWarn = !headLenError && activeProto && (headLenNum < 0.1 || headLenNum > 5.0) ? 'Typical range 0.1–5.0 µm' : null;

    const amparGbarNum = Number(activeProto?.amparGbar);
    const amparGbarError = isExcOrExcCa && (isNaN(amparGbarNum) || amparGbarNum < 0) ? 'Must be ≥ 0' : null;
    const amparGbarWarn = !amparGbarError && isExcOrExcCa
        ? (amparGbarNum === 0 ? 'Gbar = 0 — AMPAR will not fire'
            : amparGbarNum > 10000 ? 'AMPAR Gbar > 10000 S/m² is unusually high'
            : null)
        : null;

    const nmdarGbarNum = Number(activeProto?.nmdarGbar);
    const nmdarGbarError = isExcOrExcCa && (isNaN(nmdarGbarNum) || nmdarGbarNum < 0) ? 'Must be ≥ 0' : null;
    const nmdarGbarWarn = !nmdarGbarError && isExcOrExcCa
        ? (nmdarGbarNum === 0 ? 'Gbar = 0 — NMDAR will not fire'
            : nmdarGbarNum > 10000 ? 'NMDAR Gbar > 10000 S/m² is unusually high'
            : null)
        : null;

    const caTauNum = Number(activeProto?.CaTau);
    const caTauError = isExcCa && (isNaN(caTauNum) || caTauNum <= 0) ? 'Must be > 0' : null;
    const caTauWarn = !caTauError && isExcCa && (caTauNum < 0.001 || caTauNum > 1.0) ? 'Typical Ca decay time is 0.001–1.0 s' : null;

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
                <Tabs value={activePrototype} onChange={(e, nv) => setActivePrototype(nv)} sx={{ '& .MuiTabs-scroller': { overflow: 'visible !important' }, '& .MuiTabs-flexContainer': { flexWrap: 'wrap' } }} aria-label="Spine Prototypes">
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
                            <HelpField id="shaftDiameter" label="Shaft Diameter (μm)" type="number" value={prototypes[activePrototype].shaftDiameter} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.shaftDiameter} error={!!shaftDiaError} helperText={shaftDiaError || shaftDiaWarn || undefined} FormHelperTextProps={!shaftDiaError && shaftDiaWarn ? { sx: { color: 'warning.main' } } : undefined} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="shaftLength" label="Shaft Length (μm)" type="number" value={prototypes[activePrototype].shaftLength} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.shaftLength} error={!!shaftLenError} helperText={shaftLenError || shaftLenWarn || undefined} FormHelperTextProps={!shaftLenError && shaftLenWarn ? { sx: { color: 'warning.main' } } : undefined} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="headDiameter" label="Head Diameter (μm)" type="number" value={prototypes[activePrototype].headDiameter} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.headDiameter} error={!!headDiaError} helperText={headDiaError || headDiaWarn || undefined} FormHelperTextProps={!headDiaError && headDiaWarn ? { sx: { color: 'warning.main' } } : undefined} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="headLength" label="Head Length (μm)" type="number" value={prototypes[activePrototype].headLength} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.headLength} error={!!headLenError} helperText={headLenError || headLenWarn || undefined} FormHelperTextProps={!headLenError && headLenWarn ? { sx: { color: 'warning.main' } } : undefined} />
                        </Grid>
                        
                        {(prototypes[activePrototype].source === 'makeActiveSpine()' || prototypes[activePrototype].source === 'makeExcSpine()') && (
                            <>
                                <Grid item xs={12}><Typography variant="caption" display="block">Receptor Params</Typography></Grid>
                                <Grid item xs={6}><HelpField id="amparGbar" label="AMPAR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].amparGbar} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.amparGbar} error={!!amparGbarError} helperText={amparGbarError || amparGbarWarn || undefined} FormHelperTextProps={!amparGbarError && amparGbarWarn ? { sx: { color: 'warning.main' } } : undefined} /></Grid>
                                <Grid item xs={6}><HelpField id="nmdarGbar" label="NMDAR Gbar (S/m^2)" type="number" value={prototypes[activePrototype].nmdarGbar} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.nmdarGbar} error={!!nmdarGbarError} helperText={nmdarGbarError || nmdarGbarWarn || undefined} FormHelperTextProps={!nmdarGbarError && nmdarGbarWarn ? { sx: { color: 'warning.main' } } : undefined} /></Grid>

                                {(prototypes[activePrototype].source === 'makeActiveSpine()') && (
                                    <Grid item xs={6}>
                                        <HelpField id="CaTau" label="Ca decay time (s)" type="number" value={prototypes[activePrototype].CaTau} onChange={(id,v) => updatePrototype(activePrototype, id, v)} helptext={helpText.prototypes.CaTau} error={!!caTauError} helperText={caTauError || caTauWarn || undefined} FormHelperTextProps={!caTauError && caTauWarn ? { sx: { color: 'warning.main' } } : undefined} />
                                    </Grid>
                                )}
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
                <Tabs value={activeDistribution} onChange={(e, nv) => setActiveDistribution(nv)} sx={{ '& .MuiTabs-scroller': { overflow: 'visible !important' }, '& .MuiTabs-flexContainer': { flexWrap: 'wrap' } }} aria-label="Spine Distributions">
                    {distributions.map((d, i) => <Tab key={i} label={`${d.prototype || 'New'} @ ${d.path || '?'}`} />)}
                    <Button onClick={addDistribution} startIcon={<AddIcon />} sx={{ minWidth: 'auto', p: '6px 8px', ml: '10px', alignSelf: 'center' }}>Add Dist</Button>
                </Tabs>
            </Box>
             {distributions[activeDistribution] && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={2}>
                        {/* 1. Moved Path to first position, renamed, full width, and made into a Menu */}
                        <Grid item xs={12}>
                             <HelpField 
                                id="path" 
                                label="Parent Elec Compartment" 
                                select
                                value={distributions[activeDistribution].path} 
                                onChange={(id,v) => handlePathChange(activeDistribution, v)} 
                                helptext={helpText.distributions.path}
                             >
                                {pathOptions.map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                             </HelpField>
                        </Grid>

                        <Grid item xs={6}>
                             <HelpField id="prototype" label="Prototype" select
                                 error={!distributions[activeDistribution].prototype}
                                 helperText={!distributions[activeDistribution].prototype ? 'Select a prototype' : undefined}
                                 value={distributions[activeDistribution].prototype}
                                 onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                 helptext={helpText.distributions.prototype}
                             >
                                <MenuItem value=""><em>Select...</em></MenuItem>
                                {prototypes.filter(p => p.name).map((p) => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
                            </HelpField>
                        </Grid>
                        <Grid item xs={6}>
                             <ExprHelpField id="spacing" label="Spacing (μm)"
                                 value={distributions[activeDistribution].spacing}
                                 onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                 helptext={helpText.distributions.spacing}
                                 warning={spacingDendWarn(distributions[activeDistribution].spacing, cellProto) || warnSingleSegExpr(distributions[activeDistribution].spacing, cellProto)}
                             />
                        </Grid>
                        <Grid item xs={6}>
                             <ExprHelpField id="minSpacing" label="Min Spacing (μm)"
                                 value={distributions[activeDistribution].minSpacing}
                                 onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                 helptext={helpText.distributions.minSpacing}
                                 warning={warnSingleSegExpr(distributions[activeDistribution].minSpacing, cellProto)}
                             />
                        </Grid>
                         <Grid item xs={6}>
                            <ExprHelpField id="sizeScale" label="Size Scale"
                                value={distributions[activeDistribution].sizeScale}
                                onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                helptext={helpText.distributions.sizeScale}
                                warning={warnSingleSegExpr(distributions[activeDistribution].sizeScale, cellProto)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <ExprHelpField id="sizeStdDev" label="Size Std Dev"
                                value={distributions[activeDistribution].sizeStdDev}
                                onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                helptext={helpText.distributions.sizeStdDev}
                                warning={warnSingleSegExpr(distributions[activeDistribution].sizeStdDev, cellProto)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                             <ExprHelpField id="angle" label="Angle (rad)"
                                 value={distributions[activeDistribution].angle}
                                 onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                 helptext={helpText.distributions.angle}
                                 warning={warnSingleSegExpr(distributions[activeDistribution].angle, cellProto)}
                             />
                        </Grid>
                        <Grid item xs={6}>
                             <ExprHelpField id="angleStdDev" label="Angle Std Dev (rad)"
                                 value={distributions[activeDistribution].angleStdDev}
                                 onChange={(id,v) => updateDistribution(activeDistribution, id, v)}
                                 helptext={helpText.distributions.angleStdDev}
                                 warning={warnSingleSegExpr(distributions[activeDistribution].angleStdDev, cellProto)}
                             />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="randSeed" label="Random seed" type="number" value={distributions[activeDistribution].randSeed} onChange={(id,v) => updateDistribution(activeDistribution, id, v)} helptext={helpText.distributions.randSeed}/>
                        </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeDistribution(activeDistribution)} sx={{ mt: 2 }}>
                        Remove Distribution
                    </Button>
                </Box>
             )}

            {/* Custom Path Dialog */}
            <Dialog open={customPathDialogOpen} onClose={() => setCustomPathDialogOpen(false)}>
                <DialogTitle>Enter User Specified Path</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="customPath"
                        label="Path"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={tempCustomPath}
                        onChange={(e) => setTempCustomPath(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomPathDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveCustomPath}>Set Path</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SpineMenuBox;
