import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the desktop shell sections", () => {
    render(createElement(App));

    expect(
      screen.getByRole("heading", { name: "Local Agent Studio" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Task")).toBeInTheDocument();
    expect(screen.getByText("Approval Queue")).toBeInTheDocument();
    expect(screen.getByText("Execution Log")).toBeInTheDocument();
  });

  it("starts the default organize task through policy and shows pending approval", async () => {
    render(createElement(App));

    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));

    expect(await screen.findByText("Waiting Approval")).toBeInTheDocument();
    expect(screen.getByText("1 pending")).toBeInTheDocument();
    expect(screen.getByText("high risk")).toBeInTheDocument();
  });

  it("can start a PDF summary task without pending approvals", async () => {
    render(createElement(App));

    fireEvent.change(screen.getByLabelText("Task"), {
      target: { value: "summarize this PDF" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));

    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("0 pending")).toBeInTheDocument();
    expect(
      screen.getByText("No approvals required for this plan.")
    ).toBeInTheDocument();
  });
});
