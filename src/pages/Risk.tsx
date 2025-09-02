
import React from 'react';
// FIX: Use relative paths for component imports.
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const GaugeChart: React.FC<{ value: number; maxValue: number; label: string; unit: string }> = ({ value, maxValue, label, unit }) => {
    const percentage = Math.min(100, (value / maxValue) * 100);
    const angle = (percentage / 100) * 180;
    const color = percentage > 80 ? 'var(--color-accent-red)' : percentage > 50 ? 'var(--color-accent-yellow)' : 'var(--color-accent-green)';

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <svg viewBox="0 0 100 55" className="w-48 h-auto">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeLinecap="round" />
                <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${angle} 180`}
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="text-center -mt-12">
                <p className="text-3xl font-bold font-mono" style={{ color }}>{value.toFixed(2)}{unit}</p>
                <p className="text-sm text-gray-400">{label}</p>
            </div>
        </div>
    );
};

const stressTestData = [
    { name: 'Flash Crash', result: 'PASS', color: 'var(--color-accent-green)' },
    { name: 'Exchange Outage', result: 'PASS', color: 'var(--color-accent-green)' },
    { name: 'Correlation Breakdown', result: 'WARN', color: 'var(--color-accent-yellow)' },
    { name: 'Regulatory Shock', result: 'PASS', color: 'var(--color-accent-green)' },
    { name: 'Black Swan Event', result: 'FAIL', color: 'var(--color-accent-red)' },
];

const positionSizingData = [
    { name: 'BTC', size: 40, strategy: 'Kelly' },
    { name: 'ETH', size: 30, strategy: 'Vol Target' },
    { name: 'SOL', size: 15, strategy: 'Risk Parity' },
    { name: 'AVAX', size: 10, strategy: 'Kelly' },
    { name: 'Other', size: 5, strategy: 'Risk Parity' },
];

const Risk: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">Risk Guardian System</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-4xl font-light">
                An unbreakable, multi-layered defense system to protect capital. It monitors risk in real-time, stress tests against extreme scenarios, and dynamically adjusts positions to maintain portfolio stability.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="flex flex-col items-center justify-center p-6">
                    <h3 className="text-base font-semibold text-white mb-2 w-full text-center">Real-time VaR (1-day, 99%)</h3>
                    <GaugeChart value={1.78} maxValue={5} label="Value at Risk" unit="%" />
                </Card>
                <Card className="flex flex-col items-center justify-center p-6">
                    <h3 className="text-base font-semibold text-white mb-2 w-full text-center">Liquidity Score</h3>
                    <GaugeChart value={89} maxValue={100} label="Portfolio Liquidity" unit="" />
                </Card>
                 <Card className="flex flex-col items-center justify-center p-6">
                    <h3 className="text-base font-semibold text-white mb-2 w-full text-center">Current Drawdown</h3>
                    <GaugeChart value={2.1} maxValue={5} label="Max Allowed: 5%" unit="%" />
                </Card>

                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Dynamic Position Sizing</h3>
                     <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={positionSizingData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={50} tick={{fontSize: 12}}/>
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                                    formatter={(value: number, name, props) => [`${value}% Allocation`, `Strategy: ${props.payload.strategy}`]}
                                />
                                <Bar dataKey="size" fill="var(--color-accent)" background={{ fill: 'rgba(255, 255, 255, 0.05)' }} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                 <Card>
                    <h3 className="text-lg font-semibold text-white mb-4">Stress Test Results</h3>
                    <ul className="space-y-4">
                        {stressTestData.map(test => (
                            <li key={test.name} className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">{test.name}</span>
                                <span className="text-sm font-bold px-3 py-1 rounded-md" style={{backgroundColor: `${test.color}20`, color: test.color}}>{test.result}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default Risk;