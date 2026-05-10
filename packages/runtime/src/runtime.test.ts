import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanStep } from "@local-agent/shared";

afterEach(() => {
  vi.doUnmock("@local-agent/agents");
  vi.doUnmock("@local-agent/policy");
  vi.resetModules();
});

describe("agent runtime", () => {
  it("creates a planning task run with an initial plan", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.createTask("organize Downloads");

    expect(taskRun.status).toBe("planning");
    expect(taskRun.plan.length).toBeGreaterThan(0);
    expect(taskRun.selectedAgent).toBe("planner");
  });

  it("waits for approval when starting a task with high risk steps", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("organize Downloads invoices");

    expect(taskRun.status).toBe("waiting_approval");
  });

  it("completes low and medium risk tasks without approval", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("summarize this PDF");

    expect(taskRun.status).toBe("completed");
  });

  it("evaluates every planned tool call before deciding status", async () => {
    const evaluatedToolCallIds: string[] = [];

    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "multi-tool-step",
          title: "Multi tool step",
          agentId: "file",
          toolCalls: [
            {
              id: "approval-call",
              pluginId: "file.move",
              input: {},
              riskLevel: "high",
              approvalRequired: true
            },
            {
              id: "allowed-call",
              pluginId: "file.scan",
              input: {},
              riskLevel: "low",
              approvalRequired: false
            }
          ],
          riskLevel: "high",
          approvalRequired: true,
          status: "pending"
        }
      ]
    }));
    vi.doMock("@local-agent/policy", () => ({
      evaluateToolCall: (toolCall: { id: string }) => {
        evaluatedToolCallIds.push(toolCall.id);

        return {
          decision:
            toolCall.id === "approval-call" ? "require_approval" : "allow",
          reason: "test policy decision"
        };
      }
    }));

    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("organize Downloads invoices");

    expect(taskRun.status).toBe("waiting_approval");
    expect(evaluatedToolCallIds).toEqual(["approval-call", "allowed-call"]);
  });

  it("fails when any planned tool call is denied by policy", async () => {
    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "delete-files",
          title: "Delete files",
          agentId: "file",
          toolCalls: [
            {
              id: "delete-files-call",
              pluginId: "file.delete",
              input: {},
              riskLevel: "critical",
              approvalRequired: true
            }
          ],
          riskLevel: "critical",
          approvalRequired: true,
          status: "pending"
        }
      ]
    }));

    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("delete Downloads");

    expect(taskRun.status).toBe("failed");
  });
});
