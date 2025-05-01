import React, { useState, useCallback, useEffect, useRef } from 'react'; // Added useRef
import { Box, Typography, TextField, Checkbox, FormControlLabel, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

// Default values for this component's state
const defaultValues = {
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
    modelPath: '/model',
    odeMethod: 'lsoda',
};

// Helper to safely convert value to string for text fields
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};


// Accept `currentConfig` prop containing relevant slice of jsonData
const ConfigureMenuBox = ({ onConfigurationChange, currentConfig }) => {

  // Local state holds the "buffer" - initialized once from props
  const [values, setValues] = useState(() => {
      // Initialize state directly from props on first render
      // This avoids potential race conditions with useEffect
      console.log("ConfigureMenuBox: Initializing state from props", currentConfig);
      return {
          diffusionLen: safeToString(currentConfig?.diffusionLength, defaultValues.diffusionLen),
          randSeed: safeToString(currentConfig?.randseed, defaultValues.randSeed),
          temperature: safeToString(currentConfig?.temperature, defaultValues.temperature),
          numWaveFrames: safeToString(currentConfig?.numWaveFrames, defaultValues.numWaveFrames),
          modelPath: safeToString(currentConfig?.modelPath, defaultValues.modelPath),
          odeMethod: safeToString(currentConfig?.odeMethod, defaultValues.odeMethod),
          turnOffElec: currentConfig?.turnOffElec ?? defaultValues.turnOffElec,
          useGssa: currentConfig?.useGssa ?? defaultValues.useGssa,
          verbose: currentConfig?.verbose ?? defaultValues.verbose,
          combineSegments: currentConfig?.combineSegments ?? defaultValues.combineSegments,
          benchmark: currentConfig?.benchmark ?? defaultValues.benchmark,
          reuseLibraryCell: currentConfig?.stealCellFromLibrary ?? defaultValues.reuseLibraryCell,
      };
  });

  // Ref to store the latest onConfigurationChange callback to avoid issues in cleanup
  const onConfigurationChangeRef = useRef(onConfigurationChange);
  useEffect(() => {
      onConfigurationChangeRef.current = onConfigurationChange;
  }, [onConfigurationChange]);

  // Ref to store the latest values for use in the unmount cleanup
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);


  // Handlers ONLY update LOCAL state
  const handleChange = (localField, value) => {
    setValues((prev) => ({ ...prev, [localField]: value }));
  };

  const handleCheckboxChange = (localField) => {
    setValues((prev) => ({ ...prev, [localField]: !prev[localField] }));
  };


  // Function to format local state for pushing up (called on unmount)
  // No need for useCallback here as it's only used in the cleanup effect
  const getConfigurationDataForUnmount = () => {
    // Use the ref to get the absolute latest values
    const currentValues = valuesRef.current;
    console.log("ConfigureMenuBox: Formatting final local state for push:", currentValues);
    return {
      diffusionLength: parseFloat(currentValues.diffusionLen) || 0,
      randseed: parseInt(currentValues.randSeed, 10) || 0,
      temperature: parseFloat(currentValues.temperature) || 0,
      numWaveFrames: parseInt(currentValues.numWaveFrames, 10) || 0,
      turnOffElec: currentValues.turnOffElec,
      useGssa: currentValues.useGssa,
      verbose: currentValues.verbose,
      combineSegments: currentValues.combineSegments,
      benchmark: currentValues.benchmark,
      stealCellFromLibrary: currentValues.reuseLibraryCell,
      modelPath: currentValues.modelPath || defaultValues.modelPath,
      odeMethod: currentValues.odeMethod || defaultValues.odeMethod,
    };
  };


  // useEffect hook to push changes up ON UNMOUNT
  useEffect(() => {
    // This function runs ONLY when the component is about to unmount
    return () => {
      // Use the ref to get the latest callback function
      const latestOnConfigurationChange = onConfigurationChangeRef.current;
      if (latestOnConfigurationChange) {
          console.log("ConfigureMenuBox: Unmounting, pushing final state up.");
          const configData = getConfigurationDataForUnmount();
          latestOnConfigurationChange(configData);
      } else {
          console.warn("ConfigureMenuBox: onConfigurationChange not available on unmount.");
      }
    };
    // Empty dependency array means the effect runs once on mount
    // and the cleanup runs once on unmount.
  }, []); // Empty dependency array


  // --- JSX Rendering (Values come from local state) ---
  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        <SettingsIcon style={{ marginRight: '8px' }} /> Configure Simulation Options
      </Typography>

      {/* Flags Section */}
      <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
        Flags
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          {/* onChange now only calls local state update */}
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

      {/* Other Settings Section */}
      <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
        Other Settings
      </Typography>
      <Grid container spacing={1.5}>
         <Grid item xs={12} sm={6}>
             {/* onChange now only calls local state update */}
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

