import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, Slider, TextField, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReplayIcon from '@mui/icons-material/Replay';
import StopIcon from '@mui/icons-material/Stop';
import ThreeDManager from './ThreeDManager';
import { getColor } from './colormap';

const ColorBar = ({ displayConfig, initialEntityConfig, currentRange }) => {
    const gradient = useMemo(() => {
        const colormap = displayConfig?.colormap || 'jet';
        const stops = Array.from({ length: 11 }, (_, i) => {
            const value = 1 - (i / 10);
            return `${getColor(value, colormap)} ${i * 10}%`;
        }).join(', ');
        return `linear-gradient(to top, ${stops})`;
    }, [displayConfig?.colormap]);

    if (!displayConfig || !initialEntityConfig) {
        return null;
    }

    const vmin = currentRange.vmin !== '' ? parseFloat(currentRange.vmin) : initialEntityConfig.vmin;
    const vmax = currentRange.vmax !== '' ? parseFloat(currentRange.vmax) : initialEntityConfig.vmax;

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
  const [colorRange, setColorRange] = useState({ vmin: '', vmax: '' });

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
      // Initialize color range state from the config
      const entityConfig = threeDConfig?.moogli?.[0];
      if (entityConfig) {
          setColorRange({
              vmin: entityConfig.vmin?.toString() || '0',
              vmax: entityConfig.vmax?.toString() || '0'
          });
      }
    }
  }, [threeDConfig]);

  useEffect(() => {
    if (managerRef.current) {
        managerRef.current.updateSelectionVisuals(clickSelected);
    }
  }, [clickSelected]);

  // --- NEW: Effect to update the ThreeDManager when colorRange state changes ---
  useEffect(() => {
    if (managerRef.current && threeDConfig) {
        const vmin = parseFloat(colorRange.vmin);
        const vmax = parseFloat(colorRange.vmax);
        const groupId = threeDConfig?.drawables?.[0]?.groupId;

        if (!isNaN(vmin) && !isNaN(vmax) && groupId) {
             managerRef.current.updateColorRange(groupId, { vmin, vmax });
        }
    }
  }, [colorRange, threeDConfig]);


  const handleUpdateClick = () => {
      if (setActiveMenu) {
          setActiveMenu(null);
      }
  };
  
  // --- NEW: Autoscale logic ---
  const handleAutoscale = () => {
      if (!simulationFrames || simulationFrames.length === 0) return;
      let globalMin = Infinity;
      let globalMax = -Infinity;
      simulationFrames.forEach(frame => {
          frame.data.forEach(value => {
              if (value < globalMin) globalMin = value;
              if (value > globalMax) globalMax = value;
          });
      });
      if (isFinite(globalMin) && isFinite(globalMax)) {
           setColorRange({
              vmin: globalMin.toExponential(2),
              vmax: globalMax.toExponential(2)
          });
      }
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #ccc', background: '#f5f5f5', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant="contained" onClick={handleUpdateClick} startIcon={<AutoAwesomeIcon />}>
                    Update 3D View
                </Button>
                {/* --- NEW: Autoscale button and Vmin/Vmax fields --- */}
                {showReplayControls && (
                    <>
                        <Button variant="outlined" size="small" onClick={handleAutoscale}>Autoscale</Button>
                        <TextField
                            label="Vmin"
                            size="small"
                            variant="outlined"
                            value={colorRange.vmin}
                            onChange={(e) => setColorRange(prev => ({ ...prev, vmin: e.target.value }))}
                            sx={{ width: '100px' }}
                        />
                        <TextField
                            label="Vmax"
                            size="small"
                            variant="outlined"
                            value={colorRange.vmax}
                            onChange={(e) => setColorRange(prev => ({ ...prev, vmax: e.target.value }))}
                            sx={{ width: '100px' }}
                        />
                    </>
                )}
            </Box>

            {showReplayControls && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="outlined" size="small" onClick={isReplaying ? onStopReplay : onStartReplay} startIcon={isReplaying ? <StopIcon /> : <ReplayIcon />}>
                        {isReplaying ? 'Stop' : 'Replay'}
                    </Button>
                    <TextField size="small" label="Replay Time (s)" value={replayTime.toFixed(4)} InputProps={{ readOnly: true }} sx={{ width: '120px' }}/>
                    <Box sx={{ width: '250px', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>Speed</Typography>
                        <Tooltip title="Playback Speed (Slower -> Faster)">
                             <Slider
                                value={replayInterval}
                                onChange={(e, newValue) => setReplayInterval(newValue)}
                                aria-labelledby="replay-speed-slider"
                                valueLabelDisplay="off"
                                min={5}
                                max={500}
                                step={5}
                                inverted
                            />
                        </Tooltip>
                        <Box sx={{ minWidth: '55px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px', p: '4px' }}>
                             <Typography variant="caption">{replayInterval}ms</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1 }}>
            <Box ref={mountRef} sx={{ height: '100%', width: '100%', background: '#FFFFFF' }} />
            {/* --- MODIFIED: Pass current color range to the color bar --- */}
            <ColorBar
                displayConfig={threeDConfig?.displayMoogli}
                initialEntityConfig={threeDConfig?.moogli?.[0]}
                currentRange={colorRange}
            />
        </Box>
    </Box>
  );
};

export default ThreeDViewer;
