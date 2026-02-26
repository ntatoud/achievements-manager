import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  className?: string;
};

export function ProgressBar({ value, max, className }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return <Progress value={pct} className={cn("h-[3px]", className)} />;
}
