import { getDb } from '../db.js';
import { getAlphaPlaybookFromAI, streamGeminiFromAI, getSignalFromImageAI } from '../ai/alphaLiquidation.js';
import { marketDataStatus } from '../data/candleManager.js';
import { activePlaybooks, executionCores, connectorToClientMap, lastHeartbeatMap, connectorStates } from '../state.js';

export function initializeRoutes(app) {
    // --- New Authentication Routes ---
    app.post('/api/auth/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const db = getDb();
            // In a real app, passwords must be hashed and compared securely.
            const user = await db.get('SELECT id, username, fullName, email, profilePicture FROM users WHERE username = ? AND password = ?', username, password);
            if (user) {
                res.json({ success: true, user });
            } else {
                res.status(401).json({ success: false, message: 'Invalid username or password.' });
            }
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ success: false, message: "Server error during authentication." });
        }
    });

    // --- New User Profile Routes ---
    app.post('/api/user/profile', async (req, res) => {
        const { id, username, fullName, email, profilePicture } = req.body;
        try {
            const db = getDb();
            const fields = [];
            const params = [];
            if (username) { fields.push('username = ?'); params.push(username); }
            if (fullName) { fields.push('fullName = ?'); params.push(fullName); }
            if (email) { fields.push('email = ?'); params.push(email); }
            if (profilePicture) { fields.push('profilePicture = ?'); params.push(profilePicture); }
            
            if (fields.length === 0) {
                return res.status(400).json({ message: 'No fields to update.' });
            }

            params.push(id);
            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            await db.run(query, ...params);

            const updatedUser = await db.get('SELECT id, username, fullName, email, profilePicture FROM users WHERE id = ?', id);
            res.json({ success: true, user: updatedUser });

        } catch (error) {
            console.error("Profile update error:", error);
            res.status(500).json({ success: false, message: 'Failed to update profile.' });
        }
    });

    // --- Existing Routes ---
    app.get('/api/stream-status', (req, res) => {
        res.json({ marketData: marketDataStatus });
    });

    app.get('/api/trade-blotter', async (req, res) => {
        try {
            const trades = await getDb().all('SELECT * FROM closed_trades ORDER BY timestamp DESC');
            res.json(trades);
        } catch (error) {
            console.error("Error fetching trade blotter:", error);
            res.status(500).json({ error: "Could not retrieve trade history." });
        }
    });

    app.post('/api/predictive-signal', async (req, res) => {
        const { asset, settings } = req.body;
        if (marketDataStatus !== 'LIVE') {
            return res.status(503).json({ error: `Cannot generate playbook: Market Data Feed is offline.` });
        }
        try {
            const playbook = await getAlphaPlaybookFromAI(settings, asset);
            res.json(playbook);
        } catch (error) {
            res.status(500).json({ error: error.message || 'An unknown AI error occurred.' });
        }
    });

    app.post('/api/engage-playbook', (req, res) => {
        const { playbook, clientId } = req.body;
        activePlaybooks.set(clientId, { playbook, ws: null, state: 'Stalking', countdown: 3, lastState: null });
        res.status(200).send({ message: 'Engagement acknowledged.' });
    });

    app.post('/api/disengage-playbook', (req, res) => {
        const { clientId } = req.body;
        if (activePlaybooks.has(clientId)) activePlaybooks.delete(clientId);
        res.status(200).send({ message: 'Disengagement acknowledged.' });
    });

    // --- EXECUTION CORE ---
    app.post('/api/execution-core/connect', (req, res) => {
        const { connectorId, secureKey, clientId } = req.body;
        if (secureKey !== 'SECURE-KEY-MT5') {
            return res.status(403).json({ success: false, message: 'Invalid secure key.' });
        }
        
        if (!connectorStates.has(connectorId)) {
             console.log(`\x1b[32m[HTTP Connect] Client ${clientId} is initializing session for Connector: ${connectorId}.\x1b[0m`);
             connectorStates.set(connectorId, { isActive: false, metrics: null, positions: [], lastPositions: [], logs: [], commandQueue: [], positionTheses: {}, openIntents: {}, tacticalAssetStates: {}, lastLoggedStates: {} });
        } else {
             console.log(`[HTTP Connect] Client ${clientId} re-established session for Connector: ${connectorId}.`);
        }
        
        if (!connectorToClientMap.has(connectorId)) {
            connectorToClientMap.set(connectorId, new Set());
        }
        connectorToClientMap.get(connectorId).add(clientId);

        res.status(200).json({ success: true, message: 'Session initialized. Ready for WebSocket connection.' });
    });

    app.post('/api/execution-core/toggle', async (req, res) => {
        const connectorId = "NEXUS-EA-1337"; // This should be dynamic in a multi-connector system
        const { isActive } = req.body;
        
        if (connectorStates.has(connectorId)) {
            const state = connectorStates.get(connectorId);
            state.isActive = isActive;
            try {
                await getDb().run("UPDATE settings SET value = ? WHERE key = 'isAiActive'", isActive.toString());
                console.log(`\x1b[35mAutonomous AI for connector ${connectorId} is now ${isActive ? 'ACTIVE' : 'DEACTIVATED'}.\x1b[0m`);
                res.status(200).json({ success: true });
            } catch (error) {
                 res.status(500).json({ success: false, message: "Failed to update AI state in database." });
            }
        } else {
            res.status(404).json({ success: false, message: "Connector state not found." });
        }
    });

    // --- MQL5 EA Endpoints ---
    app.post('/api/ea/heartbeat', (req, res) => {
        try {
            const { connectorId, secureKey, metrics, positions } = req.body;
            if (secureKey !== 'SECURE-KEY-MT5') return res.status(200).json({ status: 'error', message: 'Invalid key' });
            
            lastHeartbeatMap.set(connectorId, Date.now());

            if (!connectorStates.has(connectorId)) {
                 console.log(`[Heartbeat] Received first heartbeat from ${connectorId}. Pre-initializing state.`);
                 connectorStates.set(connectorId, { isActive: false, metrics: null, positions: [], lastPositions: [], logs: [], commandQueue: [], positionTheses: {}, openIntents: {}, tacticalAssetStates: {}, lastLoggedStates: {} });
            }
            
            const state = connectorStates.get(connectorId);
            const livePositions = positions || []; 

            if (state.metrics === null && metrics) {
                const equity = metrics.equity || 0;
                state.metrics = { balance: 0, equity, livePnl: 0, riskPercentage: 0, equityHistory: [{ time: new Date().toLocaleTimeString(), equity }] };
                const coreHandler = executionCores.get(connectorId);
                if (coreHandler) coreHandler.log('Live data stream from MT5 established.', 'SUCCESS');
            }
            
            if(metrics && state.metrics) {
                state.metrics.balance = metrics.balance;
                state.metrics.equity = metrics.equity;
                
                const lastEquity = state.metrics.equityHistory.slice(-1)[0]?.equity;
                if (metrics.equity !== lastEquity) {
                    state.metrics.equityHistory.push({ time: new Date().toLocaleTimeString(), equity: metrics.equity });
                    if (state.metrics.equityHistory.length > 100) state.metrics.equityHistory.shift();
                }
                state.metrics.livePnl = livePositions.reduce((sum, p) => sum + p.pnl, 0);
            }
            state.positions = livePositions;
            res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error('[Heartbeat] Critical error processing heartbeat:', error);
            res.status(200).json({ status: 'server_error' });
        }
    });

    app.get('/api/ea/commands', (req, res) => {
        try {
            const { connectorId } = req.query; 
            const isHeartbeatRecent = lastHeartbeatMap.has(connectorId) && (Date.now() - lastHeartbeatMap.get(connectorId) < 30000);
            if (!isHeartbeatRecent) return res.status(200).json({ commands: [] });

            const state = connectorStates.get(connectorId);
            if (!state) return res.status(200).json({ commands: [] });
            
            const commandsToSend = state.commandQueue;
            state.commandQueue = [];
            if (commandsToSend.length > 0) {
                console.log(`[Commands] Sending ${commandsToSend.length} command(s) to ${connectorId}.`);
            }
            res.status(200).json({ commands: commandsToSend });
        } catch (error) {
            console.error('[Commands] Critical error fetching commands:', error);
            res.status(200).json({ commands: [] });
        }
    });
    
    app.post('/api/gemini-vision-signal', async (req, res) => {
        try {
            const { prompt, imageData, mimeType } = req.body;
            const analysis = await getSignalFromImageAI(prompt, imageData, mimeType);
            res.json({ analysis });
        } catch (error) {
            res.status(500).json({ error: error.message || 'An unknown AI error occurred.' });
        }
    });

    app.get('/api/gemini-stream', async (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        try {
            const stream = streamGeminiFromAI(req.query.prompt, req.query.useGoogleSearch === 'true');
            for await (const chunk of stream) {
                if (!res.writable) break;
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
        } catch (error) {
            if(res.writable) res.write(`data: ${JSON.stringify({error: error.message})}\n\n`);
        } finally {
            if(res.writable) res.write('event: end\ndata: {"done": true}\n\n');
            res.end();
        }
    });
}