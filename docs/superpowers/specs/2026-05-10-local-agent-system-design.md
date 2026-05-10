# 本地智能体系统设计

日期：2026-05-10

## 摘要

构建一个跨平台桌面应用，作为本地电脑智能体平台。第一版使用 Tauri 2 作为桌面外壳，支持 macOS 和 Windows，聚焦三个实用内置智能体：桌面操作、文件整理和办公自动化。

系统既要让普通用户觉得可用，也要保留平台级内部架构：智能体运行时、插件协议、策略引擎、模型路由、审计日志和操作系统适配层。

## 目标

- 提供可操作用户电脑的本地桌面应用。
- 第一版支持 macOS 和 Windows。
- 以云端模型 API 作为主要 AI 后端。
- 支持多模型路由，让不同智能体和任务使用不同模型。
- 默认支持屏幕截图和屏幕理解。
- 默认允许向云端模型发送数据，但必须有清晰的隐私披露。
- 对敏感操作采用基于风险的审批。
- 第一版交付真实的平台核心和三个可用工作流。

## MVP 不做

- 插件市场。
- 团队协作。
- 企业管理控制台。
- 远程控制电脑。
- 本地模型支持。
- 完全自主执行高风险操作。
- 自动输入密码或验证码。
- 支付、购买、法律、金融、医疗或政府表单自动化。

## 产品形态

产品是桌面应用，不只是聊天窗口。主界面是任务控制台，包含：

- 任务输入。
- 当前计划。
- 审批队列。
- 实时执行日志。
- 结果产物。
- 任务历史。
- 模型密钥、隐私、权限和风险控制设置。

典型用户流程：

1. 用户输入任务，例如“整理 Downloads 里的发票和合同”。
2. 系统选择智能体，必要时由规划智能体创建步骤。
3. 应用展示将读取什么、可能修改什么，以及哪些数据可能发送给云端模型。
4. 低风险操作自动执行。
5. 高风险和严重风险操作进入审批队列。
6. 已审批操作在可见进度、日志、截图和文件变更记录下执行。
7. 任务结束时展示摘要、产物、失败或跳过项、云端数据披露和回滚选项。

第一版不应完全自主。它应该像辅助执行工具：AI 可以行动，但用户始终能检查计划、风险和结果。

## 推荐方案

采用混合方案：先构建最小但完整的平台核心，并用三个内置工作流验证。

内置智能体：

- 桌面智能体：读取屏幕、点击、输入并操作应用。
- 文件智能体：扫描、分类、移动、重命名和归档文件。
- 办公智能体：处理 PDF、表格、邮件草稿、摘要和会议记录。

MVP 中每个智能体至少完成一个端到端工作流。

## 架构

使用 Tauri 2 作为桌面外壳，将长期平台能力放在本地 Agent Runtime 中。

```text
桌面应用
  ↓
任务控制台 / 审批界面
  ↓
Agent Runtime
  ↓
规划器 + 策略引擎 + 模型路由
  ↓
工具插件
  ↓
操作系统适配层 / 本地资源 / 云端模型
```

### 桌面应用

桌面应用负责用户交互：

- 任务输入。
- 计划展示。
- 审批弹窗和审批队列。
- 执行日志。
- 任务历史。
- 设置。

前端使用 React 和 TypeScript。Tauri 相比 Electron 有更小的应用体积和更清晰的原生边界。涉及本地操作系统集成时，使用 Rust 提供更强边界和更好的平台 API 接入。

### Agent Runtime

运行时负责任务生命周期和执行状态，不包含特定功能的业务逻辑。它协调智能体、插件、策略检查、审批、持久化、取消和恢复。

所有系统动作都必须经过运行时。智能体不能直接调用操作系统 API。

### 规划器

规划器将用户任务转换为可执行步骤。例如“整理 Downloads”会变成：

1. 扫描选定目录。
2. 分类文件。
3. 生成移动和重命名建议。
4. 请求审批。
5. 执行已审批动作。
6. 生成报告。

### 策略引擎

策略引擎在每次插件调用前执行评估，决定允许、要求审批、拒绝或升级。

MVP 风险模型：

- 低风险：自动执行。
- 中风险：默认自动执行，但在日志中可见。
- 高风险：需要审批。
- 严重风险：需要明确确认，或在 MVP 中禁用。

### 模型路由

云端模型 API 是主要后端。路由器按任务类型选择模型：

- 强推理模型用于规划。
- 快速低成本模型用于常规文本任务。
- 多模态模型用于截图和视觉理解。
- 智能体配置指定时使用专用模型。

接口必须允许未来新增模型供应商，而不需要修改智能体。

### 工具插件

所有能力都以插件形式提供。例如：

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

插件声明权限、风险等级、输入输出 schema 和可逆性。

### 操作系统适配层

适配层屏蔽 macOS 和 Windows 差异。插件调用适配层，而不是直接调用平台 API。

示例能力：

- 截图。
- 辅助功能权限。
- 窗口列表。
- 窗口聚焦。
- 鼠标和键盘控制。
- 文件系统监听。
- 应用启动。

## 建议仓库结构

```text
local-agent/
  apps/
    desktop/              # Tauri 2 桌面应用
  packages/
    runtime/              # Agent Runtime
    agents/               # 内置智能体
    plugins/              # 工具插件
    policy/               # 权限和审批逻辑
    model-router/         # 多模型路由
    os-adapters/          # macOS / Windows 适配层
    shared/               # 类型、事件、schema
```

## 智能体模型

智能体负责规划、决策和请求工具调用，但不直接操作系统。

MVP 智能体：

- 规划智能体：默认入口，理解任务、拆解步骤和路由工作。
- 桌面智能体：屏幕读取、点击、输入和应用操作。
- 文件智能体：扫描、分类、移动、重命名和归档。
- 办公智能体：PDF、表格、邮件草稿、摘要和会议记录任务。

智能体配置：

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

## 插件模型

插件元数据：

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

基线风险示例：

```text
file.scan        low       自动执行
file.read        medium    普通路径自动执行；敏感路径需要审批
file.move        high      需要审批；可回滚
file.rename      high      需要审批；可回滚
file.delete      critical  MVP 中禁用
mouse.click      medium    根据上下文评估风险
keyboard.type    medium    根据上下文评估风险
email.draft      medium    仅创建草稿
email.send       critical  MVP 中禁用
shell.exec       critical  MVP 中禁用
```

## 权限和审批模型

审批弹窗必须包含足够上下文：

```text
智能体：文件智能体
动作：移动 38 个文件
来源：~/Downloads
目标：~/Documents/Invoices/2026
风险：高
可回滚：是
云端数据：文件名和部分 PDF 文本摘要
```

MVP 策略规则：

- 低风险调用自动执行。
- 中风险调用自动执行，但在日志中可见。
- 高风险调用需要审批。
- 严重风险调用需要明确确认或被禁用。
- 密码和验证码字段拒绝自动输入。
- 永久删除、发送邮件、执行 shell 和支付相关动作在 MVP 中禁用。

策略引擎应支持未来通过规则文件配置：

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

## 桌面操作流程

桌面控制遵循观察、规划、执行、验证：

```text
截图 / 窗口元数据
  ↓
视觉模型理解
  ↓
下一步动作建议
  ↓
策略检查
  ↓
鼠标 / 键盘执行
  ↓
操作后截图验证
```

MVP 支持的动作：

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

MVP 禁止的动作：

- 自动输入密码。
- 自动输入验证码。
- 完成支付。
- 提交法律、金融、医疗或政府表单。
- 后台控制不可见窗口。
- 绕过操作系统权限机制。

敏感上下文触发词包括：

```text
Send, Submit, Delete, Pay, Confirm, Purchase, Authorize, Install
发送, 提交, 删除, 付款, 确认, 购买, 授权, 安装
```

这些动作根据上下文需要审批或拒绝。

每个桌面步骤记录：

- 操作前截图。
- 目标元素。
- 动作类型。
- 输入摘要。
- 预期结果。
- 风险等级。
- 审批状态。
- 操作后截图。
- 验证结果。

## 数据流

任务执行以结构化运行记录跟踪：

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

计划步骤：

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

## 日志和持久化

使用三层日志：

- 用户日志：简洁的进度和结果。
- 审计日志：智能体、插件、审批、输入输出摘要和时间戳的结构化记录。
- 调试日志：模型请求元数据、工具返回、堆栈跟踪和定位数据。

审计日志存储在本地 SQLite。截图和中间文件作为磁盘产物保存，并通过 SQLite 记录路径和哈希。

macOS：

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

Windows：

```text
%APPDATA%/LocalAgentStudio/
```

默认不保存完整模型提示词，只保存模型调用摘要：

- 模型名称。
- 调用目的。
- 发送的数据类别。
- 是否包含文件正文或截图。
- 时间戳。

开发者模式可以选择保存完整提示词用于调试。

## 错误恢复

处理四类错误：

1. 模型理解错误：用操作后截图验证，暂停，展示预期与实际差异，并询问重试或用户接管。
2. 操作系统权限错误：引导用户授予权限，停止盲目重试。
3. 工具执行错误：记录精确错误，跳过受影响项或询问用户。
4. 审批拒绝：尽可能重新规划，例如创建邮件草稿而不是发送邮件。

用户可以暂停、取消或请求回滚可逆操作。

回滚只适用于标记为 `reversible: true` 的插件。不可逆操作执行前必须审批，执行后只提供审计记录。

## 结果摘要

每个任务结束时展示：

- 已完成内容。
- 哪些文件或应用状态发生变化。
- 哪些动作需要审批。
- 哪些数据发送给云端模型。
- 哪些步骤失败或跳过。
- 哪些动作可以回滚。
- 产物链接。

## MVP 范围

### 必须包含

桌面应用：

- 任务输入。
- 计划展示。
- 审批弹窗和队列。
- 实时执行日志。
- 任务历史。
- 模型 API 密钥、隐私和权限设置。

运行时：

- 任务生命周期管理。
- 规划智能体。
- 桌面智能体。
- 文件智能体。
- 办公智能体。
- 插件协议。
- 策略引擎。
- 模型路由。
- SQLite 审计日志。
- 产物存储。

插件：

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

### 排除

- `email.send`
- 永久 `file.delete`
- `shell.exec`
- 支付、购买和表单提交自动化。
- 后台静默控制。
- 插件市场。
- 团队协作。
- 远程电脑控制。
- 企业管理控制台。
- 本地模型。

## 第一批端到端工作流

### 整理 Downloads

扫描 `Downloads`，分类发票、合同、图片、压缩包和其他文件。生成移动与重命名建议。用户审批后执行移动，并保留回滚计划。

### 处理办公文档

读取 PDF 或电子表格，生成摘要，提取关键信息，并导出 Markdown 或 CSV 产物。

### 操作桌面应用

打开应用，使用截图完成简单步骤，输入文本并保存文件。发送、删除、提交或类似支付的操作必须停下等待审批。

## 测试标准

可靠性：

- 文件工作流至少能处理 100 个文件。
- 移动和重命名动作准确且可回滚。
- PDF 和表格失败不会阻塞整个任务。
- 桌面动作具有操作后截图验证。
- 任务可以干净地暂停和取消。

安全性：

- 高风险和严重风险动作需要审批。
- `file.delete`、`email.send` 和 `shell.exec` 在 MVP 中禁用。
- 密码和验证码字段拒绝自动输入。
- 云端模型调用记录数据摘要。

用户体验：

- 用户能理解当前计划。
- 审批弹窗说明风险和影响。
- 结束摘要展示结果、失败项、云端数据披露和回滚选项。
- 缺少操作系统权限时有清晰指引。

可扩展性：

- 新插件不需要修改 Agent Runtime。
- 新智能体可以复用现有插件和策略引擎。
- 新模型供应商可以通过 Model Router 添加。

## 技术建议

采用：

- Tauri 2 作为桌面外壳。
- React 和 TypeScript 构建 UI。
- 尽可能用 TypeScript 编排智能体和运行时。
- Rust 负责 Tauri 命令、系统权限和平台适配层。
- SQLite 负责本地持久化。
- Zod 或 JSON Schema 定义插件输入输出 schema。
- 供应商适配器接入云端模型 API。

该方案平衡跨平台支持、安全边界、应用体积和开发速度。
