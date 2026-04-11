import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { ConversationItem } from './ConversationItem';
import { ContactsPanel } from './ContactsPanel';
import { PanelHeader } from './SidebarShared';
import { CreateGroupModal } from '../modals/CreateGroupModal';
import { FriendSearchModal } from '../modals/FriendSearchModal';
import type { Conversation } from '../../types';
import { MessageCircleMore, UserPlus, Users } from 'lucide-react';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const activeId = useChatStore((s) => s.activeConversationId);
  const {
    sidebarTab, setSidebarTab,
    sidebarView,
    isCreateGroupModalOpen, setCreateGroupModalOpen,
    isFriendSearchModalOpen, setFriendSearchModalOpen,
  } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const filtered: Conversation[] = (() => {
    const q = searchQuery.trim().toLowerCase();
    const byTab = (() => {
      switch (sidebarTab) {
        case 'groups': return conversations.filter((c) => c.type === 'group');
        case 'unread': return conversations.filter((c) => (c.unreadCount ?? 0) > 0);
        default: return conversations;
      }
    })();
    if (!q) return byTab;
    return byTab.filter((c) => {
      const name =
        c.type === 'group'
          ? c.name || ''
          : c.participants.find((p) => p._id !== user?._id)?.displayName || '';
      return name.toLowerCase().includes(q);
    });
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
        {sidebarView === 'contacts' ? (
          <ContactsPanel />
        ) : (
          <>
            {/* Header — dùng PanelHeader dùng chung */}
            <PanelHeader
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Tìm kiếm cuộc trò chuyện"
              actions={
                <>
                  <button
                    title="Thêm bạn bè"
                    onClick={() => setFriendSearchModalOpen(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all shrink-0"
                  >
                    <UserPlus size={16} strokeWidth={2} />
                  </button>
                  <button
                    title="Tạo nhóm"
                    onClick={() => setCreateGroupModalOpen(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all shrink-0"
                  >
                    <Users size={16} strokeWidth={2} />
                  </button>
                </>
              }
            >
              {/* Tabs */}
              <div className="flex border-b border-[#E5E7EB] gap-6">
                {(['all', 'unread', 'groups'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`pb-2 text-xs font-medium transition-colors capitalize border-b-2 -mb-px ${sidebarTab === tab
                        ? 'border-[#0068FF] text-[#0068FF] font-semibold'
                        : 'border-transparent text-slate-500 hover:text-[#0068FF]'
                      }`}
                  >
                    {tab === 'all' ? 'Tất cả' : tab === 'unread' ? 'Chưa đọc' : 'Nhóm'}
                  </button>
                ))}
              </div>
            </PanelHeader>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 px-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
                    <MessageCircleMore size={22} color="#0068FF" strokeWidth={2} />
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

      {/* Modals */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} />
      )}
      {isFriendSearchModalOpen && <FriendSearchModal />}
    </>
  );
}
