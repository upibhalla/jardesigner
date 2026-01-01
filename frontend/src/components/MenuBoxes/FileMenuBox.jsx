import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Importing logos
import jardesLogo from '../../assets/jardes_logo.png';
import mooseLogo from '../../assets/moose_logo.png';

const FileMenuBox = ({ setJsonContent, currentConfig, getCurrentJsonData }) => {
    // --- Metadata State ---
    const [creator, setCreator] = useState('');
    const [license, setLicense] = useState('CC BY');
    const [modelNotes, setModelNotes] = useState('');
    const [lastModified, setLastModified] = useState('');
    const [modelFileName, setModelFileName] = useState('model');

    // --- Dialog State ---
    const [showAboutJardesigner, setShowAboutJardesigner] = useState(false);
    const [showAboutMoose, setShowAboutMoose] = useState(false);

    const fileInputRef = useRef();

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
    };

    const handleLoadModel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Fix #3: Set Suggested File Name from opened file (removing extension)
        const nameWithoutExt = file.name.replace(/\.json$/i, "");
        setModelFileName(nameWithoutExt);

        const fileSystemTime = new Date(file.lastModified).toLocaleString();

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            try {
                const parsed = JSON.parse(fileContent);
                
                const jsonTime = parsed.fileinfo?.dateTime;
                const displayTime = jsonTime || fileSystemTime || new Date().toLocaleString();
                
                setLastModified(displayTime);

                if (setJsonContent) {
                    setJsonContent(fileContent);
                }
            } catch (err) {
                console.error("Error parsing JSON:", err);
                alert("Failed to load model file.");
            }
        };
        reader.readAsText(file);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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

        // Fix #4: Removed root-level dateTime, ensuring it only goes into fileinfo
        const dataToSave = {
            ...currentJsonData,
            fileinfo: {
                ...currentJsonData.fileinfo, // Preserve existing fileinfo if any
                creator,
                licence: license,
                modelNotes,
                dateTime: currentTime // Only valid location
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
                    {/* Fix #1: Logo max size increased to 300px (2x larger) */}
                    <img src={logo} alt={`${title} Logo`} style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }} />
                </Box>
                <Box component="ul" sx={{ pl: 2 }}>
                    {content.map((item, index) => (
                        <li key={index} style={{ marginBottom: '12px' }}>
                            {/* Fix #2: Increased font size by ~30% (body1 + custom rem) */}
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
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Open Model
                    </Button>
                    <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoadModel} />
                </Grid>

                <MenuButton label="Open Tutorial" onClick={() => {}} /> 
                <MenuButton label="Save Model" onClick={handleSaveModel} />
                <MenuButton label="Download Project" onClick={() => {}} /> 
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
                {/* Fix #5: Quit button background is now standard grey, text remains red */}
                <MenuButton 
                    label="Quit" 
                    onClick={handleQuit} 
                    sx={{ 
                        color: '#c62828', // Red text
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

        </Box>
    );
};

export default FileMenuBox;
