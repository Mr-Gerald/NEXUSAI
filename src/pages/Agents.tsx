


import React, { useState, useEffect } from 'react';
// FIX: Use relative paths for component, type, and hook imports.
import Card from '../components/Card';
import { Agent, AgentStatus } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

const getStatusClasses = (status: AgentStatus): { dot: string; text: string; } => {
    switch (status) {
        case AgentStatus.Active: return { dot: 'bg-[var(--color-accent-green)]', text: 'text-[var(--color-accent-green)]' };
        case AgentStatus.Idle: return { dot: 'bg-[var(--color-accent-yellow)]', text: 'text-[var(--color-accent-yellow)]' };
        case AgentStatus.Error: return { dot: 'bg-[var(--color-accent-red)]', text: 'text-[var(--color-accent-red)]' };
        case AgentStatus.Optimizing: return { dot: 'bg-[var(--color-accent)]', text: 'text-[var(--color-accent)]' };
        default: return { dot: 'bg-gray-500', text: 'text-gray-500' };
    }
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
    const statusClasses = getStatusClasses(agent.status);
    return (
        <Card className="flex flex-col justify-between h-full animate-fade-in-fast">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                    <div className={`flex items-center text-xs font-semibold ${statusClasses.text}`}>
                        <span className={`h-2 w-2 rounded-full mr-2 ${statusClasses.dot} ${agent.status === AgentStatus.Active ? 'animate-pulse' : ''}`}></span>
                        {agent.status}
                    </div>
                </div>
                <p className="text-sm text-[var(--color-accent)] font-medium">{agent.specialty}</p>
                <p className="text-sm text-gray-300 mt-4 font-light leading-relaxed">{agent.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Performance Metric</p>
                <p className="text-2xl font-semibold text-white font-mono mt-1">{agent.performance.toFixed(2)}</p>
            </div>
        </Card>
    );
};


const Agents: React.FC = () => {
    const { lastMessage, readyState } = useWebSocket('/api/agent-swarm-stream');
    const [agents, setAgents] = useState<Agent[]>([]);
    
    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);
            if (data.type === 'swarm_update') {
                setAgents(data.agents);
            }
        }
    }, [lastMessage]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-black text-white text-glow-accent">AI Agent Swarm</h2>
        <p className={`text-xs font-mono ${readyState === 1 ? 'text-green-400' : 'text-yellow-400'}`}>
            {readyState === 1 ? `● LIVE` : 'CONNECTING...'}
        </p>
      </div>
      <p className="text-lg text-gray-300 mb-8 max-w-4xl font-light">
        A collective of specialized AI agents, each with a unique trading personality and strategy. They collaborate and compete to generate alpha, manage risk, and execute trades with superhuman efficiency.
      </p>
      {agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <Card className="flex items-center justify-center h-64">
           <div className="text-center text-[var(--color-text-secondary)]">
                <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="absolute border-2 border-[var(--color-accent)]/30 rounded-full animate-ping" style={{ width: `${(i + 1) * 33.3}%`, height: `${(i + 1) * 33.3}%`, animationDelay: `${i * 0.3}s`}}></div>
                    ))}
                </div>
                <p className="font-semibold text-white">Connecting to live agent data feed...</p>
            </div>
        </Card>
      )}
    </div>
  );
};

export default Agents;