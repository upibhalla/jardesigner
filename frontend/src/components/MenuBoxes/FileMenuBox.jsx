import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, TextField, MenuItem
} from '@mui/material';

const FileMenuBox = ({ setJsonContent, onClearModel, onSaveModel, currentConfig }) => {
    // States for "Save Model"
    const [creator, setCreator] = useState('');
    const [license, setLicense] = useState('CC BY');
    const [modelNotes, setModelNotes] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const fileInputRef = useRef();

    useEffect(() => {
        if (currentConfig) {
            setCreator(currentConfig.creator || '');
            setLicense(currentConfig.licence || 'CC BY');
            setModelNotes(currentConfig.modelNotes || '');
        }
    }, [currentConfig]);

    const handleSaveClick = () => {
        if (onSaveModel) {
            onSaveModel({
                creator,
                licence: license,
                modelNotes,
            });
        }
    };

    const handleLoadModel = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            try {
                // Let the parent handle parsing and validation
                if (setJsonContent) {
                    setJsonContent(fileContent);
                }
            } catch (error) {
                alert('Error reading file: ' + error.message);
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
        setShowClearConfirm(false); // Hide confirmation after action
    };

    return (
        <Box style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            {/* === Save Model Section === */}
            <Typography variant="h6" gutterBottom>Save Current Model Config</Typography>
            <Grid container spacing={1.5} sx={{ mb: 3, p: 1.5, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
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
                        rows={5}
                        value={modelNotes}
                        onChange={(e) => setModelNotes(e.target.value)}
                    />
                 </Grid>
                 <Grid item xs={12}>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ bgcolor: '#e0e0e0', color: 'black', ':hover': { bgcolor: '#bdbdbd' } }}
                        onClick={handleSaveClick}
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
