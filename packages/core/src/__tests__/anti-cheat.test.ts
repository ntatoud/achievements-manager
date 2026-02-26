import { describe, it, expect, vi } from "vitest";
import { createAchievements } from "../engine";
import { fnv1aHashAdapter, inMemoryAdapter } from "../adapters";

const definitions = [
  { id: "basic", label: "Basic", description: "A basic achievement" },
  {
    id: "progress-many",
    label: "Progress Many",
    description: "Many steps needed",
    maxProgress: 10,
  },
  { id: "collectible", label: "Collectible", description: "Collect items", maxProgress: 3 },
] as const;

function makeAdapter() {
  return inMemoryAdapter();
}

function makeEngine(storage = makeAdapter(), onTamperDetected?: (key: string) => void) {
  return createAchievements({ definitions, storage, onTamperDetected });
}

describe("fnv1aHashAdapter", () => {
  it("returns a hex string", () => {
    const adapter = fnv1aHashAdapter();
    expect(adapter.hash("hello")).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic", () => {
    const adapter = fnv1aHashAdapter();
    expect(adapter.hash("test-data")).toBe(adapter.hash("test-data"));
  });

  it("produces different hashes for different inputs", () => {
    const adapter = fnv1aHashAdapter();
    expect(adapter.hash("data-a")).not.toBe(adapter.hash("data-b"));
  });
});

describe("hash written alongside data", () => {
  it("stores a hash key when unlocking an achievement", () => {
    const adapter = makeAdapter();
    const engine = makeEngine(adapter);
    engine.unlock("basic");
    expect(adapter.get("unlocked:hash")).not.toBeNull();
  });

  it("stores a hash key when setting progress", () => {
    const adapter = makeAdapter();
    const engine = makeEngine(adapter);
    engine.setProgress("progress-many", 5);
    expect(adapter.get("progress:hash")).not.toBeNull();
  });

  it("stores a hash key when collecting items", () => {
    const adapter = makeAdapter();
    const engine = makeEngine(adapter);
    engine.collectItem("collectible", "item-a");
    expect(adapter.get("items:hash")).not.toBeNull();
  });
});

describe("tamper detection at hydration", () => {
  it("discards tampered unlocked data and starts empty", () => {
    const adapter = makeAdapter();
    // Simulate writing data + hash, then tampering with the data
    adapter.set("unlocked", JSON.stringify(["basic", "progress-many"]));
    adapter.set("unlocked:hash", "deadbeef"); // wrong hash

    const engine = makeEngine(adapter);
    expect(engine.isUnlocked("basic")).toBe(false);
    expect(engine.getUnlockedCount()).toBe(0);
  });

  it("discards tampered progress data and starts at zero", () => {
    const adapter = makeAdapter();
    adapter.set("progress", JSON.stringify({ "progress-many": 9 }));
    adapter.set("progress:hash", "deadbeef");

    const engine = makeEngine(adapter);
    expect(engine.getProgress("progress-many")).toBe(0);
  });

  it("discards tampered items data and starts empty", () => {
    const adapter = makeAdapter();
    adapter.set("items", JSON.stringify({ collectible: ["a", "b", "c"] }));
    adapter.set("items:hash", "deadbeef");

    const engine = makeEngine(adapter);
    expect(engine.getItems("collectible").size).toBe(0);
  });

  it("calls onTamperDetected with the affected key", () => {
    const adapter = makeAdapter();
    adapter.set("unlocked", JSON.stringify(["basic"]));
    adapter.set("unlocked:hash", "deadbeef");

    const onTamperDetected = vi.fn();
    makeEngine(adapter, onTamperDetected);

    expect(onTamperDetected).toHaveBeenCalledWith("unlocked");
  });

  it("clears tampered data from storage on hydration", () => {
    const adapter = makeAdapter();
    adapter.set("unlocked", JSON.stringify(["basic"]));
    adapter.set("unlocked:hash", "deadbeef");

    makeEngine(adapter);

    expect(adapter.get("unlocked")).toBeNull();
    expect(adapter.get("unlocked:hash")).toBeNull();
  });

  it("trusts data with no hash (backward compatibility)", () => {
    const adapter = makeAdapter();
    // Data stored without anti-cheat (no hash key)
    adapter.set("unlocked", JSON.stringify(["basic"]));

    const engine = makeEngine(adapter);
    expect(engine.isUnlocked("basic")).toBe(true);
  });
});

describe("tamper detection before unlock", () => {
  it("calls onTamperDetected if stored unlocked data is modified between operations", () => {
    const adapter = makeAdapter();
    const onTamperDetected = vi.fn();
    const engine = createAchievements({ definitions, storage: adapter, onTamperDetected });

    // Normal unlock — writes data + hash
    engine.unlock("basic");

    // Tamper the stored unlocked list (simulate a user editing localStorage)
    adapter.set("unlocked", JSON.stringify(["basic", "progress-many"]));

    // Next unlock detects the tamper
    engine.unlock("collectible");

    expect(onTamperDetected).toHaveBeenCalledWith("unlocked");
  });

  it("still performs the unlock even after tamper detected", () => {
    const adapter = makeAdapter();
    const engine = createAchievements({ definitions, storage: adapter });

    engine.unlock("basic");
    // Tamper the stored unlocked list
    adapter.set("unlocked", JSON.stringify(["basic", "progress-many"]));

    engine.unlock("collectible");

    // In-memory state (authoritative) should have basic + collectible, not progress-many
    expect(engine.isUnlocked("basic")).toBe(true);
    expect(engine.isUnlocked("collectible")).toBe(true);
    expect(engine.isUnlocked("progress-many")).toBe(false);
  });

  it("overwrites tampered storage with authoritative in-memory state", () => {
    const adapter = makeAdapter();
    const engine = createAchievements({ definitions, storage: adapter });

    engine.unlock("basic");
    adapter.set("unlocked", JSON.stringify(["basic", "progress-many"]));

    engine.unlock("collectible");

    // Storage should now reflect only what the engine actually unlocked
    const stored = JSON.parse(adapter.get("unlocked")!) as string[];
    expect(stored).toContain("basic");
    expect(stored).toContain("collectible");
    expect(stored).not.toContain("progress-many");
  });
});

describe("reset clears hash keys", () => {
  it("removes hash keys for all storage keys", () => {
    const adapter = makeAdapter();
    const removeSpy = vi.spyOn(adapter, "remove");
    const engine = createAchievements({ definitions, storage: adapter });

    engine.unlock("basic");
    engine.setProgress("progress-many", 5);
    engine.collectItem("collectible", "item-a");
    engine.reset();

    expect(removeSpy).toHaveBeenCalledWith("unlocked:hash");
    expect(removeSpy).toHaveBeenCalledWith("progress:hash");
    expect(removeSpy).toHaveBeenCalledWith("items:hash");
  });
});

describe("custom hash adapter", () => {
  it("uses the provided hash adapter instead of the default", () => {
    const customHash = vi.fn((data: string) => `custom:${data.length}`);
    const adapter = makeAdapter();
    const engine = createAchievements({
      definitions,
      storage: adapter,
      hash: { hash: customHash },
    });

    engine.unlock("basic");

    expect(customHash).toHaveBeenCalled();
    expect(adapter.get("unlocked:hash")).toMatch(/^custom:/);
  });

  it("validates stored data using the same custom hash adapter", () => {
    const adapter = makeAdapter();
    // Write data + hash using custom adapter
    const customAdapter = { hash: (data: string) => `x${data.length}` };
    const e1 = createAchievements({ definitions, storage: adapter, hash: customAdapter });
    e1.unlock("basic");

    // New engine with same custom adapter should trust the data
    const onTamperDetected = vi.fn();
    const e2 = createAchievements({
      definitions,
      storage: adapter,
      hash: customAdapter,
      onTamperDetected,
    });
    expect(e2.isUnlocked("basic")).toBe(true);
    expect(onTamperDetected).not.toHaveBeenCalled();
  });
});
