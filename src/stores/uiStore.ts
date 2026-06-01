import { create } from 'zustand';

interface UIState {
  // 侧边栏
  sidebarExpanded: boolean;
  sidebarHovered: boolean;
  toggleSidebar: () => void;
  setSidebarHovered: (hovered: boolean) => void;

  // 搜索
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // 全局加载状态
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarExpanded: false,
  sidebarHovered: false,
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  setSidebarHovered: (hovered) => set({ sidebarHovered: hovered }),

  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
