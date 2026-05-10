import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("渲染 Agent Studio 会话外壳", () => {
    render(createElement(App));

    expect(screen.getByText("Agent Studio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新会话" })).toBeInTheDocument();
    expect(screen.getByText("Hi，今天有什么安排？")).toBeInTheDocument();
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument();
    expect(screen.getByText("调用流程")).toBeInTheDocument();
  });

  it("发送消息后显示流式助手回复和工具流程", async () => {
    render(createElement(App));

    fireEvent.change(screen.getByLabelText("发送消息"), {
      target: { value: "总结这个 PDF" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect((await screen.findAllByText("总结这个 PDF")).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText(/已收到：总结这个 PDF/)).toBeInTheDocument();
    });
    expect(screen.getByText("pdf.extract")).toBeInTheDocument();
  });

  it("刷新后恢复历史会话", async () => {
    const { unmount } = render(createElement(App));

    fireEvent.change(screen.getByLabelText("发送消息"), {
      target: { value: "整理 Downloads 里的发票" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));
    expect(
      (await screen.findAllByText("整理 Downloads 里的发票")).length
    ).toBeGreaterThan(0);

    unmount();
    render(createElement(App));

    expect(screen.getAllByText("整理 Downloads 里的发票").length).toBeGreaterThan(0);
  });
});
