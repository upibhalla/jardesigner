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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './AdaptorsMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Define fieldOptions outside the component ---
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default state for a new adaptor entry ---
const createDefaultAdaptor = () => ({
    source: '',
    sourceField: fieldOptions[0],
    destination: '',
    destinationField: fieldOptions[0],
    baseline: '0.0',
    slope: '1.0',
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
const AdaptorsMenuBox = ({ onConfigurationChange, currentConfig }) => {
    const [adaptors, setAdaptors] = useState(() => {
        const initialAdaptors = currentConfig?.map(a => ({
            source: a.source || '',
            sourceField: a.sourceField || fieldOptions[0],
            destination: a.dest || '',
            destinationField: a.destField || fieldOptions[0],
            baseline: formatFloat(a.baseline) || createDefaultAdaptor().baseline,
            slope: formatFloat(a.slope) || createDefaultAdaptor().slope,
        })) || [];
        return initialAdaptors.length > 0 ? initialAdaptors : [createDefaultAdaptor()];
    });
    const [activeAdaptor, setActiveAdaptor] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const adaptorsRef = useRef(adaptors);
    useEffect(() => { adaptorsRef.current = adaptors; }, [adaptors]);

    const addAdaptor = useCallback(() => {
        setAdaptors((prev) => [...prev, createDefaultAdaptor()]);
        setActiveAdaptor(adaptorsRef.current.length);
    }, []);

    const removeAdaptor = useCallback((indexToRemove) => {
        setAdaptors((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveAdaptor((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateAdaptor = useCallback((index, key, value) => {
        setAdaptors((prevAdaptors) =>
            prevAdaptors.map((adaptor, i) =>
                i === index ? { ...adaptor, [key]: value } : adaptor
            )
        );
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveAdaptor(newValue);
    };

    useEffect(() => {
        const getAdaptorDataForUnmount = () => {
            return adaptorsRef.current.map(adaptorState => {
                 if (!adaptorState.source || !adaptorState.sourceField || !adaptorState.destination || !adaptorState.destinationField) {
                     return null;
                 }
                 const baselineNum = parseFloat(adaptorState.baseline);
                 const slopeNum = parseFloat(adaptorState.slope);
                 if (isNaN(baselineNum) || isNaN(slopeNum)) {
                     return null;
                 }
                return {
                    source: adaptorState.source,
                    sourceField: adaptorState.sourceField,
                    dest: adaptorState.destination,
                    destField: adaptorState.destinationField,
                    baseline: baselineNum,
                    slope: slopeNum,
                };
            }).filter(item => item !== null);
        };

        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getAdaptorDataForUnmount();
                onConfigurationChangeRef.current({ adaptors: configData });
            }
        };
    }, []);

    const activeAdaptorData = adaptors[activeAdaptor];

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Adaptors Configuration</Typography>
                <Tooltip title={helpText.main} placement="right">
                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
            </Box>

             <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                <Tabs value={activeAdaptor} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" aria-label="Adaptor configurations">
                    {adaptors.map((adaptor, index) => (
                        <Tab key={index} label={`${adaptor.sourceField || '?'} -> ${adaptor.destinationField || '?'}`} />
                    ))}
                     <IconButton onClick={addAdaptor} sx={{ alignSelf: 'center', ml: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>

             {activeAdaptorData && (
                 <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={2}>
                         <Grid item xs={12} sm={6}>
                            <HelpField id="source" label="Source Path" required value={activeAdaptorData.source} onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} helptext={helpText.fields.source}/>
                            <Box mt={2}>
                                <HelpField id="sourceField" label="Source Field" select required value={activeAdaptorData.sourceField} onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} helptext={helpText.fields.sourceField}>
                                    {fieldOptions.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                                </HelpField>
                            </Box>
                            <Box mt={2}>
                                <HelpField id="baseline" label="Baseline" required type="number" value={activeAdaptorData.baseline} onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} helptext={helpText.fields.baseline} InputProps={{ inputProps: { step: 0.1 } }}/>
                            </Box>
                         </Grid>
                         <Grid item xs={12} sm={6}>
                              <HelpField id="destination" label="Destination Path (dest)" required value={activeAdaptorData.destination} onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} helptext={helpText.fields.destination}/>
                              <Box mt={2}>
                                  <HelpField id="destinationField" label="Destination Field (destField)" select required value={activeAdaptorData.destinationField} onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} helptext={helpText.fields.destinationField}>
                                      {fieldOptions.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                                  </HelpField>
                              </Box>
                              <Box mt={2}>
                                  <HelpField id="slope" label="Slope" required type="number" value={activeAdaptorData.slope} onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} helptext={helpText.fields.slope} InputProps={{ inputProps: { step: 0.1 } }}/>
                              </Box>
                         </Grid>
                     </Grid>

                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeAdaptor(activeAdaptor)} sx={{ mt: 2 }}>
                         Remove Adaptor
                     </Button>
                 </Box>
            )}
             {adaptors.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No adaptors defined.</Typography>}
        </Box>
    );
};

export default AdaptorsMenuBox;
