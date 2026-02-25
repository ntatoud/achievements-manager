import type { ReactNode } from "react";
import { createAchievements as coreCreate } from "achievements";
import type { AchievementDef, StorageAdapter } from "achievements";
import { AchievementsProvider } from "./context";
import {
  useAchievements as useAchievementsHook,
  useIsUnlocked as useIsUnlockedHook,
  useProgress as useProgressHook,
  useAchievementToast as useAchievementToastHook,
} from "./hooks";

type Config<TId extends string> = {
  definitions: Array<AchievementDef<TId>>;
  storage?: StorageAdapter;
  onUnlock?: (id: TId) => void;
};

/**
 * Factory that creates the engine and returns hooks already bound to TId.
 * Consumers never need to write useHook<AchievementId>() again.
 *
 * @example
 * // achievements.ts
 * export const { engine, Provider, useAchievements, useIsUnlocked } =
 *   createAchievements({ definitions, storage: localStorageAdapter('app') })
 *
 * // Component.tsx
 * import { useIsUnlocked } from './achievements'
 * const unlocked = useIsUnlocked('night-owl') // fully typed, no <T> needed
 */
export function createAchievements<TId extends string>(config: Config<TId>) {
  const engine = coreCreate<TId>(config);

  function Provider({ children }: { children: ReactNode }) {
    return <AchievementsProvider engine={engine}>{children}</AchievementsProvider>;
  }

  return {
    engine,

    /** Drop-in provider — no `engine` prop needed; the engine is already bound. */
    Provider,

    /** Returns the engine for imperative calls (unlock, setProgress, …). */
    useAchievements: () => useAchievementsHook<TId>(),

    /** Reactive boolean — re-renders only when this achievement's lock state changes. */
    useIsUnlocked: (id: TId) => useIsUnlockedHook<TId>(id),

    /** Reactive `{ progress, max }` — re-renders only when this achievement's progress changes. */
    useProgress: (id: TId) => useProgressHook<TId>(id),

    /** Reactive `{ queue, dismiss }` for toast notifications. */
    useAchievementToast: () => useAchievementToastHook<TId>(),
  };
}
