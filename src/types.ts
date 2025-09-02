export enum AgentStatus {
  Active = 'Active',
  Idle = 'Idle',
  Error = 'Error',
  Optimizing = 'Optimizing',
}

export interface Agent {
  id: string;
  name: string;
  specialty: string;
  status: AgentStatus;
  performance: number; // e.g., daily P&L or accuracy
  description: string;
}

export interface Trade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: string;
  status: 'Filled' | 'Pending' | 'Failed';
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Anomaly {
  id:string;
  timestamp: string;
  type: 'Spoofing' | 'Wash Trading' | 'Volume Spike' | 'Ignition' | 'Layering' | 'Stop Hunting';
  asset: string;
  severity: 'Low' | 'Medium' | 'High';
  details: string;
}

// Predictive Analytics Types
export interface RegimeForecast {
  regime: 'Trending (Bull)' | 'Trending (Bear)' | 'Ranging' | 'Volatile';
  confidence: number; // 0 to 1
}

export interface BreakoutCandidate {
  id: string;
  asset: string;
  probability: number; // 0 to 1
  direction: 'Up' | 'Down';
  timeframe?: string;
}

export interface Narrative {
  id: string;
  name: string;
  momentum: number; // 0 to 100
  description?: string;
}

// New structured rationale for deep AI analysis
export interface Rationale {
  marketStructure: string;
  manipulationCheck: string;
  keyLevels: string;
  tradeThesis: string;
}

// AI Trade Signal (for the simple feed on TradeSignals page)
export interface TradeSignal {
  id:string;
  asset: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number; // 0 to 1
  rationale: Rationale; // Changed from string to structured object
}


// --- NEW "ALPHA LIQUIDATION ENGINE" PLAYBOOK ---

// The complete, predatory analysis from the AI.
export interface AlphaPlaybook {
  id: string;
  asset: string;
  pairCategory: string;
  estimatedTimeToIgnition: string; // e.g., "5-10 minutes", "Imminent"
  expectedDuration: string; // e.g., "15-30 minutes"
  riskRewardRatio: number; // e.g., 3.5
  liquidityAnalysis: {
    heatmapSummary: string; // Textual description of the liquidity landscape.
    stopLossClusters: string; // Description of where stop orders are likely pooled.
    liquidityVoids: string; // Description of thin-ice areas in the order book.
  };
  cascadeAnalysis: {
    successProbability: number; // AI's confidence (0-100) in triggering a cascade.
    cascadeThesis: string; // The core logic for why a cascade is possible now.
    catalystAction: string; // The "nudge" required to start the cascade.
  };
  executionBlueprint: {
    direction: 'BUY' | 'SELL';
    ignitionPoint: number; // The surgical entry price to start the attack.
    liquidationZoneStart: number; // The price where the cascade is expected to begin.
    liquidationZoneEnd: number; // The price where the cascade's main force should be.
    exhaustionPoint: number; // The take-profit level where the cascade will likely lose steam.
    missionAbort: number; // The stop-loss level where the thesis is proven wrong.
  };
}

// For the active trade companion alerts
export interface TacticalAlert {
    id: string;
    timestamp: string;
    message: string;
    type: 'Info' | 'Warning' | 'Success' | 'Danger' | 'Stalking' | 'Countdown' | 'Fire' | 'Engaged' | 'Exit';
    pnl?: number;
    countdown?: number;
}

// For the new Trade Blotter page
export interface TradeBlotterEntry {
    id: string;
    asset: string;
    direction: 'BUY' | 'SELL';
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    timestamp: string;
    strategy?: string;
    regime?: string;
}

// --- AUTONOMOUS EXECUTION CORE ---
export interface AccountMetrics {
    balance: number;
    equity: number;
    livePnl: number;
    riskPercentage: number;
    equityHistory: { time: string; equity: number }[];
}

export interface LivePosition {
    id: string;
    asset: string;
    direction: 'LONG' | 'SHORT';
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    isScaling: boolean; // Is this a scaled-in position?
    takeProfit?: number;
    stopLoss?: number;
}

export interface AiLogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'INFO' | 'EXECUTION' | 'RISK' | 'SUCCESS' | 'WARNING' | 'LEARNING' | 'VETO';
}

// --- SERIES-5 "SENTINEL" AI ---
export enum AiStrategy {
    TREND_CONTINUATION = 'Trend Continuation',
    MEAN_REVERSION = 'Mean Reversion',
}
export interface PerformanceMetric {
    wins: number;
    losses: number;
    netPnl: number;
}
export type PerformanceMatrix = Record<string, Record<string, Record<string, PerformanceMetric>>>;

// --- USER AUTHENTICATION ---
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  profilePicture: string; // base64 string
}