import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("渲染桌面外壳的主要区域", () => {
    render(createElement(App));

    expect(
      screen.getByRole("heading", { name: "本地智能体工作台" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("任务")).toBeInTheDocument();
    expect(screen.getByText("审批队列")).toBeInTheDocument();
    expect(screen.getByText("执行日志")).toBeInTheDocument();
  });

  it("通过策略启动默认整理任务并显示待审批项", async () => {
    render(createElement(App));

    fireEvent.click(screen.getByRole("button", { name: "生成计划" }));

    expect(await screen.findByText("等待审批")).toBeInTheDocument();
    expect(screen.getByText("1 项待审批")).toBeInTheDocument();
    expect(screen.getByText("高风险")).toBeInTheDocument();
  });

  it("可以启动无需审批的 PDF 摘要任务", async () => {
    render(createElement(App));

    fireEvent.change(screen.getByLabelText("任务"), {
      target: { value: "总结这个 PDF" }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成计划" }));

    expect(await screen.findByText("已完成")).toBeInTheDocument();
    expect(screen.getByText("0 项待审批")).toBeInTheDocument();
    expect(screen.getByText("此计划无需审批。")).toBeInTheDocument();
  });
});
