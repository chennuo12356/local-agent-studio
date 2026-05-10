import type { PlanStep } from "@local-agent/shared";

export function createInitialPlan(prompt: string): PlanStep[] {
  const normalizedPrompt = prompt.toLowerCase();

  if (isFilePrompt(normalizedPrompt)) {
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

  if (isOfficePrompt(normalizedPrompt)) {
    const pluginId = isSpreadsheetPrompt(normalizedPrompt)
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

function isFilePrompt(prompt: string): boolean {
  return ["download", "invoice", "contract", "file"].some((keyword) =>
    prompt.includes(keyword)
  );
}

function isOfficePrompt(prompt: string): boolean {
  return ["pdf", "spreadsheet", "excel", "csv"].some((keyword) =>
    prompt.includes(keyword)
  );
}

function isSpreadsheetPrompt(prompt: string): boolean {
  return ["spreadsheet", "excel", "csv"].some((keyword) => prompt.includes(keyword));
}
