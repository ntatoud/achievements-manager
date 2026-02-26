import { describe, it, expect, vi } from "vitest";
import { createAchievements } from "../engine";
import { inMemoryAdapter } from "../adapters";

const definitions = [
  { id: "basic", label: "Basic", description: "A basic achievement" },
  {
    id: "progress-one",
    label: "Progress One",
    description: "One step needed",
    maxProgress: 1,
  },
  {
    id: "progress-many",
    label: "Progress Many",
    description: "Many steps needed",
    maxProgress: 10,
  },
  {
    id: "hidden",
    label: "Hidden",
    description: "Secret achievement",
    hidden: true,
  },
] as const;

function makeEngine(storage = inMemoryAdapter()) {
  return createAchievements({ definitions, storage });
}

describe("unlock()", () => {
  it("adds the id to unlockedIds and toastQueue", () => {
    const engine = makeEngine();
    engine.unlock("basic");
    const state = engine.getState();
    expect(state.unlockedIds.has("basic")).toBe(true);
    expect(state.toastQueue).toContain("basic");
  });

  it("is a no-op when already unlocked (no duplicate in queue)", () => {
    const engine = makeEngine();
    engine.unlock("basic");
    engine.unlock("basic");
    const state = engine.getState();
    expect([...state.unlockedIds]).toHaveLength(1);
    expect(state.toastQueue).toHaveLength(1);
  });
});

describe("setProgress()", () => {
  it("updates progress[id]", () => {
    const engine = makeEngine();
    engine.setProgress("progress-many", 5);
    expect(engine.getProgress("progress-many")).toBe(5);
  });

  it("auto-unlocks when value reaches maxProgress", () => {
    const engine = makeEngine();
    engine.setProgress("progress-many", 10);
    expect(engine.isUnlocked("progress-many")).toBe(true);
    expect(engine.getState().toastQueue).toContain("progress-many");
  });

  it("clamps value to [0, maxProgress]", () => {
    const engine = makeEngine();
    engine.setProgress("progress-many", -5);
    expect(engine.getProgress("progress-many")).toBe(0);
    engine.setProgress("progress-many", 999);
    expect(engine.getProgress("progress-many")).toBe(10);
  });

  it("is a no-op for achievements without maxProgress", () => {
    const engine = makeEngine();
    engine.setProgress("basic", 5);
    expect(engine.getProgress("basic")).toBe(0);
    expect(engine.isUnlocked("basic")).toBe(false);
  });
});

describe("incrementProgress()", () => {
  it("delegates correctly to setProgress", () => {
    const engine = makeEngine();
    engine.incrementProgress("progress-many");
    expect(engine.getProgress("progress-many")).toBe(1);
    engine.incrementProgress("progress-many");
    expect(engine.getProgress("progress-many")).toBe(2);
  });

  it("auto-unlocks when increment reaches maxProgress", () => {
    const engine = makeEngine();
    engine.incrementProgress("progress-one");
    expect(engine.isUnlocked("progress-one")).toBe(true);
  });
});

describe("dismissToast()", () => {
  it("removes id from toastQueue", () => {
    const engine = makeEngine();
    engine.unlock("basic");
    engine.dismissToast("basic");
    expect(engine.getState().toastQueue).not.toContain("basic");
  });

  it("is a no-op for ids not in the queue", () => {
    const engine = makeEngine();
    expect(() => engine.dismissToast("basic")).not.toThrow();
  });
});

describe("subscribe()", () => {
  it("listener is called after every mutation", () => {
    const engine = makeEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.unlock("basic");
    engine.setProgress("progress-many", 3);
    engine.dismissToast("basic");
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("returned unsubscribe removes the listener", () => {
    const engine = makeEngine();
    const listener = vi.fn();
    const unsub = engine.subscribe(listener);
    unsub();
    engine.unlock("basic");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("reset()", () => {
  it("clears all in-memory state", () => {
    const engine = makeEngine();
    engine.unlock("basic");
    engine.setProgress("progress-many", 7);
    engine.reset();
    const state = engine.getState();
    expect(state.unlockedIds.size).toBe(0);
    expect(Object.keys(state.progress)).toHaveLength(0);
    expect(state.toastQueue).toHaveLength(0);
  });

  it("calls storage.remove() for unlocked and progress keys", () => {
    const adapter = inMemoryAdapter();
    const removeSpy = vi.spyOn(adapter, "remove");
    const engine = createAchievements({
      definitions,
      storage: adapter,
    });
    engine.unlock("basic");
    engine.reset();
    expect(removeSpy).toHaveBeenCalledWith("unlocked");
    expect(removeSpy).toHaveBeenCalledWith("progress");
  });

  it("notifies subscribers after reset", () => {
    const engine = makeEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    const state = listener.mock.calls[0]?.[0];
    expect(state.unlockedIds.size).toBe(0);
  });
});

describe("hydration from storage", () => {
  it("restores state from pre-existing storage data", () => {
    const adapter = inMemoryAdapter();
    adapter.set("unlocked", JSON.stringify(["basic"]));
    adapter.set("progress", JSON.stringify({ "progress-many": 6 }));

    const engine = createAchievements({
      definitions,
      storage: adapter,
    });
    expect(engine.isUnlocked("basic")).toBe(true);
    expect(engine.getProgress("progress-many")).toBe(6);
  });

  it("handles storage read errors gracefully (starts empty)", () => {
    const adapter = inMemoryAdapter();
    adapter.set("unlocked", "not-valid-json{{{");
    adapter.set("progress", "also-bad");

    const engine = createAchievements({
      definitions,
      storage: adapter,
    });
    expect(engine.isUnlocked("basic")).toBe(false);
    expect(engine.getProgress("progress-many")).toBe(0);
  });
});

describe("onUnlock callback", () => {
  it("is called synchronously after an achievement is unlocked", () => {
    const onUnlock = vi.fn();
    const engine = createAchievements({
      definitions,
      storage: inMemoryAdapter(),
      onUnlock,
    });
    engine.unlock("basic");
    expect(onUnlock).toHaveBeenCalledOnce();
    expect(onUnlock).toHaveBeenCalledWith("basic");
  });

  it("is not called when already unlocked", () => {
    const onUnlock = vi.fn();
    const engine = createAchievements({
      definitions,
      storage: inMemoryAdapter(),
      onUnlock,
    });
    engine.unlock("basic");
    engine.unlock("basic");
    expect(onUnlock).toHaveBeenCalledOnce();
  });
});
