import { describe, expect, it } from "vitest";
import { createInitialPlan, defaultAgentProfiles } from "./index";

describe("规划智能体", () => {
  it("定义四个 MVP 智能体", () => {
    expect(defaultAgentProfiles.map((agent) => agent.id)).toEqual([
      "planner",
      "desktop",
      "file",
      "office"
    ]);
  });

  it("将文件整理提示路由到文件智能体", () => {
    const plan = createInitialPlan("整理 Downloads 里的发票");

    expect(plan[0]?.agentId).toBe("file");
    expect(plan.some((step) => step.approvalRequired)).toBe(true);
  });

  it("将 PDF 和表格提示路由到办公智能体", () => {
    expect(createInitialPlan("总结这个 PDF")[0]?.agentId).toBe("office");
    expect(createInitialPlan("读取这个表格")[0]?.agentId).toBe("office");
  });

  it("将混合办公和文件提示优先路由到办公智能体", () => {
    expect(createInitialPlan("总结这个 PDF 文件")[0]?.agentId).toBe("office");
  });

  it("不会因英文子串误判而路由到文件智能体", () => {
    expect(createInitialPlan("update my profile")[0]?.agentId).toBe("desktop");
  });

  it("将没有智能体关键词的提示路由到桌面智能体", () => {
    expect(createInitialPlan("打开备忘录应用")[0]?.agentId).toBe("desktop");
  });
});
