import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AchievementEngine, AchievementState } from "achievements";

const AchievementsContext = createContext<AchievementEngine<string> | null>(null);

export function AchievementsProvider<TId extends string>({
  engine,
  children,
}: {
  engine: AchievementEngine<TId>;
  children: ReactNode;
}) {
  return (
    <AchievementsContext.Provider value={engine as AchievementEngine<string>}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useEngine<TId extends string>(): AchievementEngine<TId> {
  const engine = useContext(AchievementsContext);
  if (!engine) throw new Error("useEngine must be used inside AchievementsProvider");
  return engine as AchievementEngine<TId>;
}

/**
 * Subscribe to the engine's state and re-render on every change.
 * Use the selector to avoid unnecessary re-renders.
 */
export function useEngineState<TId extends string, T>(
  selector: (state: AchievementState<TId>) => T,
): T {
  const engine = useEngine<TId>();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const [value, setValue] = useState(() => selector(engine.getState() as AchievementState<TId>));
  useEffect(() => {
    // Sync in case state changed between render and effect
    setValue(selectorRef.current(engine.getState() as AchievementState<TId>));
    return engine.subscribe((state) =>
      setValue(selectorRef.current(state as AchievementState<TId>)),
    );
  }, [engine]);
  return value;
}
