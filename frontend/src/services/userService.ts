import api from '../lib/axios';
import type { User } from '../types';

export const userService = {
  async getMe(): Promise<User> {
    const res = await api.get('/users/me');
    return res.data;
  },

  async getUserById(id: string): Promise<User> {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async searchUsers(q: string, limit = 20) {
    const res = await api.get('/users/search', { params: { q, limit } });
    return res.data;
  },

  async updateCurrentProfile(data: { displayName?: string; avatar?: string; bio?: string }) {
    const res = await api.patch('/users/me', data);
    return res.data;
  },

  async updateStatus(status: 'online' | 'offline' | 'away' | 'busy') {
    const res = await api.patch('/users/me/status', { status });
    return res.data;
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.patch('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
