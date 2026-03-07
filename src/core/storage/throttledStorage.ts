import type { StateStorage } from 'zustand/middleware';
import { throttle } from '../../utils/throttle';

class ThrottledStorage implements StateStorage {
  private memoryCache: Record<string, string> = {};
  
  private flushToLocal = throttle((name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.error('LocalStorage write failed:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('本地存储空间已满，请清理部分旧对话。');
      }
    }
  }, 2000);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.forceFlush);
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.forceFlush();
      });
    }
  }

  private forceFlush = () => {
    Object.entries(this.memoryCache).forEach(([name, value]) => {
      try {
        localStorage.setItem(name, value);
      } catch (e) {
        // ignore on unload
      }
    });
  };

  getItem(name: string): string | null {
    if (this.memoryCache[name] !== undefined) {
      return this.memoryCache[name];
    }
    try {
      const value = localStorage.getItem(name);
      if (value !== null) {
        try {
          JSON.parse(value);
        } catch {
          localStorage.removeItem(name);
          return null;
        }
      }
      return value;
    } catch (e) {
      return null;
    }
  }

  setItem(name: string, value: string): void {
    this.memoryCache[name] = value;
    this.flushToLocal(name, value);
  }

  removeItem(name: string): void {
    delete this.memoryCache[name];
    localStorage.removeItem(name);
  }
}

export const throttledStorage = new ThrottledStorage();
