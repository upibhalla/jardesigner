import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { AppBar, Toolbar, Button, Grid } from '@mui/material';
// --- Import Icons ---
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
import DisplayWindow from './components/DisplayWindow';
// --- Import Schema ---
import schema from './schema.json';
// --- Utility for deep comparison ---
import isEqual from 'lodash/isEqual';

// --- Initial State / Defaults ---
const initialJsonData = {
  filetype: "jardesigner",
  version: "1.0",
  fileinfo: {
      creator: "",
      modelNotes: "",
      licence: "CC BY"
  },
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

// --- Helper Functions ---

// Helper to check if two selection tuples are the same
const isSameSelection = (selA, selB) => {
    if (!selA || !selB) return false;
    return selA.entityName === selB.entityName && selA.shapeIndex === selB.shapeIndex;
};

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
                     if (!isEqual(compactedValue, defaultValue)) compacted[key] = compactedValue;
                } else if (defaultValue && typeof defaultValue === 'object' && Object.keys(defaultValue).length === 0) {
                     if (!isEqual(compactedValue, defaultValue)) compacted[key] = compactedValue;
                }
            } else if (Array.isArray(currentValue)) {
                if (currentValue.length > 0) {
                     if (!isEqual(currentValue, defaultValue)) compacted[key] = currentValue;
                }
            } else {
                if (!isEqual(currentValue, defaultValue)) compacted[key] = currentValue;
            }
        }
    }
    return compacted;
}

// This function derives the 3D config from the main jsonData ---
const generateThreeDConfig = (sourceJsonData) => {
    const { cellProto, displayMoogli: displaySettings } = sourceJsonData;

    if (!cellProto || !cellProto.type || cellProto.type === 'file') {
        // If there's no valid morphology, use the raw moogli data if it exists
        if (sourceJsonData.moogli && sourceJsonData.moogli.length > 0) {
            return {
                moogli: sourceJsonData.moogli,
                displayMoogli: sourceJsonData.displayMoogli || {}
            };
        }
        return null; // Otherwise, nothing to display
    }

    // Start with default or existing display settings
    const displayMoogli = {
        frameDt: 0.1, runtime: 0.3, colormap: "jet", center: [0, 0, 0], bg: '#FFFFFF',
        ...(displaySettings || {})
    };

    const moogli = [{
        name: 'cell', vmin: -0.08, vmax: 0.04, dt: 0.1, transparency: 0.5, shape: []
    }];

    switch (cellProto.type) {
        case 'soma':
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: cellProto.somaDia, value: 0 });
            displayMoogli.center = [0, 0, 0];
            break;
        case 'ballAndStick': {
            const { somaDia, dendLen, dendDia, dendNumSeg = 1 } = cellProto;
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: somaDia, value: 0 });

            const segLen = dendLen / dendNumSeg;
            for (let i = 0; i < dendNumSeg; i++) {
                moogli[0].shape.push({
                    type: 'cylinder',
                    C: [i * segLen, 0, 0],
                    C2: [(i + 1) * segLen, 0, 0],
                    diameter: dendDia,
                    value: 0
                });
            }
            displayMoogli.center = [dendLen / 2, 0, 0];
            break;
        }
        case 'branchedCell': {
            const { somaDia, dendLen, dendDia, dendNumSeg = 1, branchLen, branchDia, branchNumSeg = 1 } = cellProto;
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: somaDia, value: 0 });

            // Subdivide trunk
            const trunkSegLen = dendLen / dendNumSeg;
            for (let i = 0; i < dendNumSeg; i++) {
                moogli[0].shape.push({ type: 'cylinder', C: [i * trunkSegLen, 0, 0], C2: [(i + 1) * trunkSegLen, 0, 0], diameter: dendDia, value: 0 });
            }

            // Define branch vectors
            const trunkEnd = [dendLen, 0, 0];
            const angle = Math.PI / 4;
            const branch1End = [trunkEnd[0] + branchLen * Math.cos(angle), trunkEnd[1] + branchLen * Math.sin(angle), 0];
            const branch2End = [trunkEnd[0] + branchLen * Math.cos(-angle), trunkEnd[1] + branchLen * Math.sin(-angle), 0];
            const branch1Vec = [branch1End[0] - trunkEnd[0], branch1End[1] - trunkEnd[1], 0];
            const branch2Vec = [branch2End[0] - trunkEnd[0], branch2End[1] - trunkEnd[1], 0];

            // Subdivide branches
            for (let i = 0; i < branchNumSeg; i++) {
                const frac_start = i / branchNumSeg;
                const frac_end = (i + 1) / branchNumSeg;
                
                // Branch 1 segments
                const seg1Start = [trunkEnd[0] + branch1Vec[0] * frac_start, trunkEnd[1] + branch1Vec[1] * frac_start, 0];
                const seg1End = [trunkEnd[0] + branch1Vec[0] * frac_end, trunkEnd[1] + branch1Vec[1] * frac_end, 0];
                moogli[0].shape.push({ type: 'cylinder', C: seg1Start, C2: seg1End, diameter: branchDia, value: 0 });

                // Branch 2 segments
                const seg2Start = [trunkEnd[0] + branch2Vec[0] * frac_start, trunkEnd[1] + branch2Vec[1] * frac_start, 0];
                const seg2End = [trunkEnd[0] + branch2Vec[0] * frac_end, trunkEnd[1] + branch2Vec[1] * frac_end, 0];
                moogli[0].shape.push({ type: 'cylinder', C: seg2Start, C2: seg2End, diameter: branchDia, value: 0 });
            }
            displayMoogli.center = [dendLen / 2, 0, 0];
            break;
        }
        default: return null;
    }
    return { moogli, displayMoogli };
};

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [jsonData, setJsonData] = useState(initialJsonData);
  const [jsonContent, setJsonContent] = useState(() => JSON.stringify(compactJsonData(initialJsonData, initialJsonData), null, 2));
  const activeMenuBoxRef = useRef(null);
  const [threeDConfig, setThreeDConfig] = useState(null);
  const [svgPlotFilename, setSvgPlotFilename] = useState(null);
  const [isPlotReady, setIsPlotReady] = useState(false);
  const [plotError, setPlotError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [clickSelected, setClickSelected] = useState([]);

  const handleSelectionChange = useCallback((selection, isCtrlClick) => {
    setClickSelected(prevSelected => {
        if (isCtrlClick) {
            // Control-click: Toggle selection
            const isAlreadySelected = prevSelected.some(item => isSameSelection(item, selection));
            if (isAlreadySelected) {
                return prevSelected.filter(item => !isSameSelection(item, selection));
            } else {
                return [...prevSelected, selection];
            }
        } else {
            // Regular click: Single selection logic
            if (prevSelected.length === 1 && isSameSelection(prevSelected[0], selection)) {
                return []; // Deselect if clicking the same one again
            } else {
                return [selection]; // Select the new one
            }
        }
    });
  }, []);

  // updateJsonData simply updates the main jsonData state.
  const updateJsonData = useCallback((newDataPart) => {
    setJsonData(prevData => {
        const updatedData = { ...prevData, ...newDataPart };
        setJsonContent(JSON.stringify(compactJsonData(updatedData, initialJsonData), null, 2));
        return updatedData;
    });
  }, []);

  // This useEffect hook watches jsonData and derives threeDConfig from it.
  useEffect(() => {
      const newThreeDConfig = generateThreeDConfig(jsonData);
      setThreeDConfig(newThreeDConfig);
  }, [jsonData]);

  const updateJsonString = useCallback((newJsonString) => {
     setJsonContent(newJsonString);
     try {
         const parsedData = JSON.parse(newJsonString);
         if (typeof parsedData === 'object' && parsedData !== null) {
             const mergedData = { ...initialJsonData, ...parsedData, filetype: parsedData.filetype || initialJsonData.filetype, version: parsedData.version || initialJsonData.version, fileinfo: { ...initialJsonData.fileinfo, ...(parsedData.fileinfo || {}) } };
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

  const handleSaveModel = useCallback(async (fileInfoFromMenu) => {
      const fullFileInfo = { ...fileInfoFromMenu, dateTime: new Date().toISOString(), userid: 'anonymous' };
      const dataToSave = { ...jsonData, fileinfo: fullFileInfo };
      const finalJsonToSave = compactJsonData(dataToSave, initialJsonData);
      const jsonDataString = JSON.stringify(finalJsonToSave, null, 2);
      const suggestedName = 'model.json';
      const blob = new Blob([jsonDataString], { type: 'application/json' });
      if (window.showSaveFilePicker) {
          try {
              const fileHandle = await window.showSaveFilePicker({ suggestedName, types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }] });
              const writableStream = await fileHandle.createWritable();
              await writableStream.write(blob);
              await writableStream.close();
          } catch (err) {
              if (err.name !== 'AbortError') console.error('Error saving file:', err);
          }
      } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = suggestedName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(link.href), 100);
      }
  }, [jsonData]);

  const getCurrentJsonData = useCallback(() => compactJsonData(jsonData, initialJsonData), [jsonData]);

  const getChemProtos = useCallback(() => {
      const protos = jsonData?.chemProto;
      if (Array.isArray(protos)) {
          return protos.map(proto => proto?.name).filter(name => name && typeof name === 'string' && name.trim() !== '');
      }
      return [];
  }, [jsonData?.chemProto]);

  const handlePlotDataUpdate = useCallback(({ filename, ready, error }) => {
    console.log("App.jsx: handlePlotDataUpdate called with:", { filename, ready, error });
    setSvgPlotFilename(filename);
    setIsPlotReady(ready);
    setPlotError(error || '');
  }, []);

  const clearPlotData = useCallback(() => {
    console.log("App.jsx: clearPlotData called");
    setSvgPlotFilename(null);
    setIsPlotReady(false);
    setPlotError('');
  }, []);

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // --- Memoized Menu Box Components (remains the same) ---
  const menuComponents = useMemo(() => ({
      File: <FileMenuBox ref={activeMenu === 'File' ? activeMenuBoxRef : null} setJsonContent={updateJsonString} onClearModel={handleClearModel} getCurrentJsonData={getCurrentJsonData} currentConfig={jsonData.fileinfo} />,
      SimOutput: <SimOutputMenuBox ref={activeMenu === 'SimOutput' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.files} getChemProtos={getChemProtos} />,
      Run: <RunMenuBox ref={activeMenu === 'Run' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} getCurrentJsonData={getCurrentJsonData} currentConfig={{...jsonData}} onPlotDataUpdate={handlePlotDataUpdate} onClearPlotData={clearPlotData} />,
      Morphology: <MorphoMenuBox ref={activeMenu === 'Morphology' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.cellProto} />,
      Spines: <SpineMenuBox ref={activeMenu === 'Spines' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ spineProto: jsonData.spineProto, spineDistrib: jsonData.spineDistrib }} />,
      Channels: <ElecMenuBox ref={activeMenu === 'Channels' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ chanProto: jsonData.chanProto, chanDistrib: jsonData.chanDistrib }} />,
      Passive: <PassiveMenuBox ref={activeMenu === 'Passive' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.passiveDistrib} />,
      Signaling: <ChemMenuBox ref={activeMenu === 'Signaling' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ chemProto: jsonData.chemProto, chemDistrib: jsonData.chemDistrib }} getChemProtos={getChemProtos} />,
      Adaptors: <AdaptorsMenuBox ref={activeMenu === 'Adaptors' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.adaptors} />,
      Stimuli: <StimMenuBox ref={activeMenu === 'Stimuli' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.stims} getChemProtos={getChemProtos} />,
      Plots: <PlotMenuBox ref={activeMenu === 'Plots' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={jsonData.plots} getChemProtos={getChemProtos} />,
      '3D': <ThreeDMenuBox ref={activeMenu === '3D' ? activeMenuBoxRef : null} onConfigurationChange={updateJsonData} currentConfig={{ moogli: jsonData.moogli, displayMoogli: jsonData.displayMoogli }} getChemProtos={getChemProtos} />,
  }), [activeMenu, jsonData, updateJsonString, getChemProtos, handlePlotDataUpdate, clearPlotData, handleClearModel, handleSaveModel, updateJsonData]);

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

      <Grid container spacing={2} style={{ padding: '16px', height: 'calc(100vh - 64px)' }}>
        <Grid item xs={4} style={{ height: '100%' }}>
          {activeMenu && menuComponents[activeMenu]}
        </Grid>
        
        <Grid item xs={8} style={{ height: '100%' }}>
          <DisplayWindow
             jsonString={jsonContent}
             schema={schema}
             setActiveMenu={setActiveMenu}
             svgPlotFilename={svgPlotFilename}
             isPlotReady={isPlotReady}
             plotError={plotError}
             isSimulating={isSimulating}
             threeDConfig={threeDConfig}
             clickSelected={clickSelected}
             onSelectionChange={handleSelectionChange}
          />
        </Grid>
       </Grid>
     </>
  );
};

export default App;
