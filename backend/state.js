
// --- Active Trade Companion Store ---
// K: clientId, V: { playbook, ws, state, countdown, lastState }
export const activePlaybooks = new Map(); 

// --- Autonomous Execution Core Store ---
// K: connectorId, V: ExecutionCoreHandler instance
// This map holds the active AI logic handlers, keyed by the persistent connectorId.
export const executionCores = new Map(); 

// --- MT5 Connector to Client Mapping ---
// K: connectorId, V: Set<clientId>
// Maps a persistent connector to a set of transient UI client IDs.
export const connectorToClientMap = new Map();

// --- MT5 Heartbeat Authentication Store ---
// K: connectorId, V: timestamp of last valid heartbeat
export const lastHeartbeatMap = new Map();

// --- NEW: Persistent State Store ---
// This is the source of truth for an EA's state, keyed by the persistent connectorId.
// This allows UI clients to disconnect and reconnect without state loss.
// K: connectorId, V: { isActive, metrics, positions, logs, commandQueue, positionTheses, openIntents, ... }
export const connectorStates = new Map();