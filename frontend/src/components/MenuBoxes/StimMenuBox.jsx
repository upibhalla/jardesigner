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
import helpText from './StimMenuBox.Help.json';

// --- Define fieldOptions and typeOptions outside ---
const fieldOptions = [
    'inject', 'vclamp', 'activation', 'modulation', 'conc', 'concInit', 'n', 'nInit'
];
const typeOptions = ['Field', 'Periodic Synapse', 'Random Synapse'];
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default state for a new stim entry ---
const createDefaultStim = () => ({
    path: 'soma',
    field: fieldOptions[0],
    chemProto: '.',
    childPath: '',
    geometryExpression: '1',
    stimulusExpression: '',
    type: typeOptions[0],
    weight: '1.0',
});

// --- Helper to map schema type back to component type ---
const mapSchemaTypeToComponent = (schemaType) => {
    if (schemaType === 'field') return 'Field';
    if (schemaType === 'periodicsyn') return 'Periodic Synapse';
    if (schemaType === 'randsyn') return 'Random Synapse';
    return typeOptions[0];
};

// --- Reusable HelpField Component ---
const HelpField = React.memo(({ id, label, value, onChange, type = "text", fullWidth = true, ...props }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField {...props} fullWidth={fullWidth} size="small" label={label} variant="outlined" type={type}
                value={value} onChange={(e) => onChange(id, e.target.value)} />
            <Tooltip title={props.helptext} placement="right">
                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
        </Box>
    );
});

// --- Main Component ---
const StimMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {
    const [stims, setStims] = useState(() => {
        const initialStims = currentConfig?.map(s => {
            const field = s.field || fieldOptions[0];
            const isChemField = chemFields.includes(field);
            let initialChemProto = '.';
            let initialChildPath = '';

            if (isChemField) {
                const relpath = s.relpath || '';
                const slashIndex = relpath.indexOf('/');
                if (slashIndex !== -1) {
                    initialChemProto = relpath.substring(0, slashIndex);
                    initialChildPath = relpath.substring(slashIndex + 1);
                } else {
                    initialChemProto = '';
                    initialChildPath = relpath;
                }
            } else {
                initialChildPath = s.relpath || '';
            }
            return {
                path: s.path || '',
                field: field,
                chemProto: initialChemProto,
                childPath: initialChildPath,
                geometryExpression: s.geomExpr || '1',
                stimulusExpression: s.expr || '',
                type: mapSchemaTypeToComponent(s.type),
                weight: safeToString(s.weight, '1.0'),
            };
        }) || [];
        return initialStims.length > 0 ? initialStims : [createDefaultStim()];
    });
    const [activeStim, setActiveStim] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const stimsRef = useRef(stims);
    useEffect(() => { stimsRef.current = stims; }, [stims]);
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);

    const addStim = useCallback(() => {
        setStims((prev) => [...prev, createDefaultStim()]);
        setActiveStim(stimsRef.current.length);
    }, []);

    const removeStim = useCallback((indexToRemove) => {
        setStims((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveStim((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateStim = useCallback((index, key, value) => {
        setStims((prevStims) =>
            prevStims.map((stim, i) => {
                if (i === index) {
                    const updatedStim = { ...stim, [key]: value };
                    if (key === 'field') {
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(stim.field);
                        if (wasChem && !isNowChem) {
                            updatedStim.chemProto = '.';
                        } else if (!wasChem && isNowChem) {
                            updatedStim.chemProto = '';
                        }
                    }
                    return updatedStim;
                }
                return stim;
            })
        );
    }, []);

    useEffect(() => {
        const getStimDataForUnmount = () => {
            return stimsRef.current.map(stimState => {
                let schemaType = 'field';
                if (stimState.type === 'Periodic Synapse') schemaType = 'periodicsyn';
                if (stimState.type === 'Random Synapse') schemaType = 'randsyn';
                const isChemField = chemFields.includes(stimState.field);
                let relpathValue = undefined;

                if (isChemField) {
                    if (stimState.chemProto && stimState.childPath) {
                        relpathValue = `${stimState.chemProto}/${stimState.childPath}`;
                    } else { return null; }
                } else {
                    if (stimState.childPath && stimState.childPath !== '') {
                         relpathValue = stimState.childPath;
                    }
                }
                const stimSchemaItemBase = {
                    type: schemaType,
                    path: stimState.path || "",
                    ...(relpathValue !== undefined && { relpath: relpathValue }),
                    ...(stimState.geometryExpression && stimState.geometryExpression !== '1' && { geomExpr: stimState.geometryExpression }),
                    expr: stimState.stimulusExpression || "",
                };
                if (schemaType === 'field') {
                    if (!stimSchemaItemBase.path || !stimState.field || !stimSchemaItemBase.expr) return null;
                    stimSchemaItemBase.field = stimState.field;
                } else {
                     const weightNum = parseFloat(stimState.weight);
                     if (!stimSchemaItemBase.path || isNaN(weightNum) || !stimSchemaItemBase.expr || relpathValue === undefined) return null;
                     stimSchemaItemBase.weight = weightNum;
                }
                return stimSchemaItemBase;
            }).filter(item => item !== null);
        };
        const initialConfigString = JSON.stringify(currentConfig || []);
        return () => {
            if (onConfigurationChangeRef.current) {
                const finalConfigData = getStimDataForUnmount();
                const finalConfigString = JSON.stringify(finalConfigData);
                 if (finalConfigString !== initialConfigString) {
                    onConfigurationChangeRef.current({ stims: finalConfigData });
                 }
            }
        };
    }, [currentConfig]);

    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];
    const activeStimData = stims[activeStim];
    const isChemField = activeStimData && chemFields.includes(activeStimData.field);
    const showChemProtoWarning = isChemField && !availableChemProtos.length;

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Stimulus Configuration</Typography>
                <Tooltip title={helpText.main} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
             <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                 <Tabs value={activeStim} onChange={(e, nv) => setActiveStim(nv)} variant="scrollable" scrollButtons="auto">
                     {stims.map((stim, index) => <Tab key={index} label={`${stim.type || 'New'} @ ${stim.path || '?'}`} />)}
                      <IconButton onClick={addStim} sx={{ alignSelf: 'center', ml: '10px' }}><AddIcon /></IconButton>
                  </Tabs>
              </Box>
              {activeStimData && (
                  <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                      <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><HelpField id="path" label="Path" required value={activeStimData.path} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.path} /></Grid>
                          <Grid item xs={12} sm={6}><HelpField id="type" label="Type" select required value={activeStimData.type} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.type}>{typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</HelpField></Grid>
                          <Grid item xs={12} sm={6}>
                              <HelpField id="field" label="Field" select required={activeStimData.type === 'Field'} value={activeStimData.field} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.field}>
                                  <MenuItem value=""><em>Select...</em></MenuItem>
                                  {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                              </HelpField>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                              {activeStimData.type !== 'Field' && (
                                  <HelpField id="weight" label="Weight" type="number" required value={activeStimData.weight} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.weight} InputProps={{ inputProps: { step: 0.1 } }} />
                              )}
                          </Grid>
                          {isChemField ? (
                              <>
                                  <Grid item xs={12} sm={6}>
                                      <HelpField id="chemProto" label="Chem Prototype" select required value={activeStimData.chemProto} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.chemProto} error={showChemProtoWarning || !activeStimData.chemProto}>
                                          <MenuItem value=""><em>Select...</em></MenuItem>
                                          {availableChemProtos.map(protoName => <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>)}
                                      </HelpField>
                                      {(showChemProtoWarning || !activeStimData.chemProto) && <FormHelperText error>{showChemProtoWarning ? "Warning: No Chem Prototypes defined" : "Required"}</FormHelperText>}
                                  </Grid>
                                  <Grid item xs={12} sm={6}><HelpField id="childPath" label="Child Object Path" required value={activeStimData.childPath} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.childPath} error={!activeStimData.childPath} /></Grid>
                              </>
                          ) : (
                              <>
                                  <Grid item xs={12} sm={6}>
                                    <HelpField id="chemProto" label="Chem Prototype" select disabled value={activeStimData.chemProto} onChange={()=>{}} helptext={helpText.fields.chemProto}><MenuItem value=".">.</MenuItem></HelpField>
                                  </Grid>
                                  <Grid item xs={12} sm={6}><HelpField id="childPath" label="Relative Path (Optional)" value={activeStimData.childPath} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.childPath}/></Grid>
                              </>
                          )}
                          <Grid item xs={12} sm={6}><HelpField id="geometryExpression" label="Geometry Expr" value={activeStimData.geometryExpression} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.geometryExpression}/></Grid>
                          <Grid item xs={12} sm={6}><HelpField id="stimulusExpression" label="Stimulus Expr" required value={activeStimData.stimulusExpression} onChange={(id, v) => updateStim(activeStim, id, v)} helptext={helpText.fields.stimulusExpression}/></Grid>
                      </Grid>
                      <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeStim(activeStim)} sx={{ mt: 2 }}>Remove Stim</Button>
                  </Box>
              )}
             {stims.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No stimuli defined.</Typography>}
        </Box>
    );
};

export default StimMenuBox;
