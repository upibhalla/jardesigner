import React, { useState, useCallback } from 'react';
import { AppBar, Toolbar, Button, Grid } from '@mui/material';

// Import icons... (same as before)
import configureIcon from './assets/configure-icon.png';
// ... other icons

// Import Menu Boxes... (same as before)
import FileMenuBox from './components/MenuBoxes/FileMenuBox';
import ConfigureMenuBox from './components/MenuBoxes/ConfigureMenuBox';
// ... other menu boxes

import GraphWindow from './components/GraphWindow';
import DisplayWindow from './components/DisplayWindow';
import JsonText from './components/JsonText';

// --- Import the schema JSON ---
// This assumes your build setup allows importing JSON files.
// If not, you might need to fetch it or convert it to a JS object.
import schema from './schema.json'; // Adjust path if necessary

// Initial state based on schema defaults... (same as before)
const initialJsonData = {
  filetype: "rdesigneur",
  version: "1.0",
  // ... other defaults from schema ...
  cellProto: {},
  passiveDistrib: [],
  // ... etc.
};

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [jsonData, setJsonData] = useState(initialJsonData);

  const updateJsonData = useCallback((newDataPart) => {
    console.log("Updating jsonData with:", newDataPart);
    setJsonData(prevData => ({
      ...prevData,
      ...newDataPart
    }));
  }, []);

  // --- NEW: Function to provide current JSON data ---
  const getCurrentJsonData = useCallback(() => {
    return jsonData;
  }, [jsonData]); // Depends on jsonData state
  // --- END NEW ---

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // No longer need derived jsonString state here

  return (
    <>
      {/* Menu Bar ... (same as before) */}
      <AppBar position="static">
        {/* ... Toolbar ... */}
      </AppBar>

      {/* Main Content */}
      <Grid container spacing={2} style={{ padding: '16px' }}>
        {/* Menu Box */}
        <Grid item xs={4}>
          {/* Pass update function to components that modify JSON */}
          {activeMenu === 'File' && <FileMenuBox /* Needs props */ />}
          {activeMenu === 'Configure' && <ConfigureMenuBox onConfigurationChange={updateJsonData} />}
          {/* ... other components also need onConfigurationChange or similar prop ... */}
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
          {/* --- MODIFIED: Pass getter function and schema --- */}
          <JsonText
             getCurrentJsonData={getCurrentJsonData}
             schema={schema} // Pass the imported schema object
          />
          {/* --- END MODIFIED --- */}
        </Grid>
      </Grid>
    </>
  );
};

export default App;
