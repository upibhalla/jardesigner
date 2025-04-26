import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton, // Keep for AddIcon
    MenuItem,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon

// Initial state for a new plot entry
const createNewPlot = () => ({
    path: '', // Required
    field: 'Vm', // Default field, Required
    relativePath: '', // Optional -> relpath
    title: '', // Optional
    yMin: '0.0', // Optional -> ymin (number)
    yMax: '0.0', // Optional -> ymax (number, 0 means auto)
    mode: 'time', // Optional -> mode (enum)
    waveFrames: '100', // Optional -> numWaveFrames (integer, seems inconsistent default 0 vs 100 in component) Let's use schema default
});


const PlotMenuBox = ({ onConfigurationChange }) => { // Accept prop
    const [plots, setPlots] = useState([createNewPlot()]); // Start with one default plot
    const [activePlot, setActivePlot] = useState(0);

    // Options for Field Menu (Matches schema fieldEnum)
    const fieldOptions = [
        'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
        'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
        'modulation', 'psdArea',
    ];

    // Options for Mode (Matches schema mode enum)
    const modeOptions = ['time', 'space', 'wave', 'raster'];

    // --- Plot Handlers ---
    const addPlot = useCallback(() => {
        setPlots((prev) => [...prev, createNewPlot()]);
        setActivePlot(plots.length);
    }, [plots.length]);

    const removePlot = useCallback((indexToRemove) => {
        setPlots((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActivePlot((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updatePlot = useCallback((index, key, value) => {
        setPlots((prevPlots) =>
            prevPlots.map((plot, i) =>
                i === index ? { ...plot, [key]: value } : plot
            )
        );
        // useEffect below handles calling onConfigurationChange
    }, []);


    const getPlotData = useCallback(() => {
        return plots.map(plotState => {
             // Basic validation: Ensure required fields are present
             if (!plotState.path || !plotState.field) {
                 console.warn("Skipping plot due to missing path or field:", plotState);
                 return null; // Skip invalid plot configurations
             }

            // Convert state values to schema format
            const yminNum = parseFloat(plotState.yMin);
            const ymaxNum = parseFloat(plotState.yMax);
            const numWaveFramesInt = parseInt(plotState.waveFrames, 10); // Parse once

            const plotSchemaItem = {
                path: plotState.path,
                field: plotState.field,
                // Optional fields only included if they have a value
                ...(plotState.relativePath && { relpath: plotState.relativePath }), // Map key
                ...(plotState.title && { title: plotState.title }),
                // Default ymin/ymax is 0 in schema, only include if non-zero or different
                ...( (!isNaN(yminNum) && yminNum !== 0) && { ymin: yminNum }),
                ...( (!isNaN(ymaxNum) && ymaxNum !== 0) && { ymax: ymaxNum }),
                 // Default mode is 'time', only include if different
                ...(plotState.mode && plotState.mode !== 'time' && { mode: plotState.mode }),
                // --- CHANGE HERE: Only include numWaveFrames if mode is 'wave' ---
                ...( (plotState.mode === 'wave' && !isNaN(numWaveFramesInt)) && { numWaveFrames: numWaveFramesInt }),
                // --- END CHANGE ---
            };
            return plotSchemaItem;

        }).filter(item => item !== null); // Filter out invalid entries

    }, [plots]); // Depends on plots state

    // --- NEW: useEffect to call the prop when plots state changes ---
    useEffect(() => {
        if (onConfigurationChange) {
            const plotData = getPlotData();
            onConfigurationChange({ plots: plotData }); // Pass array under 'plots' key
        }
    }, [plots, getPlotData, onConfigurationChange]); // Dependencies
    // --- END NEW ---


    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>Plot Configuration</Typography>

            {/* Plot Tabs */}
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activePlot} onChange={(e, nv) => setActivePlot(nv)} variant="scrollable" scrollButtons="auto" aria-label="Plot configurations">
                    {plots.map((plot, index) => (
                        <Tab key={index} label={`${plot.field || 'New'} @ ${plot.path || '?'}`} />
                    ))}
                    <IconButton onClick={addPlot} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                </Tabs>
            </Box>

            {/* Plot Tab Content */}
            {plots.length > 0 && activePlot < plots.length && plots[activePlot] && (
                <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={1.5}>
                        {/* Row 1: Path, Field */}
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Path" required value={plots[activePlot].path}
                                onChange={(e) => updatePlot(activePlot, 'path', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth size="small" label="Field" required value={plots[activePlot].field}
                                onChange={(e) => updatePlot(activePlot, 'field', e.target.value)}>
                                <MenuItem value=""><em>Select Field...</em></MenuItem>
                                {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </TextField>
                        </Grid>
                        {/* Row 2: RelPath, Title */}
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Relative Path (Optional)" value={plots[activePlot].relativePath}
                                onChange={(e) => updatePlot(activePlot, 'relativePath', e.target.value)} />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Title (Optional)" value={plots[activePlot].title}
                                onChange={(e) => updatePlot(activePlot, 'title', e.target.value)} />
                        </Grid>
                        {/* Row 3: YMin, YMax */}
                         <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Y Min (Optional, 0=auto)" type="number" value={plots[activePlot].yMin}
                                onChange={(e) => updatePlot(activePlot, 'yMin', e.target.value)} />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Y Max (Optional, 0=auto)" type="number" value={plots[activePlot].yMax}
                                onChange={(e) => updatePlot(activePlot, 'yMax', e.target.value)} />
                        </Grid>
                         {/* Row 4: Mode, Wave Frames */}
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth size="small" label="Mode (Optional)" value={plots[activePlot].mode}
                                onChange={(e) => updatePlot(activePlot, 'mode', e.target.value)}>
                                {modeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                             </TextField>
                         </Grid>
                         <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="# Wave Frames (Optional)" type="number" value={plots[activePlot].waveFrames}
                                onChange={(e) => updatePlot(activePlot, 'waveFrames', e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: 1 } }} // Ensure integer input
                                />
                         </Grid>
                    </Grid>

                    {/* Remove Plot Button */}
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePlot(activePlot)} sx={{ marginTop: '16px' }}>
                        Remove Plot {activePlot + 1}
                    </Button>
                </Box>
            )}
             {plots.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No plots defined.</Typography>}
        </Box>
    );
};

export default PlotMenuBox;
