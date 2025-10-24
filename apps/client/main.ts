/**
 * Bitpixi's Bar - Main Entry Point
 * 
 * A cozy drink-making game built with Three.js and Devvit.
 * Features progressive gameplay phases and Reddit integration.
 */

import { BitpixisBarApp } from './src/app.js';

// Initialize the application
const canvas = document.getElementById('bg') as HTMLCanvasElement;
const app = new BitpixisBarApp(canvas);

// Start the game
app.start().catch(console.error);

// Add some global styles for the game
const globalStyles = document.createElement('style');
globalStyles.textContent = `
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #2C1810, #3D2817);
  }

  #bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
  }

  /* Hide original UI elements */
  #title,
  #counter-value,
  #docs-link,
  #playtest-link,
  #discord-link,
  .links {
    display: none;
  }
`;

document.head.appendChild(globalStyles);
