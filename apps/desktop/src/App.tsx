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

const defaultTask = "整理 Downloads 里的发票";
type TaskRun = ReturnType<ReturnType<typeof createRuntime>["startTask"]>;

export function App(): ReactElement {
  const runtime = useMemo(() => createRuntime(), []);
  const [taskPrompt, setTaskPrompt] = useState(defaultTask);
  const [taskRun, setTaskRun] = useState<TaskRun>(() =>
    runtime.startTask(defaultTask)
  );

  const approvalSteps = taskRun.plan.filter((step) => step.approvalRequired);

  function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = taskPrompt.trim();
    if (prompt.length === 0) {
      return;
    }

    setTaskRun(runtime.startTask(prompt));
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
        createElement("p", { className: "eyebrow" }, "桌面自动化工作台"),
        createElement("h1", null, "本地智能体工作台"),
        createElement(
          "p",
          { className: "intro" },
          "在本地智能体操作文件或桌面工具前，先审阅计划、风险审批和执行记录。"
        )
      ),
      createElement(
        "div",
        { className: "status-card", "aria-label": "当前任务状态" },
        createElement("span", null, "状态"),
        createElement("strong", null, formatStatus(taskRun.status))
      )
    ),
    createElement(
      "form",
      { className: "task-form", onSubmit: createPlan },
      createElement("label", { htmlFor: "task" }, "任务"),
      createElement("textarea", {
        id: "task",
        value: taskPrompt,
        onChange: (event: ChangeEvent<HTMLTextAreaElement>) =>
          setTaskPrompt(event.currentTarget.value),
        rows: 4
      }),
      createElement("button", { type: "submit" }, "生成计划")
    ),
    createElement(
      "section",
      { className: "workspace-grid", "aria-label": "智能体工作区" },
      createElement(
        "article",
        { className: "panel" },
        createElement(
          "div",
          { className: "panel-heading" },
          createElement("h2", null, "当前计划"),
          createElement("span", null, `${taskRun.plan.length} 个步骤`)
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
            createElement("h2", null, "审批队列"),
            createElement("span", null, `${approvalSteps.length} 项待审批`)
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
                    createElement("span", null, `${formatRiskLevel(step.riskLevel)}风险`)
                  )
                )
              )
            : createElement(
                "p",
                { className: "empty-state" },
                "此计划无需审批。"
              )
        )
      ),
      createElement(
        "article",
        { className: "panel execution-panel" },
        createElement(
          "div",
          { className: "panel-heading" },
          createElement("h2", null, "执行日志"),
          createElement("span", null, `${taskRun.events.length + 1} 条记录`)
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
            createElement("span", null, `已为任务生成计划：${taskRun.userPrompt}`)
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
  const statusLabels: Record<string, string> = {
    approved: "已审批",
    cancelled: "已取消",
    completed: "已完成",
    failed: "失败",
    paused: "已暂停",
    pending: "待处理",
    planning: "规划中",
    running: "执行中",
    skipped: "已跳过",
    waiting_approval: "等待审批"
  };

  return statusLabels[status] ?? status;
}

function formatRiskLevel(riskLevel: string): string {
  const riskLabels: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    critical: "严重"
  };

  return riskLabels[riskLevel] ?? riskLevel;
}
