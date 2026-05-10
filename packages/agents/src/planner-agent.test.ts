import { describe, expect, it } from "vitest";
import { createInitialPlan, defaultAgentProfiles } from "./index";

describe("planner agent", () => {
  it("defines the four MVP agents", () => {
    expect(defaultAgentProfiles.map((agent) => agent.id)).toEqual([
      "planner",
      "desktop",
      "file",
      "office"
    ]);
  });

  it("routes file organization prompts to the file agent", () => {
    const plan = createInitialPlan("organize my Downloads invoices");

    expect(plan[0]?.agentId).toBe("file");
    expect(plan.some((step) => step.approvalRequired)).toBe(true);
  });

  it("routes PDF and spreadsheet prompts to the office agent", () => {
    expect(createInitialPlan("summarize this PDF")[0]?.agentId).toBe("office");
    expect(createInitialPlan("read this spreadsheet")[0]?.agentId).toBe("office");
  });
});
