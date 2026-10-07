import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { AppBar, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, Box, Tooltip, IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import runIcon from './assets/run.svg';
import morphoIcon from './assets/morpho.svg';
import spinesIcon from './assets/spines.svg';
import elecIcon from './assets/chan.svg';
import passiveIcon from './assets/passive.svg';
import chemIcon from './assets/chem.svg';
import adaptorsIcon from './assets/adaptors.svg';
import plotsIcon from './assets/plots.svg';
import stimIcon from './assets/stim.svg';
import d3Icon from './assets/3D.svg';
import fileIcon from './assets/file.svg';
import simOutputIcon from './assets/simOutput.svg';
import FileMenuBox from './components/MenuBoxes/FileMenuBox';
import SimOutputMenuBox from './components/MenuBoxes/SimOutputMenuBox';
import RunMenuBox from './components/MenuBoxes/RunMenuBox';
import MorphoMenuBox from './components/MenuBoxes/MorphoMenuBox';
import SpineMenuBox from './components/MenuBoxes/SpineMenuBox';
import ChanMenuBox from './components/MenuBoxes/ChanMenuBox';
import PassiveMenuBox from './components/MenuBoxes/PassiveMenuBox';
import ChemMenuBox from './components/MenuBoxes/ChemMenuBox';
import AdaptorsMenuBox from './components/MenuBoxes/AdaptorsMenuBox';
import PlotMenuBox from './components/MenuBoxes/PlotMenuBox';
import ThreeDMenuBox from './components/MenuBoxes/ThreeDMenuBox';
import StimMenuBox from './components/MenuBoxes/StimMenuBox';
import DisplayWindow from './components/DisplayWindow';
import { ReplayContext } from './components/ReplayContext';

const MENU_ITEMS = [
  { key: 'File',      icon: fileIcon,      label: 'File'       },
  { key: 'Run',       icon: runIcon,       label: 'Run'        },
  { key: 'Morphology',icon: morphoIcon,    label: 'Morphology' },
  { key: 'Spines',    icon: spinesIcon,    label: 'Spines'     },
  { key: 'Channels',  icon: elecIcon,      label: 'Channels'   },
  { key: 'Passive',   icon: passiveIcon,   label: 'Passive'    },
  { key: 'Signaling', icon: chemIcon,      label: 'Signaling'  },
  { key: 'Adaptors',  icon: adaptorsIcon,  label: 'Adaptors'   },
  { key: 'Stimuli',   icon: stimIcon,      label: 'Stimuli'    },
  { key: 'Plots',     icon: plotsIcon,     label: 'Plots'      },
  { key: '3D',        icon: d3Icon,        label: '3D'         },
  { key: 'SimOutput', icon: simOutputIcon, label: 'Sim Output' },
];

// --- Helper: Analyze Error Message ---
const analyzeError = (error) => {
  if (!error) return { mean: null, do: null };
  
  const msg = error.message || "";
  const details = error.details || "";
  const fullText = (msg + " " + details);
  const lowerText = fullText.toLowerCase();

  // Define fallback response for "Any other error"
  const fallback = {
      mean: "We haven't noticed this one yet",
      do: "File a bug report. We'll fix it or put in a better explanation"
  };

  // 1. Check for C++ allocation failure (std:bad_alloc)
  if (lowerText.includes("std:bad_alloc") || lowerText.includes("std::bad_alloc")) {
    return {
      mean: "Congratulations! You have crashed the C++ code. Quite possibly you have removed a prototype channel after already using it in the channel distribution, or have renamed it",
      do: "Check that your prototype list matches the channels or other objects made from them. If this doesn't help, file bug report."
    };
  }

  // 2. Check for "invalid parser state"
  if (lowerText.includes("invalid parser state")) {
    return {
      mean: "You have made a mistake in a stimulus expression",
      do: "Check your stimulus expressions."
    };
  }

  // 3. Check for "relpath"
  if (lowerText.includes("relpath")) {
    return {
      mean: "You have selected a field which is not present on an electrical compartment. It probably is a field of a channel or Ca_conc object",
      do: "Check your stimuli, plots and so on to see if you have mistakenly selected the wrong field."
    };
  }

  // 4. Check for "list index out of range"
  if (lowerText.includes("list index out of range")) {
    if (fullText.includes("parentDendName")) {
      return {
        mean: "You have entered the wrong string for naming a dendrite or soma compartment",
        do: "Check the allowed paths for compartments by clicking on the desired part of the cell in Setup 3D."
      };
    }
    // Override: If list index is out of range but NOT parentDendName, 
    // we return fallback immediately.
    return fallback;
  }
  
  // 5. Check for "Failed to find field" AND "on dest" (New Case)
  if (lowerText.includes("failed to find field") && lowerText.includes("on dest")) {
    return {
        mean: "Possibly incorrect index for a molecule.",
        do: "Check that the range is OK. Check that you put it in square brackets like [0]"
    };
  }

  // 6. Check for "jardesigner.py" line number (Standard Base Code Error)
  if (fullText.includes("jardesigner.py") && lowerText.includes("line ")) {
    return {
      mean: "Error in jardesigner base code",
      do: "File bug report with jardesigner team"
    };
  }

  // 7. Fallback for any other error
  return fallback;
};

export const AppLayout = (props) => {
  const {
    activeMenu,
    toggleMenu,
    jsonData,
    updateJsonData,
    updateJsonString,
    handleClearModel,
    getCurrentJsonData,
    getChemProtos,
    handleStartRun,
    handleResetRun,
    handleBuildAndStartRun,
    handleStopRun,
    setRunParameters,
    isSimulating,
    activeSim,
    liveFrameData,
    isReplaying,
    handleMorphologyFileChange,
    replayTime,
    clientId,
    clickSelected,
    threeDConfigs,
    meshMolsData,
    simError,     
    setSimError,
    elecPaths,
    spinePaths,
    setWarnedAboutMissing,
    handleLoadTutorial,
    modelDirty,
    handleRebuildModel,
    activeMenuFlushRef,
    toggleColorMode,
    colorMode,
  } = props;

  // Extract channel names for use in Plots, Stimuli, and Adaptors.
  // Two sources are merged:
  //   1. jsonData.chanProto — channels the user explicitly defined in the model config.
  //   2. Scene graph drawables with title "chan_*" — includes spine receptor channels
  //      (AMPAR, NMDAR, Ca_conc) registered by the engine with visible=false. These
  //      must be included for relpath selection regardless of their display visibility.
  const channelPrototypes = useMemo(() => {
    const fromConfig = jsonData.chanProto?.map(p => p.name).filter(Boolean) || [];
    const setupDrawables = threeDConfigs?.['setup']?.drawables || [];
    const fromScene = setupDrawables
      .filter(d => d.title?.startsWith('chan_'))
      .map(d => d.title.slice(5))  // strip "chan_" prefix to get the prototype name
      .filter(Boolean);
    return [...new Set([...fromConfig, ...fromScene])];
  }, [jsonData.chanProto, threeDConfigs]);

  const menuComponents = useMemo(() => ({
    File: <FileMenuBox setJsonContent={updateJsonString} onClearModel={handleClearModel} getCurrentJsonData={getCurrentJsonData} currentConfig={jsonData.fileinfo} clientId={clientId} onMissingFilesWarned={setWarnedAboutMissing} updateJsonData={updateJsonData} />,
    SimOutput: <SimOutputMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={jsonData.files}
        getChemProtos={getChemProtos}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        flushRef={activeMenuFlushRef}
    />,
    Run: <RunMenuBox
      onConfigurationChange={updateJsonData}
      setRunParameters={setRunParameters}
      currentConfig={{ ...jsonData }}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onBuildAndStartRun={handleBuildAndStartRun}
      onStopRun={handleStopRun}
      isSimulating={isSimulating}
      activeSimPid={activeSim.pid}
      liveFrameData={liveFrameData}
      isReplaying={isReplaying}
      modelDirty={modelDirty}
      flushRef={activeMenuFlushRef}
    />,
    Morphology: <MorphoMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={jsonData.cellProto}
        onFileChange={handleMorphologyFileChange}
        clientId={clientId}
        setupThreeDConfig={threeDConfigs?.setup}
        flushRef={activeMenuFlushRef}
    />,
    Spines: <SpineMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={{ spineProto: jsonData.spineProto, spineDistrib: jsonData.spineDistrib }}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        cellProto={jsonData.cellProto}
        flushRef={activeMenuFlushRef}
    />,
    Channels: <ChanMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={{ chanProto: jsonData.chanProto, chanDistrib: jsonData.chanDistrib }}
        clientId={clientId}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        cellProto={jsonData.cellProto}
        flushRef={activeMenuFlushRef}
    />,
    Passive: <PassiveMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={jsonData.passiveDistrib}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        cellProto={jsonData.cellProto}
        flushRef={activeMenuFlushRef}
    />,
    Signaling: <ChemMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={{ chemProto: jsonData.chemProto, chemDistrib: jsonData.chemDistrib }}
        getChemProtos={getChemProtos}
        clientId={clientId}
        meshMols={meshMolsData?.setup}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        flushRef={activeMenuFlushRef}
    />,
    Adaptors: <AdaptorsMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={jsonData.adaptors}
        meshMols={meshMolsData?.setup}
        channelPrototypes={channelPrototypes}
        flushRef={activeMenuFlushRef}
    />,
    Stimuli: <StimMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={jsonData.stims}
        meshMols={meshMolsData?.setup}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        channelPrototypes={channelPrototypes}
        cellProto={jsonData.cellProto}
        flushRef={activeMenuFlushRef}
    />,
    Plots: <PlotMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={jsonData.plots}
        meshMols={meshMolsData?.setup}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        channelPrototypes={channelPrototypes}
        stims={jsonData.stims}
        flushRef={activeMenuFlushRef}
    />,
    '3D': <ThreeDMenuBox
        onConfigurationChange={updateJsonData}
        currentConfig={{ moogli: jsonData.moogli, displayMoogli: jsonData.displayMoogli }}
        meshMols={meshMolsData?.setup}
        elecPaths={elecPaths}
        spinePaths={spinePaths}
        channelPrototypes={channelPrototypes}
        flushRef={activeMenuFlushRef}
    />,
  }), [
    jsonData, updateJsonData, updateJsonString, handleClearModel, getCurrentJsonData, getChemProtos,
    handleStartRun, handleResetRun,
    isSimulating, activeSim.pid, liveFrameData, isReplaying,
    handleMorphologyFileChange, 
    clientId,
    threeDConfigs,
    meshMolsData,
    elecPaths, 
    spinePaths,
    channelPrototypes,
    modelDirty,
  ]);

  const errorAnalysis = useMemo(() => analyzeError(simError), [simError]);

  // Resizable panel split
  const [splitPct, setSplitPct] = useState(33);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const containerRef = useRef(null);

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isResizingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(18, Math.min(58, pct)));
  }, []);

  const onMouseUp = useCallback(() => {
    isResizingRef.current = false;
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <ReplayContext.Provider value={{ replayTime }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppBar position="static">
          <Tabs
            value={activeMenu || false}
            onChange={(_, newValue) => newValue !== activeMenu && toggleMenu(newValue)}
            variant="fullWidth"
            TabIndicatorProps={{
              sx: { backgroundColor: 'warning.main', height: '2.5px' },
            }}
            sx={{ minHeight: 'auto' }}
          >
            {MENU_ITEMS.map(({ key, icon, label }) => (
              <Tab
                key={key}
                value={key}
                label={label}
                icon={<Box component="img" src={icon} alt="" sx={{ width: 72, height: 72, display: 'block' }} />}
                iconPosition="top"
                onClick={() => activeMenu === key && toggleMenu(key)}
                sx={{
                  minWidth: 56,
                  minHeight: 'auto',
                  py: 0.75,
                  px: 1.5,
                  borderRadius: 0,
                  color: 'common.white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&.Mui-selected': { color: 'warning.main', fontWeight: 800 },
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.10)', color: 'common.white' },
                }}
              />
            ))}
          </Tabs>
        </AppBar>

        <Box ref={containerRef} sx={{ flex: 1, overflow: 'hidden', display: 'flex', userSelect: isResizing ? 'none' : 'auto' }}>
          {/* Left panel — width controlled by splitPct */}
          <Box sx={{
            width: activeMenu ? `${splitPct}%` : 0,
            minWidth: 0,
            height: '100%',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            flexShrink: 0,
            transition: isResizing ? 'none' : 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {activeMenu && menuComponents[activeMenu]}
          </Box>

          {/* Drag handle */}
          {activeMenu && (
            <Box
              onMouseDown={onDividerMouseDown}
              sx={{
                width: '4px',
                flexShrink: 0,
                cursor: 'col-resize',
                bgcolor: 'divider',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'primary.main' },
              }}
            />
          )}

          {/* Right panel */}
          <Box sx={{ flex: 1, height: '100%', bgcolor: 'background.paper', minWidth: 0 }}>
            <DisplayWindow
              {...props}
              docFile={jsonData.docFile}
              onLoadTutorial={handleLoadTutorial}
            />
          </Box>
        </Box>

        {/* Floating dark/light mode toggle */}
        <Tooltip title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} placement="left">
          <IconButton
            onClick={toggleColorMode}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
              width: 48,
              height: 48,
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 4,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover', boxShadow: 6 },
              transition: 'all 0.2s ease',
            }}
          >
            {colorMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Dialog */}
      <Dialog
        open={!!simError}
        onClose={() => setSimError(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Simulation Error</DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ mb: 2, fontWeight: 'bold' }}>
                {simError?.message}
            </DialogContentText>
            {simError?.details && (
                <Box
                    component="pre"
                    sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        bgcolor: 'action.hover',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1.5,
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        maxHeight: 280,
                        overflow: 'auto',
                        m: 0,
                    }}
                >
                    {simError.details}
                </Box>
            )}

            {/* Analysis Sections */}
            {errorAnalysis.mean && (
                <Box sx={{ mt: 3, mb: 1 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        What does it mean?
                    </Typography>
                    <Typography variant="body1">
                        {errorAnalysis.mean}
                    </Typography>
                </Box>
            )}

            {errorAnalysis.do && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        What should I do?
                    </Typography>
                    <Typography variant="body1">
                        {errorAnalysis.do}
                    </Typography>
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setSimError(null)} variant="contained" color="primary">
                Close
            </Button>
        </DialogActions>
      </Dialog>
    </ReplayContext.Provider>
  );
};