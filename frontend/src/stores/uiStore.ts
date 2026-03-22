import { create } from 'zustand';

type SidebarTab = 'all' | 'groups' | 'unread';
type SidebarView = 'messages' | 'friends' | 'contacts';

interface UIState {
  sidebarTab: SidebarTab;
  sidebarView: SidebarView;
  isRightPanelOpen: boolean;
  isNewChatModalOpen: boolean;
  isCreateGroupModalOpen: boolean;
  isProfileModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  lightboxOpen: boolean;
  lightboxImages: { url: string; name: string }[];
  lightboxIndex: number;

  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarView: (view: SidebarView) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setNewChatModalOpen: (open: boolean) => void;
  setCreateGroupModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openLightbox: (images: { url: string; name: string }[], index?: number) => void;
  closeLightbox: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarTab: 'all',
  sidebarView: 'messages',
  isRightPanelOpen: false,
  isNewChatModalOpen: false,
  isCreateGroupModalOpen: false,
  isProfileModalOpen: false,
  isMobileSidebarOpen: false,
  lightboxOpen: false,
  lightboxImages: [],
  lightboxIndex: 0,

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarView: (view) => set({ sidebarView: view }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
  setNewChatModalOpen: (open) => set({ isNewChatModalOpen: open }),
  setCreateGroupModalOpen: (open) => set({ isCreateGroupModalOpen: open }),
  setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  openLightbox: (images, index = 0) => set({ lightboxOpen: true, lightboxImages: images, lightboxIndex: index }),
  closeLightbox: () => set({ lightboxOpen: false }),
}));
