import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { ConversationItem } from './ConversationItem';
import { FriendSearchPanel } from './FriendSearchPanel';
import { ContactsPanel } from './ContactsPanel';
import { CreateGroupModal } from './CreateGroupModal';
import type { Conversation } from '../../types';
import { Search, MessageSquare } from 'lucide-react';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const activeId = useChatStore((s) => s.activeConversationId);
  const { sidebarTab, setSidebarTab, sidebarView, isCreateGroupModalOpen, setCreateGroupModalOpen } = useUIStore();

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const filtered: Conversation[] = (() => {
    switch (sidebarTab) {
      case 'groups': return conversations.filter((c) => c.type === 'group');
      case 'unread': return conversations.filter((c) => (c.unreadCount ?? 0) > 0);
      default: return conversations;
    }
  })();

  const getName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Nhóm chat';
    return conv.participants.find((p) => p._id !== user?._id)?.displayName || 'Chat';
  };

  const getAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.avatar || null;
    return conv.participants.find((p) => p._id !== user?._id)?.avatar || null;
  };

  const getOnline = (conv: Conversation) => {
    if (conv.type === 'group') return false;
    return conv.participants.find((p) => p._id !== user?._id)?.status === 'online';
  };

  return (
    <>
      <aside className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">
        {sidebarView === 'friends' ? (
          <FriendSearchPanel />
        ) : sidebarView === 'contacts' ? (
          <ContactsPanel />
        ) : (
          <>
            {/* Header */}
            <div className="p-4 space-y-4">
              <h1 className="text-xl font-bold text-slate-900">Tin nhắn</h1>

              {/* Search */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc trò chuyện"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0068FF]/5 border-transparent focus:ring-1 focus:ring-[#0068FF] focus:bg-white rounded-lg text-sm transition-all outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E7EB] gap-6">
                {(['all', 'unread', 'groups'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`pb-3 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${sidebarTab === tab
                      ? 'border-[#0068FF] text-[#0068FF] font-semibold'
                      : 'border-transparent text-slate-500 hover:text-[#0068FF]'
                      }`}
                  >
                    {tab === 'all' ? 'Tất cả' : tab === 'unread' ? 'Chưa đọc' : 'Nhóm'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 px-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
                    <MessageSquare size={22} color="#0068FF" strokeWidth={2} />
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    {sidebarTab === 'unread' ? 'Không có tin nhắn chưa đọc' : 'Chưa có cuộc trò chuyện nào'}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {filtered.map((conv) => (
                    <ConversationItem
                      key={conv._id}
                      conversation={conv}
                      name={getName(conv)}
                      avatar={getAvatar(conv)}
                      isOnline={getOnline(conv)}
                      isActive={activeId === conv._id}
                      onClick={() => setActiveConversation(conv._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} />
      )}
    </>
  );
}
