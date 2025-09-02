


// FIX: Use relative paths for type imports.
import type { GroundingChunk, TradeSignal, AlphaPlaybook } from '../types';

interface StreamChunk {
    text: string;
    sources?: GroundingChunk[];
}

// --- Data for the new Predictive Analytics Scanner ---
const ALL_PAIRS = {
    "High Volatility Forex": ["EUR/JPY", "GBP/JPY", "AUD/JPY", "NZD/JPY", "GBP/USD"],
    "Major Forex Pairs": ["EUR/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD"],
    "Major Crypto Pairs": ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "AVAX/USD"],
    "Commodities": ["XAU/USD", "XAG/USD", "WTI/USD (Oil)"],
    "Stock Indices": ["US30", "SPX500", "NAS100", "GER30", "UK100"],
    "Exotic Opportunities": ["USD/TRY", "USD/ZAR", "EUR/TRY", "USD/MXN"],
};

export async function getSignalFromImage(prompt: string, imageFile: File): Promise<string> {
    const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    const response = await fetch('/api/gemini-vision-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageData: base64data, mimeType: imageFile.type }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({error: 'Failed to get analysis from image.'}));
        throw new Error(errorData.error || 'An unknown error occurred.');
    }

    const data = await response.json();
    return data.analysis;
}


/**
 * Gets an on-demand predatory playbook by calling the backend proxy.
 */
export async function getAlphaPlaybook(asset: string, settings: any): Promise<AlphaPlaybook> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout for complex generation

    try {
        const response = await fetch('/api/predictive-signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asset, settings }),
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({error: `Server responded with status ${response.status}`}));
            throw new Error(errorData.error || 'Failed to fetch alpha playbook.');
        }
        return await response.json() as AlphaPlaybook;

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Analysis for ${asset} timed out. The backend server is not responding, which could be due to a network issue or high load.`);
        }
        console.error("Error fetching alpha playbook for " + asset + ":", error);
        throw error;
    }
}


/**
 * Streams analysis from the Gemini API via our backend using Server-Sent Events (SSE).
 * @param prompt The user's prompt for the AI.
 * @param useGoogleSearch Whether to enable Google Search grounding.
 */
export async function* streamGemini(prompt: string, useGoogleSearch: boolean = false): AsyncGenerator<StreamChunk> {
    const url = `/api/gemini-stream?prompt=${encodeURIComponent(prompt)}&useGoogleSearch=${useGoogleSearch}`;
    const eventSource = new EventSource(url);
    let streamClosed = false;
    
    // Using a queue and a deferred promise to bridge the event-driven EventSource and the pull-driven async generator.
    let deferred: { resolve: (value: IteratorResult<StreamChunk>) => void; reject: (reason?: any) => void; } | null = null;
    const queue: any[] = [];

    const closeStream = () => {
        if (!streamClosed) {
            eventSource.close();
            streamClosed = true;
            if (deferred) {
                // Fulfill the pending promise to unblock the generator loop and let it terminate.
                deferred.resolve({ value: undefined, done: true });
                deferred = null;
            }
        }
    };
    
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) {
            if (deferred) {
                deferred.reject(new Error(data.error));
            } else {
                queue.push({ error: data.error });
            }
            closeStream();
            return;
        }
        if (deferred) {
            deferred.resolve({ value: data, done: false });
            deferred = null;
        } else {
            queue.push(data);
        }
    };

    // Custom 'end' event sent from server upon successful completion
    eventSource.addEventListener('end', () => {
        closeStream();
    });

    eventSource.onerror = () => {
        // The 'error' event can fire on a clean close. We only treat it as a fatal error
        // if the stream hasn't already been gracefully closed by our 'end' event.
        if (!streamClosed) {
            const errorMessage = "Connection to AI stream failed. The server might be down or an error occurred.";
            if (deferred) {
                deferred.reject(new Error(errorMessage));
            } else {
                queue.push({ error: errorMessage });
            }
            closeStream();
        }
    };

    try {
        while (true) {
            if (queue.length > 0) {
                const data = queue.shift();
                if (data.error) throw new Error(data.error);
                yield data;
            } else if (streamClosed) {
                return; // Exit the generator loop
            } else {
                // Wait for the next message or the stream to close
                yield await new Promise<StreamChunk>((resolve, reject) => {
                    deferred = { resolve: (result) => resolve(result.value), reject };
                });
            }
        }
    } finally {
        // Ensure cleanup happens even if the consumer stops iterating
        closeStream();
    }
}


/**
 * Main function for the new Predictive Analytics page.
 * Performs a LIVE, parallelized scan across multiple assets by making concurrent API calls.
 */
export async function scanForOpportunities(settings: any): Promise<AlphaPlaybook[]> {
    console.log("Initiating LIVE market scan for Alpha Playbooks with settings:", settings);

    let pairsToScan: string[] = [];
    if (settings.marketCoverage === 'All') {
        pairsToScan = [
            "BTC/USD", "ETH/USD", "SOL/USD", "EUR/USD", "USD/JPY", "GBP/JPY", "XAU/USD", "SPX500",
        ];
    } else {
        pairsToScan = settings.customPairs;
    }

    if (pairsToScan.length === 0) {
        throw new Error("No pairs selected for scanning. Please select at least one pair.");
    }

    const promises = pairsToScan.map(pair => getAlphaPlaybook(pair, settings).then(
        value => ({ status: 'fulfilled' as const, value }),
        reason => ({ status: 'rejected' as const, reason, pair })
    ));

    const results = await Promise.all(promises);

    const successfulPlaybooks: AlphaPlaybook[] = [];
    const failedReasons: string[] = [];
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            successfulPlaybooks.push(result.value);
        } else {
            console.error(`Playbook generation failed for ${result.pair}:`, result.reason);
            failedReasons.push(result.reason.message || `Unknown error for ${result.pair}`);
        }
    });

    if (successfulPlaybooks.length === 0) {
        const uniqueReasons = [...new Set(failedReasons)];
        const errorMessage = `AI analysis failed for all selected pairs. Common reason: ${uniqueReasons.join('. ')}`;
        throw new Error(errorMessage);
    }
    
    // Sort by the cascade success probability.
    return successfulPlaybooks.sort((a, b) => b.cascadeAnalysis.successProbability - a.cascadeAnalysis.successProbability);
}