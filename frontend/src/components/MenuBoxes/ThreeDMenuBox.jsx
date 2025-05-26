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
    FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper to safely convert value to string, handling potential null/undefined
const safeToString = (value, defaultValue = '') => {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return String(value);
};

// Field Options
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit'
];

const chemFields = ["n", "conc", "volume", "concInit", "nInit"];
const colormapOptions = ['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'jet', 'gray', 'cool', 'hot', 'bwr'];
// Added background options
const backgroundOptions = ['default', 'white', 'black', 'grey', 'beige'];

// Default state creators
const createDefaultMoogliEntry = () => ({
    path: '',
    field: fieldOptions[0],
    chemProto: '.',
    childPath: '',
    title: '',
    diameterScale: '1.0',
    min: '0',
    max: '0',
});

const createDefaultGlobalSettings = () => ({
    runtime: '0.3',
    dt: '0.1',
    rotation: '0.0',
    azimuth: '0.0',
    elevation: '0.0',
    mergeDisplays: false,
    fullScreen: false,
    colormap: 'jet',
    background: 'default', // Default background
    center: '[0,0,0]',
    block: true,
});

const ThreeDMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {
    const [tabs, setTabs] = useState(() => {
        console.log("ThreeDMenuBox: Initializing tabs (moogli) from props", currentConfig?.moogli);
        const defaults = createDefaultMoogliEntry();
        const initialTabs = currentConfig?.moogli?.map(m => {
            const field = m.field || fieldOptions[0];
            const isChemField = chemFields.includes(field);
            let initialChemProto = '.';
            let initialChildPath = '';

            if (isChemField) {
                const relpath = m.relpath || '';
                const slashIndex = relpath.indexOf('/');
                if (slashIndex !== -1) {
                    initialChemProto = relpath.substring(0, slashIndex);
                    initialChildPath = relpath.substring(slashIndex + 1);
                } else {
                    console.warn(`ThreeDMenuBox Init: Chem field '${field}' found but relpath '${relpath}' missing '/' separator. Assigning to Child Path.`);
                    initialChemProto = '';
                    initialChildPath = relpath;
                }
            } else {
                initialChildPath = m.relpath || '';
            }

            return {
                path: m.path || '',
                field: field,
                chemProto: initialChemProto,
                childPath: initialChildPath,
                title: m.title || '',
                diameterScale: safeToString(m.diaScale, defaults.diameterScale),
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
            dt: safeToString(initialDisplay.dt, defaults.dt),
            rotation: safeToString(initialDisplay.rotation, defaults.rotation),
            azimuth: safeToString(initialDisplay.azim, defaults.azimuth),
            elevation: safeToString(initialDisplay.elev, defaults.elevation),
            mergeDisplays: initialDisplay.mergeDisplays ?? defaults.mergeDisplays,
            fullScreen: initialDisplay.fullscreen ?? defaults.fullScreen,
            colormap: initialDisplay.colormap || defaults.colormap,
            background: backgroundOptions.includes(initialDisplay.bg) ? initialDisplay.bg : defaults.background, // Ensure valid background
            center: JSON.stringify(initialDisplay.center || JSON.parse(defaults.center)),
            block: initialDisplay.block ?? defaults.block,
        };
    });

    const [activeTab, setActiveTab] = useState(0);

    const onConfigurationChangeRef = useRef(onConfigurationChange);
    useEffect(() => { onConfigurationChangeRef.current = onConfigurationChange; }, [onConfigurationChange]);
    const tabsRef = useRef(tabs);
    useEffect(() => { tabsRef.current = tabs; }, [tabs]);
    const globalSettingsRef = useRef(globalSettings);
    useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);
    const getChemProtosRef = useRef(getChemProtos);
    useEffect(() => { getChemProtosRef.current = getChemProtos; }, [getChemProtos]);

    const addTab = useCallback(() => {
        setTabs((prev) => [...prev, createDefaultMoogliEntry()]);
        setActiveTab(tabsRef.current.length);
    }, []);

    const removeTab = useCallback((indexToRemove) => {
        setTabs((prev) => prev.filter((_, i) => i !== indexToRemove));
        setActiveTab((prev) => Math.max(0, prev - (prev >= indexToRemove ? 1 : 0)));
    }, []);

    const updateTab = useCallback((index, key, value) => {
        console.log(`ThreeDMenuBox Tab: Local state change - Index ${index}, Key ${key}: ${value}`);
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) => {
                if (i === index) {
                    const updatedTab = { ...tab, [key]: value };
                    if (key === 'field') {
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(tab.field);
                        if (wasChem && !isNowChem) {
                            updatedTab.chemProto = '.';
                        } else if (!wasChem && isNowChem) {
                            updatedTab.chemProto = '';
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

    const getThreeDDataForUnmount = () => {
        const currentTabs = tabsRef.current;
        const currentGlobalSettings = globalSettingsRef.current;
        console.log("ThreeDMenuBox: Formatting final local state for push:", { tabs: currentTabs, globalSettings: currentGlobalSettings });

        const moogliData = currentTabs.map(tabState => {
            if (!tabState.path || !tabState.field) {
                console.warn("Skipping 3D source due to missing path or field:", tabState);
                return null;
            }
            const diaScaleNum = parseFloat(tabState.diameterScale);
            const minNum = parseFloat(tabState.min);
            const maxNum = parseFloat(tabState.max);
            const defaultsMoogli = createDefaultMoogliEntry();

            const isChemField = chemFields.includes(tabState.field);
            let relpathValue = undefined;

            if (isChemField) {
                if (tabState.chemProto && tabState.childPath) {
                    relpathValue = `${tabState.chemProto}/${tabState.childPath}`;
                } else {
                    console.warn(`Skipping 3D source with chem field '${tabState.field}' due to missing Chem Prototype or Child Object Path:`, tabState);
                    return null;
                }
            } else {
                if (tabState.childPath && tabState.childPath !== '') {
                    relpathValue = tabState.childPath;
                }
                if (tabState.chemProto !== '.') {
                    console.warn(`ThreeDMenuBox Save: Non-chemical field '${tabState.field}' unexpectedly has chemProto '${tabState.chemProto}'. Ignoring proto.`);
                }
            }

            const moogliSchemaItem = {
                path: tabState.path,
                field: tabState.field,
            };

            if (relpathValue !== undefined) {
                moogliSchemaItem.relpath = relpathValue;
            }
            if (tabState.title) {
                moogliSchemaItem.title = tabState.title;
            }
            if (!isNaN(diaScaleNum) && safeToString(diaScaleNum) !== defaultsMoogli.diameterScale) {
                moogliSchemaItem.diaScale = diaScaleNum;
            }
            if (!isNaN(minNum) && safeToString(minNum) !== defaultsMoogli.min) {
                moogliSchemaItem.ymin = minNum;
            }
            if (!isNaN(maxNum) && safeToString(maxNum) !== defaultsMoogli.max) {
                moogliSchemaItem.ymax = maxNum;
            }

            return moogliSchemaItem;
        }).filter(item => item !== null);

        let centerArray = JSON.parse(createDefaultGlobalSettings().center);
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

        const defaultsGlobal = createDefaultGlobalSettings();
        const displayMoogliData = {
            runtime: parseFloat(currentGlobalSettings.runtime) || parseFloat(defaultsGlobal.runtime),
            dt: parseFloat(currentGlobalSettings.dt) || parseFloat(defaultsGlobal.dt),
            rotation: parseFloat(currentGlobalSettings.rotation) || parseFloat(defaultsGlobal.rotation),
            azim: parseFloat(currentGlobalSettings.azimuth) || parseFloat(defaultsGlobal.azimuth),
            elev: parseFloat(currentGlobalSettings.elevation) || parseFloat(defaultsGlobal.elevation),
            colormap: currentGlobalSettings.colormap || defaultsGlobal.colormap,
            bg: currentGlobalSettings.background || defaultsGlobal.background,
            center: centerArray,
            block: currentGlobalSettings.block,
            ...(currentGlobalSettings.mergeDisplays !== defaultsGlobal.mergeDisplays && { mergeDisplays: currentGlobalSettings.mergeDisplays }),
            ...(currentGlobalSettings.fullScreen !== defaultsGlobal.fullScreen && { fullscreen: currentGlobalSettings.fullScreen }),
        };

        return { moogli: moogliData, displayMoogli: displayMoogliData };
    };

    useEffect(() => {
        console.log("ThreeDMenuBox: Mounted, setting up unmount cleanup.");
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

                if (finalConfigString !== initialConfigString) {
                    console.log("ThreeDMenuBox: Changes detected or structure modified, pushing final state up.");
                    latestOnConfigurationChange(finalConfigData);
                } else {
                    console.log("ThreeDMenuBox: No changes detected, skipping push on unmount.");
                }
            } else {
                console.warn("ThreeDMenuBox: onConfigurationChange not available on unmount.");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                const currentTab = tabs[activeTab];
                const isChemField = chemFields.includes(currentTab.field);
                const chemProtosAvailable = availableChemProtos.length > 0;
                const showChemProtoWarning = isChemField && !chemProtosAvailable;

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

                            {isChemField ? (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select fullWidth size="small" label="Chem Prototype" required
                                            value={currentTab.chemProto}
                                            onChange={(e) => updateTab(activeTab, 'chemProto', e.target.value)}
                                            error={showChemProtoWarning || !currentTab.chemProto}
                                            helperText={showChemProtoWarning ? "Warning: No Chem Prototypes defined in Signaling." : (!currentTab.chemProto ? "Required" : "")}
                                        >
                                            <MenuItem value=""><em>Select Prototype...</em></MenuItem>
                                            {availableChemProtos.map(protoName => (
                                                <MenuItem key={protoName} value={protoName}>{protoName}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small" label="Child Object Path" required
                                            value={currentTab.childPath}
                                            onChange={(e) => updateTab(activeTab, 'childPath', e.target.value)}
                                            error={!currentTab.childPath}
                                            helperText={!currentTab.childPath ? "Required" : ""}
                                        />
                                    </Grid>
                                </>
                            ) : (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select fullWidth disabled size="small" label="Chem Prototype"
                                            value={currentTab.chemProto} // Should be '.'
                                        >
                                            <MenuItem value=".">.</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small" label="Relative Path (Optional)"
                                            value={currentTab.childPath}
                                            onChange={(e) => updateTab(activeTab, 'childPath', e.target.value)}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Title (Optional)" value={currentTab.title}
                                    onChange={(e) => updateTab(activeTab, 'title', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Diameter Scale (Optional)" type="number" value={currentTab.diameterScale}
                                    onChange={(e) => updateTab(activeTab, 'diameterScale', e.target.value)} InputProps={{ inputProps: { step: 0.1 } }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth size="small" label="Min (ymin)" type="number"
                                    value={currentTab.min} onChange={(e) => updateTab(activeTab, 'min', e.target.value)}
                                    InputProps={{ inputProps: { step: 'any' } }} helperText="Optional (Default: 0)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth size="small" label="Max (ymax)" type="number"
                                    value={currentTab.max} onChange={(e) => updateTab(activeTab, 'max', e.target.value)}
                                    InputProps={{ inputProps: { step: 'any' } }} helperText="Optional (Default: 0)"
                                />
                            </Grid>
                        </Grid>
                        <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeTab(activeTab)} sx={{ marginTop: '16px' }}>
                            Remove Data Source {activeTab + 1}
                        </Button>
                    </Box>
                );
            })()}
            {tabs.length === 0 && <Typography sx={{ mt: 1, fontStyle: 'italic' }}>No 3D data sources defined.</Typography>}

            <Divider style={{ margin: '24px 0' }} />
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Global Display Settings</Typography>
            <Box sx={{ marginTop: '16px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <Grid container spacing={2} alignItems="center"> {/* Increased spacing for clarity */}
                    {/* Row 1: Runtime, Display dt, Rotation */}
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField fullWidth size="small" label="Runtime (s)" type="number" InputProps={{ inputProps: { min: 1e-3, step: 0.1 } }}
                            value={globalSettings.runtime} onChange={(e) => updateGlobalSetting('runtime', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Display dt (s)"
                            type="number"
                            value={globalSettings.dt}
                            onChange={(e) => updateGlobalSetting('dt', e.target.value)}
                            InputProps={{ inputProps: { min: 1e-5, step: 0.01 } }}
                            // helperText removed
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField fullWidth size="small" label="Rotation (rad/step)" type="number" InputProps={{ inputProps: { step: 0.001 } }}
                            value={globalSettings.rotation} onChange={(e) => updateGlobalSetting('rotation', e.target.value)} />
                    </Grid>

                    {/* Row 2: Azimuth, Elevation */}
                    <Grid item xs={12} sm={6} md={4}> {/* md={4} or md={6} depending on preference */}
                        <TextField fullWidth size="small" label="Azimuth (azim)" type="number" InputProps={{ inputProps: { step: 0.1 } }}
                            value={globalSettings.azimuth} onChange={(e) => updateGlobalSetting('azimuth', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}> {/* md={4} or md={6} */}
                        <TextField fullWidth size="small" label="Elevation (elev)" type="number" InputProps={{ inputProps: { step: 0.1 } }}
                            value={globalSettings.elevation} onChange={(e) => updateGlobalSetting('elevation', e.target.value)} />
                    </Grid>
                     {/* Empty item to push next row or adjust md values above if 2 items per row is desired */}
                    <Grid item md={4} sx={{ display: { xs: 'none', md: 'block' } }} />


                    {/* Row 3: Colormap, Background */}
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField select fullWidth size="small" label="Colormap" value={globalSettings.colormap}
                            onChange={(e) => updateGlobalSetting('colormap', e.target.value)}>
                            {colormapOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Background (bg)"
                            value={globalSettings.background}
                            onChange={(e) => updateGlobalSetting('background', e.target.value)}
                        >
                            {backgroundOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item md={4} sx={{ display: { xs: 'none', md: 'block' } }} />


                    {/* Row 4: Center */}
                    <Grid item xs={12}> {/* Full width for center */}
                        <TextField fullWidth size="small" label="Center [x,y,z] (JSON array)" value={globalSettings.center}
                            onChange={(e) => updateGlobalSetting('center', e.target.value)}
                            placeholder="e.g., [1.5e-5, 0, -2e-5]" />
                    </Grid>

                    {/* Checkboxes in their own row */}
                    <Grid item xs={12} container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4} md="auto">
                            <FormControlLabel control={<Checkbox checked={Boolean(globalSettings.mergeDisplays)} onChange={(e) => updateGlobalSetting('mergeDisplays', e.target.checked)} />} label="Merge Displays" sx={{ whiteSpace: 'nowrap' }} />
                        </Grid>
                        <Grid item xs={12} sm={4} md="auto">
                            <FormControlLabel control={<Checkbox checked={Boolean(globalSettings.fullScreen)} onChange={(e) => updateGlobalSetting('fullScreen', e.target.checked)} />} label="Fullscreen" sx={{ whiteSpace: 'nowrap' }} />
                        </Grid>
                        <Grid item xs={12} sm={4} md="auto">
                            <FormControlLabel control={<Checkbox checked={Boolean(globalSettings.block)} onChange={(e) => updateGlobalSetting('block', e.target.checked)} />} label="Block Thread" sx={{ whiteSpace: 'nowrap' }} />
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default ThreeDMenuBox;

