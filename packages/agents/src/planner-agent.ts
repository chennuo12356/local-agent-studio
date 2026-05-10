import type { PlanStep } from "@local-agent/shared";

export function createInitialPlan(prompt: string): PlanStep[] {
  const normalizedPrompt = prompt.toLowerCase();
  const promptTokens = tokenizePrompt(normalizedPrompt);

  if (isOfficePrompt(promptTokens)) {
    const pluginId = isSpreadsheetPrompt(promptTokens)
      ? "spreadsheet.read"
      : "pdf.extract";

    return [
      {
        id: "process-office-document",
        title: "Process office document",
        agentId: "office",
        toolCalls: [
          {
            id: "read-document-call",
            pluginId,
            input: {},
            riskLevel: "medium",
            approvalRequired: false
          }
        ],
        riskLevel: "medium",
        approvalRequired: false,
        status: "pending"
      }
    ];
  }

  if (isFilePrompt(promptTokens)) {
    return [
      {
        id: "scan-files",
        title: "Scan candidate files",
        agentId: "file",
        toolCalls: [
          {
            id: "scan-files-call",
            pluginId: "file.scan",
            input: {},
            riskLevel: "low",
            approvalRequired: false
          }
        ],
        riskLevel: "low",
        approvalRequired: false,
        status: "pending"
      },
      {
        id: "move-files",
        title: "Move approved files",
        agentId: "file",
        toolCalls: [
          {
            id: "move-files-call",
            pluginId: "file.move",
            input: {},
            riskLevel: "high",
            approvalRequired: true
          }
        ],
        riskLevel: "high",
        approvalRequired: true,
        status: "pending"
      }
    ];
  }

  return [
    {
      id: "operate-desktop",
      title: "Inspect desktop and propose next action",
      agentId: "desktop",
      toolCalls: [
        {
          id: "capture-screen-call",
          pluginId: "screen.capture",
          input: {},
          riskLevel: "low",
          approvalRequired: false
        }
      ],
      riskLevel: "low",
      approvalRequired: false,
      status: "pending"
    }
  ];
}

function isFilePrompt(promptTokens: Set<string>): boolean {
  return hasAnyToken(promptTokens, [
    "download",
    "downloads",
    "invoice",
    "invoices",
    "contract",
    "contracts",
    "file",
    "files"
  ]);
}

function isOfficePrompt(promptTokens: Set<string>): boolean {
  return hasAnyToken(promptTokens, ["pdf", "spreadsheet", "excel", "csv"]);
}

function isSpreadsheetPrompt(promptTokens: Set<string>): boolean {
  return hasAnyToken(promptTokens, ["spreadsheet", "excel", "csv"]);
}

function hasAnyToken(promptTokens: Set<string>, keywords: string[]): boolean {
  return keywords.some((keyword) => promptTokens.has(keyword));
}

function tokenizePrompt(prompt: string): Set<string> {
  return new Set(prompt.match(/[a-z0-9]+/g) ?? []);
}
