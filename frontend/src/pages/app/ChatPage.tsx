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

  // Mobile layout: show sidebar OR chat, not both
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative" style={{ fontFamily: 'Inter, sans-serif' }}>
        {!activeId ? (
          /* Show sidebar on mobile when no conversation selected */
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              <IconNav />
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </>
        ) : (
          /* Show chat on mobile when conversation selected — back button is in ChatHeader */
          <ChatWindow />
        )}

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
