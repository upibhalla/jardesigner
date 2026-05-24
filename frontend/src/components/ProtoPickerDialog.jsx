import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Button, TextField, Select, MenuItem, FormControl, InputLabel,
    Table, TableHead, TableBody, TableRow, TableCell,
    IconButton, Typography, Box, CircularProgress, Tooltip, Chip,
} from '@mui/material';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const DB_OPTIONS = {
    morpho: ['Local', 'NeuroMorpho'],
    chan:   ['Local', 'ModelDB', 'NeuroML-DB'],
    chem:   ['Local', 'BioModels', 'DOQCS'],
};

const UPLOAD_ACCEPT = {
    morpho: '.swc,.p,.xml',
    chan:   '.xml',
    chem:   '.xml,.g',
};

const sourceTypeFromFile = (filename, type) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (type === 'chem') return ext === 'g' ? 'kkit' : 'sbml';
    if (type === 'chan') return 'neuroml';
    return 'file';
};

// --- Detail renderer: data-source-specific layout ---
const DetailRenderer = ({ item, detail }) => {
    const d = detail || {};
    return (
        <Box>
            <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={item.source_type} size="small" />
                {item.builtin_fn && (
                    <Chip label={item.builtin_fn} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                )}
            </Box>

            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {item.description}
            </Typography>

            {d.full_description && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Description</Typography>
                    <Typography variant="body2">{d.full_description}</Typography>
                </Box>
            )}

            {d.parameters && Object.keys(d.parameters).length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Parameters</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>Value</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>Units</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(d.parameters).map(([name, info]) => (
                                <TableRow key={name}>
                                    <TableCell sx={{ py: 0.5, fontFamily: 'monospace' }}>{name}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{info.value}</TableCell>
                                    <TableCell sx={{ py: 0.5, color: 'text.secondary' }}>{info.units || ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}

            {d.image_url && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Preview</Typography>
                    <img
                        src={d.image_url}
                        alt={item.name}
                        style={{ maxWidth: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }}
                    />
                </Box>
            )}

            {d.references && d.references.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>References</Typography>
                    {d.references.map((ref, i) => (
                        <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                            {ref.text}
                            {ref.url && (
                                <> —{' '}
                                    <a href={ref.url} target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>
                                        Link
                                    </a>
                                </>
                            )}
                        </Typography>
                    ))}
                </Box>
            )}

            {d.notes && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Notes</Typography>
                    <Typography variant="body2">{d.notes}</Typography>
                </Box>
            )}

            {!d.full_description && !d.parameters && !d.references && !d.notes && !d.image_url && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    No additional details available.
                </Typography>
            )}
        </Box>
    );
};

// --- Individual table row ---
const ProtoRow = React.memo(({ item, onSelect, onDetail, isDetailOpen, isTopTen }) => (
    <TableRow
        sx={{
            bgcolor: isTopTen ? '#fffde7' : 'inherit',
            '&:hover': { bgcolor: isTopTen ? '#fff9c4' : '#f5f5f5' },
        }}
    >
        <TableCell sx={{ py: 0.5, pl: 1, pr: 0, width: 44 }}>
            <Tooltip title="Select this prototype (single click)">
                <IconButton size="small" color="primary" onClick={() => onSelect(item)}>
                    <KeyboardReturnIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </TableCell>
        <TableCell
            sx={{ py: 0.5, fontWeight: isTopTen ? 600 : 400, cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
            onClick={() => onSelect(item)}
        >
            {item.name}
        </TableCell>
        <TableCell sx={{ py: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>{item.source}</TableCell>
        <TableCell sx={{ py: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>{item.description}</TableCell>
        <TableCell sx={{ py: 0.5, pr: 1, pl: 0, width: 44 }}>
            <Tooltip title="Show details">
                <IconButton
                    size="small"
                    color={isDetailOpen ? 'primary' : 'default'}
                    onClick={() => onDetail(item)}
                >
                    <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </TableCell>
    </TableRow>
));

// --- Section header row ---
const SectionHeaderRow = ({ label, count }) => (
    <TableRow>
        <TableCell
            colSpan={5}
            sx={{ py: 0.5, bgcolor: '#f5f5f5', borderBottom: 'none', userSelect: 'none' }}
        >
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>
                {label}{count != null ? ` (${count})` : ''}
            </Typography>
        </TableCell>
    </TableRow>
);

const TopTenHeaderRow = () => (
    <TableRow>
        <TableCell
            colSpan={5}
            sx={{ py: 0.5, bgcolor: '#fff8e1', borderBottom: 'none', userSelect: 'none' }}
        >
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                ★ Top 10
            </Typography>
        </TableCell>
    </TableRow>
);

// --- Main dialog ---
const ProtoPickerDialog = ({ open, onClose, onSelect, type, title, clientId }) => {
    const [digest, setDigest] = useState([]);
    const [loading, setLoading] = useState(false);
    const [staging, setStaging] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDb, setSelectedDb] = useState('Local');
    const [searchResults, setSearchResults] = useState(null);
    const [detailItem, setDetailItem] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const uploadInputRef = useRef(null);

    const baseUrl = `http://${window.location.hostname}:5000`;

    useEffect(() => {
        if (!open || !type) return;
        setLoading(true);
        setSearchResults(null);
        setDetailItem(null);
        setDetailData(null);
        setSearchQuery('');
        fetch(`${baseUrl}/proto_digest/${type}`)
            .then(r => r.json())
            .then(data => setDigest(data.items || []))
            .catch(err => console.error('Failed to load proto digest:', err))
            .finally(() => setLoading(false));
    }, [open, type]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        setLoading(true);
        try {
            const url = `${baseUrl}/proto_search/${type}?q=${encodeURIComponent(searchQuery)}&db=${encodeURIComponent(selectedDb)}`;
            const r = await fetch(url);
            const data = await r.json();
            setSearchResults(data.items || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDb, type, baseUrl]);

    const handleOpenDetail = useCallback(async (item) => {
        if (detailItem?.id === item.id) {
            setDetailItem(null);
            setDetailData(null);
            return;
        }
        setDetailItem(item);
        setDetailData(null);
        setDetailLoading(true);
        try {
            const r = await fetch(`${baseUrl}/proto_detail/${item.id}`);
            const data = await r.json();
            setDetailData(data);
        } catch (err) {
            console.error('Failed to load detail:', err);
        } finally {
            setDetailLoading(false);
        }
    }, [detailItem, baseUrl]);

    const handleSelect = useCallback(async (item) => {
        const needsStaging = item.server_file && clientId &&
            (item.source_type === 'file' || item.source_type === 'kkit' || item.source_type === 'sbml');

        if (needsStaging) {
            setStaging(true);
            try {
                const r = await fetch(`${baseUrl}/proto_stage/${item.id}/${clientId}`, { method: 'POST' });
                const data = await r.json();
                onSelect({ ...item, staged_filename: data.filename });
            } catch (err) {
                console.error('Staging failed:', err);
                onSelect(item);
            } finally {
                setStaging(false);
            }
        } else {
            onSelect(item);
        }
        onClose();
    }, [clientId, baseUrl, onSelect, onClose]);

    const handleUpload = useCallback(async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || !clientId) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);
        setUploading(true);
        try {
            const r = await fetch(`${baseUrl}/upload_file`, { method: 'POST', body: formData });
            if (!r.ok) throw new Error('Upload failed');
            const data = await r.json();
            const filename = data.filename || file.name;
            onSelect({
                id: filename,
                name: filename,
                source: 'Upload',
                description: 'Uploaded file',
                source_type: sourceTypeFromFile(filename, type),
                staged_filename: filename,
            });
            onClose();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    }, [clientId, type, baseUrl, onSelect, onClose]);

    const topTen = digest.filter(d => d.topTen);
    const allOthers = digest.filter(d => !d.topTen);
    const displayItems = searchResults !== null ? searchResults.filter(i => !i.topTen) : allOthers;
    const displayTopTen = searchResults !== null ? searchResults.filter(i => i.topTen) : topTen;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{ sx: { height: '80vh', display: 'flex', flexDirection: 'column' } }}
        >
            <DialogTitle sx={{ pb: 1, pr: 6 }}>
                {title}
                <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                <input
                    type="file"
                    ref={uploadInputRef}
                    style={{ display: 'none' }}
                    accept={UPLOAD_ACCEPT[type] || ''}
                    onChange={handleUpload}
                />
                {/* Search bar */}
                <Box sx={{ display: 'flex', gap: 1, p: 1.5, alignItems: 'center', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Database</InputLabel>
                        <Select value={selectedDb} label="Database" onChange={e => setSelectedDb(e.target.value)}>
                            {(DB_OPTIONS[type] || ['Local']).map(db => (
                                <MenuItem key={db} value={db}>{db}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={handleSearch}>
                        Search
                    </Button>
                    {searchResults !== null && (
                        <Button size="small" onClick={() => { setSearchResults(null); setSearchQuery(''); }}>
                            Clear
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={uploading || !clientId}
                    >
                        Upload…
                    </Button>
                </Box>

                {/* Table + Detail panel */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Table */}
                    <Box sx={{ flex: detailItem ? '0 0 58%' : '1 1 100%', overflow: 'auto', transition: 'flex 0.15s' }}>
                        {(loading || staging || uploading) ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
                                <CircularProgress />
                                {staging && <Typography sx={{ ml: 2 }}>Copying file…</Typography>}
                                {uploading && <Typography sx={{ ml: 2 }}>Uploading…</Typography>}
                            </Box>
                        ) : (
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: 44, bgcolor: '#fafafa' }} />
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Source</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Description</TableCell>
                                        <TableCell sx={{ width: 44, bgcolor: '#fafafa' }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayTopTen.length > 0 && (
                                        <>
                                            <TopTenHeaderRow />
                                            {displayTopTen.map(item => (
                                                <ProtoRow
                                                    key={item.id}
                                                    item={item}
                                                    onSelect={handleSelect}
                                                    onDetail={handleOpenDetail}
                                                    isDetailOpen={detailItem?.id === item.id}
                                                    isTopTen
                                                />
                                            ))}
                                        </>
                                    )}

                                    {displayItems.length > 0 && (
                                        <>
                                            <SectionHeaderRow
                                                label={searchResults !== null ? 'Search results' : 'All'}
                                                count={searchResults !== null ? displayItems.length : null}
                                            />
                                            {displayItems.map(item => (
                                                <ProtoRow
                                                    key={item.id}
                                                    item={item}
                                                    onSelect={handleSelect}
                                                    onDetail={handleOpenDetail}
                                                    isDetailOpen={detailItem?.id === item.id}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {displayTopTen.length === 0 && displayItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                                No prototypes found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Box>

                    {/* Detail panel */}
                    {detailItem && (
                        <Box sx={{ flex: '0 0 42%', borderLeft: '1px solid #e0e0e0', overflow: 'auto', p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Typography variant="h6" sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                                    {detailItem.name}
                                </Typography>
                                <IconButton size="small" onClick={() => { setDetailItem(null); setDetailData(null); }} sx={{ ml: 1, flexShrink: 0 }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            {detailLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : (
                                <DetailRenderer item={detailItem} detail={detailData} />
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ProtoPickerDialog;
