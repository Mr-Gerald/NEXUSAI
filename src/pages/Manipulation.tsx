

import React, { useState, useEffect } from 'react';
// FIX: Use relative paths for component, type, and hook imports.
import Card from '../components/Card';
import type { Anomaly } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

const ANOMALY_FEED_MAX_LENGTH = 20;

const AnomalyStatusCard: React.FC<{ title: string, status: 'Clear' | 'Detected', isPulse: boolean }> = ({ title, status, isPulse }) => {
    const isDetected = status === 'Detected';
    return (
         <Card className={`text-center transition-all duration-300 ${isDetected ? 'border-[var(--color-accent-red)]/50' : ''}`}>
            <p className="font-semibold text-white">{title}</p>
            <p className={`text-2xl font-bold mt-2 ${isDetected ? `text-[var(--color-accent-red)] ${isPulse ? 'animate-pulse' : ''}` : 'text-[var(--color-accent-green)]'}`}>{status}</p>
        </Card>
    )
}

const getSeverityClasses = (severity: Anomaly['severity']) => {
    switch(severity) {
        case 'High': return 'border-l-4 border-[var(--color-accent-red)] bg-red-500/10 text-red-300';
        case 'Medium': return 'border-l-4 border-[var(--color-accent-yellow)] bg-yellow-500/10 text-yellow-300';
        case 'Low': return 'border-l-4 border-[var(--color-accent)] bg-blue-500/10 text-blue-300';
    }
}


const Manipulation: React.FC = () => {
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [isSpikeDetected, setIsSpikeDetected] = useState(false);

    const anomalySocket = useWebSocket('/api/anomaly-stream');

    useEffect(() => {
        if(anomalySocket.lastMessage) {
            const data = JSON.parse(anomalySocket.lastMessage.data);
            if (data.type === 'new_anomaly' && data.anomaly.type === 'Volume Spike') {
                const newAnomaly: Anomaly = data.anomaly;
                setAnomalies(prev => [newAnomaly, ...prev.slice(0, ANOMALY_FEED_MAX_LENGTH - 1)]);
                
                setIsSpikeDetected(true);
                const timer = setTimeout(() => setIsSpikeDetected(false), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [anomalySocket.lastMessage]);

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                 <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">Manipulation & Anomaly Detection</h2>
                <p className="text-lg text-gray-300 max-w-4xl font-light">
                    The AI's advanced surveillance system, actively scanning for market manipulation and anomalous behavior to protect capital and exploit market inefficiencies.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <AnomalyStatusCard title="Volume Spike" status={isSpikeDetected ? 'Detected' : 'Clear'} isPulse={isSpikeDetected} />
               <Card className="text-center transition-all duration-300 opacity-50"><p className="font-semibold text-white">Spoofing</p><p className="text-2xl font-bold mt-2 text-gray-500">Inactive</p></Card>
               <Card className="text-center transition-all duration-300 opacity-50"><p className="font-semibold text-white">Wash Trading</p><p className="text-2xl font-bold mt-2 text-gray-500">Inactive</p></Card>
               <Card className="text-center transition-all duration-300 opacity-50"><p className="font-semibold text-white">Ignition</p><p className="text-2xl font-bold mt-2 text-gray-500">Inactive</p></Card>
            </div>

            <Card>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Live Anomaly Feed</h3>
                    <p className={`text-xs font-mono ${anomalySocket.readyState === 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {anomalySocket.readyState === 1 ? '● LIVE' : 'CONNECTING...'}
                    </p>
                 </div>
                 <div className="space-y-3 overflow-y-auto h-[400px] pr-2 bg-black/20 p-4 rounded-md border border-[var(--color-border)]">
                    {anomalies.length > 0 ? anomalies.map(anomaly => (
                        <div key={anomaly.id} className={`p-3 rounded-md text-xs ${getSeverityClasses(anomaly.severity)} animate-fade-in`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-sm">{anomaly.type} on {anomaly.asset}</p>
                                <p className="font-mono text-gray-400">{new Date(anomaly.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <p className="text-gray-300/90">{anomaly.details}</p>
                        </div>
                    )) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Monitoring for volume spikes...
                        </div>
                    )}
                 </div>
            </Card>
        </div>
    );
};

export default Manipulation;