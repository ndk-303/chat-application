const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('aether_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('aether_token', token);
      } else {
        localStorage.removeItem('aether_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('aether_token');
    }
    return this.token;
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends HTTP-only refreshToken cookie
    });

    // Attempt token refresh if 401 and not an auth route
    if (response.status === 401 && !path.startsWith('/auth/')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          this.setToken(accessToken);
          headers['Authorization'] = `Bearer ${accessToken}`;
          const retryRes = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
          if (!retryRes.ok) {
            const err = await retryRes.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(err.message || `HTTP ${retryRes.status}`);
          }
          return retryRes.json();
        } else {
          this.setToken(null);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      } catch {
        this.setToken(null);
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Request failed' }));
      const error: any = new Error(err.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = err;
      throw error;
    }

    return response.json();
  }

  // ── Auth Endpoints ──────────────────────────────────────────────────────────
  async login(data: { email: string; password: string }) {
    const res = await this.request<{ message: string; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.accessToken);
    return res;
  }

  async register(data: { displayName: string; email: string; password: string }) {
    return this.request<{ message: string; userId: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(data: { email: string; code: string }) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async requestPasswordReset(email: string) {
    return this.request<{ message: string; expiresIn: string }>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: { email: string; resetToken?: string; newPassword: string }) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // ── Users Endpoints ────────────────────────────────────────────────────────
  async getMe() {
    return this.request('/users/me');
  }

  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    phone?: string;
    address?: string;
    customStatus?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
  }) {
    return this.request<{ message: string; user: any }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.request<{ message: string; avatar: string; user: any }>('/users/me/avatar', {
      method: 'PATCH',
      body: formData,
    });
  }

  async updateStatus(status: 'online' | 'offline' | 'away' | 'busy') {
    return this.request<{ message: string; user: any }>('/users/me/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async searchUsers(query: string, limit = 20) {
    return this.request<{ count: number; users: any[] }>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  // ── Friends Endpoints ──────────────────────────────────────────────────────
  async getFriends() {
    return this.request<{ count: number; friends: any[] }>('/friends');
  }

  async sendFriendRequest(receiverId: string) {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  }

  async acceptFriendRequest(requestId: string) {
    return this.request(`/friends/accept/${requestId}`, {
      method: 'POST',
    });
  }

  async rejectFriendRequest(requestId: string) {
    return this.request(`/friends/reject/${requestId}`, {
      method: 'POST',
    });
  }

  async getReceivedRequests() {
    return this.request<{ count: number; requests: any[] }>('/friends/requests/received');
  }

  async getSentRequests() {
    return this.request<{ count: number; requests: any[] }>('/friends/requests/sent');
  }

  async unfriend(friendId: string) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  // ── Conversations Endpoints ────────────────────────────────────────────────
  async getConversations(page = 1, limit = 20) {
    return this.request<{ count: number; conversations: any[] }>(`/conversations?page=${page}&limit=${limit}`);
  }

  async getConversationById(id: string) {
    return this.request(`/conversations/${id}`);
  }

  async createPrivateConversation(targetUserId: string) {
    return this.request<{ message: string; conversation: any }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ type: 'private', targetUserId }),
    });
  }

  async createGroupConversation(name: string, participantIds: string[], avatar?: string) {
    return this.request<{ message: string; conversation: any }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ type: 'group', name, participantIds, avatar }),
    });
  }

  async updateConversation(conversationId: string, data: { name?: string; avatar?: string }) {
    return this.request<{ message: string; conversation: any }>(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async leaveConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}`, { method: 'DELETE' });
  }

  async addMember(conversationId: string, memberId: string) {
    return this.request(`/conversations/${conversationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
  }

  async removeMember(conversationId: string, memberId: string) {
    return this.request(`/conversations/${conversationId}/members/${memberId}`, { method: 'DELETE' });
  }

  async dissolveGroup(conversationId: string) {
    return this.request(`/conversations/${conversationId}/dissolve`, { method: 'DELETE' });
  }

  async pinConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}/pin`, { method: 'PUT' });
  }

  async unpinConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}/pin`, { method: 'DELETE' });
  }

  async muteConversation(conversationId: string, mutedUntil?: string) {
    return this.request(`/conversations/${conversationId}/mute`, {
      method: 'PUT',
      body: JSON.stringify({ mutedUntil }),
    });
  }

  async unmuteConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}/mute`, { method: 'DELETE' });
  }

  // ── Messages Endpoints ─────────────────────────────────────────────────────
  async getMessages(conversationId: string, limit = 50, before?: string) {
    let url = `/messages/${conversationId}?limit=${limit}`;
    if (before) url += `&before=${before}`;
    return this.request<{ count: number; messages: any[] }>(url);
  }

  async sendMessage(conversationId: string, content: string, files?: File[]) {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (files && files.length > 0) {
      files.forEach((f) => formData.append('files', f));
    }
    return this.request<{ message: string; data: any }>(`/messages/${conversationId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async markAsSeen(messageId: string) {
    return this.request(`/messages/${messageId}/seen`, { method: 'PATCH' });
  }

  async toggleReaction(messageId: string, emoji: string) {
    return this.request<{ reactions: any[] }>(`/messages/${messageId}/react`, {
      method: 'PATCH',
      body: JSON.stringify({ emoji }),
    });
  }

  async deleteMessage(messageId: string) {
    return this.request(`/messages/${messageId}`, { method: 'DELETE' });
  }

  // ── WebRTC ICE Servers ─────────────────────────────────────────────────────
  async getIceServers() {
    return this.request<{ iceServers: RTCIceServer[] }>('/ice-servers');
  }
}

export const api = new ApiClient();
export default api;
