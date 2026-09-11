'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<{ userId: string; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { displayName?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  updateStatus: (status: 'online' | 'offline' | 'away' | 'busy') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
      api.setToken(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const savedToken = api.getToken();
    if (savedToken) {
      setToken(savedToken);
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.accessToken);
    await refreshUser();
  };

  const register = async (displayName: string, email: string, password: string) => {
    const res = await api.register({ displayName, email, password });
    return { userId: res.userId, email: res.email };
  };

  const verifyEmail = async (email: string, code: string) => {
    await api.verifyEmail({ email, code });
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setToken(null);
      api.setToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const updateProfile = async (data: { displayName?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const uploadAvatar = async (file: File) => {
    const res = await api.uploadAvatar(file);
    setUser(res.user);
  };

  const updateStatus = async (status: 'online' | 'offline' | 'away' | 'busy') => {
    const res = await api.updateStatus(status);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        logout,
        refreshUser,
        updateProfile,
        uploadAvatar,
        updateStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
