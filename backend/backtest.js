
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import { parse } from "csv-parse/sync";
import { runPraetorianBrain } from "./ai/praetorian.js";
import { calculatePositionSize, RISK_PER_TRADE } from './risk/positionSizer.js';

// --- Backtester Configuration ---
const INITIAL_EQUITY = 100000; // Starting capital for the simulation
const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

// --- Main Backtest Runner ---
async function runBacktest() {
    console.log("--- NexusAI Strategy Backtester ---");
    console.log("Loading historical data...");
    
    const { historicalData, assets } = await loadAllHistoricalData();

    if (assets.length === 0) {
        console.error("No valid historical data found. Exiting.");
        return;
    }
    
    console.log(`Loaded data for ${assets.length} assets: ${assets.join(', ')}`);
    console.log("Running simulation...");

    let equity = INITIAL_EQUITY;
    let trades = [];
    let peakEquity = INITIAL_EQUITY;
    let maxDrawdown = 0;

    // We will iterate through the M15 timeframe as it's the AI's primary setup chart
    const simulationLength = Math.max(...assets.map(a => historicalData[a]?.M15.length || 0));

    for (let i = 50; i < simulationLength; i++) { // Start after min calibration period
        for (const asset of assets) {
            if (!historicalData[asset] || i >= historicalData[asset].M15.length) continue;
            
            const currentCandleStore = {
                M5: sliceUntil(historicalData[asset].M5, historicalData[asset].M15[i].time),
                M15: historicalData[asset].M15.slice(0, i + 1),
                M30: sliceUntil(historicalData[asset].M30, historicalData[asset].M15[i].time),
                H1: sliceUntil(historicalData[asset].H1, historicalData[asset].M15[i].time),
            };

            const brainResult = runPraetorianBrain(asset, currentCandleStore);

            // CRITICAL FIX: Ensure a trade is ready before proceeding
            if (brainResult && brainResult.status === 'TRADE_READY' && brainResult.plan) {
                const tradePlan = brainResult.plan;
                const size = calculatePositionSize(equity, RISK_PER_TRADE, tradePlan.entryPrice, tradePlan.sl, asset);
                if (size <= 0) continue;

                const { outcome, exitPrice, exitIndex } = simulateTradeOutcome(historicalData[asset].M15, i, tradePlan);

                let pnl;
                const dollarsAtRisk = equity * RISK_PER_TRADE;

                if (outcome === 'TP') {
                    pnl = dollarsAtRisk * 2.0; // Praetorian brain uses a fixed 2.0 RR ratio
                } else if (outcome === 'SL') {
                    pnl = -dollarsAtRisk;
                } else { // EOD (End of Data) close
                    const stopDistance = Math.abs(tradePlan.entryPrice - tradePlan.sl);
                    if(stopDistance > 0) {
                        const partialMove = (exitPrice - tradePlan.entryPrice) / stopDistance;
                        pnl = dollarsAtRisk * partialMove * (tradePlan.direction === 'LONG' ? 1 : -1);
                    } else {
                        pnl = 0;
                    }
                }


                equity += pnl;
                peakEquity = Math.max(peakEquity, equity);
                const drawdown = ((peakEquity - equity) / peakEquity) * 100;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
                
                trades.push({
                    asset: asset,
                    entryIndex: i,
                    exitIndex: exitIndex,
                    direction: tradePlan.direction,
                    entryPrice: tradePlan.entryPrice,
                    exitPrice: exitPrice,
                    sl: tradePlan.sl,
                    tp: tradePlan.tp,
                    pnl: pnl,
                    outcome: outcome,
                    equityAfter: equity,
                });

                if (exitIndex > i) {
                    i = exitIndex; // Jump forward in time to avoid re-evaluating inside a closed trade
                }
            }
        }
    }
    
    printResults(trades, INITIAL_EQUITY, equity, maxDrawdown);
}

// --- Helper Functions ---

function simulateTradeOutcome(candles, entryIndex, tradePlan) {
    for (let j = entryIndex + 1; j < candles.length; j++) {
        const candle = candles[j];
        if (tradePlan.direction === 'LONG') {
            if (candle.low <= tradePlan.sl) return { outcome: 'SL', exitPrice: tradePlan.sl, exitIndex: j };
            if (candle.high >= tradePlan.tp) return { outcome: 'TP', exitPrice: tradePlan.tp, exitIndex: j };
        } else { // SHORT
            if (candle.high >= tradePlan.sl) return { outcome: 'SL', exitPrice: tradePlan.sl, exitIndex: j };
            if (candle.low <= tradePlan.tp) return { outcome: 'TP', exitPrice: tradePlan.tp, exitIndex: j };
        }
    }
    const lastPrice = candles[candles.length-1].close;
    return { outcome: 'EOD', exitPrice: lastPrice, exitIndex: candles.length -1 };
}

function printResults(trades, startEquity, finalEquity, maxDrawdown) {
    const wins = trades.filter(t => t.pnl > 0).length;
    const losses = trades.filter(t => t.pnl <= 0).length;
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const netPnl = finalEquity - startEquity;
    const totalWon = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLost = trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    const profitFactor = totalLost > 0 ? totalWon / totalLost : Infinity;

    console.log("\n--- Mission Debrief: Backtest Results ---");
    console.log("========================================");
    console.log(`Initial Equity: \t$${startEquity.toFixed(2)}`);
    console.log(`Final Equity:   \t$${finalEquity.toFixed(2)}`);
    console.log(`Net P&L:        \t$${netPnl.toFixed(2)}`);
    console.log(`Total Return:   \t${((netPnl / startEquity) * 100).toFixed(2)}%`);
    console.log("----------------------------------------");
    console.log(`Total Trades:   \t${totalTrades}`);
    console.log(`Wins:           \t${wins}`);
    console.log(`Losses:         \t${losses}`);
    console.log(`Win Rate:       \t${winRate.toFixed(2)}%`);
    console.log(`Profit Factor:  \t${profitFactor.toFixed(2)}`);
    console.log(`Max Drawdown:   \t${maxDrawdown.toFixed(2)}%`);
    console.log("========================================");
}

async function loadAllHistoricalData() {
    const files = await fs.readdir(DATA_DIR);
    const csvFiles = files.filter(f => f.endsWith('.csv'));
    const historicalData = {};
    const assets = [];

    const parseAssetName = (filename) => {
        const name = path.parse(filename).name;
        const symbol = name.replace('_crypto', '').replace('_forex', '');
        if (["XAUUSD", "BTCUSD", "ETHUSD", "SOLUSD"].includes(symbol)) {
            return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
        }
        if (symbol.length === 6) {
             return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
        }
        return symbol;
    };

    const timeFloor = (t, tfMs) => Math.floor(t / tfMs) * tfMs;
    const aggregateCandles = (m5Candles, targetTfMs) => {
        if (!m5Candles || m5Candles.length === 0) return [];
        const aggregated = [];
        let currentAggCandle = null;
        for (const candle of m5Candles) {
            const bucketStart = timeFloor(candle.time, targetTfMs);
            if (!currentAggCandle || currentAggCandle.time !== bucketStart) {
                currentAggCandle = { time: bucketStart, open: candle.open, high: candle.high, low: candle.low, close: candle.close };
                aggregated.push(currentAggCandle);
            } else {
                currentAggCandle.high = Math.max(currentAggCandle.high, candle.high);
                currentAggCandle.low = Math.min(currentAggCandle.low, candle.low);
                currentAggCandle.close = candle.close;
            }
        }
        return aggregated;
    };

    for (const file of csvFiles) {
        const assetName = parseAssetName(file);
        const filePath = path.resolve(DATA_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const records = parse(content, { columns: true, skip_empty_lines: true });

        const m5Candles = records.map(row => ({
            time: new Date(row.Date).getTime(),
            open: parseFloat(row.Open),
            high: parseFloat(row.High),
            low: parseFloat(row.Low),
            close: parseFloat(row.Close),
        })).sort((a, b) => a.time - b.time);
        
        historicalData[assetName] = {
            M5: m5Candles,
            M15: aggregateCandles(m5Candles, 15 * 60 * 1000),
            M30: aggregateCandles(m5Candles, 30 * 60 * 1000),
            H1: aggregateCandles(m5Candles, 60 * 60 * 1000),
        };
        assets.push(assetName);
    }
    return { historicalData, assets };
}

const sliceUntil = (candles, timestamp) => {
    const index = candles.findIndex(c => c.time > timestamp);
    return index === -1 ? candles : candles.slice(0, index);
};

runBacktest().catch(console.error);