import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanStep } from "@local-agent/shared";

afterEach(() => {
  vi.doUnmock("@local-agent/agents");
  vi.doUnmock("@local-agent/policy");
  vi.resetModules();
});

describe("智能体运行时", () => {
  it("创建带初始计划的规划任务运行记录", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.createTask("整理 Downloads");

    expect(taskRun.status).toBe("planning");
    expect(taskRun.plan.length).toBeGreaterThan(0);
    expect(taskRun.selectedAgent).toBe("planner");
  });

  it("启动包含高风险步骤的任务时等待审批", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("整理 Downloads 里的发票");

    expect(taskRun.status).toBe("waiting_approval");
  });

  it("无需审批即可完成低风险和中风险任务", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("总结这个 PDF");

    expect(taskRun.status).toBe("completed");
  });

  it("使用插件标准风险等级而非规划器提供的风险等级", async () => {
    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "move-files",
          title: "移动文件",
          agentId: "file",
          toolCalls: [
            {
              id: "move-files-call",
              pluginId: "file.move",
              input: {},
              riskLevel: "low",
              approvalRequired: false
            }
          ],
          riskLevel: "low",
          approvalRequired: false,
          status: "pending"
        }
      ]
    }));

    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("整理 Downloads 里的发票");

    expect(taskRun.status).toBe("waiting_approval");
    expect(taskRun.plan[0]).toMatchObject({
      riskLevel: "high",
      approvalRequired: true,
      toolCalls: [
        {
          pluginId: "file.move",
          riskLevel: "high",
          approvalRequired: true
        }
      ]
    });
  });

  it("计划中的工具调用引用未知插件时失败", async () => {
    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "unknown-plugin-step",
          title: "未知插件步骤",
          agentId: "desktop",
          toolCalls: [
            {
              id: "unknown-plugin-call",
              pluginId: "desktop.unknown",
              input: {},
              riskLevel: "low",
              approvalRequired: false
            }
          ],
          riskLevel: "low",
          approvalRequired: false,
          status: "pending"
        }
      ]
    }));

    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("使用未知插件");

    expect(taskRun.status).toBe("failed");
  });

  it("将上下文策略审批结果反映到返回的计划中", async () => {
    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "submit-payment",
          title: "提交付款",
          agentId: "desktop",
          toolCalls: [
            {
              id: "submit-payment-call",
              pluginId: "mouse.click",
              input: { visibleText: "Submit payment" },
              riskLevel: "medium",
              approvalRequired: false
            }
          ],
          riskLevel: "medium",
          approvalRequired: false,
          status: "pending"
        }
      ]
    }));

    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("提交付款");

    expect(taskRun.status).toBe("waiting_approval");
    expect(taskRun.plan[0]).toMatchObject({
      riskLevel: "medium",
      approvalRequired: true,
      toolCalls: [
        {
          pluginId: "mouse.click",
          riskLevel: "medium",
          approvalRequired: true
        }
      ]
    });
  });

  it("决定状态前评估每个计划内工具调用", async () => {
    const evaluatedToolCallIds: string[] = [];

    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "multi-tool-step",
          title: "多工具步骤",
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
          reason: "测试策略决策"
        };
      }
    }));

    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const taskRun = runtime.startTask("整理 Downloads 里的发票");

    expect(taskRun.status).toBe("waiting_approval");
    expect(evaluatedToolCallIds).toEqual(["approval-call", "allowed-call"]);
  });

  it("任一计划内工具调用被策略拒绝时失败", async () => {
    vi.doMock("@local-agent/agents", () => ({
      createInitialPlan: (): PlanStep[] => [
        {
          id: "delete-files",
          title: "删除文件",
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

    const taskRun = runtime.startTask("删除 Downloads");

    expect(taskRun.status).toBe("failed");
  });

  it("以事件流运行会话回合并输出助手内容", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const events = [];
    for await (const event of runtime.runConversationTurn({
      conversationId: "conversation-1",
      userMessageId: "message-user-1",
      assistantMessageId: "message-assistant-1",
      prompt: "总结这个 PDF",
      selectedAgent: "planner"
    })) {
      events.push(event);
    }

    expect(events.map((event) => event.type)).toContain("turn.started");
    expect(events.map((event) => event.type)).toContain("message.delta");
    expect(events.map((event) => event.type)).toContain("tool.started");
    expect(events.map((event) => event.type)).toContain("tool.completed");
    expect(events.at(-1)).toMatchObject({ type: "turn.completed" });
    expect(
      events
        .filter((event) => event.type === "message.delta")
        .map((event) => event.delta)
        .join("")
    ).toContain("总结这个 PDF");
  });

  it("会话事件流暴露需要审批的工具调用", async () => {
    const { createRuntime } = await import("./runtime");
    const runtime = createRuntime();

    const events = [];
    for await (const event of runtime.runConversationTurn({
      conversationId: "conversation-1",
      userMessageId: "message-user-1",
      assistantMessageId: "message-assistant-1",
      prompt: "整理 Downloads 里的发票",
      selectedAgent: "planner"
    })) {
      events.push(event);
    }

    expect(events).toContainEqual(
      expect.objectContaining({
        type: "approval.required",
        riskLevel: "high"
      })
    );
    expect(events.at(-1)).toMatchObject({ type: "turn.completed" });
  });
});
