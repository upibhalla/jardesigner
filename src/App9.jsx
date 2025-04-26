import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Grid } from '@mui/material';

// Import icons
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
import DummyMenuBox from './components/MenuBoxes/DummyMenuBox';
import GraphWindow from './components/GraphWindow';
import DisplayWindow from './components/DisplayWindow';
import JsonText from './components/JsonText'; // Import JsonText component

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [jsonContent, setJsonContent] = useState(''); // State to manage JSON content

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <>
      {/* Menu Bar */}
      <AppBar position="static">
        <Toolbar style={{ display: 'flex', justifyContent: 'space-around' }}>
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
          <Button
            color="inherit"
            onClick={() => toggleMenu('Run')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Run' ? 'orange' : 'inherit',
            }}
          >
            <img src={runIcon} alt="Run Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Run
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Morphology')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Morphology' ? 'orange' : 'inherit',
            }}
          >
            <img src={morphoIcon} alt="Morphology Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Morphology
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Spines')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Spines' ? 'orange' : 'inherit',
            }}
          >
            <img src={spinesIcon} alt="Spines Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Spines
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Channels')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Channels' ? 'orange' : 'inherit',
            }}
          >
            <img src={elecIcon} alt="Channels Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Channels
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Passive')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Passive' ? 'orange' : 'inherit',
            }}
          >
            <img src={passiveIcon} alt="Passive Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Passive
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Signaling')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Signaling' ? 'orange' : 'inherit',
            }}
          >
            <img src={chemIcon} alt="Signaling Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Signaling
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Adaptors')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Adaptors' ? 'orange' : 'inherit',
            }}
          >
            <img src={adaptorsIcon} alt="Adaptors Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Adaptors
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Stimuli')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Stimuli' ? 'orange' : 'inherit',
            }}
          >
            <img src={stimIcon} alt="Stimuli Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Stimuli
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('Plots')}
            style={{
              flexDirection: 'column',
              color: activeMenu === 'Plots' ? 'orange' : 'inherit',
            }}
          >
            <img src={plotsIcon} alt="Plots Icon" style={{ width: '48px', marginBottom: '4px' }} />
            Plots
          </Button>
          <Button
            color="inherit"
            onClick={() => toggleMenu('3D')}
            style={{
              flexDirection: 'column',
              color: activeMenu === '3D' ? 'orange' : 'inherit',
            }}
          >
            <img src={d3Icon} alt="3D Icon" style={{ width: '48px', marginBottom: '4px' }} />
            3D
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Grid container spacing={2} style={{ padding: '16px' }}>
        {/* Menu Box */}
        <Grid item xs={4}>
          {activeMenu === 'File' && <FileMenuBox setJsonContent={setJsonContent} />}
          {activeMenu === 'Configure' && <ConfigureMenuBox />}
          {activeMenu === 'Run' && <RunMenuBox />}
          {activeMenu === 'Morphology' && <MorphoMenuBox />}
          {activeMenu === 'Spines' && <SpineMenuBox />}
          {activeMenu === 'Channels' && <ElecMenuBox />}
          {activeMenu === 'Passive' && <PassiveMenuBox />}
          {activeMenu === 'Signaling' && <ChemMenuBox />}
          {activeMenu === 'Adaptors' && <AdaptorsMenuBox />}
          {activeMenu === 'Stimuli' && <StimMenuBox />}
          {activeMenu === 'Plots' && <PlotMenuBox />}
          {activeMenu === '3D' && <ThreeDMenuBox />}
        </Grid>

        {/* Graph Window */}
        <Grid item xs={4}>
          <GraphWindow />
        </Grid>

        {/* Display Window */}
        <Grid item xs={4}>
          <DisplayWindow />
          <JsonText jsonContent={jsonContent} />
        </Grid>
      </Grid>
    </>
  );
};

export default App;

