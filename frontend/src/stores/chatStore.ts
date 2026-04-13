import { create } from 'zustand';
import type { Conversation, Message, MessageReaction } from '../types';
import { conversationService } from '@/services/conversationService';
import { messageService } from '@/services/messageService';
import { useAuthStore } from './authStore';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoadingConversations: boolean;
  loadingMessages: Record<string, boolean>;  // per-conversation loading state

  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, files?: File[]) => Promise<void>;
  addMessage: (message: Message) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message['status']) => void;
  updateMessagesDelivered: (conversationId: string, messageIds: string[]) => void;
  incrementConversationUnread: (conversationId: string) => void;
  clearConversationUnread: (conversationId: string) => void;
  updateMessageReactions: (conversationId: string, messageId: string, reactions: MessageReaction[]) => void;
  toggleMute: (conversationId: string) => Promise<void>;
  togglePin: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoadingConversations: false,
  loadingMessages: {},

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const data = await conversationService.getConversations();
      set({ conversations: data.conversations, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  setActiveConversation: (id) => {
    if (id) {
      // Clear unread when opening a conversation
      get().clearConversationUnread(id);
    }
    set({ activeConversationId: id });
  },

  fetchMessages: async (conversationId) => {
    // Only fetch if we don't already have messages for this conversation
    set((state) => ({
      loadingMessages: { ...state.loadingMessages, [conversationId]: true },
    }));
    try {
      const data = await messageService.getMessages(conversationId, { limit: 50 });
      set((state) => ({
        messages: { ...state.messages, [conversationId]: data.messages },
        loadingMessages: { ...state.loadingMessages, [conversationId]: false },
      }));
    } catch {
      set((state) => ({
        loadingMessages: { ...state.loadingMessages, [conversationId]: false },
      }));
    }
  },

  sendMessage: async (conversationId, content, files) => {
    await messageService.sendMessage(conversationId, content, files);
    // Message will arrive via socket or be re-fetched
  },

  addMessage: (message) => {
    const conversationId = message.conversationId;
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      return {
        messages: { ...state.messages, [conversationId]: [...existing, message] },
      };
    });
    get().updateConversationLastMessage(conversationId, message);

    // Increment unread nếu message từ người khác, conversation active, và KHÔNG bị mute
    const currentUserId = useAuthStore.getState().user?._id;
    const isActive = get().activeConversationId === conversationId;
    const isFromMe = currentUserId && message.senderId._id === currentUserId;
    const isMuted = get().conversations.find(c => c._id === conversationId)?.isMuted ?? false;
    if (!isActive && !isFromMe && !isMuted) {
      get().incrementConversationUnread(conversationId);
    }
  },

  updateConversationLastMessage: (conversationId, message) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, lastMessageId: message, lastMessageAt: message.createdAt }
          : c
      ),
    }));
  },

  prependMessages: (conversationId, messages) => {
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      return {
        messages: { ...state.messages, [conversationId]: [...messages, ...existing] },
      };
    });
  },

  deleteMessage: (conversationId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).filter(
          (m) => m._id !== messageId
        ),
      },
    }));
  },

  addConversation: (conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },

  updateMessageStatus: (conversationId, messageId, status) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m._id === messageId ? { ...m, status } : m
        ),
      },
    }));
  },

  updateMessagesDelivered: (conversationId, messageIds) => {
    const idSet = new Set(messageIds);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          idSet.has(m._id) && m.status === 'sent' ? { ...m, status: 'delivered' } : m
        ),
      },
    }));
  },

  incrementConversationUnread: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1 }
          : c
      ),
    }));
  },

  clearConversationUnread: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  updateMessageReactions: (conversationId, messageId, reactions) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      },
    }));
  },

  toggleMute: async (conversationId) => {
    const conv = get().conversations.find((c) => c._id === conversationId);
    if (!conv) return;
    const nowMuted = !conv.isMuted;
    try {
      if (nowMuted) {
        await conversationService.muteConversation(conversationId);
      } else {
        await conversationService.unmuteConversation(conversationId);
      }
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === conversationId
            ? { ...c, isMuted: nowMuted, ...(nowMuted ? { unreadCount: 0 } : {}) }
            : c
        ),
      }));
    } catch (err) {
      console.error('[chatStore] toggleMute failed', err);
      throw err;
    }
  },

  togglePin: async (conversationId) => {
    const conv = get().conversations.find((c) => c._id === conversationId);
    if (!conv) return;
    const nowPinned = !conv.isPinned;
    try {
      if (nowPinned) {
        await conversationService.pinConversation(conversationId);
      } else {
        await conversationService.unpinConversation(conversationId);
      }
      set((state) => {
        const updated = state.conversations.map((c) =>
          c._id === conversationId ? { ...c, isPinned: nowPinned } : c
        );
        updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();
        });
        return { conversations: updated };
      });
    } catch (err) {
      console.error('[chatStore] togglePin failed', err);
      throw err;
    }
  },
}));
