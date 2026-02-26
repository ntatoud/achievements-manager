import { useAchievements, useIsUnlocked, useProgress } from "../achievements";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";

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
        <Button
          variant={unlocked ? "accent" : "outline"}
          size="lg"
          className="min-w-[120px] flex-col gap-1 h-auto py-3.5"
          onClick={() => incrementProgress("click-frenzy")}
          disabled={unlocked}
        >
          <span className="tracking-[0.12em]">
            {unlocked ? "COMPLETE" : "CLICK"}
          </span>
          <span className="text-[11px] font-normal opacity-70">
            {progress}&thinsp;/&thinsp;{max}
          </span>
        </Button>

        <Progress value={(progress / max) * 100} className="flex-1 min-w-[160px] h-1!" />
      </div>
    </section>
  );
}
