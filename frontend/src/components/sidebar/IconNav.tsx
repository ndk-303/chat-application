import { useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';

interface NavButtonProps {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}

function NavButton({ title, active, onClick, children, badge }: NavButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group ${active
        ? 'bg-white text-[#0068FF] shadow-md shadow-[#0068FF]/20'
        : 'text-white/75 hover:text-white hover:bg-white/15'
        }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-1 -top-1 min-w-[17px] h-[17px] bg-[#FF3B30] rounded-full border-2 border-[#0068FF] flex items-center justify-center text-white text-[9px] font-bold px-0.5 pointer-events-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1F2937] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-lg">
        {title}
      </span>
    </button>
  );
}

export function IconNav() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { sidebarView, setSidebarView, setCreateGroupModalOpen, setProfileModalOpen } = useUIStore();
  const conversations = useChatStore((s) => s.conversations);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-[68px] bg-[#0068FF] flex flex-col items-center py-4 justify-between shrink-0">
      {/* Top: Logo + Nav */}
      <div className="flex flex-col items-center gap-5">
        <button
          title="Hồ sơ"
          onClick={() => setProfileModalOpen(true)}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 mt-1 shrink-0 hover:border-white transition-all group relative"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-md font-bold">
              {(user?.displayName?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1F2937] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-lg">
            Hồ sơ
          </span>
        </button>

        {/* Top Nav Buttons */}
        <nav className="flex flex-col gap-2">
          {/* Messages */}
          <NavButton
            title="Tin nhắn"
            active={sidebarView === 'messages'}
            onClick={() => setSidebarView('messages')}
            badge={totalUnread}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" />
            </svg>
          </NavButton>

          {/* Add Friend */}
          <NavButton
            title="Thêm bạn bè"
            active={sidebarView === 'friends'}
            onClick={() => setSidebarView('friends')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="16" y1="11" x2="22" y2="11" />
            </svg>
          </NavButton>

          {/* Contacts */}
          <NavButton
            title="Danh bạ"
            active={sidebarView === 'contacts'}
            onClick={() => setSidebarView('contacts')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </NavButton>

          {/* Create Group */}
          <NavButton
            title="Tạo nhóm"
            onClick={() => setCreateGroupModalOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="17" y1="11" x2="23" y2="11" />
            </svg>
          </NavButton>
        </nav>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col gap-2 items-center">
        {/* Settings */}
        <NavButton title="Cài đặt" onClick={() => { }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </NavButton>

        {/* Sign out */}
        <NavButton title="Đăng xuất" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </NavButton>
      </div>
    </aside>
  );
}
