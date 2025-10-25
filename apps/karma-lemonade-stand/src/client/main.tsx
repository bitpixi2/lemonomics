import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';

// Initialize the React app in the game container
const container = document.getElementById('game');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
