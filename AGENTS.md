# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router routes, layouts, and API handlers under `app/api`. Global CSS in `app/globals.css`.
- `components/`: Reusable React components (PascalCase), e.g., `GraphSVG.tsx`.
- `lib/`: Server/client utilities (kebab-case), e.g., `pdf.server.ts`, `auth.ts` (path alias `@/*`).
- `prisma/`: Prisma schema and migrations; uses `DATABASE_URL`.
- `scripts/`: Build/maintenance scripts (search index, bibliography, citation map, graph).
- `public/`: Static assets and generated artifacts, e.g., `search-index.json`, `graph-billets.svg`.
- `content/` and `data/`: MD/MDX content and auxiliary data.
- `test/`: Fixtures for smoke checks (no unit test framework).

## Build, Test, and Development Commands

- Setup: `nvm use` (Node 20) → `npm ci`.
- Dev server: `npm run dev`.
- Build: `npm run build` (generates Prisma client, prebuilds assets, Next.js build).
- Start prod: `npm start`.
- Lint: `npm run lint` (extends `next/core-web-vitals`).
- Smoke tests: `npm run test:build` (validates search index, bibliography, graph, `.next`).
- Database (Docker): `npm run db:dev:start|db:dev:stop|db:dev:reset`, schema sync `npm run db:push`, inspect `npm run db:studio`.

## Coding Style & Naming Conventions

- TypeScript strict; 2-space indentation; prefer named exports.
- Components: PascalCase files, e.g., `components/Editor.tsx`.
- Hooks: `use*`, e.g., `useKeyboard.ts`.
- Routes & slugs in `app/`: kebab-case, e.g., `app/a-propos/page.tsx`.
- Utilities in `lib/`: kebab-case; server-only suffix `.server.ts(x)`, e.g., `pdf.server.ts`.
- ESLint: extends `next/core-web-vitals`; `react/no-unescaped-entities` disabled. Run `npm run lint` before PRs.

## Testing Guidelines

- No unit test framework. Use `npm run test:build` for critical artifacts.
- Keep fixtures in `test/`. For new critical logic, add lightweight validation in `scripts/`.
- Ensure build outputs (search index, bibliography, graph) are generated and valid locally.

## Commit & Pull Request Guidelines

- Commits: Conventional messages (`feat:`, `fix:`, `chore:`). Scope when useful.
- PRs: Clear description, linked issues, screenshots/GIFs for UI changes. Note DB schema/migration impacts and update docs.
- Pre-submit: `npm run lint` and `npm run test:build` must pass.

## Security & Configuration Tips

- Copy `.env.example` → `.env.local`; never commit secrets.
- Required keys: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_API_KEY`, Cloudinary, GitHub OAuth.
- Local DB: `npm run db:dev:start` then `npm run db:push`; explore with `npm run db:studio`.
