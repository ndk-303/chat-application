import { useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { MessageSquare, UserPlus, Users, Settings, LogOut } from 'lucide-react';

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
            <MessageSquare size={22} fill="currentColor" />
          </NavButton>

          {/* Add Friend */}
          <NavButton
            title="Thêm bạn bè"
            active={sidebarView === 'friends'}
            onClick={() => setSidebarView('friends')}
          >
            <UserPlus size={22} />
          </NavButton>

          {/* Contacts */}
          <NavButton
            title="Danh bạ"
            active={sidebarView === 'contacts'}
            onClick={() => setSidebarView('contacts')}
          >
            <Users size={22} />
          </NavButton>

          {/* Create Group */}
          <NavButton
            title="Tạo nhóm"
            onClick={() => setCreateGroupModalOpen(true)}
          >
            <Users size={22} />
          </NavButton>
        </nav>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col gap-2 items-center">
        {/* Settings */}
        <NavButton title="Cài đặt" onClick={() => { }}>
          <Settings size={20} />
        </NavButton>

        {/* Sign out */}
        <NavButton title="Đăng xuất" onClick={handleLogout}>
          <LogOut size={20} />
        </NavButton>
      </div>
    </aside>
  );
}
