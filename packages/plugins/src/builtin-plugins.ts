import type { ToolPlugin } from "@local-agent/shared";

const objectSchema = { type: "object" };

export const builtinPlugins: ToolPlugin[] = [
  {
    id: "screen.capture",
    name: "截取屏幕",
    description: "截取当前屏幕。",
    permissions: [{ kind: "screen", scope: "capture" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "screen.locate",
    name: "定位屏幕元素",
    description: "定位屏幕上的可见元素。",
    permissions: [{ kind: "screen", scope: "locate" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "window.list",
    name: "列出窗口",
    description: "列出可见窗口。",
    permissions: [{ kind: "window", scope: "read" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "window.focus",
    name: "聚焦窗口",
    description: "聚焦一个可见窗口。",
    permissions: [{ kind: "window", scope: "focus" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "app.open",
    name: "打开应用",
    description: "打开已安装的应用程序。",
    permissions: [{ kind: "app", scope: "open" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "mouse.move",
    name: "移动鼠标",
    description: "将指针移动到屏幕位置。",
    permissions: [{ kind: "mouse", scope: "move" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "mouse.click",
    name: "鼠标点击",
    description: "点击可见的界面元素。",
    permissions: [{ kind: "mouse", scope: "click" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "keyboard.type",
    name: "输入文本",
    description: "向当前聚焦字段输入文本。",
    permissions: [{ kind: "keyboard", scope: "type" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "keyboard.hotkey",
    name: "键盘快捷键",
    description: "发送键盘快捷键。",
    permissions: [{ kind: "keyboard", scope: "hotkey" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "clipboard.set",
    name: "设置剪贴板",
    description: "替换剪贴板内容。",
    permissions: [{ kind: "clipboard", scope: "set" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "high",
    reversible: false
  },
  {
    id: "file.scan",
    name: "扫描文件",
    description: "扫描文件名和元数据。",
    permissions: [{ kind: "file", scope: "scan" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "file.read",
    name: "读取文件",
    description: "读取文件内容。",
    permissions: [{ kind: "file", scope: "read" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "file.move",
    name: "移动文件",
    description: "在文件夹之间移动文件。",
    permissions: [{ kind: "file", scope: "move" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "high",
    reversible: true
  },
  {
    id: "file.rename",
    name: "重命名文件",
    description: "重命名文件。",
    permissions: [{ kind: "file", scope: "rename" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "high",
    reversible: true
  },
  {
    id: "pdf.extract",
    name: "提取 PDF",
    description: "从 PDF 中提取文本。",
    permissions: [{ kind: "document", scope: "pdf.extract" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "spreadsheet.read",
    name: "读取表格",
    description: "读取电子表格数据。",
    permissions: [{ kind: "document", scope: "spreadsheet.read" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "email.draft",
    name: "起草邮件",
    description: "创建邮件草稿但不发送。",
    permissions: [{ kind: "email", scope: "draft" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: true
  }
];
