import { create } from 'zustand';
import { friendService } from '../services/friendService';
import type { FriendRequest, User } from '../types';

interface FriendState {
  friends: User[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;

  fetchFriends: () => Promise<void>;
  fetchReceivedRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendRequest: (receiverId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  isLoadingFriends: false,
  isLoadingRequests: false,

  fetchFriends: async () => {
    if (get().isLoadingFriends) return; // guard: tránh gọi song song
    set({ isLoadingFriends: true });
    try {
      const data = await friendService.getFriends();
      set({ friends: data.friends ?? [] });
    } catch (err) {
      console.error('[FriendStore] fetchFriends:', err);
    } finally {
      set({ isLoadingFriends: false });
    }
  },

  fetchReceivedRequests: async () => {
    if (get().isLoadingRequests) return; // guard: tránh gọi song song
    set({ isLoadingRequests: true });
    try {
      const data = await friendService.getReceivedRequests();
      set({ receivedRequests: data.requests ?? [] });
    } catch (err) {
      console.error('[FriendStore] fetchReceivedRequests:', err);
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  fetchSentRequests: async () => {
    if (get().isLoadingRequests) return; // guard: tránh gọi song song
    set({ isLoadingRequests: true });
    try {
      const data = await friendService.getSentRequests();
      set({ sentRequests: data.requests ?? [] });
    } catch (err) {
      console.error('[FriendStore] fetchSentRequests:', err);
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  sendRequest: async (receiverId) => {
    await friendService.sendFriendRequest(receiverId);
    // Refresh sent requests list after sending
    get().fetchSentRequests();
  },

  acceptRequest: async (requestId) => {
    await friendService.acceptFriendRequest(requestId);
    // Accepted → moves to friends list, remove from received
    set((state) => ({
      receivedRequests: state.receivedRequests.filter((r) => r._id !== requestId),
    }));
    get().fetchFriends();
  },

  rejectRequest: async (requestId) => {
    await friendService.rejectFriendRequest(requestId);
    set((state) => ({
      receivedRequests: state.receivedRequests.filter((r) => r._id !== requestId),
    }));
  },

  unfriend: async (friendId) => {
    await friendService.unfriend(friendId);
    set((state) => ({
      friends: state.friends.filter((f) => f._id !== friendId),
    }));
  },
}));
