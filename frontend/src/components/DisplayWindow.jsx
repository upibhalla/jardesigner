import React, { useState, memo, useCallback, useEffect, useRef } from 'react'; // Ensure useCallback is imported
import { Box, Tabs, Tab } from '@mui/material';
import GraphWindow from './GraphWindow';
import JsonText from './JsonText';
import MarkdownText from './MarkdownText';
import ThreeDViewer from './ThreeDViewer';

const MemoizedGraphWindow = memo(GraphWindow);
const MemoizedJsonText = memo(JsonText);
const MemoizedMarkdownText = memo(MarkdownText);

const DisplayWindow = (props) => {
  const {
    jsonContent,
    setActiveMenu,
    svgPlotFilename,
    isPlotReady,
    plotError,
    threeDConfigs,
    simulationFrames,
    drawableVisibility, setDrawableVisibility,
    clickSelected,
    explodeAxis,
    handleSelectionChange,
    onManagerReady,
    onExplodeAxisToggle,
    onSceneBuilt,
    handleStartReplay,
    handlePauseReplay,
    handleSeekReplay,
  } = props;

  const [tabIndex, setTabIndex] = useState(0);
  const prevThreeDConfigSetup = useRef();

  useEffect(() => {
    const hasNewSetupConfig = threeDConfigs?.setup && !prevThreeDConfigSetup.current;
    if (hasNewSetupConfig) {
      // Switch to the "Setup 3D" tab (index 3)
      setTabIndex(3);
    }
    // Keep track of the current config for the next render
    prevThreeDConfigSetup.current = threeDConfigs?.setup;
  }, [threeDConfigs?.setup]); // Dependency array watches for config changes

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // --- FIX: Wrap these state setters in useCallback ---
  const setSetupDrawableVisibility = useCallback((updater) => {
      setDrawableVisibility(prev => ({ ...prev, setup: typeof updater === 'function' ? updater(prev.setup) : updater }));
  }, [setDrawableVisibility]);

  const setRunDrawableVisibility = useCallback((updater) => {
      setDrawableVisibility(prev => ({ ...prev, run: typeof updater === 'function' ? updater(prev.run) : updater }));
  }, [setDrawableVisibility]);

  // Stable callbacks for event handlers
  const onManagerReadySetup = useCallback((manager) => onManagerReady('setup', manager), [onManagerReady]);
  const onSelectionChangeSetup = useCallback((selection, isCtrlClick) => handleSelectionChange('setup', selection, isCtrlClick), [handleSelectionChange]);
  const onExplodeAxisToggleSetup = useCallback((axis) => onExplodeAxisToggle('setup', axis), [onExplodeAxisToggle]);
  const onSceneBuiltSetup = useCallback((bbox) => onSceneBuilt('setup', bbox), [onSceneBuilt]);

  const onManagerReadyRun = useCallback((manager) => onManagerReady('run', manager), [onManagerReady]);
  const onSelectionChangeRun = useCallback((selection, isCtrlClick) => handleSelectionChange('run', selection, isCtrlClick), [handleSelectionChange]);
  const onExplodeAxisToggleRun = useCallback((axis) => onExplodeAxisToggle('run', axis), [onExplodeAxisToggle]);
  const onSceneBuiltRun = useCallback((bbox) => onSceneBuilt('run', bbox), [onSceneBuilt]);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="display window tabs">
          <Tab label="Graph" />
          <Tab label="Model JSON" />
          <Tab label="Documentation" />
          <Tab label="Setup 3D" />
          <Tab label="Run 3D" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, display: tabIndex === 0 ? 'flex' : 'none' }}>
        <MemoizedGraphWindow svgPlotFilename={svgPlotFilename} isPlotReady={isPlotReady} plotError={plotError} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 1 ? 'block' : 'none' }}>
        <MemoizedJsonText jsonString={jsonContent} setActiveMenu={setActiveMenu} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 2 ? 'block' : 'none' }}>
        <MemoizedMarkdownText />
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 3 ? 'block' : 'none', position: 'relative' }}>
        {threeDConfigs?.setup && (
            <ThreeDViewer
              {...props}
              defaultDiaScale={2.5}
              threeDConfig={threeDConfigs.setup}
              simulationFrames={simulationFrames.setup}
              drawableVisibility={drawableVisibility.setup}
              setDrawableVisibility={setSetupDrawableVisibility}
              clickSelected={clickSelected.setup}
              explodeAxis={explodeAxis.setup}
              onManagerReady={onManagerReadySetup}
              onSelectionChange={onSelectionChangeSetup}
              onExplodeAxisToggle={onExplodeAxisToggleSetup}
              onSceneBuilt={onSceneBuiltSetup}
              isReplaying={false}
              onStartReplay={() => {}}
              onPauseReplay={() => {}}
              onSeekReplay={() => {}}
            />
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 4 ? 'block' : 'none', position: 'relative' }}>
        {threeDConfigs?.run && (
            <ThreeDViewer
              {...props}
              threeDConfig={threeDConfigs.run}
              simulationFrames={simulationFrames.run}
              drawableVisibility={drawableVisibility.run}
              setDrawableVisibility={setRunDrawableVisibility}
              clickSelected={clickSelected.run}
              explodeAxis={explodeAxis.run}
              onManagerReady={onManagerReadyRun}
              onSelectionChange={onSelectionChangeRun}
              onExplodeAxisToggle={onExplodeAxisToggleRun}
              onSceneBuilt={onSceneBuiltRun}
              onStartReplay={handleStartReplay}
              onPauseReplay={handlePauseReplay}
              onSeekReplay={handleSeekReplay}
            />
        )}
      </Box>
    </Box>
  );
};

export default DisplayWindow;
