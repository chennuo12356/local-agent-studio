import { describe, expect, it } from "vitest";
import { createModelRouter } from "./model-router";

describe("model router", () => {
  const router = createModelRouter({
    planning: "planner-model",
    text: "text-model",
    vision: "vision-model"
  });

  it("selects configured models for known purposes", () => {
    expect(router.selectModel("planning")).toBe("planner-model");
    expect(router.selectModel("text")).toBe("text-model");
    expect(router.selectModel("vision")).toBe("vision-model");
  });

  it("falls back to the text model for unknown purposes", () => {
    expect(router.selectModel("code")).toBe("text-model");
  });
});
