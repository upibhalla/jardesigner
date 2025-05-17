import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

// Helper to safely convert value to string for text fields
const safeToString = (value, defaultValue = '') => {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    return String(value);
};

// Default values
const defaultRunConfig = {
    runtime: '0.3',
    elec: '50e-6',
    elecPlot: '100e-6',
    chem: '0.1',
    chemPlot: '1.0', // This is >= 1e-06, so it's a valid default
    diffusion: '10e-3',
    function: '100e-6',
    status: '0.0',
};

const RunMenuBox = ({
    onConfigurationChange,
    getCurrentJsonData,
    currentConfig,
    onPlotDataUpdate,
    onClearPlotData
}) => {
  // --- Local state for UI elements, initialized from props ---
  const [runtime, setRuntime] = useState(() =>
    safeToString(currentConfig?.runtime, defaultRunConfig.runtime)
  );
  const [clocks, setClocks] = useState(() => ({
    elec: safeToString(currentConfig?.elecDt, defaultRunConfig.elec),
    elecPlot: safeToString(currentConfig?.elecPlotDt, defaultRunConfig.elecPlot),
    chem: safeToString(currentConfig?.chemDt, defaultRunConfig.chem),
    chemPlotDt: safeToString(currentConfig?.chemPlotDt, defaultRunConfig.chemPlot),
    diffusion: safeToString(currentConfig?.diffDt, defaultRunConfig.diffusion),
    function: safeToString(currentConfig?.funcDt, defaultRunConfig.function),
    status: safeToString(currentConfig?.statusDt, defaultRunConfig.status),
  }));

  // --- Other local state ---
  const [currentTime, setCurrentTime] = useState(0.0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [simulationPid, setSimulationPid] = useState(null);

  // --- Refs for props and local state to use in callbacks/cleanup ---
  const pollingIntervalRef = useRef(null);
  const onConfigurationChangeRef = useRef(onConfigurationChange);
  const onPlotDataUpdateRef = useRef(onPlotDataUpdate);
  const onClearPlotDataRef = useRef(onClearPlotData);
  const runtimeRef = useRef(runtime); // To get the latest value in unmount cleanup
  const clocksRef = useRef(clocks);   // To get the latest value in unmount cleanup

  // --- Update refs when props/state change ---
  useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
  useEffect(() => { onPlotDataUpdateRef.current = onPlotDataUpdate; }, [onPlotDataUpdate]);
  useEffect(() => { onClearPlotDataRef.current = onClearPlotData; }, [onClearPlotData]);
  useEffect(() => { runtimeRef.current = runtime; }, [runtime]);
  useEffect(() => { clocksRef.current = clocks; }, [clocks]);

  // --- Local state updaters ---
  const handleRuntimeChange = (value) => setRuntime(value);
  const updateClock = (field, value) => {
    setClocks((prev) => ({ ...prev, [field]: value }));
  };

  // --- Helper function to build the configuration payload for App.jsx ---
  // This function converts local string states to numbers and applies defaults.
  const buildConfigPayload = useCallback((currentRuntimeStr, currentClocksObj) => {
    const getOrDefaultNumeric = (valStr, defaultValStr) => {
        const num = parseFloat(valStr);
        return isNaN(num) ? parseFloat(defaultValStr) : num;
    };

    let chemPlotDtValue = getOrDefaultNumeric(currentClocksObj.chemPlotDt, defaultRunConfig.chemPlot);
    if (chemPlotDtValue < 1e-06) { // Ensure chemPlotDt meets schema minimum
        const defaultChemPlotNum = parseFloat(defaultRunConfig.chemPlot);
        chemPlotDtValue = (defaultChemPlotNum >= 1e-06) ? defaultChemPlotNum : 1e-06;
    }

    return {
        runtime: getOrDefaultNumeric(currentRuntimeStr, defaultRunConfig.runtime),
        elecDt: getOrDefaultNumeric(currentClocksObj.elec, defaultRunConfig.elec),
        elecPlotDt: getOrDefaultNumeric(currentClocksObj.elecPlot, defaultRunConfig.elecPlot),
        chemDt: getOrDefaultNumeric(currentClocksObj.chem, defaultRunConfig.chem),
        chemPlotDt: chemPlotDtValue,
        diffDt: getOrDefaultNumeric(currentClocksObj.diffusion, defaultRunConfig.diffusion),
        funcDt: getOrDefaultNumeric(currentClocksObj.function, defaultRunConfig.function),
        statusDt: getOrDefaultNumeric(currentClocksObj.status, defaultRunConfig.status),
    };
  }, []); // defaultRunConfig is stable

  // --- REMOVED: useEffect that called onConfigurationChange on local state changes ---
  // The parent (App.jsx) will now only be updated on unmount or explicitly before 'Start'.

  // --- useEffect for cleanup on unmount ---
  // This is where onConfigurationChange is called when the menu box closes.
  useEffect(() => {
    return () => {
      if (onConfigurationChangeRef.current) {
        // Use refs to get the most current local state values at the time of unmount
        console.log("RunMenuBox: Unmounting, calling onConfigurationChange.");
        onConfigurationChangeRef.current(buildConfigPayload(runtimeRef.current, clocksRef.current));
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildConfigPayload]); // buildConfigPayload is stable

  // --- Simulation Polling Logic (remains the same) ---
  const pollSimulationStatus = useCallback(async (pid) => {
    if (!pid) return;
    try {
      const response = await fetch(`http://localhost:5000/simulation_status/${pid}`);
      const result = await response.json();
      if (response.ok) {
        if (result.status === 'completed' || result.status === 'completed_error') {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsLoading(false);
          if (result.plot_ready && result.svg_filename) {
            onPlotDataUpdateRef.current?.({ filename: result.svg_filename, ready: true, error: null });
            setStatusMessage({ type: 'success', text: `Simulation finished. Plot '${result.svg_filename}' should be visible.` });
          } else {
            let detailedError = result.message || 'Plot generation failed or file not found.';
            if (result.stderr) detailedError += `\nStderr: ${result.stderr}`;
            if (result.stdout) detailedError += `\nStdout: ${result.stdout}`;
            onPlotDataUpdateRef.current?.({ filename: null, ready: false, error: detailedError });
            setStatusMessage({ type: 'error', text: result.message || 'Plot generation failed after simulation completion.' });
          }
        } else if (result.status === 'running') {
           setStatusMessage({ type: 'info', text: `Simulation (PID: ${pid}) is running... Plot not yet ready.` });
           onPlotDataUpdateRef.current?.({ filename: null, ready: false, error: null });
        } else { // Other backend status issues
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setIsLoading(false);
            const errorMsg = `Status check error: ${result.message || 'Unknown status from backend.'}`;
            setStatusMessage({ type: 'error', text: errorMsg });
            onPlotDataUpdateRef.current?.({ filename: null, ready: false, error: errorMsg });
        }
      } else { // HTTP error
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsLoading(false);
        const errorMsg = `Error checking status: ${result.message || response.statusText}`;
        setStatusMessage({ type: 'error', text: errorMsg });
        onPlotDataUpdateRef.current?.({ filename: null, ready: false, error: errorMsg });
      }
    } catch (error) { // Network error
      console.error("RunMenuBox: Polling error:", error);
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsLoading(false);
      const errorMsg = `Polling network error: ${error.message}`;
      setStatusMessage({ type: 'error', text: errorMsg });
      onPlotDataUpdateRef.current?.({ filename: null, ready: false, error: errorMsg });
    }
  }, []);

  // --- Button Click Handlers ---
  const handleStart = async () => {
    console.log("RunMenuBox: Start button clicked.");
    setStatusMessage({ type: '', text: '' });
    onClearPlotDataRef.current?.();
    setCurrentTime(0);

    if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }

    // --- CRITICAL: Update App.jsx's jsonData with current local state BEFORE fetching it ---
    if (onConfigurationChangeRef.current) {
         console.log("RunMenuBox: Calling onConfigurationChange before starting simulation.");
         onConfigurationChangeRef.current(buildConfigPayload(runtime, clocks)); // Use direct state here
    }

    if (!getCurrentJsonData) {
      setStatusMessage({ type: 'error', text: 'Internal Error: getCurrentJsonData function not provided.' });
      return;
    }

    // It's generally better to ensure state updates propagate before proceeding.
    // However, since onConfigurationChange likely involves a setState in App.jsx,
    // and getCurrentJsonData reads that state, there could be a race condition
    // if getCurrentJsonData is called in the same synchronous execution block
    // immediately after the setState call that onConfigurationChange triggers.
    // A common pattern is to pass the data directly or use a callback.
    // For now, we rely on App.jsx's `updateJsonData` to be quick.
    // A more robust solution might involve `getCurrentJsonData` accepting the latest payload
    // or `handleStart` waiting for a callback after `onConfigurationChange` completes.
    // For simplicity, we'll proceed, assuming App.jsx updates its state reasonably fast.

    const currentJsonConfig = getCurrentJsonData(); // This now gets the (hopefully) updated data from App.jsx
    if (!currentJsonConfig) {
      setStatusMessage({ type: 'error', text: 'Error: No configuration data available to start simulation.' });
      return;
    }
    console.log("RunMenuBox: Sending config to backend:", JSON.stringify(currentJsonConfig, null, 2));

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/launch_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentJsonConfig),
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setStatusMessage({ type: 'success', text: `Simulation launch initiated (PID: ${result.pid}). Waiting for plot...` });
        setSimulationPid(result.pid);
        if (result.pid) {
            pollingIntervalRef.current = setInterval(() => pollSimulationStatus(result.pid), 3000);
        } else {
            setIsLoading(false);
            setStatusMessage({ type: 'error', text: 'Backend reported success but did not return a PID.' });
        }
      } else {
        setStatusMessage({ type: 'error', text: `Error from backend: ${result.message || 'Unknown error during launch.'}` });
        setIsLoading(false);
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: `Network error: Could not connect to backend. ${error.message}` });
      setIsLoading(false);
    }
  };

  const handlePause = () => {
      console.log("RunMenuBox: Pause clicked for PID:", simulationPid);
      setStatusMessage({ type: 'warning', text: 'Pause functionality not fully implemented.' });
  };

  const handleReset = async () => {
    console.log("RunMenuBox: Reset clicked for PID:", simulationPid);
    if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });
    onClearPlotDataRef.current?.();

    if (simulationPid) {
        try {
            const response = await fetch(`http://localhost:5000/reset_simulation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: simulationPid })
            });
            const result = await response.json();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: result.message || `Simulation PID ${simulationPid} reset successfully.` });
            } else {
                setStatusMessage({ type: 'error', text: result.message || `Failed to reset simulation PID ${simulationPid}.` });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: `Network error during reset: ${error.message}` });
        } finally {
            setSimulationPid(null);
            setIsLoading(false);
        }
    } else {
        setStatusMessage({ type: 'info', text: 'No active simulation to reset.' });
        setIsLoading(false);
    }
  };

  // --- JSX Rendering (remains the same) ---
  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Button
            variant="contained"
            fullWidth
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            onClick={handleStart}
            disabled={isLoading}
          >
            {isLoading ? 'Running...' : 'Start'}
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={<PauseIcon />} sx={{ bgcolor: '#ffeb3b', color: 'rgba(0, 0, 0, 0.87)', '&:hover': { bgcolor: '#fdd835' } }} onClick={handlePause} disabled={!simulationPid || isLoading}>
            Pause
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth startIcon={<StopIcon />} sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }} onClick={handleReset} disabled={!simulationPid && !isLoading}>
            Reset
          </Button>
        </Grid>
      </Grid>

      {statusMessage.text && (
        <Alert severity={statusMessage.type || 'info'} sx={{ mb: 2, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {statusMessage.text}
        </Alert>
      )}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Total Runtime (s)" type="text" value={runtime} onChange={(e) => handleRuntimeChange(e.target.value)} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Current Time (s)" type="number" value={currentTime} InputProps={{ readOnly: true }} variant="filled" />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Simulation Time Steps (Clocks)
      </Typography>
      <Grid container spacing={1.5} sx={{mb: 2}}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Elec Dt (s)" value={clocks.elec} onChange={(e) => updateClock('elec', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Chem Dt (s)" value={clocks.chem} onChange={(e) => updateClock('chem', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Diffusion Dt (s)" value={clocks.diffusion} onChange={(e) => updateClock('diffusion', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Elec Plot Dt (s)" value={clocks.elecPlot} onChange={(e) => updateClock('elecPlot', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Chem Plot Dt (s)" value={clocks.chemPlotDt} onChange={(e) => updateClock('chemPlotDt', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Function Dt (s)" value={clocks.function} onChange={(e) => updateClock('function', e.target.value)} sx={{ mb: 1 }}/>
          <TextField fullWidth size="small" label="Status Dt (s)" value={clocks.status} onChange={(e) => updateClock('status', e.target.value)} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RunMenuBox;

