import type { ApprovalDecision, RiskLevel } from "@local-agent/shared";

export type PolicyInput = {
  pluginId: string;
  riskLevel: RiskLevel;
  input: Record<string, unknown>;
};

export type PolicyResult = {
  decision: ApprovalDecision;
  reason: string;
};

const disabledCriticalPluginIds = new Set(["file.delete", "email.send", "shell.exec"]);

const sensitiveMouseLabels = [
  "send",
  "submit",
  "delete",
  "pay",
  "confirm",
  "purchase",
  "authorize",
  "install",
  "发送",
  "提交",
  "删除",
  "付款",
  "确认",
  "购买",
  "授权",
  "安装"
];

export function evaluateToolCall(call: PolicyInput): PolicyResult {
  if (disabledCriticalPluginIds.has(call.pluginId)) {
    return {
      decision: "deny",
      reason: `${call.pluginId} is disabled by policy`
    };
  }

  if (call.pluginId === "keyboard.type" && isSensitiveKeyboardInput(call.input)) {
    return {
      decision: "deny",
      reason: "keyboard input into password or verification fields is denied"
    };
  }

  if (call.pluginId === "mouse.click" && hasSensitiveVisibleText(call.input)) {
    return {
      decision: "require_approval",
      reason: "mouse click on sensitive visible text requires approval"
    };
  }

  if (call.riskLevel === "high") {
    return {
      decision: "require_approval",
      reason: "high risk tool call requires approval"
    };
  }

  if (call.riskLevel === "critical") {
    return {
      decision: "require_approval",
      reason: "critical risk tool call requires approval"
    };
  }

  return {
    decision: "allow",
    reason: `${call.riskLevel} risk tool call is allowed`
  };
}

function isSensitiveKeyboardInput(input: Record<string, unknown>): boolean {
  const fieldRole = stringValue(input.fieldRole).toLowerCase();
  const label = stringValue(input.label).toLowerCase();

  return (
    fieldRole.includes("password") ||
    fieldRole.includes("verification") ||
    label.includes("password") ||
    label.includes("verification") ||
    label.includes("otp") ||
    label.includes("验证码")
  );
}

function hasSensitiveVisibleText(input: Record<string, unknown>): boolean {
  const visibleText = stringValue(input.visibleText).toLowerCase();

  return sensitiveMouseLabels.some((label) => visibleText.includes(label));
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
