import { localStorageAdapter } from "./adapters";
import type {
  AchievementDef,
  AchievementEngine,
  AchievementState,
  StorageAdapter,
} from "./types";

type Config<TId extends string> = {
  definitions: ReadonlyArray<AchievementDef<TId>>;
  storage?: StorageAdapter;
  /** Called synchronously immediately after an achievement is unlocked. */
  onUnlock?: (id: TId) => void;
};

const STORAGE_KEY_UNLOCKED = "unlocked";
const STORAGE_KEY_PROGRESS = "progress";

export function createAchievements<TId extends string>(
  config: Config<TId>,
): AchievementEngine<TId> {
  const storage = config.storage ?? localStorageAdapter();
  const listeners = new Set<(state: AchievementState<TId>) => void>();

  // --- Initialization ---
  let unlockedIds: Set<TId>;
  let progress: Record<string, number>;
  let toastQueue: Array<TId>;

  try {
    const rawUnlocked = storage.get(STORAGE_KEY_UNLOCKED);
    unlockedIds = new Set<TId>(
      rawUnlocked ? (JSON.parse(rawUnlocked) as TId[]) : [],
    );
  } catch {
    unlockedIds = new Set<TId>();
  }

  try {
    const rawProgress = storage.get(STORAGE_KEY_PROGRESS);
    progress = rawProgress
      ? (JSON.parse(rawProgress) as Record<string, number>)
      : {};
  } catch {
    progress = {};
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
    if (def === undefined || def.maxProgress === undefined) return;

    const clamped = Math.max(0, Math.min(value, def.maxProgress));
    progress[id] = clamped;
    persistProgress();

    if (clamped >= def.maxProgress && !unlockedIds.has(id)) {
      // unlock() calls notify() internally, so we return to avoid double-notify
      unlock(id);
      return;
    }

    notify();
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
    toastQueue = [];
    storage.remove(STORAGE_KEY_UNLOCKED);
    storage.remove(STORAGE_KEY_PROGRESS);
    notify();
  }

  function isUnlocked(id: TId): boolean {
    return unlockedIds.has(id);
  }

  function getProgress(id: TId): number {
    return progress[id] ?? 0;
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

  function subscribe(
    listener: (state: AchievementState<TId>) => void,
  ): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    unlock,
    setProgress,
    incrementProgress,
    dismissToast,
    reset,
    isUnlocked,
    getProgress,
    getUnlocked,
    getUnlockedCount,
    getState,
    getDefinition,
    subscribe,
  };
}
