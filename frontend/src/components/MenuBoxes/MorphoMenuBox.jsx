import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { Box, Tabs, Tab, Typography, TextField, Grid } from '@mui/material';
import fileIcon from '../../assets/file.png';
import somaIcon from '../../assets/soma.png';
import ballAndStickIcon from '../../assets/ballAndStick.png';
import yBranchIcon from '../../assets/ybranch.png';

// Helper to safely convert value to string for text fields
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default values for each morphology type state
const initialFileState = { source: '' };
const initialSomaState = { somaDia: '5e-4', somaLen: '5e-4' };
const initialBallAndStickState = {
    somaDia: '10e-6', somaLen: '10e-6',
    dendDia: '4e-6', dendLen: '200e-6', dendNumSeg: '1'
};
const initialYBranchState = { // Maps to branchedCell
    somaDia: '10e-6', somaLen: '10e-6',
    dendDia: '10e-6', dendLen: '200e-6', dendNumSeg: '1',
    branchDia: '2.5e-6', branchLen: '200e-6', branchNumSeg: '1'
};

// Mapping from schema type to tab index
const typeToIndexMap = {
    "file": 0,
    "soma": 1,
    "ballAndStick": 2,
    "branchedCell": 3,
};
// Mapping from tab index to schema type
const indexToTypeMap = ["file", "soma", "ballAndStick", "branchedCell"];


// Accept currentConfig prop
const MorphoMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [tabIndex, setTabIndex] = useState(() => {
        const initialType = currentConfig?.type;
        return typeToIndexMap[initialType] ?? 0; // Default to tab 0 if type unknown/missing
    });

    const [fileValues, setFileValues] = useState(() =>
        currentConfig?.type === 'file'
            ? { source: safeToString(currentConfig?.source, initialFileState.source) }
            : initialFileState
    );
    const [somaValues, setSomaValues] = useState(() =>
        currentConfig?.type === 'soma'
            ? {
                  somaDia: safeToString(currentConfig?.somaDia, initialSomaState.somaDia),
                  somaLen: safeToString(currentConfig?.somaLen, initialSomaState.somaLen),
              }
            : initialSomaState
    );
    const [ballAndStickValues, setBallAndStickValues] = useState(() =>
        currentConfig?.type === 'ballAndStick'
            ? {
                  somaDia: safeToString(currentConfig?.somaDia, initialBallAndStickState.somaDia),
                  somaLen: safeToString(currentConfig?.somaLen, initialBallAndStickState.somaLen),
                  dendDia: safeToString(currentConfig?.dendDia, initialBallAndStickState.dendDia),
                  dendLen: safeToString(currentConfig?.dendLen, initialBallAndStickState.dendLen),
                  dendNumSeg: safeToString(currentConfig?.dendNumSeg, initialBallAndStickState.dendNumSeg),
              }
            : initialBallAndStickState
    );
    const [yBranchValues, setYBranchValues] = useState(() =>
        currentConfig?.type === 'branchedCell'
            ? {
                  somaDia: safeToString(currentConfig?.somaDia, initialYBranchState.somaDia),
                  somaLen: safeToString(currentConfig?.somaLen, initialYBranchState.somaLen),
                  dendDia: safeToString(currentConfig?.dendDia, initialYBranchState.dendDia),
                  dendLen: safeToString(currentConfig?.dendLen, initialYBranchState.dendLen),
                  dendNumSeg: safeToString(currentConfig?.dendNumSeg, initialYBranchState.dendNumSeg),
                  branchDia: safeToString(currentConfig?.branchDia, initialYBranchState.branchDia),
                  branchLen: safeToString(currentConfig?.branchLen, initialYBranchState.branchLen),
                  branchNumSeg: safeToString(currentConfig?.branchNumSeg, initialYBranchState.branchNumSeg),
              }
            : initialYBranchState
    );
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const tabIndexRef = useRef(tabIndex);
    useEffect(() => { tabIndexRef.current = tabIndex; }, [tabIndex]);
    const fileValuesRef = useRef(fileValues);
    useEffect(() => { fileValuesRef.current = fileValues; }, [fileValues]);
    const somaValuesRef = useRef(somaValues);
    useEffect(() => { somaValuesRef.current = somaValues; }, [somaValues]);
    const ballAndStickValuesRef = useRef(ballAndStickValues);
    useEffect(() => { ballAndStickValuesRef.current = ballAndStickValues; }, [ballAndStickValues]);
    const yBranchValuesRef = useRef(yBranchValues);
    useEffect(() => { yBranchValuesRef.current = yBranchValues; }, [yBranchValues]);


    // --- Handlers ONLY update LOCAL state ---
    const handleChange = (index, field, value) => {
        console.log(`MorphoMenuBox: Local state change - Tab ${index}, Field ${field}: ${value}`);
        switch (index) {
            case 0: setFileValues(prev => ({ ...prev, [field]: value })); break;
            case 1: setSomaValues(prev => ({ ...prev, [field]: value })); break;
            case 2: setBallAndStickValues(prev => ({ ...prev, [field]: value })); break;
            case 3: setYBranchValues(prev => ({ ...prev, [field]: value })); break;
            default: break;
        }
    };

    const handleTabChange = (event, newIndex) => {
         console.log(`MorphoMenuBox: Local state change - Tab Index: ${newIndex}`);
        setTabIndex(newIndex);
    };
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getMorphologyDataForUnmount = () => {
        // Use refs to get latest state at time of unmount
        const currentTabIndex = tabIndexRef.current;
        const currentFileValues = fileValuesRef.current;
        const currentSomaValues = somaValuesRef.current;
        const currentBallStickValues = ballAndStickValuesRef.current;
        const currentYBranchValues = yBranchValuesRef.current;

        console.log(`MorphoMenuBox: Formatting final local state for push (Tab ${currentTabIndex})`);

        let cellProtoData = {};
        try {
            const type = indexToTypeMap[currentTabIndex];
            if (!type) {
                console.error("Invalid tab index on unmount:", currentTabIndex);
                return { cellProto: {} }; // Return empty object if type invalid
            }
            cellProtoData.type = type;

            switch (currentTabIndex) {
                case 0: // File
                    cellProtoData.source = currentFileValues.source || "";
                    break;
                case 1: // Soma
                    cellProtoData.somaDia = parseFloat(currentSomaValues.somaDia) || 0;
                    cellProtoData.somaLen = parseFloat(currentSomaValues.somaLen) || 0;
                    break;
                case 2: // Ball and Stick
                    cellProtoData.somaDia = parseFloat(currentBallStickValues.somaDia) || 0;
                    cellProtoData.somaLen = parseFloat(currentBallStickValues.somaLen) || 0;
                    cellProtoData.dendDia = parseFloat(currentBallStickValues.dendDia) || 0;
                    cellProtoData.dendLen = parseFloat(currentBallStickValues.dendLen) || 0;
                    cellProtoData.dendNumSeg = parseInt(currentBallStickValues.dendNumSeg, 10) || 1;
                    break;
                case 3: // Y Branch (branchedCell)
                    cellProtoData.somaDia = parseFloat(currentYBranchValues.somaDia) || 0;
                    cellProtoData.somaLen = parseFloat(currentYBranchValues.somaLen) || 0;
                    cellProtoData.dendDia = parseFloat(currentYBranchValues.dendDia) || 0;
                    cellProtoData.dendLen = parseFloat(currentYBranchValues.dendLen) || 0;
                    cellProtoData.dendNumSeg = parseInt(currentYBranchValues.dendNumSeg, 10) || 1;
                    cellProtoData.branchDia = parseFloat(currentYBranchValues.branchDia) || 0;
                    cellProtoData.branchLen = parseFloat(currentYBranchValues.branchLen) || 0;
                    cellProtoData.branchNumSeg = parseInt(currentYBranchValues.branchNumSeg, 10) || 1;
                    break;
                default:
                    // Should not happen due to check above
                    break;
            }
        } catch (error) {
            console.error("Error parsing morphology data on unmount:", error);
            return { cellProto: { type: "error", message: "Failed to parse values on save" } }; // Return error state
        }

        // Return the data nested under the correct top-level key for App.jsx
        return { cellProto: cellProtoData };
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("MorphoMenuBox: Mounted, setting up unmount cleanup.");
        // This function runs ONLY when the component is about to unmount
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("MorphoMenuBox: Unmounting, pushing final state up.");
                const configData = getMorphologyDataForUnmount();
                // Ensure we only push valid data
                if (configData.cellProto && configData.cellProto.type !== "error") {
                    latestOnConfigurationChange(configData);
                } else {
                    console.warn("MorphoMenuBox: Not pushing invalid or error state on unmount.");
                }
            } else {
                console.warn("MorphoMenuBox: onConfigurationChange not available on unmount.");
            }
        };
        // Empty dependency array ensures this effect runs only on mount/unmount
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (Values come from local state) ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            {/* Tab Header */}
            <Tabs value={tabIndex} onChange={handleTabChange}>
                <Tab icon={<img src={fileIcon} alt="File" style={{ width: '24px', marginBottom: '-6px' }} />} label="File" />
                <Tab icon={<img src={somaIcon} alt="Soma" style={{ width: '24px', marginBottom: '-6px' }} />} label="Soma" />
                <Tab icon={<img src={ballAndStickIcon} alt="Ball and Stick" style={{ width: '24px', marginBottom: '-6px' }} />} label="Ball and Stick" />
                <Tab icon={<img src={yBranchIcon} alt="Y Branch" style={{ width: '24px', marginBottom: '-6px' }} />} label="Y Branch" />
            </Tabs>

            {/* Tab Content */}
            <Box style={{ marginTop: '16px' }}>
                {/* File Tab */}
                {tabIndex === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>File</Typography>
                        <TextField fullWidth size="small" label="Morphology File Path" variant="outlined" style={{ marginBottom: '8px' }}
                            value={fileValues.source} onChange={(e) => handleChange(0, 'source', e.target.value)} />
                    </Box>
                )}
                 {/* Soma Tab */}
                {tabIndex === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Soma</Typography>
                        <TextField fullWidth size="small" label="Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                            value={somaValues.somaDia} onChange={(e) => handleChange(1, 'somaDia', e.target.value)} />
                        <TextField fullWidth size="small" label="Length (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                            value={somaValues.somaLen} onChange={(e) => handleChange(1, 'somaLen', e.target.value)} />
                    </Box>
                )}
                 {/* Ball and Stick Tab */}
                {tabIndex === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Ball and Stick</Typography>
                        <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Soma Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                    value={ballAndStickValues.somaDia} onChange={(e) => handleChange(2, 'somaDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Soma Length (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                    value={ballAndStickValues.somaLen} onChange={(e) => handleChange(2, 'somaLen', e.target.value)} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Dendrite Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                    value={ballAndStickValues.dendDia} onChange={(e) => handleChange(2, 'dendDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Length (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                    value={ballAndStickValues.dendLen} onChange={(e) => handleChange(2, 'dendLen', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Segments (#)" variant="outlined" style={{ marginBottom: '8px' }} type="number"
                                    value={ballAndStickValues.dendNumSeg} onChange={(e) => handleChange(2, 'dendNumSeg', e.target.value)} InputProps={{ inputProps: { min: 1, step: 1 } }}/>
                            </Grid>
                        </Grid>
                    </Box>
                )}
                 {/* Y Branch Tab */}
                {tabIndex === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Y Branch</Typography>
                        <Grid container spacing={1.5}>
                             <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Soma Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                     value={yBranchValues.somaDia} onChange={(e) => handleChange(3, 'somaDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Soma Length (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                     value={yBranchValues.somaLen} onChange={(e) => handleChange(3, 'somaLen', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                     value={yBranchValues.dendDia} onChange={(e) => handleChange(3, 'dendDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Length (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                    value={yBranchValues.dendLen} onChange={(e) => handleChange(3, 'dendLen', e.target.value)} />
                             </Grid>
                             <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Dendrite Segments (#)" variant="outlined" style={{ marginBottom: '8px' }} type="number"
                                     value={yBranchValues.dendNumSeg} onChange={(e) => handleChange(3, 'dendNumSeg', e.target.value)} InputProps={{ inputProps: { min: 1, step: 1 } }}/>
                                <TextField fullWidth size="small" label="Branch Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                     value={yBranchValues.branchDia} onChange={(e) => handleChange(3, 'branchDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Branch Length (m)" variant="outlined" style={{ marginBottom: '8px' }} type="text"
                                     value={yBranchValues.branchLen} onChange={(e) => handleChange(3, 'branchLen', e.target.value)} />
                                <TextField fullWidth size="small" label="Branch Segments (#)" variant="outlined" style={{ marginBottom: '8px' }} type="number"
                                     value={yBranchValues.branchNumSeg} onChange={(e) => handleChange(3, 'branchNumSeg', e.target.value)} InputProps={{ inputProps: { min: 1, step: 1 } }}/>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MorphoMenuBox;
