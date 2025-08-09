import React from 'react';
import { Box, TextField, FormControlLabel, Switch, Typography } from '@mui/material';

const ExplodeControls = ({
    isExploded,
    onExplodeToggle,
    explodeOffset,
    onExplodeOffsetChange,
}) => {
    const handleOffsetChange = (axis) => (event) => {
        onExplodeOffsetChange(axis, event.target.value);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1 }}>
            <FormControlLabel
                control={<Switch checked={isExploded} onChange={onExplodeToggle} />}
                label={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>Explode View</Typography>}
            />
            <TextField
                label="X Offset" size="small" variant="outlined"
                value={explodeOffset.x}
                onChange={handleOffsetChange('x')}
                sx={{ width: '110px' }}
                disabled={!isExploded}
            />
            <TextField
                label="Y Offset" size="small" variant="outlined"
                value={explodeOffset.y}
                onChange={handleOffsetChange('y')}
                sx={{ width: '110px' }}
                disabled={!isExploded}
            />
            <TextField
                label="Z Offset" size="small" variant="outlined"
                value={explodeOffset.z}
                onChange={handleOffsetChange('z')}
                sx={{ width: '110px' }}
                disabled={!isExploded}
            />
        </Box>
    );
};

export default ExplodeControls;
