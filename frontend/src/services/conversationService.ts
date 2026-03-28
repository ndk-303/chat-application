import api from '../lib/axios';
import type { Conversation } from '../types';

export const conversationService = {
  async getConversations(): Promise<{ count: number; conversations: Conversation[] }> {
    const res = await api.get('/conversations');
    return res.data;
  },

  async getConversationById(id: string): Promise<Conversation> {
    const res = await api.get(`/conversations/${id}`);
    return res.data;
  },

  async createPrivateConversation(targetUserId: string) {
    const res = await api.post('/conversations', { type: 'private', targetUserId });
    return res.data;
  },

  async createGroupConversation(name: string, participantIds: string[], avatar?: string) {
    const res = await api.post('/conversations', {
      type: 'group',
      name,
      participantIds,
      avatar,
    });
    return res.data;
  },

  async updateConversation(conversationId: string, data: { name?: string; avatar?: string }) {
    const res = await api.patch(`/conversations/${conversationId}`, data);
    return res.data;
  },

  async leaveConversation(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}`);
    return res.data;
  },

  async addMember(conversationId: string, memberId: string) {
    const res = await api.post(`/conversations/${conversationId}/members`, { memberId });
    return res.data;
  },

  async removeMember(conversationId: string, memberId: string) {
    const res = await api.delete(`/conversations/${conversationId}/members/${memberId}`);
    return res.data;
  },

  async dissolveGroup(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}/dissolve`);
    return res.data;
  },

  async hideConversation(conversationId: string) {
    const res = await api.post(`/conversations/${conversationId}/hide`);
    return res.data;
  },

  async generateInvite(conversationId: string): Promise<{ inviteToken: string }> {
    const res = await api.post(`/conversations/${conversationId}/invite`);
    return res.data;
  },

  async getInviteInfo(token: string) {
    const res = await api.get(`/conversations/invite/${token}`);
    return res.data;
  },

  async joinByInvite(token: string) {
    const res = await api.post(`/conversations/invite/${token}/join`);
    return res.data;
  },
};