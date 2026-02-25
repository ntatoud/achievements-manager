import { createAchievements } from "achievements-react";
import { localStorageAdapter } from "achievements";

export type AchievementId =
  | "first-visit"
  | "returning"
  | "night-owl"
  | "click-frenzy"
  | "explorer";

export const definitions = [
  {
    id: "first-visit" as const,
    label: "First Contact",
    description: "Initialized session for the first time.",
  },
  {
    id: "returning" as const,
    label: "Persistent Agent",
    description: "Returned for a subsequent session.",
  },
  {
    id: "night-owl" as const,
    label: "Night Protocol",
    description: "Operating between 00:00 and 05:00.",
    hidden: true,
  },
  {
    id: "click-frenzy" as const,
    label: "Input Overflow",
    description: "Registered 50 consecutive inputs.",
    maxProgress: 50,
  },
  {
    id: "explorer" as const,
    label: "Full Traversal",
    description: "Accessed all system modules.",
    maxProgress: 3,
  },
];

export const {
  engine,
  Provider,
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
} = createAchievements<AchievementId>({
  definitions,
  storage: localStorageAdapter("achievements-demo"),
});
