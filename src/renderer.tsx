import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // Make sure this is imported

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);