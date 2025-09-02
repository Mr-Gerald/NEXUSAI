import { getDb } from '../db.js';
import { RR_RATIO, MINIMUM_STOP_DISTANCE, ASSET_PRECISION } from '../risk/positionSizer.js';

const ATR_PERIOD = 14;
const ATR_MULTIPLIER = 1.5;
const STALE_SETUP_CANDLES = 8; // Invalidate setup after 8 M15 candles (2 hours)
const RSI_PERIOD = 14;
const JOURNAL_LOOKBACK = 50; // Look at last 50 trades in journal
const JOURNAL_WIN_RATE_THRESHOLD = 0.4; // 40%

// --- AI Helper Functions ---
const normalizePrice = (price, asset) => {
    const precision = ASSET_PRECISION[asset] || ASSET_PRECISION['default'];
    return parseFloat(price.toFixed(precision));
};

const getMovingAverage = (candles, period) => {
    if (!candles || candles.length < period) return null;
    const closes = candles.slice(-period).map(c => c.close);
    return closes.reduce((sum, val) => sum + val, 0) / period;
};

const calculateATR = (candles, period) => {
    if (!candles || candles.length < period + 1) return 0;
    let sumOfTRs = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
        const c = candles[i];
        const p = candles[i - 1];
        sumOfTRs += Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
    }
    return sumOfTRs / period;
};

const calculateRSI = (candles, period) => {
    if (!candles || candles.length < period + 1) return null;
    const prices = candles.map(c => c.close);
    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    if (losses === 0) return 100;
    const rs = (gains / period) / (losses / period);
    return 100 - (100 / (1 + rs));
};

const findLastSwing = (candles, direction, lookback = 30) => {
    if (!candles || candles.length < lookback) return null;
    const recent = candles.slice(-lookback);
    for (let i = recent.length - 3; i > 0; i--) { // Start from third to last candle
        if (direction === 'LONG' && recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) return recent[i].low;
        if (direction === 'SHORT' && recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) return recent[i].high;
    }
    return null;
};

const isEngulfingPattern = (current, previous, direction) => {
    if (direction === 'LONG') {
        return current.close > current.open && previous.close < previous.open && // Bullish current, Bearish previous
               current.close > previous.high && current.open < previous.low; // Engulfs the whole previous candle
    } else { // SHORT
        return current.close < current.open && previous.close > previous.open && // Bearish current, Bullish previous
               current.close < previous.low && current.open > previous.high; // Engulfs the whole previous candle
    }
};


export async function runPraetorianBrain(asset, historicalCandles, state = {}) {
    const h1Candles = historicalCandles.H1;
    const m15Candles = historicalCandles.M15;
    
    if (h1Candles.length < 50 || m15Candles.length < 50) {
        return { status: 'INSUFFICIENT_DATA', message: `Insufficient data.`, newState: {} };
    }

    const lastM15 = m15Candles.slice(-1)[0];
    const prevM15 = m15Candles.slice(-2)[0];

    // --- GRAND STRATEGY (H1 BIAS) ---
    const h1MA = getMovingAverage(h1Candles, 20);
    const h1TrendStrength = Math.abs(lastM15.close - h1MA) / h1MA;

    if (h1TrendStrength < 0.0025) {
        return { status: 'NO_H1_TREND', message: 'H1 is choppy. Standing aside.', newState: {} };
    }
    const direction = lastM15.close > h1MA ? 'LONG' : 'SHORT';
    
    // --- [Praetorian X] VETO: DYNAMIC JOURNAL CHECK ---
    const db = getDb();
    const journalEntries = await db.all(`SELECT outcome FROM trade_journal WHERE asset = ? AND strategy = 'PRAETORIAN_X' ORDER BY timestamp DESC LIMIT ?`, asset, JOURNAL_LOOKBACK);
    if (journalEntries.length > 10) { // Only check if we have enough data
        const wins = journalEntries.filter(j => j.outcome === 'WIN').length;
        const winRate = wins / journalEntries.length;
        if (winRate < JOURNAL_WIN_RATE_THRESHOLD) {
             return { status: 'VETO_JOURNAL_PERF', message: `VETOED. Historical win rate for this setup is ${ (winRate * 100).toFixed(0) }%, which is below threshold.`, newState: {} };
        }
    }

    // --- TACTICAL SETUP (M15 PULLBACK & ENGULFING CONFIRMATION) ---
    const isInPullback = direction === 'LONG' ? prevM15.close < prevM15.open : prevM15.close > prevM15.open;
    if (!isInPullback) {
        return { status: 'AWAITING_PULLBACK', message: `H1 trend is ${direction}. Awaiting M15 pullback.`, newState: {} };
    }

    const isConfirmed = isEngulfingPattern(lastM15, prevM15, direction);
    if (!isConfirmed) {
        return { status: 'AWAITING_CONFIRMATION', message: `Pullback detected. Awaiting engulfing confirmation.`, newState: {} };
    }
    
    // --- [Praetorian X] VETO: MARKET STRUCTURE CHECK ---
    // (Simplified for now - can be expanded to check H4)
    const h1Swing = findLastSwing(h1Candles, direction === 'LONG' ? 'SHORT' : 'LONG', 50);
    if (h1Swing) {
        const distanceFromStructure = direction === 'LONG' ? h1Swing - lastM15.close : lastM15.close - h1Swing;
        const atrM15 = calculateATR(m15Candles, ATR_PERIOD);
        if (distanceFromStructure < atrM15 * 2) {
             return { status: 'VETO_STRUCTURE', message: `VETOED. Entry too close to major H1 structure.`, newState: {} };
        }
    }
    
    // --- [Praetorian X] VETO: RSI DIVERGENCE CHECK ---
    const m15RSI = calculateRSI(m15Candles, RSI_PERIOD);
    // (Simplified check for overbought/oversold - a full divergence check is more complex)
    if (direction === 'LONG' && m15RSI > 75) {
         return { status: 'VETO_RSI_EXHAUSTION', message: `VETOED. M15 RSI is overbought (${m15RSI.toFixed(0)}). Trend may be exhausted.`, newState: {} };
    }
    if (direction === 'SHORT' && m15RSI < 25) {
         return { status: 'VETO_RSI_EXHAUSTION', message: `VETOED. M15 RSI is oversold (${m15RSI.toFixed(0)}). Trend may be exhausted.`, newState: {} };
    }

    // --- BUILD TRADE PLAN ---
    const entryPrice = lastM15.close;
    const swingLevel = findLastSwing(m15Candles, direction, 30);
    if (!swingLevel) {
        return { status: 'VETO_NO_STRUCTURE', message: 'VETOED. No valid M15 structure for SL.', newState: {} };
    }
    
    const atr = calculateATR(m15Candles, ATR_PERIOD);
    if (atr === 0) return { status: 'VETO_RISK_INVALID', message: 'VETOED. ATR is zero.', newState: {} };

    let stopLoss = direction === 'LONG' ? swingLevel - (atr * ATR_MULTIPLIER) : swingLevel + (atr * ATR_MULTIPLIER);
    
    const minStopDistance = MINIMUM_STOP_DISTANCE[asset] || MINIMUM_STOP_DISTANCE['default'];
    if (Math.abs(entryPrice - stopLoss) < minStopDistance) {
        stopLoss = direction === 'LONG' ? entryPrice - minStopDistance : entryPrice + minStopDistance;
    }
    
    const riskDistance = Math.abs(entryPrice - stopLoss);
    if (riskDistance <= 0) return { status: 'VETO_RISK_INVALID', message: 'VETOED. Invalid risk.', newState: {} };
    
    const takeProfit = direction === 'LONG' ? entryPrice + (riskDistance * RR_RATIO) : entryPrice - (riskDistance * RR_RATIO);
    
    const plan = {
        asset, direction, entryPrice,
        sl: normalizePrice(stopLoss, asset),
        tp: normalizePrice(takeProfit, asset),
    };

    // [Praetorian X] Capture context for the journal
    const entryContext = {
        h1TrendStrength: h1TrendStrength.toFixed(4),
        rsi: m15RSI.toFixed(2),
        atr: atr.toFixed(ASSET_PRECISION[asset] || 5),
    };

    return { status: 'TRADE_READY', plan, message: `Engulfing confirmed. Firing trade.`, newState: {}, entryContext };
}