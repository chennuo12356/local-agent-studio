import { describe, expect, it } from "vitest";
import type { PolicyInput } from "./policy-engine";
import { evaluateToolCall } from "./policy-engine";

function toolCall(overrides: Partial<PolicyInput>): PolicyInput {
  return {
    pluginId: "notes.read",
    input: {},
    riskLevel: "low",
    ...overrides
  };
}

describe("策略引擎", () => {
  it("允许低风险和中风险工具调用", () => {
    expect(evaluateToolCall(toolCall({ riskLevel: "low" }))).toEqual({
      decision: "allow",
      reason: "低风险工具调用已允许"
    });
    expect(evaluateToolCall(toolCall({ riskLevel: "medium" }))).toEqual({
      decision: "allow",
      reason: "中风险工具调用已允许"
    });
  });

  it("高风险工具调用需要审批，原因中包含高风险", () => {
    const result = evaluateToolCall(toolCall({ riskLevel: "high" }));

    expect(result.decision).toBe("require_approval");
    expect(result.reason).toContain("高风险");
  });

  it("拒绝已禁用的严重风险插件调用", () => {
    for (const pluginId of ["file.delete", "email.send", "shell.exec"]) {
      expect(evaluateToolCall(toolCall({ pluginId, riskLevel: "critical" })).decision).toBe("deny");
    }
  });

  it("点击敏感付款文本时需要审批", () => {
    const result = evaluateToolCall(
      toolCall({
        pluginId: "mouse.click",
        input: { visibleText: "Submit payment" },
        riskLevel: "low"
      })
    );

    expect(result.decision).toBe("require_approval");
  });

  it("拒绝向密码字段输入键盘文本", () => {
    const result = evaluateToolCall(
      toolCall({
        pluginId: "keyboard.type",
        input: { fieldRole: "password" },
        riskLevel: "low"
      })
    );

    expect(result.decision).toBe("deny");
  });

  it("拒绝向敏感标签字段输入键盘文本", () => {
    for (const label of ["Password", "Verification code", "OTP"]) {
      expect(
        evaluateToolCall(
          toolCall({
            pluginId: "keyboard.type",
            input: { label },
            riskLevel: "low"
          })
        ).decision
      ).toBe("deny");
    }
  });
});
