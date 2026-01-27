# Architecture Technique

## Vue d'ensemble

SnippetVault est une application SvelteKit auto-hebergee utilisant SQLite comme base de donnees. L'architecture suit le pattern MVC avec une separation claire entre le frontend (Svelte), le backend (SvelteKit server) et la persistance (SQLite + Drizzle ORM).

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Svelte    │  │   Stores    │  │  TipTap Editor      │  │
│  │ Components  │  │ (Runes)     │  │  (Block-based)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────┐
│                     SvelteKit Server                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │   Hooks     │  │   API Endpoints     │  │
│  │ (+page.ts)  │  │ (auth)      │  │   (/api/*)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │ Permissions │  │   Services          │  │
│  │  (Lucia)    │  │  (RBAC)     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ Drizzle ORM
┌────────────────────────────▼────────────────────────────────┐
│                        SQLite Database                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tables    │  │   FTS5      │  │   Triggers          │  │
│  │  (9 tables) │  │  (search)   │  │  (auto-sync)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Structure des dossiers

```
snippetvault/
├── src/
│   ├── app.html                 # Template HTML racine
│   ├── app.css                  # Styles globaux (Tailwind, hljs)
│   ├── app.d.ts                 # Types globaux (Locals, User)
│   ├── hooks.server.ts          # Middleware (auth, FTS rebuild)
│   │
│   ├── lib/
│   │   ├── components/          # Composants Svelte reutilisables
│   │   │   ├── editor/          # Editeur TipTap (BlockEditor, SlashMenu)
│   │   │   ├── html-preview/    # Preview HTML avec iframe
│   │   │   ├── json-viewer/     # Visualisation JSON (arbre + graphe)
│   │   │   ├── ui/              # Composants shadcn-svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── CollectionTree.svelte
│   │   │   ├── SnippetTable.svelte
│   │   │   └── ...
│   │   │
│   │   ├── server/              # Code serveur uniquement
│   │   │   ├── auth/            # Lucia Auth (sessions, passwords)
│   │   │   ├── db/              # Drizzle schema + FTS5
│   │   │   ├── services/        # Logique metier (permissions)
│   │   │   ├── api/             # Utilitaires API
│   │   │   └── crypto.ts        # Chiffrement (GitHub token)
│   │   │
│   │   ├── stores/              # Stores Svelte 5 (.svelte.ts)
│   │   │   └── theme.svelte.ts
│   │   │
│   │   ├── types/               # Types TypeScript partages
│   │   └── utils/               # Helpers (colors, formatting)
│   │
│   └── routes/                  # Routing SvelteKit (file-based)
│       ├── (app)/               # Routes authentifiees
│       │   ├── dashboard/
│       │   ├── collections/[id]/
│       │   ├── snippets/[id]/
│       │   ├── search/
│       │   └── settings/
│       │
│       ├── (public)/            # Routes publiques
│       │   ├── s/[publicId]/    # Snippet public
│       │   └── embed/[publicId]/ # Embed iframe
│       │
│       ├── auth/                # Authentification
│       │   ├── login/
│       │   ├── logout/
│       │   ├── register/[token]/
│       │   └── setup/
│       │
│       └── api/                 # API REST
│           ├── admin/           # Admin (users, invitations)
│           ├── collections/     # CRUD collections
│           ├── snippets/        # CRUD snippets
│           ├── tags/            # Gestion tags
│           ├── search/          # Recherche FTS
│           ├── upload/          # Upload fichiers
│           ├── export/          # Export ZIP
│           ├── gist/            # GitHub Gist
│           └── v1/              # API v1 (cle API)
│
├── drizzle/                     # Migrations SQL
├── data/                        # Volume Docker (DB + uploads)
├── scripts/                     # Scripts utilitaires
├── mcp-server/                  # Serveur MCP (integration Claude)
├── static/                      # Assets statiques
└── docs/                        # Documentation
```

## Composants principaux

### 1. Frontend (Svelte)

**Composants cles :**
- `BlockEditor.svelte` (1800+ lignes) : Editeur TipTap avec 17+ types de blocs
- `SnippetTable.svelte` : Table avec multi-selection et actions en lot
- `CollectionTree.svelte` : Arbre hierarchique de collections
- `Sidebar.svelte` : Navigation principale avec favoris

**Stores (Svelte 5 Runes) :**
- `theme.svelte.ts` : Gestion theme (light/dark/system)

### 2. Backend (SvelteKit)

**Hooks (`hooks.server.ts`) :**
- Validation de session (Lucia Auth)
- Reconstruction index FTS au demarrage
- Service de fichiers uploades

**Services :**
- `permissions.ts` : Controle d'acces (owner/write/read)
- `crypto.ts` : Chiffrement AES pour tokens GitHub

### 3. Base de donnees (SQLite + Drizzle)

**Schema (`schema.ts`) :**
- 9 tables avec relations
- FTS5 pour recherche full-text
- Triggers pour sync automatique

**Mode WAL :**
- Acces concurrent ameliore
- Meilleure performance en ecriture

## Flux de donnees

### Creation d'un snippet

```
1. User tape dans BlockEditor
   ↓
2. TipTap genere JSON (blocs)
   ↓
3. POST /api/snippets
   ↓
4. Validation + insertion DB
   ↓
5. Triggers FTS5 (auto-index)
   ↓
6. Response JSON
   ↓
7. UI mise a jour
```

### Recherche full-text

```
1. User tape dans search bar
   ↓
2. Debounce 200ms
   ↓
3. GET /api/search?q=query
   ↓
4. Query FTS5 + filtres
   ↓
5. Join snippets + collections + tags
   ↓
6. Response avec preview
   ↓
7. Affichage resultats
```

### Partage public

```
1. User clique "Publier"
   ↓
2. PUT /api/snippets/[id] (status: published)
   ↓
3. Generation publicId (nanoid 10 chars)
   ↓
4. URL publique: /s/[publicId]
   ↓
5. Rendu Shiki (syntax highlighting serveur)
```

## Patterns et conventions

### Nommage

| Element | Convention | Exemple |
|---------|-----------|---------|
| Tables DB | Pluriel snake_case | `snippet_blocks` |
| Colonnes DB | camelCase | `authorId` |
| Routes API | kebab-case | `/api/snippets/[id]/export` |
| Composants | PascalCase | `BlockEditor.svelte` |
| Stores | camelCase | `theme.svelte.ts` |
| Types | PascalCase | `SnippetBlock` |

### Design patterns

1. **Repository pattern** : Drizzle queries dans les routes
2. **Service pattern** : Logique metier dans `services/`
3. **Middleware pattern** : Auth via hooks
4. **Observer pattern** : Stores Svelte 5 (runes)

### Gestion d'erreurs

```typescript
// API Response format
{ data: T }           // Succes
{ error: string }     // Erreur

// HTTP codes
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Server Error
```

## Dependances externes

### Services tiers

| Service | Usage | Optionnel |
|---------|-------|-----------|
| GitHub API | Export Gist | Oui |

### Librairies critiques

| Librairie | Version | Usage |
|-----------|---------|-------|
| SvelteKit | 2.49.1 | Framework |
| Drizzle ORM | 0.45.1 | Base de donnees |
| better-sqlite3 | 12.6.2 | Driver SQLite |
| TipTap | 3.17.0 | Editeur |
| Shiki | 3.21.0 | Syntax highlighting |
| Tailwind CSS | 4.1.18 | Styles |

## Performance

### Optimisations

1. **FTS5** : Recherche O(log n) vs O(n)
2. **WAL mode** : Concurrence amelioree
3. **Debounce** : Recherche (200ms), auto-save
4. **Lazy loading** : JSON graph view
5. **Server-side rendering** : Shiki pour pages publiques

### Limites

- SQLite : ~1000 ecritures/seconde
- Upload : 50MB max par fichier
- FTS5 : Reconstruction au demarrage (~1s/1000 snippets)
