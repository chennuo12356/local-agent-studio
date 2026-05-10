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
