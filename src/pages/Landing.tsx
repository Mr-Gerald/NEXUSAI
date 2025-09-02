import React from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { BoltIcon } from '@/components/icons/BoltIcon';
import { BrainIcon } from '@/components/icons/BrainIcon';
import { RiskIcon } from '@/components/icons/RiskIcon';
import { ConnectIcon } from '@/components/icons/ConnectIcon';
import { MonitorIcon } from '@/components/icons/MonitorIcon';
import { ActivateIcon } from '@/components/icons/ActivateIcon';
import { ExecutionIcon } from '@/components/icons/ExecutionIcon';
import { PredictiveIcon } from '@/components/icons/PredictiveIcon';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { LayersIcon } from '@/components/icons/LayersIcon';
import { TargetIcon } from '@/components/icons/TargetIcon';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white/5 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:border-[var(--color-accent)]/50 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(88,166,255,0.1)]">
    <div className="flex items-center gap-4 mb-3">
      <div className="bg-[var(--color-accent)]/10 p-3 rounded-lg text-[var(--color-accent)]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <p className="text-base font-light text-[var(--color-text-secondary)] leading-relaxed">{children}</p>
  </div>
);

const HowItWorksStep: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; step: number }> = ({ icon, title, children, step }) => (
    <div className="relative pl-12 pb-8 border-l-2 border-[var(--color-border)] last:border-l-transparent last:pb-0">
        <div className="absolute -left-5 top-0 flex items-center justify-center w-10 h-10 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border)] rounded-full text-[var(--color-accent)]">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white">{step}. {title}</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{children}</p>
    </div>
);


const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white font-sans overflow-x-hidden">
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#58A6FF] to-[#3081F7] opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
        
        <header className="absolute inset-x-0 top-0 z-50">
          <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
            <div className="flex lg:flex-1">
              <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <LogoIcon className="h-8 w-auto text-[var(--color-accent)]" />
                <span className="text-2xl font-black">NexusAI</span>
              </Link>
            </div>
            <div className="flex lg:flex-1 lg:justify-end">
              <Link to="/login" className="text-sm font-semibold leading-6 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <div className="relative px-6 lg:px-8">
            <div className="mx-auto max-w-3xl pt-32 pb-24 sm:pt-48 sm:pb-32 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl text-glow-accent animate-fade-in">
                  Autonomous Trading Evolved
                </h1>
                <p className="mt-6 text-lg leading-8 text-[var(--color-text-secondary)] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    NexusAI is a fully autonomous, institutional-grade trading system. Connect your account via a secure bridge and let our Series-9 "Praetorian" AI hunt for high-probability opportunities 24/7.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <Link to="/login" className="rounded-md bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-opacity">
                    Access Command Center
                  </Link>
                </div>
            </div>
          </div>
          
          {/* How it Works Section */}
          <div className="bg-black/20 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="animate-fade-in">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">From Connection to Execution</h2>
                    <p className="mt-4 text-lg text-[var(--color-text-secondary)]">A seamless, three-step process to put our institutional-grade AI to work on your account.</p>
                     <div className="mt-12">
                         <HowItWorksStep step={1} title="Secure the Bridge" icon={<ConnectIcon className="w-5 h-5"/>}>
                             Download our MQL5 Expert Advisor into your MT5 terminal. Use the unique keys it generates to establish a secure, one-way connection. We never see your credentials.
                         </HowItWorksStep>
                         <HowItWorksStep step={2} title="Monitor the Hunt" icon={<MonitorIcon className="w-5 h-5"/>}>
                             From the Execution Core, watch the Praetorian AI analyze the market in real-time. Our transparent decision log shows you its exact thought process as it hunts for setups.
                         </HowItWorksStep>
                         <HowItWorksStep step={3} title="Activate Autonomy" icon={<ActivateIcon className="w-5 h-5"/>}>
                             When you're ready, activate the AI. It will take full autonomous control, executing trades with pre-calculated risk and exits based on its strategic analysis.
                         </HowItWorksStep>
                    </div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <img src="https://i.imgur.com/uS84n4G.png" alt="Dashboard Preview" className="rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10 w-full"/>
                </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
             <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">An Institutional-Grade AI Core</h2>
                <p className="mt-4 text-lg text-[var(--color-text-secondary)]">The Praetorian AI is not a simple algorithm. It is a multi-layered strategic intelligence designed for capital preservation and high-probability setups.</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mt-16">
              <FeatureCard title="Top-Down Analysis" icon={<BrainIcon className="w-6 h-6"/>}>
                  The AI establishes a high-level directional bias on the 1-hour chart before ever looking for a trade, ensuring it always trades with the dominant market structure.
              </FeatureCard>
              <FeatureCard title="Patient Execution" icon={<BoltIcon className="w-6 h-6"/>}>
                  It doesn't chase price. The AI waits patiently for a low-risk pullback on the 15-minute chart, then enters on a strong confirmation candle, maximizing its edge.
              </FeatureCard>
              <FeatureCard title="Disciplined Risk" icon={<RiskIcon className="w-6 h-6"/>}>
                  Every trade has a pre-calculated stop loss based on market structure and volatility (ATR), with a fixed 1:2 Risk-to-Reward ratio for consistent performance.
              </FeatureCard>
            </div>
          </div>
          
           {/* FAQ Section */}
           <div className="bg-black/20 py-24 sm:py-32">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Frequently Asked Questions</h2>
                    <div className="mt-12 space-y-8">
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="font-semibold text-white">Is this safe? Can the AI access my funds?</h3>
                            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">It's completely safe. The MQL5 connector can only place and manage trades. It has **no permission** to process withdrawals. Your funds can only be moved by you.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="font-semibold text-white">What assets does the AI trade?</h3>
                            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">The Praetorian core is optimized for a universe of high-liquidity assets including BTC/USD, ETH/USD, major Forex pairs like EUR/USD and GBP/USD, and Gold (XAU/USD).</p>
                        </div>
                         <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="font-semibold text-white">Can I override the AI or close trades manually?</h3>
                            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Yes. You have ultimate control. You can deactivate the AI at any time from the dashboard, or close its trades directly from your MT5 terminal. The AI will recognize the change and adapt.</p>
                        </div>
                    </div>
                </div>
           </div>
          
          {/* CTA Section */}
          <div className="py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Evolve Your Trading?</h2>
                  <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[var(--color-text-secondary)]">
                      Stop reacting to the market. Let NexusAI put you ahead of it. Create an account and connect your terminal to begin.
                  </p>
                  <div className="mt-10 flex items-center justify-center gap-x-6">
                      <Link to="/login" className="rounded-md bg-[var(--color-accent)] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 hover:opacity-90 transition-opacity">
                          Deploy the AI
                      </Link>
                  </div>
              </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Landing;