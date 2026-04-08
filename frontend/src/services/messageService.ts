import api from '../lib/axios';
import type { Message } from '../types';

export const messageService = {
  async getMessages(
    conversationId: string,
    params?: { limit?: number; before?: string }
  ): Promise<{ count: number; messages: Message[] }> {
    const res = await api.get(`/messages/${conversationId}`, { params });
    return res.data;
  },

  async sendMessage(conversationId: string, content: string, files?: File[]) {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('content', content);
      files.forEach((file) => formData.append('files', file));
      const res = await api.post(`/messages/${conversationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
    const res = await api.post(`/messages/${conversationId}`, { content });
    return res.data;
  },

  async markAsSeen(messageId: string) {
    const res = await api.patch(`/messages/${messageId}/seen`);
    return res.data;
  },

  async deleteMessage(messageId: string) {
    const res = await api.delete(`/messages/${messageId}`);
    return res.data;
  },
};
