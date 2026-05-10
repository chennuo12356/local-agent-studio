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
      reason: `${call.pluginId} 已被策略禁用`
    };
  }

  if (call.pluginId === "keyboard.type" && isSensitiveKeyboardInput(call.input)) {
    return {
      decision: "deny",
      reason: "禁止向密码或验证码字段自动输入"
    };
  }

  if (call.pluginId === "mouse.click" && hasSensitiveVisibleText(call.input)) {
    return {
      decision: "require_approval",
      reason: "点击敏感可见文本需要审批"
    };
  }

  if (call.riskLevel === "high") {
    return {
      decision: "require_approval",
      reason: "高风险工具调用需要审批"
    };
  }

  if (call.riskLevel === "critical") {
    return {
      decision: "require_approval",
      reason: "严重风险工具调用需要审批"
    };
  }

  return {
    decision: "allow",
    reason: `${formatRiskLevel(call.riskLevel)}风险工具调用已允许`
  };
}

function formatRiskLevel(riskLevel: RiskLevel): string {
  const riskLabels: Record<RiskLevel, string> = {
    low: "低",
    medium: "中",
    high: "高",
    critical: "严重"
  };

  return riskLabels[riskLevel];
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
