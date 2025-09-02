

import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Use relative paths for component, type, and service imports.
import Card from '../components/Card';
import type { AlphaPlaybook, TacticalAlert } from '../types';
import { scanForOpportunities } from '../services/geminiService';
import { WifiIcon } from '../components/icons/WifiIcon';
import { WifiOffIcon } from '../components/icons/WifiOffIcon';
import { LockIcon } from '../components/icons/LockIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { PlayIcon } from '../components/icons/PlayIcon';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine, YAxis, Tooltip as RechartsTooltip } from 'recharts';

const ALL_PAIRS = {
    "Major Crypto Pairs": ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "AVAX/USD"],
    "Commodities": ["XAU/USD", "XAG/USD", "WTI/USD (Oil)"],
    "Major Forex Pairs": ["EUR/USD", "USD/JPY", "GBP/USD", "AUD/USD", "USD/CAD", "USD/CHF"],
    "High Volatility Forex": ["EUR/JPY", "GBP/JPY", "AUD/JPY", "NZD/JPY"],
    "Stock Indices": ["US30", "SPX500", "NAS100", "GER30", "UK100"],
    "Exotic Opportunities": ["USD/TRY", "USD/ZAR", "EUR/TRY", "USD/MXN"],
};
type AssetCategory = keyof typeof ALL_PAIRS;

const SCAN_MESSAGES = [
    "CRACKING EXCHANGE ALGORITHMS...", "MAPPING WEAK POINTS IN ORDER BOOK...", "CALCULATING CASCADE FAILURE THRESHOLDS...",
    "DETECTING MARKET VULNERABILITIES...", "ENGINEERING CASCADE PATHWAYS...", "SIMULATING PREDATORY ATTACKS...",
    "ASSESSING LIQUIDITY POOLS...", "TRACKING INSTITUTIONAL STOPS...", "RUNNING EXPLOITABILITY MODEL...",
    "GAUGING SENTIMENT EXTREMES...", "IDENTIFYING WEAK HANDS...", "QUANTIFYING CASCADE PROBABILITY..."
];

const formatPrice = (price: number, asset: string) => {
    if(!price && price !==0) return 'N/A';
    const decimals = asset.includes('JPY') ? 3 : price > 1000 ? 2 : price > 10 ? 4 : 5;
    return price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// --- Sub-components for the new UI ---

const DataStreamStatus: React.FC<{ status: string }> = ({ status }) => {
    const getStatusIndicator = (status: string) => {
        const statusMap = {
            LIVE: { text: 'LIVE', color: 'text-[var(--color-accent-green)]', icon: <WifiIcon className="w-4 h-4" /> },
            CONNECTING: { text: 'CONNECTING', color: 'text-[var(--color-accent-yellow)] animate-pulse', icon: <WifiIcon className="w-4 h-4" /> },
            FAILED: { text: 'FAILED', color: 'text-[var(--color-accent-red)]', icon: <WifiOffIcon className="w-4 h-4" /> },
        };
        const current = statusMap[status as keyof typeof statusMap] || statusMap.CONNECTING;
        return (
            <div className={`flex items-center gap-2 text-xs font-mono font-bold px-3 py-2 rounded-lg bg-black/20 ${current.color}`}>
                {current.icon}
                <span>{current.text}</span>
            </div>
        );
    };

    return (
        <Card className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h3 className="text-base font-bold text-white whitespace-nowrap">Market Intelligence Feed</h3>
                 <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Live Price Engine (Finnhub)</p>
                        {getStatusIndicator(status)}
                    </div>
                 </div>
            </div>
        </Card>
    );
};

interface ControlPanelSettings {
    timeHorizon: string;
    exploitProfile: 'Silent Snipe' | 'Shock & Awe' | 'Systemic Cascade';
    marketCoverage: string;
    customPairs: string[];
}
const ControlPanel: React.FC<{
    settings: ControlPanelSettings;
    setSettings: React.Dispatch<React.SetStateAction<ControlPanelSettings>>;
    onScan: () => void;
    isLoading: boolean;
    streamStatus: string;
}> = ({ settings, setSettings, onScan, isLoading, streamStatus }) => {
    const handlePairSelection = (pair: string) => {
        setSettings(prev => {
            const newCustomPairs = new Set(prev.customPairs);
            if (newCustomPairs.has(pair)) newCustomPairs.delete(pair);
            else newCustomPairs.add(pair);
            return { ...prev, customPairs: Array.from(newCustomPairs) };
        });
    };
    
    const handleSelectAllCategory = (category: string, isSelected: boolean) => {
        setSettings(prev => {
            const newCustomPairs = new Set(prev.customPairs);
            if (isSelected) ALL_PAIRS[category as AssetCategory].forEach(p => newCustomPairs.add(p));
            else ALL_PAIRS[category as AssetCategory].forEach(p => newCustomPairs.delete(p));
            return { ...prev, customPairs: Array.from(newCustomPairs) };
        });
    };
    
    const isScanDisabled = isLoading || streamStatus !== 'LIVE';
    let disabledTooltip = '';
    if (isScanDisabled) {
        if (settings.marketCoverage === 'Custom' && settings.customPairs.length === 0) disabledTooltip = "Select at least one asset to target.";
        else if (streamStatus !== 'LIVE') disabledTooltip = `Cannot scan: Live Price Engine is offline.`;
    }

    return (
        <Card className="h-full flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4">War Room Configuration</h3>
            <div className="space-y-6 overflow-y-auto pr-2 flex-grow">
                <div>
                    <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Time Horizon</label>
                    <div className="flex items-center gap-2 mt-2">
                        <input type="range" min="5" max="30" value={settings.timeHorizon} onChange={(e) => setSettings(s => ({ ...s, timeHorizon: e.target.value }))} className="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer" />
                        <span className="font-mono text-sm bg-black/20 px-2 py-1 rounded w-20 text-center">{settings.timeHorizon} min</span>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Exploit Profile</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {(['Silent Snipe', 'Shock & Awe', 'Systemic Cascade'] as const).map(style => (
                             <button key={style} onClick={() => setSettings(s => ({ ...s, exploitProfile: style }))} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${settings.exploitProfile === style ? 'bg-[var(--color-accent)] text-white shadow-[0_0_10px_rgba(88,166,255,0.3)]' : 'bg-black/20 hover:bg-white/5'}`}>{style}</button>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Market Coverage</label>
                     <select value={settings.marketCoverage} onChange={(e) => setSettings(s => ({ ...s, marketCoverage: e.target.value, customPairs: [] }))} className="mt-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                        <option value="All">All Pairs (AI Hunter's Choice)</option>
                        <option value="Custom">Custom Target List</option>
                    </select>
                    {settings.marketCoverage === 'Custom' && (
                        <div className="mt-2 p-3 bg-black/20 rounded-md border border-[var(--color-border)] h-56 overflow-y-auto space-y-3">
                            {Object.entries(ALL_PAIRS).map(([category, pairs]) => {
                                const allSelected = pairs.every(p => settings.customPairs.includes(p));
                                return (
                                <div key={category}>
                                    <div className="flex justify-between items-center mb-1">
                                         <h4 className="text-xs font-bold uppercase text-[var(--color-accent)]">{category}</h4>
                                         <input type="checkbox" checked={allSelected} onChange={(e) => handleSelectAllCategory(category, e.target.checked)} className="form-checkbox h-4 w-4 bg-transparent border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        {pairs.map(pair => (
                                            <label key={pair} className="flex items-center space-x-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                                                <input type="checkbox" checked={settings.customPairs.includes(pair)} onChange={() => handlePairSelection(pair)} className="form-checkbox h-4 w-4 bg-transparent border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"/>
                                                <span>{pair}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
            <div className="relative mt-6" title={disabledTooltip}>
                <button onClick={onScan} disabled={isScanDisabled} className="w-full bg-[var(--color-accent-red)] text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(248,81,73,0.4)] hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2">
                    {isLoading ? 'HUNTING...' : 'HUNT FOR VULNERABILITIES'}
                </button>
            </div>
        </Card>
    );
};

const ScanningAnimation: React.FC = () => {
    const [messages, setMessages] = useState(Array(12).fill('INITIALIZING ENGINE...'));
    useEffect(() => {
        const interval = setInterval(() => {
            setMessages(prev => prev.map(() => SCAN_MESSAGES[Math.floor(Math.random() * SCAN_MESSAGES.length)]));
        }, 300);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 font-mono text-xs text-[var(--color-accent-red)]/70 w-full max-w-2xl">
                {messages.map((msg, i) => (
                    <p key={i} className="bg-black/10 p-2 rounded animate-fade-in-fast" style={{animationDelay: `${i*50}ms`}}>{msg}</p>
                ))}
            </div>
            <p className="mt-8 text-lg font-semibold text-white">Engaging Predatory Analysis Engine...</p>
            <p className="text-[var(--color-text-secondary)]">Exploiting market inefficiencies. This is not a drill.</p>
        </div>
    );
};

const InfoBlock: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div>
        <h4 className="flex items-center gap-2 font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider">
          {icon}
          {title}
        </h4>
        <div className="text-[var(--color-text-primary)]/90 leading-relaxed text-sm font-light mt-2 pl-6 border-l border-[var(--color-border)]/50 ml-2">
          {children}
        </div>
    </div>
);

const ChartVisualizer: React.FC<{ blueprint: AlphaPlaybook['executionBlueprint'], asset: string }> = ({ blueprint, asset }) => {
    const { ignitionPoint, missionAbort, liquidationZoneStart, liquidationZoneEnd, exhaustionPoint, direction } = blueprint;
    if (!ignitionPoint) return null;

    const isBuy = direction === 'BUY';
    const priceRange = Math.abs(exhaustionPoint - missionAbort) || ignitionPoint * 0.02;
    const domain = [ignitionPoint - priceRange * 0.6, ignitionPoint + priceRange * 0.6];
    
    const dummyData = [{name: 'Now', price: ignitionPoint}];

    return (
        <div style={{width: '100%', height: 180}}>
            <ResponsiveContainer>
                <AreaChart data={dummyData} margin={{ top: 20, right: 30, left: 5, bottom: 5 }}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <YAxis domain={domain} hide={true} />
                    <RechartsTooltip contentStyle={{ display: 'none' }}/>
                    <ReferenceLine y={ignitionPoint} label={{ value: "Ignition", position: 'right', fill: 'white', fontSize: 10 }} stroke="white" strokeDasharray="3 3" />
                    <ReferenceLine y={exhaustionPoint} label={{ value: "Exhaustion", position: 'right', fill: 'var(--color-accent-green)', fontSize: 10 }} stroke="var(--color-accent-green)" strokeDasharray="3 3" />
                    <ReferenceLine y={missionAbort} label={{ value: "Abort", position: 'right', fill: 'var(--color-accent-red)', fontSize: 10 }} stroke="var(--color-accent-red)" strokeDasharray="3 3" />
                    <ReferenceLine y={liquidationZoneStart} stroke="var(--color-accent-yellow)" strokeDasharray="2 2" strokeOpacity={0.5} />
                    <ReferenceLine y={liquidationZoneEnd} stroke="var(--color-accent-yellow)" strokeDasharray="2 2" strokeOpacity={0.5} />
                    <ReferenceLine ifOverflow="extendDomain" segment={[{y: liquidationZoneStart}, {y: liquidationZoneEnd}]} fill="var(--color-accent-yellow)" opacity={0.1} label={{ value: "LIQUIDATION ZONE", position: 'insideTopLeft', fill: 'var(--color-accent-yellow)', fontSize: 10, angle: -90, offset: 10 }} />

                    <Area type="monotone" dataKey="price" stroke="var(--color-accent)" strokeWidth={2} fill="url(#chartGradient)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

type EngagementStatus = 'Idle' | 'Stalking' | 'Arming' | 'Engaged' | 'Exited';

const AlphaPlaybookView: React.FC<{
    playbook: AlphaPlaybook;
    onBack: () => void;
    onEngage: (playbook: AlphaPlaybook) => void;
    onDisengage: () => void;
    engagementStatus: EngagementStatus;
    tacticalAlerts: TacticalAlert[];
}> = ({ playbook, onBack, onEngage, onDisengage, engagementStatus, tacticalAlerts }) => {
    const { executionBlueprint: blueprint, liquidityAnalysis: liquid, cascadeAnalysis: cascade } = playbook;
    const alertsEndRef = useRef<HTMLDivElement>(null);
    const lastAlert = tacticalAlerts[0] ?? null;

    useEffect(() => {
        alertsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [tacticalAlerts]);

    const renderEngagementButton = () => {
        switch(engagementStatus) {
            case 'Idle':
                return <button onClick={() => onEngage(playbook)} disabled={!blueprint.ignitionPoint} className="bg-[var(--color-accent-red)] text-white disabled:opacity-50 px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all"> <PlayIcon className="w-4 h-4"/> ARM & ENGAGE </button>;
            case 'Stalking':
            case 'Arming':
                 return <button onClick={onDisengage} className="bg-yellow-500/80 text-white px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all"> ABORT MISSION </button>;
            case 'Engaged':
                return <div className="px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 bg-green-500/20 text-green-400"> MISSION LIVE </div>;
            case 'Exited':
                 return <div className="px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 bg-gray-500/20 text-gray-400"> MISSION COMPLETE </div>;
        }
    }

    const lastPnl = tacticalAlerts.find(a => a.pnl !== undefined)?.pnl;
    
    return (
        <Card className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                 <div>
                    <button onClick={onBack} className="text-sm text-[var(--color-text-secondary)] hover:text-white mb-2 transition-colors">&larr; Back to Targets</button>
                    <h3 className="text-3xl font-bold text-white">{playbook.asset} Exploit Blueprint</h3>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] mt-1">
                        <span>Duration: <strong className="text-white font-mono">{playbook.expectedDuration}</strong></span>
                        <span>R/R Ratio: <strong className="text-white font-mono">1 : {playbook.riskRewardRatio.toFixed(2)}</strong></span>
                    </div>
                 </div>
            </div>
            
            <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="w-full md:w-1/2 flex flex-col space-y-5 overflow-y-auto pr-3 -mr-3">
                     <InfoBlock title="Liquidity Analysis" icon={<LockIcon className="w-4 h-4" />}>
                         <p>{liquid.heatmapSummary}</p>
                         <div className="mt-3 text-xs space-y-1">
                             <p><strong className="text-red-400">Stop Clusters:</strong> {liquid.stopLossClusters}</p>
                             <p><strong className="text-blue-400">Liquidity Voids:</strong> {liquid.liquidityVoids}</p>
                         </div>
                     </InfoBlock>
                     <InfoBlock title="Cascade Analysis" icon={<BoltIcon className="w-4 h-4" />}>
                         <p>{cascade.cascadeThesis}</p>
                         <p className="text-xs mt-2"><strong className="text-gray-400">Catalyst: </strong> {cascade.catalystAction}</p>
                          <div className="w-full bg-black/20 rounded-full h-2.5 mt-3">
                             <div className="bg-[var(--color-accent-green)] h-2.5 rounded-full" style={{width: `${cascade.successProbability}%`}}></div>
                         </div>
                         <p className="text-xs text-right text-gray-400 mt-1">Success Probability: {cascade.successProbability}%</p>
                     </InfoBlock>
                </div>

                <div className="w-full md:w-1/2 flex flex-col gap-4">
                    <div className="border border-[var(--color-border)] bg-black/20 rounded-lg p-4">
                        <h4 className="text-base font-bold text-white mb-2 text-center">Execution Blueprint</h4>
                        <ChartVisualizer blueprint={blueprint} asset={playbook.asset} />
                         <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono mt-2">
                             <span className="text-gray-400">Ignition:</span><span className="text-right text-white">${formatPrice(blueprint.ignitionPoint, playbook.asset)}</span>
                             <span className="text-gray-400">Mission Abort:</span><span className="text-right text-[var(--color-accent-red)]">${formatPrice(blueprint.missionAbort, playbook.asset)}</span>
                             <span className="text-gray-400">Liquidation Zone:</span><span className="text-right text-[var(--color-accent-yellow)]">${formatPrice(blueprint.liquidationZoneStart, playbook.asset)} - ${formatPrice(blueprint.liquidationZoneEnd, playbook.asset)}</span>
                             <span className="text-gray-400">Exhaustion Point:</span><span className="text-right text-[var(--color-accent-green)]">${formatPrice(blueprint.exhaustionPoint, playbook.asset)}</span>
                         </div>
                    </div>
                    
                    <div className="flex-grow flex flex-col border border-[var(--color-border)] rounded-lg bg-black/20 p-4">
                         <div className="flex justify-between items-center mb-3">
                            <h4 className="text-base font-bold text-white">Live Mission Companion</h4>
                            {renderEngagementButton()}
                         </div>
                         <div className="flex-grow bg-black/20 p-2 rounded-md overflow-y-auto font-mono text-xs flex flex-col justify-between">
                           <div>
                            {tacticalAlerts.length > 0 ? (
                                tacticalAlerts.map(alert => {
                                    if(alert.type === 'Countdown') return <p key={alert.id} className="text-2xl font-bold text-center text-red-500 animate-pulse">FIRE IN {alert.countdown}...</p>
                                    if(alert.type === 'Fire') return <p key={alert.id} className="text-3xl font-black text-center text-red-500 animate-pulse">FIRE NOW!</p>
                                    const color = alert.type === 'Success' || alert.type === 'Exit' ? 'text-green-400' : alert.type === 'Warning' ? 'text-yellow-400' : alert.type === 'Danger' ? 'text-red-400' : 'text-blue-300';
                                    return <p key={alert.id} className={`animate-fade-in-fast ${color}`}><span className="text-gray-500 mr-2">{alert.timestamp}</span>{alert.message}</p>
                                })
                            ) : ( <p className="text-gray-500">Arm blueprint to receive live tactical commands.</p> )}
                           <div ref={alertsEndRef}></div>
                           </div>
                            {engagementStatus === 'Engaged' && lastPnl !== undefined && (
                                <div className={`mt-2 p-2 rounded text-center font-bold text-lg ${lastPnl >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    LIVE P&L: ${lastPnl.toFixed(2)}
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ScanResultsTable: React.FC<{ results: AlphaPlaybook[]; onSelectPlaybook: (playbook: AlphaPlaybook) => void; }> = ({ results, onSelectPlaybook }) => {
     const getScoreColor = (score: number) => {
        if (score > 90) return 'text-[var(--color-accent-green)]';
        if (score > 80) return 'text-[var(--color-accent-yellow)]';
        return 'text-[var(--color-accent-red)]';
    };

    return (
        <Card className="h-full flex flex-col animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Exploitable Vulnerabilities: <span className="text-[var(--color-accent-red)]">{results.length}</span></h3>
             </div>
             <div className="overflow-y-auto flex-grow">
                 <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-[var(--color-bg-secondary)]">
                        <tr>
                            <th className="p-3 text-xs text-[var(--color-text-secondary)] uppercase">Target</th>
                            <th className="p-3 text-xs text-[var(--color-text-secondary)] uppercase text-center">Direction</th>
                            <th className="p-3 text-xs text-[var(--color-text-secondary)] uppercase text-center">Success %</th>
                            <th className="p-3 text-xs text-[var(--color-text-secondary)] uppercase text-center">R:R</th>
                            <th className="p-3 text-xs text-[var(--color-text-secondary)] uppercase">Duration</th>
                            <th className="p-3 text-xs text-[var(--color-text-secondary)] uppercase text-right">Ignition Point</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(playbook => (
                            <tr key={playbook.id} onClick={() => onSelectPlaybook(playbook)} className="border-b border-[var(--color-border)] hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-3 font-semibold text-white">{playbook.asset}</td>
                                <td className={`p-3 font-bold text-center ${playbook.executionBlueprint.direction === 'BUY' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>{playbook.executionBlueprint.direction}</td>
                                <td className={`p-3 font-mono font-bold text-center ${getScoreColor(playbook.cascadeAnalysis.successProbability)}`}>{playbook.cascadeAnalysis.successProbability}%</td>
                                <td className="p-3 font-mono text-center text-green-400">1:{playbook.riskRewardRatio.toFixed(1)}</td>
                                <td className="p-3 font-mono text-xs text-gray-400">{playbook.expectedDuration}</td>
                                <td className="p-3 font-mono text-right text-white">${formatPrice(playbook.executionBlueprint.ignitionPoint, playbook.asset)}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        </Card>
    )
}

const PredictiveAnalytics: React.FC = () => {
    const [settings, setSettings] = useState<ControlPanelSettings>({
        timeHorizon: '15',
        exploitProfile: 'Shock & Awe',
        marketCoverage: 'All',
        customPairs: [],
    });
    const [scanResults, setScanResults] = useState<AlphaPlaybook[]>([]);
    const [selectedPlaybook, setSelectedPlaybook] = useState<AlphaPlaybook | null>(null);
    const [engagementStatus, setEngagementStatus] = useState<EngagementStatus>('Idle');
    const [tacticalAlerts, setTacticalAlerts] = useState<TacticalAlert[]>([]);
    const companionSocket = useRef<WebSocket | null>(null);
    const clientId = useMemo(() => `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamStatus, setStreamStatus] = useState<string>('CONNECTING');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/stream-status');
                setStreamStatus(response.ok ? (await response.json()).marketData : 'FAILED');
            } catch (err) {
                setStreamStatus('FAILED');
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => {
            clearInterval(interval);
            if (companionSocket.current) companionSocket.current.close();
        };
    }, []);
    
    const handleEngage = (playbook: AlphaPlaybook) => {
        if (engagementStatus !== 'Idle') onDisengage(); 

        fetch(`/api/engage-playbook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playbook, clientId })
        }).then(res => {
            if (!res.ok) throw new Error('Failed to engage playbook on backend.');
            
            setEngagementStatus('Stalking');
            setTacticalAlerts([]);
            
            const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsUrl = `${wsProtocol}://${window.location.host}/api/trade-companion-stream`;
            companionSocket.current = new WebSocket(`${wsUrl}?clientId=${clientId}`);
            
            companionSocket.current.onopen = () => console.log('Trade Companion connected.');
            companionSocket.current.onmessage = (event) => {
                const alert: TacticalAlert = JSON.parse(event.data);
                
                setTacticalAlerts(prev => [alert, ...prev].slice(0, 20));

                if (alert.type === 'Stalking') setEngagementStatus('Stalking');
                else if (alert.type === 'Countdown') setEngagementStatus('Arming');
                else if (alert.type === 'Fire') setEngagementStatus('Engaged');
                else if (alert.type === 'Exit') {
                    setEngagementStatus('Exited');
                    onDisengage();
                }
            };
            companionSocket.current.onclose = () => console.log('Trade Companion disconnected.');
            companionSocket.current.onerror = (err) => setError('Companion WebSocket connection failed.');

        }).catch(err => setError(err.message));
    };

    const onDisengage = () => {
        if (engagementStatus === 'Idle') return;
        fetch(`/api/disengage-playbook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
        });
        if (companionSocket.current) {
            companionSocket.current.close();
            companionSocket.current = null;
        }
        if(engagementStatus !== 'Exited') setEngagementStatus('Idle');
    };

    const handleScan = async () => {
        setIsLoading(true);
        setError(null);
        setSelectedPlaybook(null);
        setScanResults([]);
        onDisengage();
        
        try {
            const results = await scanForOpportunities(settings);
            setScanResults(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during the scan.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBackToResults = () => {
        setSelectedPlaybook(null);
        onDisengage();
    };

    const renderContent = () => {
        if (isLoading) return <ScanningAnimation />;
        if (error) return (
            <Card className="h-full flex flex-col items-center justify-center text-center border-[var(--color-accent-red)]/50">
                <h3 className="text-lg font-bold text-[var(--color-accent-red)]">Hunt Failed</h3>
                <p className="text-[var(--color-text-secondary)] mt-2 max-w-sm">{error}</p>
                <button onClick={handleScan} className="mt-4 bg-[var(--color-accent-red)] text-white px-5 py-2 rounded-md text-sm font-bold hover:opacity-90">Retry Hunt</button>
            </Card>
        );
        if (selectedPlaybook) return <AlphaPlaybookView playbook={selectedPlaybook} onBack={handleBackToResults} onEngage={handleEngage} onDisengage={onDisengage} engagementStatus={engagementStatus} tacticalAlerts={tacticalAlerts} />;
        if (scanResults.length > 0) return <ScanResultsTable results={scanResults} onSelectPlaybook={setSelectedPlaybook} />;
        return (
            <Card className="h-full flex flex-col items-center justify-center text-center">
                 <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 border-2 border-[var(--color-accent-red)] rounded-full opacity-30 animate-ping-slow"></div>
                    <div className="absolute inset-2 border-2 border-[var(--color-accent-red)] rounded-full opacity-50"></div>
                     <p className="text-5xl flex items-center justify-center h-full">🎯</p>
                 </div>
                <h3 className="text-xl font-bold text-white">Predatory Analysis Engine</h3>
                <p className="mt-2 text-[var(--color-text-secondary)] max-w-md">Configure your attack parameters and engage the engine to hunt for market vulnerabilities and engineer liquidity cascades.</p>
            </Card>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 h-full flex flex-col">
            <div>
                 <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">Predatory Analysis Engine</h2>
                <p className="text-lg text-[var(--color-text-secondary)] max-w-4xl font-light">
                    From prediction to predation. This is not an analytical tool; it is a weapon. It finds market vulnerabilities and provides an exact blueprint for exploitation.
                </p>
            </div>
             <DataStreamStatus status={streamStatus} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                <div className="lg:col-span-1">
                    <ControlPanel settings={settings} setSettings={setSettings} onScan={handleScan} isLoading={isLoading} streamStatus={streamStatus}/>
                </div>
                <div className="lg:col-span-2">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default PredictiveAnalytics;