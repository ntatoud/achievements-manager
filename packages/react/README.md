# achievements-react

React 19+ bindings for the [`achievements`](https://www.npmjs.com/package/achievements) library. Provides a factory function, a context provider, and a set of fine-grained hooks that only re-render the components that actually need to update.

```sh
npm install achievements-react
# achievements is a peer dependency — it is pulled in automatically
```

**Peer requirements:** React ≥ 19.0.0.

---

## Table of contents

- [The factory pattern](#the-factory-pattern)
- [Provider](#provider)
- [Hooks](#hooks)
  - [useAchievements](#useachievements)
  - [useIsUnlocked](#useisunlocked)
  - [useProgress](#useprogress)
  - [useUnlockedCount](#useunlockedcount)
  - [useAchievementToast](#useachievementtoast)
  - [useTamperDetected](#usetamperdetected)
- [Using the engine directly](#using-the-engine-directly)
- [Using without the factory](#using-without-the-factory)
- [Re-exports from core](#re-exports-from-core)

---

## The factory pattern

The recommended setup is `createAchievements()`, which creates the engine and returns hooks that are already bound to your ID type. You never have to write `useHook<AchievementId>()` again.

```ts
// src/achievements.ts
import { createAchievements, defineAchievements, localStorageAdapter } from "achievements-react";

const definitions = defineAchievements([
  { id: "first-visit", label: "First Visit", description: "Open the app for the first time." },
  { id: "click-frenzy", label: "Click Frenzy", description: "Click 50 times.", maxProgress: 50 },
  { id: "night-owl", label: "Night Owl", description: "Use the app after midnight.", hidden: true },
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
  useTamperDetected,
} = createAchievements<AchievementId>({
  definitions,
  storage: localStorageAdapter("my-app"),
  onUnlock: (id) => console.log("Unlocked:", id),
  onTamperDetected: (key) => console.warn("Tamper detected:", key),
});
```

### `createAchievements` config

All options from the core `createAchievements` are supported:

| Option             | Type                                 | Default                 | Description                                        |
| ------------------ | ------------------------------------ | ----------------------- | -------------------------------------------------- |
| `definitions`      | `ReadonlyArray<AchievementDef<TId>>` | —                       | Achievement definitions.                           |
| `storage`          | `StorageAdapter`                     | `localStorageAdapter()` | Storage backend.                                   |
| `hash`             | `HashAdapter`                        | `fnv1aHashAdapter()`    | Hash function for tamper detection.                |
| `onUnlock`         | `(id: TId) => void`                  | —                       | Called synchronously when an achievement unlocks.  |
| `onTamperDetected` | `(key: string) => void`              | —                       | Called when stored data fails its integrity check. |

---

## Provider

Wrap your application (or the subtree that uses achievements) with the `Provider` returned by `createAchievements`. It requires no props — the engine is already bound.

```tsx
// src/main.tsx
import { Provider } from "./achievements";

createRoot(document.getElementById("root")!).render(
  <Provider>
    <App />
  </Provider>,
);
```

If you prefer a manual setup, `AchievementsProvider` accepts an `engine` prop directly (see [Using without the factory](#using-without-the-factory)).

---

## Hooks

All hooks must be called inside the `Provider`. Each hook subscribes only to the slice of state it needs, so a progress update on achievement A won't re-render a component that only cares about achievement B.

---

### `useAchievements`

Returns the full engine object for imperative calls. Use this to trigger mutations.

```tsx
import { useAchievements } from "./achievements";

function MyButton() {
  const { unlock, incrementProgress, collectItem } = useAchievements();

  return <button onClick={() => unlock("first-visit")}>Start</button>;
}
```

**Available methods on the engine:** `unlock`, `setProgress`, `incrementProgress`, `collectItem`, `setMaxProgress`, `dismissToast`, `reset`, `isUnlocked`, `getProgress`, `getItems`, `getUnlocked`, `getUnlockedCount`, `getState`, `getDefinition`, `subscribe`.

---

### `useIsUnlocked`

Reactive boolean. Re-renders only when _this_ achievement's lock state changes.

```tsx
import { useIsUnlocked } from "./achievements";

function Badge() {
  const unlocked = useIsUnlocked("first-visit");
  return <span>{unlocked ? "✓" : "○"}</span>;
}
```

---

### `useProgress`

Returns the current `progress` and `max` for a progress-based achievement. Re-renders only when _this_ achievement's progress changes.

```tsx
import { useProgress } from "./achievements";

function ClickCounter() {
  const { progress, max } = useProgress("click-frenzy");
  // max comes from the definition's maxProgress field

  return (
    <p>
      {progress} / {max} clicks
    </p>
  );
}
```

| Return field | Type                  | Description                                                                      |
| ------------ | --------------------- | -------------------------------------------------------------------------------- |
| `progress`   | `number`              | Current progress value (0 if not set).                                           |
| `max`        | `number \| undefined` | `maxProgress` from the definition, or `undefined` if not a progress achievement. |

---

### `useUnlockedCount`

Reactive count of unlocked achievements. Re-renders only when the count changes.

```tsx
import { useUnlockedCount } from "./achievements";
import { definitions } from "./achievements";

function Score() {
  const count = useUnlockedCount();
  return (
    <p>
      {count} / {definitions.length} unlocked
    </p>
  );
}
```

---

### `useAchievementToast`

Returns the toast queue and a `dismiss` function. The queue is ordered oldest-first; display `queue[0]` and call `dismiss(queue[0])` when the notification closes.

```tsx
import { useEffect } from "react";
import { useAchievementToast } from "./achievements";
import { engine } from "./achievements";

function Toast() {
  const { queue, dismiss } = useAchievementToast();
  const currentId = queue[0];
  const def = currentId ? engine.getDefinition(currentId) : undefined;

  useEffect(() => {
    if (!currentId) return;
    const timer = setTimeout(() => dismiss(currentId), 3000);
    return () => clearTimeout(timer);
  }, [currentId, dismiss]);

  if (!currentId || !def) return null;

  return (
    <div className="toast">
      <strong>{def.label}</strong>
      <p>{def.description}</p>
      <button onClick={() => dismiss(currentId)}>✕</button>
    </div>
  );
}
```

| Return field | Type                 | Description                                      |
| ------------ | -------------------- | ------------------------------------------------ |
| `queue`      | `ReadonlyArray<TId>` | IDs waiting to be shown, oldest first.           |
| `dismiss`    | `(id: TId) => void`  | Remove an ID from the queue after displaying it. |

---

### `useTamperDetected`

Returns the storage key that failed its integrity check, or `null` if none. Handles detection at both module-load time (before React mounts) and at runtime.

```tsx
import { useTamperDetected, Provider } from "./achievements";

export default function App() {
  const tamperKey = useTamperDetected();

  if (tamperKey !== null) {
    return <div>Storage tampered: {tamperKey}. Please clear your data.</div>;
  }

  return (
    <Provider>
      <Main />
    </Provider>
  );
}
```

**Note:** `useTamperDetected` must be called _outside_ the `Provider` (at the root level, before the provider renders) so that it can catch tampering that is detected during engine initialization at module load time.

---

## Using the engine directly

The `engine` object returned by `createAchievements` is the raw core engine. You can call it outside React — for example, in response to a network event or a keyboard shortcut handler:

```ts
import { engine } from "./achievements";

// Anywhere in your app, no hooks needed
socket.on("level-complete", () => engine.unlock("level-complete"));

// Read synchronously
const isUnlocked = engine.isUnlocked("first-visit");
```

---

## Using without the factory

If you prefer to manage the engine lifecycle yourself, use `AchievementsProvider` and the generic hooks directly:

```tsx
import { createAchievements } from "achievements";
import { AchievementsProvider, useAchievements, useIsUnlocked } from "achievements-react";

const engine = createAchievements({ definitions });

function Root() {
  return (
    <AchievementsProvider engine={engine}>
      <App />
    </AchievementsProvider>
  );
}
```

The generic hooks accept a type parameter in this case:

```tsx
const { unlock } = useAchievements<AchievementId>();
const unlocked = useIsUnlocked<AchievementId>("first-visit");
```

---

## Re-exports from core

`achievements-react` re-exports everything from the `achievements` core package so you only need a single import in most files:

```ts
import {
  // from achievements-react
  createAchievements,
  AchievementsProvider,
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
  useUnlockedCount,

  // re-exported from achievements core
  defineAchievements,
  createAchievements as createAchievementsEngine,
  localStorageAdapter,
  inMemoryAdapter,
  fnv1aHashAdapter,

  // types
  type AchievementDef,
  type AchievementState,
  type AchievementEngine,
  type StorageAdapter,
  type HashAdapter,
  type AchievementsConfig,
} from "achievements-react";
```
