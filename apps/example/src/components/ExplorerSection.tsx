import { useState } from "react";
import { useAchievements, useIsUnlocked, useProgress } from "../achievements";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "core", label: "core", desc: "Engine · types · factory" },
  { id: "adapters", label: "adapters", desc: "localStorage · inMemory" },
  { id: "react", label: "react", desc: "Provider · hooks" },
] as const;

export function ExplorerSection() {
  const { incrementProgress } = useAchievements();
  const { progress } = useProgress("explorer");
  const unlocked = useIsUnlocked("explorer");
  const [visited, setVisited] = useState<Set<string>>(new Set());

  function visit(id: string) {
    if (visited.has(id)) return;
    setVisited((prev) => new Set(prev).add(id));
    incrementProgress("explorer");
  }

  return (
    <section className="py-10 border-t border-edge">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="font-mono text-[11px] text-faint tracking-widest">02</span>
        <code className="font-mono text-[12px] text-code px-2.5 py-1 bg-well border border-edge rounded">
          incrementProgress("explorer")
        </code>
      </div>
      <h2 className="text-[22px] font-medium tracking-tight text-bright mb-2">
        Full Traversal
      </h2>
      <p className="text-[14px] text-body leading-[1.65] mb-6 max-w-[480px]">
        Visit all three library modules to complete the traversal.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {MODULES.map((mod) => {
          const done = visited.has(mod.id);
          return (
            <Button
              key={mod.id}
              variant={done || unlocked ? "accent" : "outline"}
              className={cn(
                "h-auto p-4 flex flex-col items-start gap-1.5",
                !(done || unlocked) && "hover:bg-well"
              )}
              onClick={() => visit(mod.id)}
              disabled={done || unlocked}
            >
              <span className="font-mono text-[13px]">{mod.label}</span>
              <span className="text-[11px] text-faint leading-snug font-normal">
                {mod.desc}
              </span>
              <span
                className={`font-mono text-[10px] mt-1 tracking-wide ${
                  done ? "text-accent-mid" : "text-faint"
                }`}
              >
                {done ? "✓ visited" : "→ visit"}
              </span>
            </Button>
          );
        })}
      </div>

      <p className="font-mono text-[11px] text-faint tracking-wide">
        {progress} / 3 modules visited
      </p>
    </section>
  );
}
