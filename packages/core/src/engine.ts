import { fnv1aHashAdapter, localStorageAdapter } from "./adapters";
import type {
  AchievementDef,
  AchievementEngine,
  AchievementState,
  HashAdapter,
  StorageAdapter,
} from "./types";

export type Config<TId extends string> = {
  definitions: ReadonlyArray<AchievementDef<TId>>;
  storage?: StorageAdapter;
  /** Pluggable hash function for tamper detection. Defaults to FNV-1a (32-bit). */
  hash?: HashAdapter;
  /** Called synchronously immediately after an achievement is unlocked. */
  onUnlock?: (id: TId) => void;
  /** Called when stored data fails its integrity check. */
  onTamperDetected?: (key: string) => void;
};

const STORAGE_KEY_UNLOCKED = "unlocked";
const STORAGE_KEY_PROGRESS = "progress";
const STORAGE_KEY_ITEMS = "items";
const HASH_SUFFIX = ":hash";

export function createAchievements<TId extends string>(
  config: Config<TId>,
): AchievementEngine<TId> {
  const storage = config.storage ?? localStorageAdapter();
  const hashAdapter = config.hash ?? fnv1aHashAdapter();
  const listeners = new Set<(state: AchievementState<TId>) => void>();

  // --- Initialization ---
  let unlockedIds: Set<TId>;
  let progress: Record<string, number>;
  let items: Record<string, Set<string>>;
  // Runtime-only overrides for maxProgress (not persisted)
  const runtimeMaxProgress: Record<string, number> = {};
  let toastQueue: Array<TId>;

  // --- Hash helpers ---

  function computeHash(data: string): string {
    return hashAdapter.hash(data);
  }

  /**
   * Returns true if stored data passes integrity check.
   * If no hash is stored (e.g. pre-anti-cheat data), the data is trusted as-is.
   */
  function verifyStoredIntegrity(key: string): boolean {
    const data = storage.get(key);
    const storedHash = storage.get(key + HASH_SUFFIX);
    // No hash stored yet (backward-compatible) — trust the data
    if (storedHash === null) return true;
    // Hash exists but data was removed — something is wrong
    if (data === null) return false;
    return storedHash === computeHash(data);
  }

  function persistData(key: string, value: string): void {
    storage.set(key, value);
    storage.set(key + HASH_SUFFIX, computeHash(value));
  }

  function removeData(key: string): void {
    storage.remove(key);
    storage.remove(key + HASH_SUFFIX);
  }

  // --- Hydration ---

  /**
   * Load a persisted field from storage, verifying its integrity hash.
   * If the hash is present but doesn't match, the data has been tampered with:
   * onTamperDetected is fired, the corrupted entry is wiped, and the fallback
   * value is returned so the engine starts from a clean state.
   */
  function hydrateField<T>(key: string, parse: (raw: string) => T, fallback: T): T {
    try {
      const raw = storage.get(key);
      if (!raw) return fallback;
      if (!verifyStoredIntegrity(key)) {
        config.onTamperDetected?.(key);
        removeData(key);
        return fallback;
      }
      return parse(raw);
    } catch {
      return fallback;
    }
  }

  unlockedIds = hydrateField(
    STORAGE_KEY_UNLOCKED,
    (raw) => new Set<TId>(JSON.parse(raw) as TId[]),
    new Set<TId>(),
  );

  progress = hydrateField(
    STORAGE_KEY_PROGRESS,
    (raw) => JSON.parse(raw) as Record<string, number>,
    {},
  );

  items = hydrateField(
    STORAGE_KEY_ITEMS,
    (raw) => {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, new Set(v)]));
    },
    {},
  );

  toastQueue = [];

  // --- Internal helpers ---

  function getState(): AchievementState<TId> {
    return {
      unlockedIds: new Set(unlockedIds),
      progress: { ...progress },
      toastQueue: toastQueue.slice(),
    };
  }

  function notify(): void {
    const state = getState();
    for (const listener of listeners) listener(state);
  }

  function persistUnlocked(): void {
    persistData(STORAGE_KEY_UNLOCKED, JSON.stringify([...unlockedIds]));
  }

  function persistProgress(): void {
    persistData(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  }

  function persistItems(): void {
    const serializable = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, [...v]]));
    persistData(STORAGE_KEY_ITEMS, JSON.stringify(serializable));
  }

  // --- Public API ---

  function unlock(id: TId): void {
    if (unlockedIds.has(id)) return;

    // Verify stored unlocked data hasn't been tampered with before writing to it
    if (!verifyStoredIntegrity(STORAGE_KEY_UNLOCKED)) {
      config.onTamperDetected?.(STORAGE_KEY_UNLOCKED);
      // persistUnlocked() below will overwrite tampered storage with authoritative in-memory state
    }

    unlockedIds.add(id);
    toastQueue.push(id);
    persistUnlocked();
    config.onUnlock?.(id);
    notify();
  }

  function setProgress(id: TId, value: number): void {
    const def = config.definitions.find((d) => d.id === id);
    if (def === undefined) return;
    const effectiveMax = runtimeMaxProgress[id] ?? def.maxProgress;
    if (effectiveMax === undefined) return;

    const clamped = Math.max(0, Math.min(value, effectiveMax));
    progress[id] = clamped;
    persistProgress();

    if (clamped >= effectiveMax && !unlockedIds.has(id)) {
      // unlock() calls notify() internally, so we return to avoid double-notify
      unlock(id);
      return;
    }

    notify();
  }

  function collectItem(id: TId, item: string): void {
    if (!items[id]) items[id] = new Set();
    const set = items[id];
    const prevSize = set.size;
    set.add(item);
    if (set.size === prevSize) return; // idempotent — item already present
    persistItems();
    setProgress(id, set.size);
  }

  function setMaxProgress(id: TId, max: number): void {
    runtimeMaxProgress[id] = max;
    // Re-evaluate current progress against the new max (triggers auto-unlock if met)
    setProgress(id, getProgress(id));
  }

  function incrementProgress(id: TId): void {
    setProgress(id, getProgress(id) + 1);
  }

  function dismissToast(id: TId): void {
    const idx = toastQueue.indexOf(id);
    if (idx !== -1) toastQueue.splice(idx, 1);
    notify();
  }

  function reset(): void {
    unlockedIds = new Set<TId>();
    progress = {};
    items = {};
    toastQueue = [];
    removeData(STORAGE_KEY_UNLOCKED);
    removeData(STORAGE_KEY_PROGRESS);
    removeData(STORAGE_KEY_ITEMS);
    notify();
  }

  function isUnlocked(id: TId): boolean {
    return unlockedIds.has(id);
  }

  function getProgress(id: TId): number {
    return progress[id] ?? 0;
  }

  function getItems(id: TId): ReadonlySet<string> {
    return new Set(items[id]);
  }

  function getUnlocked(): ReadonlySet<TId> {
    return new Set(unlockedIds);
  }

  function getUnlockedCount(): number {
    return unlockedIds.size;
  }

  function getDefinition(id: TId): AchievementDef<TId> | undefined {
    return config.definitions.find((d) => d.id === id);
  }

  function subscribe(listener: (state: AchievementState<TId>) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    unlock,
    setProgress,
    incrementProgress,
    collectItem,
    setMaxProgress,
    dismissToast,
    reset,
    isUnlocked,
    getProgress,
    getItems,
    getUnlocked,
    getUnlockedCount,
    getState,
    getDefinition,
    subscribe,
  };
}
