
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

// --- Initialization ---
async function startServer() {
    try {
        // Dynamically import modules that depend on environment variables AFTER dotenv has run.
        // This is the critical fix for the "API KEY NOT SET" error.
        const { initializeRoutes } = await import('./api/routes.js');
        const { initializeWebSockets } = await import('./ws/handlers.js');

        // 1. Initialize Database
        await initializeDatabase();
        
        // 2. [Praetorian X] Harvest missing data since last run
        await harvestMissingData();

        // 3. Load historical data for AI calibration
        await loadHistoricalDataFromCSVs();
        
        // 4. Initialize API routes
        initializeRoutes(app);
        
        // 5. Initialize WebSocket servers and attach to the HTTP server
        initializeWebSockets(server);

        // 6. Connect to live market data AFTER all setup is complete
        connectToFinnhub();
        
        // 7. Start the server (but not in a Vercel serverless environment)
        if (!process.env.VERCEL) {
            server.listen(PORT, () => {
                console.log(`\n\x1b[32m%s\x1b[0m`, `--- NexusAI Backend Server ---`);
                console.log(`Backend is online and listening on http://localhost:${PORT}`);
                console.log("Waiting for frontend and MT5 EA connections...");
            });
        }

    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

startServer();

// Export the server instance for Vercel
export default server;