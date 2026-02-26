import { localStorageAdapter } from "./adapters";
import type { AchievementDef, AchievementEngine, AchievementState, StorageAdapter } from "./types";

type Config<TId extends string> = {
  definitions: ReadonlyArray<AchievementDef<TId>>;
  storage?: StorageAdapter;
  /** Called synchronously immediately after an achievement is unlocked. */
  onUnlock?: (id: TId) => void;
};

const STORAGE_KEY_UNLOCKED = "unlocked";
const STORAGE_KEY_PROGRESS = "progress";
const STORAGE_KEY_ITEMS = "items";

export function createAchievements<TId extends string>(
  config: Config<TId>,
): AchievementEngine<TId> {
  const storage = config.storage ?? localStorageAdapter();
  const listeners = new Set<(state: AchievementState<TId>) => void>();

  // --- Initialization ---
  let unlockedIds: Set<TId>;
  let progress: Record<string, number>;
  let items: Record<string, Set<string>>;
  // Runtime-only overrides for maxProgress (not persisted)
  const runtimeMaxProgress: Record<string, number> = {};
  let toastQueue: Array<TId>;

  try {
    const rawUnlocked = storage.get(STORAGE_KEY_UNLOCKED);
    unlockedIds = new Set<TId>(rawUnlocked ? (JSON.parse(rawUnlocked) as TId[]) : []);
  } catch {
    unlockedIds = new Set<TId>();
  }

  try {
    const rawProgress = storage.get(STORAGE_KEY_PROGRESS);
    progress = rawProgress ? (JSON.parse(rawProgress) as Record<string, number>) : {};
  } catch {
    progress = {};
  }

  try {
    const rawItems = storage.get(STORAGE_KEY_ITEMS);
    const parsed = rawItems ? (JSON.parse(rawItems) as Record<string, string[]>) : {};
    items = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, new Set(v)]));
  } catch {
    items = {};
  }

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
    storage.set(STORAGE_KEY_UNLOCKED, JSON.stringify([...unlockedIds]));
  }

  function persistProgress(): void {
    storage.set(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  }

  function persistItems(): void {
    const serializable = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, [...v]]));
    storage.set(STORAGE_KEY_ITEMS, JSON.stringify(serializable));
  }

  // --- Public API ---

  function unlock(id: TId): void {
    if (unlockedIds.has(id)) return;
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
    storage.remove(STORAGE_KEY_UNLOCKED);
    storage.remove(STORAGE_KEY_PROGRESS);
    storage.remove(STORAGE_KEY_ITEMS);
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
