import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    Tooltip,
    FormHelperText,
    ListSubheader
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh'; // Import Refresh Icon
import helpText from './PlotMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Define options outside component ---
const nonChemFieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'activation', 'current', 'modulation', 'psdArea'
];
const chemFieldOptions = ['n', 'conc', 'volume', 'concInit', 'nInit'];
const fieldOptions = [...nonChemFieldOptions, ...chemFieldOptions];
const modeOptions = ['time', 'space', 'wave', 'raster'];

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Regex to parse chem paths like "DEND/Ca[0]" ---
const chemPathRegex = /([^/]+)\/([^[]+)(\[.*\])?/;

// --- Default state for a new plot entry ---
const createDefaultPlot = () => ({
    path: '',
    field: nonChemFieldOptions[0],
    chemProto: '.', // Will store meshName for chem fields
    childPath: '', // Will store molName for chem fields
    molIndex: '',  // New field for mol index
    title: '',
    yMin: '0.0',
    yMax: '0.0',
    mode: 'time',
    waveFrames: '100',
});

// --- Reusable HelpField Component ---
const HelpField = React.memo(({ id, label, value, onChange, type = "text", fullWidth = true, ...props }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <TextField {...props} fullWidth={fullWidth} size="small" label={label} variant="outlined" type={type}
                value={value} onChange={(e) => onChange(id, e.target.value)} />
            <Tooltip title={props.helptext} placement="right">
                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
        </Box>
    );
});

// --- Main Component ---
const PlotMenuBox = ({ onConfigurationChange, currentConfig, meshMols }) => {
    const [plots, setPlots] = useState(() => {
        const initialPlots = currentConfig?.map(p => {
            const field = p.field || nonChemFieldOptions[0];
            const isChemField = chemFieldOptions.includes(field);
            let initialChemProto = '.';
            let initialChildPath = '';
            let initialMolIndex = '';

            if (isChemField) {
                const relpath = p.relpath || '';
                const match = relpath.match(chemPathRegex);
                if (match) {
                    initialChemProto = match[1] || '';
                    initialChildPath = match[2] || '';
                    initialMolIndex = match[3] || '';
                } else {
                    // Fallback for older/simpler paths
                    const slashIndex = relpath.indexOf('/');
                    if (slashIndex !== -1) {
                        initialChemProto = relpath.substring(0, slashIndex);
                        initialChildPath = relpath.substring(slashIndex + 1);
                    } else {
                        initialChemProto = '';
                        initialChildPath = relpath;
                    }
                }
            } else {
                initialChildPath = p.relpath || '';
            }

            return {
                path: p.path || '',
                field: field,
                chemProto: initialChemProto,
                childPath: initialChildPath,
                molIndex: initialMolIndex,
                title: p.title || '',
                yMin: formatFloat(p.ymin) || '0.0',
                yMax: formatFloat(p.ymax) || '0.0',
                mode: p.mode || 'time',
                waveFrames: safeToString(p.numWaveFrames, '100'),
            };
        }) || [];
        return initialPlots.length > 0 ? initialPlots : [createDefaultPlot()];
    });
    const [activePlot, setActivePlot] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const plotsRef = useRef(plots);
    useEffect(() => { plotsRef.current = plots; }, [plots]);

    const addPlot = useCallback(() => {
        setPlots((prev) => [...prev, createDefaultPlot()]);
        setActivePlot(plotsRef.current.length);
    }, []);

    const removePlot = useCallback((indexToRemove) => {
        setPlots((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActivePlot((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updatePlot = useCallback((index, key, value) => {
        setPlots((prevPlots) =>
            prevPlots.map((plot, i) => {
                if (i === index) {
                    const updatedPlot = { ...plot, [key]: value };
                    
                    // Handle switching field type
                    if (key === 'field') {
                        const isNowChem = chemFieldOptions.includes(value);
                        const wasChem = chemFieldOptions.includes(plot.field);
                        if (wasChem && !isNowChem) {
                            updatedPlot.chemProto = '.';
                            updatedPlot.childPath = '';
                            updatedPlot.molIndex = '';
                        } else if (!wasChem && isNowChem) {
                            updatedPlot.chemProto = ''; // Require user selection
                            updatedPlot.childPath = '';
                            updatedPlot.molIndex = '';
                        }
                    }

                    // Handle changing compartment
                    if (key === 'chemProto') {
                        updatedPlot.childPath = ''; // Reset molecule path
                        updatedPlot.molIndex = '';  // Reset index
                    }

                    return updatedPlot;
                }
                return plot;
            })
        );
    }, []);

    // Create sorted list of chem compartment (mesh) names
    const chemCompartmentOptions = useMemo(() => {
        if (!meshMols || typeof meshMols !== 'object') return [];
        return Object.keys(meshMols).sort();
    }, [meshMols]);

    // Get active plot data
    const activePlotData = plots[activePlot];
    const isChemField = activePlotData && chemFieldOptions.includes(activePlotData.field);

    // Create sorted list of molecules for the selected compartment
    const moleculeOptions = useMemo(() => {
        if (!isChemField || !meshMols || !activePlotData.chemProto) return [];
        const mols = meshMols[activePlotData.chemProto];
        return Array.isArray(mols) ? [...mols].sort() : [];
    }, [isChemField, meshMols, activePlotData?.chemProto]);


    // --- Refactored Save/Refresh Logic ---
    const getPlotDataForSave = useCallback(() => {
        return plotsRef.current.map(plotState => {
                if (!plotState.path || !plotState.field) return null;

            const yminNum = parseFloat(plotState.yMin);
            const ymaxNum = parseFloat(plotState.yMax);
            const numWaveFramesInt = parseInt(plotState.waveFrames, 10);
            const isChemField = chemFieldOptions.includes(plotState.field);
            let relpathValue = undefined;

            if (isChemField) {
                // Mol path and compartment are now required
                if (plotState.chemProto && plotState.childPath) {
                    // Combine mol path and optional index
                    const molIndex = plotState.molIndex || '';
                    relpathValue = `${plotState.chemProto}/${plotState.childPath}${molIndex}`;
                } else { 
                    return null; // Invalid chemical plot
                }
            } else {
                if (plotState.childPath && plotState.childPath !== '') {
                        relpathValue = plotState.childPath;
                }
            }

            const plotSchemaItem = {
                path: plotState.path,
                field: plotState.field,
                ...(relpathValue !== undefined && { relpath: relpathValue }),
                ...(plotState.title && { title: plotState.title }),
                ...((!isNaN(yminNum) && yminNum !== 0) && { ymin: yminNum }),
                ...((!isNaN(ymaxNum) && ymaxNum !== 0) && { ymax: ymaxNum }),
                ...(plotState.mode && plotState.mode !== 'time' && { mode: plotState.mode }),
                ...((plotState.mode === 'wave' && !isNaN(numWaveFramesInt) && numWaveFramesInt !== 0) && { numWaveFrames: numWaveFramesInt }),
            };
            return plotSchemaItem;
        }).filter(item => item !== null);
    }, []); // Uses plotsRef, no dependencies needed

    const handleRefreshModel = useCallback(() => {
        if (onConfigurationChangeRef.current) {
            const finalConfigData = getPlotDataForSave();
            onConfigurationChangeRef.current({ plots: finalConfigData });
        }
    }, [getPlotDataForSave]);

    useEffect(() => {
        // Register the handleRefreshModel function to be called on unmount
        return () => {
            handleRefreshModel();
        };
    }, [handleRefreshModel]);
    // --- End Refactor ---

    const getTabLabel = (plot) => {
        const isChem = chemFieldOptions.includes(plot.field);
        if (isChem) {
            const mol = plot.childPath || '?';
            const comp = plot.chemProto || '?';
            return `${mol}@${comp}`;
        }
        return `${plot.field || 'New'} @ ${plot.path || '?'}`;
    };

    const showChemCompartmentWarning = isChemField && !chemCompartmentOptions.length;

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Plot Configuration</Typography>
                <Tooltip title={helpText.main} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefreshModel} sx={{ ml: 'auto' }}>
                    Refresh Model
                </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                <Tabs value={activePlot} onChange={(e, nv) => setActivePlot(nv)} variant="scrollable" scrollButtons="auto">
                    {plots.map((plot, index) => <Tab key={index} label={getTabLabel(plot)} />)}
                    <IconButton onClick={addPlot} sx={{ alignSelf: 'center', ml: '10px' }}><AddIcon /></IconButton>
                </Tabs>
            </Box>

            {activePlotData && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <HelpField id="path" label="Path" required value={activePlotData.path} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.path} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <HelpField id="field" label="Field" select required value={activePlotData.field} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.field}>
                                <MenuItem value=""><em>Select Field...</em></MenuItem>
                                <ListSubheader>Electrical/Other</ListSubheader>
                                {nonChemFieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                <ListSubheader>Chemical</ListSubheader>
                                {chemFieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </HelpField>
                        </Grid>
                         
                        <Grid item xs={12} sm={6}>
                            <HelpField 
                                id="chemProto" 
                                label="Chem Compartment" 
                                select 
                                required={isChemField}
                                value={activePlotData.chemProto} 
                                onChange={(id, v) => updatePlot(activePlot, id, v)} 
                                helptext={helpText.fields.chemProto} 
                                error={isChemField && (showChemCompartmentWarning || !activePlotData.chemProto)}
                                disabled={!isChemField}
                            >
                                <MenuItem value={isChemField ? "" : "."}><em>{isChemField ? "Select..." : "."}</em></MenuItem>
                                {chemCompartmentOptions.map(compName => <MenuItem key={compName} value={compName}>{compName}</MenuItem>)}
                            </HelpField>
                            {isChemField && (showChemCompartmentWarning || !activePlotData.chemProto) && 
                                <FormHelperText error>{showChemCompartmentWarning ? "Warning: No Chem Compartments found" : "Required"}</FormHelperText>}
                        </Grid>
                        
                         {isChemField ? (
                             <>
                                <Grid item xs={12} sm={6}>
                                    <HelpField 
                                        id="childPath" 
                                        label="Molecule Path" 
                                        select 
                                        required 
                                        value={activePlotData.childPath} 
                                        onChange={(id, v) => updatePlot(activePlot, id, v)} 
                                        helptext={helpText.fields.childPath} // You may want to update this help text
                                        error={!activePlotData.childPath}
                                        disabled={!activePlotData.chemProto}
                                    >
                                        <MenuItem value=""><em>{activePlotData.chemProto ? "Select..." : "Select compartment first"}</em></MenuItem>
                                        {moleculeOptions.map(molName => <MenuItem key={molName} value={molName}>{molName}</MenuItem>)}
                                    </HelpField>
                                    {!activePlotData.childPath && <FormHelperText error>Required</FormHelperText>}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <HelpField 
                                        id="molIndex" 
                                        label="Molecule Index (optional)" 
                                        value={activePlotData.molIndex} 
                                        onChange={(id, v) => updatePlot(activePlot, id, v)} 
                                        helptext="e.g., [0] or [Ca_cyto]" 
                                    />
                                </Grid>
                             </>
                         ) : (
                             <>
                                 <Grid item xs={12} sm={6}>
                                    <HelpField 
                                        id="childPath" 
                                        label="Relative Path (Optional)" 
                                        value={activePlotData.childPath} 
                                        onChange={(id, v) => updatePlot(activePlot, id, v)} 
                                        helptext={helpText.fields.childPath}
                                    />
                                </Grid>
                             </>
                         )}
                         <Grid item xs={12} sm={6}><HelpField id="title" label="Title (Optional)" value={activePlotData.title} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.title} /></Grid>
                        <Grid item xs={12} sm={6}>
                            <HelpField id="mode" label="Mode (Optional)" select value={activePlotData.mode} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.mode}>
                                {modeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                             </HelpField>
                         </Grid>
                         <Grid item xs={12} sm={6}><HelpField id="yMin" label="Y Min (Optional, 0=auto)" type="number" value={activePlotData.yMin} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.yMin} /></Grid>
                         <Grid item xs={12} sm={6}><HelpField id="yMax" label="Y Max (Optional, 0=auto)" type="number" value={activePlotData.yMax} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.yMax} /></Grid>
                        <Grid item xs={12} sm={6}>
                             <HelpField id="waveFrames" label="# Wave Frames (if Mode='wave')" type="number" value={activePlotData.waveFrames} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.waveFrames} InputProps={{ inputProps: { min: 0, step: 1 } }} disabled={activePlotData.mode !== 'wave'}/>
                         </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removePlot(activePlot)} sx={{ mt: 2 }}>
                        Remove Plot
                    </Button>
                </Box>
            )}
             {plots.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No plots defined.</Typography>}
        </Box>
    );
};

export default PlotMenuBox;
