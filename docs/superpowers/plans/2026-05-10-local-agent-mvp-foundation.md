# 本地智能体 MVP 基础实施计划

> **给智能体执行者：** 如需继续扩展本计划，优先使用 superpowers:subagent-driven-development；单线程执行时使用 superpowers:executing-plans。任务项使用 checkbox（`- [ ]`）语法跟踪进度。

**目标：** 构建 Tauri 2 本地电脑智能体平台的第一版基础能力：桌面外壳、类型化运行时、策略引擎、插件协议、模型路由、内置智能体骨架、审计持久化接口和任务控制台 UI。

**架构：** 项目是 pnpm monorepo。桌面应用位于 `apps/desktop`，通过 workspace 引用 `packages/*`。第一版将操作系统自动化隔离在类型化适配器接口之后，并使用 fake/test adapter 保证测试确定性；真实 macOS/Windows 适配器由后续计划实现。

**技术栈：** Tauri 2、React、TypeScript、Vite、Vitest、pnpm workspaces、Rust Tauri shell commands，以及带内存实现的审计存储接口。

---

## 范围说明

系统设计文档覆盖多个子系统。本计划实现 MVP 基础和一个可测试的纵向切片，不实现真实鼠标/键盘控制、真实屏幕截图、原生 PDF 解析、原生表格解析或生产级云端模型调用。

这些能力会被接口隔离，后续计划可以在不改变 Runtime、Policy Engine 或 UI 合约的前提下补齐真实适配器。

设计来源：`docs/superpowers/specs/2026-05-10-local-agent-system-design.md`

## 文件结构

目标结构：

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
    ├── policy/
    ├── plugins/
    ├── model-router/
    ├── agents/
    ├── runtime/
    └── persistence/
```

---

## 任务 1：初始化 Monorepo 工具链

**文件：**

- 创建：`package.json`
- 创建：`pnpm-workspace.yaml`
- 创建：`tsconfig.base.json`
- 创建：`vitest.config.ts`
- 修改：`.gitignore`

- [x] 初始化 git 仓库。
- [x] 创建根 package 元数据和脚本。
- [x] 创建 workspace 配置。
- [x] 创建共享 TypeScript 配置。
- [x] 创建 Vitest 配置。
- [x] 扩展本地构建和缓存忽略规则。
- [x] 执行 `pnpm install` 生成 `pnpm-lock.yaml`。
- [x] 执行基础测试命令。

## 任务 2：共享领域类型

**文件：**

- 创建：`packages/shared/package.json`
- 创建：`packages/shared/src/domain.ts`
- 创建：`packages/shared/src/index.ts`
- 创建：`packages/shared/src/domain.test.ts`

- [x] 定义 `RiskLevel`、任务状态、步骤状态和审批决策类型。
- [x] 定义 `TaskRun`、`PlanStep`、`ToolCall`、`Artifact`、`TaskEvent`。
- [x] 定义 `AgentProfile`、`Permission`、`ToolPlugin`。
- [x] 实现风险等级比较和任务运行记录创建工具。
- [x] 添加共享类型单元测试。

## 任务 3：策略引擎

**文件：**

- 创建：`packages/policy/package.json`
- 创建：`packages/policy/src/index.ts`
- 创建：`packages/policy/src/policy-engine.ts`
- 创建：`packages/policy/src/policy-engine.test.ts`

- [x] 实现基于风险等级的策略判断。
- [x] 对高风险调用返回 `require_approval`。
- [x] 对 `file.delete`、`email.send`、`shell.exec` 返回 `deny`。
- [x] 禁止向密码或验证码字段自动输入。
- [x] 对敏感可见文本上的鼠标点击要求审批。
- [x] 添加中文策略原因文案。

## 任务 4：插件协议和内置插件

**文件：**

- 创建：`packages/plugins/package.json`
- 创建：`packages/plugins/src/index.ts`
- 创建：`packages/plugins/src/registry.ts`
- 创建：`packages/plugins/src/builtin-plugins.ts`
- 创建：`packages/plugins/src/registry.test.ts`

- [x] 实现插件注册表。
- [x] 注册屏幕、窗口、应用、鼠标、键盘、剪贴板、文件、PDF、表格和邮件草稿插件。
- [x] 为每个插件声明权限、风险等级、schema 和可逆性。
- [x] 将插件名称和说明中文化。

## 任务 5：模型路由

**文件：**

- 创建：`packages/model-router/package.json`
- 创建：`packages/model-router/src/index.ts`
- 创建：`packages/model-router/src/model-router.ts`
- 创建：`packages/model-router/src/model-router.test.ts`

- [x] 定义规划、文本和视觉用途。
- [x] 按用途选择配置模型。
- [x] 对未知用途回退到文本模型。

## 任务 6：内置智能体骨架

**文件：**

- 创建：`packages/agents/package.json`
- 创建：`packages/agents/src/index.ts`
- 创建：`packages/agents/src/profiles.ts`
- 创建：`packages/agents/src/planner-agent.ts`
- 创建：`packages/agents/src/planner-agent.test.ts`

- [x] 定义规划、桌面、文件和办公智能体 profile。
- [x] 根据任务提示生成初始计划。
- [x] 将文件整理任务路由到文件智能体。
- [x] 将 PDF、表格任务路由到办公智能体。
- [x] 将其他任务路由到桌面智能体。
- [x] 支持中文任务关键词，例如 `整理`、`发票`、`合同`、`表格`、`文档`。

## 任务 7：运行时纵向切片

**文件：**

- 创建：`packages/runtime/package.json`
- 创建：`packages/runtime/src/index.ts`
- 创建：`packages/runtime/src/runtime.ts`
- 创建：`packages/runtime/src/runtime.test.ts`

- [x] 实现 `createTask` 和 `startTask`。
- [x] 通过规划智能体生成计划。
- [x] 使用插件注册表的标准风险等级覆盖规划器风险等级。
- [x] 对每个工具调用执行策略评估。
- [x] 根据拒绝、审批和通过结果决定任务状态。
- [x] 用中文测试用例覆盖主要路径。

## 任务 8：审计持久化接口

**文件：**

- 创建：`packages/persistence/package.json`
- 创建：`packages/persistence/src/index.ts`
- 创建：`packages/persistence/src/audit-store.ts`
- 创建：`packages/persistence/src/audit-store.test.ts`

- [x] 定义审计存储接口。
- [x] 提供内存实现，用于 MVP 测试。
- [x] 支持保存和读取任务运行记录。

## 任务 9：Tauri 桌面外壳和任务控制台

**文件：**

- 创建：`apps/desktop/package.json`
- 创建：`apps/desktop/src/App.tsx`
- 创建：`apps/desktop/src/main.tsx`
- 创建：`apps/desktop/src/styles.css`
- 创建：`apps/desktop/src/App.test.tsx`
- 创建：`apps/desktop/index.html`
- 创建：`apps/desktop/src-tauri/Cargo.toml`
- 创建：`apps/desktop/src-tauri/tauri.conf.json`
- 创建：`apps/desktop/src-tauri/src/lib.rs`
- 创建：`apps/desktop/src-tauri/src/main.rs`

- [x] 实现任务输入。
- [x] 展示当前计划。
- [x] 展示审批队列。
- [x] 展示执行日志。
- [x] 接入运行时纵向切片。
- [x] 将页面标题、按钮、状态、风险和说明文案中文化。
- [x] 将 HTML 语言设置为 `zh-CN`。
- [x] 将 Tauri 产品名和窗口标题改为 `本地智能体工作台`。

## 任务 10：端到端基础验收

**文件：**

- 创建：`docs/mvp-foundation-verification.md`

- [x] 写入中文验收清单。
- [x] 覆盖类型检查、自动化测试、前端构建和手动 UI 冒烟测试。
- [ ] 执行 `pnpm typecheck`。
- [ ] 执行 `pnpm test`。
- [ ] 执行 `pnpm --filter @local-agent/desktop build`。

---

## 自检记录

规格覆盖：

- 桌面应用外壳：任务 9。
- 任务控制台、计划、审批队列、执行日志：任务 9。
- 共享任务、计划、智能体和插件类型：任务 2。
- 基于风险的审批：任务 3。
- 插件协议和 MVP 插件元数据：任务 4。
- 模型路由：任务 5。
- 内置规划、桌面、文件和办公智能体 profile：任务 6。
- 运行时任务生命周期：任务 7。
- 审计持久化接口：任务 8。
- 验收标准：任务 10。

有意延后：

- 真实 macOS 和 Windows 操作系统适配器。
- 真实截图、鼠标、键盘和窗口控制。
- 真实 PDF 和表格解析器。
- 真实云端模型供应商适配器。
- SQLite 支持的审计存储。
- 生产打包和签名。
