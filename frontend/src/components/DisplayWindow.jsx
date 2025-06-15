import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import JsonText from './JsonText'; // We will render JsonText inside this component
import MarkdownText from './MarkdownText'; // Markdown rendered here 

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
          <Tab label="Model JSON" />
          <Tab label="Documentation" />
        </Tabs>
      </Box>

      {/* Use CSS 'display' property to hide the inactive panel instead of unmounting */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 0 ? 'block' : 'none' }}>
        <JsonText
          jsonString={jsonString}
          schema={schema}
          setActiveMenu={setActiveMenu}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: tabIndex === 1 ? 'block' : 'none' }}>
        <MarkdownText />
      </Box>
    </Box>
  );
};

export default DisplayWindow;
