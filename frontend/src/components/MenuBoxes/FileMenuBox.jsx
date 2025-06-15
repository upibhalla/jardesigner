import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem
} from '@mui/material';

const FileMenuBox = ({ setJsonContent, onClearModel, currentConfig, getCurrentJsonData }) => {
    // State from the current version for metadata
    const [creator, setCreator] = useState('');
    const [license, setLicense] = useState('CC BY');
    const [modelNotes, setModelNotes] = useState('');

    // State from the old version for the save dialog
    const [modelFileName, setModelFileName] = useState('model');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const fileInputRef = useRef();

    // Effect to populate metadata fields from the parent component's config
    useEffect(() => {
        if (currentConfig) {
            setCreator(currentConfig.creator || '');
            setLicense(currentConfig.licence || 'CC BY');
            setModelNotes(currentConfig.modelNotes || '');
        }
    }, [currentConfig]);

    // This is the save handler from FileMenuBox27_reallyworks.jsx,
    // modified to include the metadata from the current component's state.
    const handleSaveModel = async () => {
        if (!getCurrentJsonData) {
            alert("Error: Cannot access current model data to save.");
            return;
        }

        // 1. Get the main body of the JSON from the parent component.
        const currentJsonData = getCurrentJsonData();

        // 2. Combine it with the metadata from this component's state.
        const dataToSave = {
            ...currentJsonData,
            fileinfo: {
                creator,
                licence: license,
                modelNotes,
            }
        };

        const jsonDataString = JSON.stringify(dataToSave, null, 2);
        const suggestedName = `${modelFileName || 'model'}.json`;
        const blob = new Blob([jsonDataString], { type: 'application/json' });

        // 3. Use the showSaveFilePicker API with a fallback.
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
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                }
            }
        } else {
            // Fallback for browsers that don't support the API
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = suggestedName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        }
    };

    // Kept from the current, simpler version. It correctly delegates
    // parsing and validation to the parent component.
    const handleLoadModel = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            if (setJsonContent) {
                setJsonContent(fileContent);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleConfirmClear = () => {
        if (onClearModel) {
            onClearModel();
        }
        setShowClearConfirm(false);
    };

    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            {/* === Save Model Section (Combined UI) === */}
            <Typography variant="h6" gutterBottom>Save Current Model Config</Typography>
            <Grid container spacing={1.5} sx={{ mb: 3, p: 1.5, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
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
                        label="Model Creator Name"
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
                        rows={4}
                        value={modelNotes}
                        onChange={(e) => setModelNotes(e.target.value)}
                    />
                 </Grid>
                 <Grid item xs={12}>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={handleSaveModel}
                    >
                        Save Model (.json)
                    </Button>
                </Grid>
            </Grid>

            {/* === Load Model Section === */}
            <Typography variant="h6" gutterBottom>Load Model Config</Typography>
             <Grid container spacing={1.5} sx={{ mb: 3, p: 1.5, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                 <Grid item xs={12}>
                    <Button variant="contained" fullWidth sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={() => fileInputRef.current?.click()}>
                        Load Model Config (.json)
                    </Button>
                     <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoadModel} />
                </Grid>
            </Grid>

            {/* === Clear Model Section === */}
            <Typography variant="h6" gutterBottom>Clear Model</Typography>
            <Grid container spacing={1.5} sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={() => setShowClearConfirm(true)}
                    >
                        Clear Model
                    </Button>
                </Grid>
                 {showClearConfirm && (
                    <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>Are you sure?</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Button variant="contained" color="error" fullWidth onClick={handleConfirmClear}>
                                    Yes
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button variant="contained" fullWidth sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }} onClick={() => setShowClearConfirm(false)}>
                                    No, do not clear model
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default FileMenuBox;
