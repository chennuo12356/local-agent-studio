import {
  createAssistantMessage,
  createConversation,
  createConversationTurn,
  createUserMessage,
  type AgentTraceEvent
} from "@local-agent/shared";
import { describe, expect, it } from "vitest";

import {
  appendUserMessage,
  applyTraceEvent,
  createEmptyConversationState
} from "./conversation-reducer";

describe("conversation reducer", () => {
  it("向新会话追加用户消息", () => {
    const state = createEmptyConversationState();
    const next = appendUserMessage(state, "整理 Downloads", {
      conversationId: "conversation-1",
      messageId: "message-user-1",
      createdAt: "2026-05-11T00:00:00.000Z"
    });

    expect(next.currentConversationId).toBe("conversation-1");
    expect(next.conversations[0].messages[0]).toMatchObject({
      role: "user",
      content: "整理 Downloads"
    });
  });

  it("合并助手流式文本和工具 trace", () => {
    const conversation = createConversation({
      id: "conversation-1",
      firstPrompt: "整理 Downloads",
      createdAt: "2026-05-11T00:00:00.000Z"
    });
    const userMessage = createUserMessage({
      id: "message-user-1",
      conversationId: "conversation-1",
      content: "整理 Downloads",
      createdAt: "2026-05-11T00:00:00.000Z"
    });
    const assistantMessage = createAssistantMessage({
      id: "message-assistant-1",
      conversationId: "conversation-1",
      createdAt: "2026-05-11T00:00:01.000Z"
    });
    const turn = createConversationTurn({
      id: "turn-1",
      conversationId: "conversation-1",
      userMessageId: "message-user-1",
      assistantMessageId: "message-assistant-1",
      selectedAgent: "planner",
      createdAt: "2026-05-11T00:00:01.000Z"
    });
    const state = {
      currentConversationId: "conversation-1",
      conversations: [
        {
          ...conversation,
          messages: [userMessage, assistantMessage],
          turns: [turn]
        }
      ]
    };
    const toolStarted: AgentTraceEvent = {
      type: "tool.started",
      step: {
        id: "trace-tool-1",
        turnId: "turn-1",
        kind: "tool",
        title: "file.scan",
        status: "running",
        startedAt: "2026-05-11T00:00:02.000Z"
      },
      createdAt: "2026-05-11T00:00:02.000Z"
    };

    const withDelta = applyTraceEvent(state, {
      type: "message.delta",
      messageId: "message-assistant-1",
      delta: "正在处理",
      createdAt: "2026-05-11T00:00:02.000Z"
    });
    const withTool = applyTraceEvent(withDelta, toolStarted);

    expect(withTool.conversations[0].messages[1].content).toBe("正在处理");
    expect(withTool.conversations[0].turns[0].trace[0]).toMatchObject({
      id: "trace-tool-1",
      status: "running"
    });
  });
});
