import { useAchievements, useIsUnlocked } from "../achievements";
import type { AchievementId } from "../achievements";

type TriggerProps = {
  id: AchievementId;
  desc: string;
};

function ManualTrigger({ id, desc }: TriggerProps) {
  const { unlock } = useAchievements();
  const unlocked = useIsUnlocked(id);

  return (
    <button
      className={[
        "grid [grid-template-columns:1fr_auto] [grid-template-rows:auto_auto] gap-x-4 gap-y-0.5",
        "px-5 py-4 text-left rounded-xl border transition-all duration-150 max-w-[480px]",
        unlocked
          ? "border-accent-mid bg-accent-dim cursor-default"
          : "border-edge bg-surface cursor-pointer hover:border-edge-bright hover:bg-well",
      ].join(" ")}
      onClick={() => unlock(id)}
      disabled={unlocked}
    >
      <code
        className={`font-mono text-[12px] col-start-1 row-start-1 ${
          unlocked ? "text-accent" : "text-code"
        }`}
      >
        {id}
      </code>
      <span className="text-[12px] text-faint col-start-1 row-start-2">{desc}</span>
      <span
        className={`font-mono text-[10px] col-start-2 row-span-2 self-center whitespace-nowrap tracking-wide ${
          unlocked ? "text-accent-mid" : "text-faint"
        }`}
      >
        {unlocked ? "✓ unlocked" : "→ trigger"}
      </span>
    </button>
  );
}

export function ManualSection() {
  return (
    <section className="py-10 border-t border-edge">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="font-mono text-[11px] text-faint tracking-widest">03</span>
        <code className="font-mono text-[12px] text-code px-2.5 py-1 bg-well border border-edge rounded">
          unlock(id)
        </code>
      </div>
      <h2 className="text-[22px] font-medium tracking-tight text-bright mb-2">
        Manual Unlock
      </h2>
      <p className="text-[14px] text-body leading-[1.65] mb-6 max-w-[480px]">
        Direct calls to{" "}
        <code className="font-mono text-[0.85em] text-code">unlock()</code>. Session
        conditions are also checked automatically on mount.
      </p>

      <div className="flex flex-col gap-2.5">
        <ManualTrigger id="returning" desc="Simulate a returning visitor" />
        <ManualTrigger
          id="night-owl"
          desc="Simulate midnight conditions (hidden until unlocked)"
        />
      </div>
    </section>
  );
}
