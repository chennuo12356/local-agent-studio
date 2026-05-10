# Local Agent MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working foundation of the Tauri 2 local computer agent platform: desktop shell, typed runtime, policy engine, plugin protocol, model router, built-in agent skeletons, audit persistence interface, and a task console UI.

**Architecture:** The project is a pnpm monorepo. The desktop app lives in `apps/desktop` and consumes workspace packages from `packages/*`. The first implementation keeps OS automation behind typed adapter interfaces and uses fake/test adapters for deterministic tests; real macOS/Windows adapters come in a later plan.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Vitest, Zod, pnpm workspaces, Rust for Tauri shell commands, SQLite adapter interface with an in-memory implementation for MVP tests.

---

## Scope Notes

The design spec covers several subsystems. This plan implements the MVP foundation and one testable vertical slice. It does not implement real mouse/keyboard control, real screen capture, native PDF parsing, native spreadsheet parsing, or production cloud model calls. Those are intentionally isolated behind interfaces so follow-up plans can add real adapters without changing Runtime, Policy Engine, or UI contracts.

Spec source: `docs/superpowers/specs/2026-05-10-local-agent-system-design.md`

## File Structure

Create this structure:

```text
.
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── apps/
│   └── desktop/
│       ├── package.json
│       ├── index.html
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── styles.css
│       │   └── App.test.tsx
│       └── src-tauri/
│           ├── Cargo.toml
│           ├── tauri.conf.json
│           └── src/
│               ├── lib.rs
│               └── main.rs
└── packages/
    ├── shared/
    │   ├── package.json
    │   ├── src/index.ts
    │   ├── src/domain.ts
    │   └── src/domain.test.ts
    ├── policy/
    │   ├── package.json
    │   ├── src/index.ts
    │   ├── src/policy-engine.ts
    │   └── src/policy-engine.test.ts
    ├── plugins/
    │   ├── package.json
    │   ├── src/index.ts
    │   ├── src/registry.ts
    │   ├── src/builtin-plugins.ts
    │   └── src/registry.test.ts
    ├── model-router/
    │   ├── package.json
    │   ├── src/index.ts
    │   ├── src/model-router.ts
    │   └── src/model-router.test.ts
    ├── agents/
    │   ├── package.json
    │   ├── src/index.ts
    │   ├── src/profiles.ts
    │   ├── src/planner-agent.ts
    │   └── src/planner-agent.test.ts
    ├── runtime/
    │   ├── package.json
    │   ├── src/index.ts
    │   ├── src/runtime.ts
    │   └── src/runtime.test.ts
    └── persistence/
        ├── package.json
        ├── src/index.ts
        ├── src/audit-store.ts
        └── src/audit-store.test.ts
```

---

### Task 1: Initialize Monorepo Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize git repository**

Run:

```bash
git init
```

Expected: repository initialized in `/Users/starchen/code/local-agent`.

- [ ] **Step 2: Create root package metadata**

Create `package.json`:

```json
{
  "name": "local-agent",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm --filter @local-agent/desktop dev",
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.8.3",
    "vite": "^6.0.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Create workspace config**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create shared TypeScript config**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 5: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts", "apps/**/*.test.tsx"],
    setupFiles: []
  }
});
```

- [ ] **Step 6: Extend ignore rules**

Modify `.gitignore` so it contains exactly these local build and cache ignores:

```gitignore
.superpowers/
node_modules/
dist/
target/
.turbo/
.DS_Store
*.log
```

- [ ] **Step 7: Install dependencies**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` is created and install exits with code 0.

- [ ] **Step 8: Run empty test command**

Run:

```bash
pnpm test
```

Expected: Vitest runs and reports no test files or exits successfully once later task files exist. If Vitest exits with "No test files found" and non-zero status at this step, continue to Task 2 before treating it as a failure.

- [ ] **Step 9: Commit**

Run:

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.config.ts .gitignore pnpm-lock.yaml
git commit -m "chore: initialize local agent monorepo"
```

Expected: commit succeeds.

---

### Task 2: Shared Domain Types

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/domain.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/domain.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/shared/package.json`:

```json
{
  "name": "@local-agent/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {}
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing tests for risk ordering and task defaults**

Create `packages/shared/src/domain.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compareRisk, createTaskRun } from "./domain";

describe("shared domain", () => {
  it("orders risk levels from low to critical", () => {
    expect(compareRisk("low", "medium")).toBeLessThan(0);
    expect(compareRisk("critical", "high")).toBeGreaterThan(0);
  });

  it("creates a task run with planning status and empty collections", () => {
    const run = createTaskRun({
      id: "task-1",
      userPrompt: "organize downloads",
      selectedAgent: "planner"
    });

    expect(run.status).toBe("planning");
    expect(run.plan).toEqual([]);
    expect(run.events).toEqual([]);
    expect(run.artifacts).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/shared/src/domain.test.ts
```

Expected: FAIL because `./domain` does not exist.

- [ ] **Step 4: Implement domain types and helpers**

Create `packages/shared/src/domain.ts`:

```ts
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TaskStatus =
  | "planning"
  | "waiting_approval"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type StepStatus =
  | "pending"
  | "running"
  | "approved"
  | "completed"
  | "failed"
  | "skipped";

export type ApprovalDecision = "allow" | "require_approval" | "deny";

export type Artifact = {
  id: string;
  taskId: string;
  kind: "screenshot" | "document" | "report" | "data";
  path: string;
  sha256?: string;
};

export type TaskEvent = {
  id: string;
  taskId: string;
  type: "user" | "audit" | "debug";
  message: string;
  createdAt: string;
};

export type ToolCall = {
  id: string;
  pluginId: string;
  input: Record<string, unknown>;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
};

export type PlanStep = {
  id: string;
  title: string;
  agentId: string;
  toolCalls: ToolCall[];
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  status: StepStatus;
};

export type TaskRun = {
  id: string;
  userPrompt: string;
  selectedAgent: string;
  status: TaskStatus;
  plan: PlanStep[];
  events: TaskEvent[];
  artifacts: Artifact[];
  createdAt: string;
  completedAt?: string;
};

export type AgentProfile = {
  id: string;
  name: string;
  description: string;
  allowedPlugins: string[];
  modelPolicy: string;
  defaultRiskTolerance: Exclude<RiskLevel, "critical">;
};

export type Permission = {
  kind: "screen" | "window" | "app" | "mouse" | "keyboard" | "clipboard" | "file" | "document" | "email";
  scope: string;
};

export type ToolPlugin = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  riskLevel: RiskLevel;
  reversible: boolean;
};

const riskOrder: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

export function compareRisk(left: RiskLevel, right: RiskLevel): number {
  return riskOrder[left] - riskOrder[right];
}

export function createTaskRun(input: {
  id: string;
  userPrompt: string;
  selectedAgent: string;
  createdAt?: string;
}): TaskRun {
  return {
    id: input.id,
    userPrompt: input.userPrompt,
    selectedAgent: input.selectedAgent,
    status: "planning",
    plan: [],
    events: [],
    artifacts: [],
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}
```

Create `packages/shared/src/index.ts`:

```ts
export * from "./domain";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/shared/src/domain.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/shared typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/shared
git commit -m "feat: add shared domain model"
```

Expected: commit succeeds.

---

### Task 3: Policy Engine

**Files:**
- Create: `packages/policy/package.json`
- Create: `packages/policy/tsconfig.json`
- Create: `packages/policy/src/policy-engine.ts`
- Create: `packages/policy/src/index.ts`
- Create: `packages/policy/src/policy-engine.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/policy/package.json`:

```json
{
  "name": "@local-agent/policy",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@local-agent/shared": "workspace:*"
  }
}
```

Create `packages/policy/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing policy tests**

Create `packages/policy/src/policy-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { evaluateToolCall } from "./policy-engine";

describe("policy engine", () => {
  it("allows low and medium risk calls", () => {
    expect(evaluateToolCall({ pluginId: "file.scan", riskLevel: "low", input: {} }).decision).toBe("allow");
    expect(evaluateToolCall({ pluginId: "file.read", riskLevel: "medium", input: {} }).decision).toBe("allow");
  });

  it("requires approval for high risk calls", () => {
    const result = evaluateToolCall({ pluginId: "file.move", riskLevel: "high", input: {} });

    expect(result.decision).toBe("require_approval");
    expect(result.reason).toContain("high");
  });

  it("denies forbidden critical actions in MVP", () => {
    expect(evaluateToolCall({ pluginId: "file.delete", riskLevel: "critical", input: {} }).decision).toBe("deny");
    expect(evaluateToolCall({ pluginId: "email.send", riskLevel: "critical", input: {} }).decision).toBe("deny");
    expect(evaluateToolCall({ pluginId: "shell.exec", riskLevel: "critical", input: {} }).decision).toBe("deny");
  });

  it("requires approval for dangerous desktop labels", () => {
    const result = evaluateToolCall({
      pluginId: "mouse.click",
      riskLevel: "medium",
      input: { visibleText: "Submit payment" }
    });

    expect(result.decision).toBe("require_approval");
  });

  it("denies automatic typing into password or verification fields", () => {
    const result = evaluateToolCall({
      pluginId: "keyboard.type",
      riskLevel: "medium",
      input: { fieldRole: "password", text: "secret" }
    });

    expect(result.decision).toBe("deny");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/policy/src/policy-engine.test.ts
```

Expected: FAIL because `policy-engine.ts` does not exist.

- [ ] **Step 4: Implement policy engine**

Create `packages/policy/src/policy-engine.ts`:

```ts
import type { ApprovalDecision, RiskLevel } from "@local-agent/shared";

export type PolicyInput = {
  pluginId: string;
  riskLevel: RiskLevel;
  input: Record<string, unknown>;
};

export type PolicyResult = {
  decision: ApprovalDecision;
  reason: string;
};

const disabledCriticalPlugins = new Set(["file.delete", "email.send", "shell.exec"]);

const approvalLabels = [
  "send",
  "submit",
  "delete",
  "pay",
  "confirm",
  "purchase",
  "authorize",
  "install",
  "发送",
  "提交",
  "删除",
  "付款",
  "确认",
  "购买",
  "授权",
  "安装"
];

export function evaluateToolCall(call: PolicyInput): PolicyResult {
  if (disabledCriticalPlugins.has(call.pluginId)) {
    return {
      decision: "deny",
      reason: `${call.pluginId} is disabled in the MVP`
    };
  }

  if (call.pluginId === "keyboard.type" && isSensitiveInputTarget(call.input)) {
    return {
      decision: "deny",
      reason: "automatic typing into password or verification fields is denied"
    };
  }

  if (call.pluginId === "mouse.click" && containsApprovalLabel(call.input)) {
    return {
      decision: "require_approval",
      reason: "desktop action appears to trigger a sensitive confirmation"
    };
  }

  if (call.riskLevel === "high") {
    return {
      decision: "require_approval",
      reason: "high risk tool calls require user approval"
    };
  }

  if (call.riskLevel === "critical") {
    return {
      decision: "require_approval",
      reason: "critical risk tool calls require explicit user approval"
    };
  }

  return {
    decision: "allow",
    reason: `${call.riskLevel} risk tool call is allowed by default`
  };
}

function containsApprovalLabel(input: Record<string, unknown>): boolean {
  const visibleText = String(input.visibleText ?? "").toLowerCase();
  return approvalLabels.some((label) => visibleText.includes(label.toLowerCase()));
}

function isSensitiveInputTarget(input: Record<string, unknown>): boolean {
  const fieldRole = String(input.fieldRole ?? "").toLowerCase();
  const label = String(input.label ?? "").toLowerCase();
  return fieldRole.includes("password") || fieldRole.includes("verification") || label.includes("验证码");
}
```

Create `packages/policy/src/index.ts`:

```ts
export * from "./policy-engine";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/policy/src/policy-engine.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/policy typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/policy
git commit -m "feat: add risk based policy engine"
```

Expected: commit succeeds.

---

### Task 4: Plugin Registry And Built-In Plugin Metadata

**Files:**
- Create: `packages/plugins/package.json`
- Create: `packages/plugins/tsconfig.json`
- Create: `packages/plugins/src/registry.ts`
- Create: `packages/plugins/src/builtin-plugins.ts`
- Create: `packages/plugins/src/index.ts`
- Create: `packages/plugins/src/registry.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/plugins/package.json`:

```json
{
  "name": "@local-agent/plugins",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@local-agent/shared": "workspace:*"
  }
}
```

Create `packages/plugins/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing registry tests**

Create `packages/plugins/src/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { builtinPlugins, createPluginRegistry } from "./index";

describe("plugin registry", () => {
  it("registers MVP plugin metadata", () => {
    const registry = createPluginRegistry(builtinPlugins);

    expect(registry.get("file.scan")?.riskLevel).toBe("low");
    expect(registry.get("file.move")?.reversible).toBe(true);
    expect(registry.get("email.draft")?.riskLevel).toBe("medium");
  });

  it("throws on duplicate plugin ids", () => {
    expect(() => createPluginRegistry([builtinPlugins[0], builtinPlugins[0]])).toThrow("Duplicate plugin id");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/plugins/src/registry.test.ts
```

Expected: FAIL because registry exports do not exist.

- [ ] **Step 4: Implement registry**

Create `packages/plugins/src/registry.ts`:

```ts
import type { ToolPlugin } from "@local-agent/shared";

export type PluginRegistry = {
  list(): ToolPlugin[];
  get(id: string): ToolPlugin | undefined;
};

export function createPluginRegistry(plugins: ToolPlugin[]): PluginRegistry {
  const byId = new Map<string, ToolPlugin>();

  for (const plugin of plugins) {
    if (byId.has(plugin.id)) {
      throw new Error(`Duplicate plugin id: ${plugin.id}`);
    }
    byId.set(plugin.id, plugin);
  }

  return {
    list: () => [...byId.values()],
    get: (id: string) => byId.get(id)
  };
}
```

Create `packages/plugins/src/builtin-plugins.ts`:

```ts
import type { ToolPlugin } from "@local-agent/shared";

export const builtinPlugins: ToolPlugin[] = [
  { id: "screen.capture", name: "Capture Screen", description: "Capture the current screen.", permissions: [{ kind: "screen", scope: "capture" }], riskLevel: "low", reversible: false },
  { id: "window.list", name: "List Windows", description: "List visible windows.", permissions: [{ kind: "window", scope: "read" }], riskLevel: "low", reversible: false },
  { id: "window.focus", name: "Focus Window", description: "Focus a visible window.", permissions: [{ kind: "window", scope: "focus" }], riskLevel: "medium", reversible: false },
  { id: "app.open", name: "Open App", description: "Open an installed application.", permissions: [{ kind: "app", scope: "open" }], riskLevel: "medium", reversible: false },
  { id: "mouse.click", name: "Mouse Click", description: "Click a visible UI element.", permissions: [{ kind: "mouse", scope: "click" }], riskLevel: "medium", reversible: false },
  { id: "keyboard.type", name: "Type Text", description: "Type text into the focused field.", permissions: [{ kind: "keyboard", scope: "type" }], riskLevel: "medium", reversible: false },
  { id: "keyboard.hotkey", name: "Keyboard Hotkey", description: "Send a keyboard shortcut.", permissions: [{ kind: "keyboard", scope: "hotkey" }], riskLevel: "medium", reversible: false },
  { id: "file.scan", name: "Scan Files", description: "Scan file names and metadata.", permissions: [{ kind: "file", scope: "scan" }], riskLevel: "low", reversible: false },
  { id: "file.read", name: "Read File", description: "Read file contents.", permissions: [{ kind: "file", scope: "read" }], riskLevel: "medium", reversible: false },
  { id: "file.move", name: "Move File", description: "Move files between folders.", permissions: [{ kind: "file", scope: "move" }], riskLevel: "high", reversible: true },
  { id: "file.rename", name: "Rename File", description: "Rename a file.", permissions: [{ kind: "file", scope: "rename" }], riskLevel: "high", reversible: true },
  { id: "pdf.extract", name: "Extract PDF", description: "Extract text from a PDF.", permissions: [{ kind: "document", scope: "pdf.extract" }], riskLevel: "medium", reversible: false },
  { id: "spreadsheet.read", name: "Read Spreadsheet", description: "Read spreadsheet data.", permissions: [{ kind: "document", scope: "spreadsheet.read" }], riskLevel: "medium", reversible: false },
  { id: "email.draft", name: "Draft Email", description: "Create an email draft without sending.", permissions: [{ kind: "email", scope: "draft" }], riskLevel: "medium", reversible: true }
];
```

Create `packages/plugins/src/index.ts`:

```ts
export * from "./builtin-plugins";
export * from "./registry";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/plugins/src/registry.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/plugins typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/plugins
git commit -m "feat: add plugin registry"
```

Expected: commit succeeds.

---

### Task 5: Model Router Interface

**Files:**
- Create: `packages/model-router/package.json`
- Create: `packages/model-router/tsconfig.json`
- Create: `packages/model-router/src/model-router.ts`
- Create: `packages/model-router/src/index.ts`
- Create: `packages/model-router/src/model-router.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/model-router/package.json`:

```json
{
  "name": "@local-agent/model-router",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  }
}
```

Create `packages/model-router/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing model router tests**

Create `packages/model-router/src/model-router.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createModelRouter } from "./model-router";

describe("model router", () => {
  it("selects configured models by purpose", () => {
    const router = createModelRouter({
      planning: "strong-model",
      text: "fast-model",
      vision: "vision-model"
    });

    expect(router.selectModel("planning")).toBe("strong-model");
    expect(router.selectModel("text")).toBe("fast-model");
    expect(router.selectModel("vision")).toBe("vision-model");
  });

  it("falls back to text model for unknown purposes", () => {
    const router = createModelRouter({
      planning: "strong-model",
      text: "fast-model",
      vision: "vision-model"
    });

    expect(router.selectModel("office-summary")).toBe("fast-model");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/model-router/src/model-router.test.ts
```

Expected: FAIL because `model-router.ts` does not exist.

- [ ] **Step 4: Implement model router**

Create `packages/model-router/src/model-router.ts`:

```ts
export type ModelPurpose = "planning" | "text" | "vision" | string;

export type ModelRouterConfig = {
  planning: string;
  text: string;
  vision: string;
};

export type ModelRouter = {
  selectModel(purpose: ModelPurpose): string;
};

export function createModelRouter(config: ModelRouterConfig): ModelRouter {
  return {
    selectModel(purpose: ModelPurpose): string {
      if (purpose === "planning") return config.planning;
      if (purpose === "vision") return config.vision;
      return config.text;
    }
  };
}
```

Create `packages/model-router/src/index.ts`:

```ts
export * from "./model-router";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/model-router/src/model-router.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/model-router typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/model-router
git commit -m "feat: add model router"
```

Expected: commit succeeds.

---

### Task 6: Built-In Agent Profiles And Planner

**Files:**
- Create: `packages/agents/package.json`
- Create: `packages/agents/tsconfig.json`
- Create: `packages/agents/src/profiles.ts`
- Create: `packages/agents/src/planner-agent.ts`
- Create: `packages/agents/src/index.ts`
- Create: `packages/agents/src/planner-agent.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/agents/package.json`:

```json
{
  "name": "@local-agent/agents",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@local-agent/shared": "workspace:*"
  }
}
```

Create `packages/agents/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing planner tests**

Create `packages/agents/src/planner-agent.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialPlan, defaultAgentProfiles } from "./index";

describe("planner agent", () => {
  it("defines the four MVP agents", () => {
    expect(defaultAgentProfiles.map((agent) => agent.id)).toEqual([
      "planner",
      "desktop",
      "file",
      "office"
    ]);
  });

  it("routes file organization prompts to the file agent", () => {
    const plan = createInitialPlan("organize my Downloads invoices");

    expect(plan[0].agentId).toBe("file");
    expect(plan.some((step) => step.approvalRequired)).toBe(true);
  });

  it("routes PDF and spreadsheet prompts to the office agent", () => {
    expect(createInitialPlan("summarize this PDF")[0].agentId).toBe("office");
    expect(createInitialPlan("read this spreadsheet")[0].agentId).toBe("office");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/agents/src/planner-agent.test.ts
```

Expected: FAIL because agent exports do not exist.

- [ ] **Step 4: Implement agent profiles and planner**

Create `packages/agents/src/profiles.ts`:

```ts
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
    allowedPlugins: ["screen.capture", "window.list", "window.focus", "app.open", "mouse.click", "keyboard.type", "keyboard.hotkey"],
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
```

Create `packages/agents/src/planner-agent.ts`:

```ts
import type { PlanStep } from "@local-agent/shared";

export function createInitialPlan(prompt: string): PlanStep[] {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("download") || normalized.includes("invoice") || normalized.includes("contract") || normalized.includes("file")) {
    return [
      {
        id: "scan-files",
        title: "Scan candidate files",
        agentId: "file",
        toolCalls: [{ id: "scan-files-call", pluginId: "file.scan", input: {}, riskLevel: "low", approvalRequired: false }],
        riskLevel: "low",
        approvalRequired: false,
        status: "pending"
      },
      {
        id: "move-files",
        title: "Move approved files",
        agentId: "file",
        toolCalls: [{ id: "move-files-call", pluginId: "file.move", input: {}, riskLevel: "high", approvalRequired: true }],
        riskLevel: "high",
        approvalRequired: true,
        status: "pending"
      }
    ];
  }

  if (normalized.includes("pdf") || normalized.includes("spreadsheet") || normalized.includes("excel") || normalized.includes("csv")) {
    return [
      {
        id: "process-office-document",
        title: "Process office document",
        agentId: "office",
        toolCalls: [{ id: "read-document-call", pluginId: normalized.includes("spreadsheet") ? "spreadsheet.read" : "pdf.extract", input: {}, riskLevel: "medium", approvalRequired: false }],
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
      toolCalls: [{ id: "capture-screen-call", pluginId: "screen.capture", input: {}, riskLevel: "low", approvalRequired: false }],
      riskLevel: "low",
      approvalRequired: false,
      status: "pending"
    }
  ];
}
```

Create `packages/agents/src/index.ts`:

```ts
export * from "./planner-agent";
export * from "./profiles";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/agents/src/planner-agent.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/agents typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/agents
git commit -m "feat: add built in agent profiles"
```

Expected: commit succeeds.

---

### Task 7: Agent Runtime State Machine

**Files:**
- Create: `packages/runtime/package.json`
- Create: `packages/runtime/tsconfig.json`
- Create: `packages/runtime/src/runtime.ts`
- Create: `packages/runtime/src/index.ts`
- Create: `packages/runtime/src/runtime.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/runtime/package.json`:

```json
{
  "name": "@local-agent/runtime",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@local-agent/agents": "workspace:*",
    "@local-agent/policy": "workspace:*",
    "@local-agent/shared": "workspace:*"
  }
}
```

Create `packages/runtime/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing runtime tests**

Create `packages/runtime/src/runtime.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRuntime } from "./runtime";

describe("agent runtime", () => {
  it("creates a task run with an initial plan", () => {
    const runtime = createRuntime();
    const run = runtime.createTask("organize Downloads");

    expect(run.status).toBe("planning");
    expect(run.plan.length).toBeGreaterThan(0);
    expect(run.selectedAgent).toBe("planner");
  });

  it("marks task as waiting for approval when high risk steps exist", () => {
    const runtime = createRuntime();
    const run = runtime.startTask("organize Downloads invoices");

    expect(run.status).toBe("waiting_approval");
    expect(run.plan.some((step) => step.approvalRequired)).toBe(true);
  });

  it("runs low and medium only tasks without approval", () => {
    const runtime = createRuntime();
    const run = runtime.startTask("summarize this PDF");

    expect(run.status).toBe("completed");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/runtime/src/runtime.test.ts
```

Expected: FAIL because runtime exports do not exist.

- [ ] **Step 4: Implement runtime**

Create `packages/runtime/src/runtime.ts`:

```ts
import { createInitialPlan } from "@local-agent/agents";
import { evaluateToolCall } from "@local-agent/policy";
import { createTaskRun, type TaskRun } from "@local-agent/shared";

export type AgentRuntime = {
  createTask(prompt: string): TaskRun;
  startTask(prompt: string): TaskRun;
};

export function createRuntime(): AgentRuntime {
  return {
    createTask(prompt: string): TaskRun {
      const run = createTaskRun({
        id: `task-${Date.now()}`,
        userPrompt: prompt,
        selectedAgent: "planner"
      });
      run.plan = createInitialPlan(prompt);
      return run;
    },

    startTask(prompt: string): TaskRun {
      const run = this.createTask(prompt);
      const needsApproval = run.plan.some((step) =>
        step.toolCalls.some((call) => evaluateToolCall(call).decision === "require_approval")
      );

      run.status = needsApproval ? "waiting_approval" : "completed";
      return run;
    }
  };
}
```

Create `packages/runtime/src/index.ts`:

```ts
export * from "./runtime";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/runtime/src/runtime.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/runtime typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/runtime
git commit -m "feat: add agent runtime state machine"
```

Expected: commit succeeds.

---

### Task 8: Audit Persistence Interface

**Files:**
- Create: `packages/persistence/package.json`
- Create: `packages/persistence/tsconfig.json`
- Create: `packages/persistence/src/audit-store.ts`
- Create: `packages/persistence/src/index.ts`
- Create: `packages/persistence/src/audit-store.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/persistence/package.json`:

```json
{
  "name": "@local-agent/persistence",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@local-agent/shared": "workspace:*"
  }
}
```

Create `packages/persistence/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing audit store tests**

Create `packages/persistence/src/audit-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createMemoryAuditStore } from "./audit-store";

describe("audit store", () => {
  it("stores task events by task id", async () => {
    const store = createMemoryAuditStore();

    await store.appendEvent({
      id: "event-1",
      taskId: "task-1",
      type: "audit",
      message: "file.scan allowed",
      createdAt: "2026-05-10T00:00:00.000Z"
    });

    expect(await store.listEvents("task-1")).toHaveLength(1);
    expect(await store.listEvents("task-2")).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test packages/persistence/src/audit-store.test.ts
```

Expected: FAIL because audit store exports do not exist.

- [ ] **Step 4: Implement audit store interface and memory adapter**

Create `packages/persistence/src/audit-store.ts`:

```ts
import type { TaskEvent } from "@local-agent/shared";

export type AuditStore = {
  appendEvent(event: TaskEvent): Promise<void>;
  listEvents(taskId: string): Promise<TaskEvent[]>;
};

export function createMemoryAuditStore(): AuditStore {
  const events: TaskEvent[] = [];

  return {
    async appendEvent(event: TaskEvent): Promise<void> {
      events.push(event);
    },

    async listEvents(taskId: string): Promise<TaskEvent[]> {
      return events.filter((event) => event.taskId === taskId);
    }
  };
}
```

Create `packages/persistence/src/index.ts`:

```ts
export * from "./audit-store";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test packages/persistence/src/audit-store.test.ts
```

Expected: PASS.

- [ ] **Step 6: Typecheck package**

Run:

```bash
pnpm --filter @local-agent/persistence typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/persistence
git commit -m "feat: add audit persistence interface"
```

Expected: commit succeeds.

---

### Task 9: Tauri 2 Desktop App Shell

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/index.html`
- Create: `apps/desktop/src/main.tsx`
- Create: `apps/desktop/src/App.tsx`
- Create: `apps/desktop/src/App.test.tsx`
- Create: `apps/desktop/src/styles.css`
- Create: `apps/desktop/src-tauri/Cargo.toml`
- Create: `apps/desktop/src-tauri/tauri.conf.json`
- Create: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/lib.rs`

- [ ] **Step 1: Create desktop package metadata**

Create `apps/desktop/package.json`:

```json
{
  "name": "@local-agent/desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "tauri": "tauri",
    "build": "vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@local-agent/runtime": "workspace:*",
    "@tauri-apps/api": "^2.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.2.7"
  }
}
```

Create `apps/desktop/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 2: Write failing UI test**

Create `apps/desktop/src/App.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("shows the task console shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Local Agent Studio" })).toBeInTheDocument();
    expect(screen.getByLabelText("Task")).toBeInTheDocument();
    expect(screen.getByText("Approval Queue")).toBeInTheDocument();
    expect(screen.getByText("Execution Log")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm test apps/desktop/src/App.test.tsx
```

Expected: FAIL because `App.tsx` does not exist.

- [ ] **Step 4: Implement React shell**

Create `apps/desktop/src/App.tsx`:

```tsx
import { useMemo, useState } from "react";
import { createRuntime } from "@local-agent/runtime";
import "./styles.css";

export default function App() {
  const runtime = useMemo(() => createRuntime(), []);
  const [task, setTask] = useState("organize Downloads invoices");
  const [result, setResult] = useState(() => runtime.createTask(task));

  return (
    <main className="shell">
      <section className="hero">
        <h1>Local Agent Studio</h1>
        <p>Plan, approve, and audit local computer agent tasks.</p>
      </section>

      <section className="task-panel">
        <label htmlFor="task">Task</label>
        <textarea id="task" value={task} onChange={(event) => setTask(event.target.value)} />
        <button type="button" onClick={() => setResult(runtime.startTask(task))}>Create Plan</button>
      </section>

      <section className="grid">
        <article>
          <h2>Current Plan</h2>
          <ol>
            {result.plan.map((step) => (
              <li key={step.id}>
                <strong>{step.title}</strong>
                <span>{step.agentId} · {step.riskLevel}</span>
              </li>
            ))}
          </ol>
        </article>

        <article>
          <h2>Approval Queue</h2>
          <p>{result.status === "waiting_approval" ? "Approval required before continuing." : "No approvals waiting."}</p>
        </article>

        <article>
          <h2>Execution Log</h2>
          <p>Status: {result.status}</p>
        </article>
      </section>
    </main>
  );
}
```

Create `apps/desktop/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `apps/desktop/src/styles.css`:

```css
:root {
  color: #172026;
  background: #f6f7f8;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.shell {
  min-height: 100vh;
  padding: 32px;
}

.hero {
  margin-bottom: 24px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

.task-panel,
article {
  border: 1px solid #d9dee3;
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
}

.task-panel {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

textarea {
  min-height: 88px;
  resize: vertical;
}

button {
  width: fit-content;
  padding: 8px 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

li {
  margin-bottom: 12px;
}

li span {
  display: block;
  color: #5f6b76;
  font-size: 13px;
}
```

Create `apps/desktop/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Local Agent Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Add minimal Tauri shell files**

Create `apps/desktop/src-tauri/Cargo.toml`:

```toml
[package]
name = "local-agent-studio"
version = "0.1.0"
description = "Local Agent Studio"
authors = ["Local Agent"]
edition = "2021"

[lib]
name = "local_agent_studio_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Create `apps/desktop/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Local Agent Studio",
  "version": "0.1.0",
  "identifier": "studio.local-agent.app",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://127.0.0.1:5173",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Local Agent Studio",
        "width": 1200,
        "height": 800
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

Create `apps/desktop/src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn healthcheck() -> &'static str {
    "ok"
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![healthcheck])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Create `apps/desktop/src-tauri/src/main.rs`:

```rust
fn main() {
    local_agent_studio_lib::run();
}
```

- [ ] **Step 6: Run UI test to verify it passes**

Run:

```bash
pnpm test apps/desktop/src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Typecheck desktop package**

Run:

```bash
pnpm --filter @local-agent/desktop typecheck
```

Expected: PASS.

- [ ] **Step 8: Build frontend**

Run:

```bash
pnpm --filter @local-agent/desktop build
```

Expected: Vite build succeeds.

- [ ] **Step 9: Commit**

Run:

```bash
git add apps/desktop
git commit -m "feat: add tauri desktop shell"
```

Expected: commit succeeds.

---

### Task 10: End-To-End Foundation Verification

**Files:**
- Create: `docs/mvp-foundation-verification.md`

- [ ] **Step 1: Create verification checklist**

Create `docs/mvp-foundation-verification.md`:

```markdown
# MVP Foundation Verification

Run these commands from the repository root.

## Typecheck

```bash
pnpm typecheck
```

Expected: all workspace packages pass TypeScript checks.

## Tests

```bash
pnpm test
```

Expected: shared, policy, plugins, model-router, agents, runtime, persistence, and desktop tests pass.

## Frontend Build

```bash
pnpm --filter @local-agent/desktop build
```

Expected: Vite builds the desktop frontend.

## Manual UI Smoke Test

```bash
pnpm dev
```

Expected:

- App opens in Vite dev server.
- "Local Agent Studio" heading is visible.
- Entering "organize Downloads invoices" and pressing "Create Plan" shows a file plan.
- Approval Queue says approval is required.
- Entering "summarize this PDF" and pressing "Create Plan" completes without approval.
```

- [ ] **Step 2: Run full typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Run frontend build**

Run:

```bash
pnpm --filter @local-agent/desktop build
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/mvp-foundation-verification.md
git commit -m "docs: add mvp foundation verification"
```

Expected: commit succeeds.

---

## Self-Review Notes

Spec coverage:

- Desktop app shell: Task 9.
- Task console, plan, approval queue, execution log: Task 9.
- Shared task, plan, agent, plugin types: Task 2.
- Risk-based approvals: Task 3.
- Plugin protocol and MVP plugin metadata: Task 4.
- Model router: Task 5.
- Built-in Planner, Desktop, File, and Office agent profiles: Task 6.
- Runtime task lifecycle: Task 7.
- Audit persistence interface: Task 8.
- Verification standards: Task 10.

Known gaps intentionally deferred to later plans:

- Real macOS and Windows OS adapters.
- Real screenshot capture, mouse, keyboard, and window control.
- Real PDF and spreadsheet parsers.
- Real cloud model provider adapters.
- SQLite-backed audit store.
- Production packaging and signing.

