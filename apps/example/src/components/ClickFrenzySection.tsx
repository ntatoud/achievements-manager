import { useAchievements, useIsUnlocked, useProgress } from "../achievements";
import { ProgressBar } from "./ProgressBar";

export function ClickFrenzySection() {
  const { incrementProgress } = useAchievements();
  const { progress, max = 50 } = useProgress("click-frenzy");
  const unlocked = useIsUnlocked("click-frenzy");

  return (
    <section className="py-10 border-t border-edge">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="font-mono text-[11px] text-faint tracking-widest">01</span>
        <code className="font-mono text-[12px] text-code px-2.5 py-1 bg-well border border-edge rounded">
          incrementProgress("click-frenzy")
        </code>
      </div>
      <h2 className="text-[22px] font-medium tracking-tight text-bright mb-2">
        Input Overflow
      </h2>
      <p className="text-[14px] text-body leading-[1.65] mb-6 max-w-[480px]">
        Click 50 times to trigger auto-unlock via progress tracking.
      </p>

      <div className="flex items-center gap-5 flex-wrap">
        <button
          className={[
            "min-w-[120px] px-7 py-3.5 flex flex-col items-center gap-1",
            "bg-well border rounded-xl transition-all duration-150",
            unlocked
              ? "border-accent-mid bg-accent-dim cursor-default"
              : "border-edge-bright cursor-pointer hover:border-accent-mid hover:bg-accent-dim active:scale-95",
          ].join(" ")}
          onClick={() => incrementProgress("click-frenzy")}
          disabled={unlocked}
        >
          <span
            className={`font-mono text-[14px] tracking-[0.12em] ${
              unlocked ? "text-accent" : "text-bright"
            }`}
          >
            {unlocked ? "COMPLETE" : "CLICK"}
          </span>
          <span className="font-mono text-[11px] text-faint">
            {progress}&thinsp;/&thinsp;{max}
          </span>
        </button>

        <ProgressBar value={progress} max={max} className="flex-1 min-w-[160px] h-1!" />
      </div>
    </section>
  );
}
