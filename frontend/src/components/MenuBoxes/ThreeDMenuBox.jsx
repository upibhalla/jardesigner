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
    Divider,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper to safely convert value to string, handling potential null/undefined
const safeToString = (value, defaultValue = '') => {
    // Check for null or undefined explicitly
    if (value === undefined || value === null) {
        return defaultValue;
    }
    // Convert other types to string
    return String(value);
};


// Field Options (Matches schema fieldEnum)
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea',
];

// Colormap options
const colormapOptions = ['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'jet', 'gray', 'cool', 'hot', 'bwr'];

// Default state creators
const createDefaultMoogliEntry = () => ({
    path: '',
    field: fieldOptions[0], // Use first field option as default
    relativePath: '.',
    title: '',
    diameterScale: '1.0',
    dt: '0.1',
    min: '0', // Add default min
    max: '0', // Add default max
});
const createDefaultGlobalSettings = () => ({
    runtime: '0.3', rotation: '0.006283', azimuth: '0.0', elevation: '0.0',
    mergeDisplays: false, fullScreen: false, colormap: 'jet', background: 'default',
    center: '[0,0,0]', block: true,
});

// Accept currentConfig prop: { moogli: [], displayMoogli: {} }
const ThreeDMenuBox = ({ onConfigurationChange, currentConfig }) => {

    // --- Initialize state from props using useState initializer ---
    const [tabs, setTabs] = useState(() => {
        console.log("ThreeDMenuBox: Initializing tabs (moogli) from props", currentConfig?.moogli);
        const defaults = createDefaultMoogliEntry(); // Get defaults
        const initialTabs = currentConfig?.moogli?.map(m => ({
            path: m.path || '',
            field: m.field || fieldOptions[0], // Use default field if missing
            relativePath: m.relpath || '.', // Map schema key
            title: m.title || '',
            diameterScale: safeToString(m.diaScale, defaults.diameterScale), // Map schema key
            dt: safeToString(m.dt, defaults.dt),
            // Initialize min/max from ymin/ymax, converting to string, using default '0' if absent/invalid
            min: safeToString(m.ymin, defaults.min),
            max: safeToString(m.ymax, defaults.max),
        })) || [];
        return initialTabs.length > 0 ? initialTabs : [createDefaultMoogliEntry()];
    });

    const [globalSettings, setGlobalSettings] = useState(() => {
        console.log("ThreeDMenuBox: Initializing globalSettings (displayMoogli) from props", currentConfig?.displayMoogli);
        const initialDisplay = currentConfig?.displayMoogli || {};
        const defaults = createDefaultGlobalSettings();
        return {
            runtime: safeToString(initialDisplay.runtime, defaults.runtime),
            rotation: safeToString(initialDisplay.rotation, defaults.rotation),
            azimuth: safeToString(initialDisplay.azim, defaults.azimuth), // Map schema key
            elevation: safeToString(initialDisplay.elev, defaults.elevation), // Map schema key
            mergeDisplays: initialDisplay.mergeDisplays ?? defaults.mergeDisplays,
            fullScreen: initialDisplay.fullscreen ?? defaults.fullScreen, // Map schema key
            colormap: initialDisplay.colormap || defaults.colormap,
            background: initialDisplay.bg || defaults.background, // Map schema key
            // Convert center array back to JSON string for TextField
            center: JSON.stringify(initialDisplay.center || JSON.parse(defaults.center)), // Ensure default is parsed if needed
            block: initialDisplay.block ?? defaults.block,
        };
    });

    const [activeTab, setActiveTab] = useState(0);
    // --- END Initialization ---


    // Refs for cleanup function
    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const tabsRef = useRef(tabs);
    useEffect(() => { tabsRef.current = tabs; }, [tabs]);
    const globalSettingsRef = useRef(globalSettings);
    useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);


    // --- Handlers ONLY update LOCAL state ---
    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createDefaultMoogliEntry()]);
        setActiveTab(tabsRef.current.length); // Use ref
    }, []);

    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveTab((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateTab = useCallback((index, key, value) => {
        console.log(`ThreeDMenuBox Tab: Local state change - Index ${index}, Key ${key}: ${value}`);
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) =>
                i === index ? { ...tab, [key]: value } : tab
            )
        );
    }, []);

    const updateGlobalSetting = useCallback((key, value) => {
        const actualValue = (typeof value === 'boolean') ? value : value;
        console.log(`ThreeDMenuBox Global: Local state change - Key ${key}: ${actualValue}`);
        setGlobalSettings((prev) => ({ ...prev, [key]: actualValue }));
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    // --- END Handlers ---


    // --- Function to format local state for pushing up (used on unmount) ---
    const getThreeDDataForUnmount = () => {
        const currentTabs = tabsRef.current;
        const currentGlobalSettings = globalSettingsRef.current;
        console.log("ThreeDMenuBox: Formatting final local state for push:", { tabs: currentTabs, globalSettings: currentGlobalSettings });

        // Format moogli array
        const moogliData = currentTabs.map(tabState => {
            if (!tabState.path || !tabState.field) return null; // Validation
            const diaScaleNum = parseFloat(tabState.diameterScale);
            const dtNum = parseFloat(tabState.dt);
            const minNum = parseFloat(tabState.min); // Parse min
            const maxNum = parseFloat(tabState.max); // Parse max
            const defaults = createDefaultMoogliEntry(); // Get defaults for comparison

            // Base object with required fields
            const moogliSchemaItem = {
                path: tabState.path,
                field: tabState.field,
            };

            // Add optional fields only if they are valid and different from default
            if (tabState.relativePath && tabState.relativePath !== defaults.relativePath) {
                moogliSchemaItem.relpath = tabState.relativePath;
            }
            if (tabState.title) {
                moogliSchemaItem.title = tabState.title;
            }
            if (!isNaN(diaScaleNum) && safeToString(diaScaleNum) !== defaults.diameterScale) {
                moogliSchemaItem.diaScale = diaScaleNum;
            }
            if (!isNaN(dtNum) && safeToString(dtNum) !== defaults.dt) {
                moogliSchemaItem.dt = dtNum;
            }
            // Add ymin only if it's a valid number and not the default '0'
            if (!isNaN(minNum) && safeToString(minNum) !== defaults.min) {
                moogliSchemaItem.ymin = minNum;
            }
            // Add ymax only if it's a valid number and not the default '0'
            if (!isNaN(maxNum) && safeToString(maxNum) !== defaults.max) {
                moogliSchemaItem.ymax = maxNum;
            }

             return moogliSchemaItem;
        }).filter(item => item !== null);

        // Format displayMoogli object
        let centerArray = JSON.parse(createDefaultGlobalSettings().center); // Default center
        try {
            const parsedCenter = JSON.parse(currentGlobalSettings.center);
            if (Array.isArray(parsedCenter) && parsedCenter.length === 3 && parsedCenter.every(n => typeof n === 'number')) {
                centerArray = parsedCenter;
            } else {
                 console.warn("Invalid format for Center coordinates, using default [0,0,0]. Input:", currentGlobalSettings.center);
            }
        } catch (e) {
            console.warn("Error parsing Center coordinates, using default [0,0,0]. Input:", currentGlobalSettings.center, "Error:", e);
        }

        const defaultsGlobal = createDefaultGlobalSettings(); // Get defaults for comparison
        const displayMoogliData = {
            // Required or always included fields
            runtime: parseFloat(currentGlobalSettings.runtime) || 0,
            rotation: parseFloat(currentGlobalSettings.rotation) || 0,
            azim: parseFloat(currentGlobalSettings.azimuth) || 0, // Map key
            elev: parseFloat(currentGlobalSettings.elevation) || 0, // Map key
            colormap: currentGlobalSettings.colormap || defaultsGlobal.colormap,
            bg: currentGlobalSettings.background || defaultsGlobal.background, // Map key
            center: centerArray,
            block: currentGlobalSettings.block,
            // Optional: only include if non-default
            ...(currentGlobalSettings.mergeDisplays !== defaultsGlobal.mergeDisplays && { mergeDisplays: currentGlobalSettings.mergeDisplays }),
            ...(currentGlobalSettings.fullScreen !== defaultsGlobal.fullScreen && { fullscreen: currentGlobalSettings.fullScreen }), // Map key
        };

        return { moogli: moogliData, displayMoogli: displayMoogliData };
    };


    // --- useEffect hook to push changes up ON UNMOUNT ---
    useEffect(() => {
        console.log("ThreeDMenuBox: Mounted, setting up unmount cleanup.");
        // Store the initial config stringified to compare on unmount
        const initialConfigString = JSON.stringify({
             moogli: currentConfig?.moogli || [],
             displayMoogli: currentConfig?.displayMoogli || {}
        });

        return () => {
            const latestOnConfigurationChange = onConfigurationChangeRef.current;
            if (latestOnConfigurationChange) {
                console.log("ThreeDMenuBox: Unmounting, checking for changes before push.");
                const finalConfigData = getThreeDDataForUnmount();
                const finalConfigString = JSON.stringify(finalConfigData);

                // Only push if the data has actually changed from initial load
                if (finalConfigString !== initialConfigString) {
                    console.log("ThreeDMenuBox: Changes detected, pushing final state up.");
                    latestOnConfigurationChange(finalConfigData); // Push object with both keys
                } else {
                    console.log("ThreeDMenuBox: No changes detected, skipping push on unmount.");
                }
            } else {
                console.warn("ThreeDMenuBox: onConfigurationChange not available on unmount.");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // IMPORTANT: Empty dependency array


    // --- JSX Rendering (uses local state) ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>3D Visualization (Moogli)</Typography>

            {/* === Moogli Array Section (Tabs) === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Data Sources</Typography>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" aria-label="Moogli data sources">
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={`${tab.field || 'New'} @ ${tab.path || '?'}`} />
                     ))}
                     <IconButton onClick={addTab} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>
             {tabs.length > 0 && activeTab >= 0 && activeTab < tabs.length && tabs[activeTab] && (
                 <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                     <Grid container spacing={1.5}>
                          {/* Row 1: Path, Field */}
                         <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Path" required value={tabs[activeTab].path}
                                 onChange={(e) => updateTab(activeTab, 'path', e.target.value)} />
                         </Grid>
                         <Grid item xs={12} sm={6}>
                             <TextField select fullWidth size="small" label="Field" required value={tabs[activeTab].field}
                                 onChange={(e) => updateTab(activeTab, 'field', e.target.value)}>
                                 <MenuItem value=""><em>Select Field...</em></MenuItem>
                                 {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                             </TextField>
                         </Grid>
                          {/* Row 2: RelPath, Title */}
                         <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Relative Path (Optional)" value={tabs[activeTab].relativePath}
                                 onChange={(e) => updateTab(activeTab, 'relativePath', e.target.value)} />
                         </Grid>
                          <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Title (Optional)" value={tabs[activeTab].title}
                                 onChange={(e) => updateTab(activeTab, 'title', e.target.value)} />
                         </Grid>
                         {/* --- ADDED Row 3: Min, Max --- */}
                         <Grid item xs={12} sm={6}>
                             <TextField
                                 fullWidth
                                 size="small"
                                 label="Min (ymin)"
                                 type="number"
                                 value={tabs[activeTab].min}
                                 onChange={(e) => updateTab(activeTab, 'min', e.target.value)}
                                 InputProps={{ inputProps: { step: 'any' } }} // Allow floats
                                 helperText="Optional (Default: 0)"
                             />
                         </Grid>
                          <Grid item xs={12} sm={6}>
                             <TextField
                                 fullWidth
                                 size="small"
                                 label="Max (ymax)"
                                 type="number"
                                 value={tabs[activeTab].max}
                                 onChange={(e) => updateTab(activeTab, 'max', e.target.value)}
                                 InputProps={{ inputProps: { step: 'any' } }} // Allow floats
                                 helperText="Optional (Default: 0)"
                             />
                         </Grid>
                         {/* Row 4 (was 3): DiaScale, Dt */}
                           <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Diameter Scale (Optional)" type="number" value={tabs[activeTab].diameterScale}
                                 onChange={(e) => updateTab(activeTab, 'diameterScale', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }}/>
                         </Grid>
                           <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="dt (Update Interval, Optional)" type="number" value={tabs[activeTab].dt}
                                 onChange={(e) => updateTab(activeTab, 'dt', e.target.value)} InputProps={{ inputProps: { min: 1e-5, step: 0.01 } }}/>
                         </Grid>
                     </Grid>
                     <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeTab(activeTab)} sx={{ marginTop: '16px' }}>
                         Remove Data Source {activeTab + 1}
                     </Button>
                 </Box>
            )}
            {tabs.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No 3D data sources defined.</Typography>}


            {/* === displayMoogli Object Section (Global Settings) === */}
            <Divider style={{ margin: '24px 0' }} />
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Global Display Settings</Typography>
            <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <Grid container spacing={1.5}>
                     <Grid item xs={6} sm={4}>
                         <TextField fullWidth size="small" label="Runtime (s)" type="number" InputProps={{ inputProps: { min: 1e-3, step: 0.1 } }}
                             value={globalSettings.runtime} onChange={(e) => updateGlobalSetting('runtime', e.target.value)} />
                     </Grid>
                     <Grid item xs={6} sm={4}>
                         <TextField fullWidth size="small" label="Rotation (rad/step)" type="number" InputProps={{ inputProps: { step: 0.001 } }}
                             value={globalSettings.rotation} onChange={(e) => updateGlobalSetting('rotation', e.target.value)} />
                     </Grid>
                     <Grid item xs={6} sm={4}>
                         <TextField fullWidth size="small" label="Azimuth (azim)" type="number" InputProps={{ inputProps: { step: 0.1 } }}
                             value={globalSettings.azimuth} onChange={(e) => updateGlobalSetting('azimuth', e.target.value)} />
                     </Grid>
                     <Grid item xs={6} sm={4}>
                         <TextField fullWidth size="small" label="Elevation (elev)" type="number" InputProps={{ inputProps: { step: 0.1 } }}
                             value={globalSettings.elevation} onChange={(e) => updateGlobalSetting('elevation', e.target.value)} />
                     </Grid>
                     <Grid item xs={6} sm={4}>
                         <TextField select fullWidth size="small" label="Colormap" value={globalSettings.colormap}
                             onChange={(e) => updateGlobalSetting('colormap', e.target.value)}>
                             {colormapOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                         </TextField>
                     </Grid>
                     <Grid item xs={6} sm={4}>
                         <TextField fullWidth size="small" label="Background (bg)" value={globalSettings.background}
                             onChange={(e) => updateGlobalSetting('background', e.target.value)} helperText="e.g., default, white, black"/>
                     </Grid>
                     <Grid item xs={12} sm={8}>
                          <TextField fullWidth size="small" label="Center [x,y,z] (JSON array)" value={globalSettings.center}
                             onChange={(e) => updateGlobalSetting('center', e.target.value)}
                             placeholder="e.g., [1.5e-5, 0, -2e-5]" />
                     </Grid>
                     <Grid item xs={12} sm={4} container direction="column" >
                        <FormControlLabel control={ <Checkbox checked={Boolean(globalSettings.mergeDisplays)} onChange={(e) => updateGlobalSetting('mergeDisplays', e.target.checked)} />} label="Merge Displays"/>
                        <FormControlLabel control={ <Checkbox checked={Boolean(globalSettings.fullScreen)} onChange={(e) => updateGlobalSetting('fullScreen', e.target.checked)} />} label="Fullscreen"/>
                        <FormControlLabel control={ <Checkbox checked={Boolean(globalSettings.block)} onChange={(e) => updateGlobalSetting('block', e.target.checked)} />} label="Block Thread"/>
                     </Grid>
                 </Grid>
            </Box>
        </Box>
    );
};

export default ThreeDMenuBox;

