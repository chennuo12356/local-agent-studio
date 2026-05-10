import { describe, expect, it } from "vitest";
import { createModelRouter } from "./model-router";

describe("模型路由", () => {
  const router = createModelRouter({
    planning: "planner-model",
    text: "text-model",
    vision: "vision-model"
  });

  it("为已知用途选择配置的模型", () => {
    expect(router.selectModel("planning")).toBe("planner-model");
    expect(router.selectModel("text")).toBe("text-model");
    expect(router.selectModel("vision")).toBe("vision-model");
  });

  it("未知用途回退到文本模型", () => {
    expect(router.selectModel("code")).toBe("text-model");
  });
});
