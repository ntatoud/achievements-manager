import type { HashAdapter, StorageAdapter } from "./types";

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

/**
 * Default hash adapter using FNV-1a (32-bit).
 * Fast, synchronous, and sufficient for tamper detection.
 */
export function fnv1aHashAdapter(): HashAdapter {
  return {
    hash(data: string): string {
      let h = 2166136261; // FNV-1a offset basis
      for (let i = 0; i < data.length; i++) {
        h ^= data.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0; // FNV prime, keep 32-bit unsigned
      }
      return h.toString(16);
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
