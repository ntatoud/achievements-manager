# achievements

> Framework-agnostic achievement tracking with zero runtime dependencies.

[![npm](https://img.shields.io/npm/v/achievements)](https://www.npmjs.com/package/achievements)
[![bundle size](https://img.shields.io/bundlephobia/minzip/achievements)](https://bundlephobia.com/package/achievements)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-first-3178c6)](https://www.typescriptlang.org/)

```sh
npm install achievements
# pnpm add achievements
# yarn add achievements
# bun add achievements
```

The engine is a plain TypeScript object — no framework, no context, no magic. You configure it once with your definitions and call methods like `unlock()`, `setProgress()`, or `collectItem()` from wherever it makes sense in your app. Persistence, progress tracking, anti-cheat, and toast queuing are all handled internally.

**Looking for React bindings?** See [`achievements-react`](../react/README.md).

---

## Table of contents

- [Quick start](#quick-start)
- [Defining achievements](#defining-achievements)
- [Creating the engine](#creating-the-engine)
- [Engine API](#engine-api)
  - [Writes](#writes)
  - [Reads](#reads)
  - [Reactivity](#reactivity)
- [Storage adapters](#storage-adapters)
- [Anti-cheat & hash adapters](#anti-cheat--hash-adapters)
- [TypeScript types](#typescript-types)

---

## Quick start

```ts
import { createAchievements, localStorageAdapter } from "achievements";

const engine = createAchievements({
  definitions: [
    { id: "first-visit", label: "First Visit", description: "Open the app." },
    { id: "click-frenzy", label: "Click Frenzy", description: "Click 50 times.", maxProgress: 50 },
  ],
  storage: localStorageAdapter("my-app"),
});

engine.subscribe((state) => {
  console.log("unlocked:", [...state.unlockedIds]);
});

engine.unlock("first-visit");
engine.incrementProgress("click-frenzy"); // auto-unlocks at 50
```

---

## Defining achievements

Use `defineAchievements` to get **literal-type inference** on your IDs — the ID union is derived directly from your data, no manual type annotation needed.

```ts
import { defineAchievements } from "achievements";

export const definitions = defineAchievements([
  { id: "first-visit", label: "First Visit", description: "Open the app." },
  { id: "collector", label: "Collector", description: "Collect 10 items.", maxProgress: 10 },
  { id: "night-owl", label: "Night Owl", description: "Use the app after midnight.", hidden: true },
]);

// Free type, zero boilerplate
export type AchievementId = (typeof definitions)[number]["id"];
// => 'first-visit' | 'collector' | 'night-owl'
```

### Definition fields

| Field         | Type      | Description                                                               |
| ------------- | --------- | ------------------------------------------------------------------------- |
| `id`          | `string`  | **Required.** Unique identifier, inferred as a literal type.              |
| `label`       | `string`  | **Required.** Human-readable name for display.                            |
| `description` | `string`  | **Required.** Short description of the unlock condition.                  |
| `maxProgress` | `number`  | Enables progress tracking. Auto-unlocks when progress reaches this value. |
| `hidden`      | `boolean` | Hides the achievement entirely until unlocked. Default: `false`.          |
| `hint`        | `boolean` | Hides only the description until unlocked. Default: `false`.              |

---

## Creating the engine

```ts
import { createAchievements, localStorageAdapter, fnv1aHashAdapter } from "achievements";

const engine = createAchievements({
  definitions,
  storage: localStorageAdapter("my-app"), // optional, default: localStorage (no prefix)
  hash: fnv1aHashAdapter(), // optional, default: FNV-1a (32-bit)
  onUnlock: (id) => console.log("Unlocked:", id),
  onTamperDetected: (key) => console.warn("Tamper detected:", key),
});
```

### Config

| Option             | Type                                 | Default                 | Description                                                                          |
| ------------------ | ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------ |
| `definitions`      | `ReadonlyArray<AchievementDef<TId>>` | —                       | Your achievement definitions.                                                        |
| `storage`          | `StorageAdapter`                     | `localStorageAdapter()` | Pluggable storage backend.                                                           |
| `hash`             | `HashAdapter`                        | `fnv1aHashAdapter()`    | Hash function for tamper detection.                                                  |
| `onUnlock`         | `(id: TId) => void`                  | —                       | Called synchronously when an achievement unlocks.                                    |
| `onTamperDetected` | `(key: string) => void`              | —                       | Called when stored data fails its integrity check. The entry is wiped automatically. |

---

## Engine API

### Writes

#### `unlock(id)`

Unlocks an achievement. No-op if already unlocked. Adds the ID to the toast queue and fires `onUnlock`.

```ts
engine.unlock("first-visit");
```

---

#### `setProgress(id, value)`

Sets progress to an absolute value. Clamped to `[0, maxProgress]`. Auto-unlocks when `value >= maxProgress`.

```ts
engine.setProgress("collector", 7);
```

---

#### `incrementProgress(id)`

Shorthand for `setProgress(id, current + 1)`.

```ts
engine.incrementProgress("collector");
```

---

#### `collectItem(id, item)`

Adds a unique string to the achievement's item set, then calls `setProgress(id, items.size)`. **Idempotent** — the same item can be passed multiple times safely.

```ts
engine.collectItem("explorer", "module-core");
engine.collectItem("explorer", "module-core"); // no-op
engine.collectItem("explorer", "module-react"); // progress: 2
```

---

#### `setMaxProgress(id, max)`

Updates `maxProgress` at runtime (in-memory only, not persisted). Immediately re-evaluates current progress and auto-unlocks if the threshold is already met. Useful when the target is only known after a data fetch.

```ts
// The definition has no maxProgress — we set it once we know the server count
engine.setMaxProgress("full-coverage", serverNodeCount);
```

---

#### `dismissToast(id)`

Removes an ID from the toast queue. Call this after your UI has finished showing the notification.

```ts
engine.dismissToast("first-visit");
```

---

#### `reset()`

Wipes all in-memory state and removes all stored entries (unlocked set, progress, items, and their integrity hashes).

```ts
engine.reset();
```

---

### Reads

All reads return **synchronous snapshots** of the current state.

| Method               | Returns                            | Description                                           |
| -------------------- | ---------------------------------- | ----------------------------------------------------- |
| `isUnlocked(id)`     | `boolean`                          | Whether the achievement is unlocked.                  |
| `getProgress(id)`    | `number`                           | Current progress, or `0` if unset.                    |
| `getItems(id)`       | `ReadonlySet<string>`              | Items collected via `collectItem()`.                  |
| `getUnlocked()`      | `ReadonlySet<TId>`                 | All currently unlocked IDs.                           |
| `getUnlockedCount()` | `number`                           | Count of unlocked achievements.                       |
| `getDefinition(id)`  | `AchievementDef<TId> \| undefined` | The original definition object.                       |
| `getState()`         | `AchievementState<TId>`            | Full state snapshot (unlocked, progress, toastQueue). |

```ts
if (engine.isUnlocked("first-visit")) {
  /* … */
}

const { unlockedIds, progress, toastQueue } = engine.getState();
```

---

### Reactivity

#### `subscribe(listener)` → `() => void`

Registers a listener called after every mutation. Returns an unsubscribe function.

```ts
const unsubscribe = engine.subscribe((state) => {
  renderAchievementList(state.unlockedIds);
});

// Later, to stop listening:
unsubscribe();
```

---

## Storage adapters

### `localStorageAdapter(prefix?)`

Reads and writes `window.localStorage`. Keys are namespaced with an optional prefix to avoid collisions.

```ts
import { localStorageAdapter } from "achievements";

// Stored as "my-app:unlocked", "my-app:progress", …
const storage = localStorageAdapter("my-app");
```

SSR-safe — all `window` accesses are guarded.

---

### `inMemoryAdapter()`

Stores data in a `Map` for the lifetime of the module. Great for tests or environments without `localStorage`.

```ts
import { inMemoryAdapter } from "achievements";

const storage = inMemoryAdapter();
```

---

### Custom adapter

Implement `StorageAdapter` to plug in any backend — IndexedDB, a REST API, AsyncStorage, etc.

```ts
import type { StorageAdapter } from "achievements";

const myAdapter: StorageAdapter = {
  get(key) {
    return myStore.read(key);
  },
  set(key, value) {
    myStore.write(key, value);
  },
  remove(key) {
    myStore.delete(key);
  },
};
```

---

## Anti-cheat & hash adapters

Every persisted entry is stored alongside an integrity hash. On hydration the hash is recomputed — if it doesn't match, `onTamperDetected` fires, the entry is wiped, and the engine starts from a clean slate.

The default algorithm is **FNV-1a (32-bit)**: fast, synchronous, zero dependencies. To use a stronger function, pass a custom `HashAdapter`:

```ts
import type { HashAdapter } from "achievements";

const myHashAdapter: HashAdapter = {
  hash(data: string): string {
    return myCustomHash(data); // must be synchronous and deterministic
  },
};

const engine = createAchievements({ definitions, hash: myHashAdapter });
```

> **Note:** Hashes live in `localStorage` as plain strings, so a determined user can still forge them. This is a friction layer, not cryptographic security.

---

## TypeScript types

```ts
import type {
  AchievementDef,
  AchievementState,
  AchievementEngine,
  StorageAdapter,
  HashAdapter,
} from "achievements";
```

### `AchievementDef<TId>`

The shape of a single definition object (see [Definition fields](#definition-fields)).

### `AchievementState<TId>`

The snapshot passed to subscribers and returned by `getState()`:

```ts
type AchievementState<TId extends string> = {
  unlockedIds: ReadonlySet<TId>;
  progress: Readonly<Record<string, number>>;
  toastQueue: ReadonlyArray<TId>;
};
```

### `AchievementEngine<TId>`

The full engine interface returned by `createAchievements()`. All methods are documented above.

### `StorageAdapter`

```ts
type StorageAdapter = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};
```

### `HashAdapter`

```ts
type HashAdapter = {
  hash(data: string): string;
};
```
