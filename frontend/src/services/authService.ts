import api from '../lib/axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async register(data: RegisterRequest) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async verifyEmail(email: string, code: string) {
    const res = await api.post('/auth/verify-email', { email, code });
    return res.data;
  },

  async resendVerificationCode(email: string) {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async refreshToken() {
    const res = await api.post('/auth/refresh-token');
    return res.data;
  },

  async requestPasswordReset(email: string) {
    const res = await api.post('/auth/request-password-reset', { email });
    return res.data;
  },

  async resetPassword(data: { email?: string; resetToken?: string; newPassword: string }) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};
