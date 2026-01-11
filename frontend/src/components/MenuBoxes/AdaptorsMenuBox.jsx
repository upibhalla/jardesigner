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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListSubheader
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVert'; // Changed to Vertical Flip Icon
import helpText from './AdaptorsMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';
import { OPTION_USER_SPECIFIED } from '../../utils/menuHelpers';

// --- Field Constants ---
const chemFields = ['n', 'conc', 'nInit', 'concInit', 'volume'];
const elecFieldsCompt = ['Vm', 'Cm', 'Rm', 'Ra', 'Inject'];
const elecFieldsChan = ['Gbar', 'Gk', 'Ik', 'ICa', 'Ca', 'activation', 'modulation', 'current', 'psdArea'];

// --- Regex to parse chem paths like "DEND/Ca" ---
const chemPathRegex = /([^/]+)\/(.+)/;

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default state for a new adaptor entry ---
const createDefaultAdaptor = () => ({
    // Internal state tracking
    direction: 'chemToElec', // Default: Source=Chemical, Dest=Electrical
    
    // Chemical side
    chemMesh: '',
    chemMol: '',
    chemField: 'conc',

    // Electrical side
    elecEntity: '.',
    elecField: 'Vm',

    // Mapping
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
const AdaptorsMenuBox = ({ 
    onConfigurationChange, 
    currentConfig, 
    meshMols, 
    channelPrototypes = [] 
}) => {
    // --- Initialize State ---
    const [adaptors, setAdaptors] = useState(() => {
        const initialAdaptors = currentConfig?.map(a => {
            const base = createDefaultAdaptor();
            
            const isSourceChem = chemFields.includes(a.sourceField);
            const isDestChem = chemFields.includes(a.destField);

            // --- 1. Infer Direction from Source Field ---
            if (isSourceChem) {
                base.direction = 'chemToElec';
            } else {
                // If source is not chemical, we assume it is electrical
                base.direction = 'elecToChem';
            }

            // Populate Source Data
            if (isSourceChem) {
                base.chemField = a.sourceField || 'conc';
                const match = (a.source || '').match(chemPathRegex);
                if (match) {
                    base.chemMesh = match[1];
                    base.chemMol = match[2];
                } else {
                    base.chemMesh = '';
                    base.chemMol = a.source || '';
                }
            } else {
                base.elecEntity = a.source || '.';
                base.elecField = a.sourceField || 'Vm';
            }

            // Populate Destination Data
            if (isDestChem) {
                base.chemField = a.destField || 'conc';
                const match = (a.dest || '').match(chemPathRegex);
                if (match) {
                    base.chemMesh = match[1];
                    base.chemMol = match[2];
                } else {
                    base.chemMesh = '';
                    base.chemMol = a.dest || '';
                }
            } else {
                if (!isSourceChem) {
                     // Fallback/Overwrite logic if needed
                }
                base.elecEntity = a.dest || '.';
                base.elecField = a.destField || 'Vm';
            }

            base.baseline = formatFloat(a.baseline) || '0.0';
            base.slope = formatFloat(a.slope) || '1.0';
            
            return base;
        }) || [];
        return initialAdaptors.length > 0 ? initialAdaptors : [createDefaultAdaptor()];
    });
    
    const [activeAdaptor, setActiveAdaptor] = useState(0);

    // --- Dialog State for User Defined Electrical Entity ---
    const [customEntityDialogOpen, setCustomEntityDialogOpen] = useState(false);
    const [tempCustomEntity, setTempCustomEntity] = useState('');
    const [pendingAdaptorIndex, setPendingAdaptorIndex] = useState(null);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const adaptorsRef = useRef(adaptors);
    useEffect(() => { adaptorsRef.current = adaptors; }, [adaptors]);

    // --- Memos for Options ---
    const chemCompartmentOptions = useMemo(() => {
        if (!meshMols || typeof meshMols !== 'object') return [];
        return Object.keys(meshMols).sort();
    }, [meshMols]);

    const activeAdaptorData = adaptors[activeAdaptor];

    const moleculeOptions = useMemo(() => {
        if (!activeAdaptorData || !meshMols || !activeAdaptorData.chemMesh) return [];
        const mols = meshMols[activeAdaptorData.chemMesh];
        return Array.isArray(mols) ? [...mols].sort() : [];
    }, [activeAdaptorData, meshMols]);

    // --- Handlers ---
    const addAdaptor = useCallback(() => {
        // 3. New adaptor defaults to chemToElec (handled in createDefaultAdaptor)
        setAdaptors((prev) => [...prev, createDefaultAdaptor()]);
        setActiveAdaptor(adaptorsRef.current.length);
    }, []);

    const removeAdaptor = useCallback((indexToRemove) => {
        setAdaptors((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveAdaptor((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateAdaptor = useCallback((index, key, value) => {
        setAdaptors((prevAdaptors) =>
            prevAdaptors.map((adaptor, i) => {
                if (i === index) {
                    const updated = { ...adaptor, [key]: value };
                    
                    if (key === 'chemMesh') updated.chemMol = '';
                    if (key === 'elecEntity') {
                        updated.elecField = value === '.' ? elecFieldsCompt[0] : elecFieldsChan[0];
                    }
                    return updated;
                }
                return adaptor;
            })
        );
    }, []);

    const toggleDirection = () => {
        const currentDir = activeAdaptorData.direction;
        const newDir = currentDir === 'chemToElec' ? 'elecToChem' : 'chemToElec';
        updateAdaptor(activeAdaptor, 'direction', newDir);
    };

    // --- Custom Entity Logic ---
    const handleEntityChange = (index, newValue) => {
        if (newValue === OPTION_USER_SPECIFIED) {
            setPendingAdaptorIndex(index);
            setTempCustomEntity('');
            setCustomEntityDialogOpen(true);
        } else {
            updateAdaptor(index, 'elecEntity', newValue);
        }
    };

    const handleSaveCustomEntity = () => {
        if (pendingAdaptorIndex !== null && tempCustomEntity.trim() !== "") {
            updateAdaptor(pendingAdaptorIndex, 'elecEntity', tempCustomEntity.trim());
        }
        setCustomEntityDialogOpen(false);
        setPendingAdaptorIndex(null);
    };

    // --- Tab Label Logic ---
    const getTabLabel = (a) => {
        const chemStr = `${a.chemMol || '?'}@${a.chemMesh || '?'}`;
        const elecStr = `${a.elecEntity || '?'}.${a.elecField}`;
        return a.direction === 'chemToElec' 
            ? `${chemStr} -> ${elecStr}`
            : `${elecStr} -> ${chemStr}`;
    };

    // --- Save/Refresh Logic ---
    useEffect(() => {
        const getAdaptorDataForUnmount = () => {
            return adaptorsRef.current.map(a => {
                const chemPath = (a.chemMesh && a.chemMol) ? `${a.chemMesh}/${a.chemMol}` : '';
                const elecPath = a.elecEntity;

                if (!chemPath || !elecPath) return null;

                const baselineNum = parseFloat(a.baseline);
                const slopeNum = parseFloat(a.slope);
                if (isNaN(baselineNum) || isNaN(slopeNum)) return null;

                const baseObj = {
                    baseline: baselineNum,
                    slope: slopeNum,
                };

                if (a.direction === 'chemToElec') {
                    baseObj.source = chemPath;
                    baseObj.sourceField = a.chemField;
                    baseObj.dest = elecPath;
                    baseObj.destField = a.elecField;
                } else {
                    baseObj.source = elecPath;
                    baseObj.sourceField = a.elecField;
                    baseObj.dest = chemPath;
                    baseObj.destField = a.chemField;
                }
                return baseObj;
            }).filter(item => item !== null);
        };

        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getAdaptorDataForUnmount();
                onConfigurationChangeRef.current({ adaptors: configData });
            }
        };
    }, []);

    // --- Render Helpers ---
    const renderChemicalSection = () => (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <HelpField 
                    id="chemMesh" 
                    label="Chem Compartment" 
                    select 
                    value={activeAdaptorData.chemMesh} 
                    onChange={(id, v) => updateAdaptor(activeAdaptor, id, v)} 
                    helptext="Select the chemical compartment mesh."
                >
                    <MenuItem value=""><em>Select...</em></MenuItem>
                    {chemCompartmentOptions.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </HelpField>
            </Grid>
            <Grid item xs={12}>
                <HelpField 
                    id="chemMol" 
                    label="Molecule Name" 
                    select 
                    value={activeAdaptorData.chemMol} 
                    onChange={(id, v) => updateAdaptor(activeAdaptor, id, v)} 
                    helptext="Select the molecule."
                    disabled={!activeAdaptorData.chemMesh}
                >
                     <MenuItem value=""><em>{activeAdaptorData.chemMesh ? "Select..." : "Select compartment first"}</em></MenuItem>
                    {moleculeOptions.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </HelpField>
            </Grid>
            <Grid item xs={12}>
                <HelpField 
                    id="chemField" 
                    label="Field" 
                    select 
                    value={activeAdaptorData.chemField} 
                    onChange={(id, v) => updateAdaptor(activeAdaptor, id, v)} 
                    helptext="Select the chemical field."
                >
                    {chemFields.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </HelpField>
            </Grid>
        </Grid>
    );

    const renderElectricalSection = () => (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <HelpField 
                    id="elecEntity" 
                    label="Electrical Entity" 
                    select 
                    value={activeAdaptorData.elecEntity} 
                    onChange={(id, v) => handleEntityChange(activeAdaptor, v)} 
                    helptext="Select '.' for compartment or a channel prototype."
                >
                    <MenuItem value=".">.</MenuItem>
                    <ListSubheader>Channels</ListSubheader>
                    {channelPrototypes.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    <Divider />
                    <MenuItem value={OPTION_USER_SPECIFIED}>{OPTION_USER_SPECIFIED}</MenuItem>
                </HelpField>
            </Grid>
            <Grid item xs={12}>
                 <HelpField 
                    id="elecField" 
                    label="Field" 
                    select 
                    value={activeAdaptorData.elecField} 
                    onChange={(id, v) => updateAdaptor(activeAdaptor, id, v)} 
                    helptext="Select the electrical field."
                >
                    {(activeAdaptorData.elecEntity === '.' ? elecFieldsCompt : elecFieldsChan).map(f => (
                        <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                </HelpField>
            </Grid>
        </Grid>
    );

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Adaptors Configuration</Typography>
                <Tooltip title={helpText.main} placement="right">
                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
            </Box>

             <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                <Tabs value={activeAdaptor} onChange={(e, nv) => setActiveAdaptor(nv)} variant="scrollable" scrollButtons="auto">
                    {adaptors.map((adaptor, index) => (
                        <Tab key={index} label={getTabLabel(adaptor)} />
                    ))}
                     <IconButton onClick={addAdaptor} sx={{ alignSelf: 'center', ml: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>

             {activeAdaptorData && (
                 <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    
                    {/* 2. Stacked Layout with Vertical Flip Logic */}
                    <Grid container spacing={2}>
                        
                        {/* Source Section (Top) */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main', textAlign: 'left' }}>
                                Source: {activeAdaptorData.direction === 'chemToElec' ? 'Chemical' : 'Electrical'}
                            </Typography>
                            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                                {activeAdaptorData.direction === 'chemToElec' 
                                    ? renderChemicalSection() 
                                    : renderElectricalSection()
                                }
                            </Box>
                        </Grid>

                        {/* Flip Button (Middle) */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                             <Tooltip title="Swap Direction (Vertical)">
                                <IconButton 
                                    onClick={toggleDirection} 
                                    color="primary" 
                                    sx={{ border: '1px solid', borderColor: 'divider' }}
                                >
                                    <SwapVertIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>

                        {/* Destination Section (Bottom) */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main', textAlign: 'left' }}>
                                Destination: {activeAdaptorData.direction === 'chemToElec' ? 'Electrical' : 'Chemical'}
                            </Typography>
                            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                                {activeAdaptorData.direction === 'chemToElec' 
                                    ? renderElectricalSection() 
                                    : renderChemicalSection()
                                }
                            </Box>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 3 }} /></Grid>

                    {/* 4. Mapping Section */}
                     <Grid item xs={12}>
                         <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Mapping</Typography>
                         <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <HelpField 
                                    id="baseline" 
                                    label="Baseline" 
                                    required 
                                    type="number" 
                                    value={activeAdaptorData.baseline} 
                                    onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} 
                                    helptext={helpText.fields.baseline} 
                                    InputProps={{ inputProps: { step: 0.1 } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <HelpField 
                                    id="slope" 
                                    label="Slope" 
                                    required 
                                    type="number" 
                                    value={activeAdaptorData.slope} 
                                    onChange={(id,v) => updateAdaptor(activeAdaptor, id, v)} 
                                    helptext={helpText.fields.slope} 
                                    InputProps={{ inputProps: { step: 0.1 } }}
                                />
                            </Grid>
                         </Grid>
                     </Grid>

                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeAdaptor(activeAdaptor)} sx={{ mt: 3 }}>
                         Remove Adaptor
                     </Button>
                 </Box>
            )}
             {adaptors.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No adaptors defined.</Typography>}

            {/* Dialog for User Specified Entity */}
            <Dialog open={customEntityDialogOpen} onClose={() => setCustomEntityDialogOpen(false)}>
                <DialogTitle>Enter Custom Electrical Entity</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="customEntity"
                        label="Entity Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={tempCustomEntity}
                        onChange={(e) => setTempCustomEntity(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomEntityDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveCustomEntity}>Set Entity</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdaptorsMenuBox;
