type Props = {
  value: number;
  max: number;
  className?: string;
};

export function ProgressBar({ value, max, className = "" }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className={`h-[3px] bg-well rounded-full overflow-hidden ${className}`}
    >
      <div
        className="prog-fill h-full bg-accent rounded-full transition-[width] duration-100 ease-out relative"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
