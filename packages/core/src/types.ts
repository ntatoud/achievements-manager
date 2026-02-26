/**
 * Define an array of achievement definitions with full type inference.
 * IDs are inferred as literal types, so you can derive the ID union with:
 *   type AchievementId = typeof definitions[number]["id"]
 */
export function defineAchievements<const T extends ReadonlyArray<AchievementDef<string>>>(
  definitions: T,
): T {
  return definitions;
}

// Achievement definition provided by the consumer
export type AchievementDef<TId extends string> = {
  id: TId;
  label: string;
  description: string;
  /** If true, id/label/description are hidden until unlocked. Default: false */
  hidden?: boolean;
  /** If true, only the description is hidden until unlocked. Default: false */
  hint?: boolean;
  /**
   * When provided, this achievement uses progress tracking.
   * It auto-unlocks when progress reaches this value.
   */
  maxProgress?: number;
};

// Snapshot of the engine state — passed to subscribers
export type AchievementState<TId extends string> = {
  unlockedIds: ReadonlySet<TId>;
  // progress[id] is only present for achievements that have maxProgress
  progress: Readonly<Record<string, number>>;
  // IDs waiting to be shown as a notification; ordered oldest-first
  toastQueue: ReadonlyArray<TId>;
};

// Pluggable storage backend
export type StorageAdapter = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

// Pluggable hash function for tamper detection
export type HashAdapter = {
  hash(data: string): string;
};

// The object returned by createAchievements()
export type AchievementEngine<TId extends string> = {
  // --- Writes ---
  /** Unlock an achievement. No-op if already unlocked. */
  unlock(id: TId): void;
  /** Set progress to an absolute value. Auto-unlocks if value >= maxProgress. */
  setProgress(id: TId, value: number): void;
  /** Increment progress by 1. Auto-unlocks if the new value >= maxProgress. */
  incrementProgress(id: TId): void;
  /**
   * Add a unique string item to this achievement's tracked set.
   * Calls setProgress(id, items.size) after insertion. Idempotent.
   */
  collectItem(id: TId, item: string): void;
  /**
   * Update the maxProgress for an achievement at runtime.
   * Enables auto-unlock when progress reaches the new max.
   */
  setMaxProgress(id: TId, max: number): void;
  /** Remove an ID from the toast queue (call after displaying the notification). */
  dismissToast(id: TId): void;
  /** Wipe all state from memory and storage. */
  reset(): void;

  // --- Reads (synchronous snapshots) ---
  isUnlocked(id: TId): boolean;
  getProgress(id: TId): number;
  /** Return the set of items collected for this achievement via collectItem(). */
  getItems(id: TId): ReadonlySet<string>;
  getUnlocked(): ReadonlySet<TId>;
  getUnlockedCount(): number;
  getState(): AchievementState<TId>;
  getDefinition(id: TId): AchievementDef<TId> | undefined;

  // --- Reactivity ---
  /**
   * Subscribe to state changes. The listener is called after every mutation.
   * Returns an unsubscribe function.
   */
  subscribe(listener: (state: AchievementState<TId>) => void): () => void;
};
