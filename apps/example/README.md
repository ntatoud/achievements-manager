# achievements — example app

An interactive demo that exercises the full `achievements` + `achievements-react` API. Built with Vite, React 19, and Tailwind CSS.

---

## Running the app

From the repo root:

```sh
pnpm install
pnpm dev:example
```

Or from this directory:

```sh
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## What it demonstrates

The app ships seven achievements covering every unlock mechanism in the library:

| Achievement | ID | Mechanism |
|---|---|---|
| First Contact | `first-visit` | `unlock()` on first mount |
| Persistent Agent | `returning` | `unlock()` on subsequent sessions |
| Night Protocol | `night-owl` | `unlock()` conditionally (hour < 5), **hidden** until unlocked |
| Input Overflow | `click-frenzy` | `incrementProgress()` — auto-unlocks at 50 |
| Full Traversal | `explorer` | `incrementProgress()` — auto-unlocks at 3 |
| Network Scanner | `scanner` | `collectItem()` — auto-unlocks at 2 unique items |
| Full Coverage | `full-coverage` | `collectItem()` + `setMaxProgress()` (runtime target) |

### Sections

**01 — Input Overflow**
Click a button 50 times. Each click calls `incrementProgress("click-frenzy")`. A progress bar shows the current count. The button is disabled once the achievement unlocks.

**02 — Full Traversal**
Visit three library module cards. Each visit calls `incrementProgress("explorer")` once (the component tracks visited state locally to stay idempotent).

**03 — Manual Unlock**
Direct calls to `unlock()`. Two buttons simulate conditions that the session-init logic checks automatically (`returning`, `night-owl`).

**04 — Node Scanner**
Scan unique network nodes via `collectItem("scanner", nodeId)`. The same node ID is safe to pass multiple times — `collectItem` is idempotent. Expanding the network calls `setMaxProgress("full-coverage", newCount)` to raise the full-coverage target dynamically.

### Sidebar

Displays all achievements with their lock state, progress bar, and a **Reset** button that calls `engine.reset()` — clears all stored data so the next page load is treated as a fresh session.

### Toast notifications

Every `unlock()` queues the achievement ID in `engine.toastQueue`. The `Toast` component reads the queue via `useAchievementToast()`, displays the front of the queue for 3.2 seconds, then calls `dismiss()`.

### Tamper detection

If you edit `localStorage` directly and reload, the engine detects the hash mismatch and renders `JumpscarePage` instead of the normal UI — a full-screen "integrity breach" screen with a glitch animation and a reload button.

---

## File overview

```
src/
├── achievements.ts          # createAchievements() setup — engine, Provider, hooks
├── App.tsx                  # Root: tamper check → Provider → layout
├── main.tsx                 # React entry point
├── index.css                # Global styles and Tailwind imports
└── components/
    ├── AppHeader.tsx         # Title and description
    ├── Sidebar.tsx           # Achievement list + reset button
    ├── AchievementCard.tsx   # Single achievement card with progress bar
    ├── ProgressBar.tsx       # Reusable progress bar
    ├── ClickFrenzySection.tsx # Section 01
    ├── ExplorerSection.tsx   # Section 02
    ├── ManualSection.tsx     # Section 03
    ├── CollectorSection.tsx  # Section 04 (collectItem + setMaxProgress)
    ├── Toast.tsx             # Toast notification overlay
    └── JumpscarePage.tsx    # Tamper detection screen
```
