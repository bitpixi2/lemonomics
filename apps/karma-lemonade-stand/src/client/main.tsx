// React import removed - not needed for JSX in modern React
import { createRoot } from 'react-dom/client';
import { App } from './app.js';

// Initialize the React app directly - Devvit handles the splash screen
const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
}
