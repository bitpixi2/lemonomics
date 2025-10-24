import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import './styles/pixel-art.css';
import './styles/components.css';

// Initialize the React app
const container = document.getElementById('game');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Game container not found');
}
