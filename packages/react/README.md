# achievements-react

> React 19+ bindings for `achievements` — one factory call, fully typed hooks, zero boilerplate.

[![npm](https://img.shields.io/npm/v/achievements-react)](https://www.npmjs.com/package/achievements-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/achievements-react)](https://bundlephobia.com/package/achievements-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-first-3178c6)](https://www.typescriptlang.org/)

```sh
npm install achievements-react
# pnpm add achievements-react
# yarn add achievements-react
# bun add achievements-react
```

**Peer requirements:** React ≥ 19.0.0. The `achievements` core is bundled — no separate install needed.

---

## How it works

Call `createAchievements()` once in a module-level file. It returns a pre-wired `Provider`, an `engine`, and hooks that are already bound to your ID type — no generic annotations needed at the call site.

```ts
// src/achievements.ts
import { createAchievements, defineAchievements, localStorageAdapter } from "achievements-react";

const definitions = defineAchievements([
  { id: "first-visit", label: "First Visit", description: "Open the app." },
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
});
```

```tsx
// src/main.tsx — wrap your app once
import { Provider } from "./achievements";

createRoot(document.getElementById("root")!).render(
  <Provider>
    <App />
  </Provider>,
);
```

```tsx
// src/components/Example.tsx — use anywhere, fully typed
import { useAchievements, useIsUnlocked, useProgress } from "./achievements";

function Example() {
  const { unlock, incrementProgress } = useAchievements();
  const visited = useIsUnlocked("first-visit"); // boolean
  const { progress, max } = useProgress("click-frenzy"); // { progress: number, max: number }

  return (
    <>
      <button onClick={() => unlock("first-visit")}>Visit</button>
      <button onClick={() => incrementProgress("click-frenzy")}>
        Click ({progress}/{max})
      </button>
    </>
  );
}
```

---

## Table of contents

- [createAchievements config](#createachievements-config)
- [Provider](#provider)
- [Hooks](#hooks)
  - [useAchievements](#useachievements)
  - [useIsUnlocked](#useisunlocked)
  - [useProgress](#useprogress)
  - [useUnlockedCount](#useunlockedcount)
  - [useAchievementToast](#useachievementtoast)
  - [useTamperDetected](#usetamperdetected)
- [Using the engine directly](#using-the-engine-directly)
- [Without the factory](#without-the-factory)
- [Re-exports from core](#re-exports-from-core)

---

## `createAchievements` config

| Option             | Type                                 | Default                 | Description                                        |
| ------------------ | ------------------------------------ | ----------------------- | -------------------------------------------------- |
| `definitions`      | `ReadonlyArray<AchievementDef<TId>>` | —                       | Achievement definitions.                           |
| `storage`          | `StorageAdapter`                     | `localStorageAdapter()` | Storage backend.                                   |
| `hash`             | `HashAdapter`                        | `fnv1aHashAdapter()`    | Hash function for tamper detection.                |
| `onUnlock`         | `(id: TId) => void`                  | —                       | Called synchronously when an achievement unlocks.  |
| `onTamperDetected` | `(key: string) => void`              | —                       | Called when stored data fails its integrity check. |

---

## Provider

The `Provider` returned by `createAchievements` is pre-wired to the engine — no props needed.

```tsx
import { Provider } from "./achievements";

export default function RootLayout({ children }) {
  return <Provider>{children}</Provider>;
}
```

If you need direct control over the engine lifecycle, `AchievementsProvider` accepts an explicit `engine` prop — see [Without the factory](#without-the-factory).

---

## Hooks

All hooks must be called inside `Provider`. Each one subscribes only to the slice of state it needs, so a progress change on achievement A won't re-render a component that only watches achievement B.

---

### `useAchievements`

Returns the engine for imperative calls. The source of truth for mutations.

```tsx
import { useAchievements } from "./achievements";

function Controls() {
  const { unlock, incrementProgress, collectItem, reset } = useAchievements();

  return <button onClick={() => unlock("first-visit")}>Trigger</button>;
}
```

All engine methods are available: `unlock`, `setProgress`, `incrementProgress`, `collectItem`, `setMaxProgress`, `dismissToast`, `reset`, `isUnlocked`, `getProgress`, `getItems`, `getUnlocked`, `getUnlockedCount`, `getState`, `getDefinition`, `subscribe`.

---

### `useIsUnlocked`

Reactive boolean. Re-renders only when **this** achievement's lock state changes.

```tsx
import { useIsUnlocked } from "./achievements";

function Badge() {
  const unlocked = useIsUnlocked("first-visit");
  return <span className={unlocked ? "gold" : "grey"}>★</span>;
}
```

---

### `useProgress`

Reactive `{ progress, max }`. Re-renders only when **this** achievement's progress changes.

```tsx
import { useProgress } from "./achievements";

function ProgressBar() {
  const { progress, max } = useProgress("click-frenzy");
  // max is undefined for achievements without maxProgress

  return <progress value={progress} max={max} />;
}
```

| Field      | Type                  | Description                                        |
| ---------- | --------------------- | -------------------------------------------------- |
| `progress` | `number`              | Current progress (0 if unset).                     |
| `max`      | `number \| undefined` | `maxProgress` from the definition, or `undefined`. |

---

### `useUnlockedCount`

Reactive count of unlocked achievements. Re-renders only when the total changes.

```tsx
import { useUnlockedCount } from "./achievements";

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

Returns the toast queue (oldest-first) and a `dismiss` function. Display `queue[0]`, then call `dismiss(queue[0])` once the notification closes.

```tsx
import { useEffect } from "react";
import { useAchievementToast, engine } from "./achievements";

const DISPLAY_MS = 3000;

function Toast() {
  const { queue, dismiss } = useAchievementToast();
  const id = queue[0];
  const def = id ? engine.getDefinition(id) : undefined;

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => dismiss(id), DISPLAY_MS);
    return () => clearTimeout(t);
  }, [id, dismiss]);

  if (!id || !def) return null;

  return (
    <div role="status" className="toast">
      <strong>{def.label}</strong>
      <p>{def.description}</p>
      <button onClick={() => dismiss(id)}>✕</button>
    </div>
  );
}
```

| Field     | Type                 | Description                                      |
| --------- | -------------------- | ------------------------------------------------ |
| `queue`   | `ReadonlyArray<TId>` | IDs waiting to be shown, oldest first.           |
| `dismiss` | `(id: TId) => void`  | Remove an ID from the queue after displaying it. |

---

### `useTamperDetected`

Returns the storage key that failed its integrity check, or `null` if clean. Handles detection both at module-load time (before React mounts) and at runtime.

```tsx
import { useTamperDetected, Provider } from "./achievements";

export default function App() {
  // Must be called OUTSIDE Provider — it catches tamper events
  // that fire during engine init, before any component mounts.
  const tamperKey = useTamperDetected();

  if (tamperKey !== null) {
    return (
      <div>
        <h1>Cheating detected</h1>
        <p>
          Modified key: <code>{tamperKey}</code>
        </p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <Provider>
      <Main />
    </Provider>
  );
}
```

---

## Using the engine directly

The `engine` export is the raw core engine. You can call it anywhere — inside event listeners, WebSocket handlers, or plain utility functions — no hooks required.

```ts
import { engine } from "./achievements";

// Respond to external events
socket.on("level-complete", () => engine.unlock("level-complete"));

// Read synchronously, outside React
const alreadyVisited = engine.isUnlocked("first-visit");
```

---

## Without the factory

If you prefer to manage the engine lifecycle yourself, use `AchievementsProvider` and the unbound hooks directly. You'll need to pass the type parameter manually at each call site.

```tsx
import { createAchievements } from "achievements";
import { AchievementsProvider, useAchievements, useIsUnlocked } from "achievements-react";

const engine = createAchievements<AchievementId>({ definitions });

function Root() {
  return (
    <AchievementsProvider engine={engine}>
      <App />
    </AchievementsProvider>
  );
}

// In components — note the explicit <AchievementId>
const { unlock } = useAchievements<AchievementId>();
const unlocked = useIsUnlocked<AchievementId>("first-visit");
```

---

## Re-exports from core

`achievements-react` re-exports everything from `achievements`, so you rarely need to import from two packages:

```ts
import {
  // Factory & components
  createAchievements,
  AchievementsProvider,

  // Hooks
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
  useUnlockedCount,
  useTamperDetected,

  // Re-exported from core
  defineAchievements,
  localStorageAdapter,
  inMemoryAdapter,
  fnv1aHashAdapter,

  // Types
  type AchievementDef,
  type AchievementState,
  type AchievementEngine,
  type StorageAdapter,
  type HashAdapter,
  type AchievementsConfig,
} from "achievements-react";
```
