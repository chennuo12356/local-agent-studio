# Agent Studio Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a session-based Agent Studio chat experience with streaming assistant output, live agent/tool trace updates, local session history, and a clean Tailwind UI based on the approved design.

**Architecture:** Shared types define conversations, messages, turns, trace steps, and stream events. Runtime exposes an async `runConversationTurn()` event stream backed by the existing planner/policy/plugin stack and a simulated executor. The desktop app consumes events with React reducers, persists recoverable conversation snapshots in localStorage, and renders a reference-inspired shell with sidebar, composer, chat, and trace panel.

**Tech Stack:** TypeScript, React 18, Vitest, Testing Library, Vite, Tailwind CSS, localStorage, existing workspace packages.

---

## File Map

- Modify: `packages/shared/src/domain.ts`  
  Add conversation, message, turn, trace, and event types plus small constructors/helpers.
- Modify: `packages/shared/src/domain.test.ts`  
  Cover conversation creation, message creation, delta append, and interrupted recovery helper.
- Modify: `packages/runtime/src/runtime.ts`  
  Keep existing `createTask()` and `startTask()` behavior, add `runConversationTurn()` async stream.
- Modify: `packages/runtime/src/runtime.test.ts`  
  Cover event order, assistant delta output, tool events, approval events, and failed unknown plugin path.
- Create: `apps/desktop/src/conversation-store.ts`  
  localStorage-backed conversation persistence with load/save and interrupted recovery.
- Create: `apps/desktop/src/conversation-reducer.ts`  
  Event reducer that converts `AgentTraceEvent` into UI conversation snapshots.
- Create: `apps/desktop/src/conversation-store.test.ts`  
  Cover save, load, current conversation id, and interrupted running turn recovery.
- Create: `apps/desktop/src/conversation-reducer.test.ts`  
  Cover user message insertion, assistant delta merging, trace updates, and completion.
- Modify: `apps/desktop/package.json`  
  Add `lucide-react` runtime dependency and Tailwind/PostCSS dev dependencies.
- Create: `apps/desktop/tailwind.config.js`  
  Tailwind content configuration.
- Create: `apps/desktop/postcss.config.js`  
  PostCSS Tailwind setup.
- Modify: `apps/desktop/src/styles.css`  
  Replace most hand-authored CSS with Tailwind directives and minimal global styles.
- Modify: `apps/desktop/src/App.tsx`  
  Replace the old task-plan console with componentized session UI.
- Modify: `apps/desktop/src/App.test.tsx`  
  Replace old plan-console expectations with session/chat/trace/history tests.

## Task 1: Shared Conversation Domain

**Files:**
- Modify: `packages/shared/src/domain.ts`
- Modify: `packages/shared/src/domain.test.ts`

- [ ] **Step 1: Write failing shared-domain tests**

Add tests to `packages/shared/src/domain.test.ts` below the existing tests:

```ts
import {
  appendMessageDelta,
  createAssistantMessage,
  createConversation,
  createConversationTurn,
  createUserMessage,
  recoverInterruptedConversation
} from "./domain";

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
```

- [ ] **Step 2: Run shared-domain tests and verify failure**

Run:

```bash
source ~/.profile
pnpm vitest run packages/shared/src/domain.test.ts
```

Expected: FAIL because the new conversation helpers are not exported from `packages/shared/src/domain.ts`.

- [ ] **Step 3: Implement shared-domain types and helpers**

Add to `packages/shared/src/domain.ts` after the existing `TaskRun` type:

```ts
export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageStatus =
  | "pending"
  | "streaming"
  | "completed"
  | "failed";

export type ConversationTurnStatus =
  | "planning"
  | "running"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "interrupted";

export type TraceStepKind = "agent" | "tool" | "approval" | "message";

export type TraceStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "waiting_approval";

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  status: ChatMessageStatus;
  createdAt: string;
  completedAt?: string;
};

export type TraceStep = {
  id: string;
  turnId: string;
  kind: TraceStepKind;
  title: string;
  agentId?: string;
  toolCallId?: string;
  pluginId?: string;
  status: TraceStepStatus;
  riskLevel?: RiskLevel;
  approvalRequired?: boolean;
  startedAt: string;
  completedAt?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  policyDecision?: ApprovalDecision;
  error?: string;
};

export type ConversationTurn = {
  id: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  selectedAgent: string;
  status: ConversationTurnStatus;
  trace: TraceStep[];
  createdAt: string;
  completedAt?: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  turns: ConversationTurn[];
  createdAt: string;
  updatedAt: string;
};

export type AgentTraceEvent =
  | {
      type: "turn.started";
      turn: ConversationTurn;
      createdAt: string;
    }
  | {
      type: "message.started";
      message: ChatMessage;
      createdAt: string;
    }
  | {
      type: "message.delta";
      messageId: string;
      delta: string;
      createdAt: string;
    }
  | {
      type: "message.completed";
      messageId: string;
      content: string;
      createdAt: string;
    }
  | {
      type: "agent.step.started";
      step: TraceStep;
      createdAt: string;
    }
  | {
      type: "agent.step.completed";
      stepId: string;
      createdAt: string;
    }
  | {
      type: "tool.started";
      step: TraceStep;
      createdAt: string;
    }
  | {
      type: "tool.completed";
      stepId: string;
      output: Record<string, unknown>;
      policyDecision: ApprovalDecision;
      createdAt: string;
    }
  | {
      type: "approval.required";
      stepId: string;
      riskLevel: RiskLevel;
      createdAt: string;
    }
  | {
      type: "turn.completed";
      turnId: string;
      createdAt: string;
    }
  | {
      type: "turn.failed";
      turnId: string;
      error: string;
      createdAt: string;
    };
```

Add helper functions near `createTaskRun()`:

```ts
export function createConversation(input: {
  id: string;
  firstPrompt?: string;
  createdAt?: string;
}): Conversation {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const title = deriveConversationTitle(input.firstPrompt);

  return {
    id: input.id,
    title,
    messages: [],
    turns: [],
    createdAt,
    updatedAt: createdAt
  };
}

export function createUserMessage(input: {
  id: string;
  conversationId: string;
  content: string;
  createdAt?: string;
}): ChatMessage {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    conversationId: input.conversationId,
    role: "user",
    content: input.content,
    status: "completed",
    createdAt,
    completedAt: createdAt
  };
}

export function createAssistantMessage(input: {
  id: string;
  conversationId: string;
  createdAt?: string;
}): ChatMessage {
  return {
    id: input.id,
    conversationId: input.conversationId,
    role: "assistant",
    content: "",
    status: "streaming",
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function appendMessageDelta(
  message: ChatMessage,
  delta: string
): ChatMessage {
  return {
    ...message,
    content: `${message.content}${delta}`,
    status: "streaming"
  };
}

export function createConversationTurn(input: {
  id: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  selectedAgent: string;
  createdAt?: string;
}): ConversationTurn {
  return {
    id: input.id,
    conversationId: input.conversationId,
    userMessageId: input.userMessageId,
    assistantMessageId: input.assistantMessageId,
    selectedAgent: input.selectedAgent,
    status: "running",
    trace: [],
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function recoverInterruptedConversation(
  conversation: Conversation
): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.status === "streaming"
        ? { ...message, status: "failed", completedAt: message.completedAt }
        : message
    ),
    turns: conversation.turns.map((turn) =>
      turn.status === "running" ||
      turn.status === "planning" ||
      turn.status === "waiting_approval"
        ? { ...turn, status: "interrupted" }
        : turn
    )
  };
}

function deriveConversationTitle(firstPrompt?: string): string {
  const normalizedPrompt = firstPrompt?.trim();

  if (!normalizedPrompt) {
    return "新会话";
  }

  return normalizedPrompt.length > 28
    ? `${normalizedPrompt.slice(0, 28)}...`
    : normalizedPrompt;
}
```

- [ ] **Step 4: Run shared-domain tests and verify pass**

Run:

```bash
source ~/.profile
pnpm vitest run packages/shared/src/domain.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add packages/shared/src/domain.ts packages/shared/src/domain.test.ts
git commit -m "feat: add conversation domain types"
git push origin main
```

## Task 2: Runtime Conversation Event Stream

**Files:**
- Modify: `packages/runtime/src/runtime.ts`
- Modify: `packages/runtime/src/runtime.test.ts`

- [ ] **Step 1: Write failing runtime stream tests**

Add tests to `packages/runtime/src/runtime.test.ts` inside the existing `describe("智能体运行时", () => { ... })` block:

```ts
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
```

- [ ] **Step 2: Run runtime tests and verify failure**

Run:

```bash
source ~/.profile
pnpm vitest run packages/runtime/src/runtime.test.ts
```

Expected: FAIL because `runConversationTurn()` is not defined on `AgentRuntime`.

- [ ] **Step 3: Extend runtime type and imports**

Modify imports in `packages/runtime/src/runtime.ts`:

```ts
import {
  compareRisk,
  createConversationTurn,
  createAssistantMessage,
  type AgentTraceEvent,
  type ApprovalDecision,
  type PlanStep,
  type RiskLevel,
  type TaskRun,
  type ToolCall
} from "@local-agent/shared";
```

Change `AgentRuntime`:

```ts
export type RunConversationTurnInput = {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  prompt: string;
  selectedAgent: string;
};

export type AgentRuntime = {
  createTask(prompt: string): TaskRun;
  startTask(prompt: string): TaskRun;
  runConversationTurn(
    input: RunConversationTurnInput
  ): AsyncIterable<AgentTraceEvent>;
};
```

- [ ] **Step 4: Implement `runConversationTurn()`**

Inside `createRuntime()` return object, add:

```ts
    async *runConversationTurn(
      input: RunConversationTurnInput
    ): AsyncIterable<AgentTraceEvent> {
      const createdAt = new Date().toISOString();
      const turn = createConversationTurn({
        id: `turn-${Date.now()}`,
        conversationId: input.conversationId,
        userMessageId: input.userMessageId,
        assistantMessageId: input.assistantMessageId,
        selectedAgent: input.selectedAgent,
        createdAt
      });
      const assistantMessage = createAssistantMessage({
        id: input.assistantMessageId,
        conversationId: input.conversationId,
        createdAt
      });

      yield { type: "turn.started", turn, createdAt };
      yield { type: "message.started", message: assistantMessage, createdAt };

      const plan = createInitialPlan(input.prompt);
      const normalizedPlan = normalizePlanRisk(plan);

      for (const step of normalizedPlan.plan) {
        const stepStartedAt = new Date().toISOString();
        yield {
          type: "agent.step.started",
          step: {
            id: `${turn.id}-${step.id}`,
            turnId: turn.id,
            kind: "agent",
            title: step.title,
            agentId: step.agentId,
            status: "running",
            riskLevel: step.riskLevel,
            approvalRequired: step.approvalRequired,
            startedAt: stepStartedAt
          },
          createdAt: stepStartedAt
        };

        for (const toolCall of step.toolCalls) {
          const toolStartedAt = new Date().toISOString();
          const traceStepId = `${turn.id}-${toolCall.id}`;
          yield {
            type: "tool.started",
            step: {
              id: traceStepId,
              turnId: turn.id,
              kind: "tool",
              title: toolCall.pluginId,
              agentId: step.agentId,
              toolCallId: toolCall.id,
              pluginId: toolCall.pluginId,
              status: "running",
              riskLevel: toolCall.riskLevel,
              approvalRequired: toolCall.approvalRequired,
              input: toolCall.input,
              startedAt: toolStartedAt
            },
            createdAt: toolStartedAt
          };

          const decision = evaluateToolCall(toolCall).decision;
          if (decision === "require_approval") {
            yield {
              type: "approval.required",
              stepId: traceStepId,
              riskLevel: toolCall.riskLevel,
              createdAt: new Date().toISOString()
            };
          }

          yield {
            type: "tool.completed",
            stepId: traceStepId,
            output: {
              summary: `${toolCall.pluginId} 已完成模拟调用`
            },
            policyDecision: decision,
            createdAt: new Date().toISOString()
          };
        }

        yield {
          type: "agent.step.completed",
          stepId: `${turn.id}-${step.id}`,
          createdAt: new Date().toISOString()
        };
      }

      const response = createSimulatedAssistantResponse(
        input.prompt,
        normalizedPlan.plan
      );
      for (const delta of chunkText(response, 12)) {
        yield {
          type: "message.delta",
          messageId: input.assistantMessageId,
          delta,
          createdAt: new Date().toISOString()
        };
      }

      yield {
        type: "message.completed",
        messageId: input.assistantMessageId,
        content: response,
        createdAt: new Date().toISOString()
      };
      yield {
        type: "turn.completed",
        turnId: turn.id,
        createdAt: new Date().toISOString()
      };
    }
```

Add helper functions below `createPlannedTaskRun()`:

```ts
function normalizePlanRisk(plan: PlanStep[]): { plan: PlanStep[] } {
  return {
    plan: plan.map((step) => {
      const toolCalls = step.toolCalls.map((toolCall) => {
        const plugin = pluginRegistry.get(toolCall.pluginId);

        if (!plugin) {
          return {
            ...toolCall,
            approvalRequired: true
          };
        }

        const canonicalToolCall = {
          ...toolCall,
          riskLevel: plugin.riskLevel
        };
        const decision = evaluateToolCall(canonicalToolCall).decision;

        return {
          ...canonicalToolCall,
          approvalRequired: decision === "require_approval"
        };
      });

      return {
        ...step,
        toolCalls,
        riskLevel: highestToolCallRisk(toolCalls, step.riskLevel),
        approvalRequired: toolCalls.some((toolCall) => toolCall.approvalRequired)
      };
    })
  };
}

function createSimulatedAssistantResponse(
  prompt: string,
  plan: PlanStep[]
): string {
  const stepTitles = plan.map((step) => step.title).join("、");
  return `已收到：${prompt}。我会按 ${stepTitles} 的流程处理，并在右侧展示 agent 与工具调用过程。`;
}

function chunkText(value: string, size: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}
```

- [ ] **Step 5: Run runtime tests and verify pass**

Run:

```bash
source ~/.profile
pnpm vitest run packages/runtime/src/runtime.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit and push**

```bash
git add packages/runtime/src/runtime.ts packages/runtime/src/runtime.test.ts
git commit -m "feat: stream conversation runtime events"
git push origin main
```

## Task 3: Frontend Conversation Store and Reducer

**Files:**
- Create: `apps/desktop/src/conversation-store.ts`
- Create: `apps/desktop/src/conversation-store.test.ts`
- Create: `apps/desktop/src/conversation-reducer.ts`
- Create: `apps/desktop/src/conversation-reducer.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `apps/desktop/src/conversation-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  createConversation,
  createConversationTurn,
  createUserMessage
} from "@local-agent/shared";
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
```

- [ ] **Step 2: Write failing reducer tests**

Create `apps/desktop/src/conversation-reducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createAssistantMessage,
  createConversation,
  createConversationTurn,
  createUserMessage,
  type AgentTraceEvent
} from "@local-agent/shared";
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
```

- [ ] **Step 3: Run frontend store/reducer tests and verify failure**

Run:

```bash
source ~/.profile
pnpm vitest run apps/desktop/src/conversation-store.test.ts apps/desktop/src/conversation-reducer.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement local conversation store**

Create `apps/desktop/src/conversation-store.ts`:

```ts
import {
  recoverInterruptedConversation,
  type Conversation
} from "@local-agent/shared";

export type StoredConversationState = {
  currentConversationId?: string;
  conversations: Conversation[];
};

export type ConversationStore = {
  load(): StoredConversationState;
  save(state: StoredConversationState): void;
};

const defaultStorageKey = "agent-studio:conversations";

export function createLocalConversationStore(
  storageKey = defaultStorageKey
): ConversationStore {
  return {
    load(): StoredConversationState {
      const rawValue = localStorage.getItem(storageKey);
      if (!rawValue) {
        return { conversations: [] };
      }

      try {
        const parsed = JSON.parse(rawValue) as StoredConversationState;
        return {
          currentConversationId: parsed.currentConversationId,
          conversations: parsed.conversations.map(recoverInterruptedConversation)
        };
      } catch {
        return { conversations: [] };
      }
    },
    save(state: StoredConversationState): void {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  };
}
```

- [ ] **Step 5: Implement conversation reducer helpers**

Create `apps/desktop/src/conversation-reducer.ts`:

```ts
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
```

- [ ] **Step 6: Run store/reducer tests and verify pass**

Run:

```bash
source ~/.profile
pnpm vitest run apps/desktop/src/conversation-store.test.ts apps/desktop/src/conversation-reducer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit and push**

```bash
git add apps/desktop/src/conversation-store.ts apps/desktop/src/conversation-store.test.ts apps/desktop/src/conversation-reducer.ts apps/desktop/src/conversation-reducer.test.ts
git commit -m "feat: persist conversation state"
git push origin main
```

## Task 4: Tailwind Setup and Session UI Shell

**Files:**
- Modify: `apps/desktop/package.json`
- Create: `apps/desktop/tailwind.config.js`
- Create: `apps/desktop/postcss.config.js`
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/App.test.tsx`

- [ ] **Step 1: Install UI dependencies**

Run:

```bash
source ~/.profile
pnpm --filter @local-agent/desktop add lucide-react
pnpm --filter @local-agent/desktop add -D tailwindcss postcss autoprefixer
```

Expected: `apps/desktop/package.json` and `pnpm-lock.yaml` update.

- [ ] **Step 2: Add Tailwind config files**

Create `apps/desktop/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#f6f7f9",
          panel: "#ffffff",
          line: "#e2e6ee",
          muted: "#7b8493",
          ink: "#171a22",
          accent: "#7c8cff"
        }
      }
    }
  },
  plugins: []
};
```

Create `apps/desktop/postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 3: Replace global CSS with Tailwind base**

Replace `apps/desktop/src/styles.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color: #171a22;
  background: #f6f7f9;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
textarea,
input {
  font: inherit;
}
```

- [ ] **Step 4: Write failing UI tests for session shell**

Replace `apps/desktop/src/App.test.tsx` with:

```tsx
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("渲染 Agent Studio 会话外壳", () => {
    render(createElement(App));

    expect(screen.getByText("Agent Studio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新会话" })).toBeInTheDocument();
    expect(screen.getByText("Hi，今天有什么安排？")).toBeInTheDocument();
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument();
    expect(screen.getByText("调用流程")).toBeInTheDocument();
  });

  it("发送消息后显示流式助手回复和工具流程", async () => {
    render(createElement(App));

    fireEvent.change(screen.getByLabelText("发送消息"), {
      target: { value: "总结这个 PDF" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("总结这个 PDF")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/已收到：总结这个 PDF/)).toBeInTheDocument();
    });
    expect(screen.getByText("pdf.extract")).toBeInTheDocument();
  });

  it("刷新后恢复历史会话", async () => {
    const { unmount } = render(createElement(App));

    fireEvent.change(screen.getByLabelText("发送消息"), {
      target: { value: "整理 Downloads 里的发票" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));
    await screen.findByText("整理 Downloads 里的发票");

    unmount();
    render(createElement(App));

    expect(screen.getAllByText("整理 Downloads 里的发票").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run UI tests and verify failure**

Run:

```bash
source ~/.profile
pnpm vitest run apps/desktop/src/App.test.tsx
```

Expected: FAIL because the app still renders the old task-plan console.

- [ ] **Step 6: Replace App with session UI**

Replace `apps/desktop/src/App.tsx` with the implementation from the spec:

```tsx
import { createRuntime } from "@local-agent/runtime";
import type { Conversation, ConversationTurn, TraceStep } from "@local-agent/shared";
import {
  Bot,
  CalendarClock,
  ChevronDown,
  Folder,
  List,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles
} from "lucide-react";
import {
  createElement,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  appendUserMessage,
  applyTraceEvent,
  createEmptyConversationState,
  type ConversationState
} from "./conversation-reducer";
import { createLocalConversationStore } from "./conversation-store";

const runtime = createRuntime();
const store = createLocalConversationStore();

export function App(): ReactElement {
  const [state, setState] = useState<ConversationState>(() => {
    const loaded = store.load();
    return loaded.conversations.length > 0 ? loaded : createEmptyConversationState();
  });
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const currentConversation = useMemo(
    () =>
      state.conversations.find(
        (conversation) => conversation.id === state.currentConversationId
      ),
    [state]
  );
  const latestTurn = currentConversation?.turns.at(-1);

  useEffect(() => {
    store.save(state);
  }, [state]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isStreaming) {
      return;
    }

    const createdAt = new Date().toISOString();
    const conversationId =
      currentConversation?.id ?? `conversation-${Date.now()}`;
    const userMessageId = `message-user-${Date.now()}`;
    const assistantMessageId = `message-assistant-${Date.now()}`;
    const nextState = appendUserMessage(state, trimmedPrompt, {
      conversationId,
      messageId: userMessageId,
      createdAt
    });

    setState(nextState);
    setPrompt("");
    setIsStreaming(true);

    let streamingState = nextState;
    try {
      for await (const traceEvent of runtime.runConversationTurn({
        conversationId,
        userMessageId,
        assistantMessageId,
        prompt: trimmedPrompt,
        selectedAgent: "planner"
      })) {
        streamingState = applyTraceEvent(streamingState, traceEvent);
        setState(streamingState);
      }
    } finally {
      setIsStreaming(false);
    }
  }

  function startNewConversation() {
    setState({ ...state, currentConversationId: undefined });
    setPrompt("");
  }

  return createElement(
    "main",
    { className: "flex min-h-screen bg-studio-bg text-studio-ink" },
    createElement(Sidebar, {
      conversations: state.conversations,
      currentConversationId: state.currentConversationId,
      onSelectConversation: (conversationId: string) =>
        setState({ ...state, currentConversationId: conversationId }),
      onNewConversation: startNewConversation
    }),
    createElement(
      "section",
      { className: "flex min-w-0 flex-1 flex-col" },
      createElement(TopBar),
      currentConversation
        ? createElement(ConversationView, {
            conversation: currentConversation,
            prompt,
            isStreaming,
            onPromptChange: setPrompt,
            onSubmit: sendMessage
          })
        : createElement(HomeComposer, {
            prompt,
            isStreaming,
            onPromptChange: setPrompt,
            onSubmit: sendMessage
          })
    ),
    createElement(TracePanel, { turn: latestTurn })
  );
}

function Sidebar(props: {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation(conversationId: string): void;
  onNewConversation(): void;
}): ReactElement {
  return createElement(
    "aside",
    { className: "hidden w-80 shrink-0 flex-col border-r border-studio-line bg-[#eef1f5] p-5 md:flex" },
    createElement(
      "div",
      { className: "mb-7 flex items-center gap-3" },
      createElement(
        "div",
        { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white" },
        createElement(Sparkles, { size: 22 })
      ),
      createElement("strong", { className: "text-2xl" }, "Agent Studio")
    ),
    createElement(
      "nav",
      { className: "grid gap-2 border-b border-studio-line pb-5" },
      createElement(SidebarButton, {
        icon: Plus,
        label: "新会话",
        onClick: props.onNewConversation
      }),
      createElement(SidebarButton, { icon: Search, label: "搜索" }),
      createElement(SidebarButton, { icon: CalendarClock, label: "定时任务" })
    ),
    createElement(
      "div",
      { className: "mt-5 flex items-center justify-between text-sm font-semibold text-studio-muted" },
      createElement("span", null, "会话"),
      createElement(List, { size: 18 })
    ),
    createElement(
      "div",
      { className: "mt-3 grid gap-2 overflow-y-auto" },
      props.conversations.length === 0
        ? createElement("p", { className: "mt-24 text-center text-sm text-studio-muted" }, "暂无对话历史")
        : props.conversations.map((conversation) =>
            createElement(
              "button",
              {
                key: conversation.id,
                type: "button",
                onClick: () => props.onSelectConversation(conversation.id),
                className: `truncate rounded-lg px-3 py-2 text-left text-sm ${
                  conversation.id === props.currentConversationId
                    ? "bg-white font-semibold shadow-sm"
                    : "text-studio-muted hover:bg-white/70"
                }`
              },
              conversation.title
            )
          )
    ),
    createElement(
      "div",
      { className: "mt-auto" },
      createElement(SidebarButton, { icon: Settings, label: "设置" })
    )
  );
}

function SidebarButton(props: {
  icon: typeof Plus;
  label: string;
  onClick?(): void;
}): ReactElement {
  return createElement(
    "button",
    {
      type: "button",
      onClick: props.onClick,
      className: "flex items-center gap-3 rounded-lg px-2 py-2 text-left font-semibold hover:bg-white/70"
    },
    createElement(props.icon, { size: 22 }),
    createElement("span", null, props.label)
  );
}

function TopBar(): ReactElement {
  return createElement(
    "header",
    { className: "relative flex h-16 items-center justify-center border-b border-studio-line bg-studio-bg" },
    createElement("strong", null, "Agent Studio"),
    createElement(
      "button",
      { type: "button", className: "absolute right-5 rounded-xl border border-studio-line bg-white px-4 py-2 text-sm font-semibold shadow-sm" },
      "Skills Market"
    )
  );
}

function HomeComposer(props: ComposerProps): ReactElement {
  return createElement(
    "div",
    { className: "flex flex-1 items-center justify-center px-6" },
    createElement(
      "div",
      { className: "w-full max-w-4xl" },
      createElement("h1", { className: "mb-6 text-center text-3xl font-bold" }, "Hi，今天有什么安排？"),
      createElement(
        "div",
        { className: "mb-7 flex justify-center" },
        createElement(
          "div",
          { className: "flex items-center gap-3 rounded-full bg-[#e8ebf6] p-2 text-sm font-semibold" },
          createElement("span", { className: "rounded-full bg-white px-4 py-2" }, "Agent CLI"),
          createElement(Sparkles, { size: 18, className: "text-studio-accent" }),
          createElement(Plus, { size: 18 })
        )
      ),
      createElement(Composer, props),
      createElement(
        "div",
        { className: "mt-5 flex flex-wrap justify-center gap-3 text-sm text-slate-600" },
        ["故事角色扮演", "Beautiful Mermaid", "学术论文助手", "Excel 表格助手", "Word 文档助手"].map((item) =>
          createElement("span", { key: item, className: "rounded-full border border-studio-line bg-white px-4 py-2 shadow-sm" }, item)
        )
      )
    )
  );
}

type ComposerProps = {
  prompt: string;
  isStreaming: boolean;
  onPromptChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
};

function Composer(props: ComposerProps): ReactElement {
  return createElement(
    "form",
    { onSubmit: props.onSubmit, className: "rounded-2xl border border-[#d8dcff] bg-white p-4 shadow-[0_18px_60px_rgba(124,140,255,0.14)]" },
    createElement("textarea", {
      "aria-label": "发送消息",
      value: props.prompt,
      onChange: (event: ChangeEvent<HTMLTextAreaElement>) =>
        props.onPromptChange(event.currentTarget.value),
      placeholder: "发消息、上传文件、打开文件夹或创建定时任务...",
      className: "min-h-24 w-full resize-none border-0 bg-transparent text-lg outline-none placeholder:text-slate-400",
      disabled: props.isStreaming
    }),
    createElement(
      "div",
      { className: "flex items-center gap-5 text-sm text-slate-500" },
      createElement(Plus, { size: 18 }),
      createElement("span", { className: "flex items-center gap-2" }, createElement(Folder, { size: 18 }), "关联文件夹"),
      createElement("span", { className: "flex items-center gap-2" }, createElement(Bot, { size: 18 }), "默认模型", createElement(ChevronDown, { size: 14 })),
      createElement("span", { className: "flex items-center gap-2" }, createElement(Shield, { size: 18 }), "权限 · 默认", createElement(ChevronDown, { size: 14 })),
      createElement(
        "button",
        { type: "submit", disabled: props.isStreaming, className: "ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#e2e5ef] text-slate-500 disabled:opacity-60", "aria-label": "发送" },
        createElement(Send, { size: 18 })
      )
    )
  );
}

function ConversationView(props: {
  conversation: Conversation;
  prompt: string;
  isStreaming: boolean;
  onPromptChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}): ReactElement {
  return createElement(
    "div",
    { className: "mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-6 py-6" },
    createElement("h1", { className: "mb-4 truncate text-xl font-bold" }, props.conversation.title),
    createElement(
      "div",
      { className: "flex-1 space-y-4 overflow-y-auto pb-5" },
      props.conversation.messages.map((message) =>
        createElement(
          "div",
          {
            key: message.id,
            className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`
          },
          createElement(
            "div",
            {
              className: `max-w-[78%] rounded-2xl px-4 py-3 leading-7 ${
                message.role === "user"
                  ? "bg-black text-white"
                  : "border border-studio-line bg-white text-studio-ink shadow-sm"
              }`
            },
            message.content || "正在思考..."
          )
        )
      )
    ),
    createElement(Composer, {
      prompt: props.prompt,
      isStreaming: props.isStreaming,
      onPromptChange: props.onPromptChange,
      onSubmit: props.onSubmit
    })
  );
}

function TracePanel(props: { turn?: ConversationTurn }): ReactElement {
  return createElement(
    "aside",
    { className: "hidden w-96 shrink-0 border-l border-studio-line bg-white p-5 xl:block" },
    createElement("h2", { className: "mb-4 text-lg font-bold" }, "调用流程"),
    props.turn
      ? createElement(
          "div",
          { className: "space-y-3" },
          props.turn.trace.map((step) => createElement(TraceTimelineItem, { key: step.id, step }))
        )
      : createElement("p", { className: "mt-20 text-center text-sm text-studio-muted" }, "发送消息后显示 agent 和工具链调用过程")
  );
}

function TraceTimelineItem(props: { step: TraceStep }): ReactElement {
  return createElement(
    "details",
    { className: "rounded-lg border border-studio-line bg-studio-bg p-3" },
    createElement(
      "summary",
      { className: "cursor-pointer list-none font-semibold" },
      props.step.title
    ),
    createElement(
      "dl",
      { className: "mt-3 grid gap-2 text-xs text-slate-600" },
      createElement("div", null, "状态：", props.step.status),
      props.step.riskLevel ? createElement("div", null, "风险：", props.step.riskLevel) : null,
      props.step.policyDecision ? createElement("div", null, "策略：", props.step.policyDecision) : null,
      props.step.input ? createElement("pre", { className: "overflow-auto rounded bg-white p-2" }, JSON.stringify(props.step.input, null, 2)) : null,
      props.step.output ? createElement("pre", { className: "overflow-auto rounded bg-white p-2" }, JSON.stringify(props.step.output, null, 2)) : null
    )
  );
}
```

- [ ] **Step 7: Run UI tests and fix type issues**

Run:

```bash
source ~/.profile
pnpm vitest run apps/desktop/src/App.test.tsx
pnpm --filter @local-agent/desktop typecheck
```

Expected: PASS. If Tailwind v4 changes PostCSS plugin behavior, pin Tailwind to the compatible v3 version by running:

```bash
source ~/.profile
pnpm --filter @local-agent/desktop add -D tailwindcss@^3.4.17 postcss autoprefixer
```

- [ ] **Step 8: Commit and push**

```bash
git add apps/desktop/package.json pnpm-lock.yaml apps/desktop/tailwind.config.js apps/desktop/postcss.config.js apps/desktop/src/styles.css apps/desktop/src/App.tsx apps/desktop/src/App.test.tsx
git commit -m "feat: add session chat interface"
git push origin main
```

## Task 5: Full Verification and Documentation Update

**Files:**
- Modify: `README.md`
- Modify: `docs/mvp-foundation-verification.md`

- [ ] **Step 1: Update README feature description**

In `README.md`, update the project capabilities list so it includes:

```md
- 会话工作台：新建会话、发送消息、流式 assistant 输出、本地历史恢复。
- 调用流程面板：实时展示 agent 步骤、工具调用、风险审批和模拟输出。
```

Update the MVP scope section to say the current version uses simulated tool execution and does not connect to real model providers.

- [ ] **Step 2: Update verification notes**

Append to `docs/mvp-foundation-verification.md`:

```md
## Agent Studio 会话验收

- 新建会话后可以发送消息。
- assistant 内容以流式片段展示。
- 调用流程面板显示 agent 步骤和工具调用。
- 展开工具节点可查看输入、模拟输出、策略决策和风险。
- 刷新前端后，会话历史、消息和流程快照可恢复。
```

- [ ] **Step 3: Run full verification**

Run:

```bash
source ~/.profile
pnpm test
pnpm typecheck
pnpm --filter @local-agent/desktop build
```

Expected: all commands exit 0.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only README and verification docs are uncommitted for this task.

- [ ] **Step 5: Commit and push**

```bash
git add README.md docs/mvp-foundation-verification.md
git commit -m "docs: document session workspace verification"
git push origin main
```

## Execution Rule

After each task above:

1. Run that task's verification commands.
2. Commit only the files owned by that task.
3. Push immediately with `git push origin main`.
4. Confirm `git status --short --branch` before moving to the next task.

This follows the user requirement that each completed step be committed and pushed to remote Git before continuing.
