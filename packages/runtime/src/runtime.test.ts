import { describe, expect, it } from "vitest";
import { createRuntime } from "./runtime";

describe("agent runtime", () => {
  it("creates a planning task run with an initial plan", () => {
    const runtime = createRuntime();

    const taskRun = runtime.createTask("organize Downloads");

    expect(taskRun.status).toBe("planning");
    expect(taskRun.plan.length).toBeGreaterThan(0);
    expect(taskRun.selectedAgent).toBe("planner");
  });

  it("waits for approval when starting a task with high risk steps", () => {
    const runtime = createRuntime();

    const taskRun = runtime.startTask("organize Downloads invoices");

    expect(taskRun.status).toBe("waiting_approval");
  });

  it("completes low and medium risk tasks without approval", () => {
    const runtime = createRuntime();

    const taskRun = runtime.startTask("summarize this PDF");

    expect(taskRun.status).toBe("completed");
  });
});
