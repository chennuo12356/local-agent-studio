import { createRuntime } from "@local-agent/runtime";
import {
  createElement,
  Fragment,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useMemo,
  useState
} from "react";

const defaultTask =
  "Organize my Downloads folder and ask before moving important files.";
type TaskRun = ReturnType<ReturnType<typeof createRuntime>["createTask"]>;

export function App(): ReactElement {
  const runtime = useMemo(() => createRuntime(), []);
  const [taskPrompt, setTaskPrompt] = useState(defaultTask);
  const [taskRun, setTaskRun] = useState<TaskRun>(() =>
    runtime.createTask(defaultTask)
  );

  const approvalSteps = taskRun.plan.filter((step) => step.approvalRequired);

  function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = taskPrompt.trim();
    if (prompt.length === 0) {
      return;
    }

    setTaskRun(runtime.createTask(prompt));
  }

  return createElement(
    "main",
    { className: "app-shell" },
    createElement(
      "section",
      { className: "hero" },
      createElement(
        "div",
        null,
        createElement("p", { className: "eyebrow" }, "Desktop automation workspace"),
        createElement("h1", null, "Local Agent Studio"),
        createElement(
          "p",
          { className: "intro" },
          "Draft plans, inspect approvals, and follow execution activity before local agents touch files or desktop tools."
        )
      ),
      createElement(
        "div",
        { className: "status-card", "aria-label": "Current task status" },
        createElement("span", null, "Status"),
        createElement("strong", null, formatStatus(taskRun.status))
      )
    ),
    createElement(
      "form",
      { className: "task-form", onSubmit: createPlan },
      createElement("label", { htmlFor: "task" }, "Task"),
      createElement("textarea", {
        id: "task",
        value: taskPrompt,
        onChange: (event: ChangeEvent<HTMLTextAreaElement>) =>
          setTaskPrompt(event.currentTarget.value),
        rows: 4
      }),
      createElement("button", { type: "submit" }, "Create Plan")
    ),
    createElement(
      "section",
      { className: "workspace-grid", "aria-label": "Agent workspace" },
      createElement(
        "article",
        { className: "panel" },
        createElement(
          "div",
          { className: "panel-heading" },
          createElement("h2", null, "Current Plan"),
          createElement("span", null, `${taskRun.plan.length} steps`)
        ),
        createElement(
          "ol",
          { className: "plan-list" },
          taskRun.plan.map((step) =>
            createElement(
              "li",
              { key: step.id },
              createElement(
                "div",
                null,
                createElement("strong", null, step.title),
                createElement("span", null, step.agentId)
              ),
              createElement("span", { className: "pill" }, formatStatus(step.status))
            )
          )
        )
      ),
      createElement(
        "article",
        { className: "panel" },
        createElement(
          Fragment,
          null,
          createElement(
            "div",
            { className: "panel-heading" },
            createElement("h2", null, "Approval Queue"),
            createElement("span", null, `${approvalSteps.length} pending`)
          ),
          approvalSteps.length > 0
            ? createElement(
                "ul",
                { className: "approval-list" },
                approvalSteps.map((step) =>
                  createElement(
                    "li",
                    { key: step.id },
                    createElement("strong", null, step.title),
                    createElement("span", null, `${step.riskLevel} risk`)
                  )
                )
              )
            : createElement(
                "p",
                { className: "empty-state" },
                "No approvals required for this plan."
              )
        )
      ),
      createElement(
        "article",
        { className: "panel execution-panel" },
        createElement(
          "div",
          { className: "panel-heading" },
          createElement("h2", null, "Execution Log"),
          createElement("span", null, `${taskRun.events.length + 1} entries`)
        ),
        createElement(
          "ul",
          { className: "log-list" },
          createElement(
            "li",
            null,
            createElement(
              "time",
              { dateTime: taskRun.createdAt },
              new Date(taskRun.createdAt).toLocaleTimeString()
            ),
            createElement("span", null, `Created plan for: ${taskRun.userPrompt}`)
          ),
          taskRun.events.map((event) =>
            createElement(
              "li",
              { key: event.id },
              createElement(
                "time",
                { dateTime: event.createdAt },
                new Date(event.createdAt).toLocaleTimeString()
              ),
              createElement("span", null, event.message)
            )
          )
        )
      )
    )
  );
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
