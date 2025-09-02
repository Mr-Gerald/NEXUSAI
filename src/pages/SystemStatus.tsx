

import React from 'react';
// FIX: Use relative paths for component imports.
import Card from '../components/Card';

const TechStackItem: React.FC<{ category: string; technologies: string; }> = ({ category, technologies }) => (
    <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-[var(--color-border)] last:border-b-0">
        <dt className="text-sm font-medium text-[var(--color-text-secondary)]">{category}</dt>
        <dd className="mt-1 text-sm text-white sm:mt-0 font-mono text-left sm:text-right">{technologies}</dd>
    </div>
);

const MetricCard: React.FC<{ title: string; value: string; isGood: boolean }> = ({ title, value, isGood }) => (
    <Card className="text-center p-4">
        <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
        <p className={`text-2xl font-bold font-mono ${isGood ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>{value}</p>
    </Card>
);

const SystemStatus: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">System Architecture & Status</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-4xl font-light">
                A look under the hood at the high-performance infrastructure and technology stack powering the autonomous trading engine, along with real-time operational metrics.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-4">Core Technology Stack</h3>
                    <dl>
                        <TechStackItem category="Languages" technologies="Python (Research), Rust/C++ (Production), CUDA" />
                        <TechStackItem category="ML Frameworks" technologies="PyTorch, JAX, TensorFlow, XGBoost" />
                        <TechStackItem category="Data Processing" technologies="Apache Kafka, Redis, ClickHouse, Apache Arrow" />
                        <TechStackItem category="Orchestration" technologies="Kubernetes, Docker, Apache Airflow" />
                        <TechStackItem category="Monitoring" technologies="Prometheus, Grafana, Custom Dashboards" />
                        <TechStackItem category="Infrastructure" technologies="AWS/GCP with Edge Computing Nodes" />
                    </dl>
                </Card>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Operational Metrics</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <MetricCard title="P99 Latency" value="<1ms" isGood={true} />
                        <MetricCard title="System Uptime" value="99.99%" isGood={true} />
                        <MetricCard title="Data Accuracy" value="99.9%" isGood={true} />
                        <MetricCard title="API Error Rate" value="0.01%" isGood={true} />
                        <MetricCard title="Active Models" value="147" isGood={true} />
                        <MetricCard title="Risk Breaches" value="0" isGood={true} />
                    </div>
                </div>

                 <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">ML Model Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-[var(--color-text-secondary)] uppercase bg-black/20">
                                <tr>
                                    <th scope="col" className="px-6 py-3 rounded-l-lg">Model Type</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Accuracy</th>
                                    <th scope="col" className="px-6 py-3 rounded-r-lg">Last Trained</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-[var(--color-border)]">
                                    <td className="px-6 py-4 font-medium text-white">Financial Transformer</td>
                                    <td className="px-6 py-4 text-[var(--color-accent-green)]">Active</td>
                                    <td className="px-6 py-4 font-mono">72.3%</td>
                                    <td className="px-6 py-4">2h ago</td>
                                </tr>
                                <tr className="border-b border-[var(--color-border)]">
                                    <td className="px-6 py-4 font-medium text-white">Graph Neural Network</td>
                                    <td className="px-6 py-4 text-[var(--color-accent-green)]">Active</td>
                                    <td className="px-6 py-4 font-mono">81.5%</td>
                                    <td className="px-6 py-4">4h ago</td>
                                </tr>
                                <tr className="border-b border-[var(--color-border)]">
                                    <td className="px-6 py-4 font-medium text-white">Reinforcement Learner</td>
                                    <td className="px-6 py-4 text-[var(--color-accent)]">Optimizing</td>
                                    <td className="px-6 py-4 font-mono">N/A</td>
                                    <td className="px-6 py-4">Ongoing</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-medium text-white">Ensemble Predictor</td>
                                    <td className="px-6 py-4 text-[var(--color-accent-green)]">Active</td>
                                    <td className="px-6 py-4 font-mono">78.9%</td>
                                    <td className="px-6 py-4">1h ago</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SystemStatus;