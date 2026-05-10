import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
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
});
