import { describe, expect, it } from "vitest";
import {
  appendMessageDelta,
  compareRisk,
  createAssistantMessage,
  createConversation,
  createConversationTurn,
  createTaskRun,
  createUserMessage,
  recoverInterruptedConversation
} from "./domain";

describe("共享领域模型", () => {
  it("按低风险到严重风险排序", () => {
    expect(compareRisk("low", "medium")).toBeLessThan(0);
    expect(compareRisk("critical", "high")).toBeGreaterThan(0);
  });

  it("创建规划中状态且集合为空的任务运行记录", () => {
    const run = createTaskRun({ id: "task-1", userPrompt: "整理下载目录", selectedAgent: "planner" });
    expect(run.status).toBe("planning");
    expect(run.plan).toEqual([]);
    expect(run.events).toEqual([]);
    expect(run.artifacts).toEqual([]);
  });

  it("创建会话并派生默认标题", () => {
    const conversation = createConversation({
      id: "conversation-1",
      firstPrompt: "整理 Downloads 里的发票",
      createdAt: "2026-05-11T00:00:00.000Z"
    });

    expect(conversation).toMatchObject({
      id: "conversation-1",
      title: "整理 Downloads 里的发票",
      messages: [],
      turns: [],
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z"
    });
  });

  it("创建用户和助手消息并合并流式片段", () => {
    const userMessage = createUserMessage({
      id: "message-user-1",
      conversationId: "conversation-1",
      content: "总结这个 PDF",
      createdAt: "2026-05-11T00:00:00.000Z"
    });
    const assistantMessage = createAssistantMessage({
      id: "message-assistant-1",
      conversationId: "conversation-1",
      createdAt: "2026-05-11T00:00:01.000Z"
    });

    expect(userMessage.role).toBe("user");
    expect(userMessage.status).toBe("completed");
    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.status).toBe("streaming");
    expect(appendMessageDelta(assistantMessage, "正在")).toMatchObject({
      content: "正在",
      status: "streaming"
    });
  });

  it("创建会话回合并恢复中断状态", () => {
    const turn = createConversationTurn({
      id: "turn-1",
      conversationId: "conversation-1",
      userMessageId: "message-user-1",
      assistantMessageId: "message-assistant-1",
      selectedAgent: "planner",
      createdAt: "2026-05-11T00:00:00.000Z"
    });
    const conversation = {
      ...createConversation({
        id: "conversation-1",
        firstPrompt: "整理 Downloads",
        createdAt: "2026-05-11T00:00:00.000Z"
      }),
      turns: [turn]
    };

    expect(turn.status).toBe("running");
    expect(recoverInterruptedConversation(conversation).turns[0].status).toBe(
      "interrupted"
    );
  });
});
