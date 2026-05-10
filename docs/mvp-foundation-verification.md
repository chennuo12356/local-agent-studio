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
  - 页面显示 `本地智能体工作台` 标题。
  - 输入 `整理 Downloads 里的发票` 并点击 `生成计划` 后显示文件整理计划。
  - 审批队列显示 `1 项待审批`，并包含高风险移动文件步骤。
  - 输入 `总结这个 PDF` 并点击 `生成计划` 后显示办公文档计划，且没有待审批项。
