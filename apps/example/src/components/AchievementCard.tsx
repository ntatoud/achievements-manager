import type { AchievementDef } from "achievements";
import { useIsUnlocked, useProgress } from "../achievements";
import type { AchievementId } from "../achievements";
import { ProgressBar } from "./ProgressBar";

type Props = { def: AchievementDef<AchievementId> };

export function AchievementCard({ def }: Props) {
  const unlocked = useIsUnlocked(def.id);
  const { progress, max } = useProgress(def.id);
  const secret = !!def.hidden && !unlocked;

  return (
    <article
      className={[
        "p-3.5 rounded-xl border transition-all duration-300",
        unlocked
          ? "bg-surface border-accent-mid shadow-[0_0_12px_rgba(61,255,176,0.07)]"
          : "bg-surface border-edge",
        secret ? "opacity-55" : "",
      ].join(" ")}
    >
      {/* Top row: glyph · id · badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] ${unlocked ? "text-accent" : "text-faint"}`}>
          {unlocked ? "◆" : secret ? "◇" : "○"}
        </span>
        <code
          className={`flex-1 font-mono text-[11px] truncate ${
            unlocked ? "text-code" : "text-faint"
          }`}
        >
          {secret ? "CLASSIFIED" : def.id}
        </code>
        <span
          className={[
            "font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border whitespace-nowrap",
            unlocked
              ? "bg-accent-dim text-accent border-accent-mid"
              : "bg-well text-faint border-edge",
          ].join(" ")}
        >
          {unlocked ? "UNLOCKED" : "LOCKED"}
        </span>
      </div>

      {/* Label */}
      <h3
        className={`text-[13px] font-semibold tracking-tight mb-1 ${
          unlocked ? "text-[#e8f8f2]" : "text-bright"
        }`}
      >
        {secret ? "???" : def.label}
      </h3>

      {/* Description */}
      <p
        className={`text-[12px] leading-relaxed ${
          secret ? "text-faint italic" : unlocked ? "text-body" : "text-faint"
        }`}
      >
        {secret ? "Condition unknown. Keep exploring." : def.description}
      </p>

      {/* Progress bar */}
      {max !== undefined && !secret && (
        <div className="flex items-center gap-2.5 mt-2.5">
          <ProgressBar value={progress} max={max} className="flex-1" />
          <span className="font-mono text-[10px] text-faint whitespace-nowrap">
            {progress}&thinsp;/&thinsp;{max}
          </span>
        </div>
      )}
    </article>
  );
}
