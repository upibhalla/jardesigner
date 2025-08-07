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
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import helpText from './ThreeDMenuBox.Help.json';
import { formatFloat } from '../../utils/formatters.js';

// --- Define options outside component ---
const fieldOptions = [
    'Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'Cm', 'Rm', 'Ra',
    'Ca', 'n', 'conc', 'volume', 'activation', 'concInit', 'current',
    'modulation', 'psdArea', 'nInit'
];
const chemFields = ["n", "conc", "volume", "concInit", "nInit"];
const fastDtFields = ['Vm', 'Im', 'inject', 'Gbar', 'Gk', 'Ik', 'ICa', 'activation', 'current', 'Ca'];
const colormapOptions = ['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'jet', 'gray', 'cool', 'hot', 'bwr'];
const backgroundOptions = ['default', 'white', 'black', 'grey', 'beige'];

// --- Helper to safely convert value to string ---
const safeToString = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? String(value) : defaultValue;
};

// --- Default state creators ---
const createDefaultMoogliEntry = () => ({
    path: 'soma',
    field: fieldOptions[0],
    chemProto: '.',
    childPath: '',
    title: '',
    diameterScale: '1.0',
    min: '0',
    max: '0',
    dt: '0.001', // Default dt for Vm
});

const createDefaultGlobalSettings = () => ({
    rotation: '0.0',
    azimuth: '0.0',
    elevation: '0.0',
    mergeDisplays: false,
    fullScreen: false,
    colormap: 'jet',
    background: 'default',
    center: '[0,0,0]',
    block: true,
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
const ThreeDMenuBox = ({ onConfigurationChange, currentConfig, getChemProtos }) => {
    const [tabs, setTabs] = useState(() => {
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
                    initialChemProto = '';
                    initialChildPath = relpath;
                }
            } else {
                initialChildPath = m.relpath || '';
            }
            return {
                path: m.path || defaults.path,
                field: field,
                chemProto: initialChemProto,
                childPath: initialChildPath,
                title: m.title || '',
                diameterScale: formatFloat(m.diaScale) || defaults.diameterScale,
                min: formatFloat(m.ymin) || defaults.min,
                max: formatFloat(m.ymax) || defaults.max,
                dt: formatFloat(m.dt) || (fastDtFields.includes(field) ? '0.001' : '0.2'),
            };
        }) || [];
        return initialTabs.length > 0 ? initialTabs : [createDefaultMoogliEntry()];
    });

    const [globalSettings, setGlobalSettings] = useState(() => {
        const initialDisplay = currentConfig?.displayMoogli || {};
        const defaults = createDefaultGlobalSettings();
        return {
            rotation: formatFloat(initialDisplay.rotation) || defaults.rotation,
            azimuth: formatFloat(initialDisplay.azim) || defaults.azimuth,
            elevation: formatFloat(initialDisplay.elev) || defaults.elevation,
            mergeDisplays: initialDisplay.mergeDisplays ?? defaults.mergeDisplays,
            fullScreen: initialDisplay.fullscreen ?? defaults.fullScreen,
            colormap: initialDisplay.colormap || defaults.colormap,
            background: backgroundOptions.includes(initialDisplay.bg) ? initialDisplay.bg : defaults.background,
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
        setTabs((prevTabs) =>
            prevTabs.map((tab, i) => {
                if (i === index) {
                    const updatedTab = { ...tab, [key]: value };
                    if (key === 'field') {
                        // Handle chem proto logic
                        const isNowChem = chemFields.includes(value);
                        const wasChem = chemFields.includes(tab.field);
                        if (wasChem && !isNowChem) updatedTab.chemProto = '.';
                        else if (!wasChem && isNowChem) updatedTab.chemProto = '';

                        // Set dt based on field type
                        updatedTab.dt = fastDtFields.includes(value) ? '0.001' : '0.2';
                    }
                    return updatedTab;
                }
                return tab;
            })
        );
    }, []);

    const updateGlobalSetting = useCallback((key, value) => {
        const actualValue = (typeof value === 'boolean') ? value : value;
        setGlobalSettings((prev) => ({ ...prev, [key]: actualValue }));
    }, []);

    const handleTabChange = (event, newValue) => setActiveTab(newValue);

    useEffect(() => {
        const getThreeDDataForUnmount = () => {
            const moogliData = tabsRef.current.map(tabState => {
                if (!tabState.path || !tabState.field) return null;
                const diaScaleNum = parseFloat(tabState.diameterScale);
                const minNum = parseFloat(tabState.min);
                const maxNum = parseFloat(tabState.max);
                const dtNum = parseFloat(tabState.dt);
                const defaultsMoogli = createDefaultMoogliEntry();
                const isChemField = chemFields.includes(tabState.field);
                let relpathValue = undefined;

                if (isChemField) {
                    if (tabState.chemProto && tabState.childPath) {
                        relpathValue = `${tabState.chemProto}/${tabState.childPath}`;
                    } else { return null; }
                } else {
                    if (tabState.childPath && tabState.childPath !== '') relpathValue = tabState.childPath;
                }

                const moogliSchemaItem = { path: tabState.path, field: tabState.field };
                if (relpathValue !== undefined) moogliSchemaItem.relpath = relpathValue;
                if (tabState.title) moogliSchemaItem.title = tabState.title;
                if (!isNaN(diaScaleNum) && safeToString(diaScaleNum) !== defaultsMoogli.diameterScale) moogliSchemaItem.diaScale = diaScaleNum;
                if (!isNaN(minNum) && safeToString(minNum) !== defaultsMoogli.min) moogliSchemaItem.ymin = minNum;
                if (!isNaN(maxNum) && safeToString(maxNum) !== defaultsMoogli.max) moogliSchemaItem.ymax = maxNum;
                
                // --- MODIFIED: Always add the 'dt' property if it's a valid number ---
                if (!isNaN(dtNum)) moogliSchemaItem.dt = dtNum;

                return moogliSchemaItem;

            }).filter(item => item !== null);

            if (moogliData.length === 0) {
                return { moogli: [], displayMoogli: undefined };
            }

            let centerArray;
            try {
                const parsedCenter = JSON.parse(globalSettingsRef.current.center);
                centerArray = (Array.isArray(parsedCenter) && parsedCenter.length === 3 && parsedCenter.every(n => typeof n === 'number')) ? parsedCenter : JSON.parse(createDefaultGlobalSettings().center);
            } catch (e) {
                centerArray = JSON.parse(createDefaultGlobalSettings().center);
            }
            const defaultsGlobal = createDefaultGlobalSettings();
            const displayMoogliData = {
                rotation: parseFloat(globalSettingsRef.current.rotation) || parseFloat(defaultsGlobal.rotation),
                azim: parseFloat(globalSettingsRef.current.azimuth) || parseFloat(defaultsGlobal.azimuth),
                elev: parseFloat(globalSettingsRef.current.elevation) || parseFloat(defaultsGlobal.elevation),
                colormap: globalSettingsRef.current.colormap || defaultsGlobal.colormap,
                bg: globalSettingsRef.current.background || defaultsGlobal.background,
                center: centerArray,
                block: globalSettingsRef.current.block,
                ...(globalSettingsRef.current.mergeDisplays !== defaultsGlobal.mergeDisplays && { mergeDisplays: globalSettingsRef.current.mergeDisplays }),
                ...(globalSettingsRef.current.fullScreen !== defaultsGlobal.fullScreen && { fullscreen: globalSettingsRef.current.fullScreen }),
            };
            return { moogli: moogliData, displayMoogli: displayMoogliData };
        };

        return () => {
            if (onConfigurationChangeRef.current) {
                const configData = getThreeDDataForUnmount();
                onConfigurationChangeRef.current(configData);
            }
        };
    }, []);

    const availableChemProtos = getChemProtosRef.current ? getChemProtosRef.current() : [];
    const activeTabData = tabs[activeTab];
    const isChemField = activeTabData && chemFields.includes(activeTabData.field);
    const showChemProtoWarning = isChemField && !availableChemProtos.length;

    return (
        <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>3D Visualization (Moogli)</Typography>
                <Tooltip title={helpText.main} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>Data Sources</Typography>
                <Tooltip title={helpText.headings.dataSources} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    {tabs.map((tab, index) => <Tab key={index} label={`${tab.field || 'New'} @ ${tab.path || '?'}`} />)}
                    <IconButton onClick={addTab} sx={{ alignSelf: 'center', ml: '10px' }}><AddIcon /></IconButton>
                </Tabs>
            </Box>
            {activeTabData && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}><HelpField id="path" label="Path" required value={activeTabData.path} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.path} /></Grid>
                        <Grid item xs={12} sm={6}><HelpField id="field" label="Field" required select value={activeTabData.field} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.field}>{fieldOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</HelpField></Grid>
                        {isChemField ? (
                             <>
                                 <Grid item xs={12} sm={6}>
                                     <HelpField id="chemProto" label="Chem Prototype" select required value={activeTabData.chemProto} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.chemProto} error={showChemProtoWarning || !activeTabData.chemProto}>
                                         <MenuItem value=""><em>Select...</em></MenuItem>
                                         {availableChemProtos.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                     </HelpField>
                                 </Grid>
                                 <Grid item xs={12} sm={6}><HelpField id="childPath" label="Child Object Path" required value={activeTabData.childPath} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.childPath} /></Grid>
                             </>
                         ) : (
                             <>
                                 <Grid item xs={12} sm={6}><HelpField id="chemProto" label="Chem Prototype" select disabled value={activeTabData.chemProto} onChange={()=>{}} helptext={helpText.dataSources.chemProto}><MenuItem value=".">.</MenuItem></HelpField></Grid>
                                 <Grid item xs={12} sm={6}><HelpField id="childPath" label="Relative Path (Optional)" value={activeTabData.childPath} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.childPath}/></Grid>
                             </>
                         )}
                        <Grid item xs={12} sm={6}><HelpField id="title" label="Title (Optional)" value={activeTabData.title} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.title} /></Grid>
                        <Grid item xs={12} sm={6}><HelpField id="diameterScale" label="Diameter Scale" type="number" value={activeTabData.diameterScale} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.diameterScale} /></Grid>
                        <Grid item xs={12} sm={6}><HelpField id="min" label="Min (ymin)" type="number" value={activeTabData.min} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.min} /></Grid>
                        <Grid item xs={12} sm={6}><HelpField id="max" label="Max (ymax)" type="number" value={activeTabData.max} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.max} /></Grid>
                        <Grid item xs={12} sm={6}><HelpField id="dt" label="Frame dt (s)" type="number" value={activeTabData.dt} onChange={(id, v) => updateTab(activeTab, id, v)} helptext={helpText.dataSources.dt} /></Grid>
                    </Grid>
                    <Button variant="outlined" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeTab(activeTab)} sx={{ mt: 2 }}>Remove Data Source</Button>
                </Box>
            )}

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>Global Display Settings</Typography>
                <Tooltip title={helpText.headings.globalSettings} placement="right"><IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><HelpField id="rotation" label="Rotation (rad/step)" type="number" value={globalSettings.rotation} onChange={(id, v) => updateGlobalSetting(id, v)} helptext={helpText.globalSettings.rotation} /></Grid>
                    <Grid item xs={12} sm={6}><HelpField id="azimuth" label="Azimuth (azim)" type="number" value={globalSettings.azimuth} onChange={(id, v) => updateGlobalSetting(id, v)} helptext={helpText.globalSettings.azimuth} /></Grid>
                    <Grid item xs={12} sm={6}><HelpField id="elevation" label="Elevation (elev)" type="number" value={globalSettings.elevation} onChange={(id, v) => updateGlobalSetting(id, v)} helptext={helpText.globalSettings.elevation} /></Grid>
                    <Grid item xs={12} sm={6}><HelpField id="colormap" label="Colormap" select value={globalSettings.colormap} onChange={(id, v) => updateGlobalSetting(id, v)} helptext={helpText.globalSettings.colormap}>{colormapOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</HelpField></Grid>
                    <Grid item xs={12} sm={6}><HelpField id="background" label="Background (bg)" select value={globalSettings.background} onChange={(id, v) => updateGlobalSetting(id, v)} helptext={helpText.globalSettings.background}>{backgroundOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</HelpField></Grid>
                    <Grid item xs={12} sm={6}><HelpField id="center" label="Center [x,y,z]" value={globalSettings.center} onChange={(id, v) => updateGlobalSetting(id, v)} helptext={helpText.globalSettings.center} /></Grid>
                    <Grid item xs={12} container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs="auto"><Tooltip title={helpText.globalSettings.mergeDisplays}><FormControlLabel control={<Checkbox checked={Boolean(globalSettings.mergeDisplays)} onChange={(e) => updateGlobalSetting('mergeDisplays', e.target.checked)} />} label="Merge Displays" /></Tooltip></Grid>
                        <Grid item xs="auto"><Tooltip title={helpText.globalSettings.fullScreen}><FormControlLabel control={<Checkbox checked={Boolean(globalSettings.fullScreen)} onChange={(e) => updateGlobalSetting('fullScreen', e.target.checked)} />} label="Fullscreen" /></Tooltip></Grid>
                        <Grid item xs="auto"><Tooltip title={helpText.globalSettings.block}><FormControlLabel control={<Checkbox checked={Boolean(globalSettings.block)} onChange={(e) => updateGlobalSetting('block', e.target.checked)} />} label="Block Thread" /></Tooltip></Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default ThreeDMenuBox;
