import { APIServer } from './api/server.js';

// Initialize and start the API server
const apiServer = new APIServer();

// Export the Express app for Devvit integration
export default apiServer.getApp();

// For development, start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  apiServer.listen(port);
}
