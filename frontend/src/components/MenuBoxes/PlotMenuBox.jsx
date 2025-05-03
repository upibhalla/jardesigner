import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    FormHelperText // Import FormHelperText for warnings
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Define options outside component
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit' // Added nInit based on instructions
];
const modeOptions = ['time', 'space', 'wave', 'raster'];

// --- ADDED: Define which fields are considered chemical fields ---
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- UPDATED: Default state for a new plot entry ---
const createDefaultPlot = () => ({
    path: '',
    field: fieldOptions[0], // Default field
    // Replace relativePath with chemProto and childPath
    chemProto: '.', // Default for non-chem fields
    childPath: '',
    title: '',
    yMin: '0.0', // Schema default 0
    yMax: '0.0', // Schema default 0
    mode: 'time', // Schema default 'time'
    waveFrames: '0', // Schema default 0
});

// --- UPDATED: Accept getChemProtos prop ---
const PlotMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {

    // --- UPDATED: Initialize state from props ---
    const [plots, setPlots] = useState(() => {
        console.log("PlotMenuBox: Initializing plots from props", currentConfig);
        const initialPlots = currentConfig?.map(p => {
            const field = p.field || fieldOptions[0];
            const isChemField = chemFields.includes(field);
            let initialChemProto = '.'; // Default for non-chem
            let initialChildPath = '';

            // Parse relpath based on isChemField (Instruction 8)
            if (isChemField) {
                const relpath = p.relpath || '';
                const slashIndex = relpath.indexOf('/');
                if (slashIndex !== -1) {
                    initialChemProto = relpath.substring(0, slashIndex);
                    initialChildPath = relpath.substring(slashIndex + 1);
                } else {
                    console.warn(`PlotMenuBox Init: Chem field '${field}' found but relpath '${relpath}' missing '/' separator. Assigning to Child Path.`);
                    initialChemProto = ''; // Default to empty, user needs to select
                    initialChildPath = relpath;
                }
            } else {
                // Not a chem field, relpath goes directly to childPath
                initialChildPath = p.relpath || ''; // Assign relpath directly
            }

            return {
                path: p.path || '',
                field: field,
                chemProto: initialChemProto, // Use parsed value
                childPath: initialChildPath, // Use parsed value
                title: p.title || '',
                yMin: safeToString(p.ymin, '0.0'),
                yMax: safeToString(p.ymax, '0.0'),
                mode: p.mode || 'time',
                waveFrames: safeToString(p.numWaveFrames, '0'),
            };
        }) || [];
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
    // --- ADDED: Ref for getChemProtos ---
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);


    // --- Handlers ONLY update LOCAL state ---
    const addPlot = useCallback(() => {
        setPlots((prev) => [...prev, createDefaultPlot()]);
        setActivePlot(plotsRef.current.length);
    }, []);

    const removePlot = useCallback((indexToRemove) => {
        setPlots((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActivePlot((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    // --- UPDATED: updatePlot handler ---
    const updatePlot = useCallback((index, key, value) => {
        console.log(`PlotMenuBox: Local state change - Index ${index}, Key ${key}: ${value}`);
        setPlots((prevPlots) =>
            prevPlots.map((plot, i) => {
                if (i === index) {
                    const updatedPlot = { ...plot, [key]: value };
                    // --- ADDED: Reset chemProto if field changes ---
                    if (key === 'field') {
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(plot.field);
                        if (wasChem && !isNowChem) {
                            updatedPlot.chemProto = '.'; // Reset proto to default non-chem value
                            // Keep childPath as it might still be relevant
                        } else if (!wasChem && isNowChem) {
                            updatedPlot.chemProto = ''; // Reset proto to empty for chem field selection
                        }
                    }
                    return updatedPlot;
                }
                return plot;
            })
        );
    }, []);
    // --- END Handlers ---


    // --- UPDATED: Function to format local state for pushing up ---
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

            // Determine if the current field is a chemical field (Instruction 2)
            const isChemField = chemFields.includes(plotState.field);
            let relpathValue = undefined;

            // Construct relpath based on isChemField (Instruction 7)
            if (isChemField) {
                // Instruction 5: Both are required if isChemField
                if (plotState.chemProto && plotState.childPath) {
                    relpathValue = `${plotState.chemProto}/${plotState.childPath}`; // Instruction 7.1
                } else {
                    console.warn(`Skipping plot with chem field '${plotState.field}' due to missing Chem Prototype or Child Object Path:`, plotState);
                    return null; // Validation fail
                }
            } else {
                // Instruction 7.2: Use childPath if not empty
                if (plotState.childPath && plotState.childPath !== '') {
                     relpathValue = plotState.childPath;
                }
                 // Ensure non-chem fields don't use the default '.' proto value for relpath
                 if (plotState.chemProto !== '.') {
                     console.warn(`PlotMenuBox Save: Non-chemical field '${plotState.field}' unexpectedly has chemProto '${plotState.chemProto}'. Ignoring proto.`);
                 }
            }

            // Base schema item
            const plotSchemaItem = {
                path: plotState.path,
                field: plotState.field,
                 // Optional fields only included if non-default/non-empty
                ...(relpathValue !== undefined && { relpath: relpathValue }), // Add constructed relpath
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
        // Store the initial config stringified to compare on unmount
        const initialConfigString = JSON.stringify(currentConfig || []);

        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("PlotMenuBox: Unmounting, checking for changes before push.");
                const finalConfigData = getPlotDataForUnmount();
                // Stringify the formatted data for comparison
                const finalConfigString = JSON.stringify(finalConfigData);

                 // Only push if the data has actually changed
                 if (finalConfigString !== initialConfigString) {
                    console.log("PlotMenuBox: Changes detected, pushing final state up.");
                    latestOnConfigurationChange({ plots: finalConfigData }); // Pass array under 'plots' key
                 } else {
                    console.log("PlotMenuBox: No changes detected, skipping push on unmount.");
                 }
            } else {
                console.warn("PlotMenuBox: onConfigurationChange not available on unmount.");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // IMPORTANT: Empty dependency array


    // --- JSX Rendering (uses local state) ---
    // --- ADDED: Get available chem protos ---
    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];

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
            {plots.length > 0 && activePlot >= 0 && activePlot < plots.length && plots[activePlot] && (() => {
                 // Determine if the current field is chemical (Instruction 2)
                 const currentPlot = plots[activePlot];
                 const isChemField = chemFields.includes(currentPlot.field);
                 const chemProtosAvailable = availableChemProtos.length > 0;
                 const showChemProtoWarning = isChemField && !chemProtosAvailable; // Instruction 4

                return (
                    <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <Grid container spacing={1.5}>
                            {/* Row 1: Path, Field */}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Path" required value={currentPlot.path}
                                    onChange={(e) => updatePlot(activePlot, 'path', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select fullWidth size="small" label="Field" required value={currentPlot.field}
                                    onChange={(e) => updatePlot(activePlot, 'field', e.target.value)}>
                                    <MenuItem value=""><em>Select Field...</em></MenuItem>
                                    {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </TextField>
                            </Grid>

                             {/* --- UPDATED Row 2: Conditional Path Inputs (Instruction 3) --- */}
                             {isChemField ? (
                                 <>
                                     {/* Case: isChemField is TRUE */}
                                     <Grid item xs={12} sm={6}>
                                         <TextField
                                             select
                                             fullWidth
                                             size="small"
                                             label="Chem Prototype"
                                             required // Instruction 5
                                             value={currentPlot.chemProto}
                                             onChange={(e) => updatePlot(activePlot, 'chemProto', e.target.value)}
                                             error={showChemProtoWarning || !currentPlot.chemProto} // Highlight if warning or empty
                                             helperText={showChemProtoWarning ? "Warning: No Chem Prototypes defined in Signaling." : (!currentPlot.chemProto ? "Required" : "")} // Instruction 4 warning
                                         >
                                             <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                             {/* Instruction 4: Options from getChemProtos */}
                                             {availableChemProtos.map(protoName => (
                                                 <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>
                                             ))}
                                         </TextField>
                                     </Grid>
                                     <Grid item xs={12} sm={6}>
                                         <TextField
                                             fullWidth
                                             size="small"
                                             label="Child Object Path"
                                             required // Instruction 5
                                             value={currentPlot.childPath}
                                             onChange={(e) => updatePlot(activePlot, 'childPath', e.target.value)}
                                             error={!currentPlot.childPath} // Highlight if empty
                                             helperText={!currentPlot.childPath ? "Required" : ""}
                                         />
                                     </Grid>
                                 </>
                             ) : (
                                 <>
                                     {/* Case: isChemField is FALSE */}
                                     <Grid item xs={12} sm={6}>
                                         <TextField
                                             select
                                             fullWidth
                                             disabled // Only '.' allowed
                                             size="small"
                                             label="Chem Prototype"
                                             value={currentPlot.chemProto} // Should be '.'
                                             onChange={(e) => updatePlot(activePlot, 'chemProto', e.target.value)} // Keep handler for consistency
                                         >
                                             {/* Instruction 4: Only '.' allowed */}
                                             <MenuItem value=".">.</MenuItem>
                                         </TextField>
                                     </Grid>
                                     <Grid item xs={12} sm={6}>
                                         <TextField
                                             fullWidth
                                             size="small"
                                             label="Relative Path (Optional)" // Label change
                                             value={currentPlot.childPath}
                                             onChange={(e) => updatePlot(activePlot, 'childPath', e.target.value)}
                                         />
                                     </Grid>
                                 </>
                             )}
                             {/* --- END UPDATED Row 2 --- */}

                            {/* Row 3: Title, Mode */}
                             <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Title (Optional)" value={currentPlot.title}
                                    onChange={(e) => updatePlot(activePlot, 'title', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select fullWidth size="small" label="Mode (Optional)" value={currentPlot.mode}
                                    onChange={(e) => updatePlot(activePlot, 'mode', e.target.value)}>
                                    {modeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                 </TextField>
                             </Grid>

                            {/* Row 4: YMin, YMax */}
                             <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Y Min (Optional, 0=auto)" type="number" value={currentPlot.yMin}
                                    onChange={(e) => updatePlot(activePlot, 'yMin', e.target.value)} />
                            </Grid>
                             <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Y Max (Optional, 0=auto)" type="number" value={currentPlot.yMax}
                                    onChange={(e) => updatePlot(activePlot, 'yMax', e.target.value)} />
                            </Grid>

                             {/* Row 5: Wave Frames (Conditional) */}
                            <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="# Wave Frames (Optional, if Mode='wave')" type="number" value={currentPlot.waveFrames}
                                    onChange={(e) => updatePlot(activePlot, 'waveFrames', e.target.value)}
                                    InputProps={{ inputProps: { min: 0, step: 1 } }} // Ensure integer input
                                    disabled={currentPlot.mode !== 'wave'} // Disable if mode is not 'wave'
                                    />
                             </Grid>
                             {/* Empty grid item to balance the row if needed */}
                             <Grid item xs={12} sm={6}></Grid>
                        </Grid>

                        {/* Remove Plot Button */}
                        <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePlot(activePlot)} sx={{ marginTop: '16px' }}>
                            Remove Plot {activePlot + 1}
                        </Button>
                    </Box>
                );
             })()}
             {plots.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No plots defined.</Typography>}
        </Box>
    );
};

export default PlotMenuBox;

