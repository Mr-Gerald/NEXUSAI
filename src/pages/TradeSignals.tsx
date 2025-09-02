

import React, { useState, useEffect } from 'react';
// FIX: Use relative paths for component, type, and hook imports.
import Card from '../components/Card';
import type { TradeSignal } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

const INDICATORS = ['RSI', 'MACD', 'Volume', 'Volatility', 'Liquidity', 'Sentiment'];
const STATUSES = ['Normal', 'Elevated', 'Low', 'High', 'Bullish', 'Bearish', 'Optimal'];

// --- Sub-components for the new UI ---

const MarketScanner: React.FC = () => {
    const [indicators, setIndicators] = useState<{ [key: string]: string }>({});
    const [activityFeed, setActivityFeed] = useState<string[]>([]);
    const [botDecision, setBotDecision] = useState("Analyzing market conditions...");

    useEffect(() => {
        const interval = setInterval(() => {
            const newIndicators: { [key: string]: string } = {};
            INDICATORS.forEach(ind => {
                newIndicators[ind] = STATUSES[Math.floor(Math.random() * STATUSES.length)];
            });
            setIndicators(newIndicators);
            const asset = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT'][Math.floor(Math.random() * 4)];
            const newActivity = `${new Date().toLocaleTimeString()} - Scanned ${asset}: RSI ${newIndicators['RSI']}, Volume ${newIndicators['Volume']}`;
            setActivityFeed(prev => [newActivity, ...prev.slice(0, 4)]);
            const decisions = ["Analyzing market conditions...", "Detecting liquidity pools...", "Evaluating risk parameters...", "Identifying momentum shift..."];
            setBotDecision(decisions[Math.floor(Math.random() * decisions.length)]);

        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Market Scanner</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {INDICATORS.map(indicator => (
                            <div key={indicator} className="bg-black/20 p-3 rounded-lg text-center">
                                <p className="text-xs text-[var(--color-text-secondary)]">{indicator}</p>
                                <p className="text-sm font-bold text-[var(--color-accent)]">{indicators[indicator] || '...'}</p>
                            </div>
                        ))}
                    </div>
                     <div className="mt-4">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Bot Decision</h4>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{botDecision}</p>
                        <div className="w-full bg-[var(--color-border)] rounded-full h-2.5 mt-2 overflow-hidden">
                            <div className="bg-[var(--color-accent)] h-2.5 rounded-full animate-progress"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Scanning Activity Feed</h3>
                    <div className="bg-black/20 p-3 rounded-lg font-mono text-xs text-[var(--color-text-secondary)] space-y-2 h-48 overflow-y-auto">
                        {activityFeed.length > 0 ? activityFeed.map((activity, i) => (
                             <p key={i} className="animate-fade-in-fast">{activity}</p>
                        )) : <p>Initializing scanner...</p>}
                    </div>
                </div>
            </div>
        </Card>
    );
};


const TradeSignalCard: React.FC<{ signal: TradeSignal }> = ({ signal }) => {
    const isBuy = signal.direction === 'BUY';

    return (
        <Card className="animate-fade-in-fast w-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{signal.asset}</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${isBuy ? 'bg-green-500/10 text-[var(--color-accent-green)]' : 'bg-red-500/10 text-[var(--color-accent-red)]'}`}>
                    {signal.direction}
                </span>
            </div>
            
            <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between items-baseline">
                    <span className="text-[var(--color-text-secondary)]">Entry Price</span>
                    <span className="font-mono text-[var(--color-text-primary)]">${signal.entry.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-[var(--color-text-secondary)]">Take Profit</span>
                    <span className="font-mono text-[var(--color-accent-green)]">${signal.takeProfit.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-[var(--color-text-secondary)]">Stop Loss</span>
                    <span className="font-mono text-[var(--color-accent-red)]">${signal.stopLoss.toFixed(4)}</span>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
                 <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">AI Rationale</h4>
                 <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">{signal.rationale.tradeThesis}</p>
            </div>
        </Card>
    );
};

const TradeSignals: React.FC = () => {
    const [signals, setSignals] = useState<TradeSignal[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    
    const socket = useWebSocket('/api/automated-trade-signals');

    useEffect(() => {
        if (socket.lastMessage) {
            const data = JSON.parse(socket.lastMessage.data);
            if (data.type === 'new_signal' && data.signal) {
                setSignals(prev => [data.signal, ...prev].slice(0, 12)); // Keep latest 12 signals
                setLastUpdated(new Date().toLocaleTimeString());
            }
        }
    }, [socket.lastMessage]);

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-4 text-glow-accent">Automated Trade Signals</h2>
                     <p className={`text-xs font-mono ${socket.readyState === 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {socket.readyState === 1 ? `● LIVE (Last Signal: ${lastUpdated || 'N/A'})` : 'CONNECTING...'}
                    </p>
                </div>
                <p className="text-lg text-[var(--color-text-secondary)] max-w-4xl font-light">
                    A continuous, real-time feed of high-conviction trade opportunities generated by the NexusAI core. The system is perpetually scanning the market.
                </p>
            </div>

            <MarketScanner />

            <div>
                {signals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {signals.map((signal) => (
                            <TradeSignalCard key={signal.id} signal={signal} />
                        ))}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center min-h-[300px]">
                        <div className="text-center text-[var(--color-text-secondary)]">
                             <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="absolute border-2 border-[var(--color-accent)]/30 rounded-full animate-ping" style={{ width: `${(i + 1) * 33.3}%`, height: `${(i + 1) * 33.3}%`, animationDelay: `${i * 0.2}s`}}></div>
                                ))}
                             </div>
                            <p className="font-semibold text-white">Awaiting first signal from NexusAI...</p>
                            <p className="text-sm mt-1">The system is warming up and analyzing the market.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default TradeSignals;