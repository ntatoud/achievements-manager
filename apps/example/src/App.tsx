import { useEffect } from "react";
import { engine, Provider, useAchievements } from "./achievements";
import { Sidebar } from "./components/Sidebar";
import { AppHeader } from "./components/AppHeader";
import { ClickFrenzySection } from "./components/ClickFrenzySection";
import { ExplorerSection } from "./components/ExplorerSection";
import { ManualSection } from "./components/ManualSection";
import { Toast } from "./components/Toast";

// ─── Session init (runs once on mount) ───────────────────────────────────────

function SessionInit() {
  const { unlock } = useAchievements();

  useEffect(() => {
    // The engine hydrates from storage on creation, so isUnlocked("first-visit")
    // is already true when the user is returning — no separate key needed.
    const isReturning = engine.isUnlocked("first-visit");

    unlock("first-visit");

    if (isReturning) unlock("returning");
    if (new Date().getHours() < 5) unlock("night-owl");
  }, [unlock]);

  return null;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Layout() {
  return (
    <div className="relative z-10 grid grid-cols-[320px_1fr] h-full overflow-hidden">
      <Sidebar />

      <main className="overflow-y-auto px-14 py-12 [scrollbar-width:thin] [scrollbar-color:var(--color-edge)_transparent]">
        <AppHeader />
        <ClickFrenzySection />
        <ExplorerSection />
        <ManualSection />
      </main>

      <Toast />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Provider>
      <SessionInit />
      <Layout />
    </Provider>
  );
}
