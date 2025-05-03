import React, { useState, useCallback, useRef, useMemo } from 'react';
import { AppBar, Toolbar, Button, Grid } from '@mui/material';
// --- Import Icons ---
import configureIcon from './assets/configure-icon.png';
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
// --- UPDATED: Use simOutput.png for the Sim Output icon ---
import simOutputIcon from './assets/simOutput.png'; // Changed from file.png

// --- Import Menu Boxes ---
// Use the modified FileMenuBox (Save/Load only) and the new SimOutputMenuBox
import FileMenuBox from './components/MenuBoxes/FileMenuBox';
import SimOutputMenuBox from './components/MenuBoxes/SimOutputMenuBox';
import ConfigureMenuBox from './components/MenuBoxes/ConfigureMenuBox';
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
// --- Import Other Components ---
import GraphWindow from './components/GraphWindow';
import DisplayWindow from './components/DisplayWindow';
import JsonText from './components/JsonText';
// --- Import Schema ---
import schema from './schema.json'; // Adjust path if necessary

// --- Initial State ---
const initialJsonData = {
  filetype: "rdesigneur",
  version: "1.0",
  modelPath: "/model",
  diffusionLength: 2e-6,
  turnOffElec: false,
  useGssa: false,
  odeMethod: "lsoda",
  verbose: false,
  combineSegments: true,
  stealCellFromLibrary: false,
  benchmark: false,
  temperature: 32,
  randseed: 1234,
  numWaveFrames: 100,
  runtime: 0.3,
  elecDt: 50e-6,
  elecPlotDt: 100e-6,
  chemDt: 0.1,
  chemPlotDt: 1.0,
  diffDt: 10e-3,
  funcDt: 100e-6,
  statusDt: 0.0,
  cellProto: {},
  passiveDistrib: [],
  spineProto: [],
  spineDistrib: [],
  chanProto: [],
  chanDistrib: [],
  chemProto: [],
  chemDistrib: [],
  adaptors: [],
  plots: [],
  files: [], // This is now managed by SimOutputMenuBox
  moogli: [],
  displayMoogli: {},
  moogliEvents: [],
  stims: []
};

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [jsonData, setJsonData] = useState(initialJsonData);
  // String state is primarily for File Load/Save now
  const [jsonContent, setJsonContent] = useState(JSON.stringify(initialJsonData, null, 2));
  const activeMenuBoxRef = useRef(null); // Keep ref for potential future use

  // --- Callbacks ---
  // Updates main JSON object state AND the string state (used by most MenuBoxes)
  const updateJsonData = useCallback((newDataPart) => {
    console.log("App.jsx: Updating jsonData with:", newDataPart);
    setJsonData(prevData => {
        const updatedData = { ...prevData, ...newDataPart };
        // Only update jsonContent string if the whole object wasn't just loaded
        if (Object.keys(newDataPart).length !== Object.keys(updatedData).length) {
             setJsonContent(JSON.stringify(updatedData, null, 2)); // Keep string in sync for display/save
        }
        return updatedData;
    });
  }, []);

  // Updates string state AND tries to update JSON object state (used by File Load)
  const updateJsonString = useCallback((newJsonString) => {
     setJsonContent(newJsonString); // Update string state immediately
     try {
         const parsedData = JSON.parse(newJsonString);
         // Validate essential structure? (Optional)
         if (typeof parsedData === 'object' && parsedData !== null) {
             setJsonData(parsedData); // Overwrite entire object state on successful load
             console.log("App.jsx: Successfully parsed and updated jsonData from loaded file.");
         } else {
            throw new Error("Loaded content is not a valid JSON object.");
         }
     } catch (e) {
         console.error("App.jsx: Error parsing loaded JSON string:", e);
         // Optionally revert string state or show error to user
         // setJsonContent(JSON.stringify(jsonData, null, 2)); // Revert to previous good state?
         alert(`Failed to load model: ${e.message}`);
     }
  }, []); // Removed jsonData dependency to avoid loops if parsing fails

  // Gets the current JSON object state (needed for File Save)
  const getCurrentJsonData = useCallback(() => {
    return jsonData;
  }, [jsonData]);

  // Toggles the active menu
  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // --- Memoized Menu Box Components ---
  // Pass necessary props, including currentConfig slices and refs if needed elsewhere
  const menuComponents = useMemo(() => ({
      File: <FileMenuBox
                ref={activeMenu === 'File' ? activeMenuBoxRef : null}
                setJsonContent={updateJsonString} // For loading file content
                getCurrentJsonData={getCurrentJsonData} // For saving file content
            />,
      SimOutput: <SimOutputMenuBox
                     ref={activeMenu === 'SimOutput' ? activeMenuBoxRef : null}
                     onConfigurationChange={updateJsonData} // Updates the 'files' part of jsonData
                     currentConfig={jsonData.files} // Pass the current 'files' array
                 />,
      Configure: <ConfigureMenuBox ref={activeMenu === 'Configure' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ diffusionLength: jsonData.diffusionLength, randseed: jsonData.randseed, temperature: jsonData.temperature, numWaveFrames: jsonData.numWaveFrames, turnOffElec: jsonData.turnOffElec, useGssa: jsonData.useGssa, verbose: jsonData.verbose, combineSegments: jsonData.combineSegments, benchmark: jsonData.benchmark, stealCellFromLibrary: jsonData.stealCellFromLibrary, modelPath: jsonData.modelPath, odeMethod: jsonData.odeMethod }} />,
      Run: <RunMenuBox ref={activeMenu === 'Run' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} getCurrentJsonData={getCurrentJsonData} currentConfig={{ runtime: jsonData.runtime, elecDt: jsonData.elecDt, elecPlotDt: jsonData.elecPlotDt, chemDt: jsonData.chemDt, chemPlotDt: jsonData.chemPlotDt, diffDt: jsonData.diffDt, funcDt: jsonData.funcDt, statusDt: jsonData.statusDt }} />,
      Morphology: <MorphoMenuBox ref={activeMenu === 'Morphology' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.cellProto} />,
      Spines: <SpineMenuBox ref={activeMenu === 'Spines' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ spineProto: jsonData.spineProto, spineDistrib: jsonData.spineDistrib }} />,
      Channels: <ElecMenuBox ref={activeMenu === 'Channels' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ chanProto: jsonData.chanProto, chanDistrib: jsonData.chanDistrib }} />,
      Passive: <PassiveMenuBox ref={activeMenu === 'Passive' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.passiveDistrib} />,
      Signaling: <ChemMenuBox ref={activeMenu === 'Signaling' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ chemProto: jsonData.chemProto, chemDistrib: jsonData.chemDistrib }} />,
      Adaptors: <AdaptorsMenuBox ref={activeMenu === 'Adaptors' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.adaptors} />,
      Stimuli: <StimMenuBox ref={activeMenu === 'Stimuli' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.stims} />,
      Plots: <PlotMenuBox ref={activeMenu === 'Plots' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.plots} />,
      '3D': <ThreeDMenuBox ref={activeMenu === '3D' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ moogli: jsonData.moogli, displayMoogli: jsonData.displayMoogli }} />,
  }), [activeMenu, jsonData, updateJsonData, updateJsonString, getCurrentJsonData]); // Dependencies


  return (
    <>
      {/* --- Menu Bar --- */}
      <AppBar position="static">
         {/* Adjust justifyContent if needed with more buttons */}
         <Toolbar style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
             {/* --- Button Order Changed: SimOutput moved to the end --- */}
             <Button color="inherit" onClick={() => toggleMenu('File')} style={{ flexDirection: 'column', color: activeMenu === 'File' ? 'orange' : 'inherit' }} > <img src={fileIcon} alt="File Icon" style={{ width: '48px', marginBottom: '4px' }} /> File </Button>
             <Button color="inherit" onClick={() => toggleMenu('Configure')} style={{ flexDirection: 'column', color: activeMenu === 'Configure' ? 'orange' : 'inherit' }} > <img src={configureIcon} alt="Configure Icon" style={{ width: '48px', marginBottom: '4px' }} /> Configure </Button>
             <Button color="inherit" onClick={() => toggleMenu('Run')} style={{ flexDirection: 'column', color: activeMenu === 'Run' ? 'orange' : 'inherit' }} > <img src={runIcon} alt="Run Icon" style={{ width: '48px', marginBottom: '4px' }} /> Run </Button>
             <Button color="inherit" onClick={() => toggleMenu('Morphology')} style={{ flexDirection: 'column', color: activeMenu === 'Morphology' ? 'orange' : 'inherit' }} > <img src={morphoIcon} alt="Morphology Icon" style={{ width: '48px', marginBottom: '4px' }} /> Morphology </Button>
             <Button color="inherit" onClick={() => toggleMenu('Spines')} style={{ flexDirection: 'column', color: activeMenu === 'Spines' ? 'orange' : 'inherit' }} > <img src={spinesIcon} alt="Spines Icon" style={{ width: '48px', marginBottom: '4px' }} /> Spines </Button>
             <Button color="inherit" onClick={() => toggleMenu('Channels')} style={{ flexDirection: 'column', color: activeMenu === 'Channels' ? 'orange' : 'inherit' }} > <img src={elecIcon} alt="Channels Icon" style={{ width: '48px', marginBottom: '4px' }} /> Channels </Button>
             <Button color="inherit" onClick={() => toggleMenu('Passive')} style={{ flexDirection: 'column', color: activeMenu === 'Passive' ? 'orange' : 'inherit' }} > <img src={passiveIcon} alt="Passive Icon" style={{ width: '48px', marginBottom: '4px' }} /> Passive </Button>
             <Button color="inherit" onClick={() => toggleMenu('Signaling')} style={{ flexDirection: 'column', color: activeMenu === 'Signaling' ? 'orange' : 'inherit' }} > <img src={chemIcon} alt="Signaling Icon" style={{ width: '48px', marginBottom: '4px' }} /> Signaling </Button>
             <Button color="inherit" onClick={() => toggleMenu('Adaptors')} style={{ flexDirection: 'column', color: activeMenu === 'Adaptors' ? 'orange' : 'inherit' }} > <img src={adaptorsIcon} alt="Adaptors Icon" style={{ width: '48px', marginBottom: '4px' }} /> Adaptors </Button>
             <Button color="inherit" onClick={() => toggleMenu('Stimuli')} style={{ flexDirection: 'column', color: activeMenu === 'Stimuli' ? 'orange' : 'inherit' }} > <img src={stimIcon} alt="Stimuli Icon" style={{ width: '48px', marginBottom: '4px' }} /> Stimuli </Button>
             <Button color="inherit" onClick={() => toggleMenu('Plots')} style={{ flexDirection: 'column', color: activeMenu === 'Plots' ? 'orange' : 'inherit' }} > <img src={plotsIcon} alt="Plots Icon" style={{ width: '48px', marginBottom: '4px' }} /> Plots </Button>
             <Button color="inherit" onClick={() => toggleMenu('3D')} style={{ flexDirection: 'column', color: activeMenu === '3D' ? 'orange' : 'inherit' }} > <img src={d3Icon} alt="3D Icon" style={{ width: '48px', marginBottom: '4px' }} /> 3D </Button>
             {/* --- Sim Output Button moved here --- */}
             <Button color="inherit" onClick={() => toggleMenu('SimOutput')} style={{ flexDirection: 'column', color: activeMenu === 'SimOutput' ? 'orange' : 'inherit' }} > <img src={simOutputIcon} alt="Sim Output Icon" style={{ width: '48px', marginBottom: '4px' }} /> Sim Output </Button>
         </Toolbar>
      </AppBar>

      {/* --- Main Content --- */}
      <Grid container spacing={2} style={{ padding: '16px' }}>
        {/* Menu Box Area */}
        <Grid item xs={4}>
          {/* Render the active menu component based on the updated map */}
          {activeMenu && menuComponents[activeMenu]}
        </Grid>
         {/* Graph Window */}
        <Grid item xs={4}>
          <GraphWindow />
        </Grid>
         {/* Display Window & JSON Text */}
        <Grid item xs={4}>
          <DisplayWindow />
          {/* Pass jsonContent (derived from jsonData) for display */}
          <JsonText
             jsonString={jsonContent} // Display the string state (updated by load or other changes)
             schema={schema}
             setActiveMenu={setActiveMenu} // Still needed to close menu
          />
        </Grid>
       </Grid>
     </>
  );
};

export default App;

