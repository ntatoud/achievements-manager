# achievements

A TypeScript achievement tracking library for web applications. Type-safe and framework-agnostic at the core, with optional React bindings that make integration a one-liner.

- **[`achievements`](./packages/core)** — core engine with no framework dependency
- **[`achievements-react`](./packages/react)** — React provider, hooks, and factory built on top of the core

---

## Table of contents

- [Overview](#overview)
- [Packages](#packages)
- [Quick start](#quick-start)
- [Repository structure](#repository-structure)
- [Development](#development)
- [Releasing](#releasing)

---

## Overview

The library revolves around an **engine** that you configure once with your achievement definitions, then drive from anywhere in your application:

```
define achievements → create engine → call unlock / setProgress / collectItem → React re-renders automatically
```

Key features:

- **Type-safe IDs** — the engine is generic over your literal ID union; passing a typo is a compile error.
- **Progress tracking** — achievements with a `maxProgress` auto-unlock when progress reaches the threshold.
- **Item collection** — idempotent `collectItem()` builds a persistent `Set`; progress mirrors its size.
- **Anti-cheat** — stored data is integrity-checked via a pluggable hash adapter (FNV-1a by default).
- **Pluggable storage** — `localStorage`, in-memory, or any adapter you write.
- **Toast queue** — the engine queues newly unlocked IDs so your UI can pop notifications one at a time.

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`achievements`](./packages/core) | 0.2.0 | Framework-agnostic core engine |
| [`achievements-react`](./packages/react) | 0.2.0 | React 19+ bindings and factory |

---

## Quick start

### With React (recommended)

```sh
npm install achievements-react
# achievements is a peer dependency and is pulled in automatically
```

```ts
// src/achievements.ts
import { createAchievements, localStorageAdapter } from 'achievements-react'

export const {
  engine,
  Provider,
  useAchievements,
  useIsUnlocked,
  useProgress,
  useAchievementToast,
  useUnlockedCount,
} = createAchievements({
  definitions: [
    { id: 'first-visit', label: 'First Visit', description: 'Open the app for the first time.' },
    { id: 'click-frenzy', label: 'Click Frenzy', description: 'Click 50 times.', maxProgress: 50 },
  ],
  storage: localStorageAdapter('my-app'),
})
```

```tsx
// src/main.tsx
import { Provider } from './achievements'

createRoot(document.getElementById('root')!).render(
  <Provider>
    <App />
  </Provider>
)
```

```tsx
// src/components/MyComponent.tsx
import { useAchievements, useIsUnlocked, useProgress } from './achievements'

function MyComponent() {
  const { unlock, incrementProgress } = useAchievements()
  const visited = useIsUnlocked('first-visit')
  const { progress, max } = useProgress('click-frenzy')

  return (
    <>
      <button onClick={() => unlock('first-visit')}>Visit</button>
      <button onClick={() => incrementProgress('click-frenzy')}>
        Click ({progress}/{max})
      </button>
    </>
  )
}
```

### Without React (vanilla / Node)

```sh
npm install achievements
```

```ts
import { createAchievements, localStorageAdapter } from 'achievements'

const engine = createAchievements({
  definitions: [
    { id: 'first-visit', label: 'First Visit', description: 'Open the app.' },
  ],
  storage: localStorageAdapter('my-app'),
})

engine.subscribe((state) => console.log('unlocked:', [...state.unlockedIds]))
engine.unlock('first-visit')
```

---

## Repository structure

```
.
├── packages/
│   ├── core/           # `achievements` npm package
│   └── react/          # `achievements-react` npm package
├── apps/
│   └── example/        # Interactive Vite + React demo app
├── pnpm-workspace.yaml
└── package.json
```

---

## Development

This repo uses [pnpm](https://pnpm.io/) workspaces.

```sh
pnpm install        # install all dependencies
pnpm build          # build all packages
pnpm test           # run all tests
pnpm typecheck      # type-check all packages
pnpm lint           # lint with oxlint
pnpm format         # format with oxfmt
pnpm dev:example    # start the interactive demo app
```

---

## Releasing

Versions are managed per-package. The release scripts build all packages before publishing.

```sh
pnpm release:patch   # bump patch, build, publish
pnpm release:minor   # bump minor, build, publish
pnpm release:major   # bump major, build, publish
```
