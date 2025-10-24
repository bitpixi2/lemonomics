import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';

// Skip splash screen and go directly to game
const splash = document.getElementById('splash');
const container = document.getElementById('game');

if (splash) splash.style.display = 'none';
if (container) {
  container.style.display = 'block';
  const root = createRoot(container);
  root.render(React.createElement(App));
}
