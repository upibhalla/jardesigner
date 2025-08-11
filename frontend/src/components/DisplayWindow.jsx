import React, { useState, memo } from 'react';
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
    // Destructure handlers to pass them explicitly
    handleStartReplay,
    handlePauseReplay,
    handleRewindReplay,
    handleSeekReplay,
    handleExplodeAxisToggle, // New handler
    onSceneBuilt, // New handler
  } = props;

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
        <MemoizedGraphWindow svgPlotFilename={svgPlotFilename} isPlotReady={isPlotReady} plotError={plotError} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 1 ? 'block' : 'none' }}>
        <MemoizedJsonText jsonString={jsonContent} setActiveMenu={setActiveMenu} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 2 ? 'block' : 'none' }}>
        <MemoizedMarkdownText />
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabIndex === 3 ? 'block' : 'none', position: 'relative' }}>
        <ThreeDViewer
          {...props}
          // Standardize prop names passed to the final UI component
          onStartReplay={handleStartReplay}
          onPauseReplay={handlePauseReplay}
          onRewindReplay={handleRewindReplay}
          onSeekReplay={handleSeekReplay}
          onExplodeAxisToggle={handleExplodeAxisToggle}
          onSceneBuilt={onSceneBuilt}
        />
      </Box>
    </Box>
  );
};

export default DisplayWindow;
