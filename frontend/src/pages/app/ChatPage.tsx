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

export default function ChatPage() {
  useSocketMessageStatus(); // Listen for real-time message status updates
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const isProfileModalOpen = useUIStore((s) => s.isProfileModalOpen);
  const setProfileModalOpen = useUIStore((s) => s.setProfileModalOpen);
  const { lightboxOpen, lightboxImages, lightboxIndex, closeLightbox } = useUIStore();
  const activeId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversation = conversations.find((c) => c._id === activeId);

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
