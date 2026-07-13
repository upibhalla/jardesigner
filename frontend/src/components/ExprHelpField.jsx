import React, { useMemo } from 'react';
import { Box, TextField, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { validateExpr } from '../utils/menuHelpers';

/**
 * A text field for rdesigneur distribution expression values.
 * Accepts plain numbers or muParser expressions using the builtin variables
 * p, g, L, len, dia, maxP, maxG, maxL.
 * Shows an inline error when the expression is syntactically invalid.
 * Pass a `warning` string for range/plausibility warnings on plain numeric values;
 * it is shown in amber only when there is no expression syntax error.
 */
const ExprHelpField = React.memo(({ id, label, value, onChange, helptext, warning, fullWidth = true, ...props }) => {
    const exprError = useMemo(() => validateExpr(String(value ?? '')), [value]);
    const showWarning = !exprError && !!warning;

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
                helperText={exprError || (showWarning ? warning : undefined)}
                {...(showWarning && { FormHelperTextProps: { sx: { color: 'warning.main' } } })}
            />
            <Tooltip title={helptext} placement="right">
                <IconButton size="small" sx={{ mt: '4px' }}>
                    <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
});

export default ExprHelpField;
