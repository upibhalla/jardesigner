import React from 'react';
import ReactDOM from 'react-dom/client';
import ThreeDViewer from './components/ThreeDViewer';
import { useAppLogic } from './appLogic'; 
import { ReplayContext } from './components/ReplayContext';

const StandaloneApp = () => {
  // The useAppLogic hook will be modified to handle standalone data
  const props = useAppLogic();

  // We only render the 3D viewer and its context provider
  return (
    <ReplayContext.Provider value={{ replayTime: props.replayTime }}>
      <ThreeDViewer {...props} onSelectionChange={props.handleSelectionChange} />
    </ReplayContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<StandaloneApp />);
