# Project Overview

Athanor is a modern philosophical platform built with Next.js 15 + React 19, TypeScript, PostgreSQL/Prisma, and Tailwind CSS. Key features:

- **Git-as-CMS**: Billets (MDX posts) in `content/billets/`, backlinks via `[[slug]]` syntax
- **Publications**: PDF management via Cloudinary
- **Knowledge Graph**: Interactive d3-force visualization of post connections
- **FEU HUMAIN Archive**: Immersive Messenger archive with OCR notes (see `docs/FEU-HUMAIN.md`)
- **Zotero Integration**: Automatic bibliography and `<Cite>` validation
- **Authentication**: NextAuth.js with role-based access (ADMIN, USER, VISITOR)

# Key Commands

```bash
npm run dev              # Development server
npm run build            # Full production build (includes graph, search index, bibliography)
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run db:dev:start     # Start PostgreSQL via Docker
npm run db:studio        # Prisma Studio
```

# Development Conventions

- **Billets**: Create/edit `.mdx` files in `content/billets/`, commit and push
- **API Routes**: `app/api/` following Next.js App Router conventions
- **Components**: Reusable components in `components/`, graph logic in `components/graph/`
- **Database**: Schema in `prisma/schema.prisma`, migrations via `npm run db:migrate:dev`
- **Styling**: Tailwind CSS, Solarized palette with Solarpunk aesthetic
- **Typography**: IBM Plex Serif (serif) + Inter (sans-serif) via `next/font`

# Project Structure

```
app/                    # Next.js App Router pages
components/
├── graph/             # Knowledge graph (ForceGraphCanvas, ArchiveGraph)
├── layout/            # Navbar, Footer
└── ui/                # Shared UI components
content/billets/        # MDX blog posts
lib/                    # Utilities, Prisma, auth
prisma/                 # Database schema
scripts/                # Build scripts
docs/                   # Documentation
```

# Documentation

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `GEMINI.md` | Agent memory (this file) |
| `SECURITY.md` | Security considerations |
| `docs/FEU-HUMAIN.md` | Archive documentation |
