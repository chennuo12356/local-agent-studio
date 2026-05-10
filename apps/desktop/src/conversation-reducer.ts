import {
  appendMessageDelta,
  createConversation,
  createUserMessage,
  type AgentTraceEvent,
  type ChatMessage,
  type Conversation,
  type ConversationTurn,
  type TraceStep
} from "@local-agent/shared";

import type { StoredConversationState } from "./conversation-store";

export type ConversationState = StoredConversationState;

export function createEmptyConversationState(): ConversationState {
  return { conversations: [] };
}

export function appendUserMessage(
  state: ConversationState,
  prompt: string,
  ids: { conversationId: string; messageId: string; createdAt: string }
): ConversationState {
  const existingConversation = state.conversations.find(
    (conversation) => conversation.id === ids.conversationId
  );
  const userMessage = createUserMessage({
    id: ids.messageId,
    conversationId: ids.conversationId,
    content: prompt,
    createdAt: ids.createdAt
  });
  const conversation =
    existingConversation ??
    createConversation({
      id: ids.conversationId,
      firstPrompt: prompt,
      createdAt: ids.createdAt
    });

  return upsertConversation(
    {
      ...state,
      currentConversationId: ids.conversationId
    },
    {
      ...conversation,
      messages: [...conversation.messages, userMessage],
      updatedAt: ids.createdAt
    }
  );
}

export function applyTraceEvent(
  state: ConversationState,
  event: AgentTraceEvent
): ConversationState {
  const conversationId = state.currentConversationId;
  const conversation = state.conversations.find(
    (item) => item.id === conversationId
  );

  if (!conversation) {
    return state;
  }

  if (event.type === "message.started") {
    return updateConversation(state, conversation.id, {
      messages: upsertMessage(conversation.messages, event.message),
      updatedAt: event.createdAt
    });
  }

  if (event.type === "message.delta") {
    return updateConversation(state, conversation.id, {
      messages: conversation.messages.map((message) =>
        message.id === event.messageId
          ? appendMessageDelta(message, event.delta)
          : message
      ),
      updatedAt: event.createdAt
    });
  }

  if (event.type === "message.completed") {
    return updateConversation(state, conversation.id, {
      messages: conversation.messages.map((message) =>
        message.id === event.messageId
          ? {
              ...message,
              content: event.content,
              status: "completed",
              completedAt: event.createdAt
            }
          : message
      ),
      updatedAt: event.createdAt
    });
  }

  if (event.type === "turn.started") {
    return updateConversation(state, conversation.id, {
      turns: upsertTurn(conversation.turns, event.turn),
      updatedAt: event.createdAt
    });
  }

  if (event.type === "agent.step.started" || event.type === "tool.started") {
    return updateTrace(state, conversation, event.step, event.createdAt);
  }

  if (event.type === "agent.step.completed") {
    return completeTraceStep(state, conversation, event.stepId, event.createdAt);
  }

  if (event.type === "tool.completed") {
    return patchTraceStep(state, conversation, event.stepId, event.createdAt, {
      status: "completed",
      output: event.output,
      policyDecision: event.policyDecision,
      completedAt: event.createdAt
    });
  }

  if (event.type === "approval.required") {
    return patchTraceStep(state, conversation, event.stepId, event.createdAt, {
      status: "waiting_approval",
      riskLevel: event.riskLevel,
      approvalRequired: true
    });
  }

  if (event.type === "turn.completed" || event.type === "turn.failed") {
    return updateConversation(state, conversation.id, {
      turns: conversation.turns.map((turn) =>
        turn.id === event.turnId
          ? {
              ...turn,
              status: event.type === "turn.completed" ? "completed" : "failed",
              completedAt: event.createdAt
            }
          : turn
      ),
      updatedAt: event.createdAt
    });
  }

  return state;
}

function updateTrace(
  state: ConversationState,
  conversation: Conversation,
  step: TraceStep,
  updatedAt: string
): ConversationState {
  return updateConversation(state, conversation.id, {
    turns: conversation.turns.map((turn) =>
      turn.id === step.turnId
        ? { ...turn, trace: upsertTraceStep(turn.trace, step) }
        : turn
    ),
    updatedAt
  });
}

function completeTraceStep(
  state: ConversationState,
  conversation: Conversation,
  stepId: string,
  updatedAt: string
): ConversationState {
  return patchTraceStep(state, conversation, stepId, updatedAt, {
    status: "completed",
    completedAt: updatedAt
  });
}

function patchTraceStep(
  state: ConversationState,
  conversation: Conversation,
  stepId: string,
  updatedAt: string,
  patch: Partial<TraceStep>
): ConversationState {
  return updateConversation(state, conversation.id, {
    turns: conversation.turns.map((turn) => ({
      ...turn,
      trace: turn.trace.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step
      )
    })),
    updatedAt
  });
}

function updateConversation(
  state: ConversationState,
  conversationId: string,
  patch: Partial<Conversation>
): ConversationState {
  const conversation = state.conversations.find(
    (item) => item.id === conversationId
  );

  if (!conversation) {
    return state;
  }

  return upsertConversation(state, { ...conversation, ...patch });
}

function upsertConversation(
  state: ConversationState,
  conversation: Conversation
): ConversationState {
  const exists = state.conversations.some((item) => item.id === conversation.id);

  return {
    ...state,
    conversations: exists
      ? state.conversations.map((item) =>
          item.id === conversation.id ? conversation : item
        )
      : [conversation, ...state.conversations]
  };
}

function upsertMessage(
  messages: ChatMessage[],
  message: ChatMessage
): ChatMessage[] {
  return messages.some((item) => item.id === message.id)
    ? messages.map((item) => (item.id === message.id ? message : item))
    : [...messages, message];
}

function upsertTurn(
  turns: ConversationTurn[],
  turn: ConversationTurn
): ConversationTurn[] {
  return turns.some((item) => item.id === turn.id)
    ? turns.map((item) => (item.id === turn.id ? turn : item))
    : [...turns, turn];
}

function upsertTraceStep(trace: TraceStep[], step: TraceStep): TraceStep[] {
  return trace.some((item) => item.id === step.id)
    ? trace.map((item) => (item.id === step.id ? step : item))
    : [...trace, step];
}
