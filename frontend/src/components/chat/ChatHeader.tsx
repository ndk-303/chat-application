import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useCallStore } from '../../stores/callStore';
import type { Conversation } from '../../types';

interface ChatHeaderProps {
  conversation: Conversation;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { toggleRightPanel, isRightPanelOpen } = useUIStore();
  const { startOutgoingCall, startCallFn } = useCallStore();

  const other = conversation.type === 'private'
    ? conversation.participants.find((p) => p._id !== user?._id)
    : null;

  const name = conversation.type === 'group'
    ? (conversation.name || 'Group Chat')
    : (other?.displayName || 'Chat');

  const avatar = conversation.type === 'group'
    ? conversation.avatar
    : other?.avatar;

  const statusText = conversation.type === 'group'
    ? `${conversation.participants.length} thành viên`
    : other?.status === 'online' ? 'Online' : 'Offline';

  const isOnline = conversation.type === 'private' && other?.status === 'online';

  const handleCall = async (type: 'audio' | 'video') => {
    if (!other || !startCallFn) return;
    startOutgoingCall(type, {
      _id: other._id,
      displayName: other.displayName,
      avatar: other.avatar,
    });
    await startCallFn(other._id, type);
  };

  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
      {/* Avatar */}
      <div className="relative">
        {avatar ? (
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center font-bold text-sm">
            {conversation.type === 'group' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ) : getInitials(name)}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white" />
        )}
      </div>

      {/* Name & status */}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-800 truncate">{name}</h2>
        <p className={`text-xs ${isOnline ? 'text-[#22C55E]' : 'text-gray-400'}`}>{statusText}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Voice call — only for private conversations */}
        {conversation.type === 'private' && (
          <button
            title="Voice call"
            onClick={() => handleCall('audio')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.41 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        )}
        {/* Video call — only for private conversations */}
        {conversation.type === 'private' && (
          <button
            title="Video call"
            onClick={() => handleCall('video')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        )}
        <button
          title="Info"
          onClick={toggleRightPanel}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isRightPanelOpen ? 'text-[#0068FF] bg-[#0068FF]/10' : 'text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu-icon lucide-menu"><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /></svg>
        </button>
      </div>
    </div>
  );
}
