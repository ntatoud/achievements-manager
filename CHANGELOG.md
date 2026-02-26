# Changelog

## 0.2.1 (2026-02-26)

### Bug Fixes

- **`useEngineState`** — removed `selector` from the `useEffect` dependency array. Inline selector functions are recreated on every render; having them as a dependency caused the effect to re-run each render, which called `setValue` with a new reference-type value (e.g. the `toastQueue` array), triggering another render — an infinite loop. The selector is now stored in a ref so the effect only re-runs when `engine` changes.
- **`useAchievementToast`** — replaced `engine.dismissToast.bind(engine)` with `engine.dismissToast`. The `bind` call created a new function object on every render, making `dismiss` an unstable `useEffect` dependency in consumers (e.g. `Toast`) and causing the dismiss timer to reset on every render.

## 0.2.0 (2026-02-26)

### Features

- **`collectItem(id, item)`** — adds a string to a persistent `Set<string>` tied to an achievement and calls `setProgress(id, set.size)`. Idempotent: duplicate items are ignored. Items are persisted to storage under the key `"items"` and hydrated on init.
- **`getItems(id)`** — returns a `ReadonlySet<string>` snapshot of collected items for an achievement.
- **`setMaxProgress(id, max)`** — updates the effective `maxProgress` at runtime (in-memory only). Re-evaluates current progress immediately to trigger auto-unlock if the threshold is already met. Enables achievements whose total is only known at runtime (e.g. server-driven counts).
- **`reset()`** now also clears `items` state and removes the `"items"` storage key.

## 0.1.0 (2026-02-25)

### Features

- **`defineAchievements`** utility for declaring typed achievement definitions.
- **`useUnlockedCount`** React hook for tracking the number of unlocked achievements.
- Standalone `achievements-react` package with React 19+ bindings.
- Framework-agnostic `achievements` core library.
- Rolldown-based build pipeline with TypeScript declarations.
