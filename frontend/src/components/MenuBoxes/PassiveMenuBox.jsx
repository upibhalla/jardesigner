import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton, // Keep for AddIcon
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper to safely convert value to string
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};


// Default state for a new passive distribution entry in the component
const createDefaultPassiveEntry = () => ({
    path: 'soma',
    leakReversalPotential: '-65', // State stores in mV
    initialPotential: '-65', // State stores in mV
    membraneCapacitance: '0.01', // F/m^2
    membraneResistivity: '1.0', // Ohm.m^2
    axialResistivity: '1.0', // Ohm.m
});


// Accept currentConfig prop (should be jsonData.passiveDistrib array)
const PassiveMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [tabs, setTabs] = useState(() => {
        console.log("PassiveMenuBox: Initializing tabs from props", currentConfig);
        const initialTabs = currentConfig?.map(p => ({
            path: p.path || '',
            // Convert V (schema) back to mV string (state)
            leakReversalPotential: safeToString(p.Em * 1000, createDefaultPassiveEntry().leakReversalPotential),
            initialPotential: safeToString(p.initVm * 1000, createDefaultPassiveEntry().initialPotential),
            // Convert numbers back to strings
            membraneCapacitance: safeToString(p.CM, createDefaultPassiveEntry().membraneCapacitance),
            membraneResistivity: safeToString(p.RM, createDefaultPassiveEntry().membraneResistivity),
            axialResistivity: safeToString(p.RA, createDefaultPassiveEntry().axialResistivity),
        })) || [];
        // Ensure there's at least one entry to start with
        return initialTabs.length > 0 ? initialTabs : [createDefaultPassiveEntry()];
    });
    const [activeTab, setActiveTab] = useState(0);
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const tabsRef = useRef(tabs);
    useEffect(() => { tabsRef.current = tabs; }, [tabs]);


    // --- Handlers ONLY update LOCAL state ---
    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createDefaultPassiveEntry()]);
        setActiveTab(tabsRef.current.length); // Use ref for correct length before state update
    }, []); // No dependency needed

    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveTab((prevActive) => {
            if (prevActive === indexToRemove) {
                return Math.max(0, prevActive - 1);
            } else if (prevActive > indexToRemove) {
                return prevActive - 1;
            }
            return prevActive;
        });
    }, []); // No dependency needed

    const updateTab = useCallback((index, key, value) => {
        console.log(`PassiveMenuBox: Local state change - Index ${index}, Key ${key}: ${value}`);
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) =>
                i === index ? { ...tab, [key]: value } : tab
            )
        );
    }, []); // No dependency needed

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getPassiveDataForUnmount = () => {
        const currentTabs = tabsRef.current; // Use ref for latest state
        console.log("PassiveMenuBox: Formatting final local state for push:", currentTabs);

        return currentTabs.map(tabState => {
            // Basic validation
            if (!tabState.path) {
                console.warn("Skipping passive entry due to missing path:", tabState);
                return null;
            }
            // Convert state values (strings, mV) back to schema format (numbers, V)
            const Em_V = parseFloat(tabState.leakReversalPotential) / 1000;
            const initVm_V = parseFloat(tabState.initialPotential) / 1000;
            const CM_F_m2 = parseFloat(tabState.membraneCapacitance);
            const RM_Ohm_m2 = parseFloat(tabState.membraneResistivity);
            const RA_Ohm_m = parseFloat(tabState.axialResistivity);

            // Fallback to schema defaults if parsing results in NaN
            const defaultSchemaValues = { Em: -0.065, initVm: -0.065, CM: 0.01, RM: 1.0, RA: 1.0 };

            return {
                path: tabState.path,
                Em: isNaN(Em_V) ? defaultSchemaValues.Em : Em_V,
                initVm: isNaN(initVm_V) ? defaultSchemaValues.initVm : initVm_V,
                CM: isNaN(CM_F_m2) ? defaultSchemaValues.CM : CM_F_m2,
                RM: isNaN(RM_Ohm_m2) ? defaultSchemaValues.RM : RM_Ohm_m2,
                RA: isNaN(RA_Ohm_m) ? defaultSchemaValues.RA : RA_Ohm_m,
            };
        }).filter(item => item !== null); // Filter out invalid entries
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("PassiveMenuBox: Mounted, setting up unmount cleanup.");
        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("PassiveMenuBox: Unmounting, pushing final state up.");
                const configData = getPassiveDataForUnmount();
                latestOnConfigurationChange({ passiveDistrib: configData }); // Pass array under 'passiveDistrib' key
            } else {
                console.warn("PassiveMenuBox: onConfigurationChange not available on unmount.");
            }
        };
    }, []); // IMPORTANT: Empty dependency array
    // --- END Unmount Effect ---


    // --- JSX Rendering (uses local state) ---
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
                        <Tab key={index} label={tab.path || `Entry ${index + 1}`} />
                    ))}
                    {/* Use Button for consistency */}
                    <Button onClick={addTab} startIcon={<AddIcon />} sx={{ minWidth: 'auto', padding: '6px 8px', marginLeft: '10px', alignSelf: 'center' }}>
                        Add Entry
                    </Button>
                </Tabs>
            </Box>

            {/* Tab Content */}
            {tabs.length > 0 && activeTab < tabs.length && tabs[activeTab] && (
                <Box style={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={1.5}> {/* Reduced spacing */}
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" label="Path (e.g., soma, dend)" required
                                value={tabs[activeTab].path} onChange={(e) => updateTab(activeTab, 'path', e.target.value)} sx={{ mb: 1 }}/>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="Em (Leak Reversal, mV)" type="number" required
                                value={tabs[activeTab].leakReversalPotential} onChange={(e) => updateTab(activeTab, 'leakReversalPotential', e.target.value)} sx={{ mb: 1 }}/>
                        </Grid>
                        <Grid item xs={6}>
                             <TextField fullWidth size="small" label="initVm (Initial Vm, mV)" type="number" required
                                value={tabs[activeTab].initialPotential} onChange={(e) => updateTab(activeTab, 'initialPotential', e.target.value)} sx={{ mb: 1 }}/>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField fullWidth size="small" label="CM (F/m^2)" type="number" required
                                value={tabs[activeTab].membraneCapacitance} onChange={(e) => updateTab(activeTab, 'membraneCapacitance', e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField fullWidth size="small" label="RM (Ohm.m^2)" type="number" required
                                value={tabs[activeTab].membraneResistivity} onChange={(e) => updateTab(activeTab, 'membraneResistivity', e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField fullWidth size="small" label="RA (Ohm.m)" type="number" required
                                value={tabs[activeTab].axialResistivity} onChange={(e) => updateTab(activeTab, 'axialResistivity', e.target.value)} />
                        </Grid>
                    </Grid>

                    {/* Remove Tab Button */}
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<DeleteIcon />}
                        onClick={() => removeTab(activeTab)}
                        sx={{ marginTop: '16px' }}
                        // disabled={tabs.length <= 1} // Optional
                    >
                        Remove Entry '{tabs[activeTab].path || activeTab + 1}'
                    </Button>
                </Box>
            )}
             {tabs.length === 0 && (
                 <Typography sx={{marginTop: 2}}>No passive distribution entries defined. Click 'Add Entry' to begin.</Typography>
             )}
        </Box>
    );
};

export default PassiveMenuBox;
