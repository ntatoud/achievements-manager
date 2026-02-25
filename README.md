# achievements

A TypeScript achievements tracking library for web applications. Type-safe, framework-agnostic core with optional React bindings.

## Packages

- `achievements` — core engine, no React dependency
- `achievements-react` — React provider, hooks, and factory

## Quick start

```ts
// src/achievements.ts
import { createAchievements } from 'achievements-react'
import { localStorageAdapter } from 'achievements'

export const { engine, Provider, useAchievements, useIsUnlocked, useProgress, useAchievementToast } =
  createAchievements<'first-visit' | 'click-frenzy'>({
    definitions: [
      { id: 'first-visit', label: 'First Visit', description: 'Open the app.' },
      { id: 'click-frenzy', label: 'Click Frenzy', description: 'Click 50 times.', maxProgress: 50 },
    ],
    storage: localStorageAdapter('my-app'),
  })
```

```tsx
// Wrap your app
<Provider><App /></Provider>

// Use anywhere
const { unlock, incrementProgress } = useAchievements()
const unlocked = useIsUnlocked('first-visit')
const { progress, max } = useProgress('click-frenzy')
```

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm dev:example
```
