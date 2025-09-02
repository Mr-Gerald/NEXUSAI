


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
// FIX: Use relative paths for service, component, type, and hook imports.
import { streamGemini, getSignalFromImage } from '../services/geminiService';
import Card from '../components/Card';
import { AiBotIcon } from '../components/icons/AiBotIcon';
import type { Trade, GroundingChunk } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { PaperclipIcon } from '../components/icons/PaperclipIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { marked } from 'https://esm.sh/marked@13.0.2';


const PNL_CHART_MAX_LENGTH = 50;
const TRADES_MAX_LENGTH = 15;

const KpiCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <Card className="flex-1 min-w-[200px]">
        <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
        <p className="text-3xl font-bold text-[var(--color-text-primary)] font-mono">{value}</p>
    </Card>
);

const AiAnalyst: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const analysisEndRef = useRef<HTMLDivElement>(null);
    const isStreaming = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!prompt.trim() && !imageFile) || isLoading) return;

        setIsLoading(true);
        setError('');
        setAnalysis('');
        setSources([]);

        try {
            if (imageFile) {
                // Non-streaming for image analysis
                const fullAnalysis = await getSignalFromImage(prompt, imageFile);
                setAnalysis(fullAnalysis);
            } else {
                // Streaming for text-only analysis
                isStreaming.current = true;
                const stream = streamGemini(prompt, true);
                for await (const chunk of stream) {
                    if (!isStreaming.current) break;
                    setAnalysis(prev => prev + chunk.text);
                    if (chunk.sources) {
                        const incomingValidSources = (chunk.sources as any[]).filter((s): s is GroundingChunk => !!s?.web?.uri);
                         if (incomingValidSources.length > 0) {
                            setSources(prev => [...prev, ...incomingValidSources.filter(newSrc => !prev.some(oldSrc => oldSrc.web.uri === newSrc.web.uri))]);
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
            isStreaming.current = false;
        }
    };
    
    useEffect(() => {
        analysisEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [analysis]);
    
    useEffect(() => { return () => { isStreaming.current = false; }; }, []);

    return (
        <Card className="mt-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <AiBotIcon className="h-6 w-6 mr-3 text-[var(--color-accent)] text-glow-accent" />
                AI Market Analyst
            </h3>
            <div className="prose prose-sm prose-invert max-w-none bg-black/20 p-4 rounded-md h-96 overflow-y-auto border border-[var(--color-border)] relative">
              {analysis || isLoading ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: marked(analysis) }}></div>
                  {isLoading && !analysis && <p className='text-[var(--color-text-secondary)]'>NexusAI is thinking...</p>}
                </>
              ) : (
                <div className='flex items-center justify-center h-full'>
                    <p className="text-[var(--color-text-secondary)]">Ask for market intelligence or upload a chart for analysis.</p>
                </div>
              )}
              <div ref={analysisEndRef} />
            </div>
            {sources.length > 0 && (
              <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)] mb-2">Sources:</h4>
                  <ul className="flex flex-wrap gap-2">
                      {sources.map((source, index) => (
                          <li key={index}>
                              <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-[var(--color-border)] hover:bg-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-white px-2.5 py-1 rounded-full transition-colors duration-200">
                                  {new URL(source.web.uri).hostname.replace('www.', '')}
                              </a>
                          </li>
                      ))}
                  </ul>
              </div>
            )}
            {imagePreview && (
                 <div className="mt-4 relative w-40 h-24 border border-[var(--color-border)] rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Chart preview" className="w-full h-full object-cover" />
                    <button onClick={removeImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/80" aria-label="Remove image">
                       <XCircleIcon className="h-5 w-5"/>
                    </button>
                 </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-accent)] transition-colors" aria-label="Attach image">
                    <PaperclipIcon className="h-5 w-5" />
                </button>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={imageFile ? "Add details for the chart..." : "Ask for market intelligence..."}
                    className="flex-grow bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-[var(--color-accent)] text-white px-5 py-2 rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={isLoading}
                >
                    {isLoading ? 'Thinking...' : 'Ask'}
                </button>
            </form>
            {error && <p className="text-[var(--color-accent-red)] text-sm mt-2">{error}</p>}
        </Card>
    )
}

const DataUnavailable: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-center">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364" />
            </svg>
            <p className="mt-4">{message}</p>
            <p className="text-xs mt-1">Check your network connection and server status.</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
  const [pnlData, setPnlData] = useState<{date: string, pnl: number}[]>([]);
  const [kpiData, setKpiData] = useState({ sharpe: 0, maxDrawdown: 0, winRate: 0, alpha: 0 });
  const [trades, setTrades] = useState<Trade[]>([]);

  const dashboardSocket = useWebSocket('/api/dashboard-stream');
  const tradeSocket = useWebSocket('/api/trade-stream');

  useEffect(() => {
    if (dashboardSocket.lastMessage) {
        const data = JSON.parse(dashboardSocket.lastMessage.data);
        if (data.type === 'update') {
            setKpiData(data.kpis);
            setPnlData(prev => [...prev.slice(prev.length > PNL_CHART_MAX_LENGTH ? 1 : 0), { date: data.pnl.timestamp, pnl: data.pnl.value }]);
        }
    }
  }, [dashboardSocket.lastMessage]);

  useEffect(() => {
    if (tradeSocket.lastMessage) {
        const data = JSON.parse(tradeSocket.lastMessage.data);
        if (data.type === 'new_trade') {
            setTrades(prev => [data.trade, ...prev.slice(0, TRADES_MAX_LENGTH -1)]);
        }
    }
  }, [tradeSocket.lastMessage]);

  const getConnectionStatus = (readyState: number, name: string) => {
      const statusMap = { 0: 'CONNECTING', 1: 'LIVE', 2: 'CLOSING', 3: 'DISCONNECTED' };
      const colorMap = { 0: 'text-yellow-400 animate-pulse', 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-red-500' };
      const dotColorMap = { 0: 'bg-yellow-400', 1: 'bg-green-500', 2: 'bg-yellow-400', 3: 'bg-red-500' }
      return (
        <div className="flex items-center">
            <span className={`relative mr-2 h-2 w-2 rounded-full ${dotColorMap[readyState]}`}>
              {readyState === 1 && <span className="absolute -top-0 -left-0 h-full w-full animate-ping-slow rounded-full bg-green-400"></span>}
            </span>
            <span className="text-[var(--color-text-secondary)] mr-2">{name}:</span>
            <span className={`font-mono text-xs font-bold ${colorMap[readyState]}`}>{statusMap[readyState]}</span>
        </div>
      );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-[var(--color-text-primary)] text-glow-accent">Live Dashboard</h2>
        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {getConnectionStatus(dashboardSocket.readyState, "KPIs")}
            {getConnectionStatus(tradeSocket.readyState, "Trades")}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard title="Sharpe Ratio" value={kpiData.sharpe.toFixed(2)} />
          <KpiCard title="Max Drawdown" value={`${kpiData.maxDrawdown.toFixed(2)}%`} />
          <KpiCard title="Win Rate" value={`${kpiData.winRate.toFixed(1)}%`} />
          <KpiCard title="Alpha (Ann.)" value={`${kpiData.alpha.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Portfolio Performance (Live)</h3>
          <div style={{ width: '100%', height: 300 }}>
            {pnlData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={pnlData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }} labelStyle={{ color: 'var(--color-text-primary)' }} itemStyle={{color: 'var(--color-accent)'}}/>
                <Area type="monotone" dataKey="pnl" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorPnl)" />
              </AreaChart>
            </ResponsiveContainer>
            ) : (<DataUnavailable message="Awaiting P&L data stream..." />) }
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recent Trades</h3>
          <div className="space-y-3 overflow-y-auto h-[300px] pr-2">
            {trades.length > 0 && tradeSocket.readyState === 1 ? trades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between text-sm animate-fade-in-fast">
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">{trade.pair}</p>
                  <p className={`font-mono text-xs ${trade.type === 'BUY' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>{trade.type} {trade.amount.toFixed(4)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[var(--color-text-primary)]">${trade.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{new Date(trade.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            )) : (<DataUnavailable message={tradeSocket.readyState !== 1 ? "Live trade feed disconnected." : "Waiting for first trade..."} />) }
          </div>
        </Card>
      </div>

      <AiAnalyst />

    </div>
  );
};

export default Dashboard;