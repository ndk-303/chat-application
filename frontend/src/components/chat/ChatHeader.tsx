import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useCallStore } from '../../stores/callStore';
import { useChatStore } from '../../stores/chatStore';
import { useIsMobile } from '../../hooks/use-mobile';
import type { Conversation } from '../../types';
import { Users, Phone, Video, Menu, ArrowLeft } from 'lucide-react';

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
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const isMobile = useIsMobile();

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
    <div className="h-12 md:h-13 bg-white border-b border-gray-100 flex items-center px-2 md:px-3 gap-2 flex-shrink-0">
      {/* Back button (mobile only) */}
      {isMobile && (
        <button
          onClick={() => setActiveConversation(null)}
          className="w-7 h-7 rounded-[0.25rem] flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
        >
          <ArrowLeft size={17} />
        </button>
      )}

      {/* Avatar */}
      <div className="relative">
        {avatar ? (
          <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center font-bold text-xs">
            {conversation.type === 'group' ? (
              <Users size={15} fill="currentColor" />
            ) : getInitials(name)}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-800 truncate">{name}</h2>
        <p className={`text-[10px] ${isOnline ? 'text-[#22C55E]' : 'text-gray-400'}`}>{statusText}</p>
      </div>

      <div className="flex items-center gap-0.5 md:gap-1">
        {conversation.type === 'private' && (
          <button
            title="Voice call"
            onClick={() => handleCall('audio')}
            className="w-7 h-7 rounded-[0.25rem] flex items-center justify-center text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all"
          >
            <Phone size={17} />
          </button>
        )}
        {conversation.type === 'private' && (
          <button
            title="Video call"
            onClick={() => handleCall('video')}
            className="w-7 h-7 rounded-[0.25rem] flex items-center justify-center text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all"
          >
            <Video size={17} />
          </button>
        )}
        <button
          title="Info"
          onClick={toggleRightPanel}
          className={`w-7 h-7 rounded-[0.25rem] flex items-center justify-center transition-all ${isRightPanelOpen ? 'text-[#0068FF] bg-[#0068FF]/10' : 'text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10'}`}
        >
          <Menu size={17} />
        </button>
      </div>
    </div>
  );
}
