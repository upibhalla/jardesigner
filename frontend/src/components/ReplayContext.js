import React from 'react';

// This context will provide the replayTime directly to the components that need it.
export const ReplayContext = React.createContext({
  replayTime: 0,
});
