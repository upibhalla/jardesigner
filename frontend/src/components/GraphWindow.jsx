import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Button, Alert } from '@mui/material';

const GraphWindow = ({ svgPlotFilename, isPlotReady, plotError }) => {
  return (
    // MODIFIED: Removed padding, background, and borderRadius to fit nicely in a tab panel.
    // The parent (DisplayWindow) now controls the padding.
    <Box
      style={{
        height: '100%',
        width: '100%', // Ensure it fills the parent tab panel
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Graph Display
      </Typography>

      {plotError && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          Plot Error: {plotError}
        </Alert>
      )}

      {/* Container for the plot or placeholder message */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fff',
          borderRadius: '4px',
          overflow: 'hidden',
          minHeight: 200,
        }}
      >
        {isPlotReady && svgPlotFilename && !plotError && (
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <CardMedia
              component="img"
              alt="Simulation Plot"
              image={`/api/plots/${svgPlotFilename}?t=${new Date().getTime()}`} // Cache buster
              sx={{
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                display: 'block',
                margin: 'auto',
                flexGrow: 1,
                overflow: 'hidden',
              }}
            />
            <CardContent sx={{ pt: 1, pb: 1, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                href={`/api/plots/${svgPlotFilename}`}
                download={svgPlotFilename}
                target="_blank"
              >
                Download SVG
              </Button>
            </CardContent>
          </Card>
        )}

        {!isPlotReady && !plotError && (
          <Typography variant="body1" sx={{ color: '#757575' }}>
            Plot will appear here when ready.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default GraphWindow;
