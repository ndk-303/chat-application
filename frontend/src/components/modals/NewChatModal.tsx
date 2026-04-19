import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { userService } from '../../services/userService';
import { conversationService } from '../../services/conversationService';
import type { User } from '../../types';
import { X, Search, Check, Loader2 } from 'lucide-react';

export function NewChatModal() {
  const isOpen = useUIStore((s) => s.isNewChatModalOpen);
  const setOpen = useUIStore((s) => s.setNewChatModalOpen);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const addConversation = useChatStore((s) => s.addConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const data = await userService.searchUsers(q);
      setSearchResults(data.users ?? []);
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  const toggleUser = (u: User) => {
    if (tab === 'direct') {
      setSelectedUsers([u]);
    } else {
      setSelectedUsers((prev) =>
        prev.find((p) => p._id === u._id) ? prev.filter((p) => p._id !== u._id) : [...prev, u]
      );
    }
  };

  const handleStart = async () => {
    if (selectedUsers.length === 0) return;
    setIsLoading(true);
    try {
      let conv;
      if (tab === 'direct') {
        const data = await conversationService.createPrivateConversation(selectedUsers[0]._id);
        conv = data.conversation;
      } else {
        if (!groupName.trim()) return;
        const data = await conversationService.createGroupConversation(
          groupName.trim(),
          selectedUsers.map((u) => u._id)
        );
        conv = data.conversation;
      }
      if (conv) {
        addConversation(conv);
        setActiveConversation(conv._id);
      }
      await fetchConversations();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally { setIsLoading(false); }
  };

  const handleClose = () => {
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
    setTab('direct');
  };

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[0.25rem] shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Cuộc trò chuyện mới</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-[0.25rem] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-1 bg-gray-100 rounded-[0.25rem] p-1">
            {(['direct', 'group'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedUsers([]); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-[0.25rem] transition-all capitalize ${
                  tab === t ? 'bg-white text-[#0068FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'direct' ? 'Nhắn tin riêng' : 'Nhóm chat'}
              </button>
            ))}
          </div>
        </div>

        {/* Group name (group only) */}
        {tab === 'group' && (
          <div className="px-5 pb-3">
            <input
              type="text"
              placeholder="Tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-[0.25rem] border border-gray-200 bg-gray-50 outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 transition-all"
            />
          </div>
        )}

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mọi người..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-[0.25rem] border border-gray-200 bg-gray-50 outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 transition-all"
            />
          </div>
        </div>

        {/* Selected users (group) */}
        {tab === 'group' && selectedUsers.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <span key={u._id} className="inline-flex items-center gap-1.5 bg-[#0068FF]/10 text-[#0068FF] text-xs font-medium px-2.5 py-1 rounded-full">
                {u.displayName}
                <button onClick={() => toggleUser(u)} className="hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin text-[#0068FF]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((u) => {
              const isSelected = selectedUsers.some((s) => s._id === u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[0.25rem] text-left transition-all ${
                    isSelected ? 'bg-[#0068FF]/10' : 'hover:bg-gray-50'
                  }`}
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {getInitials(u.displayName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  {isSelected && <Check size={16} color="#0068FF" strokeWidth={2.5} />}
                </button>
              );
            })
          ) : searchQuery.length >= 2 ? (
            <p className="text-center text-sm text-gray-400 py-8">Không tìm thấy người dùng</p>
          ) : (
            <p className="text-center text-sm text-gray-400 py-8">Tìm kiếm người để bắt đầu chat</p>
          )}
        </div>

        {/* Action button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleStart}
            disabled={selectedUsers.length === 0 || (tab === 'group' && !groupName.trim()) || isLoading}
            className="w-full py-2.5 rounded-[0.25rem] bg-[#0068FF] text-white font-semibold text-sm transition-all hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang tạo...
              </>
            ) : tab === 'direct' ? 'Bắt đầu chat' : `Tạo nhóm${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
