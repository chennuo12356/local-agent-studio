import { createInitialPlan } from "@local-agent/agents";
import { evaluateToolCall } from "@local-agent/policy";
import { createTaskRun, type TaskRun } from "@local-agent/shared";

export type AgentRuntime = {
  createTask(prompt: string): TaskRun;
  startTask(prompt: string): TaskRun;
};

export function createRuntime(): AgentRuntime {
  return {
    createTask(prompt: string): TaskRun {
      return createPlannedTaskRun(prompt);
    },
    startTask(prompt: string): TaskRun {
      const taskRun = createPlannedTaskRun(prompt);
      const policyDecisions = taskRun.plan.flatMap((step) =>
        step.toolCalls.map((toolCall) => evaluateToolCall(toolCall).decision)
      );
      const hasDeniedDecision = policyDecisions.some(
        (decision) => decision === "deny"
      );
      const needsApproval = policyDecisions.some(
        (decision) => decision === "require_approval"
      );
      const status = hasDeniedDecision
        ? "failed"
        : needsApproval
          ? "waiting_approval"
          : "completed";

      return {
        ...taskRun,
        status,
        completedAt: status === "completed" ? new Date().toISOString() : undefined
      };
    }
  };
}

function createPlannedTaskRun(prompt: string): TaskRun {
  return {
    ...createTaskRun({
      id: `task-${Date.now()}`,
      userPrompt: prompt,
      selectedAgent: "planner"
    }),
    plan: createInitialPlan(prompt)
  };
}
