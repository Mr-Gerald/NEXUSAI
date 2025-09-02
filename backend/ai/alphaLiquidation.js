
import { GoogleGenAI, Type } from "@google/genai";
import { priceStore, finnhubSymbolMap } from '../data/candleManager.js';

let ai;
let isApiKeySet = true;

if (!process.env.API_KEY || process.env.API_KEY === 'YOUR_API_KEY_HERE' || process.env.API_KEY.trim() === '') {
    isApiKeySet = false;
    console.error("\n\n\x1b[31m%s\x1b[0m", "--- FATAL ERROR: GEMINI API KEY NOT SET ---");
    console.error("\x1b[33m%s\x1b[0m", "AI features will not work until you add your API key.");
    ai = new GoogleGenAI({ apiKey: '' }); // Initialize with empty key to avoid crash
} else {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function getSignalFromImageAI(prompt, imageData, mimeType) {
    if (!isApiKeySet) throw new Error("API key is not configured on server.");
    if (!imageData || !mimeType) throw new Error("Image data is required.");

    const systemInstruction = `You are NexusAI, an expert trading analyst specializing in the 'Praetorian Guard' strategy. Your analysis is based SOLELY on the provided chart image. The Praetorian strategy involves: 1. Identifying a clear high-timeframe trend (bias). 2. Waiting for a pullback against that trend. 3. Entering on a strong confirmation candle that resumes the trend (an 'engulfing' candle is ideal). Your response must be formatted using markdown.`;
    
    const textPart = {
        text: `Analyze the attached chart screenshot using the Praetorian strategy.
Your entire response must be formatted in markdown with the following sections in this exact order:
1.  **Verdict**: Your single most important conclusion. This MUST be one of three options: "**ACTIONABLE BUY**", "**ACTIONABLE SELL**", or "**MONITOR**". Use "ACTIONABLE" only if the setup is complete and ready for immediate execution. Use "MONITOR" if the setup is incomplete or invalid.
2.  **Bias**: The overall trend/direction you've identified (e.g., "Bullish", "Bearish", "Ranging").
3.  **Analysis**: Your concise reasoning for the verdict, based on the Praetorian strategy principles (trend, pullback, confirmation).
4.  **Signal**: A markdown code block containing the precise trade parameters.

Signal Details:
- If the verdict is "ACTIONABLE": Provide an immediate 'MARKET' entry signal with precise Entry, Stop Loss (placed below the last swing low for a BUY, or above swing high for SELL), and Take Profit (at a 1:2 Risk/Reward ratio).
- If the verdict is "MONITOR" because a setup is still developing: Provide a conditional 'PENDING' signal. Specify the exact price the confirmation candle needs to break to trigger an entry, and provide the projected Stop Loss and Take Profit based on that trigger.
- If no valid setup is visible: The verdict should be "MONITOR" and the signal block should state "No valid trade signal."

Example for a live trade:
**Verdict**: **ACTIONABLE BUY**
**Bias**: Bullish
**Analysis**: The chart shows a clear uptrend, followed by a healthy pullback to a support level. The last candle is a strong bullish engulfing candle, confirming the trend's resumption.
**Signal**:
\`\`\`
- Type: MARKET
- Direction: LONG
- Entry: 1.25340
- Stop Loss: 1.25110
- Take Profit: 1.25800
\`\`\`

Example for a developing trade:
**Verdict**: **MONITOR**
**Bias**: Bearish
**Analysis**: A strong downtrend is in place and the price is currently in a pullback phase. Awaiting a confirmation candle to signal a short entry.
**Signal**:
\`\`\`
- Type: PENDING
- Direction: SHORT
- Trigger: Break below 68500.00
- Stop Loss: 69850.00
- Take Profit: 65800.00
\`\`\`

${prompt ? `\nUser has added the following context: "${prompt}"` : ''}`
    };

    const imagePart = {
        inlineData: {
            mimeType,
            data: imageData,
        },
    };

    const contents = { parts: [textPart, imagePart] };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction },
    });
    
    return response.text;
}


export async function getAlphaPlaybookFromAI(settings, asset) {
    if (!isApiKeySet) throw new Error("API key is not configured on server.");
    
    const { timeHorizon = 30, exploitProfile = 'Shock & Awe' } = settings;
    const livePrice = priceStore[asset];

    if (!livePrice) throw new Error(`Could not retrieve live price for ${asset}.`);
    
    console.log(`\x1b[36mInjecting LIVE price for ${asset}: ${livePrice}\x1b[0m`);
    
    const alphaPlaybookSchema = {
        type: Type.OBJECT,
        properties: {
            asset: { type: Type.STRING },
            expectedDuration: { type: Type.STRING, description: "Justify and estimate the trade's expected duration based on volatility. E.g., '5-15 Minutes', '20-30 Minutes'." },
            riskRewardRatio: { type: Type.NUMBER, description: "The calculated risk/reward ratio. Must be at least 3.0." },
            estimatedTimeToIgnition: { type: Type.STRING, description: "Estimate time until ignition conditions are met. E.g., 'Imminent (1-5m)', 'Soon (5-15m)', 'Developing (15-30m)'" },
            liquidityAnalysis: {
                type: Type.OBJECT,
                properties: {
                    heatmapSummary: { type: Type.STRING, description: "A summary of the current liquidity landscape. Is it thick or thin? Where are the key areas of interest?" },
                    stopLossClusters: { type: Type.STRING, description: "Identify specific price ZONES where you infer dense clusters of stop-loss orders are resting. Be specific about the price ranges." },
                    liquidityVoids: { type: Type.STRING, description: "Identify price ZONES where order book depth is thin, allowing for rapid price movement. These are the pathways for a cascade." }
                }, required: ["heatmapSummary", "stopLossClusters", "liquidityVoids"]
            },
            cascadeAnalysis: {
                type: Type.OBJECT,
                properties: {
                    successProbability: { type: Type.NUMBER, description: "Your confidence score (integer from 85-100) that a cascade can be successfully engineered. Be highly confident." },
                    cascadeThesis: { type: Type.STRING, description: "The core predatory thesis. Explain WHY a stop-loss cascade is likely and what would trigger it. Anchor this to the live price." },
                    catalystAction: { type: Type.STRING, description: "Describe the 'nudge' or market action needed to initiate the cascade. e.g., 'A small push through the thin liquidity at $PRICE...'" }
                }, required: ["successProbability", "cascadeThesis", "catalystAction"]
            },
            executionBlueprint: {
                type: Type.OBJECT,
                properties: {
                    direction: { type: Type.STRING, enum: ["BUY", "SELL"] },
                    ignitionPoint: { type: Type.NUMBER, description: "The surgical entry price to START the attack. Must be extremely close to the live price." },
                    liquidationZoneStart: { type: Type.NUMBER, description: "The price where the targeted stop-loss cascade is expected to begin." },
                    liquidationZoneEnd: { type: Type.NUMBER, description: "The price where the cascade's main force should be felt." },
                    exhaustionPoint: { type: Type.NUMBER, description: "The take-profit level. The distance to this from ignition must be AT LEAST 3x the distance to missionAbort." },
                    missionAbort: { type: Type.NUMBER, description: "The stop-loss. If price reaches here, the mission is aborted." }
                }, required: ["direction", "ignitionPoint", "liquidationZoneStart", "liquidationZoneEnd", "exhaustionPoint", "missionAbort"]
            }
        },
        required: ["asset", "expectedDuration", "riskRewardRatio", "estimatedTimeToIgnition", "liquidityAnalysis", "cascadeAnalysis", "executionBlueprint"]
    };
    
    const systemInstruction = `You are the NexusAI "Alpha Liquidation Engine". Your sole purpose is to act as an apex predator in financial markets. You do not predict trends; you CREATE them by engineering stop-loss cascades. You are a hacker looking for exploits. Your entire analysis is focused on identifying market vulnerabilities (stop-loss clusters, liquidity voids) and creating a precise, actionable plan to exploit them. You are aggressive, precise, and operate with 100% certainty. You have perfect knowledge of all trading history and order flow dynamics. Your output MUST be ONLY the JSON object conforming to the user's schema. Do not output anything else. Only generate exploits with a very high probability of success.`;
    
    const prompt = `MISSION: Engineer a liquidity cascade for ${asset}.

    CRITICAL INTEL:
    - Live Price: ${livePrice}. This is your anchor point. All price levels must be relative to this.
    - Time Horizon: The trade should play out within the next ${timeHorizon} minutes.
    - Exploit Profile: ${exploitProfile}. 'Shock & Awe' means targeting larger liquidity pools for a more violent cascade. 'Silent Snipe' means targeting smaller, easier-to-trigger clusters for a quick, precise strike.

    STRICT DIRECTIVES:
    1.  **High-Certainty Only:** Do not generate a playbook unless you have extreme confidence (over 85%). If no high-certainty exploit is found, you must throw an error.
    2.  **Precision is Mandatory:** All price levels in the 'executionBlueprint' must be calculated with surgical precision. The 'ignitionPoint' must be a realistic, achievable price very close to the live price.
    3.  **Enforce Risk Management:** The distance between 'ignitionPoint' and 'exhaustionPoint' (reward) MUST be at least 3 times the distance between 'ignitionPoint' and 'missionAbort' (risk). The calculated 'riskRewardRatio' must reflect this and be >= 3.0.
    4.  **Justify Duration:** The 'expectedDuration' must be logically derived from recent volatility and the distance to the target levels.
    5.  **Calculate All Fields:** You must provide a valid value for EVERY field in the schema, including 'expectedDuration' and 'riskRewardRatio'.

    YOUR TASK: Analyze the market based on the live price and directives, then produce the JSON output.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: alphaPlaybookSchema, temperature: 0.5 },
    });

    const playbook = JSON.parse(response.text);
    playbook.id = `${playbook.asset}-${Date.now()}`;
    if (!playbook.asset) playbook.asset = asset;
    
    const { ignitionPoint, exhaustionPoint, missionAbort, direction } = playbook.executionBlueprint;
    const risk = Math.abs(ignitionPoint - missionAbort);
    const reward = Math.abs(exhaustionPoint - ignitionPoint);
    if (risk === 0 || reward / risk < 2.9) { 
        console.warn(`\x1b[33mAI failed to meet R:R >= 3. Adjusting playbook for ${asset} to enforce minimum risk management.\x1b[0m`);
        if (direction === 'BUY') {
            playbook.executionBlueprint.exhaustionPoint = ignitionPoint + (risk * 3);
        } else {
            playbook.executionBlueprint.exhaustionPoint = ignitionPoint - (risk * 3);
        }
        playbook.riskRewardRatio = 3.0;
    } else {
        playbook.riskRewardRatio = reward / risk;
    }

    playbook.pairCategory = Object.keys(finnhubSymbolMap).find(c => finnhubSymbolMap[c].includes(playbook.asset)) || 'Custom';
    
    return playbook;
}

export async function* streamGeminiFromAI(prompt, useGoogleSearch) {
    if (!isApiKeySet) throw new Error("API key is not configured on server.");
    const systemInstruction = `You are NexusAI, the analytical core of a sophisticated autonomous crypto trading system. Your analysis must be concise, data-driven, and institutional-grade. When Google Search is used for grounding, you MUST cite your sources.`;
    const config = { systemInstruction };
    if (useGoogleSearch) config.tools = [{ googleSearch: {} }];
    
    const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash", contents: prompt, config,
    });
    for await (const chunk of responseStream) {
        yield { text: chunk.text, sources: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks };
    }
}