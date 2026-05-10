import {
  createConversation,
  createConversationTurn,
  createUserMessage
} from "@local-agent/shared";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createLocalConversationStore,
  type StoredConversationState
} from "./conversation-store";

describe("conversation store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("保存并恢复会话列表和当前会话", () => {
    const store = createLocalConversationStore("test-agent-studio");
    const conversation = createConversation({
      id: "conversation-1",
      firstPrompt: "整理 Downloads",
      createdAt: "2026-05-11T00:00:00.000Z"
    });
    const state: StoredConversationState = {
      currentConversationId: "conversation-1",
      conversations: [conversation]
    };

    store.save(state);

    expect(store.load()).toEqual(state);
  });

  it("恢复运行中的回合为中断状态", () => {
    const store = createLocalConversationStore("test-agent-studio");
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
    const turn = createConversationTurn({
      id: "turn-1",
      conversationId: "conversation-1",
      userMessageId: "message-user-1",
      assistantMessageId: "message-assistant-1",
      selectedAgent: "planner",
      createdAt: "2026-05-11T00:00:00.000Z"
    });

    store.save({
      currentConversationId: "conversation-1",
      conversations: [
        {
          ...conversation,
          messages: [userMessage],
          turns: [turn]
        }
      ]
    });

    expect(store.load().conversations[0].turns[0].status).toBe("interrupted");
  });
});
