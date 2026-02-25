# achievements

A TypeScript achievements tracking library for web applications. It provides a type-safe engine for defining, unlocking, and tracking progress on achievements, with optional React bindings. The library has no runtime dependencies, is generic over achievement ID types, supports swappable storage adapters, and uses an event-driven subscription model.

## Monorepo Structure

```
hong-kong-v2/
├── packages/
│   ├── core/          # "achievements" npm package — pure TS, no React
│   └── react/         # "achievements-react" npm package — React bindings
├── apps/
│   └── example/       # Vite + React 19 + Tailwind v4 demo app
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .oxlintrc.json
└── .oxfmtignore
```

## Installation

```sh
# Core library only
pnpm add achievements

# Core + React bindings
pnpm add achievements achievements-react
```

## Quick Start

### 1. Define your achievements (factory pattern)

```ts
// src/achievements.ts
import { createAchievements } from 'achievements-react'
import { localStorageAdapter } from 'achievements'

export type AchievementId =
  | 'first-visit'
  | 'returning'
  | 'night-owl'
  | 'click-frenzy'
  | 'explorer'

export const {
  engine,
  Provider,
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
} = createAchievements<AchievementId>({
  definitions: [
    { id: 'first-visit', label: 'First Visit', description: 'Open the app for the first time.' },
    { id: 'returning', label: 'Welcome Back', description: 'Return to the app a second time.' },
    { id: 'night-owl', label: 'Night Owl', description: 'Use the app after midnight.', hidden: true },
    { id: 'click-frenzy', label: 'Click Frenzy', description: 'Click 50 times.', maxProgress: 50 },
    { id: 'explorer', label: 'Explorer', description: 'Visit every section.' },
  ],
  storage: localStorageAdapter('my-app'),
})
```

### 2. Wrap your app with the provider

```tsx
// src/App.tsx
import { Provider } from './achievements'

export function App() {
  return (
    <Provider>
      <Router />
    </Provider>
  )
}
```

### 3. Use hooks in components

```tsx
// src/components/SomeComponent.tsx
import { useAchievements, useIsUnlocked, useProgress } from './achievements'

function SomeComponent() {
  const { unlock, incrementProgress } = useAchievements()
  const isNightOwl = useIsUnlocked('night-owl')
  const { progress, max } = useProgress('click-frenzy')

  return (
    <button onClick={() => incrementProgress('click-frenzy')}>
      Clicks: {progress} / {max}
    </button>
  )
}
```

### 4. Render toasts

```tsx
import { useAchievementToast } from './achievements'

function ToastContainer() {
  const { queue, dismiss } = useAchievementToast()

  return (
    <>
      {queue.map((id) => (
        <div key={id}>
          Achievement unlocked: {id}
          <button onClick={() => dismiss(id)}>Dismiss</button>
        </div>
      ))}
    </>
  )
}
```

## API Reference

### `AchievementDef<TId>`

Describes a single achievement.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `TId` | Yes | Unique identifier for the achievement. |
| `label` | `string` | Yes | Display name. |
| `description` | `string` | Yes | Explanatory text shown to the user. |
| `hidden` | `boolean` | No | If `true`, hides all details (label, description) until unlocked. |
| `hint` | `boolean` | No | If `true`, shows the label but hides the description until unlocked. |
| `maxProgress` | `number` | No | When set, the achievement auto-unlocks once progress reaches this value. |

### `AchievementEngine<TId>`

The central engine returned by `createAchievements`.

#### Mutations

| Method | Description |
|---|---|
| `unlock(id)` | Unlock an achievement immediately. No-op if already unlocked. |
| `setProgress(id, value)` | Set the progress counter to a specific value. |
| `incrementProgress(id)` | Increment the progress counter by 1. |
| `dismissToast(id)` | Remove an achievement from the toast queue. |
| `reset()` | Clear all unlocked achievements and progress from storage. |

#### Reads

| Method | Description |
|---|---|
| `isUnlocked(id)` | Returns `true` if the achievement has been unlocked. |
| `getProgress(id)` | Returns the current progress value for an achievement. |
| `getUnlocked()` | Returns a `ReadonlySet<TId>` of all unlocked achievement IDs. |
| `getState()` | Returns the full `AchievementState<TId>` snapshot. |
| `getDefinition(id)` | Returns the `AchievementDef<TId>` for a given ID, or `undefined`. |

#### Subscriptions

| Method | Description |
|---|---|
| `subscribe(listener)` | Register a listener called on every state change. Returns an unsubscribe function. |

### Adapters

Storage adapters implement the `StorageAdapter` interface, which decouples the engine from any specific persistence layer.

#### `localStorageAdapter(prefix?)`

Persists state to `localStorage`. Accepts an optional key prefix string (default: `'achievements'`).

```ts
import { localStorageAdapter } from 'achievements'

const storage = localStorageAdapter('my-app')
```

#### `inMemoryAdapter()`

Stores state in memory only. State is lost on page reload. Useful for testing or server-side environments.

```ts
import { inMemoryAdapter } from 'achievements'

const storage = inMemoryAdapter()
```

### `createAchievements` (core)

```ts
import { createAchievements } from 'achievements'

const engine = createAchievements<AchievementId>({
  definitions: AchievementDef<TId>[],  // required
  storage?: StorageAdapter,            // default: inMemoryAdapter()
  onUnlock?: (id: TId) => void,        // optional side-effect callback
})
```

### React Package (`achievements-react`)

#### `createAchievements` (React factory)

Re-exports a factory that returns pre-typed React primitives bound to a specific engine instance. This is the recommended pattern — it eliminates the need for generic type parameters at every call site.

```ts
import { createAchievements } from 'achievements-react'

const {
  engine,              // AchievementEngine<TId>
  Provider,            // React.FC<{ children: React.ReactNode }> — no engine prop needed
  useAchievements,     // () => AchievementEngine<TId>
  useIsUnlocked,       // (id: TId) => boolean
  useProgress,         // (id: TId) => { progress: number, max: number | undefined }
  useAchievementToast, // () => { queue: ReadonlyArray<TId>, dismiss(id: TId): void }
} = createAchievements<AchievementId>({ definitions, storage })
```

#### `AchievementsProvider` (generic / manual wiring)

Use this if you prefer to manage the engine instance yourself.

```tsx
import { AchievementsProvider } from 'achievements-react'
import { createAchievements } from 'achievements'

const engine = createAchievements<AchievementId>({ definitions, storage })

function App() {
  return <AchievementsProvider engine={engine}><Router /></AchievementsProvider>
}
```

#### Hooks (generic)

When using the manual wiring pattern, hooks accept an explicit type parameter.

| Hook | Signature | Returns |
|---|---|---|
| `useAchievements` | `useAchievements<TId>()` | Full `AchievementEngine<TId>` |
| `useIsUnlocked` | `useIsUnlocked<TId>(id: TId)` | `boolean` — re-renders only when the value changes |
| `useProgress` | `useProgress<TId>(id: TId)` | `{ progress: number, max: number \| undefined }` |
| `useAchievementToast` | `useAchievementToast<TId>()` | `{ queue: ReadonlyArray<TId>, dismiss(id: TId): void }` |

## Design Decisions

The library is intentionally minimal. The following are out of scope:

- **Toast UI** — No built-in toast component. The `useAchievementToast` hook exposes a queue; rendering is left entirely to the application.
- **Icons** — No icon system. Achievement definitions do not include icon fields.
- **Sound** — No audio feedback. Applications can use the `onUnlock` callback or subscribe to the engine to trigger sounds themselves.
- **Server-side validation** — The engine runs entirely client-side. There is no mechanism to verify unlocks against a backend.
- **Session detection** — The library does not track visits or sessions. Unlock logic based on user behavior (e.g., "returning user") must be implemented by the application.
- **Sorting / ordering** — Achievements are returned in definition order. No built-in sorting by unlock date, name, or progress.

## Development

```sh
# Install all workspace dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (vitest, core package)
pnpm test

# Lint packages with oxlint
pnpm lint

# Format packages with oxfmt (write)
pnpm format

# Check formatting without writing (CI)
pnpm format:check

# Start the Vite demo app
pnpm dev:example
```

### Toolchain

| Tool | Purpose |
|---|---|
| pnpm workspaces | Monorepo package management with version catalog |
| TypeScript 5.9 | Type checking and compilation |
| oxlint | Linting |
| oxfmt | Code formatting |
| vitest | Unit tests for the core package |
| Vite + Tailwind v4 | Demo application bundling and styles |
