import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useSocketStore } from './socketStore';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ accessToken: token });
        if (token) localStorage.setItem('accessToken', token);
        else localStorage.removeItem('accessToken');
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login({ email, password });
          localStorage.setItem('accessToken', res.accessToken);
          set({ accessToken: res.accessToken, isLoading: false });
          // Fetch user profile
          const user = await userService.getMe();
          set({ user });
          // Connect socket after successful login
          useSocketStore.getState().connect(res.accessToken);
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } };
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // ignore
        }
        // Disconnect socket before clearing state
        useSocketStore.getState().disconnect();
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      initAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isInitialized: true });
          return;
        }
        set({ accessToken: token, isLoading: true });
        try {
          const user = await userService.getMe();
          set({ user, isLoading: false, isInitialized: true });
          // Reconnect socket with existing valid token
          useSocketStore.getState().connect(token);
        } catch {
          // Try refresh
          try {
            const { accessToken: newToken } = await authService.refreshToken();
            localStorage.setItem('accessToken', newToken);
            const user = await userService.getMe();
            set({ accessToken: newToken, user, isLoading: false, isInitialized: true });
            useSocketStore.getState().connect(newToken);
          } catch {
            localStorage.removeItem('accessToken');
            set({ user: null, accessToken: null, isLoading: false, isInitialized: true });
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'vibe-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);

// Selector helpers
export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => !!s.user && !!s.accessToken;
