import React, { useState, useCallback, useEffect } from 'react'; // Added useCallback, useEffect
import { Box, Tabs, Tab, Typography, TextField, Grid } from '@mui/material';

// Import icons for tabs (assuming paths are correct relative to MorphoMenuBox.jsx)
import fileIcon from '../../assets/file.png';
import somaIcon from '../../assets/soma.png';
import ballAndStickIcon from '../../assets/ballAndStick.png';
import yBranchIcon from '../../assets/ybranch.png';

// Default values based loosely on schema defaults where available
const initialFileState = { source: '' };
const initialSomaState = { somaDia: '5e-4', somaLen: '5e-4' };
const initialBallAndStickState = {
    somaDia: '10e-6', somaLen: '10e-6',
    dendDia: '4e-6', dendLen: '200e-6', dendNumSeg: '1'
};
const initialYBranchState = {
    somaDia: '10e-6', somaLen: '10e-6',
    dendDia: '10e-6', dendLen: '200e-6', dendNumSeg: '1',
    branchDia: '2.5e-6', branchLen: '200e-6', branchNumSeg: '1'
};


const MorphoMenuBox = ({ onConfigurationChange }) => { // Accept prop
    const [tabIndex, setTabIndex] = useState(0);

    // State for each tab's inputs
    const [fileValues, setFileValues] = useState(initialFileState);
    const [somaValues, setSomaValues] = useState(initialSomaState);
    const [ballAndStickValues, setBallAndStickValues] = useState(initialBallAndStickState);
    const [yBranchValues, setYBranchValues] = useState(initialYBranchState);

    // Generic handler to update state based on tab index
    const handleChange = useCallback((index, field, value) => {
        switch (index) {
            case 0: setFileValues(prev => ({ ...prev, [field]: value })); break;
            case 1: setSomaValues(prev => ({ ...prev, [field]: value })); break;
            case 2: setBallAndStickValues(prev => ({ ...prev, [field]: value })); break;
            case 3: setYBranchValues(prev => ({ ...prev, [field]: value })); break;
            default: break;
        }
    }, []);

    // Handle tab change
    const handleTabChange = (event, newIndex) => {
        setTabIndex(newIndex);
        // Note: updateJsonData will be triggered by useEffect below when tabIndex changes
    };

    // --- NEW: Function to get structured cellProto data ---
    const getMorphologyData = useCallback(() => {
        let cellProtoData = {};
        try { // Add basic error handling for parsing
            switch (tabIndex) {
                case 0: // File
                    cellProtoData = {
                        type: "file",
                        source: fileValues.source || "" // Required
                    };
                    break;
                case 1: // Soma
                    cellProtoData = {
                        type: "soma",
                        // Schema defaults used if parsing fails
                        somaDia: parseFloat(somaValues.somaDia) || 5e-4,
                        somaLen: parseFloat(somaValues.somaLen) || 5e-4
                    };
                    break;
                case 2: // Ball and Stick
                    cellProtoData = {
                        type: "ballAndStick",
                        somaDia: parseFloat(ballAndStickValues.somaDia) || 10e-6,
                        somaLen: parseFloat(ballAndStickValues.somaLen) || 10e-6,
                        dendDia: parseFloat(ballAndStickValues.dendDia) || 4e-6,
                        dendLen: parseFloat(ballAndStickValues.dendLen) || 200e-6,
                        dendNumSeg: parseInt(ballAndStickValues.dendNumSeg, 10) || 1
                    };
                    break;
                case 3: // Y Branch (maps to "branchedCell" in schema)
                    cellProtoData = {
                        type: "branchedCell", // Schema type name
                        somaDia: parseFloat(yBranchValues.somaDia) || 10e-6,
                        somaLen: parseFloat(yBranchValues.somaLen) || 10e-6,
                        dendDia: parseFloat(yBranchValues.dendDia) || 10e-6,
                        dendLen: parseFloat(yBranchValues.dendLen) || 200e-6,
                        dendNumSeg: parseInt(yBranchValues.dendNumSeg, 10) || 1,
                        branchDia: parseFloat(yBranchValues.branchDia) || 2.5e-6,
                        branchLen: parseFloat(yBranchValues.branchLen) || 200e-6,
                        branchNumSeg: parseInt(yBranchValues.branchNumSeg, 10) || 1
                    };
                    break;
                default:
                    cellProtoData = {}; // Should not happen
            }
        } catch (error) {
            console.error("Error parsing morphology data:", error);
            // Return an empty object or default state in case of error
            cellProtoData = { type: "error", message: "Failed to parse values" };
        }
        return cellProtoData;

    }, [tabIndex, fileValues, somaValues, ballAndStickValues, yBranchValues]); // Dependencies

    // --- NEW: useEffect to call the prop when relevant state changes ---
    useEffect(() => {
        if (onConfigurationChange) {
            const morphData = getMorphologyData();
            // Only send valid types, ignore error state from getMorphologyData if needed
            if (morphData && morphData.type !== "error") {
               onConfigurationChange({ cellProto: morphData }); // Pass data nested under cellProto key
            }
        }
        // Dependencies ensure this runs when the active tab OR its data changes
    }, [tabIndex, fileValues, somaValues, ballAndStickValues, yBranchValues, getMorphologyData, onConfigurationChange]);
    // --- END NEW ---


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
                        <TextField fullWidth size="small" label="Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }}
                            value={somaValues.somaDia} onChange={(e) => handleChange(1, 'somaDia', e.target.value)} />
                        <TextField fullWidth size="small" label="Length (m)" variant="outlined" style={{ marginBottom: '8px' }}
                            value={somaValues.somaLen} onChange={(e) => handleChange(1, 'somaLen', e.target.value)} />
                    </Box>
                )}
                 {/* Ball and Stick Tab */}
                {tabIndex === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Ball and Stick</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Soma Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                    value={ballAndStickValues.somaDia} onChange={(e) => handleChange(2, 'somaDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Soma Length (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                    value={ballAndStickValues.somaLen} onChange={(e) => handleChange(2, 'somaLen', e.target.value)} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Dendrite Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                    value={ballAndStickValues.dendDia} onChange={(e) => handleChange(2, 'dendDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Length (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                    value={ballAndStickValues.dendLen} onChange={(e) => handleChange(2, 'dendLen', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Segments (#)" variant="outlined" style={{ marginBottom: '8px' }} type="number"
                                    value={ballAndStickValues.dendNumSeg} onChange={(e) => handleChange(2, 'dendNumSeg', e.target.value)} />
                            </Grid>
                        </Grid>
                    </Box>
                )}
                 {/* Y Branch Tab */}
                {tabIndex === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Y Branch</Typography>
                        <Grid container spacing={2}>
                             <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Soma Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                     value={yBranchValues.somaDia} onChange={(e) => handleChange(3, 'somaDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Soma Length (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                     value={yBranchValues.somaLen} onChange={(e) => handleChange(3, 'somaLen', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                     value={yBranchValues.dendDia} onChange={(e) => handleChange(3, 'dendDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Dendrite Length (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                    value={yBranchValues.dendLen} onChange={(e) => handleChange(3, 'dendLen', e.target.value)} />
                             </Grid>
                             <Grid item xs={6}>
                                <TextField fullWidth size="small" label="Dendrite Segments (#)" variant="outlined" style={{ marginBottom: '8px' }} type="number"
                                     value={yBranchValues.dendNumSeg} onChange={(e) => handleChange(3, 'dendNumSeg', e.target.value)} />
                                <TextField fullWidth size="small" label="Branch Diameter (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                     value={yBranchValues.branchDia} onChange={(e) => handleChange(3, 'branchDia', e.target.value)} />
                                <TextField fullWidth size="small" label="Branch Length (m)" variant="outlined" style={{ marginBottom: '8px' }}
                                     value={yBranchValues.branchLen} onChange={(e) => handleChange(3, 'branchLen', e.target.value)} />
                                <TextField fullWidth size="small" label="Branch Segments (#)" variant="outlined" style={{ marginBottom: '8px' }} type="number"
                                     value={yBranchValues.branchNumSeg} onChange={(e) => handleChange(3, 'branchNumSeg', e.target.value)} />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MorphoMenuBox;
