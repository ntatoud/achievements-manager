import { useEngine, useEngineState } from "./context";

/** Returns the full engine for imperative calls (unlock, setProgress, etc.). */
export function useAchievements<TId extends string>() {
  return useEngine<TId>();
}

/** Reactive boolean — re-renders only when this specific achievement changes. */
export function useIsUnlocked<TId extends string>(id: TId): boolean {
  return useEngineState<TId, boolean>((s) => s.unlockedIds.has(id));
}

/**
 * Reactive progress for a single achievement.
 * Returns { progress, max } where max comes from the engine's definitions.
 * Re-renders only when this achievement's progress changes.
 */
export function useProgress<TId extends string>(
  id: TId,
): { progress: number; max: number | undefined } {
  const engine = useEngine<TId>();
  const progress = useEngineState<TId, number>((s) => s.progress[id as string] ?? 0);
  const max = engine.getDefinition(id)?.maxProgress;
  return { progress, max };
}

/** Reactive toast queue + dismiss helper. */
export function useAchievementToast<TId extends string>() {
  const engine = useEngine<TId>();
  const queue = useEngineState<TId, ReadonlyArray<TId>>((s) => s.toastQueue as TId[]);
  return { queue, dismiss: engine.dismissToast.bind(engine) };
}
