import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import GraphWindow from './GraphWindow';
import JsonText from './JsonText';
import MarkdownText from './MarkdownText';
import ThreeDViewer from './ThreeDViewer';

const DisplayWindow = ({
  jsonContent,
  schema,
  setActiveMenu,
  svgPlotFilename,
  isPlotReady,
  plotError,
  isSimulating,
  threeDConfig,
  clickSelected,
  onSelectionChange,
  onManagerReady,
  isReplaying,
  simulationFrames,
  replayInterval,
  setReplayInterval,
  onStartReplay,
  onStopReplay,
  handlePauseReplay,
  handleRewindReplay,
  handleSeekReplay,
  drawableVisibility,
  setDrawableVisibility,
  totalRuntime,
  isExploded,
  explodeOffset,
  handleExplodeToggle,
  handleExplodeOffsetChange,
}) => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="display window tabs">
          <Tab label="Graph" />
          <Tab label="Model JSON" />
          <Tab label="Documentation" />
          <Tab label="3D" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, display: tabIndex === 0 ? 'flex' : 'none' }}>
        <GraphWindow svgPlotFilename={svgPlotFilename} isPlotReady={isPlotReady} plotError={plotError} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 1 ? 'block' : 'none' }}>
        <JsonText jsonString={jsonContent} setActiveMenu={setActiveMenu} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 2 ? 'block' : 'none' }}>
        <MarkdownText />
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 3 ? 'block' : 'none', position: 'relative' }}>
        <ThreeDViewer
          isSimulating={isSimulating}
          threeDConfig={threeDConfig}
          setActiveMenu={setActiveMenu}
          clickSelected={clickSelected}
          onSelectionChange={onSelectionChange}
          onManagerReady={onManagerReady}
          isReplaying={isReplaying}
          simulationFrames={simulationFrames}
          replayInterval={replayInterval}
          setReplayInterval={setReplayInterval}
          onStartReplay={onStartReplay}
          onStopReplay={onStopReplay}
          onPauseReplay={handlePauseReplay}
          onRewindReplay={handleRewindReplay}
          onSeekReplay={handleSeekReplay}
          drawableVisibility={drawableVisibility}
          setDrawableVisibility={setDrawableVisibility}
          totalRuntime={totalRuntime}
          isExploded={isExploded}
          explodeOffset={explodeOffset}
          onExplodeToggle={handleExplodeToggle}
          onExplodeOffsetChange={handleExplodeOffsetChange}
        />
      </Box>
    </Box>
  );
};

export default DisplayWindow;
