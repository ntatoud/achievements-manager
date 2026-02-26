# Changelog

## 0.3.0 (2026-02-27)

### Features

- **Anti-cheat system** — pluggable `HashAdapter` interface for tamper detection. Pass a `hashAdapter` to `createAchievements` / `createAchievementsFactory` to sign and verify stored state. A built-in `WebCryptoHashAdapter` (HMAC-SHA-256) is provided out of the box. When tamper is detected, `onTamperDetected` fires with the offending key.

### Bug Fixes

- **Anti-cheat item restoration** — when any storage field fails integrity verification, all three keys (`unlocked`, `progress`, `items`) are now wiped atomically after hydration instead of individually. This prevents partial state (e.g. items cleared but stale progress remaining) after a tamper event.

### Docs

- Added comprehensive README for `achievements` (core) and `achievements-react` packages, and the root monorepo.

## 0.2.0 (2026-02-26)

### Features

- **`collectItem(id, item)`** — adds a string to a persistent `Set<string>` tied to an achievement and calls `setProgress(id, set.size)`. Idempotent: duplicate items are ignored. Items are persisted to storage under the key `"items"` and hydrated on init.
- **`getItems(id)`** — returns a `ReadonlySet<string>` snapshot of collected items for an achievement.
- **`setMaxProgress(id, max)`** — updates the effective `maxProgress` at runtime (in-memory only). Re-evaluates current progress immediately to trigger auto-unlock if the threshold is already met. Enables achievements whose total is only known at runtime (e.g. server-driven counts).
- **`reset()`** now also clears `items` state and removes the `"items"` storage key.

### Bug Fixes

- **`useEngineState`** — removed `selector` from the `useEffect` dependency array. Inline selector functions are recreated on every render; having them as a dependency caused the effect to re-run each render, which called `setValue` with a new reference-type value (e.g. the `toastQueue` array), triggering another render — an infinite loop. The selector is now stored in a ref so the effect only re-runs when `engine` changes.
- **`useAchievementToast`** — replaced `engine.dismissToast.bind(engine)` with `engine.dismissToast`. The `bind` call created a new function object on every render, making `dismiss` an unstable `useEffect` dependency in consumers (e.g. `Toast`) and causing the dismiss timer to reset on every render.

## 0.1.0 (2026-02-25)

### Features

- **`defineAchievements`** utility for declaring typed achievement definitions.
- **`useUnlockedCount`** React hook for tracking the number of unlocked achievements.
- Standalone `achievements-react` package with React 19+ bindings.
- Framework-agnostic `achievements` core library.
- Rolldown-based build pipeline with TypeScript declarations.
