import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import GraphWindow from './GraphWindow';
import JsonText from './JsonText';
import MarkdownText from './MarkdownText';
import ThreeDViewer from './ThreeDViewer';

const DisplayWindow = ({
  jsonString,
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
  replayFrameIndex,
  replayInterval,
  setReplayInterval,
  onStartReplay,
  onStopReplay,
  // --- ADDED: Receive visibility props to pass down ---
  drawableVisibility,
  setDrawableVisibility,
  replayTime,
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

      {/* Graph Panel */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, display: tabIndex === 0 ? 'flex' : 'none' }}>
        <GraphWindow svgPlotFilename={svgPlotFilename} isPlotReady={isPlotReady} plotError={plotError} />
      </Box>

      {/* JSON Panel */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 1 ? 'block' : 'none' }}>
        <JsonText
          jsonString={jsonString}
          setActiveMenu={setActiveMenu}
        />
      </Box>

      {/* Markdown Panel */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 2 ? 'block' : 'none' }}>
        <MarkdownText />
      </Box>

      {/* 3D Viewer Panel */}
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
            replayFrameIndex={replayFrameIndex}
            replayInterval={replayInterval}
            setReplayInterval={setReplayInterval}
            onStartReplay={onStartReplay}
            onStopReplay={onStopReplay}
            // --- ADDED: Pass visibility props to the viewer ---
            drawableVisibility={drawableVisibility}
            setDrawableVisibility={setDrawableVisibility}
            replayTime={replayTime}
        />
      </Box>
    </Box>
  );
};

export default DisplayWindow;

