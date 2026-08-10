import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography, CircularProgress, Tabs, Tab, List, ListItem,
         ListItemText, ListItemSecondaryAction, Button, Chip, Stack, Alert } from '@mui/material';

const API_BASE_URL = `http://${window.location.hostname}:5000`;

const generateSlug = (text) =>
    String(text).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

const DIFFICULTY_COLORS = { beginner: 'success', intermediate: 'warning', advanced: 'error' };

function MarkdownRenderer({ markdown, scrollRef }) {
    const components = {
        h1: ({ children }) => <h1 id={generateSlug(children)}>{children}</h1>,
        h2: ({ children }) => <h2 id={generateSlug(children)}>{children}</h2>,
        h3: ({ children }) => <h3 id={generateSlug(children)}>{children}</h3>,
        h4: ({ children }) => <h4 id={generateSlug(children)}>{children}</h4>,
        h5: ({ children }) => <h5 id={generateSlug(children)}>{children}</h5>,
        h6: ({ children }) => <h6 id={generateSlug(children)}>{children}</h6>,
        a: ({ href, children }) => {
            const isInternal = href && href.startsWith('#');
            const isExternal = href && href.startsWith('http');
            const handleClick = (e) => {
                if (isInternal) {
                    e.preventDefault();
                    const id = href.slice(1);
                    const el = scrollRef?.current?.querySelector(`#${id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
            };
            return (
                <a href={href} onClick={handleClick}
                   target={isExternal ? '_blank' : undefined}
                   rel={isExternal ? 'noreferrer' : undefined}
                   style={{ color: '#1976d2' }}>
                    {children}
                </a>
            );
        },
        img: ({ src, alt }) => (
            <img src={src} alt={alt || ''} style={{ maxWidth: '100%' }} />
        ),
    };
    return (
        <Typography component="div" className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {markdown}
            </ReactMarkdown>
        </Typography>
    );
}

function GuideTab() {
    return (
        <Box sx={{ height: '100%' }}>
            <iframe src="Guide.html" style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Jardesigner Guide" />
        </Box>
    );
}

function TutorialsTab({ clientId }) {
    const [index, setIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/examples`)
            .then(r => r.json())
            .then(data => { setIndex(data); setLoading(false); })
            .catch(() => { setError('Could not load tutorial list.'); setLoading(false); });
    }, []);

    const handleLoad = useCallback((name) => {
        const url = `${window.location.origin}${window.location.pathname}?tutorial=${encodeURIComponent(name)}`;
        window.open(url, '_blank');
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ overflowY: 'auto', height: '100%', p: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            {index && index.length === 0 && <Typography color="text.secondary">No tutorials available.</Typography>}
            <List disablePadding>
                {(index || []).map(item => (
                    <ListItem key={item.name} divider alignItems="flex-start"
                              sx={{ pr: 12, py: 1 }}>
                        <ListItemText
                            primary={
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Typography variant="body1" fontWeight="medium">{item.title}</Typography>
                                    {item.difficulty && (
                                        <Chip label={item.difficulty} size="small"
                                              color={DIFFICULTY_COLORS[item.difficulty] || 'default'} />
                                    )}
                                    {(item.tags || []).map(tag => (
                                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                                    ))}
                                </Stack>
                            }
                            secondary={item.description || ''}
                        />
                        <ListItemSecondaryAction>
                            <Button size="small" variant="contained"
                                    onClick={() => handleLoad(item.name)}>
                                Load
                            </Button>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

function ModelNotesTab({ clientId, docFile }) {
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!docFile || !clientId) { setHtmlContent(''); return; }
        setLoading(true);
        fetch(`${API_BASE_URL}/session_file/${clientId}/${encodeURIComponent(docFile)}`)
            .then(r => { if (!r.ok) throw new Error(); return r.text(); })
            .then(text => { setHtmlContent(text); setLoading(false); })
            .catch(() => { setHtmlContent(''); setLoading(false); });
    }, [clientId, docFile]);

    if (!docFile) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    No model documentation attached. Upload an .html file in the File menu to add documentation to this model.
                </Typography>
            </Box>
        );
    }
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>;
    if (!htmlContent) return (
        <Box sx={{ p: 2 }}>
            <Typography color="text.secondary">Could not load model documentation.</Typography>
        </Box>
    );
    return (
        <Box sx={{ height: '100%' }}>
            <iframe
                srcDoc={htmlContent}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Model Documentation"
                sandbox="allow-same-origin"
            />
        </Box>
    );
}

const MarkdownText = ({ clientId, docFile, onLoadTutorial }) => {
    const [tab, setTab] = useState(0);

    // Auto-switch to Model Notes when a docFile appears (tutorial loaded or file uploaded)
    const prevDocFile = useRef(docFile);
    useEffect(() => {
        if (docFile && docFile !== prevDocFile.current) {
            setTab(2);
        }
        prevDocFile.current = docFile;
    }, [docFile]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 36 }}>
                <Tab label="Guide" sx={{ minHeight: 36, py: 0.5 }} />
                <Tab label="Tutorials" sx={{ minHeight: 36, py: 0.5 }} />
                <Tab label="Model Notes" sx={{ minHeight: 36, py: 0.5 }} />
            </Tabs>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {tab === 0 && <GuideTab />}
                {tab === 1 && <TutorialsTab clientId={clientId} />}
                {tab === 2 && <ModelNotesTab clientId={clientId} docFile={docFile} />}
            </Box>
        </Box>
    );
};

export default MarkdownText;
