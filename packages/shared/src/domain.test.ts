import { describe, expect, it } from "vitest";
import { compareRisk, createTaskRun } from "./domain";

describe("共享领域模型", () => {
  it("按低风险到严重风险排序", () => {
    expect(compareRisk("low", "medium")).toBeLessThan(0);
    expect(compareRisk("critical", "high")).toBeGreaterThan(0);
  });

  it("创建规划中状态且集合为空的任务运行记录", () => {
    const run = createTaskRun({ id: "task-1", userPrompt: "整理下载目录", selectedAgent: "planner" });
    expect(run.status).toBe("planning");
    expect(run.plan).toEqual([]);
    expect(run.events).toEqual([]);
    expect(run.artifacts).toEqual([]);
  });
});
