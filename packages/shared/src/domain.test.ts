import { describe, expect, it } from "vitest";
import { compareRisk, createTaskRun } from "./domain";

describe("shared domain", () => {
  it("orders risk levels from low to critical", () => {
    expect(compareRisk("low", "medium")).toBeLessThan(0);
    expect(compareRisk("critical", "high")).toBeGreaterThan(0);
  });

  it("creates a task run with planning status and empty collections", () => {
    const run = createTaskRun({ id: "task-1", userPrompt: "organize downloads", selectedAgent: "planner" });
    expect(run.status).toBe("planning");
    expect(run.plan).toEqual([]);
    expect(run.events).toEqual([]);
    expect(run.artifacts).toEqual([]);
  });
});
