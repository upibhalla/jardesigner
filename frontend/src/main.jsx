import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );
} else {
  console.error("[main.jsx] Fatal: Could not find the root element to mount the app.");
}
