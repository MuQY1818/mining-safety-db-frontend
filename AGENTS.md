# Repository Guidelines

## Project Structure & Module Organization
- `src/` houses the TypeScript app: `pages/` for routed views, `components/` for shared UI, `store/` and `hooks/` for state, `services/` and `api/` for backend clients, and `types/` for shared models.
- `config/` keeps runtime and theme helpers; update `config/runtime.ts` together with the matching note in `docs/` whenever endpoints or env keys change.
- Static assets live in `public/`; deployment automation sits in `scripts/` and `docker/`. Build artifacts go to `build/`; keep diagnostics in `logs/` and out of commits.

## Build, Test, and Development Commands
- `npm install` (or `npm ci` in CI) syncs dependencies with `package-lock.json` on Node 18+.
- `npm start` runs the React dev server with the proxy from `src/setupProxy.js`; restart after editing `.env.local`.
- `npm run build` creates the optimized bundle consumed by Docker.
- `npm test -- --watchAll=false` executes Jest with React Testing Library in non-interactive mode for automation.

## Coding Style & Naming Conventions
- Follow Google TypeScript style: two-space indentation, single quotes, and no trailing semicolons. Components stay in PascalCase, hooks start with `use`.
- Format with Prettier and lint with the `react-app` preset; run `npx prettier --check "src/**/*.{ts,tsx,css}"` and `npx eslint src --ext .ts,.tsx` before committing.
- CSS utilities use kebab-case. Runtime configuration carries the `REACT_APP_` prefix and should be mirrored in `.env.example`.

## Testing Guidelines
- Co-locate unit files as `*.test.tsx`; integration helpers like `src/test-api-integration.ts` can seed Playwright suites when richer flows are needed.
- Guard critical areas with ≥80% coverage and provide happy-path plus failure-path tests, refreshing mocks when backend payloads shift.
- After dependency or Docker updates, run a smoke pass and summarize console output in the PR discussion.

## Commit & Pull Request Guidelines
- Use `type: summary` commits (e.g., `fix: handle expired token`), consistent with existing `feat`, `fix`, `chore`, `docs`, and `refactor` tags. Link tickets using `Refs: #123` when relevant.
- PRs should outline scope, risk, and validation steps; attach screenshots for UI updates and call out environment changes.
- Merge only after CI succeeds, conflicts are resolved locally, and a maintainer signs off.

## Security & Configuration Tips
- Store secrets in `.env.local` or deployment vaults; scrub credentials from `logs/` and `build/` before publishing.
- Validate new endpoints through `config/runtime.ts` to keep CORS or SSE settings aligned across environments.
- Audit dependencies with `npm outdated`; trial upgrades in a branch and rerun regressions before merging.

## Agent Notes
- 2025-09-22: 修复AI聊天消息中的换行与列表转义问题，统一SSE内容到Markdown渲染格式。
- 2025-09-22: 登录状态到期时统一弹出提醒并自动清理会话，避免静默401。
