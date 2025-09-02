import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LockIcon } from '@/components/icons/LockIcon';
import { LogoIcon } from '@/components/icons/LogoIcon';

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('Gerald');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-secondary)] p-4">
             <div className="absolute top-4 left-4">
                 <Link to="/" className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition-opacity">
                     <LogoIcon className="h-8 w-8 text-[var(--color-accent)]" />
                    <span className="text-lg font-bold text-[var(--color-text-secondary)]">NexusAI</span>
                 </Link>
            </div>
            <div className="w-full max-w-md animate-fade-in">
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-8 shadow-2xl shadow-black/20">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                <LockIcon className="w-6 h-6" /> Core Authentication
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Access the NexusAI Dashboard</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-[var(--color-accent)] text-white font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-[var(--color-accent)]/10">
                            {isLoading ? 'Authenticating...' : 'Secure Login'}
                        </button>
                        {error && <p className="text-sm text-center text-[var(--color-accent-red)]">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;