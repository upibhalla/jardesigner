import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Grid, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Icons for buttons
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

// Accept onConfigurationChange prop
const RunMenuBox = ({ onConfigurationChange }) => {
  // State for runtime and clocks remains
  const [runtime, setRuntime] = useState('0.3'); // Keep as string for input flexibility
  const [currentTime, setCurrentTime] = useState(0.0); // Keep for display, not part of config
  const [clocks, setClocks] = useState({
    elec: '50e-6',
    elecPlot: '100e-6',
    chem: '0.1',
    chemPlot: '1.0',
    diffusion: '10e-3',
    function: '100e-6',
    status: '0.0', // Default from schema
  });

  // Handle clock updates remains the same
  const updateClock = (field, value) => {
    setClocks((prev) => ({ ...prev, [field]: value }));
  };

  // Function to get run configuration data remains the same
  const getRunConfigurationData = useCallback(() => {
    // Map state to schema keys and perform type conversion
    return {
      runtime: parseFloat(runtime) || 0.3, // Schema default
      elecDt: parseFloat(clocks.elec) || 50e-6,
      elecPlotDt: parseFloat(clocks.elecPlot) || 100e-6,
      chemDt: parseFloat(clocks.chem) || 0.1,
      chemPlotDt: parseFloat(clocks.chemPlot) || 1.0,
      diffDt: parseFloat(clocks.diffusion) || 10e-3, // Map 'diffusion' state key
      funcDt: parseFloat(clocks.function) || 100e-6, // Map 'function' state key
      statusDt: parseFloat(clocks.status) || 0.0,     // Map 'status' state key
    };
  }, [runtime, clocks]); // Depends on runtime and clocks state

  // useEffect to call the prop when runtime or clocks change remains the same
  useEffect(() => {
    if (onConfigurationChange) {
        const runConfigData = getRunConfigurationData();
        onConfigurationChange(runConfigData);
    }
  }, [runtime, clocks, getRunConfigurationData, onConfigurationChange]); // Dependencies

  // Button click handlers (Placeholder functions) remain the same
  const handleStart = () => console.log("Start clicked");
  const handlePause = () => console.log("Pause clicked");
  const handleReset = () => console.log("Reset clicked");


  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      {/* Buttons */}
      <Grid container spacing={1} sx={{ mb: 2 }}> {/* Reduced spacing */}
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={<PlayArrowIcon />} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }} onClick={handleStart}>
            Start
          </Button>
        </Grid>
        <Grid item xs={4}>
          {/* --- MODIFIED: Pause Button Color --- */}
          <Button
            variant="contained"
            fullWidth
            startIcon={<PauseIcon />}
            sx={{
                bgcolor: '#ffeb3b', // Yellow background
                color: 'black',      // Keep black text for contrast
                '&:hover': {
                    bgcolor: '#fbc02d' // Darker yellow on hover
                }
            }}
            onClick={handlePause}
          >
            Pause
          </Button>
          {/* --- END MODIFIED --- */}
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={<StopIcon />} sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }} onClick={handleReset}>
            Reset
          </Button>
        </Grid>
      </Grid>

      {/* Runtime and Current Time */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}> {/* Reduced spacing */}
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Total Runtime (s)" type="text" // Allow scientific notation input
            value={runtime} onChange={(e) => setRuntime(e.target.value)} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Current Time (s)" type="number" value={currentTime}
            InputProps={{ readOnly: true }} // Make current time read-only display
            variant="filled" // Indicate it's display-only
          />
        </Grid>
      </Grid>

      {/* Clocks Header */}
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Simulation Time Steps (Clocks)
      </Typography>

      {/* Clocks Section */}
      <Grid container spacing={1.5}> {/* Reduced spacing */}
        <Grid item xs={12} sm={6}>
           {/* UPDATED Labels */}
          <TextField fullWidth size="small" label="Elec Dt (s)" value={clocks.elec} onChange={(e) => updateClock('elec', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Chem Dt (s)" value={clocks.chem} onChange={(e) => updateClock('chem', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Diffusion Dt (s)" value={clocks.diffusion} onChange={(e) => updateClock('diffusion', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
           {/* UPDATED Labels */}
          <TextField fullWidth size="small" label="Elec Plot Dt (s)" value={clocks.elecPlot} onChange={(e) => updateClock('elecPlot', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Chem Plot Dt (s)" value={clocks.chemPlot} onChange={(e) => updateClock('chemPlot', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Function Dt (s)" value={clocks.function} onChange={(e) => updateClock('function', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Status Dt (s)" value={clocks.status} onChange={(e) => updateClock('status', e.target.value)} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RunMenuBox;

