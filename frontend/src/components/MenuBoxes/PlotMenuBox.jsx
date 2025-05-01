import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton,
    MenuItem,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Define options outside component
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];
const modeOptions = ['time', 'space', 'wave', 'raster'];

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// Default state for a new plot entry in the component
const createDefaultPlot = () => ({
    path: '',
    field: fieldOptions[0], // Default field
    relativePath: '', // Schema default is undefined, component uses ''
    title: '',
    yMin: '0.0', // Schema default 0
    yMax: '0.0', // Schema default 0
    mode: 'time', // Schema default 'time'
    waveFrames: '0', // Schema default 0, component default was '100', using schema default now
});

// Accept currentConfig prop (should be jsonData.plots array)
const PlotMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [plots, setPlots] = useState(() => {
        console.log("PlotMenuBox: Initializing plots from props", currentConfig);
        const initialPlots = currentConfig?.map(p => ({
            path: p.path || '',
            field: p.field || fieldOptions[0],
            relativePath: p.relpath || '', // Map schema key back
            title: p.title || '',
            yMin: safeToString(p.ymin, '0.0'), // Map schema key back, default '0.0'
            yMax: safeToString(p.ymax, '0.0'), // Map schema key back, default '0.0'
            mode: p.mode || 'time',
            waveFrames: safeToString(p.numWaveFrames, '0'), // Map schema key back, default '0'
        })) || [];
        // Ensure there's at least one plot entry to start with
        return initialPlots.length > 0 ? initialPlots : [createDefaultPlot()];
    });
    const [activePlot, setActivePlot] = useState(0);
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const plotsRef = useRef(plots);
    useEffect(() => { plotsRef.current = plots; }, [plots]);


    // --- Handlers ONLY update LOCAL state ---
    const addPlot = useCallback(() => {
        setPlots((prev) => [...prev, createDefaultPlot()]);
        setActivePlot(plotsRef.current.length); // Use ref for correct length before state update
    }, []); // No dependency needed

    const removePlot = useCallback((indexToRemove) => {
        setPlots((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActivePlot((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []); // No dependency needed

    const updatePlot = useCallback((index, key, value) => {
        console.log(`PlotMenuBox: Local state change - Index ${index}, Key ${key}: ${value}`);
        setPlots((prevPlots) =>
            prevPlots.map((plot, i) =>
                i === index ? { ...plot, [key]: value } : plot
            )
        );
    }, []); // No dependency needed
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getPlotDataForUnmount = () => {
        const currentPlots = plotsRef.current; // Use ref for latest state
        console.log("PlotMenuBox: Formatting final local state for push:", currentPlots);

        return currentPlots.map(plotState => {
             // Basic validation
             if (!plotState.path || !plotState.field) {
                 console.warn("Skipping plot due to missing path or field:", plotState);
                 return null;
             }
            const yminNum = parseFloat(plotState.yMin);
            const ymaxNum = parseFloat(plotState.yMax);
            const numWaveFramesInt = parseInt(plotState.waveFrames, 10);

            const plotSchemaItem = {
                path: plotState.path,
                field: plotState.field,
                // Optional fields only included if non-default/non-empty
                ...(plotState.relativePath && { relpath: plotState.relativePath }),
                ...(plotState.title && { title: plotState.title }),
                ...( (!isNaN(yminNum) && yminNum !== 0) && { ymin: yminNum }),
                ...( (!isNaN(ymaxNum) && ymaxNum !== 0) && { ymax: ymaxNum }),
                ...(plotState.mode && plotState.mode !== 'time' && { mode: plotState.mode }),
                // Only include numWaveFrames if mode is 'wave' and value is valid & non-zero
                ...( (plotState.mode === 'wave' && !isNaN(numWaveFramesInt) && numWaveFramesInt !== 0) && { numWaveFrames: numWaveFramesInt }),
            };
            return plotSchemaItem;
        }).filter(item => item !== null); // Filter out invalid entries
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("PlotMenuBox: Mounted, setting up unmount cleanup.");
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("PlotMenuBox: Unmounting, pushing final state up.");
                const configData = getPlotDataForUnmount();
                latestOnConfigurationChange({ plots: configData }); // Pass array under 'plots' key
            } else {
                console.warn("PlotMenuBox: onConfigurationChange not available on unmount.");
            }
        };
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (uses local state) ---
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
                             <TextField fullWidth size="small" label="# Wave Frames (Optional, if Mode='wave')" type="number" value={plots[activePlot].waveFrames}
                                onChange={(e) => updatePlot(activePlot, 'waveFrames', e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: 1 } }} // Ensure integer input
                                disabled={plots[activePlot].mode !== 'wave'} // Disable if mode is not 'wave'
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
