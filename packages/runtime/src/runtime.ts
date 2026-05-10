import { createInitialPlan } from "@local-agent/agents";
import { evaluateToolCall } from "@local-agent/policy";
import { builtinPlugins, createPluginRegistry } from "@local-agent/plugins";
import {
  compareRisk,
  createTaskRun,
  type ApprovalDecision,
  type RiskLevel,
  type TaskRun,
  type ToolCall
} from "@local-agent/shared";

export type AgentRuntime = {
  createTask(prompt: string): TaskRun;
  startTask(prompt: string): TaskRun;
};

const pluginRegistry = createPluginRegistry(builtinPlugins);

export function createRuntime(): AgentRuntime {
  return {
    createTask(prompt: string): TaskRun {
      return createPlannedTaskRun(prompt);
    },
    startTask(prompt: string): TaskRun {
      const taskRun = createPlannedTaskRun(prompt);
      const policyDecisions: ApprovalDecision[] = [];
      let hasUnknownPlugin = false;
      const plan = taskRun.plan.map((step) => {
        const canonicalToolCalls = step.toolCalls.map((toolCall) => {
          const plugin = pluginRegistry.get(toolCall.pluginId);

          if (!plugin) {
            hasUnknownPlugin = true;
            return toolCall;
          }

          const canonicalToolCall = {
            ...toolCall,
            pluginId: toolCall.pluginId,
            input: toolCall.input,
            riskLevel: plugin.riskLevel
          };
          const decision = evaluateToolCall(canonicalToolCall).decision;
          policyDecisions.push(decision);

          return {
            ...toolCall,
            riskLevel: plugin.riskLevel,
            approvalRequired: decision === "require_approval"
          };
        });

        return {
          ...step,
          toolCalls: canonicalToolCalls,
          riskLevel: highestToolCallRisk(canonicalToolCalls, step.riskLevel),
          approvalRequired: canonicalToolCalls.some(
            (toolCall) => toolCall.approvalRequired
          )
        };
      });
      const hasDeniedDecision = policyDecisions.some(
        (decision) => decision === "deny"
      );
      const needsApproval = policyDecisions.some(
        (decision) => decision === "require_approval"
      );
      const status = hasDeniedDecision || hasUnknownPlugin
        ? "failed"
        : needsApproval
          ? "waiting_approval"
          : "completed";

      return {
        ...taskRun,
        plan,
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

function highestToolCallRisk(
  toolCalls: ToolCall[],
  fallbackRiskLevel: RiskLevel
): RiskLevel {
  if (toolCalls.length === 0) {
    return fallbackRiskLevel;
  }

  return toolCalls.reduce<RiskLevel>(
    (highestRiskLevel, toolCall) =>
      compareRisk(toolCall.riskLevel, highestRiskLevel) > 0
        ? toolCall.riskLevel
        : highestRiskLevel,
    toolCalls[0].riskLevel
  );
}
