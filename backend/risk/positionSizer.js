// --- Core Trading Parameters ---
export const RISK_PER_TRADE = 0.01; // 1% risk per trade
export const RR_RATIO = 2.0; // 1:2 Risk to Reward

// --- CRITICAL ASSET SPECIFICATIONS FOR RISK & EXECUTION ---
// Value of a 1-point move for 1 standard lot
export const POINT_VALUES = {
    "BTC/USD": 1, "ETH/USD": 1, "SOL/USD": 1,
    "XAU/USD": 100,
    "USD/JPY": 100000, "GBP/JPY": 100000, "EUR/JPY": 100000, "AUD/JPY": 100000, "NZD/JPY": 100000,
    "EUR/USD": 100000, "GBP/USD": 100000, "AUD/USD": 100000, "USD/CAD": 100000, "USD/CHF": 100000,
};
// Required decimal places for order execution
export const ASSET_PRECISION = {
    "BTC/USD": 2, "ETH/USD": 2, "SOL/USD": 3, "XAU/USD": 2,
    "USD/JPY": 3, "GBP/JPY": 3, "EUR/JPY": 3, "AUD/JPY": 3, "NZD/JPY": 3,
    "default": 5,
};
// Minimum distance from market price for SL/TP orders (in price units)
export const MINIMUM_STOP_DISTANCE = {
    "BTC/USD": 150.0, "ETH/USD": 10.0, "SOL/USD": 0.5, "XAU/USD": 1.5,
    "USD/JPY": 0.050, "GBP/JPY": 0.050,
    "default": 0.00050
};

export const calculatePositionSize = (equity, riskPercentage, entryPrice, stopLoss, asset) => {
    if (!equity || equity <= 0) return 0;
    
    const dollarsAtRisk = equity * riskPercentage;
    const stopLossPoints = Math.abs(entryPrice - stopLoss);
    if (stopLossPoints === 0) return 0;

    const pointValue = POINT_VALUES[asset];
    if (!pointValue) {
        console.error(`CRITICAL RISK ERROR: No point value for ${asset}.`);
        return 0;
    }

    const riskInQuoteCurrencyPerLot = stopLossPoints * pointValue;
    const quoteCurrency = asset.split('/')[1];
    let riskInUsdPerLot;

    if (quoteCurrency === 'USD') {
        riskInUsdPerLot = riskInQuoteCurrencyPerLot;
    } else {
        if (asset.startsWith('USD/')) {
            if (entryPrice === 0) return 0;
            riskInUsdPerLot = riskInQuoteCurrencyPerLot / entryPrice;
        } else {
            console.error(`CRITICAL RISK ERROR: Cannot convert risk for exotic pair ${asset}. Trading vetoed.`);
            return 0;
        }
    }
    
    if (riskInUsdPerLot <= 0) return 0;
    const size = dollarsAtRisk / riskInUsdPerLot;
    const quantizedSize = Math.floor(size / 0.01) * 0.01;
    if (quantizedSize < 0.01) return 0;
    return Math.min(50, quantizedSize); // Cap at 50 lots max.
};