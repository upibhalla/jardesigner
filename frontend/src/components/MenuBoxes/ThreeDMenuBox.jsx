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
    FormHelperText // Import FormHelperText for warnings
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
    'modulation', 'psdArea', 'nInit' // Added nInit based on instructions
];

// --- ADDED: Define which fields are considered chemical fields ---
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];

// Colormap options
const colormapOptions = ['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'jet', 'gray', 'cool', 'hot', 'bwr'];

// --- UPDATED: Default state creators ---
const createDefaultMoogliEntry = () => ({
    path: '',
    field: fieldOptions[0], // Use first field option as default
    // Replace relativePath with chemProto and childPath
    chemProto: '.', // Default for non-chem fields
    childPath: '',
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

// --- UPDATED: Accept getChemProtos prop ---
const ThreeDMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {

    // --- UPDATED: Initialize state from props ---
    const [tabs, setTabs] = useState(() => {
        console.log("ThreeDMenuBox: Initializing tabs (moogli) from props", currentConfig?.moogli);
        const defaults = createDefaultMoogliEntry(); // Get defaults
        const initialTabs = currentConfig?.moogli?.map(m => {
            const field = m.field || fieldOptions[0];
            const isChemField = chemFields.includes(field);
            let initialChemProto = '.'; // Default for non-chem
            let initialChildPath = '';

            // Parse relpath based on isChemField (Instruction 8)
            if (isChemField) {
                const relpath = m.relpath || '';
                const slashIndex = relpath.indexOf('/');
                if (slashIndex !== -1) {
                    initialChemProto = relpath.substring(0, slashIndex);
                    initialChildPath = relpath.substring(slashIndex + 1);
                } else {
                     console.warn(`ThreeDMenuBox Init: Chem field '${field}' found but relpath '${relpath}' missing '/' separator. Assigning to Child Path.`);
                     initialChemProto = ''; // Default to empty, user needs to select
                     initialChildPath = relpath;
                }
            } else {
                // Not a chem field, relpath goes directly to childPath
                initialChildPath = m.relpath || ''; // Assign relpath directly
            }

            return {
                path: m.path || '',
                field: field,
                chemProto: initialChemProto, // Use parsed value
                childPath: initialChildPath, // Use parsed value
                title: m.title || '',
                diameterScale: safeToString(m.diaScale, defaults.diameterScale),
                dt: safeToString(m.dt, defaults.dt),
                min: safeToString(m.ymin, defaults.min),
                max: safeToString(m.ymax, defaults.max),
            };
        }) || [];
        return initialTabs.length > 0 ? initialTabs : [createDefaultMoogliEntry()];
    });

    const [globalSettings, setGlobalSettings] = useState(() => {
        console.log("ThreeDMenuBox: Initializing globalSettings (displayMoogli) from props", currentConfig?.displayMoogli);
        const initialDisplay = currentConfig?.displayMoogli || {};
        const defaults = createDefaultGlobalSettings();
        return {
            runtime: safeToString(initialDisplay.runtime, defaults.runtime),
            rotation: safeToString(initialDisplay.rotation, defaults.rotation),
            azimuth: safeToString(initialDisplay.azim, defaults.azimuth),
            elevation: safeToString(initialDisplay.elev, defaults.elevation),
            mergeDisplays: initialDisplay.mergeDisplays ?? defaults.mergeDisplays,
            fullScreen: initialDisplay.fullscreen ?? defaults.fullScreen,
            colormap: initialDisplay.colormap || defaults.colormap,
            background: initialDisplay.bg || defaults.background,
            center: JSON.stringify(initialDisplay.center || JSON.parse(defaults.center)),
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
    // --- ADDED: Ref for getChemProtos ---
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);


    // --- Handlers ONLY update LOCAL state ---
    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createDefaultMoogliEntry()]);
        setActiveTab(tabsRef.current.length);
    }, []);

    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveTab((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    // --- UPDATED: updateTab handler ---
    const updateTab = useCallback((index, key, value) => {
        console.log(`ThreeDMenuBox Tab: Local state change - Index ${index}, Key ${key}: ${value}`);
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) => {
                 if (i === index) {
                    const updatedTab = { ...tab, [key]: value };
                    // --- ADDED: Reset chemProto if field changes ---
                    if (key === 'field') {
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(tab.field);
                        if (wasChem && !isNowChem) {
                            updatedTab.chemProto = '.'; // Reset proto to default non-chem value
                            // Keep childPath as it might still be relevant
                        } else if (!wasChem && isNowChem) {
                            updatedTab.chemProto = ''; // Reset proto to empty for chem field selection
                        }
                    }
                    return updatedTab;
                }
                return tab;
            })
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


    // --- UPDATED: Function to format local state for pushing up ---
    const getThreeDDataForUnmount = () => {
        const currentTabs = tabsRef.current;
        const currentGlobalSettings = globalSettingsRef.current;
        console.log("ThreeDMenuBox: Formatting final local state for push:", { tabs: currentTabs, globalSettings: currentGlobalSettings });

        // Format moogli array
        const moogliData = currentTabs.map(tabState => {
            // Basic validation
            if (!tabState.path || !tabState.field) {
                 console.warn("Skipping 3D source due to missing path or field:", tabState);
                 return null;
            }
            const diaScaleNum = parseFloat(tabState.diameterScale);
            const dtNum = parseFloat(tabState.dt);
            const minNum = parseFloat(tabState.min);
            const maxNum = parseFloat(tabState.max);
            const defaults = createDefaultMoogliEntry();

            // Determine if the current field is a chemical field (Instruction 2)
            const isChemField = chemFields.includes(tabState.field);
            let relpathValue = undefined;

            // Construct relpath based on isChemField (Instruction 7)
            if (isChemField) {
                // Instruction 5: Both are required if isChemField
                if (tabState.chemProto && tabState.childPath) {
                    relpathValue = `${tabState.chemProto}/${tabState.childPath}`; // Instruction 7.1
                } else {
                    console.warn(`Skipping 3D source with chem field '${tabState.field}' due to missing Chem Prototype or Child Object Path:`, tabState);
                    return null; // Validation fail
                }
            } else {
                // Instruction 7.2: Use childPath if not empty
                if (tabState.childPath && tabState.childPath !== '') {
                     relpathValue = tabState.childPath;
                }
                 // Ensure non-chem fields don't use the default '.' proto value for relpath
                 if (tabState.chemProto !== '.') {
                     console.warn(`ThreeDMenuBox Save: Non-chemical field '${tabState.field}' unexpectedly has chemProto '${tabState.chemProto}'. Ignoring proto.`);
                 }
            }


            // Base object with required fields
            const moogliSchemaItem = {
                path: tabState.path,
                field: tabState.field,
            };

            // Add optional fields only if they are valid and different from default/undefined
             if (relpathValue !== undefined) {
                moogliSchemaItem.relpath = relpathValue;
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
            if (!isNaN(minNum) && safeToString(minNum) !== defaults.min) {
                moogliSchemaItem.ymin = minNum;
            }
            if (!isNaN(maxNum) && safeToString(maxNum) !== defaults.max) {
                moogliSchemaItem.ymax = maxNum;
            }

             return moogliSchemaItem;
        }).filter(item => item !== null);

        // Format displayMoogli object (remains the same)
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
            runtime: parseFloat(currentGlobalSettings.runtime) || 0,
            rotation: parseFloat(currentGlobalSettings.rotation) || 0,
            azim: parseFloat(currentGlobalSettings.azimuth) || 0,
            elev: parseFloat(currentGlobalSettings.elevation) || 0,
            colormap: currentGlobalSettings.colormap || defaultsGlobal.colormap,
            bg: currentGlobalSettings.background || defaultsGlobal.background,
            center: centerArray,
            block: currentGlobalSettings.block,
            ...(currentGlobalSettings.mergeDisplays !== defaultsGlobal.mergeDisplays && { mergeDisplays: currentGlobalSettings.mergeDisplays }),
            ...(currentGlobalSettings.fullScreen !== defaultsGlobal.fullScreen && { fullscreen: currentGlobalSettings.fullScreen }),
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
                 // Stringify the formatted data for comparison
                const finalConfigString = JSON.stringify(finalConfigData);

                 // Only push if the data has actually changed
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
    // --- ADDED: Get available chem protos ---
    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];

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
             {tabs.length > 0 && activeTab >= 0 && activeTab < tabs.length && tabs[activeTab] && (() => {
                 // Determine if the current field is chemical (Instruction 2)
                 const currentTab = tabs[activeTab];
                 const isChemField = chemFields.includes(currentTab.field);
                 const chemProtosAvailable = availableChemProtos.length > 0;
                 const showChemProtoWarning = isChemField && !chemProtosAvailable; // Instruction 4

                 return (
                     <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                         <Grid container spacing={1.5}>
                             {/* Row 1: Path, Field */}
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Path" required value={currentTab.path}
                                     onChange={(e) => updateTab(activeTab, 'path', e.target.value)} />
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                 <TextField select fullWidth size="small" label="Field" required value={currentTab.field}
                                     onChange={(e) => updateTab(activeTab, 'field', e.target.value)}>
                                     <MenuItem value=""><em>Select Field...</em></MenuItem>
                                     {fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                 </TextField>
                             </Grid>

                             {/* --- UPDATED Row 2: Conditional Path Inputs (Instruction 3) --- */}
                              {isChemField ? (
                                  <>
                                      {/* Case: isChemField is TRUE */}
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              select
                                              fullWidth
                                              size="small"
                                              label="Chem Prototype"
                                              required // Instruction 5
                                              value={currentTab.chemProto}
                                              onChange={(e) => updateTab(activeTab, 'chemProto', e.target.value)}
                                              error={showChemProtoWarning || !currentTab.chemProto} // Highlight if warning or empty
                                              helperText={showChemProtoWarning ? "Warning: No Chem Prototypes defined in Signaling." : (!currentTab.chemProto ? "Required" : "")} // Instruction 4 warning
                                          >
                                              <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                              {/* Instruction 4: Options from getChemProtos */}
                                              {availableChemProtos.map(protoName => (
                                                  <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>
                                              ))}
                                          </TextField>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              fullWidth
                                              size="small"
                                              label="Child Object Path"
                                              required // Instruction 5
                                              value={currentTab.childPath}
                                              onChange={(e) => updateTab(activeTab, 'childPath', e.target.value)}
                                              error={!currentTab.childPath} // Highlight if empty
                                              helperText={!currentTab.childPath ? "Required" : ""}
                                          />
                                      </Grid>
                                  </>
                              ) : (
                                  <>
                                      {/* Case: isChemField is FALSE */}
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              select
                                              fullWidth
                                              disabled // Only '.' allowed
                                              size="small"
                                              label="Chem Prototype"
                                              value={currentTab.chemProto} // Should be '.'
                                              onChange={(e) => updateTab(activeTab, 'chemProto', e.target.value)} // Keep handler for consistency
                                          >
                                              {/* Instruction 4: Only '.' allowed */}
                                              <MenuItem value=".">.</MenuItem>
                                          </TextField>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                          <TextField
                                              fullWidth
                                              size="small"
                                              label="Relative Path (Optional)" // Label change
                                              value={currentTab.childPath}
                                              onChange={(e) => updateTab(activeTab, 'childPath', e.target.value)}
                                          />
                                      </Grid>
                                  </>
                              )}
                              {/* --- END UPDATED Row 2 --- */}

                             {/* Row 3: Title, DiaScale */}
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Title (Optional)" value={currentTab.title}
                                     onChange={(e) => updateTab(activeTab, 'title', e.target.value)} />
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="Diameter Scale (Optional)" type="number" value={currentTab.diameterScale}
                                     onChange={(e) => updateTab(activeTab, 'diameterScale', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }}/>
                             </Grid>

                             {/* Row 4: Min, Max */}
                             <Grid item xs={12} sm={6}>
                                 <TextField
                                     fullWidth
                                     size="small"
                                     label="Min (ymin)"
                                     type="number"
                                     value={currentTab.min}
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
                                     value={currentTab.max}
                                     onChange={(e) => updateTab(activeTab, 'max', e.target.value)}
                                     InputProps={{ inputProps: { step: 'any' } }} // Allow floats
                                     helperText="Optional (Default: 0)"
                                 />
                             </Grid>

                             {/* Row 5: Dt */}
                             <Grid item xs={12} sm={6}>
                                 <TextField fullWidth size="small" label="dt (Update Interval, Optional)" type="number" value={currentTab.dt}
                                     onChange={(e) => updateTab(activeTab, 'dt', e.target.value)} InputProps={{ inputProps: { min: 1e-5, step: 0.01 } }}/>
                             </Grid>
                             {/* Empty grid item to balance the row */}
                             <Grid item xs={12} sm={6}></Grid>
                         </Grid>
                         <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeTab(activeTab)} sx={{ marginTop: '16px' }}>
                             Remove Data Source {activeTab + 1}
                         </Button>
                     </Box>
                 );
             })()}
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

