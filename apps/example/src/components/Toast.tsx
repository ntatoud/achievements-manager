import { useEffect, useState } from "react";
import { engine, useAchievementToast } from "../achievements";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

const DISPLAY_MS = 3200;
const FADE_MS = 400;

export function Toast() {
  const { queue, dismiss } = useAchievementToast();
  const [visible, setVisible] = useState(false);

  const currentId = queue[0];
  const def = currentId ? engine.getDefinition(currentId) : undefined;

  useEffect(() => {
    if (!currentId) return;
    setVisible(true);

    const fadeOut = setTimeout(() => setVisible(false), DISPLAY_MS);
    const remove = setTimeout(() => dismiss(currentId), DISPLAY_MS + FADE_MS);

    return () => {
      clearTimeout(fadeOut);
      clearTimeout(remove);
    };
  }, [currentId, dismiss]);

  function close() {
    setVisible(false);
    if (currentId) setTimeout(() => dismiss(currentId), FADE_MS);
  }

  if (!currentId || !def) return null;

  return (
    <Card
      className={[
        "fixed bottom-7 right-7 w-[300px] z-50 p-4",
        "border-accent-mid",
        "shadow-[0_0_0_1px_rgba(61,255,176,0.08),0_24px_48px_rgba(0,0,0,0.5),0_0_32px_rgba(61,255,176,0.06)]",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-3 scale-[0.97]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-widest text-accent">
          // achievement unlocked
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 rounded text-[12px] border-transparent"
          onClick={close}
        >
          ✕
        </Button>
      </div>

      <div className="text-[15px] font-semibold tracking-tight text-bright mb-1">
        {def.label}
      </div>
      <div className="text-[12px] leading-relaxed text-body">{def.description}</div>
    </Card>
  );
}
