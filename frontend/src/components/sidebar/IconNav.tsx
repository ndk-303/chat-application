import { useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { useIsMobile } from '../../hooks/use-mobile';
import { MessageSquare, Users, Settings, LogOut } from 'lucide-react';

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
      {/* Tooltip (desktop only) */}
      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 bg-[#1F2937] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-lg">
        {title}
      </span>
    </button>
  );
}

/* Mobile-specific compact nav button */
function MobileNavButton({ title, active, onClick, children, badge }: NavButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active
        ? 'bg-[#0068FF] text-white shadow-md'
        : 'text-gray-500 hover:text-[#0068FF] hover:bg-[#0068FF]/10'
        }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-[15px] h-[15px] bg-[#FF3B30] rounded-full flex items-center justify-center text-white text-[8px] font-bold px-0.5 pointer-events-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export function IconNav() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { sidebarView, setSidebarView, setProfileModalOpen } = useUIStore();
  const conversations = useChatStore((s) => s.conversations);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Mobile: horizontal compact bar
  if (isMobile) {
    return (
      <div className="flex items-center gap-1 flex-1">
        {/* Avatar */}
        <button
          onClick={() => setProfileModalOpen(true)}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#0068FF]/30 shrink-0"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#0068FF]/15 flex items-center justify-center text-[#0068FF] text-sm font-bold">
              {(user?.displayName?.[0] ?? '?').toUpperCase()}
            </div>
          )}
        </button>

        <h1 className="text-base font-bold text-gray-800 ml-1 mr-auto">Kapta</h1>

        <MobileNavButton title="Tin nhắn" active={sidebarView === 'messages'} onClick={() => setSidebarView('messages')} badge={totalUnread}>
          <MessageSquare size={18} fill={sidebarView === 'messages' ? 'currentColor' : 'none'} />
        </MobileNavButton>
        <MobileNavButton title="Danh bạ" active={sidebarView === 'contacts'} onClick={() => setSidebarView('contacts')}>
          <Users size={18} />
        </MobileNavButton>
        <MobileNavButton title="Đăng xuất" onClick={handleLogout}>
          <LogOut size={18} />
        </MobileNavButton>
      </div>
    );
  }

  // Desktop: vertical sidebar
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

          {/* Contacts */}
          <NavButton
            title="Danh bạ"
            active={sidebarView === 'contacts'}
            onClick={() => setSidebarView('contacts')}
          >
            <Users size={22} />
          </NavButton>
        </nav>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col gap-2 items-center">
        <NavButton title="Cài đặt" onClick={() => { }}>
          <Settings size={20} />
        </NavButton>
        <NavButton title="Đăng xuất" onClick={handleLogout}>
          <LogOut size={20} />
        </NavButton>
      </div>
    </aside>
  );
}
