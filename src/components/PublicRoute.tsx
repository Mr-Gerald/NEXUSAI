import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// FIX: Use relative paths for context imports.
import { useAuth } from '../contexts/AuthContext';

const PublicRoute: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg)]">
                <p className="text-[var(--color-text-secondary)]">Loading Session...</p>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;