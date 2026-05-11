import { create } from 'zustand';

export type PanelPosition = 'left' | 'right' | 'bottom';

export interface LayoutState {
  sidebarWidth: number;
  sidebarVisible: boolean;
  editorPanelVisible: boolean;
  editorPanelWidth: number;
  terminalPanelHeight: number;
  activeSidebarTab: 'files' | 'search' | 'settings';

  // Actions
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setEditorPanelVisible: (visible: boolean) => void;
  setEditorPanelWidth: (width: number) => void;
  setTerminalPanelHeight: (height: number) => void;
  setActiveSidebarTab: (tab: LayoutState['activeSidebarTab']) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarWidth: 260,
  sidebarVisible: true,
  editorPanelVisible: true,
  editorPanelWidth: 500,
  terminalPanelHeight: 300,
  activeSidebarTab: 'files',

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setEditorPanelVisible: (visible) => set({ editorPanelVisible: visible }),
  setEditorPanelWidth: (width) => set({ editorPanelWidth: width }),
  setTerminalPanelHeight: (height) => set({ terminalPanelHeight: height }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
}));