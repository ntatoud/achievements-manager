import type { StorageAdapter } from "./types";

export function localStorageAdapter(prefix?: string): StorageAdapter {
  const k = (key: string) => (prefix ? `${prefix}:${key}` : key);
  return {
    get(key) {
      if (typeof window === "undefined") return null;
      try {
        return localStorage.getItem(k(key));
      } catch {
        return null;
      }
    },
    set(key, value) {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(k(key), value);
      } catch {
        // Storage unavailable or full — silently ignore
      }
    },
    remove(key) {
      if (typeof window === "undefined") return;
      try {
        localStorage.removeItem(k(key));
      } catch {
        // Storage unavailable — silently ignore
      }
    },
  };
}

export function inMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
  };
}
