import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Button, Alert } from '@mui/material';

// Props: svgPlotFilename, isPlotReady, plotError
const GraphWindow = ({ svgPlotFilename, isPlotReady, plotError }) => {
  return (
    // Main container for the GraphWindow, set to take full height of its parent Grid item
    <Box
      style={{
        padding: '16px',
        background: '#e0e0e0',
        borderRadius: '8px',
        height: '100%', // Crucial for allowing children to use percentage heights
        display: 'flex', // Use flexbox to manage layout
        flexDirection: 'column', // Stack children vertically
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}> {/* Prevent title from shrinking */}
        Graph Display
      </Typography>

      {plotError && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}> {/* Prevent alert from shrinking */}
          Plot Error: {plotError}
        </Alert>
      )}

      {/* Container for the plot or placeholder message */}
      {/* This Box will grow to fill available vertical space */}
      <Box
        sx={{
          flexGrow: 1, // Allow this box to take up remaining space
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fff',
          borderRadius: '4px',
          overflow: 'hidden', // Ensure content (like oversized image before scaling) doesn't break layout
          minHeight: 200, // Minimum height for the plot area
        }}
      >
        {isPlotReady && svgPlotFilename && !plotError && (
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between', // Pushes button to bottom if card is taller than image
            }}
          >
            {/* Removed CardContent for title here, as it's above the growing box now */}
            <CardMedia
              component="img"
              alt="Simulation Plot"
              image={`http://localhost:5000/plots/${svgPlotFilename}?t=${new Date().getTime()}`} // Cache buster
              sx={{
                objectFit: 'contain', // Key for preserving aspect ratio and fitting within bounds
                maxWidth: '100%',   // Ensure image does not exceed card width
                maxHeight: '100%',  // Ensure image does not exceed card height (relative to its container)
                width: 'auto',      // Let browser determine width based on height and aspect ratio, or vice-versa
                height: 'auto',     // Let browser determine height based on width and aspect ratio
                display: 'block',   // Removes extra space below image sometimes
                margin: 'auto',     // Center the image if it's smaller than the container
                flexGrow: 1,        // Allow image container to grow if Card is flex container
                overflow: 'hidden', // In case object-fit contain needs help with parent dimensions
              }}
            />
            <CardContent sx={{ pt: 1, pb: 1, flexShrink: 0, display: 'flex', justifyContent: 'center' }}> {/* Prevent button area from shrinking */}
              <Button
                variant="outlined"
                size="small"
                href={`http://localhost:5000/plots/${svgPlotFilename}`}
                download={svgPlotFilename}
                target="_blank"
              >
                Download SVG
              </Button>
            </CardContent>
          </Card>
        )}

        {!isPlotReady && !plotError && (
          // This placeholder is now centered within the growing Box
          <Typography variant="body1" sx={{ color: '#757575' }}>
            Plot will appear here when ready.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default GraphWindow;

