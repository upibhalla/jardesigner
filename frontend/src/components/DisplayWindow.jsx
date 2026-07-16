import React, { useState, memo, useCallback, useEffect, useRef } from 'react'; 
import { Box, Tabs, Tab, Button } from '@mui/material';
import GraphWindow from './GraphWindow';
import JsonText from './JsonText';
import MarkdownText from './MarkdownText';
import ThreeDViewer from './ThreeDViewer';
import ReactionGraph from './ReactionGraph'; 

const MemoizedGraphWindow = memo(GraphWindow);
const MemoizedJsonText = memo(JsonText);
const MemoizedMarkdownText = memo(MarkdownText);
const MemoizedReactionGraph = memo(ReactionGraph);

const DisplayWindow = (props) => {
  const {
    jsonContent,
    jsonData,
    setActiveMenu,
    plotDataUrl,
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
    clientId,
    isSimulating,
    reactionGraphs,
    docFile,
    onLoadTutorial,
    modelDirty,
    handleRebuildModel,
  } = props;

  // ... (Keep all existing hooks/logic exactly as is) ...
  const [tabIndex, setTabIndex] = useState(0);
  const prevThreeDConfigSetup = useRef();
  const prevIsSimulating = useRef(false);
  const prevDocFile = useRef(docFile);

  useEffect(() => {
    const hasNewSetupConfig = threeDConfigs?.setup && !prevThreeDConfigSetup.current;
    if (hasNewSetupConfig && tabIndex !== 2) {
      const hasPlots = jsonData?.plots?.length > 0;
      setTabIndex(hasPlots ? 0 : 3);
    }
    prevThreeDConfigSetup.current = threeDConfigs?.setup;
  }, [threeDConfigs?.setup, tabIndex, jsonData?.plots?.length]);

  // Switch to Documentation tab when a docFile first appears (tutorial loaded or doc uploaded).
  useEffect(() => {
    if (docFile && docFile !== prevDocFile.current) {
      setTabIndex(2);
    }
    prevDocFile.current = docFile;
  }, [docFile]);

  // When a run starts: Graph → Run 3D → Setup 3D.
  useEffect(() => {
    if (!prevIsSimulating.current && isSimulating) {
      const hasPlots = jsonData?.plots?.length > 0;
      const hasRunThreeD = jsonData?.moogli?.length > 0;
      setTabIndex(hasPlots ? 0 : hasRunThreeD ? 4 : 3);
    }
    prevIsSimulating.current = isSimulating;
  }, [isSimulating, jsonData?.plots?.length, jsonData?.moogli?.length]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  const setSetupDrawableVisibility = useCallback((updater) => {
      setDrawableVisibility(prev => ({ ...prev, setup: typeof updater === 'function' ? updater(prev.setup) : updater }));
  }, [setDrawableVisibility]);

  const setRunDrawableVisibility = useCallback((updater) => {
      setDrawableVisibility(prev => ({ ...prev, run: typeof updater === 'function' ? updater(prev.run) : updater }));
  }, [setDrawableVisibility]);

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
          <Tab label="Reaction Graph" />
        </Tabs>
      </Box>

      {/* ... (Keep existing TabPanels 0-4) ... */}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, display: tabIndex === 0 ? 'flex' : 'none' }}>
        <MemoizedGraphWindow plotDataUrl={plotDataUrl} isPlotReady={isPlotReady} plotError={plotError} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 1 ? 'block' : 'none' }}>
        <MemoizedJsonText jsonString={jsonContent} setActiveMenu={setActiveMenu} />
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 2 ? 'flex' : 'none', flexDirection: 'column' }}>
        <MemoizedMarkdownText clientId={clientId} docFile={docFile} onLoadTutorial={onLoadTutorial} />
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 3 ? 'flex' : 'none', flexDirection: 'column', position: 'relative' }}>
         <Box sx={{ px: 1, py: 0.5, flexShrink: 0, display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
           <Button size="small" variant="contained" onClick={handleRebuildModel}
             sx={{ bgcolor: modelDirty ? 'warning.main' : undefined, '&:hover': { bgcolor: modelDirty ? 'warning.dark' : undefined } }}>
             Rebuild
           </Button>
         </Box>
         <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
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
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 4 ? 'flex' : 'none', flexDirection: 'column', position: 'relative' }}>
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

      {/* 2. REACTION GRAPH PANEL (Tab Index 5) */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 5 ? 'flex' : 'none', flexDirection: 'column', position: 'relative' }}>
         <Box sx={{ p: 0.5, flexShrink: 0 }}>
           <Button size="small" variant="contained" disabled={!modelDirty} onClick={handleRebuildModel}
             sx={{ bgcolor: modelDirty ? 'warning.main' : undefined, '&:hover': { bgcolor: modelDirty ? 'warning.dark' : undefined } }}>
             Rebuild
           </Button>
         </Box>
         <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
           <MemoizedReactionGraph graphData={reactionGraphs?.setup} />
         </Box>
      </Box>
    </Box>
  );
};

export default DisplayWindow;
