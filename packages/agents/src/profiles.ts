import type { AgentProfile } from "@local-agent/shared";

export const defaultAgentProfiles: AgentProfile[] = [
  {
    id: "planner",
    name: "Planner Agent",
    description: "Breaks user tasks into executable steps and routes work.",
    allowedPlugins: [],
    modelPolicy: "planning",
    defaultRiskTolerance: "medium"
  },
  {
    id: "desktop",
    name: "Desktop Agent",
    description: "Reads the screen and operates visible desktop applications.",
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
    name: "File Agent",
    description: "Scans, classifies, moves, renames, and archives files.",
    allowedPlugins: ["file.scan", "file.read", "file.move", "file.rename"],
    modelPolicy: "text",
    defaultRiskTolerance: "medium"
  },
  {
    id: "office",
    name: "Office Agent",
    description: "Processes PDFs, spreadsheets, drafts, summaries, and meeting notes.",
    allowedPlugins: ["pdf.extract", "spreadsheet.read", "email.draft", "file.read"],
    modelPolicy: "text",
    defaultRiskTolerance: "medium"
  }
];
