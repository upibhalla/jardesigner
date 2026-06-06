import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Importing logos
import jardesLogo from '../../assets/jardes_logo.png';
import mooseLogo from '../../assets/moose_logo.png';

const API_BASE_URL = `http://${window.location.hostname}:5000`;

const FileMenuBox = ({ setJsonContent, currentConfig, getCurrentJsonData, clientId, onMissingFilesWarned }) => {
    // --- Metadata State ---
    const [creator, setCreator] = useState('');
    const [license, setLicense] = useState('CC BY');
    const [modelNotes, setModelNotes] = useState('');
    const [lastModified, setLastModified] = useState('');
    const [modelFileName, setModelFileName] = useState('model');

    // --- Dialog State ---
    const [showAboutJardesigner, setShowAboutJardesigner] = useState(false);
    const [showAboutMoose, setShowAboutMoose] = useState(false);
    const [missingFiles, setMissingFiles] = useState([]);
    const [showMissingFilesDialog, setShowMissingFilesDialog] = useState(false);

    const loadInputRef = useRef();


    // --- Sync State with Config ---
    useEffect(() => {
        if (currentConfig) {
            setCreator(currentConfig.creator || '');
            setLicense(currentConfig.licence || 'CC BY');
            setModelNotes(currentConfig.modelNotes || '');
            
            if (currentConfig.dateTime) {
                setLastModified(currentConfig.dateTime);
            }
        }
    }, [currentConfig]);

    // --- Actions ---

    const handleNew = () => {
        window.open(window.location.href, '_blank').focus();
    };

    const handleQuit = () => {
        window.close();
        // If the window wasn't opened by JavaScript, close() is blocked by the browser.
        // The timeout only fires if the window is still open.
        setTimeout(() => {
            alert("Please close this tab manually (Ctrl+W or Cmd+W).");
        }, 500);
    };

    const getExternalFileRefs = (parsed) => {
        const refs = [];
        if (parsed.cellProto?.type === 'file' && parsed.cellProto?.source)
            refs.push({ file: parsed.cellProto.source, where: 'Morphology → Browse Library → Upload or select from list' });
        for (const cp of parsed.chemProto || [])
            if ((cp.type === 'sbml' || cp.type === 'SBML' || cp.type === 'kkit') && cp.source)
                refs.push({ file: cp.source, where: 'Signaling → Browse Library → Upload or select from list' });
        for (const cp of parsed.chanProto || [])
            if (cp.type === 'neuroml' && cp.source)
                refs.push({ file: cp.source, where: 'Channels → Browse Library → Upload or select from list' });
        return refs;
    };

    const handleLoadModelJson = (file) => {
        setModelFileName(file.name.replace(/\.json$/i, ""));
        const fileSystemTime = new Date(file.lastModified).toLocaleString();
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            try {
                const parsed = JSON.parse(fileContent);
                const info = parsed.fileinfo || {};
                setCreator(info.creator || '');
                setLicense(info.licence || 'CC BY');
                setModelNotes(info.modelNotes || '');
                setLastModified(info.dateTime || fileSystemTime || new Date().toLocaleString());
                if (setJsonContent) setJsonContent(fileContent);
                const refs = getExternalFileRefs(parsed);
                if (refs.length > 0) {
                    setMissingFiles(refs);
                    setShowMissingFilesDialog(true);
                    if (onMissingFilesWarned) onMissingFilesWarned(true);
                } else {
                    if (onMissingFilesWarned) onMissingFilesWarned(false);
                }
            } catch (err) {
                console.error("Error parsing JSON:", err);
                alert("Failed to load model file.");
            }
        };
        reader.readAsText(file);
    };


    const handleLoadProject = async (file) => {
        if (!clientId) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_BASE_URL}/upload_project/${clientId}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            const parsed = JSON.parse(data.json);
            const info = parsed.fileinfo || {};
            setCreator(info.creator || '');
            setLicense(info.licence || 'CC BY');
            setModelNotes(info.modelNotes || '');
            setLastModified(info.dateTime || new Date().toLocaleString());
            setModelFileName(file.name.replace(/\.jardes$/i, ''));
            if (setJsonContent) setJsonContent(data.json);
        } catch (err) {
            console.error('Error loading project:', err);
            alert(`Failed to load project: ${err.message}`);
        }
    };

    const handleLoadFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (loadInputRef.current) loadInputRef.current.value = '';
        if (file.name.toLowerCase().endsWith('.jardes')) {
            handleLoadProject(file);
        } else {
            handleLoadModelJson(file);
        }
    };

    const handleSaveModel = async () => {
        if (!getCurrentJsonData) {
            alert("Error: Cannot access current model data to save.");
            return;
        }

        const currentJsonData = getCurrentJsonData();
        const currentTime = new Date().toLocaleString();

        setLastModified(currentTime);

        const dataToSave = {
            ...currentJsonData,
            fileinfo: {
                ...currentJsonData.fileinfo, 
                creator,
                licence: license,
                modelNotes,
                dateTime: currentTime 
            }
        };

        const jsonDataString = JSON.stringify(dataToSave, null, 2);
        const suggestedName = `${modelFileName || 'model'}.json`;
        const blob = new Blob([jsonDataString], { type: 'application/json' });

        if (window.showSaveFilePicker) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writableStream = await fileHandle.createWritable();
                await writableStream.write(blob);
                await writableStream.close();
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error saving file:', err);
            }
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = suggestedName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        }
    };

    const _triggerBlobDownload = (blob, fileName) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadProject = async () => {
        if (!clientId) { alert("Client ID is missing."); return; }
        const base = modelFileName || 'model';
        try {
            const response = await fetch(
                `${API_BASE_URL}/download_project_smart/${clientId}?basename=${encodeURIComponent(base)}`
            );
            if (!response.ok) throw new Error(await response.text());
            _triggerBlobDownload(await response.blob(), `${base}.jardes`);
        } catch (error) {
            console.error("Error saving project:", error);
            alert(`Failed to save project: ${error.message}`);
        }
    };

    const handleDownloadProjectHistory = async () => {
        if (!clientId) { alert("Client ID is missing."); return; }
        const base = modelFileName || 'model';
        try {
            const response = await fetch(`${API_BASE_URL}/download_project/${clientId}`);
            if (!response.ok) throw new Error(await response.text());
            _triggerBlobDownload(await response.blob(), `${base}_history.jardes`);
        } catch (error) {
            console.error("Error saving project history:", error);
            alert(`Failed to save project history: ${error.message}`);
        }
    };

    // --- Sub-components ---

    const MenuButton = ({ label, onClick, sx, ...props }) => (
        <Grid item xs={12}>
            <Button
                variant="contained"
                fullWidth
                sx={{ 
                    bgcolor: '#e0e0e0', 
                    color: 'black', 
                    justifyContent: 'flex-start',
                    pl: 2,
                    ':hover': { bgcolor: '#bdbdbd' },
                    ...sx
                }}
                onClick={onClick}
                {...props}
            >
                {label}
            </Button>
        </Grid>
    );

    const InfoDialog = ({ open, onClose, title, logo, content }) => (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {title}
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <img src={logo} alt={`${title} Logo`} style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }} />
                </Box>
                <Box component="ul" sx={{ pl: 2 }}>
                    {content.map((item, index) => (
                        <li key={index} style={{ marginBottom: '12px' }}>
                            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{item}</Typography>
                        </li>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', height: '100%', overflowY: 'auto' }}>
            
            {/* === Section 1: Main Actions === */}
            <Grid container spacing={1}>
                <MenuButton label="New" onClick={handleNew} />

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ bgcolor: '#e0e0e0', color: 'black', justifyContent: 'flex-start', pl: 2, ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={() => loadInputRef.current?.click()}
                    >
                        Load Model
                    </Button>
                    <input type="file" accept=".json,.jardes" style={{ display: 'none' }} ref={loadInputRef} onChange={handleLoadFile} />
                </Grid>

                <MenuButton label="Save Model" onClick={handleDownloadProject} />
                <MenuButton label="Save Model JSON" onClick={handleSaveModel} />
                <MenuButton label="Save Model History" onClick={handleDownloadProjectHistory} />
            </Grid>

            <Divider sx={{ my: 2, borderBottomWidth: 2 }} />

            {/* === Section 2: Properties === */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Properties</Typography>
            <Grid container spacing={1.5}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Suggested File Name"
                        value={modelFileName}
                        onChange={(e) => setModelFileName(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Model Creator"
                        value={creator}
                        onChange={(e) => setCreator(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12}>
                     <TextField
                        select
                        fullWidth
                        size="small"
                        label="License"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                     >
                         <MenuItem value="CC BY">CC BY</MenuItem>
                         <MenuItem value="CC BY-SA">CC BY-SA</MenuItem>
                         <MenuItem value="GPLv3">GPLv3</MenuItem>
                         <MenuItem value="None">None</MenuItem>
                     </TextField>
                 </Grid>
                 <Grid item xs={12}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Model Notes"
                        multiline
                        rows={3}
                        value={modelNotes}
                        onChange={(e) => setModelNotes(e.target.value)}
                    />
                 </Grid>
                 <Grid item xs={12}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Last Modified"
                        value={lastModified}
                        InputProps={{
                            readOnly: true,
                        }}
                        variant="filled"
                    />
                 </Grid>
            </Grid>

            <Divider sx={{ my: 2, borderBottomWidth: 2 }} />

            {/* === Section 3: App Actions === */}
            <Grid container spacing={1}>
                <MenuButton label="Print" onClick={() => {}} /> 
                <MenuButton label="About Jardesigner" onClick={() => setShowAboutJardesigner(true)} />
                <MenuButton label="About MOOSE" onClick={() => setShowAboutMoose(true)} />
                <MenuButton 
                    label="Quit" 
                    onClick={handleQuit} 
                    sx={{ 
                        color: '#c62828', 
                        fontWeight: 'bold'
                    }}
                />
            </Grid>

            {/* === Dialogs === */}
            
            <InfoDialog 
                open={showAboutJardesigner}
                onClose={() => setShowAboutJardesigner(false)}
                title="About Jardesigner"
                logo={jardesLogo}
                content={[
                    "Jardesigner is a web-based, zero-installation GUI for building and running neuronal electrical and signaling models on MOOSE. Jardesigner encompasses the GUI, the model format in JSON, and the Python scripts which run the simulations on MOOSE.",
                    "Jardesigner stands for Javascript App for Reaction-Diffusion and Electrical SIGnaling in NEuRons.",
                    "Jardesigner version: currently 1.1",
                    "Copyright (C) U.S. Bhalla, NCBS-TIFR, and CHINTA 2026",
                    "Licensed under the GNU GPL Version 3.",
                    "Project code is on GitHub at \"https://github.com/upibhalla/jardesigner\"",
                    "Jardesigner documentation is at \"https://github.com/Pragathii-R/Jardesigner-Overview\""
                ]}
            />

            <InfoDialog 
                open={showAboutMoose}
                onClose={() => setShowAboutMoose(false)}
                title="About MOOSE"
                logo={mooseLogo}
                content={[
                    "MOOSE is the Multiscale Object-Oriented Simulation Environment for modeling subcellular signaling, single neuron physiology, detailed and abstract neuronal networks.",
                    "MOOSE version is currently 4.0.0, \"Jalebi\"",
                    "Copyright (C) U.S. Bhalla, NCBS-TIFR, and CHINTA 2026",
                    "Licensed under the GNU GPL Version 3.",
                    "Project code is on GitHub at \"https://github.com/BhallaLab/moose\"",
                    "MOOSE documentation is at \"https://moose.ncbs.res.in/\""
                ]}
            />


            <Dialog open={showMissingFilesDialog} onClose={() => setShowMissingFilesDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    External files required
                    <IconButton size="small" onClick={() => setShowMissingFilesDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        This model references files that are not embedded in the JSON.
                        Load them from their respective panels:
                    </Typography>
                    {missingFiles.map(({ file, where }, i) => (
                        <Box key={i} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                {file} --- {where}.
                            </Typography>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowMissingFilesDialog(false)}>OK</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default FileMenuBox;
