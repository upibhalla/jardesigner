import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, TextField, Checkbox, FormControlLabel, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // Import the gear icon

const ConfigureMenuBox = ({ onConfigurationChange }) => {
  // Removed elec, elecPlot, chem, chemPlot, diffusion, function from initial state
  const [values, setValues] = useState({
    diffusionLen: '2e-6',
    randSeed: '1234',
    temperature: '32',
    numWaveFrames: '100',
    turnOffElec: false,
    useGssa: false,
    verbose: false,
    combineSegments: true,
    benchmark: false,
    reuseLibraryCell: false,
    // Add other non-clock, non-runtime config if needed (e.g., modelPath, odeMethod)
    modelPath: '/model', // Example default from schema
    odeMethod: 'lsoda',  // Example default from schema
  });

  // Keep handleChange for remaining fields
  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // Keep handleCheckboxChange for flags
  const handleCheckboxChange = (field) => {
    setValues((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // --- UPDATED: getConfigurationData only returns fields managed here ---
  const getConfigurationData = useCallback(() => {
    // Only include configuration managed by this component
    return {
      // Removed elecDt, elecPlotDt, chemDt, chemPlotDt, diffDt, funcDt
      diffusionLength: parseFloat(values.diffusionLen) || 2e-6,
      randseed: parseInt(values.randSeed, 10) || 1234,
      temperature: parseFloat(values.temperature) || 32,
      numWaveFrames: parseInt(values.numWaveFrames, 10) || 100,
      turnOffElec: values.turnOffElec,
      useGssa: values.useGssa,
      verbose: values.verbose,
      combineSegments: values.combineSegments,
      benchmark: values.benchmark,
      stealCellFromLibrary: values.reuseLibraryCell,
      modelPath: values.modelPath || "/model", // Example
      odeMethod: values.odeMethod || "lsoda",  // Example
      // Removed runtime as it's now in RunMenuBox
    };
  }, [values]); // Dependency array includes 'values' state

  // useEffect hook remains the same, calls prop when remaining values change
  useEffect(() => {
      if (onConfigurationChange) {
          const configData = getConfigurationData();
          onConfigurationChange(configData);
      }
  }, [values, getConfigurationData, onConfigurationChange]); // Dependencies

  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        <SettingsIcon style={{ marginRight: '8px' }} /> Configure Simulation Options
      </Typography>

      {/* --- Clocks Section REMOVED --- */}

      {/* Flags Section (Remains the same) */}
      <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
        Flags
      </Typography>
      <Grid container spacing={1.5}> {/* Reduced spacing */}
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={ <Checkbox size="small" checked={values.turnOffElec} onChange={() => handleCheckboxChange('turnOffElec')} /> } label="Turn Off Elec" />
          <FormControlLabel control={ <Checkbox size="small" checked={values.useGssa} onChange={() => handleCheckboxChange('useGssa')} /> } label="Use GSSA" />
          <FormControlLabel control={ <Checkbox size="small" checked={values.verbose} onChange={() => handleCheckboxChange('verbose')} /> } label="Verbose" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={ <Checkbox size="small" checked={values.combineSegments} onChange={() => handleCheckboxChange('combineSegments')} /> } label="Combine Segments" />
          <FormControlLabel control={ <Checkbox size="small" checked={values.benchmark} onChange={() => handleCheckboxChange('benchmark')} /> } label="Benchmark" />
          <FormControlLabel control={ <Checkbox size="small" checked={values.reuseLibraryCell} onChange={() => handleCheckboxChange('reuseLibraryCell')} /> } label="Reuse Library Cell (Steal)" />
        </Grid>
      </Grid>

      {/* Other Settings Section (Remains mostly the same) */}
      <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
        Other Settings
      </Typography>
      <Grid container spacing={1.5}> {/* Reduced spacing */}
         <Grid item xs={12} sm={6}>
             <TextField fullWidth size="small" label="Model Path" value={values.modelPath} onChange={(e) => handleChange('modelPath', e.target.value)} sx={{ mb: 1 }}/>
             <TextField fullWidth size="small" label="ODE Method" value={values.odeMethod} onChange={(e) => handleChange('odeMethod', e.target.value)} sx={{ mb: 1 }}/>
             <TextField fullWidth size="small" label="Diffusion Length (m)" type="text" value={values.diffusionLen} onChange={(e) => handleChange('diffusionLen', e.target.value)} sx={{ mb: 1 }}/>
             <TextField fullWidth size="small" label="Temperature (°C)" type="text" value={values.temperature} onChange={(e) => handleChange('temperature', e.target.value)} />
        </Grid>
         <Grid item xs={12} sm={6}>
             <TextField fullWidth size="small" label="Rand Seed" type="number" value={values.randSeed} onChange={(e) => handleChange('randSeed', e.target.value)} sx={{ mb: 1 }}/>
             <TextField fullWidth size="small" label="Num Wave Frames" type="number" value={values.numWaveFrames} onChange={(e) => handleChange('numWaveFrames', e.target.value)} />
         </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigureMenuBox;

