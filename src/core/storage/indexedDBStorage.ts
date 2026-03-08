import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Custom storage for Zustand persistence using IndexedDB via idb-keyval.
 * This offloads state serialization and I/O to a background thread and removes 5MB LocalStorage limit.
 */
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
