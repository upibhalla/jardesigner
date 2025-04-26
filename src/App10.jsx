import React, { useState, useCallback } from 'react'; // Added useCallback
import { AppBar, Toolbar, Button, Grid } from '@mui/material';

// Import icons (assuming paths are correct relative to App.jsx)
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

// Import Menu Boxes
import FileMenuBox from './components/MenuBoxes/FileMenuBox';
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
// Assuming DummyMenuBox is not needed for JSON generation
// import DummyMenuBox from './components/MenuBoxes/DummyMenuBox';
import GraphWindow from './components/GraphWindow';
import DisplayWindow from './components/DisplayWindow';
import JsonText from './components/JsonText'; // Import JsonText component

// --- NEW: Initial state based on schema defaults ---
// (Add other top-level defaults from schema as needed)
const initialJsonData = {
  filetype: "rdesigneur", // From schema
  version: "1.0",        // From schema
  modelPath: "/model",   // Default from schema
  diffusionLength: 2e-6, // Default from schema
  turnOffElec: false,    // Default from schema
  useGssa: false,        // Default from schema
  odeMethod: "lsoda",    // Default from schema
  verbose: false,        // Default from schema
  combineSegments: true, // Default from schema
  stealCellFromLibrary: false, // Default from schema
  benchmark: false,      // Default from schema
  temperature: 32,       // Default from schema
  elecDt: 50e-6,         // Default from schema
  chemDt: 0.1,           // Default from schema
  funcDt: 100e-6,        // Default from schema
  diffDt: 10e-3,         // Default from schema
  elecPlotDt: 100e-6,    // Default from schema
  chemPlotDt: 1.0,       // Default from schema
  statusDt: 0.0,         // Default from schema
  runtime: 0.3,          // Default from schema
  randseed: 1234,        // Default from schema
  numWaveFrames: 100,    // Default from schema
  // --- Initialize other sections as empty or with defaults ---
  cellProto: {},         // Placeholder
  passiveDistrib: [],    // Placeholder
  spineProto: [],        // Placeholder
  spineDistrib: [],      // Placeholder
  chanProto: [],         // Placeholder
  chanDistrib: [],       // Placeholder
  chemProto: [],         // Placeholder
  chemDistrib: [],       // Placeholder
  adaptors: [],          // Placeholder
  plots: [],             // Placeholder
  files: [],             // Placeholder
  moogli: [],            // Placeholder
  displayMoogli: {},     // Placeholder
  moogliEvents: [],      // Placeholder
  stims: []              // Placeholder
};
// --- END NEW ---

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  // --- NEW: State for the complete JSON object ---
  const [jsonData, setJsonData] = useState(initialJsonData);
  // --- END NEW ---

  // --- NEW: Callback to update the central JSON state ---
  const updateJsonData = useCallback((newDataPart) => {
    console.log("Updating jsonData with:", newDataPart); // For debugging
    setJsonData(prevData => ({
      ...prevData, // Keep existing data
      ...newDataPart // Overwrite with new data part
    }));
  }, []); // Empty dependency array: function reference is stable
  // --- END NEW ---

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // --- Get JSON string for display ---
  // Note: Using useState ensures re-renders when jsonData changes
  const jsonString = JSON.stringify(jsonData, null, 2);
  // ---

  return (
    <>
      {/* Menu Bar */}
      <AppBar position="static">
        <Toolbar style={{ display: 'flex', justifyContent: 'space-around' }}>
          {/* ... (Menu Buttons remain the same) ... */}
           <Button
            color="inherit"
            onClick={() => toggleMenu('File')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'File' ? 'orange' : 'inherit',
            }}
          >
            <img src={fileIcon} alt="File Icon" style={{ width: '48px', marginBottom: '4px' }} />
            File
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Configure')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Configure' ? 'orange' : 'inherit',
            }}
          >
            <img src={configureIcon} alt="Configure Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Configure
          </Button>
          {/* Other buttons ... */}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Grid container spacing={2} style={{ padding: '16px' }}>
        {/* Menu Box */}
        <Grid item xs={4}>
          {/* --- MODIFIED: Pass update function to ConfigureMenuBox --- */}
          {activeMenu === 'File' && <FileMenuBox /* Needs props if it modifies JSON */ />}
          {activeMenu === 'Configure' && <ConfigureMenuBox onConfigurationChange={updateJsonData} />}
          {/* --- END MODIFIED --- */}
          {activeMenu === 'Run' && <RunMenuBox /* Needs props */ />}
          {activeMenu === 'Morphology' && <MorphoMenuBox /* Needs props */ />}
          {activeMenu === 'Spines' && <SpineMenuBox /* Needs props */ />}
          {activeMenu === 'Channels' && <ElecMenuBox /* Needs props */ />}
          {activeMenu === 'Passive' && <PassiveMenuBox /* Needs props */ />}
          {activeMenu === 'Signaling' && <ChemMenuBox /* Needs props */ />}
          {activeMenu === 'Adaptors' && <AdaptorsMenuBox /* Needs props */ />}
          {activeMenu === 'Stimuli' && <StimMenuBox /* Needs props */ />}
          {activeMenu === 'Plots' && <PlotMenuBox /* Needs props */ />}
          {activeMenu === '3D' && <ThreeDMenuBox /* Needs props */ />}
        </Grid>

        {/* Graph Window */}
        <Grid item xs={4}>
          <GraphWindow />
        </Grid>

        {/* Display Window */}
        <Grid item xs={4}>
          <DisplayWindow />
          {/* --- MODIFIED: Pass stringified JSON state --- */}
          {/* Assuming JsonText accepts jsonContent prop based on original code */}
          <JsonText jsonContent={jsonString} />
          {/* --- END MODIFIED --- */}
        </Grid>
      </Grid>
    </>
  );
};

export default App;
