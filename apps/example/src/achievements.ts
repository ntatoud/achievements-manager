import {
  defineAchievements,
  createAchievements,
  localStorageAdapter,
} from "achievements-react";

export const definitions = defineAchievements([
  {
    id: "first-visit",
    label: "First Contact",
    description: "Initialized session for the first time.",
  },
  {
    id: "returning",
    label: "Persistent Agent",
    description: "Returned for a subsequent session.",
  },
  {
    id: "night-owl",
    label: "Night Protocol",
    description: "Operating between 00:00 and 05:00.",
    hidden: true,
  },
  {
    id: "click-frenzy",
    label: "Input Overflow",
    description: "Registered 50 consecutive inputs.",
    maxProgress: 50,
  },
  {
    id: "explorer",
    label: "Full Traversal",
    description: "Accessed all system modules.",
    maxProgress: 3,
  },
]);

export type AchievementId = (typeof definitions)[number]["id"];

export const {
  engine,
  Provider,
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
  useUnlockedCount,
} = createAchievements<AchievementId>({
  definitions,
  storage: localStorageAdapter("achievements-demo"),
});
