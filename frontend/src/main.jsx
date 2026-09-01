import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { useFullscreen } from './hooks/useFullscreen.js';
import { reportClientError } from './services/errorReporter.js';
import './index.css';

window.addEventListener('error', (event) => {
  reportClientError({
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error?.stack,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  reportClientError({
    message: 'Unhandled promise rejection',
    source: 'unhandledrejection',
    stack: event.reason?.stack,
  });
});

function FullscreenGate({ children }) {
  useFullscreen();
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FullscreenGate>
        <App />
      </FullscreenGate>
    </BrowserRouter>
  </React.StrictMode>,
);
