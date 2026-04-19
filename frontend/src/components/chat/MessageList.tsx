import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types';
import { emitMarkSeen } from '../../lib/socket';
import { Loader2, MessageCircleMore } from 'lucide-react';

interface MessageListProps {
  conversationId: string;
  isGroup: boolean;
}

function DateDivider({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  let label: string;
  if (days === 0) label = 'Hôm nay';
  else if (days === 1) label = 'Hôm qua';
  else label = date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#E5E7EB]" />
      <span className="text-xs text-[#9CA3AF] font-medium px-2 bg-[#E9EBEE]">{label}</span>
      <div className="flex-1 h-px bg-[#E5E7EB]" />
    </div>
  );
}

const EMPTY_MESSAGES: Message[] = [];

export function MessageList({ conversationId, isGroup }: MessageListProps) {
  const user = useAuthStore((s) => s.user);
  const messages = useChatStore((s) => s.messages[conversationId] ?? EMPTY_MESSAGES);
  const isLoading = useChatStore((s) => s.loadingMessages[conversationId] ?? false);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages(conversationId);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark messages as seen when this conversation is opened or new messages arrive
  useEffect(() => {
    if (!user || messages.length === 0) return;
    // Find the last message NOT sent by the current user that isn't already seen
    const lastUnread = [...messages]
      .reverse()
      .find((m) => m.senderId._id !== user._id && m.status !== 'seen');
    if (lastUnread) {
      emitMarkSeen(conversationId, lastUnread._id);
    }
  }, [conversationId, messages, user]);


  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#E9EBEE]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#0068FF]" />
          <span className="text-sm text-[#6B7280]">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#E9EBEE]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-[0.25rem] bg-[#0068FF]/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircleMore size={28} color="#0068FF" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[#1F2937]">Chưa có tin nhắn</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Hãy gửi lời chào!</p>
        </div>
      </div>
    );
  }

  // Group messages by date for date dividers
  const grouped: Array<Message | { type: 'date'; dateStr: string }> = [];
  let lastDate = '';

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      grouped.push({ type: 'date', dateStr: msg.createdAt });
      lastDate = msgDate;
    }
    grouped.push(msg);
  });

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-0 bg-[#E9EBEE]">
      {grouped.map((item, i) => {
        if ('type' in item && item.type === 'date') {
          return <DateDivider key={`date-${item.dateStr}`} dateStr={item.dateStr} />;
        }
        const msg = item as Message;
        const isSent = msg.senderId._id === user?._id;
        // Show avatar if this is first in a sequence from same sender
        const nextItem = grouped[i + 1];
        const nextMsg = nextItem && !('type' in nextItem) ? nextItem as Message : null;
        const showAvatar = !isSent && (
          !nextMsg || nextMsg.senderId._id !== msg.senderId._id || 'type' in (grouped[i + 1] || {})
        );

        return (
          <div key={msg._id} className="message-bounce">
            <MessageBubble
              message={msg}
              isSent={isSent}
              showAvatar={showAvatar}
              isGroup={isGroup}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
