import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Tabs, Tab, IconButton, Tooltip, FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './SimOutputMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Constants ---
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit'
];
const outputTypeOptions = ['nsdf', 'hdf5', 'tsv', 'csv', 'xml'];
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// --- Default state creator ---
const createNewOutputFile = () => ({
    file: '',
    type: outputTypeOptions[0],
    path: '',
    field: fieldOptions[0],
    dt: '0.1',
    chemProto: '.',
    childPath: '',
    flushSteps: '1',
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
const SimOutputMenuBox = ({ onConfigurationChange, currentConfig = [], getChemProtos }) => {
    const [outputFiles, setOutputFiles] = useState(() => {
        const defaults = createNewOutputFile();
        if (Array.isArray(currentConfig) && currentConfig.length > 0) {
            return currentConfig.map(file => {
                const field = file.field || fieldOptions[0];
                const isChemField = chemFields.includes(field);
                let initialChemProto = '.';
                let initialChildPath = '';

                if (isChemField) {
                    const relpath = file.relpath || '';
                    const slashIndex = relpath.indexOf('/');
                    if (slashIndex !== -1) {
                        initialChemProto = relpath.substring(0, slashIndex);
                        initialChildPath = relpath.substring(slashIndex + 1);
                    } else {
                        initialChemProto = '';
                        initialChildPath = relpath;
                    }
                } else {
                    initialChildPath = file.relpath || '';
                }
                return {
                    file: file.file || '',
                    type: file.type || outputTypeOptions[0],
                    path: file.path || '',
                    field: field,
                    dt: formatFloat(file.dt) || defaults.dt,
                    chemProto: initialChemProto,
                    childPath: initialChildPath,
                    flushSteps: formatFloat(file.flushSteps) || defaults.flushSteps,
                };
            });
        }
        return [createNewOutputFile()];
    });
    const [activeOutputFileIndex, setActiveOutputFileIndex] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const outputFilesRef = useRef(outputFiles);
    useEffect(() => { outputFilesRef.current = outputFiles; }, [outputFiles]);
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);

    const addOutputFile = useCallback(() => {
        setOutputFiles((prev) => [...prev, createNewOutputFile()]);
        setActiveOutputFileIndex(outputFilesRef.current.length);
    }, []);

    const removeOutputFile = useCallback((indexToRemove) => {
        setOutputFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveOutputFileIndex((prev) => {
            if (prev === indexToRemove) return Math.max(0, prev - 1);
            if (prev > indexToRemove) return prev - 1;
            return prev;
        });
    }, []);

    const updateOutputFile = useCallback((index, key, value) => {
        setOutputFiles((prevFiles) =>
            prevFiles.map((fileEntry, i) => {
                if (i === index) {
                     const updatedFile = { ...fileEntry, [key]: value };
                     if (key === 'field') {
                         const isNowChem = chemFields.includes(value);
                         const wasChem = chemFields.includes(fileEntry.field);
                         if (wasChem && !isNowChem) updatedFile.chemProto = '.';
                         else if (!wasChem && isNowChem) updatedFile.chemProto = '';
                     }
                     return updatedFile;
                }
                return fileEntry;
            })
        );
    }, []);

    useEffect(() => {
        const getFileData = () => {
            return outputFilesRef.current.map(fileState => {
                 if (!fileState.file || !fileState.type || !fileState.path || !fileState.field || !fileState.dt) return null;
                 const dtNum = parseFloat(fileState.dt);
                 const flushStepsInt = parseInt(fileState.flushSteps, 10);
                 if (isNaN(dtNum) || dtNum <= 0) return null;
                 if (fileState.flushSteps && (isNaN(flushStepsInt) || flushStepsInt < 1)) return null;

                 const isChemField = chemFields.includes(fileState.field);
                 let relpathValue = undefined;

                 if (isChemField) {
                     if (fileState.chemProto && fileState.childPath) {
                         relpathValue = `${fileState.chemProto}/${fileState.childPath}`;
                     } else { return null; }
                 } else {
                     if (fileState.childPath && fileState.childPath !== '') relpathValue = fileState.childPath;
                 }
                const fileSchemaItem = { file: fileState.file, type: fileState.type, path: fileState.path, field: fileState.field, dt: dtNum };
                if (relpathValue !== undefined) fileSchemaItem.relpath = relpathValue;
                if (!isNaN(flushStepsInt) && flushStepsInt >= 1 && String(fileState.flushSteps).trim() !== '') fileSchemaItem.flushSteps = flushStepsInt;
                 return fileSchemaItem;
            }).filter(item => item !== null);
        };
        const initialConfigString = JSON.stringify(currentConfig || []);
        return () => {
            if (onConfigurationChangeRef.current) {
                const finalConfigData = getFileData();
                const finalConfigString = JSON.stringify(finalConfigData);
                 if (finalConfigString !== initialConfigString) {
                    onConfigurationChangeRef.current({ files: finalConfigData });
                 }
            }
        };
    }, [currentConfig]);

    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];
    const activeFileData = outputFiles[activeOutputFileIndex];
    const isChemField = activeFileData && chemFields.includes(activeFileData.field);
    const showChemProtoWarning = isChemField && !availableChemProtos.length;

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Define Simulation Output Files</Typography>
                <Tooltip title={helpText.main} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                <Tabs value={activeOutputFileIndex} onChange={(e, nv) => setActiveOutputFileIndex(nv)} variant="scrollable" scrollButtons="auto">
                    {outputFiles.map((fileEntry, index) => <Tab key={index} label={fileEntry.file || `File ${index + 1}`} />)}
                    <IconButton onClick={addOutputFile} sx={{ alignSelf: 'center', ml: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>
             {activeFileData && (
                 <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={2}>
                         <Grid item xs={12} sm={7}><HelpField id="file" label="Output Filename" required value={activeFileData.file} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.file} /></Grid>
                         <Grid item xs={12} sm={5}><HelpField id="type" label="File Type" required select value={activeFileData.type} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.type}>{outputTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</HelpField></Grid>
                         <Grid item xs={12} sm={6}><HelpField id="path" label="Data Source Path" required value={activeFileData.path} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.path} /></Grid>
                         <Grid item xs={12} sm={6}>
                             <HelpField id="field" label="Data Source Field" required select value={activeFileData.field} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.field}>
                                 <MenuItem value=""><em>Select...</em></MenuItem>
                                 {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                             </HelpField>
                         </Grid>
                          {isChemField ? (
                              <>
                                  <Grid item xs={12} sm={6}>
                                      <HelpField id="chemProto" label="Chem Prototype" required select value={activeFileData.chemProto} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.chemProto} error={showChemProtoWarning || !activeFileData.chemProto}>
                                          <MenuItem value=""><em>Select...</em></MenuItem>
                                          {availableChemProtos.map(protoName => <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>)}
                                      </HelpField>
                                      {(showChemProtoWarning || !activeFileData.chemProto) && <FormHelperText error>{showChemProtoWarning ? "Warning: No Chem Protos defined" : "Required"}</FormHelperText>}
                                  </Grid>
                                  <Grid item xs={12} sm={6}><HelpField id="childPath" label="Child Object Path" required value={activeFileData.childPath} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.childPath} error={!activeFileData.childPath} /></Grid>
                              </>
                          ) : (
                              <>
                                  <Grid item xs={12} sm={6}><HelpField id="chemProto" label="Chem Prototype" select disabled value={activeFileData.chemProto} onChange={()=>{}} helptext={helpText.fields.chemProto}><MenuItem value=".">.</MenuItem></HelpField></Grid>
                                  <Grid item xs={12} sm={6}><HelpField id="childPath" label="Relative Path (Optional)" value={activeFileData.childPath} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.childPath}/></Grid>
                              </>
                          )}
                         <Grid item xs={12} sm={6}><HelpField id="dt" label="Sampling Interval dt (s)" required type="number" value={activeFileData.dt} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.dt} InputProps={{ inputProps: { min: 1e-7, step: 0.01 } }}/></Grid>
                         <Grid item xs={12} sm={6}><HelpField id="flushSteps" label="Flush Steps (Optional, >=1)" type="number" value={activeFileData.flushSteps} onChange={(id, v) => updateOutputFile(activeOutputFileIndex, id, v)} helptext={helpText.fields.flushSteps} InputProps={{ inputProps: { min: 1, step: 1 } }}/></Grid>
                     </Grid>
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeOutputFile(activeOutputFileIndex)} sx={{ mt: 2 }}>
                         Remove Output File
                     </Button>
                 </Box>
             )}
             {outputFiles.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No simulation output files defined.</Typography>}
        </Box>
    );
};

export default SimOutputMenuBox;

