import { useAchievements, useUnlockedCount, definitions } from "../achievements";
import { AchievementCard } from "./AchievementCard";

export function Sidebar() {
  const { reset } = useAchievements();
  const count = useUnlockedCount();

  return (
    <aside className="relative z-10 flex flex-col border-r border-edge overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-edge shrink-0">
        <span className="font-mono text-[11px] tracking-[0.2em] text-accent">
          ACHIEVEMENTS
        </span>
        <span className="font-mono text-[11px] text-faint">
          {count}&thinsp;/&thinsp;{definitions.length}
        </span>
      </header>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 [scrollbar-width:thin] [scrollbar-color:var(--color-edge)_transparent]">
        {definitions.map((def) => (
          <AchievementCard
            key={def.id}
            def={def}
          />
        ))}
      </div>

      {/* Reset — engine.reset() clears all storage, so the next page load
          will see first-visit as not unlocked, correctly treating it as a new session. */}
      <button
        className="shrink-0 m-3 px-4 py-2.5 bg-transparent border border-edge rounded text-faint font-mono text-[12px] tracking-wide cursor-pointer transition-colors hover:border-edge-bright hover:text-body"
        onClick={reset}
      >
        ⟳&ensp;reset all
      </button>
    </aside>
  );
}
