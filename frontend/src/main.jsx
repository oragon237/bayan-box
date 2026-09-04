import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { APP_BASE } from './api/client.js';
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

// Supports subfolder deploys (e.g. https://host/habi/). Vite exposes the
// configured base as import.meta.env.BASE_URL ("/" or "/habi/").
const BASENAME = APP_BASE || '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={BASENAME}>
      <FullscreenGate>
        <App />
      </FullscreenGate>
    </BrowserRouter>
  </React.StrictMode>,
);
