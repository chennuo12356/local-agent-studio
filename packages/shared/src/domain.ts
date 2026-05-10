export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TaskStatus =
  | "planning"
  | "waiting_approval"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type StepStatus =
  | "pending"
  | "running"
  | "approved"
  | "completed"
  | "failed"
  | "skipped";

export type ApprovalDecision = "allow" | "require_approval" | "deny";

export type Artifact = {
  id: string;
  taskId: string;
  kind: "screenshot" | "document" | "report" | "data";
  path: string;
  sha256?: string;
};

export type TaskEvent = {
  id: string;
  taskId: string;
  type: "user" | "audit" | "debug";
  message: string;
  createdAt: string;
};

export type ToolCall = {
  id: string;
  pluginId: string;
  input: Record<string, unknown>;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
};

export type PlanStep = {
  id: string;
  title: string;
  agentId: string;
  toolCalls: ToolCall[];
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  status: StepStatus;
};

export type TaskRun = {
  id: string;
  userPrompt: string;
  selectedAgent: string;
  status: TaskStatus;
  plan: PlanStep[];
  events: TaskEvent[];
  artifacts: Artifact[];
  createdAt: string;
  completedAt?: string;
};

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

export type AgentProfile = {
  id: string;
  name: string;
  description: string;
  allowedPlugins: string[];
  modelPolicy: string;
  defaultRiskTolerance: Exclude<RiskLevel, "critical">;
};

export type Permission = {
  kind: "screen" | "window" | "app" | "mouse" | "keyboard" | "clipboard" | "file" | "document" | "email";
  scope: string;
};

export type ToolPlugin = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inputSchema: unknown;
  outputSchema: unknown;
  riskLevel: RiskLevel;
  reversible: boolean;
};

const riskOrder: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

export function compareRisk(left: RiskLevel, right: RiskLevel): number {
  return riskOrder[left] - riskOrder[right];
}

export function createTaskRun(input: {
  id: string;
  userPrompt: string;
  selectedAgent: string;
  createdAt?: string;
}): TaskRun {
  return {
    id: input.id,
    userPrompt: input.userPrompt,
    selectedAgent: input.selectedAgent,
    status: "planning",
    plan: [],
    events: [],
    artifacts: [],
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function createConversation(input: {
  id: string;
  firstPrompt?: string;
  createdAt?: string;
}): Conversation {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    title: deriveConversationTitle(input.firstPrompt),
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
        ? { ...message, status: "failed" }
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
