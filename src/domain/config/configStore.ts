import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConfigStoreState } from './types';
import { defaultConfig } from './defaults';
import { throttledStorage } from '../../core/storage/throttledStorage';
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
        const { apiKey, baseUrl, model } = get();
        return Boolean(apiKey && baseUrl && model);
      },
    }),
    {
      name: 'nexchat-config',
      version: 1,
      storage: createJSONStorage(() => throttledStorage),
      migrate: migrateConfigData,
    }
  )
);
