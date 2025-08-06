import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';
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
  fileinfo: { creator: "", modelNotes: "", licence: "CC BY" },
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

// --- CONSTANTS ---
const API_BASE_URL = 'http://localhost:5000';


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

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [jsonData, setJsonData] = useState(initialJsonData);
  const [jsonContent, setJsonContent] = useState(() => JSON.stringify(compactJsonData(initialJsonData, initialJsonData), null, 2));
  const [threeDConfig, setThreeDConfig] = useState(null);
  const [svgPlotFilename, setSvgPlotFilename] = useState(null);
  const [isPlotReady, setIsPlotReady] = useState(false);
  const [plotError, setPlotError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [clickSelected, setClickSelected] = useState([]);
  
  const [clientId] = useState(() => uuidv4());

  const [activeSim, setActiveSim] = useState({ pid: null, data_channel_id: null, svg_filename: null });
  const [liveFrameData, setLiveFrameData] = useState(null);
  const socketRef = useRef(null);

  // --- FIX: Use a ref to hold the current sim state to avoid stale closures ---
  const activeSimRef = useRef(activeSim);
  useEffect(() => {
    activeSimRef.current = activeSim;
  }, [activeSim]);

  const handleSimulationEnded = useCallback(() => {
      setIsSimulating(false);
      // --- FIX: Read the SVG filename from the ref to get the latest value ---
      const currentFilename = activeSimRef.current.svg_filename;
      if (currentFilename) {
          console.log(`Simulation ended. Setting plot filename to: ${currentFilename}`);
          setSvgPlotFilename(currentFilename);
          setIsPlotReady(true);
          setPlotError('');
      } else {
          console.error("Simulation ended, but no SVG filename was available.");
          setPlotError("Simulation finished, but plot filename is missing.");
          setSvgPlotFilename(null);
          setIsPlotReady(false);
      }
  }, []); // --- FIX: Dependency array can be empty now ---

  const buildModelOnServer = useCallback(async (newJsonData) => {
    setSvgPlotFilename(null);
    setIsPlotReady(false);
    setPlotError('');

    if (activeSim.pid) {
        console.log(`Resetting previous simulation (PID: ${activeSim.pid}) before building new one.`);
        try {
            await fetch(`${API_BASE_URL}/reset_simulation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: activeSim.pid, client_id: clientId })
            });
        } catch (error) {
            console.error("Failed to reset previous simulation:", error);
        }
    }

    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }

    try {
        console.log("Sending new model configuration to server to build...");
        
        const payload = {
            config_data: newJsonData,
            client_id: clientId
        };

        const response = await fetch(`${API_BASE_URL}/launch_simulation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            if (response.status === 409) {
                const errorResult = await response.json();
                alert(`Error: ${errorResult.message}`);
                throw new Error(errorResult.message);
            }
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success' && result.pid && result.data_channel_id && result.svg_filename) {
            console.log(`New simulation process created (PID: ${result.pid}). Ready to run.`);
            setActiveSim({
                pid: result.pid,
                data_channel_id: result.data_channel_id,
                svg_filename: result.svg_filename
            });

            const socket = io(API_BASE_URL, { path: '/socket.io', transports: ['websocket'] });
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('Socket.IO connected, joining channel:', result.data_channel_id);
                socket.emit('join_sim_channel', { data_channel_id: result.data_channel_id });
            });

            socket.on('simulation_data', (data) => {
				console.log('Received simulation_data event from WebSocket:', data);
                if (data?.type === 'scene_init') {
                    setThreeDConfig(data.scene);
                } else if (data?.filetype === 'jardesignerDataFrame') {
					console.log('got live frame data');
                    setLiveFrameData(data);
                } else if (data?.type === 'sim_end') {
                    console.log("Received simulation end signal from server.");
                    handleSimulationEnded();
                }
            });

            socket.on('disconnect', (reason) => {
                console.log(`Socket.IO disconnected. Reason: "${reason}"`);
            });

        } else {
            throw new Error(result.message || 'Failed to launch new simulation process.');
        }
    } catch (err) {
        console.error("Error during model build:", err);
        setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
    }
  }, [activeSim.pid, handleSimulationEnded, clientId]);

  const updateJsonData = useCallback((newDataPart) => {
    const updatedData = { ...initialJsonData, ...jsonData, ...newDataPart };
    const compactedData = compactJsonData(updatedData, initialJsonData);

    setJsonData(updatedData);
    setJsonContent(JSON.stringify(compactedData, null, 2));

    buildModelOnServer(compactedData);
  }, [jsonData, buildModelOnServer]);

  const handleStartRun = useCallback((runParams) => {
      if (!activeSim.pid || !socketRef.current || !socketRef.current.connected) {
          console.error("Cannot start run: No active simulation process or socket connection.");
          return;
      }

      console.log(`Sending 'start' command to PID ${activeSim.pid} with runtime: ${runParams.runtime}`);
      setIsSimulating(true);
      setLiveFrameData(null);
      setThreeDConfig(null);

      socketRef.current.emit('sim_command', {
          command: 'start',
          pid: activeSim.pid,
          params: {
              runtime: runParams.runtime
          }
      });
  }, [activeSim.pid]);

  const handleResetRun = useCallback(async () => {
      setIsSimulating(false);
      if (activeSim.pid) {
          console.log(`User requested reset for PID: ${activeSim.pid}`);
          await buildModelOnServer(compactJsonData(jsonData, initialJsonData));
      }
  }, [activeSim.pid, jsonData, buildModelOnServer]);

  const [transientSwcData, setTransientSwcData] = useState(null);

  const handleSelectionChange = useCallback((selection, isCtrlClick) => {
    setClickSelected(prevSelected => {
        if (isCtrlClick) {
            const isAlreadySelected = prevSelected.some(item => isSameSelection(item, selection));
            if (isAlreadySelected) {
                return prevSelected.filter(item => !isSameSelection(item, selection));
            } else {
                return [...prevSelected, selection];
            }
        } else {
            if (prevSelected.length === 1 && isSameSelection(prevSelected[0], selection)) {
                return [];
            } else {
                return [selection];
            }
        }
    });
  }, []);

  const handleMorphologyFileChange = useCallback(({ filename, content }) => {
      updateJsonData({
          cellProto: {
              type: 'file',
              source: filename
          }
      });
      setTransientSwcData(content);
  }, [updateJsonData]);

  const updateJsonString = useCallback((newJsonString) => {
     setJsonContent(newJsonString);
     try {
         const parsedData = JSON.parse(newJsonString);
         if (typeof parsedData === 'object' && parsedData !== null) {
             const mergedData = { ...initialJsonData, ...parsedData, filetype: parsedData.filetype || initialJsonData.filetype, version: parsedData.version || initialJsonData.version, fileinfo: { ...initialJsonData.fileinfo, ...(parsedData.fileinfo || {}) } };
             const compacted = compactJsonData(mergedData, initialJsonData);
             setJsonData(mergedData);
             setJsonContent(JSON.stringify(compacted, null, 2));
             setTransientSwcData(null);
             setThreeDConfig(null);
             buildModelOnServer(compacted);
         } else {
            throw new Error("Loaded content is not a valid JSON object.");
         }
     } catch (e) {
         console.error("App.jsx: Error parsing loaded JSON string:", e);
         alert(`Failed to load model: ${e.message}`);
     }
  }, [buildModelOnServer]);

  const handleClearModel = useCallback(() => {
    const compacted = compactJsonData(initialJsonData, initialJsonData);
    setJsonData(initialJsonData);
    setJsonContent(JSON.stringify(compacted, null, 2));
    setTransientSwcData(null);
    setThreeDConfig(null);
    setSvgPlotFilename(null);
    setIsPlotReady(false);
    setPlotError('');
    buildModelOnServer(compacted);
  }, [buildModelOnServer]);

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
    setSvgPlotFilename(filename);
    setIsPlotReady(ready);
    setPlotError(error || '');
    if (ready || error) {
        handleSimulationEnded();
    }
  }, [handleSimulationEnded]);

  const clearPlotData = useCallback(() => {
    setSvgPlotFilename(null);
    setIsPlotReady(false);
    setPlotError('');
  }, []);

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const menuComponents = useMemo(() => ({
      File: <FileMenuBox setJsonContent={updateJsonString} onClearModel={handleClearModel} getCurrentJsonData={getCurrentJsonData} currentConfig={jsonData.fileinfo} />,
      SimOutput: <SimOutputMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.files} getChemProtos={getChemProtos} />,
      Run: <RunMenuBox
             onConfigurationChange={updateJsonData}
             currentConfig={{...jsonData}}
             onStartRun={handleStartRun}
             onResetRun={handleResetRun}
             isSimulating={isSimulating}
             activeSimPid={activeSim.pid}
             liveFrameData={liveFrameData}
           />,
      Morphology: <MorphoMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.cellProto} onFileChange={handleMorphologyFileChange} />,
      Spines: <SpineMenuBox onConfigurationChange={updateJsonData} currentConfig={{ spineProto: jsonData.spineProto, spineDistrib: jsonData.spineDistrib }} />,
      Channels: <ElecMenuBox onConfigurationChange={updateJsonData} currentConfig={{ chanProto: jsonData.chanProto, chanDistrib: jsonData.chanDistrib }} />,
      Passive: <PassiveMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.passiveDistrib} />,
      Signaling: <ChemMenuBox onConfigurationChange={updateJsonData} currentConfig={{ chemProto: jsonData.chemProto, chemDistrib: jsonData.chemDistrib }} getChemProtos={getChemProtos} />,
      Adaptors: <AdaptorsMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.adaptors} />,
      Stimuli: <StimMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.stims} getChemProtos={getChemProtos} />,
      Plots: <PlotMenuBox onConfigurationChange={updateJsonData} currentConfig={jsonData.plots} getChemProtos={getChemProtos} />,
      '3D': <ThreeDMenuBox onConfigurationChange={updateJsonData} currentConfig={{ moogli: jsonData.moogli, displayMoogli: jsonData.displayMoogli }} getChemProtos={getChemProtos} />,
  }), [activeMenu, jsonData, updateJsonString, getChemProtos, handlePlotDataUpdate, clearPlotData, handleClearModel, handleSaveModel, updateJsonData, handleMorphologyFileChange, handleStartRun, handleResetRun, isSimulating, activeSim.pid, liveFrameData]);

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
             liveFrameData={liveFrameData}
             clickSelected={clickSelected}
             onSelectionChange={handleSelectionChange}
          />
        </Grid>
       </Grid>
     </>
  );
};

export default App;
