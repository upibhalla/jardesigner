import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import {
    Box,
    Tabs,
    Tab,
    Typography,
    TextField,
    Grid,
    IconButton, // Keep for AddIcon
    MenuItem,
    Button,
    Divider,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon

// Initial state for a new 3D plot entry (moogli array item)
const createNewMoogliEntry = () => ({
    path: '', // Required
    field: 'Vm', // Default field, Required
    relativePath: '.', // Default -> relpath
    title: '', // Optional
    diameterScale: '1.0', // Optional -> diaScale (number)
    dt: '0.1', // Optional -> dt (number)
});

// Initial state for global display settings (displayMoogli object)
const initialGlobalSettings = {
    runtime: '0.3', // number
    rotation: '0.006283', // number
    azimuth: '0.0', // number -> azim
    elevation: '0.0', // number -> elev
    mergeDisplays: false, // boolean
    fullScreen: false, // boolean -> fullscreen
    colormap: 'jet', // string
    background: 'default', // string -> bg
    center: '[0,0,0]', // string to be parsed to array[3] of numbers
    block: true, // boolean
};


const ThreeDMenuBox = ({ onConfigurationChange }) => { // Accept prop
    const [tabs, setTabs] = useState([createNewMoogliEntry()]); // State for moogli array
    const [activeTab, setActiveTab] = useState(0);

    // State for displayMoogli object
    const [globalSettings, setGlobalSettings] = useState(initialGlobalSettings);

    // Field Options (Matches schema fieldEnum)
    const fieldOptions = [
        'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
        'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
        'modulation', 'psdArea',
    ];

    // Colormap options (example, add more if needed)
    const colormapOptions = ['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'jet', 'gray', 'cool', 'hot', 'bwr'];


    // --- Handlers for moogli array ('tabs' state) ---
    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createNewMoogliEntry()]);
        setActiveTab(tabs.length);
    }, [tabs.length]);

    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveTab((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateTab = useCallback((index, key, value) => {
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) =>
                i === index ? { ...tab, [key]: value } : tab
            )
        );
    }, []);


    // --- Handlers for displayMoogli object ('globalSettings' state) ---
    const updateGlobalSetting = useCallback((key, value) => {
        // Handle checkbox boolean conversion explicitly
        const actualValue = (typeof value === 'boolean') ? value : value;
        setGlobalSettings((prev) => ({ ...prev, [key]: actualValue }));
    }, []);


    // --- NEW: Format Data for Schema ---
    const getThreeDData = useCallback(() => {
        // Format moogli array
        const moogliData = tabs.map(tabState => {
            // Basic validation
            if (!tabState.path || !tabState.field) {
                console.warn("Skipping 3D moogli entry due to missing path or field:", tabState);
                return null;
            }
            const diaScaleNum = parseFloat(tabState.diameterScale);
            const dtNum = parseFloat(tabState.dt);

            const moogliSchemaItem = {
                path: tabState.path,
                field: tabState.field,
                // Optional fields only included if non-default/non-empty
                ...(tabState.relativePath && tabState.relativePath !== '.' && { relpath: tabState.relativePath }), // Map key, check default
                ...(tabState.title && { title: tabState.title }),
                ...( (!isNaN(diaScaleNum) && diaScaleNum !== 1) && { diaScale: diaScaleNum }), // Map key, check default
                ...( (!isNaN(dtNum)) && { dt: dtNum }), // Include if valid number
                // ymin, ymax are in schema but not in component state
            };
             return moogliSchemaItem;
        }).filter(item => item !== null); // Filter out invalid entries


        // Format displayMoogli object
        let centerArray = [0, 0, 0]; // Default center
        try {
            const parsedCenter = JSON.parse(globalSettings.center);
            if (Array.isArray(parsedCenter) && parsedCenter.length === 3 && parsedCenter.every(n => typeof n === 'number')) {
                centerArray = parsedCenter;
            } else {
                 console.warn("Invalid format for Center coordinates, using default [0,0,0]. Input:", globalSettings.center);
            }
        } catch (e) {
            console.warn("Error parsing Center coordinates, using default [0,0,0]. Input:", globalSettings.center, "Error:", e);
        }

        const displayMoogliData = {
            // Map state keys to schema keys, perform type conversions
            runtime: parseFloat(globalSettings.runtime) || 0.3,
            rotation: parseFloat(globalSettings.rotation) || 0.006283,
            azim: parseFloat(globalSettings.azimuth) || 0, // Map key
            elev: parseFloat(globalSettings.elevation) || 0, // Map key
            mergeDisplays: globalSettings.mergeDisplays,
            fullscreen: globalSettings.fullScreen, // Map key
            colormap: globalSettings.colormap || 'jet',
            bg: globalSettings.background || 'default', // Map key
            center: centerArray,
            block: globalSettings.block,
            // dt, animation, movieFrame are in schema but not component state
        };

        // Only include non-default boolean values to keep JSON cleaner
        if (!displayMoogliData.mergeDisplays) delete displayMoogliData.mergeDisplays;
        if (!displayMoogliData.fullscreen) delete displayMoogliData.fullscreen;
        // Block defaults to true in component but false in schema? Check schema again.
        // Assuming schema default for block is true. Let's keep it simple and always include it.
        // if (!displayMoogliData.block) delete displayMoogliData.block;


        return { moogli: moogliData, displayMoogli: displayMoogliData };

    }, [tabs, globalSettings]); // Depends on both states


    // --- NEW: useEffect to call the prop when relevant state changes ---
    useEffect(() => {
        if (onConfigurationChange) {
            const threeDData = getThreeDData();
            onConfigurationChange(threeDData); // Pass object with both keys
        }
    }, [tabs, globalSettings, getThreeDData, onConfigurationChange]); // Dependencies
    // --- END NEW ---


    // --- JSX Rendering ---
    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>3D Visualization (Moogli)</Typography>

            {/* === Moogli Array Section (Tabs) === */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Data Sources</Typography>
             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={activeTab} onChange={(e, nv) => setActiveTab(nv)} variant="scrollable" scrollButtons="auto" aria-label="Moogli data sources">
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={`${tab.field || 'New'} @ ${tab.path || '?'}`} />
                     ))}
                     <IconButton onClick={addTab} sx={{ alignSelf: 'center', marginLeft: '10px' }}><AddIcon /></IconButton>
                 </Tabs>
             </Box>
             {tabs.length > 0 && activeTab < tabs.length && tabs[activeTab] && (
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
                             <TextField fullWidth size="small" label="Relative Path (Optional)" defaultValue="." value={tabs[activeTab].relativePath}
                                 onChange={(e) => updateTab(activeTab, 'relativePath', e.target.value)} />
                         </Grid>
                          <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Title (Optional)" value={tabs[activeTab].title}
                                 onChange={(e) => updateTab(activeTab, 'title', e.target.value)} />
                         </Grid>
                         {/* Row 3: DiaScale, Dt */}
                           <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="Diameter Scale (Optional)" type="number" defaultValue="1.0" value={tabs[activeTab].diameterScale}
                                 onChange={(e) => updateTab(activeTab, 'diameterScale', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }}/>
                         </Grid>
                           <Grid item xs={12} sm={6}>
                             <TextField fullWidth size="small" label="dt (Update Interval, Optional)" type="number" defaultValue="0.1" value={tabs[activeTab].dt}
                                 onChange={(e) => updateTab(activeTab, 'dt', e.target.value)} InputProps={{ inputProps: { min: 1e-5, step: 0.01 } }}/>
                         </Grid>
                         {/* Ymin/Ymax fields from schema are not included in UI */}
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
                        <FormControlLabel control={ <Checkbox checked={globalSettings.mergeDisplays} onChange={(e) => updateGlobalSetting('mergeDisplays', e.target.checked)} />} label="Merge Displays"/>
                        <FormControlLabel control={ <Checkbox checked={globalSettings.fullScreen} onChange={(e) => updateGlobalSetting('fullScreen', e.target.checked)} />} label="Fullscreen"/>
                        <FormControlLabel control={ <Checkbox checked={globalSettings.block} onChange={(e) => updateGlobalSetting('block', e.target.checked)} />} label="Block Thread"/>
                     </Grid>
                 </Grid>
            </Box>
        </Box>
    );
};

export default ThreeDMenuBox;
