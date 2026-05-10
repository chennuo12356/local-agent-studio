# Local Agent System Design

Date: 2026-05-10

## Summary

Build a cross-platform desktop app that acts as a local computer agent platform. The first version uses Tauri 2 as the desktop shell, supports macOS and Windows, and focuses on three useful built-in agents: desktop operation, file organization, and office automation.

The system must feel useful to normal users while keeping a platform-grade internal architecture: agent runtime, plugin protocol, policy engine, model router, audit log, and OS adapters.

## Goals

- Provide a local desktop app for operating the user's computer.
- Support macOS and Windows in the first version.
- Use cloud model APIs as the primary AI backend.
- Support multi-model routing so different agents and tasks can use different models.
- Allow screen capture and screen understanding by default.
- Allow data to be sent to cloud models by default, with clear privacy disclosure.
- Use risk-based approvals for sensitive actions.
- Deliver a first version with a real platform core and three usable workflows.

## Non-Goals For MVP

- Plugin marketplace.
- Team collaboration.
- Enterprise admin console.
- Remote computer control.
- Local model support.
- Fully autonomous high-risk actions.
- Automatic password or verification-code entry.
- Payment, purchase, legal, financial, medical, or government-form automation.

## Product Shape

The product is a desktop app, not just a chat window. The main screen is a task console with:

- Task input.
- Current plan.
- Approval queue.
- Real-time execution log.
- Result artifacts.
- Task history.
- Settings for model keys, privacy, permissions, and risk controls.

The user flow is:

1. User enters a task, such as "organize invoices and contracts in Downloads."
2. The system selects an agent and, when needed, asks the Planner Agent to create steps.
3. The app shows what it will read, what it may change, and what may be sent to cloud models.
4. Low-risk actions run automatically.
5. High-risk and critical actions enter the approval queue.
6. Approved actions execute with visible progress, logs, screenshots, and file changes.
7. The task ends with a summary, artifacts, failed or skipped items, cloud-data disclosure, and rollback options.

The first version should not be fully autonomous. It should behave like assisted execution: AI can act, but the user can always inspect plan, risk, and result.

## Recommended Approach

Use a hybrid approach: build a minimal but complete platform core and validate it with three built-in workflows.

The three built-in agents are:

- Desktop Agent: reads the screen, clicks, types, and operates apps.
- File Agent: scans, classifies, moves, renames, and archives files.
- Office Agent: handles PDFs, spreadsheets, email drafts, summaries, and meeting notes.

Each agent should complete at least one end-to-end workflow in MVP.

## Architecture

Use Tauri 2 as the desktop shell. Keep the long-term platform capabilities in a local Agent Runtime.

```text
Desktop App
  ↓
Task Console / Approval UI
  ↓
Agent Runtime
  ↓
Planner + Policy Engine + Model Router
  ↓
Tool Plugins
  ↓
OS Adapters / Local Resources / Cloud Models
```

### Desktop App

The desktop app owns user interaction:

- Task entry.
- Plan display.
- Approval dialogs and approval queue.
- Execution log.
- Task history.
- Settings.

Use Tauri 2 with a React and TypeScript frontend. Tauri gives a smaller app footprint and a cleaner native boundary than Electron. Use Rust for local OS integration where it provides stronger boundaries or better platform APIs.

### Agent Runtime

The runtime owns task lifecycle and execution state. It should not contain feature-specific business logic. It coordinates agents, plugins, policy checks, approvals, persistence, cancellation, and recovery.

All system actions must go through the runtime. Agents cannot call OS APIs directly.

### Planner

The Planner turns user tasks into executable steps. For example, "organize Downloads" becomes:

1. Scan selected directory.
2. Classify files.
3. Generate proposed moves and renames.
4. Ask for approval.
5. Execute approved actions.
6. Produce a report.

### Policy Engine

The Policy Engine evaluates every plugin call before execution. It decides whether to allow, require approval, deny, or escalate.

The MVP policy model is risk-based:

- Low: automatic.
- Medium: automatic by default, visible in logs.
- High: requires approval.
- Critical: requires explicit confirmation or is disabled in MVP.

### Model Router

Cloud model APIs are the primary backend. The router selects models by task type:

- Strong reasoning model for planning.
- Fast inexpensive model for routine text tasks.
- Multimodal model for screenshots and visual understanding.
- Specialized model when an agent profile asks for one.

The interface must allow future model providers without changing agents.

### Tool Plugins

All capabilities are plugins. Example plugins:

- `screen.capture`
- `screen.locate`
- `window.list`
- `window.focus`
- `app.open`
- `mouse.click`
- `keyboard.type`
- `keyboard.hotkey`
- `clipboard.set`
- `file.scan`
- `file.read`
- `file.move`
- `file.rename`
- `pdf.extract`
- `spreadsheet.read`
- `email.draft`

Plugins declare permissions, risk level, schema, and reversibility.

### OS Adapters

OS adapters hide macOS and Windows differences. Plugins call adapters rather than direct platform APIs.

Examples:

- Screenshot capture.
- Accessibility permissions.
- Window listing.
- Window focus.
- Mouse and keyboard control.
- File system watches.
- App launch.

## Suggested Repository Layout

```text
local-agent-studio/
  apps/
    desktop/              # Tauri 2 desktop app
  packages/
    runtime/              # Agent Runtime
    agents/               # Built-in agents
    plugins/              # Tool plugins
    policy/               # Permission and approval logic
    model-router/         # Multi-model routing
    os-adapters/          # macOS / Windows adapters
    shared/               # Types, events, schemas
```

## Agent Model

Agents plan, decide, and request tool calls. They do not operate the system directly.

MVP agents:

- Planner Agent: default entry, task understanding, decomposition, routing.
- Desktop Agent: screen reading, clicking, typing, app operation.
- File Agent: scanning, classification, moving, renaming, archiving.
- Office Agent: PDF, spreadsheet, email draft, summary, meeting-note tasks.

Agent profile:

```ts
type AgentProfile = {
  id: string;
  name: string;
  description: string;
  allowedPlugins: string[];
  modelPolicy: string;
  defaultRiskTolerance: "low" | "medium" | "high";
};
```

## Plugin Model

Plugin metadata:

```ts
type ToolPlugin = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  riskLevel: "low" | "medium" | "high" | "critical";
  inputSchema: unknown;
  outputSchema: unknown;
  reversible: boolean;
};
```

Baseline risk examples:

```text
file.scan        low       automatic
file.read        medium    automatic for normal paths; approval for sensitive paths
file.move        high      approval required; reversible
file.rename      high      approval required; reversible
file.delete      critical  disabled in MVP
mouse.click      medium    contextual risk evaluation
keyboard.type    medium    contextual risk evaluation
email.draft      medium    creates drafts only
email.send       critical  disabled in MVP
shell.exec       critical  disabled in MVP
```

## Permission And Approval Model

Use risk-based approvals.

Approval dialog content must include:

```text
Agent: File Agent
Action: Move 38 files
Source: ~/Downloads
Destination: ~/Documents/Invoices/2026
Risk: High
Reversible: Yes
Cloud data: file names and partial PDF text summaries
```

MVP policy rules:

- Low-risk calls execute automatically.
- Medium-risk calls execute automatically but are visible in the log.
- High-risk calls require approval.
- Critical calls require explicit confirmation or are disabled.
- Password and verification-code fields are denied for automatic typing.
- Permanent deletion, email sending, shell execution, and payment-related actions are disabled in MVP.

The policy engine should support rule files for future configuration:

```yaml
rules:
  - match:
      plugin: file.delete
    decision: deny
  - match:
      plugin: email.send
    decision: require_approval
  - match:
      path: "~/Downloads/**"
      plugin: file.scan
    decision: allow
```

## Desktop Operation Flow

Desktop control follows observe, plan, execute, verify:

```text
Screenshot / window metadata
  ↓
Visual model interpretation
  ↓
Next action proposal
  ↓
Policy check
  ↓
Mouse / keyboard execution
  ↓
Post-action screenshot verification
```

MVP supported actions:

- `screen.capture`
- `screen.locate`
- `window.list`
- `window.focus`
- `app.open`
- `mouse.move`
- `mouse.click`
- `keyboard.type`
- `keyboard.hotkey`
- `clipboard.set`

MVP forbidden actions:

- Auto-entering passwords.
- Auto-entering verification codes.
- Completing payments.
- Submitting legal, financial, medical, or government forms.
- Background control of invisible windows.
- Bypassing OS permission systems.

Contextual risk triggers include buttons or labels such as:

```text
Send, Submit, Delete, Pay, Confirm, Purchase, Authorize, Install
发送, 提交, 删除, 付款, 确认, 购买, 授权, 安装
```

Those actions require approval or denial depending on context.

Each desktop step records:

- Before screenshot.
- Target element.
- Action type.
- Input summary.
- Expected result.
- Risk level.
- Approval state.
- After screenshot.
- Verification result.

## Data Flow

Task execution is tracked as a structured run:

```ts
type TaskRun = {
  id: string;
  userPrompt: string;
  selectedAgent: string;
  status:
    | "planning"
    | "waiting_approval"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "cancelled";
  plan: PlanStep[];
  events: TaskEvent[];
  artifacts: Artifact[];
  createdAt: string;
  completedAt?: string;
};
```

Plan step:

```ts
type PlanStep = {
  id: string;
  title: string;
  agentId: string;
  toolCalls: ToolCall[];
  riskLevel: "low" | "medium" | "high" | "critical";
  approvalRequired: boolean;
  status:
    | "pending"
    | "running"
    | "approved"
    | "completed"
    | "failed"
    | "skipped";
};
```

## Logging And Persistence

Use three log layers:

- User log: concise progress and results.
- Audit log: structured record of agents, plugins, approvals, input/output summaries, and timestamps.
- Debug log: model request metadata, tool returns, stack traces, locator data.

Store audit logs in local SQLite. Store screenshots and intermediate files as artifacts on disk, referenced by path and hash from SQLite.

macOS:

```text
~/Library/Application Support/LocalAgentStudio/
  db.sqlite
  artifacts/
    task-id/
      before-step-1.png
      after-step-1.png
      extracted.pdf.txt
      report.md
```

Windows:

```text
%APPDATA%/LocalAgentStudio/
```

Do not save full model prompts by default. Store model-call summaries:

- Model name.
- Purpose.
- Data categories sent.
- Whether file body or screenshots were included.
- Timestamp.

Developer mode may optionally store full prompts for debugging.

## Error Recovery

Handle four error classes:

1. Model understanding error: verify with post-action screenshot, pause, show expected versus actual, ask for retry or user takeover.
2. OS permission error: guide the user to grant permissions, stop blind retries.
3. Tool execution error: record the exact error, skip affected item or ask user.
4. Approval rejection: re-plan where possible, such as creating an email draft instead of sending.

Users can pause, cancel, or request rollback for reversible actions.

Rollback applies only to plugins marked `reversible: true`. Irreversible actions require approval before execution and only provide audit records afterward.

## Result Summary

Every task ends with a summary:

- What was completed.
- Which files or app states changed.
- Which actions required approval.
- What data was sent to cloud models.
- What failed or was skipped.
- Which actions can be rolled back.
- Artifact links.

## MVP Scope

### Required

Desktop app:

- Task input.
- Plan display.
- Approval dialogs and queue.
- Real-time execution log.
- Task history.
- Settings for model API keys, privacy, and permissions.

Runtime:

- Task lifecycle management.
- Planner Agent.
- Desktop Agent.
- File Agent.
- Office Agent.
- Plugin protocol.
- Policy Engine.
- Model Router.
- SQLite audit log.
- Artifact storage.

Plugins:

- `screen.capture`
- `window.list`
- `window.focus`
- `app.open`
- `mouse.click`
- `keyboard.type`
- `keyboard.hotkey`
- `file.scan`
- `file.read`
- `file.move`
- `file.rename`
- `pdf.extract`
- `spreadsheet.read`
- `email.draft`

### Excluded

- `email.send`
- Permanent `file.delete`
- `shell.exec`
- Payment, purchase, and form submission automation.
- Background silent control.
- Plugin marketplace.
- Team collaboration.
- Remote computer control.
- Enterprise admin console.
- Local models.

## First End-To-End Workflows

### Organize Downloads

Scan `Downloads`, classify invoices, contracts, images, archives, and other files. Generate move and rename suggestions. After approval, execute moves and keep a rollback plan.

### Process Office Document

Read a PDF or spreadsheet, summarize it, extract key information, and export Markdown or CSV artifacts.

### Operate Desktop App

Open an app, use screenshots to perform simple steps, input text, and save a file. Sending, deleting, submitting, or payment-like operations must stop for approval.

## Test Standards

Reliability:

- File workflow handles at least 100 files.
- Move and rename actions are accurate and reversible.
- PDF and spreadsheet failures do not block the entire task.
- Desktop actions have post-action screenshot verification.
- Tasks can pause and cancel cleanly.

Safety:

- High and critical actions require approval.
- `file.delete`, `email.send`, and `shell.exec` are disabled in MVP.
- Password and verification-code fields deny automatic input.
- Cloud model calls are logged with data summaries.

User experience:

- User understands the current plan.
- Approval dialogs explain risk and impact.
- End summaries show results, failures, cloud-data disclosure, and rollback options.
- Missing OS permissions have clear guidance.

Extensibility:

- New plugins do not require Agent Runtime changes.
- New agents can reuse existing plugins and the Policy Engine.
- New model providers can be added through the Model Router.

## Technical Recommendation

Use:

- Tauri 2 as the desktop shell.
- React and TypeScript for UI.
- TypeScript for agent/runtime orchestration where possible.
- Rust for Tauri commands, OS permissions, and platform adapters.
- SQLite for local persistence.
- Zod or JSON Schema for plugin input and output schemas.
- Provider adapters for cloud model APIs.

This balances cross-platform support, security boundaries, app size, and development speed.

