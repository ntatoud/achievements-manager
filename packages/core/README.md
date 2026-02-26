# achievements

Framework-agnostic TypeScript library for tracking achievements in web applications. No runtime dependencies — bring your own storage and optionally your own hash function.

```sh
npm install achievements
```

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
- [Anti-cheat / hash adapters](#anti-cheat--hash-adapters)
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

// Subscribe to changes
engine.subscribe((state) => {
  console.log("unlocked:", [...state.unlockedIds]);
  console.log("progress:", state.progress);
});

// Trigger actions
engine.unlock("first-visit");
engine.incrementProgress("click-frenzy"); // auto-unlocks at 50
```

---

## Defining achievements

Use `defineAchievements` to get literal-type inference on your IDs:

```ts
import { defineAchievements } from "achievements";

export const definitions = defineAchievements([
  { id: "first-visit", label: "First Visit", description: "Open the app." },
  { id: "collector", label: "Collector", description: "Collect 10 items.", maxProgress: 10 },
  { id: "night-owl", label: "Night Owl", description: "Use the app after midnight.", hidden: true },
]);

// Derive the ID union from the definitions array
export type AchievementId = (typeof definitions)[number]["id"];
// => 'first-visit' | 'collector' | 'night-owl'
```

### Achievement definition fields

| Field         | Type      | Required | Description                                                                         |
| ------------- | --------- | -------- | ----------------------------------------------------------------------------------- |
| `id`          | `string`  | Yes      | Unique identifier. Inferred as a literal type.                                      |
| `label`       | `string`  | Yes      | Human-readable name shown in the UI.                                                |
| `description` | `string`  | Yes      | Short description of the unlock condition.                                          |
| `maxProgress` | `number`  | No       | When set, enables progress tracking. Auto-unlocks when progress reaches this value. |
| `hidden`      | `boolean` | No       | Hides the achievement entirely until it is unlocked. Default: `false`.              |
| `hint`        | `boolean` | No       | Hides only the description until unlocked. Default: `false`.                        |

---

## Creating the engine

```ts
import { createAchievements, localStorageAdapter, fnv1aHashAdapter } from "achievements";

const engine = createAchievements({
  definitions, // required
  storage: localStorageAdapter("my-app"), // optional, defaults to localStorage (no prefix)
  hash: fnv1aHashAdapter(), // optional, defaults to FNV-1a
  onUnlock: (id) => {
    console.log(`Achievement unlocked: ${id}`);
  },
  onTamperDetected: (key) => {
    console.warn(`Storage tampered: ${key}`);
  },
});
```

### Config options

| Option             | Type                                 | Default                 | Description                                                                                        |
| ------------------ | ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `definitions`      | `ReadonlyArray<AchievementDef<TId>>` | —                       | Your achievement definitions.                                                                      |
| `storage`          | `StorageAdapter`                     | `localStorageAdapter()` | Pluggable storage backend.                                                                         |
| `hash`             | `HashAdapter`                        | `fnv1aHashAdapter()`    | Pluggable hash function for tamper detection.                                                      |
| `onUnlock`         | `(id: TId) => void`                  | —                       | Called synchronously immediately after an achievement is unlocked.                                 |
| `onTamperDetected` | `(key: string) => void`              | —                       | Called when a storage entry fails its integrity check. The corrupted entry is wiped automatically. |

---

## Engine API

### Writes

#### `unlock(id)`

Unlocks an achievement. No-op if already unlocked. Adds the ID to the toast queue and calls `onUnlock` if configured.

```ts
engine.unlock("first-visit");
```

#### `setProgress(id, value)`

Sets the progress of a progress-based achievement to an absolute value. Clamped to `[0, maxProgress]`. Auto-unlocks when `value >= maxProgress`.

```ts
engine.setProgress("collector", 7);
```

#### `incrementProgress(id)`

Shorthand for `setProgress(id, current + 1)`.

```ts
engine.incrementProgress("collector");
```

#### `collectItem(id, item)`

Adds a unique string to the achievement's tracked item set, then calls `setProgress(id, items.size)`. Idempotent — adding the same item twice is safe and does nothing the second time. Items are persisted to storage.

```ts
engine.collectItem("explorer", "module-core");
engine.collectItem("explorer", "module-core"); // no-op
engine.collectItem("explorer", "module-react"); // progress: 2
```

#### `setMaxProgress(id, max)`

Updates the effective `maxProgress` at runtime (in-memory only, not persisted). Immediately re-evaluates current progress — auto-unlocks if progress already meets the new threshold. Useful when the target count is only known after a data fetch.

```ts
// maxProgress unknown at definition time
engine.setMaxProgress("full-coverage", serverNodeCount);
```

#### `dismissToast(id)`

Removes an ID from the toast notification queue. Call this after your UI has finished displaying the notification.

```ts
engine.dismissToast("first-visit");
```

#### `reset()`

Clears all in-memory state and removes all stored data (unlocked set, progress, items, and their hashes). The engine starts from scratch on the next call.

```ts
engine.reset();
```

---

### Reads

All reads return synchronous snapshots of the current state.

#### `isUnlocked(id)` → `boolean`

```ts
if (engine.isUnlocked("first-visit")) {
  /* … */
}
```

#### `getProgress(id)` → `number`

Returns the current progress value, or `0` if none has been set.

```ts
const p = engine.getProgress("collector"); // e.g. 7
```

#### `getItems(id)` → `ReadonlySet<string>`

Returns the set of items collected for this achievement via `collectItem()`.

```ts
const items = engine.getItems("explorer");
// ReadonlySet { 'module-core', 'module-react' }
```

#### `getUnlocked()` → `ReadonlySet<TId>`

```ts
const unlocked = engine.getUnlocked(); // e.g. Set { 'first-visit', 'collector' }
```

#### `getUnlockedCount()` → `number`

```ts
const n = engine.getUnlockedCount(); // e.g. 2
```

#### `getDefinition(id)` → `AchievementDef<TId> | undefined`

```ts
const def = engine.getDefinition("night-owl");
// { id: 'night-owl', label: 'Night Owl', hidden: true, … }
```

#### `getState()` → `AchievementState<TId>`

Returns a full snapshot of the engine state.

```ts
const { unlockedIds, progress, toastQueue } = engine.getState();
```

---

### Reactivity

#### `subscribe(listener)` → `() => void`

Registers a listener that is called after every mutation. Returns an unsubscribe function.

```ts
const unsubscribe = engine.subscribe((state) => {
  renderAchievementList(state.unlockedIds);
});

// Later:
unsubscribe();
```

---

## Storage adapters

### `localStorageAdapter(prefix?)`

Reads and writes to `window.localStorage`. All keys are optionally namespaced with a prefix to avoid collisions with other libraries.

```ts
import { localStorageAdapter } from "achievements";

// Keys will be stored as "my-app:unlocked", "my-app:progress", etc.
const storage = localStorageAdapter("my-app");
```

SSR-safe — all `window` accesses are guarded.

### `inMemoryAdapter()`

Stores data in a `Map` that lives for the lifetime of the module. Useful for tests or server-side rendering where `localStorage` isn't available.

```ts
import { inMemoryAdapter } from "achievements";

const storage = inMemoryAdapter();
```

### Custom adapters

Implement `StorageAdapter` to plug in any backend (IndexedDB, a server API, etc.):

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

## Anti-cheat / hash adapters

The engine stores a hash alongside every persisted entry. On hydration, the hash is recomputed and compared — if they don't match, `onTamperDetected` is called, the corrupted entry is wiped, and the engine starts clean.

The default hash is **FNV-1a (32-bit)** — fast, synchronous, and sufficient for casual tamper detection in the browser. For stronger guarantees, supply a custom `HashAdapter`:

```ts
import type { HashAdapter } from "achievements";

const myHashAdapter: HashAdapter = {
  hash(data: string): string {
    // Return a deterministic string for the given data
    return myCustomHash(data);
  },
};

const engine = createAchievements({ definitions, hash: myHashAdapter });
```

**Note:** Hashes are computed synchronously and stored as plain strings in `localStorage`, so a determined user can still bypass them. The mechanism is a friction layer, not cryptographic security.

---

## TypeScript types

```ts
import type {
  AchievementDef,
  AchievementState,
  AchievementEngine,
  StorageAdapter,
  HashAdapter,
  AchievementsConfig, // re-exported from achievements-react
} from "achievements";
```

### `AchievementDef<TId>`

The shape of a single achievement definition (see [Defining achievements](#defining-achievements)).

### `AchievementState<TId>`

The snapshot passed to `subscribe` listeners and returned by `getState()`:

```ts
type AchievementState<TId extends string> = {
  unlockedIds: ReadonlySet<TId>;
  progress: Readonly<Record<string, number>>;
  toastQueue: ReadonlyArray<TId>;
};
```

### `AchievementEngine<TId>`

The full engine interface returned by `createAchievements()`. Contains all methods documented above.

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
