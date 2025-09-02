
import { WebSocketServer, WebSocket } from 'ws';
import { getAlphaPlaybookFromAI } from '../ai/alphaLiquidation.js';
import { runPraetorianBrain } from '../ai/praetorian.js';
import { calculatePositionSize, RISK_PER_TRADE } from '../risk/positionSizer.js';
import { marketDataStatus, candleStore, finnhubSymbolMap, ASSET_UNIVERSE, ASSET_BROKER_MAP, CALIBRATION_MIN_CANDLES, priceStore } from '../data/candleManager.js';
import { activePlaybooks, executionCores, connectorToClientMap, connectorStates } from '../state.js';
import { getDb } from '../db.js';

const initialAgentsData = [
    { id: 'alpha-hunter', name: 'Alpha Hunter', specialty: 'Reinforcement Learning Alpha Gen', status: 'Active', performance: 0.45, description: "Generates pure alpha signals using deep reinforcement learning models." },
    { id: 'regime-detector', name: 'Regime Detector', specialty: 'Market Phase Identification', status: 'Active', performance: 98.2, description: "Identifies market phases: trending, ranging, volatile, or quiet." },
    { id: 'risk-guardian', name: 'Risk Guardian', specialty: 'Dynamic Risk & Sizing', status: 'Active', performance: 0.99, description: "Manages portfolio risk and dynamically sizes positions based on volatility." },
    { id: 'execution-ninja', name: 'Execution Ninja', specialty: 'Optimal Trade Execution', status: 'Active', performance: 0.02, description: "Executes trades with minimal market impact using advanced algorithms." },
    { id: 'manipulation-detective', name: 'Manipulation Detective', specialty: 'Fraud Detection', status: 'Idle', performance: 92.5, description: "Scans order books for spoofing, layering, and momentum ignition." },
    { id: 'arbitrage-sniper', name: 'Arbitrage Sniper', specialty: 'Cross-Exchange Arbitrage', status: 'Active', performance: 0.15, description: "Identifies and executes statistical and latency arbitrage opportunities." },
    { id: 'news-flow', name: 'News Flow Agent', specialty: 'Event-Driven Trading', status: 'Active', performance: 76.8, description: "Processes real-time news and catalyst data for trades." },
    { id: 'sentiment-conductor', name: 'Sentiment Conductor', specialty: 'Social Momentum Trading', status: 'Optimizing', performance: 68.3, description: "Analyzes social media sentiment to trade narrative momentum." },
];

class ExecutionCoreHandler {
    constructor(connectorId) {
        this.connectorId = connectorId;
        this.clients = new Set();
        this.aiIntervalId = null;
        this.broadcastIntervalId = null;
        this.state = connectorStates.get(connectorId);
        this.isWarmingUp = false; // [Praetorian X] - Warm-up state
    }

    addClient(ws) {
        this.clients.add(ws);
        // Do not send the full state immediately. The broadcast interval will handle it.
        // This decouples the connection logic from the state-sending logic, preventing crashes.
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'connection_ack' }));
            }
        } catch (e) {
            console.error("Error sending connection ack:", e);
        }
    }
    
    removeClient(ws) {
        this.clients.delete(ws);
    }
    
    hasClients() {
        return this.clients.size > 0;
    }

    log(message, type = 'INFO') {
        if (!this.state) return;
        const uniqueId = `log-${Date.now()}-${Math.random()}`;
        const newLog = { id: uniqueId, timestamp: new Date().toLocaleTimeString(), message, type };
        this.state.logs = [newLog, ...this.state.logs.slice(0, 99)];
    }

    async initialize() {
        if (!this.state) {
            console.error(`Handler initialized for ${this.connectorId} but no state object found.`);
            return;
        }
        const initialAiState = await getDb().get("SELECT value FROM settings WHERE key = 'isAiActive'");
        this.state.isActive = initialAiState ? initialAiState.value === 'true' : false;
        
        this.log('Praetorian X Core initializing...');
        this.log('Starting 30-second warm-up and live calibration period...', 'INFO');
        this.isWarmingUp = true;
        setTimeout(() => {
            this.isWarmingUp = false;
            this.log('Warm-up complete. AI is now ACTIVE and hunting for trades.', 'SUCCESS');
        }, 30000); // 30-second warm-up period

        this.aiIntervalId = setInterval(() => this.runAiLogicCycle(), 5000);
        this.broadcastIntervalId = setInterval(() => this.broadcastState(), 1000);
    }
    
    sendStateToClient(ws) {
        try {
            if (ws.readyState !== WebSocket.OPEN) return;

            const state = this.state;
            if (!state) {
                console.warn(`[WS] Attempted to send state for ${this.connectorId}, but state object was missing.`);
                return;
            }

            const positionsWithRisk = (state.positions || []).map(p => ({ ...p, ...(state.positionTheses[p.id] || {}) }));
            const focusedAssetState = this.getFocusedAssetState();

            const payload = {
                type: 'update',
                metrics: state.metrics,
                positions: positionsWithRisk,
                logs: state.logs || [],
                isActive: state.isActive || false,
                aiState: {
                    bias: 'N/A', 
                    tacticalState: focusedAssetState,
                    regime: 'N/A', // This can be enhanced in the future
                    focusedAsset: null, 
                    priceHistory: [],
                    activeStrategy: 'PRAETORIAN_X',
                    performanceMatrix: {},
                }
            };
            
            ws.send(JSON.stringify(payload));

        } catch (error) {
            console.error(`\x1b[31mCRITICAL ERROR during state broadcast for ${this.connectorId}:\x1b[0m`, error);
        }
    }

    broadcastState() {
        if (this.clients.size === 0) return;
        this.clients.forEach(ws => this.sendStateToClient(ws));
    }

    getFocusedAssetState() {
        if (!this.state) return 'ERROR';
        if (this.isWarmingUp) return 'WARM-UP';
        if (!this.state.isActive) return 'INACTIVE';
        if (!this.state.metrics || this.state.metrics.equity <= 0) return 'AWAITING METRICS';
        
        const activeAssets = ASSET_UNIVERSE.filter(asset => 
            candleStore[asset]?.H1?.length > 20 && candleStore[asset]?.M15?.length > CALIBRATION_MIN_CANDLES
        );
        if (activeAssets.length === 0) return 'CALIBRATING';
        
        const statePriorities = ['TRADE_READY', 'AWAITING_RETEST', 'AWAITING_CONFIRMATION', 'AWAITING_PULLBACK', 'NO_H1_TREND'];
        
        const stateValues = Object.values(this.state.tacticalAssetStates || {})
            .filter(s => s && s.status)
            .map(s => s.status);
            
        for (const priority of statePriorities) {
            if (stateValues.includes(priority)) {
                return priority;
            }
        }
        return 'IDLE';
    }

    async runAiLogicCycle() {
        try {
            if (!this.state || this.isWarmingUp) return;

            // [Praetorian X] - Review closed trades and log to journal
            if (this.state.lastPositions.length > 0 && this.state.positions.length < this.state.lastPositions.length) {
                const closedTrades = this.state.lastPositions.filter(lastPos => !this.state.positions.some(currentPos => currentPos.id === lastPos.id));
                for (const trade of closedTrades) {
                    const thesis = this.state.positionTheses[trade.id];
                    if (thesis) {
                        this.log(`PERFORMANCE REVIEW: Closed ${thesis.asset} for P&L: ${trade.pnl.toFixed(2)}.`, 'LEARNING');
                        const db = getDb();
                        await db.run(
                            'INSERT INTO closed_trades (asset, direction, size, entryPrice, exitPrice, pnl, timestamp, strategy, regime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            thesis.asset, trade.direction === 'LONG' ? 'BUY' : 'SELL', trade.size, trade.entryPrice,
                            priceStore[thesis.asset] || trade.currentPrice, trade.pnl, new Date().toISOString(),
                            thesis.strategy, thesis.regime
                        );
                        // Log to the learning journal
                        await db.run(
                            'INSERT INTO trade_journal (asset, strategy, regime, h1_trend_strength, m15_rsi, m15_atr, outcome, pnl, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            thesis.asset, thesis.strategy, thesis.regime, thesis.entryContext?.h1TrendStrength, 
                            thesis.entryContext?.rsi, thesis.entryContext?.atr,
                            trade.pnl > 0 ? 'WIN' : 'LOSS', trade.pnl, new Date().toISOString()
                        );
                        delete this.state.positionTheses[trade.id];
                    }
                }
            }
            this.state.lastPositions = JSON.parse(JSON.stringify(this.state.positions));

            const activeAssets = ASSET_UNIVERSE.filter(asset => 
                candleStore[asset]?.H1.length > 20 && candleStore[asset]?.M15.length > CALIBRATION_MIN_CANDLES
            );
            
            for (const asset in this.state.openIntents) {
                if (Date.now() - this.state.openIntents[asset].timestamp > 60000) {
                    this.log(`${asset}: Cleared stale trade intent. Resuming hunt.`, 'WARNING');
                    delete this.state.openIntents[asset];
                }
            }

            const openAssets = new Set(this.state.positions.map(p => Object.keys(ASSET_BROKER_MAP).find(key => ASSET_BROKER_MAP[key] === p.asset)));
            
            if (this.state.isActive && this.state.metrics && this.state.metrics.equity > 0 && activeAssets.length > 0) {
                for (const asset of activeAssets) {
                    if (openAssets.has(asset) || this.state.openIntents[asset]) {
                        if (this.state.tacticalAssetStates[asset]) {
                            delete this.state.tacticalAssetStates[asset]; 
                        }
                        continue;
                    };

                    const currentAssetState = this.state.tacticalAssetStates[asset] || {};
                    const brainResult = await runPraetorianBrain(asset, candleStore[asset], currentAssetState);
                    
                    this.state.tacticalAssetStates[asset] = brainResult.newState || {};

                    if (this.state.lastLoggedStates[asset] !== brainResult.message) {
                        if (brainResult.message) {
                            this.log(`${asset}: ${brainResult.message}`, brainResult.status.startsWith('VETO') ? 'VETO' : brainResult.status === 'TRADE_READY' ? 'EXECUTION' : 'INFO');
                        }
                        this.state.lastLoggedStates[asset] = brainResult.message;
                    }
                    
                    if (brainResult.status === 'TRADE_READY' && brainResult.plan) {
                        const tradePlan = brainResult.plan;
                        const size = calculatePositionSize(this.state.metrics.equity, RISK_PER_TRADE, tradePlan.entryPrice, tradePlan.sl, asset);
                        if (size > 0) {
                            const brokerSymbol = ASSET_BROKER_MAP[asset];
                            this.state.commandQueue.push({ action: 'OPEN', asset: brokerSymbol, direction: tradePlan.direction, size, sl: tradePlan.sl, tp: tradePlan.tp });
                            
                            // [Praetorian X] Save the full context for the learning journal
                            this.state.openIntents[asset] = { 
                                asset: asset,
                                direction: tradePlan.direction, stopLoss: tradePlan.sl, takeProfit: tradePlan.tp, 
                                strategy: 'PRAETORIAN_X', regime: 'TRENDING', timestamp: Date.now(),
                                entryContext: brainResult.entryContext
                            };
                             const currentTickets = new Set(this.state.positions.map(p => p.id));
                            setTimeout(() => {
                                if (!this.state) return; // Guard against destroyed handler
                                const newPosition = this.state.positions.find(p => !currentTickets.has(p.id) && ASSET_BROKER_MAP[asset] === p.asset);
                                if (newPosition) {
                                    this.state.positionTheses[newPosition.id] = this.state.openIntents[asset];
                                    delete this.state.openIntents[asset];
                                }
                            }, 5000); // Associate after 5s
                        } else {
                            this.log(`${asset}: Execution VETOED. Calculated size was zero or invalid.`, 'RISK');
                        }
                    }
                }
            }
        } catch (error) {
            console.error("\x1b[31m--- AI CORE CRITICAL ERROR ---\x1b[0m", error);
            this.log(`A critical error occurred in the AI core: ${error.message}`, 'WARNING');
        }
    }

    destroy() {
        clearInterval(this.aiIntervalId);
        clearInterval(this.broadcastIntervalId);
        this.clients.clear();
    }
}


export function initializeWebSockets(server) {
    const wssDashboard = new WebSocketServer({ noServer: true });
    const wssTradeStream = new WebSocketServer({ noServer: true });
    const wssAutomatedSignals = new WebSocketServer({ noServer: true });
    const wssAnomaly = new WebSocketServer({ noServer: true });
    const wssTradeCompanion = new WebSocketServer({ noServer: true });
    const wssExecutionCore = new WebSocketServer({ noServer: true });
    const wssAgentSwarm = new WebSocketServer({ noServer: true });

    wssAutomatedSignals.on('connection', ws => {
        const sendSignal = async (clientWs) => {
            if (marketDataStatus !== 'LIVE') return;
            const availableAssets = Object.keys(finnhubSymbolMap);
            const asset = availableAssets[Math.floor(Math.random() * availableAssets.length)];
            
            try {
                const playbook = await getAlphaPlaybookFromAI({ timeHorizon: 15, exploitProfile: 'Silent Snipe' }, asset);
                const blueprint = playbook.executionBlueprint;
                const signal = {
                    id: playbook.id, asset: playbook.asset, direction: blueprint.direction,
                    entry: blueprint.ignitionPoint, takeProfit: blueprint.exhaustionPoint, stopLoss: blueprint.missionAbort,
                    confidence: playbook.cascadeAnalysis.successProbability / 100,
                    rationale: {
                        tradeThesis: playbook.cascadeAnalysis.cascadeThesis,
                        marketStructure: playbook.liquidityAnalysis.heatmapSummary,
                        manipulationCheck: "Focused on stop-loss clusters.",
                        keyLevels: playbook.liquidityAnalysis.stopLossClusters
                    }
                };
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({ type: 'new_signal', signal }));
                }
            } catch (error) {
                console.error("Could not generate automated signal:", error.message);
            }
        };
        sendSignal(ws);
        const intervalId = setInterval(() => sendSignal(ws), 30000);
        ws.on('close', () => clearInterval(intervalId));
    });

    wssTradeCompanion.on('connection', (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('clientId');
        if (clientId && activePlaybooks.has(clientId)) {
            console.log(`Trade Companion client ${clientId} connected.`);
            const engagement = activePlaybooks.get(clientId);
            engagement.ws = ws; 
            ws.on('close', () => {
                console.log(`Trade Companion client ${clientId} disconnected.`);
                activePlaybooks.delete(clientId);
            });
        } else {
            ws.close();
        }
    });

    wssExecutionCore.on('connection', async (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('clientId');
        if (!clientId) return ws.close(1008, "Client ID is required.");

        let connectorId = null;
        for (const [connId, clientSet] of connectorToClientMap.entries()) {
            if (clientSet.has(clientId)) {
                connectorId = connId;
                break;
            }
        }
        
        if (!connectorId || !connectorStates.has(connectorId)) {
            console.warn(`[WS] Rejecting connection from ${clientId}: Session not fully initialized. Client will retry.`);
            return ws.close(1011, "Session not ready.");
        }
        
        ws.connectorId = connectorId;

        let coreHandler = executionCores.get(connectorId);
        
        if (!coreHandler) {
            console.log(`Creating new AI Core Handler for Connector ${connectorId}.`);
            coreHandler = new ExecutionCoreHandler(connectorId);
            // CRITICAL FIX: Await initialization to prevent race conditions.
            await coreHandler.initialize();
            executionCores.set(connectorId, coreHandler);
        } else {
            console.log(`Attaching UI client ${clientId} to existing AI Core for Connector ${connectorId}.`);
        }
        
        coreHandler.addClient(ws);

        ws.on('close', () => {
            console.log(`Execution Core client ${clientId} disconnected.`);
            if (coreHandler) {
                coreHandler.removeClient(ws);
            }
            const clientSet = connectorToClientMap.get(connectorId);
            if (clientSet) {
                clientSet.delete(clientId);
            }
        });
    });

    wssAgentSwarm.on('connection', ws => {
        console.log('Agent Swarm client connected.');
        let agents = JSON.parse(JSON.stringify(initialAgentsData)); 

        const intervalId = setInterval(() => {
            agents.forEach(agent => {
                const statuses = ['Active', 'Idle', 'Optimizing'];
                if (Math.random() < 0.1) {
                    agent.status = statuses[Math.floor(Math.random() * statuses.length)];
                }
                const performanceChange = (Math.random() - 0.5) * (agent.performance * 0.02);
                agent.performance += performanceChange;
            });

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'swarm_update', agents }));
            }
        }, 2500);

        ws.on('close', () => {
            console.log('Agent Swarm client disconnected.');
            clearInterval(intervalId);
        });
    });

    // --- Dashboard KPI Stream ---
    wssDashboard.on('connection', ws => {
        console.log('Dashboard client connected.');
        let pnlValue = 150000;
        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                // Simulate KPI fluctuation
                const kpis = {
                    sharpe: 2.15 + (Math.random() - 0.5) * 0.1,
                    maxDrawdown: 4.5 + (Math.random() - 0.5) * 0.2,
                    winRate: 68.2 + (Math.random() - 0.5) * 1.0,
                    alpha: 12.3 + (Math.random() - 0.5) * 0.5,
                };
                // Simulate P&L change
                pnlValue += (Math.random() - 0.48) * 1000;
                const pnl = {
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                    value: pnlValue
                };
                ws.send(JSON.stringify({ type: 'update', kpis, pnl }));
            }
        }, 2000);
        ws.on('close', () => {
            console.log('Dashboard client disconnected.');
            clearInterval(intervalId);
        });
    });

    // --- Live Trade Feed Stream ---
    wssTradeStream.on('connection', ws => {
        console.log('Trade Stream client connected.');
        const pairs = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'EUR/USD', 'GBP/JPY'];
        
        const sendTrade = () => {
             if (ws.readyState === WebSocket.OPEN) {
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                const price = priceStore[pair] || (pair.includes('BTC') ? 68000 : 1.08);
                const trade = {
                    id: `trade-${Date.now()}`,
                    pair: pair,
                    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
                    amount: Math.random() * (pair.includes('BTC') || pair.includes('ETH') ? 0.5 : 10),
                    price: price * (1 + (Math.random() - 0.5) * 0.0002),
                    timestamp: new Date().toISOString(),
                    status: 'Filled'
                };
                ws.send(JSON.stringify({ type: 'new_trade', trade }));
            }
            // Schedule next trade with random delay
            const delay = 3000 + Math.random() * 2000;
            const timeoutId = setTimeout(sendTrade, delay);
            ws.on('close', () => clearTimeout(timeoutId));
        };
        sendTrade(); // Send the first trade immediately
    });
    
    // --- Anomaly Detection Stream ---
    wssAnomaly.on('connection', ws => {
        console.log('Anomaly client connected.');
        const assets = ['BTC/USD', 'ETH/USD', 'XAU/USD'];
        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && Math.random() < 0.4) { // 40% chance per interval
                const asset = assets[Math.floor(Math.random() * assets.length)];
                const anomaly = {
                    id: `anomaly-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    type: 'Volume Spike',
                    asset: asset,
                    severity: 'High',
                    details: `Unusual volume detected: ${(Math.random() * 50 + 10).toFixed(2)}M traded in 1 minute.`
                };
                ws.send(JSON.stringify({ type: 'new_anomaly', anomaly }));
            }
        }, 8000); // Check every 8 seconds

        ws.on('close', () => {
            console.log('Anomaly client disconnected.');
            clearInterval(intervalId);
        });
    });

    server.on('upgrade', (request, socket, head) => {
        const { pathname } = new URL(request.url, `http://${request.headers.host}`);
        const wssMap = {
            '/api/dashboard-stream': wssDashboard, '/api/trade-stream': wssTradeStream,
            '/api/automated-trade-signals': wssAutomatedSignals, '/api/anomaly-stream': wssAnomaly,
            '/api/trade-companion-stream': wssTradeCompanion,
            '/api/execution-core-stream': wssExecutionCore,
            '/api/agent-swarm-stream': wssAgentSwarm
        };
        const wss = wssMap[pathname];
        if (wss) {
            wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
        } else {
            socket.destroy();
        }
    });
}