import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { useFullscreen } from './hooks/useFullscreen.js';
import './index.css';

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
