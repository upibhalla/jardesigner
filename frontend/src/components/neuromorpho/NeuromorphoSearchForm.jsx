import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Box, Button, Autocomplete, TextField,
    CircularProgress, TablePagination, Typography,
} from '@mui/material';

const PRIORITY_SPECIES = ['rat', 'mouse'];

function sortSpecies(list) {
    return [...list].sort((a, b) => {
        const ai = PRIORITY_SPECIES.indexOf(a.toLowerCase());
        const bi = PRIORITY_SPECIES.indexOf(b.toLowerCase());
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
    });
}

function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

const toItem = (n) => ({
    id:              `nm_${n.neuron_id}`,
    name:            n.neuron_name,
    source:          `NeuroMorpho/${n.archive || ''}`,
    description:     [n.species, n.brain_region, n.cell_type].filter(Boolean).join(' '),
    source_type:     'swc',
    topTen:          false,
    server_file:     `nm_${n.neuron_id}`,
    staged_filename: `nm_${n.neuron_id}`,
    ...(n.note || n.reference ? {
        details: {
            ...(n.note      && { full_description: n.note }),
            ...(n.reference && { references: [{ text: n.reference, url: n.doi || '' }] }),
        },
    } : {}),
});

export default function NeuromorphoSearchForm({ onResults, footerEl, baseUrl = 'http://localhost:5000' }) {
    // Search bar state
    const [species, setSpecies]           = useState(null);
    const [brainRegion, setBrainRegion]   = useState(null);
    const [cellType, setCellType]         = useState(null);
    const [archive, setArchive]           = useState(null);
    const [speciesList, setSpeciesList]   = useState([]);
    const [metaOpts, setMetaOpts]         = useState({ brain_region: [], cell_type: [], archive: [], cell_types_by_region: {} });
    const [metaLoading, setMetaLoading]   = useState(false);

    const cellTypeOptions = brainRegion
        ? (metaOpts.cell_types_by_region[brainRegion] || [])
        : metaOpts.cell_type;

    // Results state
    const [searching, setSearching] = useState(false);
    const [error, setError]         = useState(null);
    const [page, setPage]           = useState(0);
    const [pageSize, setPageSize]   = useState(DEFAULT_PAGE_SIZE);
    const [rowCount, setRowCount]   = useState(0);
    const lastQuery = useRef(null);

    useEffect(() => {
        fetch(`${baseUrl}/neuromorpho/`)
            .then(r => r.json())
            .then(d => setSpeciesList(sortSpecies(d.species || [])))
            .catch(console.error);
    }, [baseUrl]);

    useEffect(() => {
        if (!species) {
            setMetaOpts({ brain_region: [], cell_type: [], archive: [], cell_types_by_region: {} });
            setBrainRegion(null); setCellType(null); setArchive(null);
            return;
        }
        setMetaLoading(true);
        fetch(`${baseUrl}/neuromorpho/metadata?species=${encodeURIComponent(species)}`)
            .then(r => r.ok ? r.json() : r.json().then(d => { throw new Error(d.error || `HTTP ${r.status}`); }))
            .then(d => {
                setMetaOpts({
                    brain_region: d.brain_region || [],
                    cell_type: d.cell_type || [],
                    archive: d.archive || [],
                    cell_types_by_region: d.cell_types_by_region || {},
                });
                setBrainRegion(null); setCellType(null); setArchive(null);
            })
            .catch(e => { console.error('metadata fetch failed:', e.message); setMetaOpts({ brain_region: [], cell_type: [], archive: [], cell_types_by_region: {} }); })
            .finally(() => setMetaLoading(false));
    }, [species, baseUrl]);

    const handleBrainRegionChange = (_, val) => {
        setBrainRegion(val);
        const validTypes = val ? (metaOpts.cell_types_by_region[val] || []) : metaOpts.cell_type;
        if (cellType && !validTypes.includes(cellType)) setCellType(null);
    };

    const _fetchPage = async (query, pg, pgSize, { showSpinner = false } = {}) => {
        if (showSpinner) setSearching(true);
        setError(null);
        try {
            const resp = await fetch(`${baseUrl}/neuromorpho/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...query, page: pg, size: pgSize }),
            });
            if (!resp.ok) throw new Error('Search failed');
            const data = await resp.json();
            setRowCount(data.page?.totalElements || 0);
            setPage(pg);
            onResults((data.neurons || []).map(toItem));
        } catch (e) {
            setError(e.message);
            setRowCount(0);
            onResults([]);
        } finally {
            if (showSpinner) setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!species) { setError('Please select a species.'); return; }
        const query = { species, brain_region: brainRegion || '', cell_type: cellType || '', archive: archive || '' };
        lastQuery.current = query;
        await _fetchPage(query, 0, pageSize, { showSpinner: true });
    };

    const handlePageChange = async (_, newPage) => {
        if (lastQuery.current) await _fetchPage(lastQuery.current, newPage, pageSize);
    };

    const handleRowsPerPageChange = async (e) => {
        const newSize = parseInt(e.target.value, 10);
        setPageSize(newSize);
        if (lastQuery.current) await _fetchPage(lastQuery.current, 0, newSize);
    };

    const pagination = rowCount > 0 && (
        <TablePagination
            component="div"
            count={rowCount}
            page={page}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{ borderTop: '1px solid #e0e0e0' }}
        />
    );

    return (
        <>
            <Box>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Autocomplete
                            size="small" sx={{ width: 200 }}
                            options={speciesList}
                            value={species}
                            onChange={(_, val) => setSpecies(val)}
                            getOptionLabel={toTitleCase}
                            disabled={searching}
                            renderInput={(params) => <TextField {...params} label="Species" size="small" variant="outlined" />}
                        />
                        {species && (
                            <Autocomplete
                                size="small" sx={{ width: 200 }}
                                options={metaOpts.brain_region}
                                value={brainRegion}
                                onChange={handleBrainRegionChange}
                                disabled={searching || metaLoading}
                                loading={metaLoading}
                                renderInput={(params) => (
                                    <TextField {...params} label="Brain Region" size="small" variant="outlined"
                                        InputProps={{ ...params.InputProps, endAdornment: (<>{metaLoading ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}{params.InputProps.endAdornment}</>) }}
                                    />
                                )}
                            />
                        )}
                        {species && (
                            <Autocomplete
                                size="small" sx={{ width: 200 }}
                                options={cellTypeOptions}
                                value={cellType}
                                onChange={(_, val) => setCellType(val)}
                                disabled={searching || metaLoading}
                                loading={metaLoading}
                                renderInput={(params) => <TextField {...params} label="Cell Type" size="small" variant="outlined" />}
                            />
                        )}
                        {species && (
                            <Autocomplete
                                size="small" sx={{ width: 160 }}
                                options={metaOpts.archive}
                                value={archive}
                                onChange={(_, val) => setArchive(val)}
                                disabled={searching || metaLoading}
                                loading={metaLoading}
                                renderInput={(params) => <TextField {...params} label="Archive" size="small" variant="outlined" />}
                            />
                        )}
                        <Button size="small" type="submit" variant="contained" disabled={searching || !species}>
                            Search
                        </Button>
                    </Box>
                </form>
                {error && <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>{error}</Typography>}
            </Box>
            {footerEl && pagination && createPortal(pagination, footerEl)}
        </>
    );
}
