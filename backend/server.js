
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { initializeDatabase } from './db.js';
import { loadHistoricalDataFromCSVs, connectToFinnhub, harvestMissingData } from './data/candleManager.js';

// --- Environment Variable Setup ---
// Load environment variables immediately.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
// FIX: Increase the JSON payload limit to allow for base64 image uploads.
app.use(express.json({ limit: '10mb' }));

// --- ASYNCHRONOUS INITIALIZATION (using top-level await) ---
// This entire block will complete BEFORE the module is considered fully loaded.
// This ensures the server is fully configured before Vercel uses it, fixing the 404 error.
try {
    // Dynamically import modules that depend on environment variables AFTER dotenv has run.
    const { initializeRoutes } = await import('./api/routes.js');
    const { initializeWebSockets } = await import('./ws/handlers.js');

    // 1. Initialize Database
    await initializeDatabase();
    
    // 2. [Praetorian X] Harvest missing data since last run
    await harvestMissingData();

    // 3. Load historical data for AI calibration
    await loadHistoricalDataFromCSVs();
    
    // 4. Initialize API routes on the Express app
    initializeRoutes(app);
    
    // 5. Initialize WebSocket handlers on the HTTP server instance
    initializeWebSockets(server);

    // 6. Connect to live market data (runs in background, doesn't need to be awaited)
    connectToFinnhub();
    
    console.log("NexusAI Backend Initialized Successfully for Vercel.");

} catch (error) {
    console.error("CRITICAL FAILURE during server initialization:", error);
    // Log the error for Vercel's logs, the deployment will likely fail to respond correctly.
}


// --- LOCAL DEVELOPMENT ONLY ---
// This block is ignored by Vercel's serverless environment because it doesn't call .listen().
if (!process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`\n\x1b[32m%s\x1b[0m`, `--- NexusAI Backend Server (Local) ---`);
        console.log(`Backend is online and listening on http://localhost:${PORT}`);
        console.log("Waiting for frontend and MT5 EA connections...");
    });
}

// Export the fully configured HTTP server instance for Vercel.
// This allows Vercel to handle both regular HTTP requests (forwarded to `app`)
// and WebSocket `upgrade` requests. This is the definitive fix.
export default server;