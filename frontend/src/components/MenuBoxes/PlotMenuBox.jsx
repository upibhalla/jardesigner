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
    Tooltip,
    FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './PlotMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Define options outside component ---
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit'
];
const modeOptions = ['time', 'space', 'wave', 'raster'];
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default state for a new plot entry ---
const createDefaultPlot = () => ({
    path: '',
    field: fieldOptions[0],
    chemProto: '.',
    childPath: '',
    title: '',
    yMin: '0.0',
    yMax: '0.0',
    mode: 'time',
    waveFrames: '100', // Default value moved here
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
const PlotMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {
    const [plots, setPlots] = useState(() => {
        const initialPlots = currentConfig?.map(p => {
            const field = p.field || fieldOptions[0];
            const isChemField = chemFields.includes(field);
            let initialChemProto = '.';
            let initialChildPath = '';

            if (isChemField) {
                const relpath = p.relpath || '';
                const slashIndex = relpath.indexOf('/');
                if (slashIndex !== -1) {
                    initialChemProto = relpath.substring(0, slashIndex);
                    initialChildPath = relpath.substring(slashIndex + 1);
                } else {
                    initialChemProto = '';
                    initialChildPath = relpath;
                }
            } else {
                initialChildPath = p.relpath || '';
            }

            return {
                path: p.path || '',
                field: field,
                chemProto: initialChemProto,
                childPath: initialChildPath,
                title: p.title || '',
                yMin: formatFloat(p.ymin) || '0.0',
                yMax: formatFloat(p.ymax) || '0.0',
                mode: p.mode || 'time',
                waveFrames: safeToString(p.numWaveFrames, '100'), // Updated default
            };
        }) || [];
        return initialPlots.length > 0 ? initialPlots : [createDefaultPlot()];
    });
    const [activePlot, setActivePlot] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const plotsRef = useRef(plots);
    useEffect(() => { plotsRef.current = plots; }, [plots]);
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);

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
                    if (key === 'field') {
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(plot.field);
                        if (wasChem && !isNowChem) {
                            updatedPlot.chemProto = '.';
                        } else if (!wasChem && isNowChem) {
                            updatedPlot.chemProto = '';
                        }
                    }
                    return updatedPlot;
                }
                return plot;
            })
        );
    }, []);

    useEffect(() => {
        const getPlotDataForUnmount = () => {
            return plotsRef.current.map(plotState => {
                 if (!plotState.path || !plotState.field) return null;

                const yminNum = parseFloat(plotState.yMin);
                const ymaxNum = parseFloat(plotState.yMax);
                const numWaveFramesInt = parseInt(plotState.waveFrames, 10);
                const isChemField = chemFields.includes(plotState.field);
                let relpathValue = undefined;

                if (isChemField) {
                    if (plotState.chemProto && plotState.childPath) {
                        relpathValue = `${plotState.chemProto}/${plotState.childPath}`;
                    } else { return null; }
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
        };
        const initialConfigString = JSON.stringify(currentConfig || []);
        return () => {
            if (onConfigurationChangeRef.current) {
                const finalConfigData = getPlotDataForUnmount();
                const finalConfigString = JSON.stringify(finalConfigData);
                 if (finalConfigString !== initialConfigString) {
                    onConfigurationChangeRef.current({ plots: finalConfigData });
                 }
            }
        };
    }, [currentConfig]);

    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];
    const activePlotData = plots[activePlot];
    const isChemField = activePlotData && chemFields.includes(activePlotData.field);
    const showChemProtoWarning = isChemField && !availableChemProtos.length;

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Plot Configuration</Typography>
                <Tooltip title={helpText.main} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                <Tabs value={activePlot} onChange={(e, nv) => setActivePlot(nv)} variant="scrollable" scrollButtons="auto">
                    {plots.map((plot, index) => <Tab key={index} label={`${plot.field || 'New'} @ ${plot.path || '?'}`} />)}
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
                                {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </HelpField>
                        </Grid>
                         {isChemField ? (
                             <>
                                 <Grid item xs={12} sm={6}>
                                     <HelpField id="chemProto" label="Chem Prototype" select required value={activePlotData.chemProto} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.chemProto} error={showChemProtoWarning || !activePlotData.chemProto}>
                                         <MenuItem value=""><em>Select...</em></MenuItem>
                                         {availableChemProtos.map(protoName => <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>)}
                                     </HelpField>
                                     {(showChemProtoWarning || !activePlotData.chemProto) && <FormHelperText error>{showChemProtoWarning ? "Warning: No Chem Protos defined" : "Required"}</FormHelperText>}
                                 </Grid>
                                 <Grid item xs={12} sm={6}><HelpField id="childPath" label="Child Object Path" required value={activePlotData.childPath} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.childPath} error={!activePlotData.childPath} /></Grid>
                             </>
                         ) : (
                             <>
                                 <Grid item xs={12} sm={6}>
                                    <HelpField id="chemProto" label="Chem Prototype" select disabled value={activePlotData.chemProto} onChange={()=>{}} helptext={helpText.fields.chemProto}><MenuItem value=".">.</MenuItem></HelpField>
                                 </Grid>
                                 <Grid item xs={12} sm={6}><HelpField id="childPath" label="Relative Path (Optional)" value={activePlotData.childPath} onChange={(id, v) => updatePlot(activePlot, id, v)} helptext={helpText.fields.childPath}/></Grid>
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
