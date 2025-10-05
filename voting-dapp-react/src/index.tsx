// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Lembre-se de corrigir para './app' se for o caso

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);