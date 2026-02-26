import { useEffect, useState } from "react";
import { engine, useAchievements, useIsUnlocked, useProgress } from "../achievements";
import { Button } from "./ui/button";

const INITIAL_NODES = [
  { id: "node-alpha", label: "alpha", desc: "Primary relay" },
  { id: "node-beta", label: "beta", desc: "Secondary relay" },
  { id: "node-gamma", label: "gamma", desc: "Tertiary relay" },
  { id: "node-delta", label: "delta", desc: "Backup relay" },
] as const;

const EXTRA_NODES = [
  { id: "node-epsilon", label: "epsilon", desc: "Deep node" },
  { id: "node-zeta", label: "zeta", desc: "Dark node" },
] as const;

export function CollectorSection() {
  const { collectItem, setMaxProgress } = useAchievements();
  const { progress: scannerProgress } = useProgress("scanner");
  const scannerUnlocked = useIsUnlocked("scanner");
  const coverageUnlocked = useIsUnlocked("full-coverage");

  const [expanded, setExpanded] = useState(false);
  const nodes = expanded ? [...INITIAL_NODES, ...EXTRA_NODES] : INITIAL_NODES;

  // Initialize from persisted engine state so scanned set survives page refresh
  const [scanned, setScanned] = useState<Set<string>>(
    () => new Set(engine.getItems("scanner")),
  );

  // Keep full-coverage's maxProgress in sync with the current node count
  useEffect(() => {
    setMaxProgress("full-coverage", nodes.length);
  }, [nodes.length, setMaxProgress]);

  function scan(nodeId: string) {
    if (scanned.has(nodeId)) return;
    collectItem("scanner", nodeId);
    collectItem("full-coverage", nodeId);
    setScanned((prev) => new Set(prev).add(nodeId));
  }

  return (
    <section className="py-10 border-t border-edge">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="font-mono text-[11px] text-faint tracking-widest">04</span>
        <code className="font-mono text-[12px] text-code px-2.5 py-1 bg-well border border-edge rounded">
          collectItem("scanner", nodeId)
        </code>
      </div>
      <h2 className="text-[22px] font-medium tracking-tight text-bright mb-2">
        Node Scanner
      </h2>
      <p className="text-[14px] text-body leading-[1.65] mb-6 max-w-[480px]">
        Scan unique network nodes to unlock achievements. Scanning the same node twice
        is idempotent. Expanding the network calls{" "}
        <code className="font-mono text-[12px] text-code bg-well px-1.5 py-0.5 rounded border border-edge">
          setMaxProgress
        </code>{" "}
        to raise the target dynamically.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {nodes.map((node) => {
          const done = scanned.has(node.id);
          const allDone = coverageUnlocked;
          return (
            <Button
              key={node.id}
              variant={done || allDone ? "accent" : "outline"}
              className="h-auto p-4 flex flex-col items-start gap-1.5"
              onClick={() => scan(node.id)}
              disabled={done || allDone}
            >
              <span className="font-mono text-[13px]">{node.label}</span>
              <span className="text-[11px] text-faint leading-snug font-normal">
                {node.desc}
              </span>
              <span
                className={`font-mono text-[10px] mt-1 tracking-wide ${
                  done ? "text-accent-mid" : "text-faint"
                }`}
              >
                {done ? "✓ scanned" : "→ scan"}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <p className="font-mono text-[11px] text-faint tracking-wide">
          {scannerProgress} / 4 unique nodes scanned
          <span className="ml-3 text-faint">
            · {scanned.size} / {nodes.length} for full coverage
          </span>
        </p>

        {!expanded && !coverageUnlocked && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
            + expand network
          </Button>
        )}
      </div>

      {!scannerUnlocked && (
        <p className="font-mono text-[10px] text-faint mt-2 tracking-wide opacity-60">
          scan {4 - scannerProgress} more unique node{4 - scannerProgress !== 1 ? "s" : ""} to unlock
          Network Scanner
        </p>
      )}
    </section>
  );
}
