

import React, { useState, useEffect } from 'react';
// FIX: Use relative paths for component and type imports.
import Card from '../components/Card';
import { TradeBlotterEntry } from '../types';

const TradeBlotterRow: React.FC<{ trade: TradeBlotterEntry }> = ({ trade }) => {
    const isProfit = trade.pnl >= 0;
    const date = new Date(trade.timestamp);
    const formattedDate = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

    return (
        <div className="grid grid-cols-3 items-center py-4 border-b border-[var(--color-border)] last:border-b-0 animate-fade-in-fast">
            <div className="col-span-2">
                <div className="flex items-baseline space-x-3">
                    <p className="font-bold text-white text-lg">{trade.asset}</p>
                    <p className={`font-semibold text-lg ${trade.direction === 'BUY' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>{trade.direction.toLowerCase()}</p>
                     <p className="font-semibold text-lg text-white">{trade.size}</p>
                </div>
                 <div className="flex items-center space-x-4 text-xs text-[var(--color-text-secondary)] mt-1">
                    <span className="font-mono">{trade.entryPrice.toFixed(5)} &rarr; {trade.exitPrice.toFixed(5)}</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded text-[var(--color-accent-yellow)] font-mono">{trade.strategy || 'MANUAL'}</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded text-[var(--color-accent)] font-mono">{trade.regime || 'N/A'}</span>
                 </div>
            </div>
            <div className="text-right">
                <p className={`text-2xl font-bold font-mono ${isProfit ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                    {isProfit ? '+' : ''}{trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-mono mt-1">{formattedDate} {formattedTime}</p>
            </div>
        </div>
    );
};


const TradeBlotter: React.FC = () => {
    const [blotterData, setBlotterData] = useState<TradeBlotterEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlotterData = async () => {
            try {
                const response = await fetch('/api/trade-blotter');
                if (!response.ok) {
                    throw new Error('Failed to fetch trade history from server.');
                }
                const data: TradeBlotterEntry[] = await response.json();
                setBlotterData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlotterData();
    }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">Mission Debrief: Trade Blotter</h2>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-4xl font-light">
        A complete and immutable record of all executed missions. Analyze performance, review engagement parameters, and refine future attack vectors.
      </p>
      
      <Card>
        <div className="p-4 md:p-6 bg-[var(--color-bg)] rounded-lg min-h-[300px]">
            {isLoading ? (
                 <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">Loading trade history...</div>
            ) : error ? (
                <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">{error}</div>
            ) : blotterData.length > 0 ? (
                blotterData.map(trade => <TradeBlotterRow key={trade.id} trade={trade} />)
            ) : (
                <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">No closed trades found in the mission log.</div>
            )}
        </div>
      </Card>
    </div>
  );
};

export default TradeBlotter;