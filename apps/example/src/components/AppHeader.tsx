export function AppHeader() {
  return (
    <header className="mb-14">
      <p className="font-mono text-[11px] tracking-[0.15em] text-accent mb-4">
        achievements · interactive demo
      </p>
      <h1 className="text-[clamp(32px,5vw,52px)] font-light tracking-[-0.04em] text-bright leading-[1.05] mb-4">
        achievement engine
      </h1>
      <p className="text-[15px] text-body leading-[1.7] max-w-[520px]">
        Trigger events below. Achievements unlock in real time and persist across
        sessions via <code className="font-mono text-[0.85em] text-code">localStorage</code>.
      </p>
    </header>
  );
}
