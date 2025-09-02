

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// FIX: Use relative paths for component, type, context, and hook imports.
import Card from '../components/Card';
import { AreaChart, Area, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AccountMetrics, LivePosition, AiLogEntry, User } from '../types';
import { LockIcon } from '../components/icons/LockIcon';
import { BulbIcon } from '../components/icons/BulbIcon';
import Sparkline from '../components/Sparkline';
import { LayersIcon } from '../components/icons/LayersIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { PowerOffIcon } from '../components/icons/PowerOffIcon';

const MetricDisplay: React.FC<{ title: string; value: string | number; color?: string; unit?: string; small?: boolean }> = ({ title, value, color, unit, small }) => (
    <div className="bg-black/20 p-4 rounded-lg text-center flex-1">
        <p className={`text-[var(--color-text-secondary)] ${small ? 'text-xs' : 'text-sm'}`}>{title}</p>
        <p className={`font-bold font-mono ${color || 'text-white'} ${small ? 'text-xl' : 'text-2xl'}`}>
            {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
            {unit && <span className={`ml-1 ${small ? 'text-base' : 'text-lg'}`}>{unit}</span>}
        </p>
    </div>
);

const SentinelAiCore: React.FC<{
    aiState: {
        bias: string;
        tacticalState: string;
        regime: string;
        focusedAsset: string | null;
        priceHistory: { value: number }[];
        activeStrategy: string;
        performanceMatrix: any;
    }
}> = ({ aiState }) => {
     const { bias, tacticalState, regime, focusedAsset, priceHistory, activeStrategy, performanceMatrix } = aiState;
    const biasConfig = {
        BULLISH: { text: 'BULLISH', color: 'text-[var(--color-accent-green)]' },
        BEARISH: { text: 'BEARISH', color: 'text-[var(--color-accent-red)]' },
        NEUTRAL: { text: 'NEUTRAL', color: 'text-[var(--color-accent-yellow)]' },
    };
    const currentBias = biasConfig[bias as keyof typeof biasConfig] || biasConfig.NEUTRAL;

    const currentRegimePerformance = focusedAsset && regime && performanceMatrix?.[focusedAsset]?.[regime]
        ? performanceMatrix[focusedAsset][regime]
        : null;
    
    const getWinRate = (strategy: string) => {
        if (!currentRegimePerformance || !currentRegimePerformance[strategy]) return { rate: 'N/A', trades: 0 };
        const { wins, losses } = currentRegimePerformance[strategy];
        const total = wins + losses;
        if (total === 0) return { rate: 'N/A', trades: 0 };
        return {
            rate: `${((wins / total) * 100).toFixed(1)}%`,
            trades: total,
        };
    };

    return (
        <Card className="h-full flex flex-col">
            {/* FIX: Updated AI Core title for branding consistency. */}
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><BulbIcon className="w-5 h-5" /> Praetorian X Core</h3>
            <p className="text-xs text-center font-mono text-[var(--color-text-secondary)] -mt-1 mb-4">FOCUSED ASSET: <span className="text-white font-bold">{focusedAsset || 'SCANNING...'}</span></p>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                 <div className="bg-black/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CogIcon className="w-4 h-4 text-[var(--color-text-secondary)]"/>
                        <p className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold">Market Regime</p>
                    </div>
                    <p className="text-lg font-mono font-semibold mt-1 text-[var(--color-accent)]">{regime.replace(/_/g, ' ')}</p>
                </div>
                 <div className="bg-black/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <BrainIcon className="w-4 h-4 text-[var(--color-text-secondary)]"/>
                        <p className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold">Active Strategy</p>
                    </div>
                     {/* FIX: Updated strategy display name. */}
                    <p className="text-lg font-mono font-semibold mt-1 text-[var(--color-accent-yellow)]">{activeStrategy?.replace(/_/g, ' ') || 'SELECTING...'}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <LayersIcon className="w-4 h-4 text-[var(--color-text-secondary)]"/>
                        {/* FIX: Clarified that bias is from the H1 chart. */}
                        <p className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold">Structural Bias (H1)</p>
                    </div>
                    <p className={`text-xl font-bold mt-1 ${currentBias.color}`}>{currentBias.text}</p>
                    <div className="h-10 -mb-2 -mx-1">
                        <Sparkline data={priceHistory} color={
                            bias === 'BULLISH' ? 'var(--color-accent-green)' : bias === 'BEARISH' ? 'var(--color-accent-red)' : 'var(--color-accent-yellow)'
                        } />
                    </div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <TargetIcon className="w-4 h-4 text-[var(--color-text-secondary)]"/>
                        {/* FIX: Clarified that tactical state is from the M15 chart. */}
                        <p className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold">Tactical State (M15)</p>
                    </div>
                    <p className="text-lg font-mono font-semibold mt-1 text-[var(--color-accent)]">{tacticalState.replace(/_/g, ' ')}</p>
                </div>
            </div>
        </Card>
    );
};

const getLogColor = (type: AiLogEntry['type']) => {
    switch (type) {
        case 'EXECUTION': return 'text-[var(--color-accent)]';
        case 'SUCCESS': return 'text-[var(--color-accent-green)]';
        case 'RISK': return 'text-[var(--color-accent-red)]';
        // FIX: Added a distinct style for VETO logs.
        case 'VETO': return 'text-[var(--color-accent-red)] font-bold';
        case 'WARNING': return 'text-[var(--color-accent-yellow)]';
        case 'LEARNING': return 'text-[var(--color-accent-yellow)]';
        default: return 'text-[var(--color-text-secondary)]';
    }
};

const AutonomousDashboard: React.FC<{ onDisconnect: () => void, wsState: any, connectorId: string }> = ({ onDisconnect, wsState, connectorId }) => {
    const [aiStatus, setAiStatus] = useState<'INACTIVE' | 'ACTIVE'>('INACTIVE');
    const [metrics, setMetrics] = useState<AccountMetrics | null>(null);
    const [positions, setPositions] = useState<LivePosition[]>([]);
    const [logs, setLogs] = useState<AiLogEntry[]>([]);
    const [aiIntel, setAiIntel] = useState({ bias: 'NEUTRAL', tacticalState: 'INITIALIZING', regime: 'INITIALIZING', focusedAsset: null, priceHistory: [], activeStrategy: 'SELECTING', performanceMatrix: {} });

    useEffect(() => {
        if (wsState.lastMessage) {
            const data = JSON.parse(wsState.lastMessage.data);
            if (data.type === 'update') {
                setMetrics(data.metrics);
                setPositions(data.positions);
                setLogs(data.logs);
                setAiStatus(data.isActive ? 'ACTIVE' : 'INACTIVE');
                if(data.aiState) {
                    setAiIntel(data.aiState);
                }
            }
        }
    }, [wsState.lastMessage]);

    const handleToggleAi = async () => {
        const newStatus = aiStatus === 'ACTIVE' ? false : true;
        try {
            await fetch('/api/execution-core/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus })
            });
            setAiStatus(newStatus ? 'ACTIVE' : 'INACTIVE');
        } catch (err) {
            console.error('Failed to toggle AI status.');
        }
    };
    
    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 h-full">
            <div className="xl:col-span-3 flex flex-col gap-8">
                 <Card>
                    <h3 className="text-lg font-bold text-white mb-4">Live Account Metrics</h3>
                        {metrics ? (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                               <MetricDisplay title="Account Balance" value={metrics.balance} unit="$" />
                               <MetricDisplay title="Live P&L" value={metrics.livePnl} unit="$" color={metrics.livePnl >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}/>
                               <MetricDisplay title="Total Equity" value={metrics.equity} unit="$" color="text-[var(--color-accent)]" />
                            </div>
                            <div style={{width: '100%', height: 200}}>
                               <ResponsiveContainer>
                                  <AreaChart data={metrics.equityHistory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                    <defs><linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/></linearGradient></defs>
                                    <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(Number(value)/1000).toFixed(1)}k`}/>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)'}} itemStyle={{color: 'var(--color-accent)'}}/>
                                    <Area type="monotone" dataKey="equity" stroke="var(--color-accent)" strokeWidth={2} fill="url(#equityGradient)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        ) : (
                        <div className="text-center py-10 text-[var(--color-text-secondary)]">
                            <p className="mt-4 font-semibold text-white">Awaiting first live data packet from MT5...</p>
                        </div>
                        )}
                </Card>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
                    <Card className="flex flex-col h-full"><h3 className="text-lg font-bold text-white mb-4">Live Position Blotter</h3><div className="overflow-auto flex-grow"><table className="w-full text-sm text-left"><thead className="sticky top-0 bg-[var(--color-bg-secondary)] z-10"><tr className="text-xs text-[var(--color-text-secondary)] uppercase"><th className="p-2">Asset</th><th className="p-2">Size</th><th className="p-2">Entry</th><th className="p-2 text-right">Live P&L</th></tr></thead><tbody>
                                {positions.length > 0 ? positions.map(pos => (<tr key={pos.id} className="border-b border-[var(--color-border)] last:border-0 font-mono"><td className="p-2"><span className="font-bold text-white font-sans">{pos.asset}</span><span className={`block text-xs font-bold ${pos.direction === 'LONG' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>{pos.direction}</span></td><td className="p-2">{pos.size.toFixed(4)}</td><td className="p-2">{pos.entryPrice.toFixed(4)}</td><td className={`p-2 text-right font-bold ${pos.pnl >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>{pos.pnl.toFixed(2)}</td></tr>
                                )) : (<tr><td colSpan={4} className="text-center text-[var(--color-text-secondary)] py-10">No open positions.</td></tr>)}
                               </tbody></table></div>
                    </Card>
                     <Card className="flex flex-col h-full"><h3 className="text-lg font-bold text-white mb-4">AI Decision Log</h3><div className="bg-black/20 p-3 rounded-md flex-grow overflow-y-auto font-mono text-xs space-y-1.5 flex flex-col-reverse">
                            {logs.length > 0 ? logs.map(log => (<p key={log.id} className={`animate-fade-in-fast ${getLogColor(log.type)}`}><span className="text-gray-600 mr-2">{log.timestamp}</span>{log.message}</p>)) : (<p className="text-center text-[var(--color-text-secondary)] m-auto">Awaiting AI activity...</p>)}
                        </div>
                    </Card>
                </div>
            </div>
            <div className="xl:col-span-2 flex flex-col gap-8">
                 <div className="grid grid-cols-2 gap-4">
                    <Card><h3 className="text-base font-bold text-white mb-2">Control Panel</h3><p className="text-center text-xs text-[var(--color-text-secondary)] mb-2">Status: <span className={`font-bold ${aiStatus === 'ACTIVE' ? 'text-[var(--color-accent-green)] animate-pulse' : 'text-[var(--color-accent-red)]'}`}>{aiStatus}</span></p><button onClick={handleToggleAi} className={`w-full font-bold py-3 rounded-lg transition-all text-lg ${aiStatus === 'ACTIVE' ? 'bg-[var(--color-accent-red)] text-white shadow-[0_0_20px_rgba(248,81,73,0.4)]' : 'bg-[var(--color-accent-green)] text-white shadow-[0_0_20px_rgba(63,185,80,0.4)]'}`}>{aiStatus === 'ACTIVE' ? 'DEACTIVATE' : 'ACTIVATE AI'}</button></Card>
                    <Card><h3 className="text-base font-bold text-white mb-2">MT5 Bridge</h3><div className="flex flex-col items-center justify-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="font-bold text-[var(--color-accent-green)] text-lg">CONNECTED</p><p className="text-xs text-green-300/70">{connectorId}</p><button onClick={onDisconnect} className="mt-2 text-xs text-red-400 hover:underline">Disconnect</button></div></Card>
                 </div>
                <SentinelAiCore aiState={aiIntel} />
            </div>
        </div>
    );
};

const ConnectionForm: React.FC<{ onConnect: (id: string, key: string) => void, isLoading: boolean, error: string }> = ({ onConnect, isLoading, error }) => {
    const [connectorId, setConnectorId] = useState('NEXUS-EA-1337');
    const [secureKey, setSecureKey] = useState('SECURE-KEY-MT5');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConnect(connectorId, secureKey);
    };

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center"><h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><LockIcon className="w-6 h-6" /> Secure MT5 Bridge</h3><p className="text-sm text-[var(--color-text-secondary)] mt-1">Establish connection to your trading terminal</p></div>
                    <div><label className="text-sm font-semibold text-[var(--color-text-secondary)]">Connector ID</label><input type="text" value={connectorId} onChange={e => setConnectorId(e.target.value)} className="w-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/></div>
                    <div><label className="text-sm font-semibold text-[var(--color-text-secondary)]">Secure Key</label><input type="password" value={secureKey} onChange={e => setSecureKey(e.target.value)} className="w-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/></div>
                    <button type="submit" disabled={isLoading} className="w-full bg-[var(--color-accent)] text-white font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">{isLoading ? 'Connecting...' : 'Connect'}</button>
                    {error && <p className="text-sm text-center text-[var(--color-accent-red)]">{error}</p>}
                </form>
            </Card>
        </div>
    );
};

const ExecutionCore: React.FC = () => {
    const { user } = useAuth();
    const clientId = useMemo(() => `exec-core-${user?.id}-${Date.now()}`, [user]);
    const wsState = useWebSocket(`/api/execution-core-stream?clientId=${clientId}`);

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [connectorId, setConnectorId] = useState('');

    useEffect(() => {
        const savedCreds = localStorage.getItem('mt5Creds');
        if (savedCreds) {
            const { id, key } = JSON.parse(savedCreds);
            handleConnect(id, key);
        }
    }, []);

    const handleConnect = useCallback(async (id: string, key: string) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/execution-core/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectorId: id, secureKey: key, clientId }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Connection failed.');
            }
            localStorage.setItem('mt5Creds', JSON.stringify({ id, key }));
            setConnectorId(id);
            setIsConnected(true);
            wsState.connect();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [clientId, wsState.connect]);
    
    const handleDisconnect = useCallback(() => {
        localStorage.removeItem('mt5Creds');
        setIsConnected(false);
        setConnectorId('');
        wsState.disconnect();
    }, [wsState.disconnect]);
    
    return (
        <div className="animate-fade-in h-full flex flex-col">
            <div>
                 <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">Autonomous Execution Core</h2>
                <p className="text-lg text-[var(--color-text-secondary)] max-w-4xl font-light mb-8">The final evolution. The AI is in direct control of a live trading account, operating autonomously to grow capital. This is your window into its soul.</p>
            </div>
            <div className="flex-grow">
                {isConnected ? <AutonomousDashboard onDisconnect={handleDisconnect} wsState={wsState} connectorId={connectorId} /> : <ConnectionForm onConnect={handleConnect} isLoading={isLoading} error={error} />}
            </div>
        </div>
    );
};

export default ExecutionCore;