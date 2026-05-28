import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Tabs, Tab, Typography, TextField, Grid, Tooltip, IconButton, Button, Chip } from '@mui/material';
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

// --- The Main Component ---
const MorphoMenuBox = ({ onConfigurationChange, currentConfig, onFileChange, clientId }) => {
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

    const handleSomaChange = useCallback((field, value) => setSomaValues(prev => ({...prev, [field]: value})), []);
    const handleBallAndStickChange = useCallback((field, value) => setBallAndStickValues(prev => ({...prev, [field]: value})), []);
    const handleYBranchChange = useCallback((field, value) => setYBranchValues(prev => ({...prev, [field]: value})), []);
    const handleTabChange = (event, newIndex) => setTabIndex(newIndex);

    useEffect(() => {
        const getMorphologyDataForUnmount = () => {
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
                console.error("Error formatting morphology data on unmount:", error);
                return { cellProto: { type: "error" } };
            }
            return { cellProto: cellProtoData };
        };

        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getMorphologyDataForUnmount();
                if (configData && configData.cellProto?.type !== "error") {
                    onConfigurationChangeRef.current(configData);
                }
            }
        };
    }, []);

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
                {tabIndex === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Soma</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={somaValues.somaDia} onChange={handleSomaChange} helptext={helpText.fields.soma.somaDia} /></Grid>
                            <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={somaValues.somaLen} onChange={handleSomaChange} helptext={helpText.fields.soma.somaLen} /></Grid>
                        </Grid>
                    </Box>
                )}
                {tabIndex === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Ball and Stick</Typography>
                        <Grid container spacing={2} rowSpacing={1.5}>
                            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Soma</Typography></Grid>
                            <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={ballAndStickValues.somaDia} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.somaDia} /></Grid>
                            <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={ballAndStickValues.somaLen} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.somaLen} /></Grid>
                            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="text.secondary">Dendrite</Typography></Grid>
                            <Grid item xs={6}><HelpField id="dendDia" label="Diameter (μm)" value={ballAndStickValues.dendDia} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.dendDia} /></Grid>
                            <Grid item xs={6}><HelpField id="dendLen" label="Length (μm)" value={ballAndStickValues.dendLen} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.dendLen} /></Grid>
                            <Grid item xs={12}><HelpField id="dendNumSeg" label="Segments (#)" value={ballAndStickValues.dendNumSeg} onChange={handleBallAndStickChange} type="number" helptext={helpText.fields.ballAndStick.dendNumSeg} InputProps={{ inputProps: { min: 1, step: 2 } }} /></Grid>
                        </Grid>
                    </Box>
                )}
                {tabIndex === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Y Branch</Typography>
                        <Grid container spacing={2} rowSpacing={1.5}>
                            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Soma</Typography></Grid>
                            <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={yBranchValues.somaDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.somaDia} /></Grid>
                            <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={yBranchValues.somaLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.somaLen} /></Grid>
                            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="text.secondary">Dendrite Trunk</Typography></Grid>
                            <Grid item xs={6}><HelpField id="dendDia" label="Diameter (μm)" value={yBranchValues.dendDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.dendDia} /></Grid>
                            <Grid item xs={6}><HelpField id="dendLen" label="Length (μm)" value={yBranchValues.dendLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.dendLen} /></Grid>
                            <Grid item xs={12}><HelpField id="dendNumSeg" label="Segments (#)" value={yBranchValues.dendNumSeg} onChange={handleYBranchChange} type="number" helptext={helpText.fields.yBranch.dendNumSeg} InputProps={{ inputProps: { min: 1, step: 1 } }} /></Grid>
                            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="text.secondary">Daughter Branches</Typography></Grid>
                            <Grid item xs={6}><HelpField id="branchDia" label="Diameter (μm)" value={yBranchValues.branchDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.branchDia} /></Grid>
                            <Grid item xs={6}><HelpField id="branchLen" label="Length (μm)" value={yBranchValues.branchLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.branchLen} /></Grid>
                            <Grid item xs={12}><HelpField id="branchNumSeg" label="Segments (#)" value={yBranchValues.branchNumSeg} onChange={handleYBranchChange} type="number" helptext={helpText.fields.yBranch.branchNumSeg} InputProps={{ inputProps: { min: 1, step: 1 } }} /></Grid>
                        </Grid>
                    </Box>
                )}
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
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip label={uploadedItem.source_type || 'file'} size="small" variant="outlined" />
                                </Box>
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                No file loaded. Use "Browse Library…" to upload or select a morphology file.
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MorphoMenuBox;
