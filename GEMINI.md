# Project Overview

This project is a modern philosophical platform called "Athanor". It's built with Next.js and React, using TypeScript for static typing. The backend is powered by a PostgreSQL database with Prisma as the ORM. The platform is designed for publishing and consulting philosophy articles with advanced features like a Git-as-CMS system for blog posts (Billets), PDF publication management via Cloudinary, an interactive graph visualization of post connections, and a unified search functionality. Authentication is handled by NextAuth.js, and it integrates with the Zotero API for automatic bibliography and citation management.

# Building and Running

## Key Commands

*   **Development:** `npm run dev` - Starts the development server.
*   **Linting:** `npm run lint` - Runs ESLint to check for code quality.
*   **Type Checking:** `npm run typecheck` - Runs the TypeScript compiler to check for type errors.
*   **Building for Production:** `npm run build` - Creates an optimized production build. This command also generates Prisma client, builds the bibliography, validates citations, creates a citation map, builds the post graph, renders the graph as an SVG, and builds the search index.
*   **Running in Production:** `npm run start` - Starts the production server.
*   **Database Setup:**
    *   `npm run db:dev:start` - Starts the PostgreSQL database using Docker Compose.
    *   `npm run db:push` - Pushes the Prisma schema to the database.
    *   `npm run db:studio` - Opens the Prisma Studio to view and edit data in the database.

# Development Conventions

*   **Git-as-CMS:** The "Billets" (blog posts) are managed through a Git-based workflow. To create, edit, or delete a post, you need to modify the corresponding Markdown file in the `content/billets` directory and then commit and push the changes to the Git repository.
*   **Styling:** The project uses Tailwind CSS for styling. Customizations can be made in the `tailwind.config.ts` file.
*   **Typography:** The project uses `next/font` for font optimization, with IBM Plex Serif for serif text and Inter for sans-serif text.
*   **API Routes:** API routes are located in the `app/api` directory and follow the Next.js App Router conventions.
*   **Components:** Reusable React components are located in the `components` directory.
*   **Database Schema:** The database schema is defined in the `prisma/schema.prisma` file.
*   **Scripts:** Utility and build scripts are located in the `scripts` directory.
