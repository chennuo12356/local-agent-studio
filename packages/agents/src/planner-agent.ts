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
        title: "处理办公文档",
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
        title: "扫描候选文件",
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
        title: "移动已批准的文件",
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
      title: "检查桌面并提出下一步操作",
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
    "files",
    "下载",
    "文件",
    "发票",
    "合同"
  ]);
}

function isOfficePrompt(promptTokens: Set<string>): boolean {
  return hasAnyToken(promptTokens, ["pdf", "spreadsheet", "excel", "csv", "表格", "文档"]);
}

function isSpreadsheetPrompt(promptTokens: Set<string>): boolean {
  return hasAnyToken(promptTokens, ["spreadsheet", "excel", "csv", "表格"]);
}

function hasAnyToken(promptTokens: Set<string>, keywords: string[]): boolean {
  return keywords.some((keyword) =>
    promptTokens.has(keyword) ||
    (containsHan(keyword) &&
      [...promptTokens].some((token) => token.includes(keyword)))
  );
}

function tokenizePrompt(prompt: string): Set<string> {
  return new Set(prompt.match(/[\p{Script=Han}]+|[a-z0-9]+/gu) ?? []);
}

function containsHan(value: string): boolean {
  return /\p{Script=Han}/u.test(value);
}
