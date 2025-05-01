import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

const DisplayWindow = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box style={{ padding: '16px', background: '#e0e0e0', borderRadius: '8px' }}>
      <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)}>
        <Tab label="Text" />
        <Tab label="2D Chem" />
        <Tab label="3D Cell" />
      </Tabs>

      {tabIndex === 0 && <Typography>Text view of JSON file</Typography>}
      {tabIndex === 1 && <Typography>2D Graphics Placeholder</Typography>}
      {tabIndex === 2 && <Typography>3D Graphics Placeholder</Typography>}
    </Box>
  );
};

export default DisplayWindow;

