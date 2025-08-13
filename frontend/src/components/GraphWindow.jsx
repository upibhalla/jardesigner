import React, { memo } from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Button, Alert } from '@mui/material';
import LandingGraphic from '../assets/LandingGraphic.png';

const GraphWindow = memo(({ svgPlotFilename, isPlotReady, plotError }) => {
  return (
    <Box
      style={{
        height: '100%',
        width: '100%',
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
              image={`${svgPlotFilename}?t=${new Date().getTime()}`}
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
                href={svgPlotFilename}
                download={'plot.svg'}
                target="_blank"
              >
                Download SVG
              </Button>
            </CardContent>
          </Card>
        )}

        {!isPlotReady && !plotError && (
          <CardMedia
              component="img"
              alt="Jardesigner Landing Graphic"
              image={LandingGraphic}
              sx={{
                objectFit: 'contain',
                maxWidth: '80%',
                maxHeight: '80%',
                // FIX: Opacity removed to make the image fully visible.
              }}
            />
        )}
      </Box>
    </Box>
  );
});

export default GraphWindow;
