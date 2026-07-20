import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Tabs, Tab, Typography, TextField, Grid, Tooltip, IconButton, Button, Alert } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import helpText from './MorphoMenuBox.Help.json';
import ProtoPickerDialog from '../ProtoPickerDialog';
import fileIcon from '../../assets/uploaded.svg';
import somaIcon from '../../assets/soma.svg';
import ballAndStickIcon from '../../assets/ballAndStick.svg';
import yBranchIcon from '../../assets/ybranch.svg';
import { formatFloat } from '../../utils/formatters.js';

// --- Unit Conversion Helpers ---
const toMeters = (microns) => {
    const meterValue = (parseFloat(microns) * 1e-6 || 0);
    return Number(formatFloat(meterValue));
};
const toMicrons = (meters) => {
    const micronValue = (parseFloat(meters) || 0) * 1e6;
    return formatFloat(micronValue);
};
const safeToString = (value, defaultValue = '') => (value != null ? String(value) : defaultValue);

// --- Validation helpers — return error string or null ---
const validatePositiveNum = (str) => {
    if (!str || str.trim() === '') return 'Required';
    const n = Number(str);
    if (isNaN(n) || n <= 0) return 'Must be > 0';
    return null;
};
const validatePositiveInt = (str) => {
    if (!str || str.trim() === '') return 'Required';
    const n = parseInt(str, 10);
    if (isNaN(n) || n < 1 || String(n) !== str.trim()) return 'Must be a whole number ≥ 1';
    return null;
};
// Combine warning strings; errors always take priority over warnings.
const warnOnly = (errMsg, ...warnings) =>
    errMsg ? null : warnings.filter(Boolean).join('; ') || null;
const fieldProps = (errMsg, warnMsg) => ({
    error: !!errMsg,
    helperText: errMsg || warnMsg || undefined,
    ...((!errMsg && warnMsg) && { FormHelperTextProps: { sx: { color: 'warning.main' } } }),
});

// --- Default state values (in MICRONS) ---
const initialSomaState = { somaDia: '10', somaLen: '10' };
const initialBallAndStickState = {
    somaDia: '10', somaLen: '10',
    dendDia: '2', dendLen: '200', dendNumSeg: '1'
};
const initialYBranchState = {
    somaDia: '10', somaLen: '10',
    dendDia: '5', dendLen: '100', dendNumSeg: '1',
    branchDia: '2.5', branchLen: '150', branchNumSeg: '1'
};

// Tab order: Soma(0), Ball&Stick(1), Y Branch(2), Uploaded(3)
const typeToIndexMap = { "soma": 0, "ballAndStick": 1, "branchedCell": 2, "file": 3 };
const indexToTypeMap = ["soma", "ballAndStick", "branchedCell", "file"];

// --- Reusable Field Component ---
const HelpField = React.memo(({ id, label, value, onChange, type = "text", fullWidth = true, ...props }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField {...props} fullWidth={fullWidth} size="small" label={label} variant="outlined" type={type}
                value={value} onChange={(e) => onChange(id, e.target.value)} />
            <Tooltip title={props.helptext} placement="right">
                <IconButton size="small"><InfoOutlinedIcon /></IconButton>
            </Tooltip>
        </Box>
    );
});

function countSwcCompartments(setupConfig) {
    if (!setupConfig?.drawables) return null;
    const seen = new Set();
    let soma = 0, axon = 0, apical = 0, basal = 0, others = 0;
    setupConfig.drawables.forEach(drawable => {
        (drawable.shape || []).forEach(s => {
            if (s.type !== 'sphere' && s.type !== 'cylinder') return;
            if (seen.has(s.simPath)) return;
            seen.add(s.simPath);
            const name = (s.simPath || '').toLowerCase();
            if (s.type === 'sphere' || name === 'soma') soma++;
            else if (name.startsWith('axon')) axon++;
            else if (name.startsWith('apical')) apical++;
            else if (name.startsWith('dend') || name.startsWith('basal')) basal++;
            else others++;
        });
    });
    return { soma, axon, apical, basal, others };
}

// --- The Main Component ---
const MorphoMenuBox = ({ onConfigurationChange, currentConfig, onFileChange, clientId, setupThreeDConfig, flushRef }) => {
    const [tabIndex, setTabIndex] = useState(() => typeToIndexMap[currentConfig?.type] ?? 0);

    const [somaValues, setSomaValues] = useState(() =>
        currentConfig?.type === 'soma' ? {
            somaDia: safeToString(toMicrons(currentConfig.somaDia), initialSomaState.somaDia),
            somaLen: safeToString(toMicrons(currentConfig.somaLen), initialSomaState.somaLen),
        } : initialSomaState
    );
    const [ballAndStickValues, setBallAndStickValues] = useState(() =>
        currentConfig?.type === 'ballAndStick' ? {
            somaDia: safeToString(toMicrons(currentConfig.somaDia), initialBallAndStickState.somaDia),
            somaLen: safeToString(toMicrons(currentConfig.somaLen), initialBallAndStickState.somaLen),
            dendDia: safeToString(toMicrons(currentConfig.dendDia), initialBallAndStickState.dendDia),
            dendLen: safeToString(toMicrons(currentConfig.dendLen), initialBallAndStickState.dendLen),
            dendNumSeg: safeToString(currentConfig.dendNumSeg, initialBallAndStickState.dendNumSeg),
        } : initialBallAndStickState
    );
    const [yBranchValues, setYBranchValues] = useState(() =>
        currentConfig?.type === 'branchedCell' ? {
            somaDia: safeToString(toMicrons(currentConfig.somaDia), initialYBranchState.somaDia),
            somaLen: safeToString(toMicrons(currentConfig.somaLen), initialYBranchState.somaLen),
            dendDia: safeToString(toMicrons(currentConfig.dendDia), initialYBranchState.dendDia),
            dendLen: safeToString(toMicrons(currentConfig.dendLen), initialYBranchState.dendLen),
            dendNumSeg: safeToString(currentConfig.dendNumSeg, initialYBranchState.dendNumSeg),
            branchDia: safeToString(toMicrons(currentConfig.branchDia), initialYBranchState.branchDia),
            branchLen: safeToString(toMicrons(currentConfig.branchLen), initialYBranchState.branchLen),
            branchNumSeg: safeToString(currentConfig.branchNumSeg, initialYBranchState.branchNumSeg),
        } : initialYBranchState
    );

    const comptCounts = useMemo(() => countSwcCompartments(setupThreeDConfig), [setupThreeDConfig]);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [uploadedItem, setUploadedItem] = useState(() =>
        currentConfig?.type === 'file' && currentConfig.source
            ? { name: currentConfig.source, staged_filename: currentConfig.source, source: 'Local', description: '', source_type: 'file' }
            : null
    );

    const handleProtoPickerSelect = useCallback((item) => {
        if (item.source_type === 'parametric') {
            setTabIndex(typeToIndexMap[item.morpho_type] ?? 0);
        } else if (item.staged_filename) {
            onFileChange({ filename: item.staged_filename });
            setUploadedItem(item);
            setTabIndex(3);
        }
    }, [onFileChange]);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const stateRefs = useRef({});
    useEffect(() => {
        stateRefs.current = { tabIndex, somaValues, ballAndStickValues, yBranchValues };
    }, [tabIndex, somaValues, ballAndStickValues, yBranchValues]);

    const handleSomaChange = useCallback((field, value) => setSomaValues(prev => ({ ...prev, [field]: value })), []);
    const handleBallAndStickChange = useCallback((field, value) => setBallAndStickValues(prev => ({ ...prev, [field]: value })), []);
    const handleYBranchChange = useCallback((field, value) => setYBranchValues(prev => ({ ...prev, [field]: value })), []);
    const handleTabChange = (event, newIndex) => setTabIndex(newIndex);

    const getMorphologyData = useCallback(() => {
        const { tabIndex, somaValues, ballAndStickValues, yBranchValues } = stateRefs.current;
        // Uploaded tab: file-based morphology is handled by onFileChange, not here
        if (tabIndex === 3) return null;

        const type = indexToTypeMap[tabIndex];
        if (!type) return null;

        let cellProtoData = { type };
        try {
            switch (tabIndex) {
                case 0:
                    cellProtoData.somaDia = toMeters(somaValues.somaDia);
                    cellProtoData.somaLen = toMeters(somaValues.somaLen);
                    break;
                case 1:
                    cellProtoData.somaDia = toMeters(ballAndStickValues.somaDia);
                    cellProtoData.somaLen = toMeters(ballAndStickValues.somaLen);
                    cellProtoData.dendDia = toMeters(ballAndStickValues.dendDia);
                    cellProtoData.dendLen = toMeters(ballAndStickValues.dendLen);
                    cellProtoData.dendNumSeg = parseInt(ballAndStickValues.dendNumSeg, 10) || 1;
                    break;
                case 2:
                    cellProtoData.somaDia = toMeters(yBranchValues.somaDia);
                    cellProtoData.somaLen = toMeters(yBranchValues.somaLen);
                    cellProtoData.dendDia = toMeters(yBranchValues.dendDia);
                    cellProtoData.dendLen = toMeters(yBranchValues.dendLen);
                    cellProtoData.dendNumSeg = parseInt(yBranchValues.dendNumSeg, 10) || 1;
                    cellProtoData.branchDia = toMeters(yBranchValues.branchDia);
                    cellProtoData.branchLen = toMeters(yBranchValues.branchLen);
                    cellProtoData.branchNumSeg = parseInt(yBranchValues.branchNumSeg, 10) || 1;
                    break;
                default: break;
            }
        } catch (error) {
            console.error("Error formatting morphology data:", error);
            return null;
        }
        return { cellProto: cellProtoData };
    }, []);

    useEffect(() => {
        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getMorphologyData();
                if (configData) {
                    onConfigurationChangeRef.current(configData);
                }
            }
        };
    }, [getMorphologyData]);

    useEffect(() => {
        if (!flushRef) return;
        flushRef.current = getMorphologyData;
        return () => { flushRef.current = null; };
    }, [flushRef, getMorphologyData]);
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [allenOpen, setAllenOpen] = React.useState(false);
    const handleAllenOpen = () => setAllenOpen(true);
    const handleAllenClose = () => setAllenOpen(false);

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <ProtoPickerDialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleProtoPickerSelect}
                type="morpho"
                title="Select Morphology Prototype"
                clientId={clientId}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>Morphology</Typography>
                <Button size="small" variant="outlined" startIcon={<LibraryBooksIcon fontSize="small" />} onClick={() => setPickerOpen(true)}>
                    Browse Library…
                </Button>
            </Box>

            <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth" sx={{ '& .MuiTab-root': { minHeight: 72 } }}>
                <Tooltip title={helpText.tabs.soma} placement="bottom"><Tab icon={<img src={somaIcon} alt="Soma" style={{ height: 40 }} />} label="Soma" /></Tooltip>
                <Tooltip title={helpText.tabs.ballAndStick} placement="bottom"><Tab icon={<img src={ballAndStickIcon} alt="Ball & Stick" style={{ height: 40 }} />} label="Ball & Stick" /></Tooltip>
                <Tooltip title={helpText.tabs.yBranch} placement="bottom"><Tab icon={<img src={yBranchIcon} alt="Y Branch" style={{ height: 40 }} />} label="Y Branch" /></Tooltip>
                <Tooltip title={helpText.tabs.file} placement="bottom"><Tab icon={<img src={fileIcon} alt="Uploaded" style={{ height: 40 }} />} label="Uploaded" /></Tooltip>
            </Tabs>

            <Box sx={{ mt: 2, p: 1 }}>
                {tabIndex === 0 && (() => {
                    const eDia = validatePositiveNum(somaValues.somaDia);
                    const wDia = warnOnly(eDia, Number(somaValues.somaDia) > 500 ? 'Unusually large soma diameter (> 500 µm)' : null);
                    const eLen = validatePositiveNum(somaValues.somaLen);
                    const wLen = warnOnly(eLen, Number(somaValues.somaLen) > 2000 ? 'Unusually long (> 2000 µm)' : null);
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom>Soma</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={somaValues.somaDia} onChange={handleSomaChange} helptext={helpText.fields.soma.somaDia} {...fieldProps(eDia, wDia)} /></Grid>
                                <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={somaValues.somaLen} onChange={handleSomaChange} helptext={helpText.fields.soma.somaLen} {...fieldProps(eLen, wLen)} /></Grid>
                            </Grid>
                        </Box>
                    );
                })()}
                {tabIndex === 1 && (() => {
                    const somaDiaNum = Number(ballAndStickValues.somaDia);
                    const eSomaDia = validatePositiveNum(ballAndStickValues.somaDia);
                    const wSomaDia = warnOnly(eSomaDia, somaDiaNum > 500 ? 'Unusually large soma diameter (> 500 µm)' : null);
                    const eSomaLen = validatePositiveNum(ballAndStickValues.somaLen);
                    const wSomaLen = warnOnly(eSomaLen, Number(ballAndStickValues.somaLen) > 2000 ? 'Unusually long (> 2000 µm)' : null);

                    const dendDiaNum = Number(ballAndStickValues.dendDia);
                    const eDendDia = validatePositiveNum(ballAndStickValues.dendDia);
                    const wDendDia = warnOnly(eDendDia,
                        dendDiaNum > 20 ? 'Large dendrite diameter (> 20 µm)' : null,
                        !eSomaDia && dendDiaNum > somaDiaNum ? 'Exceeds soma diameter' : null);
                    const eDendLen = validatePositiveNum(ballAndStickValues.dendLen);
                    const wDendLen = warnOnly(eDendLen, Number(ballAndStickValues.dendLen) > 2000 ? 'Unusually long (> 2000 µm)' : null);

                    const dendSegNum = parseInt(ballAndStickValues.dendNumSeg, 10);
                    const eDendSeg = validatePositiveInt(ballAndStickValues.dendNumSeg);
                    const segLen = !eDendSeg && dendSegNum > 0 ? Number(ballAndStickValues.dendLen) / dendSegNum : null;
                    const wDendSeg = warnOnly(eDendSeg,
                        dendSegNum > 500 ? 'Segment count > 500 will slow simulation' : null,
                        segLen !== null && segLen < 10 ? `Segment length ${segLen.toFixed(1)} µm is very short` : null);
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom>Ball and Stick</Typography>
                            <Grid container spacing={2} rowSpacing={1.5}>
                                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Soma</Typography></Grid>
                                <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={ballAndStickValues.somaDia} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.somaDia} {...fieldProps(eSomaDia, wSomaDia)} /></Grid>
                                <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={ballAndStickValues.somaLen} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.somaLen} {...fieldProps(eSomaLen, wSomaLen)} /></Grid>
                                <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="text.secondary">Dendrite</Typography></Grid>
                                <Grid item xs={6}><HelpField id="dendDia" label="Diameter (μm)" value={ballAndStickValues.dendDia} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.dendDia} {...fieldProps(eDendDia, wDendDia)} /></Grid>
                                <Grid item xs={6}><HelpField id="dendLen" label="Length (μm)" value={ballAndStickValues.dendLen} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.dendLen} {...fieldProps(eDendLen, wDendLen)} /></Grid>
                                <Grid item xs={12}><HelpField id="dendNumSeg" label="Segments (#)" value={ballAndStickValues.dendNumSeg} onChange={handleBallAndStickChange} type="number" helptext={helpText.fields.ballAndStick.dendNumSeg} InputProps={{ inputProps: { min: 1, step: 2 } }} {...fieldProps(eDendSeg, wDendSeg)} /></Grid>
                            </Grid>
                        </Box>
                    );
                })()}
                {tabIndex === 2 && (() => {
                    const somaDiaNum = Number(yBranchValues.somaDia);
                    const eSomaDia = validatePositiveNum(yBranchValues.somaDia);
                    const wSomaDia = warnOnly(eSomaDia, somaDiaNum > 500 ? 'Unusually large soma diameter (> 500 µm)' : null);
                    const eSomaLen = validatePositiveNum(yBranchValues.somaLen);
                    const wSomaLen = warnOnly(eSomaLen, Number(yBranchValues.somaLen) > 2000 ? 'Unusually long (> 2000 µm)' : null);

                    const dendDiaNum = Number(yBranchValues.dendDia);
                    const eDendDia = validatePositiveNum(yBranchValues.dendDia);
                    const wDendDia = warnOnly(eDendDia,
                        dendDiaNum > 20 ? 'Large dendrite diameter (> 20 µm)' : null,
                        !eSomaDia && dendDiaNum > somaDiaNum ? 'Exceeds soma diameter' : null);
                    const eDendLen = validatePositiveNum(yBranchValues.dendLen);
                    const wDendLen = warnOnly(eDendLen, Number(yBranchValues.dendLen) > 2000 ? 'Unusually long (> 2000 µm)' : null);
                    const dendSegNum = parseInt(yBranchValues.dendNumSeg, 10);
                    const eDendSeg = validatePositiveInt(yBranchValues.dendNumSeg);
                    const dendSegLen = !eDendSeg && dendSegNum > 0 ? Number(yBranchValues.dendLen) / dendSegNum : null;
                    const wDendSeg = warnOnly(eDendSeg,
                        dendSegNum > 500 ? 'Segment count > 500 will slow simulation' : null,
                        dendSegLen !== null && dendSegLen < 10 ? `Segment length ${dendSegLen.toFixed(1)} µm is very short` : null);

                    const branchDiaNum = Number(yBranchValues.branchDia);
                    const eBranchDia = validatePositiveNum(yBranchValues.branchDia);
                    const wBranchDia = warnOnly(eBranchDia,
                        branchDiaNum > 20 ? 'Large branch diameter (> 20 µm)' : null,
                        !eSomaDia && branchDiaNum > somaDiaNum ? 'Exceeds soma diameter' : null);
                    const eBranchLen = validatePositiveNum(yBranchValues.branchLen);
                    const wBranchLen = warnOnly(eBranchLen, Number(yBranchValues.branchLen) > 2000 ? 'Unusually long (> 2000 µm)' : null);
                    const branchSegNum = parseInt(yBranchValues.branchNumSeg, 10);
                    const eBranchSeg = validatePositiveInt(yBranchValues.branchNumSeg);
                    const branchSegLen = !eBranchSeg && branchSegNum > 0 ? Number(yBranchValues.branchLen) / branchSegNum : null;
                    const wBranchSeg = warnOnly(eBranchSeg,
                        branchSegNum > 500 ? 'Segment count > 500 will slow simulation' : null,
                        branchSegLen !== null && branchSegLen < 10 ? `Segment length ${branchSegLen.toFixed(1)} µm is very short` : null);
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom>Y Branch</Typography>
                            <Grid container spacing={2} rowSpacing={1.5}>
                                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Soma</Typography></Grid>
                                <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={yBranchValues.somaDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.somaDia} {...fieldProps(eSomaDia, wSomaDia)} /></Grid>
                                <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={yBranchValues.somaLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.somaLen} {...fieldProps(eSomaLen, wSomaLen)} /></Grid>
                                <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="text.secondary">Dendrite Trunk</Typography></Grid>
                                <Grid item xs={6}><HelpField id="dendDia" label="Diameter (μm)" value={yBranchValues.dendDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.dendDia} {...fieldProps(eDendDia, wDendDia)} /></Grid>
                                <Grid item xs={6}><HelpField id="dendLen" label="Length (μm)" value={yBranchValues.dendLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.dendLen} {...fieldProps(eDendLen, wDendLen)} /></Grid>
                                <Grid item xs={12}><HelpField id="dendNumSeg" label="Segments (#)" value={yBranchValues.dendNumSeg} onChange={handleYBranchChange} type="number" helptext={helpText.fields.yBranch.dendNumSeg} InputProps={{ inputProps: { min: 1, step: 1 } }} {...fieldProps(eDendSeg, wDendSeg)} /></Grid>
                                <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="text.secondary">Daughter Branches</Typography></Grid>
                                <Grid item xs={6}><HelpField id="branchDia" label="Diameter (μm)" value={yBranchValues.branchDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.branchDia} {...fieldProps(eBranchDia, wBranchDia)} /></Grid>
                                <Grid item xs={6}><HelpField id="branchLen" label="Length (μm)" value={yBranchValues.branchLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.branchLen} {...fieldProps(eBranchLen, wBranchLen)} /></Grid>
                                <Grid item xs={12}><HelpField id="branchNumSeg" label="Segments (#)" value={yBranchValues.branchNumSeg} onChange={handleYBranchChange} type="number" helptext={helpText.fields.yBranch.branchNumSeg} InputProps={{ inputProps: { min: 1, step: 1 } }} {...fieldProps(eBranchSeg, wBranchSeg)} /></Grid>
                            </Grid>
                        </Box>
                    );
                })()}
                {tabIndex === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Uploaded Morphology</Typography>
                        {uploadedItem ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2">
                                    <strong>File:</strong> {uploadedItem.staged_filename || uploadedItem.name}
                                </Typography>
                                {uploadedItem.name && uploadedItem.name !== uploadedItem.staged_filename && (
                                    <Typography variant="body2"><strong>Name:</strong> {uploadedItem.name}</Typography>
                                )}
                                {uploadedItem.source && uploadedItem.source !== 'Upload' && (
                                    <Typography variant="body2"><strong>Source:</strong> {uploadedItem.source}</Typography>
                                )}
                                {uploadedItem.description && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{uploadedItem.description}</Typography>
                                )}
                                {comptCounts && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Compartments:</Typography>
                                        <Box component="table" sx={{ borderCollapse: 'collapse', '& td': { pr: 2, py: 0.25 } }}>
                                            <tbody>
                                                {[['Soma', comptCounts.soma], ['Axon', comptCounts.axon], ['Apical', comptCounts.apical], ['Dendrite', comptCounts.basal], ['Others', comptCounts.others]].map(([label, count]) => (
                                                    <tr key={label}>
                                                        <td><Typography variant="body2">{label}</Typography></td>
                                                        <td><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{count}</Typography></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                                No morphology file loaded. Use "Browse Library…" to upload or select a file.
                            </Alert>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MorphoMenuBox;
