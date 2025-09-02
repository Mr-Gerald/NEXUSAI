
import React from 'react';
// FIX: Use relative paths for component imports.
import Card from '../components/Card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const orderBookData = [
  { price: 68000, bids: 20, asks: 0 },
  { price: 67950, bids: 35, asks: 0 },
  { price: 67900, bids: 50, asks: 0 },
  { price: 68050, bids: 0, asks: 40 },
  { price: 68100, bids: 0, asks: 25 },
  { price: 68150, bids: 0, asks: 15 },
];

const sentimentData = [
    { name: '1h ago', sentiment: 0.6 },
    { name: '45m ago', sentiment: 0.7 },
    { name: '30m ago', sentiment: 0.5 },
    { name: '15m ago', sentiment: 0.8 },
    { name: 'Now', sentiment: 0.75 },
];

const DataStreamCard: React.FC<{ title: string; sources: string; children: React.ReactNode }> = ({ title, sources, children }) => (
    <Card className="flex flex-col">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-[var(--color-accent)] mb-4 font-mono">{sources}</p>
        <div className="flex-grow">{children}</div>
    </Card>
);

const MarketData: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">Multi-Modal Data Fusion Engine</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-4xl font-light">
                The AI's sensory system, ingesting and processing millions of data points in real-time from a diverse range of traditional and alternative sources to build a comprehensive view of the market.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DataStreamCard title="Traditional Market Data" sources="20+ Exchanges (Real-time)">
                    <p className="text-sm text-gray-300 mb-4 font-light">OHLCV, Level 3 order books, and trade flows for comprehensive price action analysis.</p>
                    <div style={{width: '100%', height: 200}}>
                        <ResponsiveContainer>
                            <BarChart data={orderBookData} layout="vertical" barCategoryGap="20%">
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="price" stroke="var(--color-text-secondary)" width={60} tickFormatter={(value) => `$${Number(value)/1000}k`} tick={{fontSize: 12}} />
                                <Tooltip cursor={false} contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                                <Bar dataKey="bids" fill="var(--color-accent-green)" stackId="a" />
                                <Bar dataKey="asks" fill="var(--color-accent-red)" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DataStreamCard>

                <DataStreamCard title="Social Sentiment" sources="Twitter, Reddit, Telegram, Discord">
                    <p className="text-sm text-gray-300 mb-4 font-light">Real-time NLP analysis to gauge market psychology, narrative flows, and behavioral patterns.</p>
                     <div style={{width: '100%', height: 200}}>
                        <ResponsiveContainer>
                            <LineChart data={sentimentData}>
                                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}}/>
                                <YAxis domain={[0, 1]} stroke="var(--color-text-secondary)" tick={{fontSize: 12}}/>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                                <Line type="monotone" dataKey="sentiment" stroke="var(--color-accent-yellow)" strokeWidth={2} dot={{ fill: 'var(--color-accent-yellow)' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </DataStreamCard>

                <DataStreamCard title="On-Chain Analytics" sources="Whale Movements, DeFi Flows, Smart Money">
                    <p className="text-sm text-gray-300 mb-4 font-light">Monitoring blockchain data for whale movements, exchange inflows/outflows, and DeFi protocol health.</p>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>Whale Inflow (BTC):</span> <span className="font-mono text-[var(--color-accent-green)]">+1,204</span></div>
                        <div className="flex justify-between"><span>Exchange Outflow (ETH):</span> <span className="font-mono text-[var(--color-accent-red)]">-8,530</span></div>
                        <div className="flex justify-between"><span>Active Addresses:</span> <span className="font-mono text-white">1.1M</span></div>
                        <div className="flex justify-between"><span>TVL Change (24h):</span> <span className="font-mono text-[var(--color-accent-green)]">+2.3%</span></div>
                    </div>
                </DataStreamCard>
            </div>
        </div>
    );
};

export default MarketData;