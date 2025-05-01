import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

// Helper to safely convert value to string for text fields
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default values for this component's state, matching schema defaults
const defaultRunConfig = {
    runtime: '0.3',
    elec: '50e-6',
    elecPlot: '100e-6',
    chem: '0.1',
    chemPlot: '1.0',
    diffusion: '10e-3',
    function: '100e-6',
    status: '0.0',
};

// Accept onConfigurationChange, getCurrentJsonData, AND currentConfig props
const RunMenuBox = ({ onConfigurationChange, getCurrentJsonData, currentConfig }) => {

  // --- Initialize local state ("buffer") from props using useState initializer ---
  const [runtime, setRuntime] = useState(() =>
    safeToString(currentConfig?.runtime, defaultRunConfig.runtime)
  );
  const [clocks, setClocks] = useState(() => ({
    elec: safeToString(currentConfig?.elecDt, defaultRunConfig.elec),
    elecPlot: safeToString(currentConfig?.elecPlotDt, defaultRunConfig.elecPlot),
    chem: safeToString(currentConfig?.chemDt, defaultRunConfig.chem),
    chemPlot: safeToString(currentConfig?.chemPlotDt, defaultRunConfig.chemPlot),
    diffusion: safeToString(currentConfig?.diffDt, defaultRunConfig.diffusion), // Map schema key diffDt
    function: safeToString(currentConfig?.funcDt, defaultRunConfig.function), // Map schema key funcDt
    status: safeToString(currentConfig?.statusDt, defaultRunConfig.status),     // Map schema key statusDt
  }));
  // --- END Initialization ---

  // Refs to store latest values/callbacks for cleanup function
  const onConfigurationChangeRef = useRef(onConfigurationChange);
  useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
  const runtimeRef = useRef(runtime);
  useEffect(() => { runtimeRef.current = runtime; }, [runtime]);
  const clocksRef = useRef(clocks);
  useEffect(() => { clocksRef.current = clocks; }, [clocks]);


  // Other state remains the same
  const [currentTime, setCurrentTime] = useState(0.0); // Display only
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // --- Handlers ONLY update LOCAL state ---
  const handleRuntimeChange = (value) => {
      console.log("RunMenuBox: Local state change - runtime:", value);
      setRuntime(value);
  };

  const updateClock = (field, value) => {
    console.log(`RunMenuBox: Local state change - clocks.${field}:`, value);
    setClocks((prev) => ({ ...prev, [field]: value }));
  };
  // --- END Handlers ---


  // --- Function to format local state for pushing up (used on unmount) ---
  const getRunConfigurationDataForUnmount = () => {
    // Use refs to get the latest state values at the time of unmount
    const currentRuntime = runtimeRef.current;
    const currentClocks = clocksRef.current;
    console.log("RunMenuBox: Formatting final local state for push:", { runtime: currentRuntime, clocks: currentClocks });
    // Convert local state (strings) back to schema format (numbers)
    return {
        runtime: parseFloat(currentRuntime) || 0, // Use 0 or default if parse fails
        elecDt: parseFloat(currentClocks.elec) || 0,
        elecPlotDt: parseFloat(currentClocks.elecPlot) || 0,
        chemDt: parseFloat(currentClocks.chem) || 0,
        chemPlotDt: parseFloat(currentClocks.chemPlot) || 0,
        diffDt: parseFloat(currentClocks.diffusion) || 0,
        funcDt: parseFloat(currentClocks.function) || 0,
        statusDt: parseFloat(currentClocks.status) || 0,
    };
  };


  // --- useEffect hook to push changes up ON UNMOUNT ---
  useEffect(() => {
    // This effect runs once on mount and returns a cleanup function
    console.log("RunMenuBox: Mounted, setting up unmount cleanup.");
    return () => {
      // This cleanup function runs ONLY when the component is about to unmount
      const latestOnConfigurationChange = onConfigurationChangeRef.current;
      if (latestOnConfigurationChange) {
          console.log("RunMenuBox: Unmounting, pushing final state up.");
          const configData = getRunConfigurationDataForUnmount();
          latestOnConfigurationChange(configData);
      } else {
          console.warn("RunMenuBox: onConfigurationChange not available on unmount.");
      }
    };
    // Empty dependency array ensures this effect runs only on mount/unmount
  }, []); // IMPORTANT: Empty dependency array
  // --- END Unmount Effect ---


  // --- handleStart remains the same (uses getCurrentJsonData from props) ---
  const handleStart = async () => {
    console.log("Start clicked - initiating API call");
    setStatusMessage({ type: '', text: '' });

    if (!getCurrentJsonData) {
        console.error("handleStart: getCurrentJsonData prop is missing!");
        setStatusMessage({ type: 'error', text: 'Internal Error: Cannot get config data.' });
        return;
    }
    // IMPORTANT: Still gets the *potentially stale* data from App.jsx state
    // If you need the absolute latest edits from THIS box before starting,
    // you'd need to call getRunConfigurationDataForUnmount() here instead.
    // For now, it uses the last saved state from App.jsx.
    const currentJsonConfig = getCurrentJsonData();
    if (!currentJsonConfig) {
        console.error("handleStart: getCurrentJsonData returned null or undefined.");
        setStatusMessage({ type: 'error', text: 'Error: No configuration data available.' });
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch('http://localhost:5000/launch_simulation', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', },
             body: JSON.stringify(currentJsonConfig)
         });
        const result = await response.json();
        if (response.ok && result.status === 'success') { setStatusMessage({ type: 'success', text: `Simulation launch initiated. Config saved to: ${result.config_file}` }); }
        else { setStatusMessage({ type: 'error', text: `Error from backend: ${result.message || 'Unknown error'}` }); }
    } catch (error) { setStatusMessage({ type: 'error', text: `Network error: Could not connect to backend. ${error.message}` }); }
    finally { setIsLoading(false); }
  };
  // --- END handleStart ---

  // Placeholder handlers for Pause/Reset
  const handlePause = () => console.log("Pause clicked");
  const handleReset = () => console.log("Reset clicked");


  // --- JSX Rendering (uses local state) ---
  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      {/* Buttons */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }} onClick={handleStart} disabled={isLoading}>
            {isLoading ? 'Starting...' : 'Start'}
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={<PauseIcon />} sx={{ bgcolor: '#ffeb3b', color: 'rgba(0, 0, 0, 0.87)', '&:hover': { bgcolor: '#fdd835' } }} onClick={handlePause}>
            Pause
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={<StopIcon />} sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }} onClick={handleReset}>
            Reset
          </Button>
        </Grid>
      </Grid>

      {/* Status Message Display */}
      {statusMessage.text && ( <Alert severity={statusMessage.type || 'info'} sx={{ mb: 2 }}> {statusMessage.text} </Alert> )}

      {/* Runtime and Current Time */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6}>
           {/* Use local runtime state */}
          <TextField fullWidth size="small" label="Total Runtime (s)" type="text" value={runtime} onChange={(e) => handleRuntimeChange(e.target.value)} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Current Time (s)" type="number" value={currentTime} InputProps={{ readOnly: true }} variant="filled" />
        </Grid>
      </Grid>

      {/* Clocks Header */}
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}> Simulation Time Steps (Clocks) </Typography>

      {/* Clocks Section */}
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
           {/* Use local clocks state */}
          <TextField fullWidth size="small" label="Elec Dt (s)" value={clocks.elec} onChange={(e) => updateClock('elec', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Chem Dt (s)" value={clocks.chem} onChange={(e) => updateClock('chem', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Diffusion Dt (s)" value={clocks.diffusion} onChange={(e) => updateClock('diffusion', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
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
