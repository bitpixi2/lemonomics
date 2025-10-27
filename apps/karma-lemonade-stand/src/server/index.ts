import express from 'express';
import { createServer, getServerPort } from '@devvit/web/server';
import { APIServer } from './api/server.js';

// Initialize the API server
const apiServer = new APIServer();
const app = apiServer.getApp();

// Create Devvit server
const server = createServer(app);

// Handle server errors
server.on('error', (err) => {
  console.error(`🍋 Lemonomics server error: ${err.stack}`);
});

// Get port from Devvit environment
const port = getServerPort();

// Start the server
server.listen(port, () => {
  console.log(`🍋 Lemonomics API server running on port ${port}`);
});

// Export the app for Devvit integration
export default app;
