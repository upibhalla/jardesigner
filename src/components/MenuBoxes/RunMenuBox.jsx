import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert } from '@mui/material'; // Added CircularProgress, Alert
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

// Accept onConfigurationChange AND getCurrentJsonData props
const RunMenuBox = ({ onConfigurationChange, getCurrentJsonData }) => {
  // State for runtime and clocks
  const [runtime, setRuntime] = useState('0.3');
  const [currentTime, setCurrentTime] = useState(0.0);
  const [clocks, setClocks] = useState({
    elec: '50e-6', elecPlot: '100e-6', chem: '0.1', chemPlot: '1.0',
    diffusion: '10e-3', function: '100e-6', status: '0.0',
  });

  // --- NEW State for API interaction ---
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // type: 'success' or 'error'
  // --- END NEW State ---


  // updateClock remains the same
  const updateClock = (field, value) => { /* ... */ setClocks((prev) => ({ ...prev, [field]: value })); };

  // getRunConfigurationData remains the same
  const getRunConfigurationData = useCallback(() => { /* ... */
     return { runtime: parseFloat(runtime) || 0.3, /* other clocks */ };
  }, [runtime, clocks]);

  // useEffect hook remains the same
  useEffect(() => { /* ... */
     if (onConfigurationChange) { onConfigurationChange(getRunConfigurationData()); }
  }, [runtime, clocks, getRunConfigurationData, onConfigurationChange]);


  // --- UPDATED: handleStart to call backend API ---
  const handleStart = async () => {
    console.log("Start clicked - initiating API call");
    setStatusMessage({ type: '', text: '' }); // Clear previous status

    if (!getCurrentJsonData) {
        console.error("handleStart: getCurrentJsonData prop is missing!");
        setStatusMessage({ type: 'error', text: 'Internal Error: Cannot get config data.' });
        return;
    }

    const currentJsonConfig = getCurrentJsonData();
    if (!currentJsonConfig) {
        console.error("handleStart: getCurrentJsonData returned null or undefined.");
        setStatusMessage({ type: 'error', text: 'Error: No configuration data available.' });
        return;
    }

    setIsLoading(true); // Show loading indicator

    try {
        // Make sure the URL matches where your Flask server is running
        const response = await fetch('http://localhost:5000/launch_simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentJsonConfig), // Send the whole config object
        });

        const result = await response.json(); // Parse the JSON response from Flask

        if (response.ok && result.status === 'success') {
            console.log("Backend response:", result);
            setStatusMessage({ type: 'success', text: `Simulation launch initiated. Config saved to: ${result.config_file}` });
            // In future phases, you might store a simulation ID returned from the backend
        } else {
            console.error("Backend error response:", result);
            setStatusMessage({ type: 'error', text: `Error from backend: ${result.message || 'Unknown error'}` });
        }
    } catch (error) {
        console.error("Network or fetch error:", error);
        setStatusMessage({ type: 'error', text: `Network error: Could not connect to backend. ${error.message}` });
    } finally {
        setIsLoading(false); // Hide loading indicator
    }
  };
  // --- END UPDATED handleStart ---


  // Placeholder handlers for Pause/Reset (will call backend later)
  const handlePause = () => console.log("Pause clicked");
  const handleReset = () => console.log("Reset clicked");


  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      {/* Buttons */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
           {/* Disable button while loading */}
          <Button variant="contained" fullWidth startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />} sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }} onClick={handleStart} disabled={isLoading}>
            {isLoading ? 'Starting...' : 'Start'}
          </Button>
        </Grid>
        <Grid item xs={4}>
          {/* Pause Button (color updated previously) */}
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

      {/* --- NEW Status Message Display --- */}
      {statusMessage.text && (
          <Alert severity={statusMessage.type || 'info'} sx={{ mb: 2 }}>
              {statusMessage.text}
          </Alert>
      )}
      {/* --- END NEW Status Message Display --- */}


      {/* Runtime and Current Time */}
      {/* ... JSX remains the same ... */}
       <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6}> <TextField fullWidth size="small" label="Total Runtime (s)" type="text" value={runtime} onChange={(e) => setRuntime(e.target.value)} /> </Grid>
        <Grid item xs={6}> <TextField fullWidth size="small" label="Current Time (s)" type="number" value={currentTime} InputProps={{ readOnly: true }} variant="filled" /> </Grid>
      </Grid>

      {/* Clocks Header */}
      {/* ... JSX remains the same ... */}
       <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}> Simulation Time Steps (Clocks) </Typography>

      {/* Clocks Section */}
      {/* ... JSX remains the same ... */}
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
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

