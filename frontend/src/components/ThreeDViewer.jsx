import React, { useRef, useEffect, useMemo, useState, memo } from 'react';
import { Box, Button, Typography, TextField, FormControlLabel, Checkbox } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ThreeDManager from './ThreeDManager';
import { getColor } from './colormap';
import ReplayControls from './ReplayControls'; // Import the new component

const ColorBar = ({ displayConfig, entityConfig, currentRange }) => {
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

    const vmin = currentRange.vmin !== '' ? parseFloat(currentRange.vmin) : entityConfig.vmin;
    const vmax = currentRange.vmax !== '' ? parseFloat(currentRange.vmax) : entityConfig.vmax;

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
                <Typography variant="caption">{vmax ? vmax.toExponential(1) : 'N/A'}</Typography>
                <Typography variant="caption">{vmin ? vmin.toExponential(1) : 'N/A'}</Typography>
            </Box>
        </Box>
    );
};

// All replay props are now passed directly to ReplayControls via {...props}
const ThreeDViewer = (props) => {
  const {
    isSimulating,
    threeDConfig,
    setActiveMenu,
    clickSelected,
    onSelectionChange,
    onManagerReady,
    simulationFrames,
    drawableVisibility,
    setDrawableVisibility,
  } = props;

  const mountRef = useRef(null);
  const managerRef = useRef(null);
  const [colorRanges, setColorRanges] = useState({});
  const [displayConfig, setDisplayConfig] = useState(null);
  
  const showReplayControls = !isSimulating && simulationFrames.length > 0;
  const drawables = useMemo(() => threeDConfig?.drawables || [], [threeDConfig]);
  
  const activeDrawable = useMemo(() => {
    return drawables.find(d => drawableVisibility[d.groupId]);
  }, [drawables, drawableVisibility]);
  
  const activeColorRange = colorRanges[activeDrawable?.groupId] || { vmin: '', vmax: '' };

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
      
      const initialVisibility = {};
      const initialColorRanges = {};
      (threeDConfig?.drawables || []).forEach(d => {
          initialVisibility[d.groupId] = true;
          initialColorRanges[d.groupId] = {
              vmin: d.vmin?.toString() || '0',
              vmax: d.vmax?.toString() || '0'
          };
      });
      setDrawableVisibility(initialVisibility);
      setColorRanges(initialColorRanges);
      
      setDisplayConfig(threeDConfig);
    }
  }, [threeDConfig, setDrawableVisibility]);

  useEffect(() => {
    if (managerRef.current) {
        managerRef.current.updateSelectionVisuals(clickSelected);
    }
  }, [clickSelected]);

  useEffect(() => {
    if (managerRef.current) {
        for (const groupId in colorRanges) {
            const { vmin, vmax } = colorRanges[groupId];
            const vminNum = parseFloat(vmin);
            const vmaxNum = parseFloat(vmax);
            if (!isNaN(vminNum) && !isNaN(vmaxNum)) {
                managerRef.current.updateColorRange(groupId, { vmin: vminNum, vmax: vmaxNum });
            }
        }
    }
  }, [colorRanges]);

  useEffect(() => {
      if (managerRef.current) {
          managerRef.current.setDrawableVisibility(drawableVisibility);
          managerRef.current.setActiveGroupId(activeDrawable?.groupId || null);
      }
  }, [drawableVisibility, activeDrawable]);

  const handleUpdateClick = () => {
      if (setActiveMenu) {
          setActiveMenu(null);
      }
  };
  
  const handleAutoscale = () => {
      if (!simulationFrames || simulationFrames.length === 0 || !activeDrawable) return;
      
      const targetGroupId = activeDrawable.groupId;
      let globalMin = Infinity;
      let globalMax = -Infinity;

      simulationFrames.forEach(frame => {
          if (frame.groupId === targetGroupId) {
              frame.data.forEach(value => {
                  if (value < globalMin) globalMin = value;
                  if (value > globalMax) globalMax = value;
              });
          }
      });

      if (isFinite(globalMin) && isFinite(globalMax)) {
           setColorRanges(prev => ({
               ...prev,
               [targetGroupId]: {
                   vmin: globalMin.toExponential(2),
                   vmax: globalMax.toExponential(2)
               }
           }));
      }
  };

  const handleColorRangeChange = (key, value) => {
      if (!activeDrawable) return;
      const targetGroupId = activeDrawable.groupId;
      setColorRanges(prev => ({
          ...prev,
          [targetGroupId]: {
              ...prev[targetGroupId],
              [key]: value
          }
      }));
  };

  const handleVisibilityChange = (groupId, isChecked) => {
      setDrawableVisibility(prev => ({
          ...prev,
          [groupId]: isChecked
      }));
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #ccc', background: '#f5f5f5', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" onClick={handleUpdateClick} startIcon={<AutoAwesomeIcon />}>
                        Update 3D View
                    </Button>
                    {showReplayControls && (
                        <>
                            <Button variant="outlined" size="small" onClick={handleAutoscale} disabled={!activeDrawable}>Autoscale</Button>
                            <TextField
                                label="Vmin" size="small" variant="outlined"
                                value={activeColorRange.vmin}
                                onChange={(e) => handleColorRangeChange('vmin', e.target.value)}
                                sx={{ width: '100px' }}
                                disabled={!activeDrawable}
                            />
                            <TextField
                                label="Vmax" size="small" variant="outlined"
                                value={activeColorRange.vmax}
                                onChange={(e) => handleColorRangeChange('vmax', e.target.value)}
                                sx={{ width: '100px' }}
                                disabled={!activeDrawable}
                            />
                        </>
                    )}
                </Box>
                {/* The replay controls are now isolated and receive all needed props */}
                {showReplayControls && <ReplayControls {...props} />}
            </Box>
            {drawables.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1 }}>
                     <Typography variant="body2" sx={{fontWeight: 'bold'}}>Visible:</Typography>
                    {drawables.map(d => (
                        <FormControlLabel
                            key={d.groupId}
                            control={
                                <Checkbox
                                    checked={drawableVisibility[d.groupId] ?? true}
                                    onChange={(e) => handleVisibilityChange(d.groupId, e.target.checked)}
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">{d.title || d.groupId}</Typography>}
                        />
                    ))}
                </Box>
            )}
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1 }}>
            <Box ref={mountRef} sx={{ height: '100%', width: '100%', background: '#FFFFFF' }} />
            {((isSimulating || simulationFrames.length > 0) && activeDrawable) && (
                <ColorBar
                    displayConfig={displayConfig} 
                    entityConfig={activeDrawable}
                    currentRange={activeColorRange}
                />
            )}
        </Box>
    </Box>
  );
};

export default memo(ThreeDViewer);
