// This file acts as the Vercel entrypoint for the backend.
// It imports the actual server from the /backend directory and exports it.
// This pattern allows Vercel's @vercel/node builder to correctly trace
// all dependencies within the /backend folder while preserving their
// relative paths, fixing all module resolution errors in the serverless environment.

import server from './backend/server.js';

export default server;