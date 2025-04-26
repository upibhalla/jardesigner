import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Button } from '@mui/material';

const RunMenuBox = () => {
  // State for dialogs
  const [runtime, setRuntime] = useState(0.3);
  const [currentTime, setCurrentTime] = useState(0.0);
  const [clocks, setClocks] = useState({
    elec: '50e-6', // Default value
    elecPlot: '100e-6', // Default value
    chem: '0.1', // Default value
    chemPlot: '1.0', // Default value
    diffusion: '10e-3', // Default value
    function: '100e-6', // Default value
    status: '1.0', // Default value
  });

  // Handle clock updates
  const updateClock = (field, value) => {
    setClocks((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      {/* Buttons */}
      <Grid container spacing={2} style={{ marginBottom: '16px' }}>
        <Grid item xs={4}>
          <Button
            variant="contained"
            fullWidth
            style={{ backgroundColor: 'green', color: 'white' }}
          >
            Start
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="contained"
            fullWidth
            style={{ backgroundColor: 'yellow', color: 'black' }}
          >
            Pause
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="contained"
            fullWidth
            style={{ backgroundColor: 'red', color: 'white' }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>

      {/* Runtime and Current Time */}
      <Grid container spacing={2} style={{ marginBottom: '16px' }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Runtime"
            type="number"
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Current Time"
            type="number"
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Clocks Header */}
      <Typography variant="h6" gutterBottom>
        Clocks
      </Typography>

      {/* Clocks Section */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Elec"
            value={clocks.elec}
            onChange={(e) => updateClock('elec', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Elec Plot"
            value={clocks.elecPlot}
            onChange={(e) => updateClock('elecPlot', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Chem"
            value={clocks.chem}
            onChange={(e) => updateClock('chem', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Chem Plot"
            value={clocks.chemPlot}
            onChange={(e) => updateClock('chemPlot', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Diffusion"
            value={clocks.diffusion}
            onChange={(e) => updateClock('diffusion', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Function"
            value={clocks.function}
            onChange={(e) => updateClock('function', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Status"
            value={clocks.status}
            onChange={(e) => updateClock('status', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RunMenuBox;

