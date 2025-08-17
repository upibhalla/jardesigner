import React, { useMemo } from 'react';
import { AppBar, Toolbar, Button, Grid } from '@mui/material';
import runIcon from './assets/run.png';
import morphoIcon from './assets/morpho.png';
import spinesIcon from './assets/spines.png';
import elecIcon from './assets/chan.png';
import passiveIcon from './assets/passive.png';
import chemIcon from './assets/chem.png';
import adaptorsIcon from './assets/adaptors.png';
import plotsIcon from './assets/plots.png';
import stimIcon from './assets/stim.png';
import d3Icon from './assets/3D.png';
import fileIcon from './assets/file.png';
import simOutputIcon from './assets/simOutput.png';
import FileMenuBox from './components/MenuBoxes/FileMenuBox';
import SimOutputMenuBox from './components/MenuBoxes/SimOutputMenuBox';
import RunMenuBox from './components/MenuBoxes/RunMenuBox';
import MorphoMenuBox from './components/MenuBoxes/MorphoMenuBox';
import SpineMenuBox from './components/MenuBoxes/SpineMenuBox';
import ElecMenuBox from './components/MenuBoxes/ElecMenuBox';
import PassiveMenuBox from './components/MenuBoxes/PassiveMenuBox';
import ChemMenuBox from './components/MenuBoxes/ChemMenuBox';
import AdaptorsMenuBox from './components/MenuBoxes/AdaptorsMenuBox';
import PlotMenuBox from './components/MenuBoxes/PlotMenuBox';
import ThreeDMenuBox from './components/MenuBoxes/ThreeDMenuBox';
import StimMenuBox from './components/MenuBoxes/StimMenuBox';
import DisplayWindow from './components/DisplayWindow';
import { ReplayContext } from './components/ReplayContext';

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
    isSimulating,
    activeSim,
    liveFrameData,
    isReplaying,
    handleMorphologyFileChange,
    replayTime,
    clientId,
    clickSelected,
  } = props;


  const menuComponents = useMemo(() => ({
    File: <FileMenuBox setJsonContent={updateJsonString} onClearModel={handleClearModel} getCurrentJsonData={getCurrentJsonData} currentConfig={jsonData.fileinfo} />,
    SimOutput: <SimOutputMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.files} getChemProtos={getChemProtos} />,
    Run: <RunMenuBox
      onConfigurationChange={updateJsonData}
      currentConfig={{ ...jsonData }}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      isSimulating={isSimulating}
      activeSimPid={activeSim.pid}
      liveFrameData={liveFrameData}
      isReplaying={isReplaying}
    />,
    Morphology: <MorphoMenuBox 
        onConfigurationChange={updateJsonData} 
        currentConfig={jsonData.cellProto} 
        onFileChange={handleMorphologyFileChange} 
        clientId={clientId} 
    />,
    Spines: <SpineMenuBox onConfigurationChange={updateJsonData} currentConfig={{ spineProto: jsonData.spineProto, spineDistrib: jsonData.spineDistrib }} />,
    // FIX: Pass the clientId prop to ElecMenuBox
    Channels: <ElecMenuBox 
        onConfigurationChange={updateJsonData} 
        currentConfig={{ chanProto: jsonData.chanProto, chanDistrib: jsonData.chanDistrib }} 
        clientId={clientId}
    />,
    Passive: <PassiveMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.passiveDistrib} />,
    Signaling: <ChemMenuBox 
        onConfigurationChange={updateJsonData} 
        currentConfig={{ chemProto: jsonData.chemProto, chemDistrib: jsonData.chemDistrib }} 
        getChemProtos={getChemProtos} 
        clientId={clientId}
    />,
    Adaptors: <AdaptorsMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.adaptors} />,
    Stimuli: <StimMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.stims} getChemProtos={getChemProtos} />,
    Plots: <PlotMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.plots} getChemProtos={getChemProtos} />,
    '3D': <ThreeDMenuBox onConfigurationChange={updateJsonData} currentConfig={{ moogli: jsonData.moogli, displayMoogli: jsonData.displayMoogli }} getChemProtos={getChemProtos} />,
  }), [
    jsonData, updateJsonData, updateJsonString, handleClearModel, getCurrentJsonData, getChemProtos,
    handleStartRun, handleResetRun, isSimulating, activeSim.pid, liveFrameData, isReplaying,
    handleMorphologyFileChange, 
    clientId
  ]);

  return (
    <ReplayContext.Provider value={{ replayTime }}>
      <AppBar position="static">
        <Toolbar style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            <Button color="inherit" onClick={() => toggleMenu('File')} style={{ flexDirection: 'column', color: activeMenu === 'File' ? 'orange' : 'inherit' }} >
                <img src={fileIcon} alt="File Icon" style={{ width: '72px', marginBottom: '4px' }} />
                File
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Run')} style={{ flexDirection: 'column', color: activeMenu === 'Run' ? 'orange' : 'inherit' }} >
                <img src={runIcon} alt="Run Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Run
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Morphology')} style={{ flexDirection: 'column', color: activeMenu === 'Morphology' ? 'orange' : 'inherit' }} >
                <img src={morphoIcon} alt="Morphology Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Morphology
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Spines')} style={{ flexDirection: 'column', color: activeMenu === 'Spines' ? 'orange' : 'inherit' }} >
                <img src={spinesIcon} alt="Spines Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Spines
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Channels')} style={{ flexDirection: 'column', color: activeMenu === 'Channels' ? 'orange' : 'inherit' }} >
                <img src={elecIcon} alt="Channels Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Channels
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Passive')} style={{ flexDirection: 'column', color: activeMenu === 'Passive' ? 'orange' : 'inherit' }} >
                <img src={passiveIcon} alt="Passive Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Passive
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Signaling')} style={{ flexDirection: 'column', color: activeMenu === 'Signaling' ? 'orange' : 'inherit' }} >
                <img src={chemIcon} alt="Signaling Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Signaling
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Adaptors')} style={{ flexDirection: 'column', color: activeMenu === 'Adaptors' ? 'orange' : 'inherit' }} >
                <img src={adaptorsIcon} alt="Adaptors Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Adaptors
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Stimuli')} style={{ flexDirection: 'column', color: activeMenu === 'Stimuli' ? 'orange' : 'inherit' }} >
                <img src={stimIcon} alt="Stimuli Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Stimuli
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('Plots')} style={{ flexDirection: 'column', color: activeMenu === 'Plots' ? 'orange' : 'inherit' }} >
                <img src={plotsIcon} alt="Plots Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Plots
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('3D')} style={{ flexDirection: 'column', color: activeMenu === '3D' ? 'orange' : 'inherit' }} >
                <img src={d3Icon} alt="3D Icon" style={{ width: '72px', marginBottom: '4px' }} />
                3D
            </Button>
            <Button color="inherit" onClick={() => toggleMenu('SimOutput')} style={{ flexDirection: 'column', color: activeMenu === 'SimOutput' ? 'orange' : 'inherit' }} >
                <img src={simOutputIcon} alt="Sim Output Icon" style={{ width: '72px', marginBottom: '4px' }} />
                Sim Output
            </Button>
        </Toolbar>
      </AppBar>

      <Grid container spacing={2} style={{ padding: '16px', height: 'calc(100vh - 64px)' }}>
        <Grid item xs={4} style={{ height: '100%' }}>
          {activeMenu && menuComponents[activeMenu]}
        </Grid>
        <Grid item xs={8} style={{ height: '100%' }}>
          <DisplayWindow
            {...props}
          />
        </Grid>
      </Grid>
    </ReplayContext.Provider>
  );
};
