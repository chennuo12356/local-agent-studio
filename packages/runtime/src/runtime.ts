import { createInitialPlan } from "@local-agent/agents";
import { evaluateToolCall } from "@local-agent/policy";
import { builtinPlugins, createPluginRegistry } from "@local-agent/plugins";
import {
  compareRisk,
  createAssistantMessage,
  createConversationTurn,
  createTaskRun,
  type AgentTraceEvent,
  type ApprovalDecision,
  type PlanStep,
  type RiskLevel,
  type TaskRun,
  type ToolCall
} from "@local-agent/shared";

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
    },
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

      const plan = normalizePlanRisk(createInitialPlan(input.prompt));

      for (const step of plan) {
        const stepStartedAt = new Date().toISOString();
        const agentTraceStepId = `${turn.id}-${step.id}`;

        yield {
          type: "agent.step.started",
          step: {
            id: agentTraceStepId,
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
          stepId: agentTraceStepId,
          createdAt: new Date().toISOString()
        };
      }

      const response = createSimulatedAssistantResponse(input.prompt, plan);
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

function normalizePlanRisk(plan: PlanStep[]): PlanStep[] {
  return plan.map((step) => {
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
  });
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
