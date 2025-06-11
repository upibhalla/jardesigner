import React, { useState, useCallback, useRef, useMemo } from 'react';
import { AppBar, Toolbar, Button, Grid } from '@mui/material';
// --- Import Icons ---
// import configureIcon from './assets/configure-icon.png';
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

// --- Import Menu Boxes ---
import FileMenuBox from './components/MenuBoxes/FileMenuBox';
import SimOutputMenuBox from './components/MenuBoxes/SimOutputMenuBox';
// import ConfigureMenuBox from './components/MenuBoxes/ConfigureMenuBox';
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
// --- Utility for deep comparison ---
import isEqual from 'lodash/isEqual';

// --- Initial State / Defaults ---
const initialJsonData = {
  filetype: "jardesigner",
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
  files: [],
  moogli: [],
  displayMoogli: {},
  moogliEvents: [],
  stims: []
};

const requiredKeys = ["filetype", "version"];

// --- Compaction Function moved outside the component to avoid being a dependency ---
function compactJsonData(currentData, defaultData) {
    const compacted = {};
    for (const key in currentData) {
        if (Object.hasOwnProperty.call(currentData, key)) {
            const currentValue = currentData[key];
            const defaultValue = defaultData ? defaultData[key] : undefined;
            if (requiredKeys.includes(key)) {
                compacted[key] = currentValue;
                continue;
            }
            if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
                const compactedValue = compactJsonData(currentValue, defaultValue);
                if (Object.keys(compactedValue).length > 0) {
                     if (!isEqual(compactedValue, defaultValue)) {
                        compacted[key] = compactedValue;
                     }
                } else if (defaultValue && typeof defaultValue === 'object' && Object.keys(defaultValue).length === 0) {
                     if (!isEqual(compactedValue, defaultValue)) {
                         compacted[key] = compactedValue;
                     }
                }
            }
            else if (Array.isArray(currentValue)) {
                if (currentValue.length > 0) {
                     if (!isEqual(currentValue, defaultValue)) {
                        compacted[key] = currentValue;
                     }
                }
            }
            else {
                if (!isEqual(currentValue, defaultValue)) {
                    compacted[key] = currentValue;
                }
            }
        }
    }
    return compacted;
}


const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [jsonData, setJsonData] = useState(initialJsonData);
  const [jsonContent, setJsonContent] = useState(() => JSON.stringify(compactJsonData(initialJsonData, initialJsonData), null, 2));
  const activeMenuBoxRef = useRef(null);

  // --- State for Plot Display in GraphWindow ---
  const [svgPlotFilename, setSvgPlotFilename] = useState(null);
  const [isPlotReady, setIsPlotReady] = useState(false);
  const [plotError, setPlotError] = useState(''); // Error specific to plot generation/fetching

  // --- Callbacks for JSON data (remain mostly the same) ---
  const updateJsonData = useCallback((newDataPart) => {
    setJsonData(prevData => {
        const updatedData = { ...prevData, ...newDataPart };
        setJsonContent(JSON.stringify(compactJsonData(updatedData, initialJsonData), null, 2));
        return updatedData;
    });
  }, []);

  const updateJsonString = useCallback((newJsonString) => {
     setJsonContent(newJsonString);
     try {
         const parsedData = JSON.parse(newJsonString);
         if (typeof parsedData === 'object' && parsedData !== null) {
             const mergedData = {
                ...initialJsonData,
                ...parsedData,
                filetype: parsedData.filetype || initialJsonData.filetype,
                version: parsedData.version || initialJsonData.version
             };
             setJsonData(mergedData);
             setJsonContent(JSON.stringify(compactJsonData(mergedData, initialJsonData), null, 2));
         } else {
            throw new Error("Loaded content is not a valid JSON object.");
         }
     } catch (e) {
         console.error("App.jsx: Error parsing loaded JSON string:", e);
         alert(`Failed to load model: ${e.message}`);
     }
  }, []);

  const handleClearModel = useCallback(() => {
    setJsonData(initialJsonData);
    setJsonContent(JSON.stringify(compactJsonData(initialJsonData, initialJsonData), null, 2));
  }, []);

  const getCurrentJsonData = useCallback(() => {
    return compactJsonData(jsonData, initialJsonData);
  }, [jsonData]);

  const getChemProtos = useCallback(() => {
      const protos = jsonData?.chemProto;
      if (Array.isArray(protos)) {
          return protos.map(proto => proto?.name).filter(name => name && typeof name === 'string' && name.trim() !== '');
      }
      return [];
  }, [jsonData?.chemProto]); // Corrected dependency: jsonData.chemProto

  // --- Callback for RunMenuBox to update plot data ---
  const handlePlotDataUpdate = useCallback(({ filename, ready, error }) => {
    console.log("App.jsx: handlePlotDataUpdate called with:", { filename, ready, error });
    setSvgPlotFilename(filename);
    setIsPlotReady(ready);
    setPlotError(error || ''); // Set error or clear it
  }, []);

  // --- Callback to clear plot data (e.g., on reset) ---
  const clearPlotData = useCallback(() => {
    console.log("App.jsx: clearPlotData called");
    setSvgPlotFilename(null);
    setIsPlotReady(false);
    setPlotError('');
  }, []);


  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // Memoized Menu Box Components
  const menuComponents = useMemo(() => ({
      File: <FileMenuBox
                ref={activeMenu === 'File' ? activeMenuBoxRef : null}
                setJsonContent={updateJsonString}
                getCurrentJsonData={getCurrentJsonData}
                onClearModel={handleClearModel}
            />,
      SimOutput: <SimOutputMenuBox
                     ref={activeMenu === 'SimOutput' ? activeMenuBoxRef : null}
                     onConfigurationChange={updateJsonData}
                     currentConfig={jsonData.files}
                     getChemProtos={getChemProtos}
                 />,
	  /*
      Configure: <ConfigureMenuBox
                     ref={activeMenu === 'Configure' ? activeMenuBoxRef : null}
                     onConfigurationChange={updateJsonData} 
                     currentConfig={{ 
                         diffusionLength: jsonData.diffusionLength, 
                         randseed: jsonData.randseed, 
						temperature: jsonData.temperature, 
						numWaveFrames: jsonData.numWaveFrames, 
						turnOffElec: jsonData.turnOffElec, 
						useGssa: jsonData.useGssa, 
						verbose: jsonData.verbose, 
						combineSegments: jsonData.combineSegments, 
						benchmark: jsonData.benchmark, 
						stealCellFromLibrary: jsonData.stealCellFromLibrary, 
						modelPath: jsonData.modelPath, 
						odeMethod: jsonData.odeMethod }} 
		          />,
	  */
      Run: <RunMenuBox
             ref={activeMenu === 'Run' ? activeMenuBoxRef : null}
             onConfigurationChange={updateJsonData}
             getCurrentJsonData={getCurrentJsonData}
             currentConfig={{
                runtime: jsonData.runtime,
                elecDt: jsonData.elecDt,
                elecPlotDt: jsonData.elecPlotDt,
                chemDt: jsonData.chemDt,
                chemPlotDt: jsonData.chemPlotDt,
                diffDt: jsonData.diffDt,
                funcDt: jsonData.funcDt,
                statusDt: jsonData.statusDt,
                diffusionLength: jsonData.diffusionLength,
                randseed: jsonData.randseed,
                temperature: jsonData.temperature,
                numWaveFrames: jsonData.numWaveFrames,
                turnOffElec: jsonData.turnOffElec,
                useGssa: jsonData.useGssa,
                verbose: jsonData.verbose,
                combineSegments: jsonData.combineSegments,
                benchmark: jsonData.benchmark,
                stealCellFromLibrary: jsonData.stealCellFromLibrary,
                modelPath: jsonData.modelPath,
                odeMethod: jsonData.odeMethod
             }}
             onPlotDataUpdate={handlePlotDataUpdate}
             onClearPlotData={clearPlotData}
            />,
      Morphology: <MorphoMenuBox ref={activeMenu === 'Morphology' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.cellProto} />,
      Spines: <SpineMenuBox ref={activeMenu === 'Spines' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ spineProto: jsonData.spineProto, spineDistrib: jsonData.spineDistrib }} />,
      Channels: <ElecMenuBox ref={activeMenu === 'Channels' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ chanProto: jsonData.chanProto, chanDistrib: jsonData.chanDistrib }} />,
      Passive: <PassiveMenuBox ref={activeMenu === 'Passive' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.passiveDistrib} />,
      Signaling: <ChemMenuBox
                     ref={activeMenu === 'Signaling' ? activeMenuBoxRef : null}
                     onConfigurationChange={updateJsonData}
                     currentConfig={{ chemProto: jsonData.chemProto, chemDistrib: jsonData.chemDistrib }}
                     getChemProtos={getChemProtos}
                 />,
      Adaptors: <AdaptorsMenuBox ref={activeMenu === 'Adaptors' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.adaptors} />,
      Stimuli: <StimMenuBox
                   ref={activeMenu === 'Stimuli' ? activeMenuBoxRef : null}
                   onConfigurationChange={updateJsonData}
                   currentConfig={jsonData.stims}
                   getChemProtos={getChemProtos}
               />,
      Plots: <PlotMenuBox
                 ref={activeMenu === 'Plots' ? activeMenuBoxRef : null}
                 onConfigurationChange={updateJsonData}
                 currentConfig={jsonData.plots}
                 getChemProtos={getChemProtos}
             />,
      '3D': <ThreeDMenuBox
                ref={activeMenu === '3D' ? activeMenuBoxRef : null}
                onConfigurationChange={updateJsonData}
                currentConfig={{ moogli: jsonData.moogli, displayMoogli: jsonData.displayMoogli }}
                getChemProtos={getChemProtos}
            />,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeMenu, jsonData, updateJsonData, updateJsonString, getCurrentJsonData, getChemProtos, handlePlotDataUpdate, clearPlotData, handleClearModel]);


  return (
    <>
      <AppBar position="static">
         <Toolbar style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
             <Button color="inherit" onClick={() => toggleMenu('File')} style={{ flexDirection: 'column', color: activeMenu === 'File' ? 'orange' : 'inherit' }} > <img src={fileIcon} alt="File Icon" style={{ width: '72px', marginBottom: '4px' }} /> File </Button>
             <Button color="inherit" onClick={() => toggleMenu('Run')} style={{ flexDirection: 'column', color: activeMenu === 'Run' ? 'orange' : 'inherit' }} > <img src={runIcon} alt="Run Icon" style={{ width: '72px', marginBottom: '4px' }} /> Run </Button>
             <Button color="inherit" onClick={() => toggleMenu('Morphology')} style={{ flexDirection: 'column', color: activeMenu === 'Morphology' ? 'orange' : 'inherit' }} > <img src={morphoIcon} alt="Morphology Icon" style={{ width: '72px', marginBottom: '4px' }} /> Morphology </Button>
             <Button color="inherit" onClick={() => toggleMenu('Spines')} style={{ flexDirection: 'column', color: activeMenu === 'Spines' ? 'orange' : 'inherit' }} > <img src={spinesIcon} alt="Spines Icon" style={{ width: '72px', marginBottom: '4px' }} /> Spines </Button>
             <Button color="inherit" onClick={() => toggleMenu('Channels')} style={{ flexDirection: 'column', color: activeMenu === 'Channels' ? 'orange' : 'inherit' }} > <img src={elecIcon} alt="Channels Icon" style={{ width: '72px', marginBottom: '4px' }} /> Channels </Button>
             <Button color="inherit" onClick={() => toggleMenu('Passive')} style={{ flexDirection: 'column', color: activeMenu === 'Passive' ? 'orange' : 'inherit' }} > <img src={passiveIcon} alt="Passive Icon" style={{ width: '72px', marginBottom: '4px' }} /> Passive </Button>
             <Button color="inherit" onClick={() => toggleMenu('Signaling')} style={{ flexDirection: 'column', color: activeMenu === 'Signaling' ? 'orange' : 'inherit' }} > <img src={chemIcon} alt="Signaling Icon" style={{ width: '72px', marginBottom: '4px' }} /> Signaling </Button>
             <Button color="inherit" onClick={() => toggleMenu('Adaptors')} style={{ flexDirection: 'column', color: activeMenu === 'Adaptors' ? 'orange' : 'inherit' }} > <img src={adaptorsIcon} alt="Adaptors Icon" style={{ width: '72px', marginBottom: '4px' }} /> Adaptors </Button>
             <Button color="inherit" onClick={() => toggleMenu('Stimuli')} style={{ flexDirection: 'column', color: activeMenu === 'Stimuli' ? 'orange' : 'inherit' }} > <img src={stimIcon} alt="Stimuli Icon" style={{ width: '72px', marginBottom: '4px' }} /> Stimuli </Button>
             <Button color="inherit" onClick={() => toggleMenu('Plots')} style={{ flexDirection: 'column', color: activeMenu === 'Plots' ? 'orange' : 'inherit' }} > <img src={plotsIcon} alt="Plots Icon" style={{ width: '72px', marginBottom: '4px' }} /> Plots </Button>
             <Button color="inherit" onClick={() => toggleMenu('3D')} style={{ flexDirection: 'column', color: activeMenu === '3D' ? 'orange' : 'inherit' }} > <img src={d3Icon} alt="3D Icon" style={{ width: '72px', marginBottom: '4px' }} /> 3D </Button>
             <Button color="inherit" onClick={() => toggleMenu('SimOutput')} style={{ flexDirection: 'column', color: activeMenu === 'SimOutput' ? 'orange' : 'inherit' }} > <img src={simOutputIcon} alt="Sim Output Icon" style={{ width: '72px', marginBottom: '4px' }} /> Sim Output </Button>
         </Toolbar>
      </AppBar>

      <Grid container spacing={2} style={{ padding: '16px' }}>
        <Grid item xs={4}>
          {activeMenu && menuComponents[activeMenu]}
        </Grid>
        <Grid item xs={4}>
          {/* Pass plot data to GraphWindow */}
          <GraphWindow
            svgPlotFilename={svgPlotFilename}
            isPlotReady={isPlotReady}
            plotError={plotError}
          />
        </Grid>
        <Grid item xs={4}>
          <DisplayWindow />
          <JsonText
             jsonString={jsonContent}
             schema={schema}
             setActiveMenu={setActiveMenu}
          />
        </Grid>
       </Grid>
     </>
  );
};

export default App;
