import { useAuthStore } from '../../stores/authStore';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import type { Conversation } from '../../types';

interface TypingIndicatorBarProps {
  conversationId: string;
  participants: Conversation['participants'];
}

export function TypingIndicatorBar({ conversationId, participants }: TypingIndicatorBarProps) {
  const user = useAuthStore((s) => s.user);
  const typingUserIds = useTypingIndicator(conversationId);

  // Filter out current user and resolve names
  const typers = [...typingUserIds]
    .filter((id) => id !== user?._id)
    .map((id) => {
      const p = participants.find((p) => p._id === id);
      return p?.displayName?.split(' ')[0] ?? 'Ai đó';
    });

  if (typers.length === 0) return null;

  const label =
    typers.length === 1
      ? `${typers[0]} đang soạn tin`
      : typers.length === 2
      ? `${typers[0]} và ${typers[1]} đang soạn tin`
      : `${typers.length} người đang soạn tin`;

  return (
    <div className="px-4 py-1.5 flex items-center gap-2 bg-white border-t border-gray-100 select-none">
      {/* Animated dots */}
      <span className="flex gap-0.5 items-end">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#0068FF] animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '900ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#0068FF] animate-bounce"
          style={{ animationDelay: '180ms', animationDuration: '900ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#0068FF] animate-bounce"
          style={{ animationDelay: '360ms', animationDuration: '900ms' }}
        />
      </span>
      <span className="text-xs text-[#0068FF] font-medium">{label}...</span>
    </div>
  );
}
