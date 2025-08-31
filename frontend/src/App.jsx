import React from 'react';
import { useAppLogic } from './appLogic.js';
import { AppLayout } from './AppLayout.jsx';

const App = () => {
  const appStateAndHandlers = useAppLogic();
  return <AppLayout {...appStateAndHandlers} />;
};

export default App;
