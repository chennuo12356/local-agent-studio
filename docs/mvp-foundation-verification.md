# MVP Foundation Verification

## Typecheck

- Command: `pnpm typecheck`
- Expected: All workspace packages pass TypeScript checks.

## Tests

- Command: `pnpm test`
- Expected: Shared, policy, plugins, model-router, agents, runtime, persistence, and desktop tests pass.

## Frontend Build

- Command: `pnpm --filter @local-agent/desktop build`
- Expected: Vite builds the desktop frontend.

## Manual UI Smoke Test

- Command: `pnpm dev`
- Expected:
  - App opens in the Vite dev server.
  - `Local Agent Studio` heading is visible.
  - Entering `organize Downloads invoices` and pressing `Create Plan` shows a file plan.
  - Approval Queue shows `1 pending` with the high-risk move step.
  - Entering `summarize this PDF` and pressing `Create Plan` shows an office document plan with no pending approvals.
