import { create } from 'zustand';

interface UIState {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
