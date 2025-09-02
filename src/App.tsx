import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Agents from '@/pages/Agents';
import Risk from '@/pages/Risk';
import MarketData from '@/pages/MarketData';
import SystemStatus from '@/pages/SystemStatus';
import Manipulation from '@/pages/Manipulation';
import PredictiveAnalytics from '@/pages/PredictiveAnalytics';
import TradeSignals from '@/pages/TradeSignals';
import TradeBlotter from '@/pages/TradeBlotter';
import ExecutionCore from '@/pages/ExecutionCore';
import Profile from '@/pages/Profile';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes: Accessible only when logged out */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Route>
      
      {/* Protected Routes: Accessible only when logged in */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade-signals" element={<TradeSignals />} />
          <Route path="/predatory-analysis" element={<PredictiveAnalytics />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/market-data" element={<MarketData />} />
          <Route path="/manipulation" element={<Manipulation />} />
          <Route path="/system-status" element={<SystemStatus />} />
          <Route path="/trade-blotter" element={<TradeBlotter />} />
          <Route path="/execution-core" element={<ExecutionCore />} />
          <Route path="/profile" element={<Profile />} />
          {/* Default authenticated route if no other path matches */}
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;