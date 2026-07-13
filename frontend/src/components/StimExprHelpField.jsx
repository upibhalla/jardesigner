import React, { useMemo } from 'react';
import { Box, TextField, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { validateStimExpr } from '../utils/menuHelpers';

/**
 * A text field for rdesigneur stimulus expressions.
 * The only allowed variable is t (time in seconds).
 * Shows an inline error when the expression is syntactically invalid.
 */
const StimExprHelpField = React.memo(({ id, label, value, onChange, helptext, fullWidth = true, ...props }) => {
    const exprError = useMemo(() => validateStimExpr(String(value ?? '')), [value]);

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
                {...props}
                fullWidth={fullWidth}
                size="small"
                label={label}
                variant="outlined"
                value={value}
                onChange={(e) => onChange(id, e.target.value)}
                error={!!exprError}
                helperText={exprError || undefined}
            />
            <Tooltip title={helptext} placement="right">
                <IconButton size="small" sx={{ mt: '4px' }}>
                    <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
});

export default StimExprHelpField;
