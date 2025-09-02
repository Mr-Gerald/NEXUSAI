import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { WebSocket } from 'ws';
import fetch from 'node-fetch'; // Kept for potential future use, but not for startup harvesting

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Real-time Data Store & Status ---
export const priceStore = {};
export let marketDataStatus = 'CONNECTING';

// --- Symbol Mapping & Asset Universe ---
export const finnhubSymbolMap = {
    "BTC/USD": "BINANCE:BTCUSDT", "ETH/USD": "BINANCE:ETHUSDT", "SOL/USD": "BINANCE:SOLUSDT",
    "XRP/USD": "BINANCE:XRPUSDT", "AVAX/USD": "BINANCE:AVAXUSDT",
    "XAU/USD": "OANDA:XAU_USD", "XAG/USD": "OANDA:XAG_USD",
    "EUR/USD": "OANDA:EUR_USD", "USD/JPY": "OANDA:USD_JPY", "GBP/USD": "OANDA:GBP_USD",
    "AUD/USD": "OANDA:AUD_USD", "USD/CAD": "OANDA:USD_CAD", "USD/CHF": "OANDA:USD_CHF",
    "EUR/JPY": "OANDA:EUR_JPY", "GBP/JPY": "OANDA:GBP_JPY", "AUD/JPY": "OANDA:AUD_JPY",
    "NZD/JPY": "OANDA:NZD_JPY",
};
const inverseFinnhubSymbolMap = Object.fromEntries(Object.entries(finnhubSymbolMap).map(([key, value]) => [value, key]));
export const ASSET_UNIVERSE = ["BTC/USD", "ETH/USD", "SOL/USD", "EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD"];
export const ASSET_BROKER_MAP = {
    "BTC/USD": "BTCUSDz", "ETH/USD": "ETHUSDz", "SOL/USD": "SOLUSDz",
    "EUR/USD": "EURUSDz", "GBP/USD": "GBPUSDz", "USD/JPY": "USDJPYz", "XAU/USD": "XAUUSDz"
};
const ASSET_FILENAME_MAP = {
    "BTC/USD": "BTCUSD_crypto.csv", "ETH/USD": "ETHUSD_crypto.csv",
    "EUR/USD": "EURUSD_forex.csv", "GBP/USD": "GBPUSD_forex.csv", "USD/JPY": "USDJPY_forex.csv",
    // Add other assets if they have corresponding CSVs
};


// --- AI Core Parameters ---
export const CALIBRATION_MIN_CANDLES = 50; 

// --- Timeframe Definitions ---
const TF_MS = {
    M5: 5 * 60 * 1000, M15: 15 * 60 * 1000, M30: 30 * 60 * 1000, H1: 60 * 60 * 1000,
};

// --- In-Memory Candle Store & Aggregator ---
export const candleStore = ASSET_UNIVERSE.reduce((acc, asset) => {
    acc[asset] = { M5: [], M15: [], M30: [], H1: [] };
    return acc;
}, {});

const timeFloor = (t, tfMs) => Math.floor(t / tfMs) * tfMs;

async function persistNewCandle(asset, candle) {
    const filename = ASSET_FILENAME_MAP[asset];
    if (!filename) return;

    try {
        const dataDir = path.resolve(__dirname, '..');
        const filePath = path.resolve(dataDir, filename);
        const date = new Date(candle.time).toISOString();
        const volume = 0; // Live feed doesn't provide volume, so we use 0
        const csvLine = `"${date}",${candle.open},${candle.high},${candle.low},${candle.close},${volume}\n`;
        await fs.appendFile(filePath, csvLine);
    } catch (error) {
        console.error(`[Self-Heal] Failed to persist new candle for ${asset}:`, error);
    }
}


export function ingestTick(asset, price, time) {
    Object.keys(TF_MS).forEach(tfName => {
        const tfMs = TF_MS[tfName];
        const bucketStart = timeFloor(time, tfMs);
        const store = candleStore[asset]?.[tfName];
        if (!store) return; // Asset not in universe

        const lastCandle = store.length > 0 ? store[store.length - 1] : null;

        if (!lastCandle || lastCandle.time !== bucketStart) {
            const newCandle = { time: bucketStart, open: price, high: price, low: price, close: price };
            store.push(newCandle);
            if (store.length > 500) store.shift();

            // [Self-Healing Data] If this is a new M5 candle, persist it to disk.
            if (tfName === 'M5') {
                persistNewCandle(asset, newCandle);
            }
        } else {
            lastCandle.high = Math.max(lastCandle.high, price);
            lastCandle.low = Math.min(lastCandle.low, price);
            lastCandle.close = price;
        }
    });
}

/**
 * [Praetorian X] - Data Harvester Stub
 * This function no longer calls the historical API to prevent startup failures on restrictive free tiers.
 * The system now uses a "self-healing" data model where fresh candles are appended to local CSVs
 * in real-time from the live WebSocket feed.
 */
export async function harvestMissingData() {
    console.log("[Praetorian X] Data Harvester: Skipping historical API check.");
    console.log("[Praetorian X] System will backfill data from the live feed.");
    console.log("[Praetorian X] Data harvesting check complete.");
}


export async function loadHistoricalDataFromCSVs() {
    console.log("Initiating Historical Data Ingestion from local CSV files...");
    const dataDir = path.resolve(__dirname, '..'); // Look for CSVs in the backend root
    const files = await fs.readdir(dataDir);
    const csvFiles = files.filter(f => f.endsWith('.csv'));

    if (csvFiles.length === 0) {
        console.warn("\x1b[33m%s\x1b[0m", "No CSV files found for historical data. AI will calibrate from live feed only.");
        return;
    }

    const parseAssetName = (filename) => {
        const name = path.parse(filename).name;
        const symbol = name.replace('_crypto', '').replace('_forex', '');
        if (["XAUUSD", "BTCUSD", "ETHUSD", "SOLUSD"].includes(symbol)) return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
        if (symbol.length === 6) return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
        return symbol;
    };
    
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
        try {
            const assetName = parseAssetName(file);
            if (!ASSET_UNIVERSE.includes(assetName)) continue;

            const filePath = path.resolve(dataDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const records = parse(content, { columns: true, skip_empty_lines: true });

            const m5Candles = records.map(row => ({
                time: new Date(row.Date).getTime(),
                open: parseFloat(row.Open), high: parseFloat(row.High),
                low: parseFloat(row.Low), close: parseFloat(row.Close),
            })).sort((a, b) => a.time - b.time);
            
            candleStore[assetName]['M5'] = m5Candles;
            candleStore[assetName]['M15'] = aggregateCandles(m5Candles, TF_MS.M15);
            candleStore[assetName]['M30'] = aggregateCandles(m5Candles, TF_MS.M30);
            candleStore[assetName]['H1'] = aggregateCandles(m5Candles, TF_MS.H1);
            
            console.log(`Successfully loaded and aggregated ${m5Candles.length} candles for ${assetName}.`);

        } catch (error) {
            console.error(`Failed to load historical data from ${file}:`, error);
        }
    }
    console.log("\x1b[32m%s\x1b[0m", "Local data ingestion complete. System is ready.");
}

export function connectToFinnhub() {
    if (!process.env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY.trim() === '') {
        console.error("\n\n\x1b[31m%s\x1b[0m", "--- FATAL ERROR: FINNHUB API KEY NOT SET ---");
        marketDataStatus = 'FAILED';
        return;
    }
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`);
    marketDataStatus = 'CONNECTING';
    
    ws.on('open', () => {
        console.log("\x1b[32m%s\x1b[0m", "Successfully connected to Finnhub stream.");
        marketDataStatus = 'LIVE';
        Object.values(finnhubSymbolMap).forEach(symbol => {
            if (symbol) ws.send(JSON.stringify({'type':'subscribe', 'symbol': symbol}));
        });
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            if (message.type === 'trade' && message.data) {
                message.data.forEach(trade => {
                    const price = parseFloat(trade.p);
                    const originalSymbol = inverseFinnhubSymbolMap[trade.s];
                    if (originalSymbol) {
                        priceStore[originalSymbol] = price;
                        ingestTick(originalSymbol, price, trade.t);
                    }
                });
            }
        } catch(e) { /* ignore parse errors */ }
    });
    
    ws.on('error', (error) => marketDataStatus = 'FAILED');
    ws.on('close', () => {
        marketDataStatus = 'CONNECTING';
        setTimeout(connectToFinnhub, 5000);
    });
}