import { useState } from "react";
import { useAchievements, useIsUnlocked, useProgress } from "../achievements";

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
            <button
              key={mod.id}
              className={[
                "p-4 flex flex-col gap-1.5 text-left rounded-xl border transition-all duration-150",
                done || unlocked
                  ? "border-accent-mid bg-accent-dim cursor-default"
                  : "border-edge bg-surface cursor-pointer hover:border-edge-bright hover:bg-well",
              ].join(" ")}
              onClick={() => visit(mod.id)}
              disabled={done || unlocked}
            >
              <span
                className={`font-mono text-[13px] ${done ? "text-accent" : "text-bright"}`}
              >
                {mod.label}
              </span>
              <span className="text-[11px] text-faint leading-snug">{mod.desc}</span>
              <span
                className={`font-mono text-[10px] mt-1 tracking-wide ${
                  done ? "text-accent-mid" : "text-faint"
                }`}
              >
                {done ? "✓ visited" : "→ visit"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-[11px] text-faint tracking-wide">
        {progress} / 3 modules visited
      </p>
    </section>
  );
}
