import { create } from 'zustand';
import { initSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useChatStore } from './chatStore';
import { useCallStore } from './callStore';
import { useFriendStore } from './friendStore';
import type { Message } from '../types';

interface TypingInfo {
  userId: string;
  conversationId: string;
}

interface SocketState {
  isConnected: boolean;
  typingUsers: TypingInfo[];

  connect: (accessToken: string) => void;
  disconnect: () => void;
  setConnected: (connected: boolean) => void;
  setTyping: (info: TypingInfo & { isTyping: boolean }) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  typingUsers: [],

  connect: (accessToken: string) => {
    const existing = getSocket();
    if (existing?.connected) return; // already connected

    const socket = initSocket(accessToken);

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // ── Chat events ────────────────────────────────────────────────────
    socket.on('new_message', (message: Message) => {
      useChatStore.getState().addMessage(message);
    });

    socket.on('message_deleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      useChatStore.getState().deleteMessage(conversationId, messageId);
    });

    socket.on('typing', ({ userId, conversationId, isTyping }: TypingInfo & { isTyping: boolean }) => {
      get().setTyping({ userId, conversationId, isTyping });
    });

    // ── Presence events ───────────────────────────────────────────────
    socket.on('user_online', ({ userId }: { userId: string }) => {
      _updateUserStatus(userId, 'online');
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      _updateUserStatus(userId, 'offline');
    });

    socket.on('user_status_changed', ({ userId, status }: { userId: string; status: 'online' | 'offline' | 'away' | 'busy' }) => {
      _updateUserStatus(userId, status);
    });
    // ── Call / WebRTC signaling events ────────────────────────────────────
    socket.on('call:incoming', ({ callerId, callerInfo, offer, callType }: {
      callerId: string;
      callerInfo: { _id: string; displayName: string; avatar?: string };
      offer: RTCSessionDescriptionInit;
      callType: 'audio' | 'video';
    }) => {
      useCallStore.getState().setIncomingCall(callerId, callerInfo, offer, callType);
    });

    socket.on('call:rejected', () => {
      useCallStore.getState().endCall();
      setTimeout(() => useCallStore.getState().reset(), 2000);
    });

    socket.on('call:ended', () => {
      useCallStore.getState().endCall();
      setTimeout(() => useCallStore.getState().reset(), 2000);
    });

    // ── Group realtime ────────────────────────────────────────────────
    socket.on('group_created', (conversation: any) => {
      useChatStore.getState().addConversation(conversation);
    });

    socket.on('removed_from_group', ({ conversationId }: { conversationId: string }) => {
      useChatStore.setState((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
      }));
    });

    socket.on('group_dissolved', ({ conversationId }: { conversationId: string }) => {
      useChatStore.setState((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
      }));
    });

    // ── Private conversation realtime ────────────────────────────────
    socket.on('private_conversation_created', (conversation: any) => {
      // The other user created a conversation with us — add it to the list
      const exists = useChatStore.getState().conversations.some((c) => c._id === conversation._id);
      if (!exists) {
        useChatStore.getState().addConversation(conversation);
      }
    });

    // ── Conversation last message (sidebar update) ────────────────────
    socket.on('conversation_updated', ({ conversationId, lastMessage }: {
      conversationId: string;
      lastMessage: any;
    }) => {
      const { conversations } = useChatStore.getState();
      const exists = conversations.some((c) => c._id === conversationId);
      if (exists) {
        // Already in list — just update last message
        useChatStore.getState().updateConversationLastMessage(conversationId, lastMessage);
      } else {
        // Not in list yet (e.g. someone sent us a message in a brand new conversation)
        // Fetch the full conversation from server and add it
        import('../services/conversationService').then(({ conversationService }) => {
          conversationService.getConversationById(conversationId).then((conv) => {
            if (conv) {
              useChatStore.getState().addConversation(conv);
            }
          }).catch(() => {/* ignore */});
        });
      }
    });

    // ── Friend request realtime ───────────────────────────────────────
    socket.on('friend_request_received', (friendRequest: any) => {
      useFriendStore.setState((state) => ({
        receivedRequests: [friendRequest, ...state.receivedRequests],
      }));
    });

    socket.on('friend_request_accepted', () => {
      useFriendStore.getState().fetchFriends();
    });
  },

  disconnect: () => {
    disconnectSocket();
    set({ isConnected: false, typingUsers: [] });
  },

  setConnected: (connected) => set({ isConnected: connected }),

  setTyping: ({ userId, conversationId, isTyping }) => {
    set((state) => {
      const filtered = state.typingUsers.filter(
        (t) => !(t.userId === userId && t.conversationId === conversationId)
      );
      if (isTyping) {
        return { typingUsers: [...filtered, { userId, conversationId }] };
      }
      return { typingUsers: filtered };
    });
  },
}));

/** Update the status of a participant in all loaded conversations. */
function _updateUserStatus(userId: string, status: 'online' | 'offline' | 'away' | 'busy') {
  const { conversations } = useChatStore.getState();
  const updated = conversations.map((conv) => ({
    ...conv,
    participants: conv.participants.map((p) =>
      p._id === userId ? { ...p, status } : p
    ),
  }));
  useChatStore.setState({ conversations: updated });
}

// ── Typed selector helpers ────────────────────────────────────────────────────
export const selectTypingInConversation = (conversationId: string) => (state: SocketState) =>
  state.typingUsers.filter((t) => t.conversationId === conversationId);
