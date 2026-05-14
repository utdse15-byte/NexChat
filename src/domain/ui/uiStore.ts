import { create } from 'zustand';

interface UIState {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isKnowledgeOpen: boolean;
  setIsKnowledgeOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isKnowledgeOpen: false,
  setIsKnowledgeOpen: (open) => set({ isKnowledgeOpen: open }),
}));
