import type { ToolPlugin } from "@local-agent/shared";

const objectSchema = { type: "object" };

export const builtinPlugins: ToolPlugin[] = [
  {
    id: "screen.capture",
    name: "Capture Screen",
    description: "Capture the current screen.",
    permissions: [{ kind: "screen", scope: "capture" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "screen.locate",
    name: "Locate Screen Element",
    description: "Locate a visible element on screen.",
    permissions: [{ kind: "screen", scope: "locate" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "window.list",
    name: "List Windows",
    description: "List visible windows.",
    permissions: [{ kind: "window", scope: "read" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "window.focus",
    name: "Focus Window",
    description: "Focus a visible window.",
    permissions: [{ kind: "window", scope: "focus" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "app.open",
    name: "Open App",
    description: "Open an installed application.",
    permissions: [{ kind: "app", scope: "open" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "mouse.move",
    name: "Mouse Move",
    description: "Move the pointer to a screen location.",
    permissions: [{ kind: "mouse", scope: "move" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "mouse.click",
    name: "Mouse Click",
    description: "Click a visible UI element.",
    permissions: [{ kind: "mouse", scope: "click" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "keyboard.type",
    name: "Type Text",
    description: "Type text into the focused field.",
    permissions: [{ kind: "keyboard", scope: "type" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "keyboard.hotkey",
    name: "Keyboard Hotkey",
    description: "Send a keyboard shortcut.",
    permissions: [{ kind: "keyboard", scope: "hotkey" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "clipboard.set",
    name: "Set Clipboard",
    description: "Replace clipboard contents.",
    permissions: [{ kind: "clipboard", scope: "set" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "high",
    reversible: false
  },
  {
    id: "file.scan",
    name: "Scan Files",
    description: "Scan file names and metadata.",
    permissions: [{ kind: "file", scope: "scan" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "low",
    reversible: false
  },
  {
    id: "file.read",
    name: "Read File",
    description: "Read file contents.",
    permissions: [{ kind: "file", scope: "read" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "file.move",
    name: "Move File",
    description: "Move files between folders.",
    permissions: [{ kind: "file", scope: "move" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "high",
    reversible: true
  },
  {
    id: "file.rename",
    name: "Rename File",
    description: "Rename a file.",
    permissions: [{ kind: "file", scope: "rename" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "high",
    reversible: true
  },
  {
    id: "pdf.extract",
    name: "Extract PDF",
    description: "Extract text from a PDF.",
    permissions: [{ kind: "document", scope: "pdf.extract" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "spreadsheet.read",
    name: "Read Spreadsheet",
    description: "Read spreadsheet data.",
    permissions: [{ kind: "document", scope: "spreadsheet.read" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: false
  },
  {
    id: "email.draft",
    name: "Draft Email",
    description: "Create an email draft without sending.",
    permissions: [{ kind: "email", scope: "draft" }],
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    riskLevel: "medium",
    reversible: true
  }
];
