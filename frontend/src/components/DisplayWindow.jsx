import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import JsonText from './JsonText'; // We will render JsonText inside this component
import MarkdownText from './MarkdownText'; // The new markdown component

// The component now accepts props to pass down to JsonText
const DisplayWindow = ({ jsonString, schema, setActiveMenu }) => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    // The outer box acts as the container for the tabs and their content
    <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Ensure it takes up the full height of its grid cell
        background: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden' // Hide overflow from child components
    }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="display window tabs">
          <Tab label="Model JSON" id="tab-0" />
          <Tab label="Documentation" id="tab-1" />
        </Tabs>
      </Box>

      {/* Panel for "Model JSON" */}
      <Box
        role="tabpanel"
        hidden={tabIndex !== 0}
        id="tabpanel-0"
        sx={{ flexGrow: 1, overflowY: 'auto' }} // Allow panel to grow and scroll
      >
        {tabIndex === 0 && (
          <JsonText
            jsonString={jsonString}
            schema={schema}
            setActiveMenu={setActiveMenu}
          />
        )}
      </Box>

      {/* Panel for "Documentation" */}
      <Box
        role="tabpanel"
        hidden={tabIndex !== 1}
        id="tabpanel-1"
        sx={{ flexGrow: 1, overflowY: 'auto' }} // Allow panel to grow and scroll
      >
        {tabIndex === 1 && <MarkdownText />}
      </Box>
    </Box>
  );
};

export default DisplayWindow;
