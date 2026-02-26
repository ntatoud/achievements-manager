import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createAchievements as coreCreate } from "achievements";
import type { AchievementDef, HashAdapter, StorageAdapter } from "achievements";
import { AchievementsProvider } from "./context";
import {
  useAchievements as useAchievementsHook,
  useIsUnlocked as useIsUnlockedHook,
  useProgress as useProgressHook,
  useAchievementToast as useAchievementToastHook,
  useUnlockedCount as useUnlockedCountHook,
} from "./hooks";

type Config<TId extends string> = {
  definitions: ReadonlyArray<AchievementDef<TId>>;
  storage?: StorageAdapter;
  hash?: HashAdapter;
  onUnlock?: (id: TId) => void;
  /** Called when stored data fails its integrity check. For React consumers, prefer useTamperDetected(). */
  onTamperDetected?: (key: string) => void;
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
  // Buffer the first tamper key so useTamperDetected() works even when tamper is
  // detected at module load time, before any React component has mounted.
  let _tamperKey: string | null = null;
  const _tamperListeners = new Set<(key: string) => void>();

  const engine = coreCreate<TId>({
    ...config,
    onTamperDetected: (key) => {
      _tamperKey = key;
      for (const listener of _tamperListeners) listener(key);
      config.onTamperDetected?.(key);
    },
  });

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

    /** Reactive count of unlocked achievements — re-renders only when the count changes. */
    useUnlockedCount: () => useUnlockedCountHook<TId>(),

    /**
     * Returns the storage key that failed its integrity check, or null if none.
     * Handles both cases transparently:
     *   - Tamper detected at module load (before React mounted) — state is pre-filled
     *   - Tamper detected at runtime — state updates via subscription
     */
    useTamperDetected: (): string | null => {
      const [key, setKey] = useState<string | null>(_tamperKey);
      useEffect(() => {
        // Sync in case tamper happened between render and effect
        if (_tamperKey !== null) setKey(_tamperKey);
        _tamperListeners.add(setKey);
        return () => {
          _tamperListeners.delete(setKey);
        };
      }, []);
      return key;
    },
  };
}
