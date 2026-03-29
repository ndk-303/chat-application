import type { Conversation, Message } from '../../types';
import { Users } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  name: string;
  avatar: string | null;
  isOnline: boolean;
  isActive: boolean;
  onClick: () => void;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getLastMessageText(msg?: Message): string {
  if (!msg) return 'No messages yet';
  if (msg.files && msg.files.length > 0) {
    return msg.content || `📎 ${msg.files.length} file${msg.files.length > 1 ? 's' : ''}`;
  }
  return msg.content || '';
}

export function ConversationItem({ conversation, name, avatar, isOnline, isActive, onClick }: ConversationItemProps) {
  const lastMsg = conversation.lastMessageId as Message | undefined;
  const unread = conversation.unreadCount ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 border-l-[3px] ${
        isActive
          ? 'bg-[#E6F0FF] border-l-[#0068FF]'
          : 'border-l-transparent hover:bg-[#F5F7FA]'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div className={`size-12 rounded-full flex items-center justify-center text-sm font-bold ${
            isActive ? 'bg-[#0068FF] text-white' : 'bg-[#E6F0FF] text-[#0068FF]'
          }`}>
            {conversation.type === 'group' ? (
              <Users size={18} fill="currentColor" />
            ) : getInitials(name)}
          </div>
        )}
        <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
          isOnline ? 'bg-[#22C55E]' : 'bg-slate-300'
        }`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-[#0068FF]' : 'text-[#1F2937]'}`}>{name}</h3>
          <span className="text-[10px] text-[#9CA3AF] flex-shrink-0 ml-1">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className={`text-xs truncate ${unread > 0 ? 'font-medium text-[#1F2937]' : 'text-[#6B7280]'}`}>
          {getLastMessageText(lastMsg)}
        </p>
      </div>

      {/* Unread Badge */}
      {unread > 0 && (
        <div className="shrink-0 flex flex-col items-end">
          <span className="min-w-[20px] h-5 px-1 bg-[#FF3B30] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
            {unread > 99 ? '99+' : unread}
          </span>
        </div>
      )}
    </button>
  );
}
