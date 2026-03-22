import api from '../lib/axios';

export const friendService = {
  async getFriends() {
    const res = await api.get('/friends');
    return res.data;
  },

  async sendFriendRequest(receiverId: string) {
    const res = await api.post('/friends/request', { receiverId });
    return res.data;
  },

  async acceptFriendRequest(requestId: string) {
    const res = await api.post(`/friends/accept/${requestId}`);
    return res.data;
  },

  async rejectFriendRequest(requestId: string) {
    const res = await api.post(`/friends/reject/${requestId}`);
    return res.data;
  },

  async getReceivedRequests() {
    const res = await api.get('/friends/requests/received');
    return res.data;
  },

  async getSentRequests() {
    const res = await api.get('/friends/requests/sent');
    return res.data;
  },

  async unfriend(friendId: string) {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },
};
