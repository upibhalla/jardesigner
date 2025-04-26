import React, { useState, useCallback, useEffect } from 'react'; 
import { Box, Typography, TextField, Checkbox, FormControlLabel, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // Import the gear icon

const ConfigureMenuBox = ({ onConfigurationChange }) => {
  const [values, setValues] = useState({
    elec: '50e-6',
    elecPlot: '100e-6',
    chem: '0.1',
    chemPlot: '1.0',
    diffusion: '10e-3',
    function: '100e-6',
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
  });

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // NOTE: Consider calling a function passed via props
    // to update the central JSON state in App.jsx whenever a value changes.
    // e.g., props.onConfigurationChange(getConfigurationData());
  };

  const handleCheckboxChange = (field) => {
    setValues((prev) => {
      const newValues = { ...prev, [field]: !prev[field] };
      // NOTE: See note in handleChange about updating central state
      return newValues;
    });
  };

  /**
   * Gathers the current configuration values from the state,
   * performs necessary type conversions according to schema.json,
   * and returns an object representing this part of the simulation configuration.
   *
   * This function can be called by a parent component (like App.jsx)
   * to get the data needed for building the complete JSON configuration object.
   */
  const getConfigurationData = useCallback(() => {
    // Perform type conversions based on the schema
    // Default values (e.g., NaN or schema default) could be added for robustness if parsing fails
    return {
      elecDt: parseFloat(values.elec) || 50e-6, //
      elecPlotDt: parseFloat(values.elecPlot) || 100e-6, //
      chemDt: parseFloat(values.chem) || 0.1, //
      chemPlotDt: parseFloat(values.chemPlot) || 1.0, //
      diffDt: parseFloat(values.diffusion) || 10e-3, //
      funcDt: parseFloat(values.function) || 100e-6, //
      diffusionLength: parseFloat(values.diffusionLen) || 2e-6, //
      randseed: parseInt(values.randSeed, 10) || 1234, //
      temperature: parseFloat(values.temperature) || 32, //
      numWaveFrames: parseInt(values.numWaveFrames, 10) || 100, //
      turnOffElec: values.turnOffElec, //
      useGssa: values.useGssa, //
      verbose: values.verbose, //
      combineSegments: values.combineSegments, //
      benchmark: values.benchmark, //
      stealCellFromLibrary: values.reuseLibraryCell, //
      // Add other relevant top-level schema properties here if they are managed by this component
      // e.g., modelPath, odeMethod would need corresponding state/inputs if controlled here.
      // Default values for filetype and version are often set at the top level in App.jsx
    };
  }, [values]); // Dependency array includes 'values' state

	  // useEffect to call the prop when values change ---
  useEffect(() => {
      if (onConfigurationChange) {
          const configData = getConfigurationData();
          onConfigurationChange(configData);
      }
  }, [values, getConfigurationData, onConfigurationChange]); // Dependencies

  // NOTE: To make getConfigurationData accessible to App.jsx, you could:
  // 1. Lift state up: Manage the 'values' state in App.jsx and pass it down along
  //    with the handler functions (handleChange, handleCheckboxChange).
  // 2. Use useRef and useImperativeHandle: Expose getConfigurationData via a ref passed from App.jsx.
  // 3. Pass a callback: App.jsx passes a function like `updateConfiguration(data)`
  //    down to ConfigureMenuBox, which calls it inside handleChange/handleCheckboxChange
  //    or when a "save/apply" button specific to this box is clicked.

  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        <SettingsIcon style={{ marginRight: '8px' }} /> Configure
      </Typography>

      {/* Clocks Section */}
      <Typography variant="subtitle1" gutterBottom>
        Clocks
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Elec Dt (s)" // Updated label for clarity
            value={values.elec}
            onChange={(e) => handleChange('elec', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            fullWidth
            size="small"
            label="Elec Plot Dt (s)" // Updated label
            value={values.elecPlot}
            onChange={(e) => handleChange('elecPlot', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            fullWidth
            size="small"
            label="Chem Dt (s)" // Updated label
            value={values.chem}
            onChange={(e) => handleChange('chem', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Chem Plot Dt (s)" // Updated label
            value={values.chemPlot}
            onChange={(e) => handleChange('chemPlot', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            fullWidth
            size="small"
            label="Diffusion Dt (s)" // Updated label
            value={values.diffusion}
            onChange={(e) => handleChange('diffusion', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            fullWidth
            size="small"
            label="Function Dt (s)" // Updated label
            value={values.function}
            onChange={(e) => handleChange('function', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </Grid>
      </Grid>

      {/* Flags Section */}
      <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
        Flags
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.turnOffElec}
                onChange={() => handleCheckboxChange('turnOffElec')}
              />
            }
            label="Turn Off Elec"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={values.useGssa}
                onChange={() => handleCheckboxChange('useGssa')}
              />
            }
            label="Use GSSA"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={values.verbose}
                onChange={() => handleCheckboxChange('verbose')}
              />
            }
            label="Verbose"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.combineSegments}
                onChange={() => handleCheckboxChange('combineSegments')}
              />
            }
            label="Combine Segments"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={values.benchmark}
                onChange={() => handleCheckboxChange('benchmark')}
              />
            }
            label="Benchmark"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={values.reuseLibraryCell}
                onChange={() => handleCheckboxChange('reuseLibraryCell')}
              />
            }
            label="Reuse Library Cell (Steal)" // Updated label
          />
        </Grid>
      </Grid>

      {/* Other Settings Section */}
      <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
        Other Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Diffusion Length (m)" // Updated label
            value={values.diffusionLen}
            onChange={(e) => handleChange('diffusionLen', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            fullWidth
            size="small"
            label="Temperature (°C)" // Updated label
            value={values.temperature}
            onChange={(e) => handleChange('temperature', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Rand Seed"
            value={values.randSeed}
            onChange={(e) => handleChange('randSeed', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            fullWidth
            size="small"
            label="Num Wave Frames"
            value={values.numWaveFrames}
            onChange={(e) => handleChange('numWaveFrames', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigureMenuBox;
