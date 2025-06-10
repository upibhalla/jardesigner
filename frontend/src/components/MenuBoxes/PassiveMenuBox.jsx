import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton,
    Button,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './PassiveMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default state for a new passive distribution entry ---
const createDefaultPassiveEntry = () => ({
    path: 'soma',
    leakReversalPotential: '-65', // State stores in mV
    initialPotential: '-65', // State stores in mV
    membraneCapacitance: '0.01', // F/m^2
    membraneResistivity: '1.0', // Ohm.m^2
    axialResistivity: '1.0', // Ohm.m
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
const PassiveMenuBox = ({ onConfigurationChange, currentConfig }) => {
    const [tabs, setTabs] = useState(() => {
        const initialTabs = currentConfig?.map(p => ({
            path: p.path || '',
            leakReversalPotential: formatFloat(p.Em * 1000) || createDefaultPassiveEntry().leakReversalPotential,
            initialPotential: formatFloat(p.initVm * 1000) || createDefaultPassiveEntry().initialPotential,
            membraneCapacitance: formatFloat(p.CM) || createDefaultPassiveEntry().membraneCapacitance,
            membraneResistivity: formatFloat(p.RM) || createDefaultPassiveEntry().membraneResistivity,
            axialResistivity: formatFloat(p.RA) || createDefaultPassiveEntry().axialResistivity,
        })) || [];
        return initialTabs.length > 0 ? initialTabs : [createDefaultPassiveEntry()];
    });
    const [activeTab, setActiveTab] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const tabsRef = useRef(tabs);
    useEffect(() => { tabsRef.current = tabs; }, [tabs]);

    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createDefaultPassiveEntry()]);
        setActiveTab(tabsRef.current.length);
    }, []);

    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveTab((prevActive) => {
            if (prevActive === indexToRemove) return Math.max(0, prevActive - 1);
            if (prevActive > indexToRemove) return prevActive - 1;
            return prevActive;
        });
    }, []);

    const updateTab = useCallback((index, key, value) => {
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) =>
                i === index ? { ...tab, [key]: value } : tab
            )
        );
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    useEffect(() => {
        const getPassiveDataForUnmount = () => {
            return tabsRef.current.map(tabState => {
                if (!tabState.path) return null;
                const defaultSchemaValues = { Em: -0.065, initVm: -0.065, CM: 0.01, RM: 1.0, RA: 1.0 };
                const Em_V = parseFloat(tabState.leakReversalPotential) / 1000;
                const initVm_V = parseFloat(tabState.initialPotential) / 1000;
                const CM_F_m2 = parseFloat(tabState.membraneCapacitance);
                const RM_Ohm_m2 = parseFloat(tabState.membraneResistivity);
                const RA_Ohm_m = parseFloat(tabState.axialResistivity);
                return {
                    path: tabState.path,
                    Em: isNaN(Em_V) ? defaultSchemaValues.Em : Em_V,
                    initVm: isNaN(initVm_V) ? defaultSchemaValues.initVm : initVm_V,
                    CM: isNaN(CM_F_m2) ? defaultSchemaValues.CM : CM_F_m2,
                    RM: isNaN(RM_Ohm_m2) ? defaultSchemaValues.RM : RM_Ohm_m2,
                    RA: isNaN(RA_Ohm_m) ? defaultSchemaValues.RA : RA_Ohm_m,
                };
            }).filter(item => item !== null);
        };

        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getPassiveDataForUnmount();
                onConfigurationChangeRef.current({ passiveDistrib: configData });
            }
        };
    }, []);

    const activeTabData = tabs[activeTab];

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Passive Distribution</Typography>
                <Tooltip title={helpText.main} placement="right">
                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.path || `Entry ${index + 1}`} />
                    ))}
                    <Button onClick={addTab} startIcon={<AddIcon />} sx={{ minWidth: 'auto', p: '6px 8px', ml: '10px', alignSelf: 'center' }}>
                        Add Entry
                    </Button>
                </Tabs>
            </Box>

            {activeTabData && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <HelpField id="path" label="Path (e.g., soma, dend)" required value={activeTabData.path} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.fields.path} />
                        </Grid>
                        <Grid item xs={6}>
                            <HelpField id="leakReversalPotential" label="Em (Leak Reversal, mV)" type="number" required value={activeTabData.leakReversalPotential} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.fields.leakReversalPotential} />
                        </Grid>
                        <Grid item xs={6}>
                             <HelpField id="initialPotential" label="initVm (Initial Vm, mV)" type="number" required value={activeTabData.initialPotential} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.fields.initialPotential} />
                        </Grid>
                        <Grid item xs={4}>
                            <HelpField id="membraneCapacitance" label="CM (F/m^2)" type="number" required value={activeTabData.membraneCapacitance} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.fields.membraneCapacitance} />
                        </Grid>
                        <Grid item xs={4}>
                            <HelpField id="membraneResistivity" label="RM (Ohm.m^2)" type="number" required value={activeTabData.membraneResistivity} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.fields.membraneResistivity} />
                        </Grid>
                        <Grid item xs={4}>
                            <HelpField id="axialResistivity" label="RA (Ohm.m)" type="number" required value={activeTabData.axialResistivity} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.fields.axialResistivity} />
                        </Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeTab(activeTab)} sx={{ mt: 2 }}>
                        Remove Entry '{activeTabData.path || activeTab + 1}'
                    </Button>
                </Box>
            )}
            {tabs.length === 0 && (
                 <Typography sx={{mt: 2, fontStyle: 'italic'}}>No passive distribution entries defined. Click 'Add Entry' to begin.</Typography>
             )}
        </Box>
    );
};

export default PassiveMenuBox;
