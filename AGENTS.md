# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages/layouts and `app/api` routes; global CSS in `app/globals.css`.
- `components/`: Reusable React components (PascalCase), e.g., `components/GraphSVG.tsx`.
- `lib/`: Utilities (kebab-case). Server-only files end with `.server.ts(x)`, e.g., `lib/pdf.server.ts`. Import via `@/*`.
- `prisma/`: Prisma schema and migrations (uses `DATABASE_URL`).
- `scripts/`: Build/maintenance scripts for search index, bibliography, citation map, and graph.
- `public/`: Static assets and generated artifacts (e.g., `search-index.json`, `graph-billets.svg`).
- `content/`, `data/`: MD/MDX content and auxiliary data.
- `test/`: Fixtures for smoke checks (no unit test framework).

## Build, Test, and Development Commands

- Setup: `nvm use` (Node 20) → `npm ci`.
- Dev: `npm run dev` to start Next.js locally.
- Build: `npm run build` generates Prisma client, prebuilds assets, then builds Next.js.
- Start: `npm start` serves the production build.
- Lint: `npm run lint` (extends `next/core-web-vitals`).
- Smoke tests: `npm run test:build` validates search index, bibliography, graph, and `.next` output.
- Database (Docker): `npm run db:dev:start|db:dev:stop|db:dev:reset`, schema sync `npm run db:push`, inspect `npm run db:studio`.

## Coding Style & Naming Conventions

- Language: TypeScript (strict). Indentation: 2 spaces.
- Components: PascalCase files, e.g., `components/Editor.tsx`.
- Hooks: `use*` with kebab-case filenames, e.g., `lib/use-keyboard.ts`.
- Routes/slugs in `app/`: kebab-case, e.g., `app/a-propos/page.tsx`.
- Utilities in `lib/`: kebab-case; server-only suffix `.server.ts(x)`.
- Linting: run `npm run lint` before PRs; `react/no-unescaped-entities` disabled.

## Testing Guidelines

- No unit test framework. Rely on `npm run test:build` for critical artifact validation.
- Keep fixtures in `test/`.
- For new critical logic, add lightweight validation scripts under `scripts/` that assert expected outputs.

## Commit & Pull Request Guidelines

- Commits: Conventional messages (`feat:`, `fix:`, `chore:`). Add scope when helpful, e.g., `feat(graph): add node labels`.
- PRs: Include clear description, linked issues, and screenshots/GIFs for UI changes. Note DB schema/migration impacts and update docs as needed.
- Pre-submit: ensure `npm run lint` and `npm run test:build` pass locally.

## Security & Configuration Tips

- Copy `.env.example` → `.env.local`; never commit secrets.
- Required keys: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_API_KEY`, Cloudinary, GitHub OAuth.
- Local DB: `npm run db:dev:start` then `npm run db:push`; explore with `npm run db:studio`.
