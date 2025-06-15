import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Tabs, Tab, Typography, TextField, Grid, Tooltip, IconButton, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';


// --- IMPORTANT: FOR YOUR LOCAL DEVELOPMENT ---
// The 'import' statements for local files have been temporarily replaced
// to allow this code to run in the interactive preview.
// When you copy this code to your project, please REVERT to using your local imports like this:
import helpText from './MorphoMenuBox.Help.json';
import fileIcon from '../../assets/file.png';
import somaIcon from '../../assets/soma.png';
import ballAndStickIcon from '../../assets/ballAndStick.png';
import yBranchIcon from '../../assets/ybranch.png';
import { formatFloat } from '../../utils/formatters.js';

/*
// --- Placeholder for helpText from './MorphoMenuBox.Help.json' ---
const helpText = {
  "tabs": {
    "file": "Load a morphology from an external file (e.g., SWC, HOC). This provides the most detailed and realistic cell structures.",
    "soma": "A simple model representing only the cell body (soma) as a single cylinder. Useful for very basic simulations.",
    "ballAndStick": "A classic simplified model consisting of a spherical soma and a single, unbranched cylindrical dendrite.",
    "yBranch": "A model with a soma, a primary dendrite, and a single bifurcation (split) into two daughter branches."
  },
  "fields": {
    "file": {
      "source": "Click to select the morphology file from your local system. Supported formats include .swc, .hoc, etc."
    },
    "soma": {
      "somaDia": "The diameter of the soma (cell body) in microns (μm).",
      "somaLen": "The length of the soma (cell body) in microns (μm). For a sphere, this should be equal to the diameter."
    },
    "ballAndStick": {
      "somaDia": "The diameter of the 'ball' (soma) in microns (μm).",
      "somaLen": "The length of the soma cylinder in microns (μm). For a sphere, this should be equal to the diameter.",
      "dendDia": "The diameter of the 'stick' (dendrite) in microns (μm).",
      "dendLen": "The total length of the dendrite in microns (μm).",
      "dendNumSeg": "The number of discrete electrical compartments to divide the dendrite into. More segments provide higher accuracy but increase computation time. Must be an odd integer ≥ 1."
    },
    "yBranch": {
      "somaDia": "The diameter of the soma in microns (μm).",
      "somaLen": "The length of the soma in microns (μm).",
      "dendDia": "The diameter of the main dendrite trunk before it splits, in microns (μm).",
      "dendLen": "The length of the main dendrite trunk, in microns (μm).",
      "dendNumSeg": "The number of segments for the main dendrite trunk.",
      "branchDia": "The diameter of the two identical daughter branches after the split, in microns (μm).",
      "branchLen": "The length of each of the two daughter branches, in microns (μm).",
      "branchNumSeg": "The number of segments for each daughter branch."
    }
  }
};

// --- Placeholders for local image assets ---
const fileIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const somaIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const ballAndStickIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const yBranchIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// --- Placeholder for formatFloat from '../../utils/formatters.js' ---
const formatFloat = (num) => {
    if (num == null) return '';
    const preciseNum = parseFloat(Number(num).toPrecision(15));
    return String(preciseNum);
};
*/


// --- Unit Conversion Helpers ---
const toMeters = (microns) => {
    const meterValue = (parseFloat(microns) * 1e-6 || 0);
    return formatFloat(meterValue);
};
const toMicrons = (meters) => {
    const micronValue = (parseFloat(meters) || 0) * 1e6;
    return formatFloat(micronValue);
};
const safeToString = (value, defaultValue = '') => (value != null ? String(value) : defaultValue);

// --- Default state values (in MICRONS) ---
const initialFileState = { source: '' };
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

// --- Mappings for tabs ---
const typeToIndexMap = { "file": 0, "soma": 1, "ballAndStick": 2, "branchedCell": 3 };
const indexToTypeMap = ["file", "soma", "ballAndStick", "branchedCell"];

// --- Reusable Field Component with Tooltip (Moved outside the main component) ---
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
const MorphoMenuBox = ({ onConfigurationChange, currentConfig }) => {
    // --- State Initialization ---
    const [tabIndex, setTabIndex] = useState(() => typeToIndexMap[currentConfig?.type] ?? 0);

    const [fileValues, setFileValues] = useState(() =>
        currentConfig?.type === 'file' ? { source: safeToString(currentConfig.source) } : initialFileState
    );
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

    // Refs for unmount logic and file picker
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const stateRefs = useRef({});
    useEffect(() => {
      stateRefs.current = { tabIndex, fileValues, somaValues, ballAndStickValues, yBranchValues };
    }, [tabIndex, fileValues, somaValues, ballAndStickValues, yBranchValues]);
    const fileInputRef = useRef(null);

    // --- Handlers ---
    const handleSomaChange = useCallback((field, value) => {
        setSomaValues(prev => ({...prev, [field]: value}));
    }, []);

    const handleBallAndStickChange = useCallback((field, value) => {
        setBallAndStickValues(prev => ({...prev, [field]: value}));
    }, []);

    const handleYBranchChange = useCallback((field, value) => {
        setYBranchValues(prev => ({...prev, [field]: value}));
    }, []);


    const handleTabChange = (event, newIndex) => setTabIndex(newIndex);
    
    const handleFileSelect = () => fileInputRef.current.click();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFileValues({ source: file.name });
        }
    };
    
    // --- Unmount Logic ---
    useEffect(() => {
        const getMorphologyDataForUnmount = () => {
            const { tabIndex, fileValues, somaValues, ballAndStickValues, yBranchValues } = stateRefs.current;
            const type = indexToTypeMap[tabIndex];
            if (!type) return { cellProto: {} };
    
            let cellProtoData = { type };
            try {
                switch (tabIndex) {
                    case 0: cellProtoData.source = fileValues.source || ""; break;
                    case 1: 
                        cellProtoData.somaDia = toMeters(somaValues.somaDia);
                        cellProtoData.somaLen = toMeters(somaValues.somaLen);
                        break;
                    case 2:
                        cellProtoData.somaDia = toMeters(ballAndStickValues.somaDia);
                        cellProtoData.somaLen = toMeters(ballAndStickValues.somaLen);
                        cellProtoData.dendDia = toMeters(ballAndStickValues.dendDia);
                        cellProtoData.dendLen = toMeters(ballAndStickValues.dendLen);
                        cellProtoData.dendNumSeg = parseInt(ballAndStickValues.dendNumSeg, 10) || 1;
                        break;
                    case 3:
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
                if (configData.cellProto?.type !== "error") {
                    onConfigurationChangeRef.current(configData);
                }
            }
        };
    }, []);

    // --- JSX Rendering ---
    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth">
                <Tooltip title={helpText.tabs.file} placement="top"><Tab icon={<img src={fileIcon} alt="File" style={{ height: 24 }} />} label="File" /></Tooltip>
                <Tooltip title={helpText.tabs.soma} placement="top"><Tab icon={<img src={somaIcon} alt="Soma" style={{ height: 24 }} />} label="Soma" /></Tooltip>
                <Tooltip title={helpText.tabs.ballAndStick} placement="top"><Tab icon={<img src={ballAndStickIcon} alt="Ball and Stick" style={{ height: 24 }} />} label="Ball & Stick" /></Tooltip>
                <Tooltip title={helpText.tabs.yBranch} placement="top"><Tab icon={<img src={yBranchIcon} alt="Y Branch" style={{ height: 24 }} />} label="Y Branch" /></Tooltip>
            </Tabs>

            <Box sx={{ mt: 2, p: 1 }}>
                {tabIndex === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>File-based Morphology</Typography>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleFileSelect}>Select Morphology File...</Button>
                            <Tooltip title={helpText.fields.file.source} placement="right"><IconButton size="small"><InfoOutlinedIcon /></IconButton></Tooltip>
                        </Box>
                        {fileValues.source && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>Selected: {fileValues.source}</Typography>}
                    </Box>
                )}
                {tabIndex === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Soma</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={somaValues.somaDia} onChange={handleSomaChange} helptext={helpText.fields.soma.somaDia} /></Grid>
                             <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={somaValues.somaLen} onChange={handleSomaChange} helptext={helpText.fields.soma.somaLen} /></Grid>
                        </Grid>
                    </Box>
                )}
                {tabIndex === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Ball and Stick</Typography>
                        <Grid container spacing={2} rowSpacing={1.5}>
                            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Soma</Typography></Grid>
                            <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={ballAndStickValues.somaDia} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.somaDia} /></Grid>
                            <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={ballAndStickValues.somaLen} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.somaLen} /></Grid>
                            <Grid item xs={12} sx={{mt:1}}><Typography variant="subtitle2" color="text.secondary">Dendrite</Typography></Grid>
                            <Grid item xs={6}><HelpField id="dendDia" label="Diameter (μm)" value={ballAndStickValues.dendDia} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.dendDia} /></Grid>
                            <Grid item xs={6}><HelpField id="dendLen" label="Length (μm)" value={ballAndStickValues.dendLen} onChange={handleBallAndStickChange} helptext={helpText.fields.ballAndStick.dendLen} /></Grid>
                            <Grid item xs={12}><HelpField id="dendNumSeg" label="Segments (#)" value={ballAndStickValues.dendNumSeg} onChange={handleBallAndStickChange} type="number" helptext={helpText.fields.ballAndStick.dendNumSeg} InputProps={{ inputProps: { min: 1, step: 2 } }} /></Grid>
                        </Grid>
                    </Box>
                )}
                 {tabIndex === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Y Branch</Typography>
                        <Grid container spacing={2} rowSpacing={1.5}>
                            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Soma</Typography></Grid>
                            <Grid item xs={6}><HelpField id="somaDia" label="Diameter (μm)" value={yBranchValues.somaDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.somaDia} /></Grid>
                            <Grid item xs={6}><HelpField id="somaLen" label="Length (μm)" value={yBranchValues.somaLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.somaLen} /></Grid>
                            <Grid item xs={12} sx={{mt:1}}><Typography variant="subtitle2" color="text.secondary">Dendrite Trunk</Typography></Grid>
                            <Grid item xs={6}><HelpField id="dendDia" label="Diameter (μm)" value={yBranchValues.dendDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.dendDia} /></Grid>
                            <Grid item xs={6}><HelpField id="dendLen" label="Length (μm)" value={yBranchValues.dendLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.dendLen} /></Grid>
                            <Grid item xs={12}><HelpField id="dendNumSeg" label="Segments (#)" value={yBranchValues.dendNumSeg} onChange={handleYBranchChange} type="number" helptext={helpText.fields.yBranch.dendNumSeg} InputProps={{ inputProps: { min: 1, step: 1 } }} /></Grid>
                            <Grid item xs={12} sx={{mt:1}}><Typography variant="subtitle2" color="text.secondary">Daughter Branches</Typography></Grid>
                            <Grid item xs={6}><HelpField id="branchDia" label="Diameter (μm)" value={yBranchValues.branchDia} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.branchDia} /></Grid>
                            <Grid item xs={6}><HelpField id="branchLen" label="Length (μm)" value={yBranchValues.branchLen} onChange={handleYBranchChange} helptext={helpText.fields.yBranch.branchLen} /></Grid>
                            <Grid item xs={12}><HelpField id="branchNumSeg" label="Segments (#)" value={yBranchValues.branchNumSeg} onChange={handleYBranchChange} type="number" helptext={helpText.fields.yBranch.branchNumSeg} InputProps={{ inputProps: { min: 1, step: 1 } }} /></Grid>
                        </Grid>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MorphoMenuBox;

