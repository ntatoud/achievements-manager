# achievements

> Type-safe achievement tracking for web apps — tiny core, optional React bindings.

[![npm](https://img.shields.io/npm/v/achievements?label=achievements)](https://www.npmjs.com/package/achievements)
[![npm](https://img.shields.io/npm/v/achievements-react?label=achievements-react)](https://www.npmjs.com/package/achievements-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-first-3178c6)](https://www.typescriptlang.org/)

---

**achievements** is a small, framework-agnostic library for adding achievements to any web application. You define your achievements once; the engine handles persistence, progress, auto-unlock, and notifications.

- **Zero runtime dependencies** — the core ships nothing but your own code
- **Type-safe IDs** — your ID union is inferred from definitions; typos are compile errors
- **Auto-unlock** — progress-based achievements unlock themselves when the threshold is reached
- **Anti-cheat** — stored data is integrity-checked on every load (FNV-1a by default, pluggable)
- **Tamper response** — know immediately when localStorage has been edited
- **Pluggable** — swap storage (localStorage, in-memory, your own) and hash adapters at will
- **React-ready** — fine-grained hooks that only re-render the components that need to

---

## Packages

| Package | Description | Docs |
|---|---|---|
| [`achievements`](./packages/core) | Framework-agnostic core engine | [README →](./packages/core/README.md) |
| [`achievements-react`](./packages/react) | React 19+ provider, hooks, factory | [README →](./packages/react/README.md) |

> **Which one do I need?**
> If you're in a React app, install `achievements-react` — it includes the core. If you're working outside React (vanilla JS, a server, Svelte, Vue, …) install `achievements` directly.

---

## Quick start

```sh
# React
npm install achievements-react

# Vanilla / framework-agnostic
npm install achievements
```

### React

```ts
// src/achievements.ts
import { createAchievements, defineAchievements, localStorageAdapter } from 'achievements-react'

const definitions = defineAchievements([
  { id: 'first-visit',  label: 'First Visit',  description: 'Open the app.'     },
  { id: 'click-frenzy', label: 'Click Frenzy', description: 'Click 50 times.',
    maxProgress: 50 },
])

export type AchievementId = typeof definitions[number]['id']

export const { engine, Provider, useAchievements, useIsUnlocked, useProgress } =
  createAchievements<AchievementId>({
    definitions,
    storage: localStorageAdapter('my-app'),
  })
```

```tsx
// Wrap your app once
<Provider><App /></Provider>

// Use anywhere — fully typed, no <T> needed
const { unlock, incrementProgress } = useAchievements()
const visited = useIsUnlocked('first-visit')
const { progress, max } = useProgress('click-frenzy')
```

### Vanilla / framework-agnostic

```ts
import { createAchievements, localStorageAdapter } from 'achievements'

const engine = createAchievements({
  definitions: [
    { id: 'first-visit', label: 'First Visit', description: 'Open the app.' },
  ],
  storage: localStorageAdapter('my-app'),
  onUnlock: (id) => showNotification(id),
})

engine.unlock('first-visit')
engine.subscribe((state) => render(state))
```

---

## Repository structure

```
.
├── packages/
│   ├── core/          # `achievements` — zero-dependency engine
│   └── react/         # `achievements-react` — React 19+ bindings
├── apps/
│   └── example/       # Interactive Vite + React demo
├── pnpm-workspace.yaml
└── package.json
```

---

## Development

```sh
pnpm install        # install all dependencies
pnpm build          # build all packages
pnpm test           # run all tests
pnpm typecheck      # type-check all packages
pnpm lint           # lint with oxlint
pnpm format         # format with oxfmt
pnpm dev:example    # start the interactive demo at localhost:5173
```

## Releasing

```sh
pnpm release:patch   # bump patch, build, publish
pnpm release:minor   # bump minor, build, publish
pnpm release:major   # bump major, build, publish
```
