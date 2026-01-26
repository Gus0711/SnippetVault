# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SnippetVault** is a self-hosted code snippet manager featuring:
- Notion-style organization (hierarchical collections, tags, full-text search)
- Carbon-style code rendering (beautiful syntax highlighting via Shiki)
- Block-based editor (markdown, code, images, files) using TipTap
- Public sharing with unique links + embeddable iframe
- Multi-selection with bulk actions (move, tag, delete, export)
- Export to Markdown/ZIP (individual or bulk)
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
| ZIP export | archiver |
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
│   │   │   ├── editor/      # Block-based editor (TipTap)
│   │   │   │   ├── BlockEditor.svelte
│   │   │   │   ├── SlashMenu.svelte
│   │   │   │   └── FileBlock.ts
│   │   │   ├── snippet/     # Snippet display
│   │   │   └── search/      # Search components
│   │   ├── server/
│   │   │   ├── db/          # Drizzle schema + migrations
│   │   │   │   ├── schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── auth/        # Lucia config
│   │   │   └── services/    # Business logic
│   │   ├── stores/          # Svelte stores (.svelte.ts for runes)
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Helpers
│   ├── routes/
│   │   ├── (app)/           # Authenticated routes
│   │   ├── (public)/        # Public routes (s/[id], embed/[id])
│   │   ├── api/             # REST API
│   │   │   ├── snippets/    # CRUD + export
│   │   │   ├── export/      # Bulk export
│   │   │   └── user/        # User settings, tags
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
- **snippet_blocks**: id, snippet_id, order, type (markdown/code/image/file), content, language, file_path, file_name, file_size
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

## Session Continuity

**See `reprise.md`** for the latest development status, recently implemented features, and next steps. This file is updated at the end of each session.

## FTS5 Search Implementation

The full-text search is implemented in `src/lib/server/db/index.ts`:
- Virtual table `snippets_fts` indexes: title, block content, tags
- Triggers auto-sync on snippet/block/tag changes
- `rebuildFTSIndex()` called at server startup in `hooks.server.ts`
- API: `GET /api/search?q=query&collection=id&tag=name&status=draft|published`

## Block Editor (TipTap)

The block-based editor is located in `src/lib/components/editor/`:

### Components
- **BlockEditor.svelte**: Main editor component with TipTap
- **SlashMenu.svelte**: Slash command menu (type `/` to insert blocks)
- **FileBlock.ts**: Custom TipTap Node extension for file attachments

### Supported Block Types
- **markdown**: Text with headings, lists, quotes, inline formatting
- **code**: Syntax-highlighted code blocks (via lowlight)
- **image**: Uploaded images
- **file**: File attachments (PDF, ZIP, etc.)
- **table**: Tables with header row/column support

### Table Features
- Insert via `/table` slash command
- Toggle header row/column/cell
- Add/remove rows and columns
- Resize columns
- Visual borders and styling

### File Upload
- Endpoint: `POST /api/upload`
- Supports images and general files
- Blocked extensions: exe, bat, cmd, msi, scr, ps1, vbs, js, jar
- Max size: 50MB (configurable via `UPLOAD_MAX_SIZE`)

### Slash Commands
Type `/` in the editor to access:
- `/code` - Code block
- `/image` - Upload image
- `/file` - Attach file
- `/table` - Insert 3x3 table
- `/h1`, `/h2`, `/h3` - Headings
- `/bullet`, `/numbered` - Lists
- `/quote` - Blockquote

### Block Movement
Blocks can be reordered in two ways:
- **Keyboard**: `Alt + ↑` / `Alt + ↓` to move the current block up/down
- **Mouse**: Hover over a block to reveal ↑/↓ buttons on the left side

The implementation uses ProseMirror transactions to swap adjacent block nodes while preserving content and formatting.

## Multi-Selection & Bulk Actions

The `SnippetTable` component (`src/lib/components/SnippetTable.svelte`) supports multi-selection for batch operations.

### Selection
- Checkbox on each row to select individual snippets
- "Select all" checkbox in header (affects filtered results)
- Selection state managed with `Set<string>` for snippet IDs

### Bulk Actions Bar
When snippets are selected, a floating action bar appears with:
- **Move**: Move selected snippets to another collection
- **Tag**: Add tags to selected snippets (including creating new tags)
- **Export**: Download selected snippets as a ZIP archive
- **Delete**: Delete all selected snippets (with confirmation)

### API Endpoints
- `PATCH /api/snippets/[id]` - Update snippet (collectionId, addTagId)
- `POST /api/user/tags` - Create new tag (returns existing if duplicate)
- `GET /api/export/snippets?ids=id1,id2,id3` - Bulk export to ZIP

## Embed & Export

### Embed (iframe)
Published snippets can be embedded in external sites via iframe.

- **Route**: `/embed/[publicId]` - Minimal embed view
- **Features**:
  - Compact header with title and link to full view
  - Code blocks with copy button
  - Syntax highlighting via Shiki
  - Dark theme optimized for embedding
- **Usage**: On snippet page, click "Embed" to get iframe code with adjustable height

### Export
Snippets can be exported individually or in bulk.

#### Individual Export
- **Route**: `GET /api/snippets/[id]/export?format=md|zip`
- **Markdown (.md)**: YAML frontmatter + content blocks
- **ZIP (.zip)**: Markdown file + attached files in `files/` folder

#### Bulk Export
- **Route**: `GET /api/export/snippets?ids=id1,id2,id3`
- **Output**: ZIP archive with:
  - `INDEX.md` - Table of contents with links
  - `{snippet-title}/` - Folder per snippet
    - `{snippet-title}.md` - Markdown export
    - `files/` - Attached images and files

#### Markdown Format
```markdown
---
title: "Snippet Title"
collection: "Collection Name"
tags: ["tag1", "tag2"]
status: published
created: 2024-01-15T10:30:00.000Z
updated: 2024-01-15T10:30:00.000Z
publicId: abc123
---

# Snippet Title

Markdown content here...

```javascript
// Code blocks with language
console.log('hello');
```

![image](files/screenshot.png)
[document](files/readme.pdf)
```

## Svelte 5 Runes

**Important**: Files using Svelte 5 runes (`$state`, `$derived`, `$effect`) must use the `.svelte.ts` extension, not `.ts`.

Example: `src/lib/stores/theme.svelte.ts`

```typescript
// theme.svelte.ts - note the .svelte.ts extension
let current = $state<'light' | 'dark'>('dark');

export const theme = {
  get current() { return current; },
  set current(value) { current = value; }
};
```

## Drizzle ORM Notes

**Important**: Drizzle's `.all()` method returns an array directly, NOT a Promise.

```typescript
// Correct
const results = await db.select().from(table).where(...).all();
const filtered = results.filter(r => r.status === 'active');

// Wrong - will throw "TypeError: .all(...).then is not a function"
const results = await db.select().from(table).where(...).all().then(r => r.filter(...));
```

## Documentation Reference

When uncertain about syntax, API, or behavior, consult official documentation:

**Key libraries:**
- SvelteKit: `/sveltejs/kit`
- Svelte 5: `/sveltejs/svelte` (runes: $state, $derived, etc.)
- Drizzle ORM: `/drizzle-team/drizzle-orm`
- Lucia Auth: `/lucia-auth/lucia`
- Tailwind CSS v4: `/tailwindlabs/tailwindcss` (uses `@import 'tailwindcss'` syntax)
- TipTap: `/ueberdosis/tiptap`
- TipTap Table: `@tiptap/extension-table` (use named imports: `import { Table } from '@tiptap/extension-table'`)
- Shiki: `/shikijs/shiki`
- Lucide icons: `/lucide-icons/lucide`
- lowlight: `/wooorm/lowlight` (for TipTap code blocks)
- archiver: `/archiverjs/node-archiver` (for ZIP export)
