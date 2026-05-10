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
      const needsApproval = policyDecisions.some(
        (decision) => decision === "require_approval"
      );

      return {
        ...taskRun,
        status: needsApproval ? "waiting_approval" : "completed",
        completedAt: needsApproval ? undefined : new Date().toISOString()
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
