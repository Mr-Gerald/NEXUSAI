import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('nexusUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('nexusUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with status ${response.status}`);
        } catch (jsonError) {
            // This catches errors from response.json() if the body isn't valid JSON,
            // which is the case for a 500 server crash HTML page.
            throw new Error('A server error occurred. Please check server logs and try again.');
        }
    }
    
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Login failed.');
    }
    
    localStorage.setItem('nexusUser', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexusUser');
    setUser(null);
    navigate('/'); // Redirect to landing page on logout
  }, [navigate]);

  const updateUser = useCallback((updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('nexusUser', JSON.stringify(updatedUser));
  }, []);
  
  const value = useMemo(() => ({ user, isLoading, login, logout, updateUser }), [user, isLoading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};