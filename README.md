# 本地智能体工作台

本项目是一个本地电脑智能体平台的 MVP 基础工程。它使用 Tauri 2、React、TypeScript 和 pnpm workspace 构建桌面应用，并将智能体运行时、策略引擎、插件协议、模型路由和审计存储拆分为独立包。

当前版本重点验证平台骨架和一个可测试的纵向切片：用户可以在桌面界面中新建会话、发送消息，系统通过运行时事件流模拟 assistant 输出、agent 步骤和工具调用流程，并在本地恢复会话历史。

## 项目能力

- 会话工作台：新建会话、发送消息、流式 assistant 输出、本地历史恢复。
- 调用流程面板：实时展示 agent 步骤、工具调用、风险审批和模拟输出。
- 规划智能体：根据任务提示生成初始执行步骤。
- 内置智能体配置：规划、桌面、文件、办公四类智能体。
- 插件协议：屏幕、窗口、应用、鼠标、键盘、剪贴板、文件、PDF、表格和邮件草稿等插件元数据。
- 策略引擎：按风险等级决定允许、审批或拒绝。
- 模型路由：按规划、文本、视觉用途选择模型。
- 审计存储接口：提供内存实现，方便 MVP 测试。

## 目录结构

```text
.
├── apps/
│   └── desktop/                 # Tauri 2 桌面应用
│       ├── src/                 # React 前端界面
│       └── src-tauri/           # Tauri/Rust 桌面外壳
├── packages/
│   ├── agents/                  # 内置智能体 profile 和规划逻辑
│   ├── model-router/            # 多模型路由
│   ├── persistence/             # 审计存储接口与内存实现
│   ├── plugins/                 # 插件注册表与内置插件元数据
│   ├── policy/                  # 策略引擎和风险审批规则
│   ├── runtime/                 # 智能体运行时与任务生命周期
│   └── shared/                  # 共享领域类型和工具函数
├── docs/
│   ├── mvp-foundation-verification.md
│   └── superpowers/
│       ├── plans/               # 实施计划文档
│       └── specs/               # 系统设计文档
├── package.json                 # 根脚本和开发依赖
├── pnpm-workspace.yaml          # workspace 配置
├── tsconfig.base.json           # 共享 TypeScript 配置
└── vitest.config.ts             # 测试配置
```

## 环境要求

- Node.js 22 或兼容版本
- pnpm 9.15.0
- Rust 工具链
- Tauri 2 所需的系统依赖

如果本机使用 nvm，可以先加载 Node：

```bash
source ~/.nvm/nvm.sh
nvm use
```

如果运行 `pnpm --filter @local-agent/desktop tauri dev` 时提示找不到 `cargo metadata`，说明 Rust 工具链未安装，或 `cargo` 不在当前 shell 的 PATH 中。macOS 可先安装 Rust：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
cargo --version
```

确认 `cargo --version` 能正常输出后，再重新执行 Tauri 命令。

## 安装依赖

```bash
pnpm install
```

## 本地开发

启动桌面前端开发服务器：

```bash
pnpm dev
```

默认 Vite 地址为：

```text
http://127.0.0.1:1420
```

如需通过 Tauri 启动桌面外壳：

```bash
pnpm --filter @local-agent/desktop tauri dev
```

## 常用命令

```bash
pnpm test
pnpm typecheck
pnpm --filter @local-agent/desktop build
```

命令说明：

- `pnpm test`：运行全部 Vitest 测试。
- `pnpm typecheck`：检查所有 workspace 包的 TypeScript 类型。
- `pnpm --filter @local-agent/desktop build`：构建桌面前端。
- `pnpm dev`：启动桌面前端开发服务器。

## 当前任务示例

界面默认任务是：

```text
整理 Downloads 里的发票
```

该任务会被路由到文件智能体，并生成包含高风险文件移动步骤的计划，因此审批队列会显示待审批项。

也可以输入：

```text
总结这个 PDF
```

该任务会被路由到办公智能体，当前 MVP 中会生成无需审批的办公文档处理计划。

## MVP 范围

当前实现的是平台基础能力，agent 和工具链通过运行时事件流与模拟执行器打通，尚未连接真实模型供应商或真实系统自动化。以下能力仍是后续计划：

- 真实 macOS 和 Windows 操作系统适配器。
- 真实截图、鼠标、键盘和窗口控制。
- 真实 PDF 和表格解析。
- 真实云端模型供应商适配器。
- SQLite 支持的审计存储。
- 生产打包、签名和发布。

## 文档

- 系统设计：[docs/superpowers/specs/2026-05-10-local-agent-system-design.md](docs/superpowers/specs/2026-05-10-local-agent-system-design.md)
- 实施计划：[docs/superpowers/plans/2026-05-10-local-agent-mvp-foundation.md](docs/superpowers/plans/2026-05-10-local-agent-mvp-foundation.md)
- 验收说明：[docs/mvp-foundation-verification.md](docs/mvp-foundation-verification.md)
