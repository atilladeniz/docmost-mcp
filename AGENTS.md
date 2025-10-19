# Repository Guidelines

## Project Structure & Module Organization
Docmost uses an Nx-managed pnpm workspace. `apps/client` hosts the Vite + React interface, while `apps/server` contains the NestJS API, migrations under `src/database`, and Jest specs in `src/**/*.spec.ts`. Shared code lives in `packages/` (for example `packages/editor-ext` for rich-text extensions). Copy `.env.example` to configure local secrets, and keep generated assets inside the repo’s existing `public/` and `src/` folders.

## Build, Test, and Development Commands
- `pnpm install` – restore workspace dependencies.
- `pnpm run dev` – launch client (`client:dev`) and server (`server:dev`) watchers concurrently.
- `pnpm run build` – build all registered Nx projects; use `pnpm run client:build` or `pnpm run server:build` to target one side.
- `pnpm --filter ./apps/server run migration:up` – apply Kysely migrations before testing API flows.
- `pnpm --filter ./apps/server run start:prod` – start the compiled NestJS server; `pnpm run start` starts both services in production mode.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and favor named exports for shared utilities. Run `pnpm --filter ./apps/server run lint` or `pnpm --filter ./apps/client run lint` before pushing; ESLint enforces NestJS module boundaries and React hook rules. Prettier (single quotes, trailing commas) is the formatting source of truth—format with each package’s `format` script. Follow established Nest patterns (`*.controller.ts`, `*.service.ts`) and keep React components in PascalCase directories.

## Testing Guidelines
Server-side tests rely on Jest with specs co-located as `*.spec.ts`. Use `pnpm --filter ./apps/server run test` for unit suites, `... run test:watch` while iterating, and `... run test:cov` to generate coverage in `apps/server/coverage`. End-to-end HTTP scenarios reside in `test/jest-e2e.json` and run via `... run test:e2e`. Seed any required fixtures through the migration scripts so suites remain deterministic.

## Commit & Pull Request Guidelines
Commits in this repo trend toward short, imperative messages (e.g., “add tests”, “fix sorting in tasks”); mirror that tone and scope one change per commit. Before opening a PR, ensure lint, build, and relevant tests pass, and note any schema or migration impact. PR descriptions should include: 1) a concise summary, 2) linked issues or context, and 3) verification notes or screenshots for UI work. Highlight remaining risks or follow-ups so reviewers can plan next steps.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->