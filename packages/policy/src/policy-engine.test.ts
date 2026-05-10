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

describe("policy engine", () => {
  it("allows low and medium risk tool calls", () => {
    expect(evaluateToolCall(toolCall({ riskLevel: "low" }))).toEqual({
      decision: "allow",
      reason: "low risk tool call is allowed"
    });
    expect(evaluateToolCall(toolCall({ riskLevel: "medium" }))).toEqual({
      decision: "allow",
      reason: "medium risk tool call is allowed"
    });
  });

  it("requires approval for high risk tool calls with a reason containing high", () => {
    const result = evaluateToolCall(toolCall({ riskLevel: "high" }));

    expect(result.decision).toBe("require_approval");
    expect(result.reason).toContain("high");
  });

  it("denies disabled critical plugin calls", () => {
    for (const pluginId of ["file.delete", "email.send", "shell.exec"]) {
      expect(evaluateToolCall(toolCall({ pluginId, riskLevel: "critical" })).decision).toBe("deny");
    }
  });

  it("requires approval for mouse clicks on sensitive payment text", () => {
    const result = evaluateToolCall(
      toolCall({
        pluginId: "mouse.click",
        input: { visibleText: "Submit payment" },
        riskLevel: "low"
      })
    );

    expect(result.decision).toBe("require_approval");
  });

  it("denies keyboard typing into password fields", () => {
    const result = evaluateToolCall(
      toolCall({
        pluginId: "keyboard.type",
        input: { fieldRole: "password" },
        riskLevel: "low"
      })
    );

    expect(result.decision).toBe("deny");
  });

  it("denies keyboard typing into sensitive labeled fields", () => {
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
