import React, { useRef, useEffect, useMemo } from 'react';
import { Box, Button, Typography, Slider, TextField, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReplayIcon from '@mui/icons-material/Replay';
import StopIcon from '@mui/icons-material/Stop';
import ThreeDManager from './ThreeDManager';
import { getColor } from './colormap';

const ColorBar = ({ displayConfig, entityConfig }) => {
    const gradient = useMemo(() => {
        const colormap = displayConfig?.colormap || 'jet';
        const stops = Array.from({ length: 11 }, (_, i) => {
            const value = 1 - (i / 10);
            return `${getColor(value, colormap)} ${i * 10}%`;
        }).join(', ');
        return `linear-gradient(to top, ${stops})`;
    }, [displayConfig?.colormap]);

    if (!displayConfig || !entityConfig) {
        return null;
    }

    const vmin = entityConfig.vmin ?? -0.08;
    const vmax = entityConfig.vmax ?? 0.04;

    return (
        <Box sx={{
            position: 'absolute',
            left: '16px',
            top: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'black',
            textShadow: '0 0 2px white',
            pointerEvents: 'none'
        }}>
            <Box sx={{ width: '20px', height: '150px', background: gradient, border: '1px solid black', borderRadius: '4px' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '150px' }}>
                <Typography variant="caption">{vmax.toExponential(1)}</Typography>
                <Typography variant="caption">{vmin.toExponential(1)}</Typography>
            </Box>
        </Box>
    );
};

const ThreeDViewer = ({
    isSimulating,
    threeDConfig,
    setActiveMenu,
    clickSelected,
    onSelectionChange,
    onManagerReady,
    isReplaying,
    simulationFrames,
    replayFrameIndex,
    replayInterval,
    setReplayInterval,
    onStartReplay,
    onStopReplay
}) => {
  const mountRef = useRef(null);
  const managerRef = useRef(null);

  const replayTime = simulationFrames[replayFrameIndex]?.timestamp ?? 0.0;
  const showReplayControls = !isSimulating && simulationFrames.length > 0;

  useEffect(() => {
    if (mountRef.current) {
        managerRef.current = new ThreeDManager(mountRef.current, onSelectionChange);
        if (onManagerReady) {
            onManagerReady(managerRef.current);
        }
    }
    return () => {
        managerRef.current?.dispose();
        if (onManagerReady) {
            onManagerReady(null);
        }
    };
  }, [onSelectionChange, onManagerReady]);

  useEffect(() => {
    if (managerRef.current && threeDConfig) {
      managerRef.current.buildScene(threeDConfig);
    }
  }, [threeDConfig]);

  useEffect(() => {
    if (managerRef.current) {
        managerRef.current.updateSelectionVisuals(clickSelected);
    }
  }, [clickSelected]);

  const handleUpdateClick = () => {
      if (setActiveMenu) {
          setActiveMenu(null);
      }
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #ccc', background: '#f5f5f5', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* The individual controls are now direct children to ensure even spacing */}
            <Button
                variant="contained"
                onClick={handleUpdateClick}
                startIcon={<AutoAwesomeIcon />}
            >
                Update 3D View
            </Button>

            {showReplayControls && (
                <>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={isReplaying ? onStopReplay : onStartReplay}
                        startIcon={isReplaying ? <StopIcon /> : <ReplayIcon />}
                    >
                        {isReplaying ? 'Stop' : 'Replay'}
                    </Button>
                    <TextField
                        size="small"
                        label="Replay Time (s)"
                        value={replayTime.toFixed(4)}
                        InputProps={{ readOnly: true }}
                        sx={{ width: '120px' }}
                    />
                    <Box sx={{ width: '250px', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                            Speed
                        </Typography>
                        <Tooltip title="Playback Speed (Slower -> Faster)">
                             <Slider
                                value={replayInterval}
                                onChange={(e, newValue) => setReplayInterval(newValue)}
                                aria-labelledby="replay-speed-slider"
                                valueLabelDisplay="off" // Bubble is now turned off
                                min={5}
                                max={500}
                                step={5}
                                inverted // Inverted places the max value (slowest) on the left
                            />
                        </Tooltip>
                        <Box sx={{ minWidth: '55px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px', p: '4px' }}>
                             <Typography variant="caption">{replayInterval}ms</Typography>
                        </Box>
                    </Box>
                </>
            )}
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1 }}>
            <Box ref={mountRef} sx={{ height: '100%', width: '100%', background: '#FFFFFF' }} />
            <ColorBar displayConfig={threeDConfig?.displayMoogli} entityConfig={threeDConfig?.moogli?.[0]} />
        </Box>
    </Box>
  );
};

export default ThreeDViewer;
