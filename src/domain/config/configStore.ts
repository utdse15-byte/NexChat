import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConfigStoreState } from './types';
import { defaultConfig } from './defaults';
import { indexedDBStorage } from '../../core/storage/indexedDBStorage';
import { migrateConfigData } from '../../core/storage/migration';

interface ConfigStore extends ConfigStoreState {
  updateConfig: (partial: Partial<ConfigStoreState>) => void;
  resetConfig: () => void;
  isConfigured: () => boolean;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      ...defaultConfig,
      updateConfig: (partial) => set((state) => ({ ...state, ...partial })),
      resetConfig: () => set(defaultConfig),
      isConfigured: () => {
        const state = get();
        if (state.backendEnabled) {
          // 后端模式下 model 可留空（由后端 .env 中 CHAT_MODEL 决定），
          // 仅 backendUrl 为必填
          return Boolean(state.backendUrl);
        }
        return Boolean(state.provider && state.apiKey && state.baseUrl && state.model);
      },
    }),
    {
      name: 'nexchat-config',
      version: 3,
      storage: createJSONStorage(() => indexedDBStorage),
      migrate: migrateConfigData,
    }
  )
);
