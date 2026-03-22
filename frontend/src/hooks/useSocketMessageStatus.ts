import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

export function useSocketMessageStatus() {
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const updateMessagesDelivered = useChatStore((s) => s.updateMessagesDelivered);
  const clearConversationUnread = useChatStore((s) => s.clearConversationUnread);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessageSeen = (data: {
      messageId: string;
      userId: string;
      seenAt: string;
      status: 'sent' | 'delivered' | 'seen';
      conversationId?: string;
    }) => {
      const { messageId, status } = data;
      const state = useChatStore.getState();
      const currentUserId = useAuthStore.getState().user?._id;

      // Find which conversationId this message belongs to
      for (const [convId, msgs] of Object.entries(state.messages)) {
        if (msgs.some((m) => m._id === messageId)) {
          updateMessageStatus(convId, messageId, status);
          // If the current user just saw this message, clear the unread badge
          if (data.userId === currentUserId) {
            clearConversationUnread(convId);
          }
          break;
        }
      }
    };

    const onMessagesDelivered = (data: {
      conversationId: string;
      messageIds: string[];
    }) => {
      updateMessagesDelivered(data.conversationId, data.messageIds);
    };

    socket.on('message_seen', onMessageSeen);
    socket.on('messages_delivered', onMessagesDelivered);

    return () => {
      socket.off('message_seen', onMessageSeen);
      socket.off('messages_delivered', onMessagesDelivered);
    };
  }, [updateMessageStatus, updateMessagesDelivered, clearConversationUnread]);
}
