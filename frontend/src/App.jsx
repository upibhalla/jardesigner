import React, { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import createAppTheme from './theme.js';
import { useAppLogic } from './appLogic.js';
import { AppLayout } from './AppLayout.jsx';

const App = () => {
  const [mode, setMode] = useState(() => localStorage.getItem('colorMode') || 'light');

  const toggleColorMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const appStateAndHandlers = useAppLogic();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout {...appStateAndHandlers} toggleColorMode={toggleColorMode} colorMode={mode} />
    </ThemeProvider>
  );
};

export default App;
