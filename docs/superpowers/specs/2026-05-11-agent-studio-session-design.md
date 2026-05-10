# Agent Studio 会话与流式调用流程设计

## 背景

Agent Studio 当前已有桌面 React 壳、同步运行时、规划 agent、插件元数据、风险策略和基础执行日志。现有界面以任务计划为中心，用户输入任务后一次性得到 `TaskRun`、计划、审批队列和日志。

下一阶段目标是把产品体验推进到可用的会话工作台：用户可以像聊天一样连续输入，运行时以事件流输出 assistant 内容、agent 步骤和工具调用过程，界面能展示历史会话和可展开的调用流程。

## 已确认范围

- 实现运行时纵向切片：真实异步 runtime 事件流，工具执行可先模拟。
- 支持正常聊天：新建会话、发送消息、显示用户和 assistant 消息。
- 支持流式输出：assistant 文本分片输出，agent/工具流程同步实时更新。
- 支持本地持久化会话列表：刷新或重启前端后保留历史会话、消息和流程快照。
- 调用流程面板采用可展开详情级：默认摘要，展开后显示工具输入、模拟输出、策略决策、错误信息。
- UI 结构参考 AionUi 截图：左侧导航、顶部栏、中心输入、浅色清爽风格、组件化 Tailwind 样式。

不在本次范围：

- 接入真实模型 API。
- 执行真实系统工具、文件操作、鼠标键盘或截图。
- 实现审计级 token 回放、SQLite/Tauri 文件存储、跨设备同步。
- 支持暂停、停止、恢复、重新生成等完整任务控制。

## 信息架构

应用采用参考图的工作台结构，但命名和内容面向 Agent Studio：

- 左侧固定侧栏：品牌、`新会话`、`搜索`、`定时任务` 占位、会话历史列表、底部设置。
- 顶部系统栏：居中显示 `Agent Studio`，右侧放 `Skills Market` 开关或入口。
- 主区域空状态：居中问候语、agent 选择胶囊、主输入框、快捷 agent/技能标签。
- 会话状态：发送消息后主区域变成聊天流，上方保留简洁会话标题，底部固定输入框。
- 调用流程：默认不抢主视线；右侧抽屉或面板显示本轮 agent 和工具调用时间线。
- 窄窗口：左侧栏折叠，调用流程变为底部抽屉。

关键设计取舍：默认界面保持清爽，不做密集 dashboard；一旦 agent 开始工作，流程面板提供足够的观察和排错信息。

## 领域模型

在 `packages/shared` 中引入会话模型，同时复用已有的 `PlanStep`、`ToolCall`、风险等级和审批决策类型。

核心类型：

- `Conversation`
  - `id`
  - `title`
  - `messages`
  - `turns`
  - `createdAt`
  - `updatedAt`
- `ChatMessage`
  - `id`
  - `conversationId`
  - `role`: `user`、`assistant`、`system`
  - `content`
  - `status`: `pending`、`streaming`、`completed`、`failed`
  - `createdAt`
  - `completedAt`
- `ConversationTurn`
  - `id`
  - `conversationId`
  - `userMessageId`
  - `assistantMessageId`
  - `selectedAgent`
  - `status`: `planning`、`running`、`waiting_approval`、`completed`、`failed`、`interrupted`
  - `trace`
  - `createdAt`
  - `completedAt`
- `TraceStep`
  - `id`
  - `turnId`
  - `kind`: `agent`、`tool`、`approval`、`message`
  - `title`
  - `agentId`
  - `toolCallId`
  - `pluginId`
  - `status`
  - `riskLevel`
  - `approvalRequired`
  - `startedAt`
  - `completedAt`
  - `input`
  - `output`
  - `policyDecision`
  - `error`

## 运行时事件流

在 `packages/runtime` 中新增异步流式接口：

```ts
runConversationTurn(input: RunConversationTurnInput): AsyncIterable<AgentTraceEvent>
```

`RunConversationTurnInput` 包含：

- `conversationId`
- `messageId`
- `prompt`
- `selectedAgent`
- 可选历史消息摘要

`AgentTraceEvent` 采用可判别联合类型，覆盖以下事件：

- `turn.started`
- `message.started`
- `message.delta`
- `message.completed`
- `agent.step.started`
- `agent.step.completed`
- `tool.started`
- `tool.completed`
- `approval.required`
- `turn.completed`
- `turn.failed`

事件流第一版由模拟 executor 产生：

1. 根据 prompt 调用现有 `createInitialPlan()` 生成计划。
2. 按步骤发出 agent step 事件。
3. 对每个 tool call 评估策略，发出 tool 和 approval 事件。
4. 用短延迟模拟耗时。
5. 用 `message.delta` 分片输出 assistant 内容。
6. 发出 completed 或 failed 终态。

关键设计取舍：事件协议和 UI 消费链路先按真实架构设计，真实模型和真实工具后续只替换 executor，不要求重写主界面。

## 前端组件结构

前端先不引入 Redux 或 Zustand，使用 React state 和小型 reducer 消费事件流。样式采用 Tailwind CSS，保留少量全局 CSS 作为字体、颜色和基础层。

组件划分：

- `AppShell`：整体窗口布局，包含侧栏、顶栏和主区。
- `Sidebar`：新会话、搜索入口、历史会话列表、设置入口。
- `TopBar`：窗口标题、市场开关、导航图标占位。
- `HomeComposer`：空状态中心输入框、agent 胶囊、快捷技能标签。
- `ConversationView`：消息列表和底部输入框。
- `MessageBubble`：用户、assistant、system 消息，assistant 支持 streaming 状态。
- `TracePanel`：右侧调用流程面板。
- `TraceTimelineItem`：agent 步骤、工具调用、审批、错误的可展开节点。
- `Composer`：复用输入框，包含发送、附件、模型、权限入口占位。

状态分层：

- `sessions`：会话列表、当前会话 id。
- `conversation`：当前会话消息、turn 和 trace 快照。
- `stream`：当前是否运行、当前 turn id、abort controller 或取消占位。

## 本地持久化

第一版实现产品可用的本地历史，不做完整审计数据库。

持久化通过前端 `ConversationStore` 接口封装，默认实现使用 `localStorage`：

- 保存 `Conversation[]` 快照和当前会话 id。
- 每次消息、turn 状态或 trace 快照变化后节流保存。
- 应用启动时恢复会话列表、最近会话、消息内容和流程时间线。
- 如果恢复时发现 turn 仍处于 `running` 或 `streaming`，将其标记为 `interrupted`，并在 UI 显示“上次运行中断”。

保存内容：

- 会话标题、创建时间、更新时间。
- 消息内容和状态。
- 每个 turn 的最终状态。
- trace 时间线节点，包括 agent、工具、风险、耗时、输入/输出摘要、错误。

不保存：

- 完整 token chunk。
- 大文件或附件内容。
- 敏感原始文件内容。

后续如果切换到 SQLite 或 Tauri command，只替换 `ConversationStore` 实现，不改变组件和 runtime 事件协议。

## 错误处理

- runtime 事件流异常时，发出或转换为 `turn.failed`，assistant 消息进入 `failed` 状态。
- 单个工具模拟失败时，对应 `TraceStep` 标记 `failed`，并记录错误摘要。
- localStorage 读取失败时，显示空会话列表，并保留控制台错误。
- localStorage 写入失败时，UI 不阻塞聊天，但显示轻量错误状态或 toast 占位。
- 运行中刷新后恢复为 `interrupted`，不自动继续执行。

## UI 风格

视觉方向：

- 浅灰背景、白色输入框、淡紫或淡蓝边框高亮。
- 左侧栏用浅灰分区，品牌图标使用黑底白色符号。
- 卡片圆角控制在 8px 左右；主输入框可以更大但不做厚重装饰。
- 图标按钮优先使用 lucide 图标。
- 工具链时间线使用小型状态点、标签和展开区域，不使用大面积彩色卡片。
- 文案保持产品化：`新会话`、`搜索`、`调用流程`、`工具输入`、`模拟输出`、`策略决策`。

Tailwind 落地：

- 安装 Tailwind、PostCSS、Autoprefixer。
- `styles.css` 引入 `@tailwind base; @tailwind components; @tailwind utilities;`。
- 组件样式主要写在 `className`。
- 仅保留必要全局样式，例如字体、body 背景、滚动条或 focus ring。

## 测试策略

测试覆盖新增边界，不做像素级 UI 测试。

- `packages/shared`
  - 会话、消息、trace 类型构造和状态辅助函数。
- `packages/runtime`
  - `runConversationTurn()` 事件顺序。
  - assistant delta 可合并为完整内容。
  - agent step、tool、approval、failed 事件。
- `apps/desktop`
  - 发送消息后出现用户消息。
  - assistant 内容流式出现。
  - 流程面板实时出现节点。
  - 展开节点显示输入、输出、策略决策。
  - 会话历史可保存和恢复。
- 回归
  - 保留或兼容现有 `startTask()` 行为，避免已有测试无意义破坏。

验证命令：

```bash
source ~/.profile
pnpm test
pnpm typecheck
pnpm --filter @local-agent/desktop build
```

## 验收标准

- 用户能新建会话并发送消息。
- 用户消息立即出现在聊天流中。
- assistant 内容以分片方式显示，完成后进入 completed 状态。
- 同一轮调用中，右侧流程面板实时展示 agent 步骤和工具调用。
- 展开流程节点能看到工具输入、模拟输出、策略决策和风险信息。
- 刷新或重启前端后，会话列表、消息和流程快照仍在。
- 运行中刷新后，该 turn 显示为中断，不自动恢复执行。
- UI 结构接近参考图：左侧导航、顶部栏、中心输入、简洁浅色风格、组件化 Tailwind 样式。
- `pnpm test`、`pnpm typecheck` 和桌面前端 build 通过。
