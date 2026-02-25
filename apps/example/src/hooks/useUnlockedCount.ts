import { useEffect, useState } from "react";
import { engine } from "../achievements";

/** Subscribes directly to the engine — no React context required. */
export function useUnlockedCount() {
  const [count, setCount] = useState(() => engine.getState().unlockedIds.size);
  useEffect(() => engine.subscribe((s) => setCount(s.unlockedIds.size)), []);
  return count;
}
