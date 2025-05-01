import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; // For clarity on the remove button

// Initial state for a new passive distribution entry
const createNewPassiveEntry = () => ({
    path: 'soma', // Default path
    leakReversalPotential: '-65', // State stores in mV
    initialPotential: '-65', // State stores in mV
    membraneCapacitance: '0.01', // F/m^2
    membraneResistivity: '1.0', // Ohm.m^2
    axialResistivity: '1.0', // Ohm.m
});

const PassiveMenuBox = ({ onConfigurationChange }) => { // Accept prop
    // Initialize with one default entry
    const [tabs, setTabs] = useState([createNewPassiveEntry()]);
    const [activeTab, setActiveTab] = useState(0);

    // Handle adding a new tab/entry
    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createNewPassiveEntry()]);
        setActiveTab(tabs.length); // Use tabs.length before state update
    }, [tabs.length]); // Depend on length to get the correct index

    // Handle removing a tab/entry
    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        // Adjust activeTab carefully
        setActiveTab((prevActive) => {
            if (prevActive === indexToRemove) {
                // If removing the active tab, move to the previous one (or 0 if it was the first)
                return Math.max(0, prevActive - 1);
            } else if (prevActive > indexToRemove) {
                // If removing a tab before the active one, shift active index down
                return prevActive - 1;
            }
            // Otherwise, keep the active tab index
            return prevActive;
        });
    }, []); // No dependencies needed here as it uses indexToRemove directly

    // Handle updating values within a specific tab/entry
    const updateTab = useCallback((index, key, value) => {
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) =>
                i === index ? { ...tab, [key]: value } : tab
            )
        );
        // Note: useEffect below handles calling onConfigurationChange
    }, []);

    // --- NEW: Function to format data for the schema ---
    const getPassiveData = useCallback(() => {
        return tabs.map(tabState => {
            // Convert state values (potentially strings, mV) to schema format (numbers, V)
            // Fallback to schema defaults if parsing fails
            const Em_V = parseFloat(tabState.leakReversalPotential) / 1000;
            const initVm_V = parseFloat(tabState.initialPotential) / 1000;
            const CM_F_m2 = parseFloat(tabState.membraneCapacitance);
            const RM_Ohm_m2 = parseFloat(tabState.membraneResistivity);
            const RA_Ohm_m = parseFloat(tabState.axialResistivity);

            return {
                path: tabState.path || "soma", // Required field
                // Schema fields mapped from state fields, with type conversion and defaults
                Em: isNaN(Em_V) ? -0.065 : Em_V,               // Convert mV to V, use schema default
                initVm: isNaN(initVm_V) ? -0.065 : initVm_V,   // Convert mV to V, use schema default
                CM: isNaN(CM_F_m2) ? 0.01 : CM_F_m2,           // Use schema default
                RM: isNaN(RM_Ohm_m2) ? 1.0 : RM_Ohm_m2,        // Use schema default
                RA: isNaN(RA_Ohm_m) ? 1.0 : RA_Ohm_m,          // Use schema default
            };
        });
    }, [tabs]); // Depends only on the tabs state

    // --- NEW: useEffect to call the prop when tabs state changes ---
    useEffect(() => {
        if (onConfigurationChange) {
            const passiveData = getPassiveData();
            onConfigurationChange({ passiveDistrib: passiveData });
        }
    }, [tabs, getPassiveData, onConfigurationChange]); // Dependencies
    // --- END NEW ---


    // Handle tab selection change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>
                Passive Distribution
            </Typography>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="Passive distribution entries"
                >
                    {tabs.map((tab, index) => (
                        // Use tab.path or index for label
                        <Tab key={index} label={tab.path || `Entry ${index + 1}`} />
                    ))}
                    <Button onClick={addTab} startIcon={<AddIcon />} sx={{ minWidth: 'auto', padding: '6px 8px', marginLeft: '10px', alignSelf: 'center' }}>
                        Add Entry
                    </Button>
                </Tabs>
            </Box>

            {/* Tab Content: Render only if there's an active tab */}
            {tabs.length > 0 && activeTab < tabs.length && tabs[activeTab] && (
                <Box style={{ marginTop: '16px' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" label="Path (e.g., soma, dend, /cell/dendrite_5/sec_2)"
                                value={tabs[activeTab].path} onChange={(e) => updateTab(activeTab, 'path', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}> {/* Use Grid for layout */}
                            <TextField fullWidth size="small" label="Em (Leak Reversal, mV)" type="number"
                                value={tabs[activeTab].leakReversalPotential} onChange={(e) => updateTab(activeTab, 'leakReversalPotential', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="initVm (Initial Vm, mV)" type="number"
                                value={tabs[activeTab].initialPotential} onChange={(e) => updateTab(activeTab, 'initialPotential', e.target.value)} />
                        </Grid>
                        <Grid item xs={4}> {/* Adjust grid sizing */}
                            <TextField fullWidth size="small" label="CM (Membrane Cap, F/m^2)" type="number"
                                value={tabs[activeTab].membraneCapacitance} onChange={(e) => updateTab(activeTab, 'membraneCapacitance', e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField fullWidth size="small" label="RM (Membrane Res, Ohm.m^2)" type="number"
                                value={tabs[activeTab].membraneResistivity} onChange={(e) => updateTab(activeTab, 'membraneResistivity', e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField fullWidth size="small" label="RA (Axial Res, Ohm.m)" type="number"
                                value={tabs[activeTab].axialResistivity} onChange={(e) => updateTab(activeTab, 'axialResistivity', e.target.value)} />
                        </Grid>
                    </Grid>

                    {/* Remove Tab Button */}
                     {tabs.length > 0 && ( // Only show remove if there are tabs
                        <Button
                            variant="outlined"
                            color="secondary" // More appropriate color for removal
                            startIcon={<DeleteIcon />}
                            onClick={() => removeTab(activeTab)}
                            style={{ marginTop: '16px' }}
                            // disabled={tabs.length <= 1} // Optional: prevent removing the last entry
                        >
                            Remove Entry '{tabs[activeTab].path || activeTab + 1}'
                        </Button>
                    )}
                </Box>
            )}
             {tabs.length === 0 && (
                 <Typography sx={{marginTop: 2}}>No passive distribution entries defined. Click 'Add Entry' to begin.</Typography>
             )}
        </Box>
    );
};

export default PassiveMenuBox;
