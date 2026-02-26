export { createAchievements } from "./factory";
export { AchievementsProvider } from "./context";
export {
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
  useUnlockedCount,
} from "./hooks";

// Re-export everything from the core package so achievements-react is standalone
export {
  defineAchievements,
  createAchievements as createAchievementsEngine,
  localStorageAdapter,
  inMemoryAdapter,
  fnv1aHashAdapter,
} from "achievements";
export type {
  AchievementDef,
  AchievementState,
  AchievementEngine,
  StorageAdapter,
  HashAdapter,
  AchievementsConfig,
} from "achievements";
