import type { AgentProfile } from "@local-agent/shared";

export const defaultAgentProfiles: AgentProfile[] = [
  {
    id: "planner",
    name: "规划智能体",
    description: "将用户任务拆解为可执行步骤，并分派给合适的智能体。",
    allowedPlugins: [],
    modelPolicy: "planning",
    defaultRiskTolerance: "medium"
  },
  {
    id: "desktop",
    name: "桌面智能体",
    description: "读取屏幕内容，并操作可见的桌面应用。",
    allowedPlugins: [
      "screen.capture",
      "window.list",
      "window.focus",
      "app.open",
      "mouse.click",
      "keyboard.type",
      "keyboard.hotkey"
    ],
    modelPolicy: "vision",
    defaultRiskTolerance: "medium"
  },
  {
    id: "file",
    name: "文件智能体",
    description: "扫描、分类、移动、重命名和归档文件。",
    allowedPlugins: ["file.scan", "file.read", "file.move", "file.rename"],
    modelPolicy: "text",
    defaultRiskTolerance: "medium"
  },
  {
    id: "office",
    name: "办公智能体",
    description: "处理 PDF、表格、邮件草稿、摘要和会议记录。",
    allowedPlugins: ["pdf.extract", "spreadsheet.read", "email.draft", "file.read"],
    modelPolicy: "text",
    defaultRiskTolerance: "medium"
  }
];
