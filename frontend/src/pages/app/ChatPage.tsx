import { IconNav } from '../../components/sidebar/IconNav';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { RightPanel } from '../../components/panel/RightPanel';
import { NewChatModal } from '../../components/modals/NewChatModal';
import { ProfileModal } from '../../components/modals/ProfileModal';
import { CallManager } from '../../components/call/CallManager';
import { ImageLightbox } from '../../components/chat/ImageLightbox';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { useSocketMessageStatus } from '../../hooks/useSocketMessageStatus';
import { useIsMobile } from '../../hooks/use-mobile';

export default function ChatPage() {
  useSocketMessageStatus(); // Listen for real-time message status updates
  const isMobile = useIsMobile();
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const isProfileModalOpen = useUIStore((s) => s.isProfileModalOpen);
  const setProfileModalOpen = useUIStore((s) => s.setProfileModalOpen);
  const { lightboxOpen, lightboxImages, lightboxIndex, closeLightbox } = useUIStore();
  const activeId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversation = conversations.find((c) => c._id === activeId);

  // Mobile layout: vertical nav always on left, sidebar OR chat on right
  if (isMobile) {
    return (
      <div className="h-screen flex overflow-hidden relative" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Vertical icon nav — always visible on mobile too */}
        <IconNav />

        {/* Main content: sidebar list or chat */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          {!activeId ? (
            <Sidebar />
          ) : (
            <ChatWindow />
          )}
        </div>

        {/* Right panel as full-screen overlay on mobile */}
        {isRightPanelOpen && activeConversation && (
          <div className="fixed inset-0 z-40 bg-white overflow-y-auto">
            <RightPanel conversation={activeConversation} />
          </div>
        )}

        <NewChatModal />
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} />
        <CallManager />

        {lightboxOpen && (
          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={closeLightbox}
          />
        )}
      </div>
    );
  }

  // Desktop layout (original)
  return (
    <div className="h-screen flex overflow-hidden relative" style={{ fontFamily: 'Inter, sans-serif' }}>
      <IconNav />
      <Sidebar />
      <ChatWindow />
      {isRightPanelOpen && activeConversation && (
        <RightPanel conversation={activeConversation} />
      )}
      <NewChatModal />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <CallManager />

      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
