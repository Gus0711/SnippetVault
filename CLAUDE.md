# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SnippetVault** is a self-hosted code snippet manager featuring:
- Notion-style organization (hierarchical collections, tags, full-text search)
- Carbon-style code rendering (beautiful syntax highlighting via Shiki)
- Block-based editor (markdown, code, images, files) using TipTap
- Public sharing with unique links
- REST API for AI integration

Full specification: `SnippetVault_Specification.md`

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | SvelteKit (SSR + SPA) |
| Database | SQLite + Drizzle ORM |
| Search | SQLite FTS5 |
| Auth | Lucia Auth |
| UI | Tailwind CSS + shadcn-svelte |
| Editor | TipTap (block-based) |
| Syntax highlighting | Shiki |
| Deployment | Docker (single container) |

## Commands

```bash
# Development
npm run dev

# Database
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # Drizzle Studio (GUI)

# Build
npm run build
npm run preview

# Docker
docker compose up -d
docker compose logs -f
```

## Project Structure

```
snippetvault/
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   │   ├── ui/          # Generic components (shadcn)
│   │   │   ├── editor/      # Block-based editor
│   │   │   ├── snippet/     # Snippet display
│   │   │   └── search/      # Search components
│   │   ├── server/
│   │   │   ├── db/          # Drizzle schema + migrations
│   │   │   │   ├── schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── auth/        # Lucia config
│   │   │   └── services/    # Business logic
│   │   ├── stores/          # Svelte stores
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Helpers
│   ├── routes/
│   │   ├── (app)/           # Authenticated routes
│   │   ├── (public)/        # Public routes (s/[id], embed)
│   │   ├── api/             # REST API
│   │   └── auth/            # Login, register, invite
│   └── app.html
├── static/
├── data/                    # Docker volume (DB + uploads)
├── drizzle/                 # Migrations
├── Dockerfile
├── docker-compose.yml
└── .env
```

## Environment Variables

```env
DATABASE_URL=file:./data/snippetvault.db
UPLOAD_DIR=./data/uploads
UPLOAD_MAX_SIZE=52428800
SECRET_KEY=change-me
ORIGIN=http://localhost:5173
```

## Data Model

### Core Tables
- **users**: id, email, password_hash, name, api_key, role, theme_preference
- **collections**: id, name, parent_id (unlimited hierarchy), owner_id, is_shared
- **collection_members**: collection_id, user_id, permission (read/write)
- **snippets**: id, title, collection_id, author_id, status (draft/published), public_id
- **snippet_blocks**: id, snippet_id, order, type (markdown/code/image/file), content, language
- **tags**: id, name, color, user_id
- **snippet_tags**: snippet_id, tag_id
- **invitations**: id, email, token, invited_by, expires_at

### Key Relations
- Collection -> parent Collection (unlimited nesting)
- Collection -> many Snippets
- Snippet -> many Blocks (ordered)
- Snippet <-> many Tags
- User -> many Collections (owner)
- Collection <-> many Users (members)

## Code Conventions

### Svelte/SvelteKit
- Pages: `+page.svelte`, server logic: `+page.server.ts`
- Components in `$lib/components/`
- Shared types in `$lib/types/`
- Stores in `$lib/stores/`

### TypeScript
- Strict mode enabled
- Explicit types for public functions
- Prefer interfaces over types for objects

### Database (Drizzle)
- Schema in `$lib/server/db/schema.ts`
- UUIDs for IDs (`crypto.randomUUID()`)
- Table names plural (`users`, `snippets`, `collections`)
- Timestamps: `created_at`, `updated_at`

### API REST
- Routes in `src/routes/api/`
- Response format: `{ data: ... }` or `{ error: string }`
- Auth via header `Authorization: Bearer {api_key}`
- Standard HTTP codes (200, 201, 400, 401, 404, 500)

### CSS/Tailwind
- Use Tailwind classes, avoid custom CSS
- shadcn-svelte for base UI components
- CSS variables for theme colors

## UI/Design Rules

### Strict Prohibitions
- **No emojis** in the interface (SVG icons only)
- **No rainbow gradients** or flashy color transitions
- **No excessive rounding** (max `rounded-lg`, avoid `rounded-full` on containers)
- **No excessive shadows** (subtle only)
- **No generic text** like "Welcome!", "Let's get started!", "You're all set!"
- **No gratuitous animations** (useful transitions only)
- **No neon colors** or over-saturated hues

### Design Principles
1. **Sober and functional** - developer tool, not a marketing landing page
2. **Information density** - no large empty spaces
3. **Readable contrast** - no light gray on white
4. **Clear hierarchy** - consistent font sizes, not bold everywhere
5. **Inspiration**: VS Code, Linear, Notion (pro version, not colorful templates)

### Color Palette

```css
/* Light mode */
--background: #ffffff;
--surface: #f8f9fa;
--border: #e2e4e8;
--text: #1a1a1a;
--text-muted: #6b7280;
--accent: #2563eb;

/* Dark mode */
--background: #0d1117;
--surface: #161b22;
--border: #30363d;
--text: #e6edf3;
--text-muted: #8b949e;
--accent: #58a6ff;
```

### Icons
- Use **Lucide icons** (consistent, sober)
- Standard size: 16px or 20px
- Color: `currentColor` (inherits from text)

## Architecture Notes

1. **Self-hosted first**: everything must work with a single Docker container and a volume for `/data`
2. **SQLite only**: no PostgreSQL, keep it simple. FTS5 for search.
3. **No ORM magic**: Drizzle is explicit, write queries directly
4. **Mobile-friendly**: desktop-first but reading should be pleasant on mobile
5. **Language**: UI can be in French, code/comments in English

## Documentation Reference

When uncertain about syntax, API, or behavior, consult official documentation:

**Key libraries:**
- SvelteKit: `/sveltejs/kit`
- Svelte 5: `/sveltejs/svelte` (runes: $state, $derived, etc.)
- Drizzle ORM: `/drizzle-team/drizzle-orm`
- Lucia Auth: `/lucia-auth/lucia`
- Tailwind CSS: `/tailwindlabs/tailwindcss`
- TipTap: `/ueberdosis/tiptap`
- Shiki: `/shikijs/shiki`
- Lucide icons: `/lucide-icons/lucide`
