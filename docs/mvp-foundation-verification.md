# MVP 基础验收说明

以下命令均在仓库根目录执行。

## 类型检查

- 命令：`pnpm typecheck`
- 预期：所有 workspace 包都通过 TypeScript 检查。

## 自动化测试

- 命令：`pnpm test`
- 预期：shared、policy、plugins、model-router、agents、runtime、persistence 和 desktop 测试全部通过。

## 前端构建

- 命令：`pnpm --filter @local-agent/desktop build`
- 预期：Vite 成功构建桌面前端。

## 手动 UI 冒烟测试

- 命令：`pnpm dev`
- 预期：
  - 应用在 Vite 开发服务器中打开。
  - 页面显示 `Agent Studio` 顶部栏、左侧导航、中心输入框和 `调用流程` 面板。
  - 输入 `整理 Downloads 里的发票` 并点击发送后，聊天流显示用户消息和 assistant 流式回复。
  - 调用流程面板显示文件 agent 步骤、`file.scan` 和 `file.move` 工具调用。
  - 高风险工具调用显示审批相关状态和风险信息。
  - 刷新页面后，会话历史、消息和流程快照可恢复。

## Agent Studio 会话验收

- 新建会话后可以发送消息。
- assistant 内容以流式片段展示。
- 调用流程面板显示 agent 步骤和工具调用。
- 展开工具节点可查看输入、模拟输出、策略决策和风险。
- 刷新前端后，会话历史、消息和流程快照可恢复。
