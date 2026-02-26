import type { AchievementDef } from "achievements";
import { useIsUnlocked, useProgress } from "../achievements";
import type { AchievementId } from "../achievements";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

type Props = { def: AchievementDef<AchievementId> };

export function AchievementCard({ def }: Props) {
  const unlocked = useIsUnlocked(def.id);
  const { progress, max } = useProgress(def.id);
  const secret = !!def.hidden && !unlocked;

  return (
    <Card
      className={cn(
        "p-3.5 transition-all duration-300",
        unlocked
          ? "border-accent-mid shadow-[0_0_12px_rgba(61,255,176,0.07)]"
          : "border-edge",
        secret && "opacity-55"
      )}
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
        <Badge variant={unlocked ? "unlocked" : "default"}>
          {unlocked ? "UNLOCKED" : "LOCKED"}
        </Badge>
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
          <Progress value={(progress / max) * 100} className="flex-1 h-[3px]" />
          <span className="font-mono text-[10px] text-faint whitespace-nowrap">
            {progress}&thinsp;/&thinsp;{max}
          </span>
        </div>
      )}
    </Card>
  );
}
