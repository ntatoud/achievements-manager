import { useAchievements, useUnlockedCount, definitions } from "../achievements";
import { AchievementCard } from "./AchievementCard";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

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
      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-2">
          {definitions.map((def) => (
            <AchievementCard key={def.id} def={def} />
          ))}
        </div>
      </ScrollArea>

      {/* Reset — engine.reset() clears all storage, so the next page load
          will see first-visit as not unlocked, correctly treating it as a new session. */}
      <div className="shrink-0 m-3">
        <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
          ⟳&ensp;reset all
        </Button>
      </div>
    </aside>
  );
}
