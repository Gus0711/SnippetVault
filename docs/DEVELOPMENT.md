# Guide du Developpeur

## Environnement de developpement

### Prerequis

- Node.js 20.x+
- npm 10.x+
- Git
- Editeur avec support TypeScript (VS Code recommande)

### Setup initial

```bash
# Cloner le repo
git clone https://github.com/user/snippetvault.git
cd snippetvault

# Installer les dependances
npm install

# Configurer l'environnement
cp .env.example .env

# Creer les dossiers
mkdir -p data/uploads

# Appliquer les migrations
npm run db:migrate

# Lancer en mode dev
npm run dev
```

### Extensions VS Code recommandees

- Svelte for VS Code
- Tailwind CSS IntelliSense
- ESLint
- Prettier

---

## Commandes utiles

### Developpement

```bash
# Serveur de dev avec HMR
npm run dev

# Type checking
npm run check

# Type checking en mode watch
npm run check:watch
```

### Base de donnees

```bash
# Generer une migration apres modification du schema
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Pousser le schema sans migration (dev)
npm run db:push

# Interface graphique Drizzle Studio
npm run db:studio
```

### Build et preview

```bash
# Build production
npm run build

# Preview du build
npm run preview
```

### Utilitaires

```bash
# Creer une invitation
npm run create-invite

# Reset password (script)
node scripts/reset-password.js
```

---

## Structure du code

### Organisation des fichiers

```
src/
├── lib/
│   ├── components/       # Composants Svelte reutilisables
│   │   ├── editor/       # Editeur TipTap
│   │   ├── ui/           # shadcn-svelte
│   │   └── *.svelte      # Composants principaux
│   │
│   ├── server/           # Code serveur uniquement
│   │   ├── auth/         # Authentification
│   │   ├── db/           # Schema et DB
│   │   └── services/     # Logique metier
│   │
│   ├── stores/           # Stores Svelte 5 (.svelte.ts)
│   ├── types/            # Types TypeScript
│   └── utils/            # Helpers
│
└── routes/               # Routing SvelteKit
    ├── (app)/            # Routes authentifiees
    ├── (public)/         # Routes publiques
    ├── auth/             # Authentification
    └── api/              # API REST
```

### Conventions de nommage

| Element | Convention | Exemple |
|---------|-----------|---------|
| Composants | PascalCase | `BlockEditor.svelte` |
| Routes | kebab-case | `snippets/[id]/edit` |
| Fichiers serveur | +page.server.ts | |
| Stores | camelCase.svelte.ts | `theme.svelte.ts` |
| Tables DB | snake_case pluriel | `snippet_blocks` |
| Types | PascalCase | `SnippetBlock` |

---

## Ajouter une fonctionnalite

### 1. Modifier le schema (si necessaire)

```typescript
// src/lib/server/db/schema.ts
export const newTable = sqliteTable('new_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

Puis generer la migration :

```bash
npm run db:generate
npm run db:migrate
```

### 2. Creer un endpoint API

```typescript
// src/routes/api/new-feature/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await db.select().from(newTable);
  return json({ data });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  // Validation...

  const result = await db.insert(newTable).values({
    id: crypto.randomUUID(),
    name: body.name,
  }).returning();

  return json({ data: result[0] }, { status: 201 });
};
```

### 3. Creer un composant

```svelte
<!-- src/lib/components/NewComponent.svelte -->
<script lang="ts">
  import type { NewType } from '$lib/types';

  interface Props {
    data: NewType;
    onUpdate?: (data: NewType) => void;
  }

  let { data, onUpdate }: Props = $props();
</script>

<div class="p-4 border rounded-lg">
  <h3 class="font-medium">{data.name}</h3>
  <!-- ... -->
</div>
```

### 4. Creer une page

```svelte
<!-- src/routes/(app)/new-feature/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import NewComponent from '$lib/components/NewComponent.svelte';

  let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">New Feature</h1>

  {#each data.items as item}
    <NewComponent data={item} />
  {/each}
</div>
```

```typescript
// src/routes/(app)/new-feature/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { newTable } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
  const items = await db.select().from(newTable);
  return { items };
};
```

---

## Travailler avec l'editeur TipTap

### Structure de BlockEditor.svelte

```
BlockEditor.svelte (1800+ lignes)
├── Extensions TipTap
│   ├── StarterKit (base)
│   ├── CodeBlockLowlight (syntax highlighting)
│   ├── Table, TableRow, TableCell, TableHeader
│   ├── Image, FileBlock (custom)
│   ├── TaskList, TaskItem
│   └── Link
│
├── Fonctions
│   ├── detectLanguage() - Auto-detection
│   ├── insertBlock() - Insertion de blocs
│   ├── moveBlockUp/Down() - Deplacement
│   └── handleFileUpload() - Upload
│
└── UI
    ├── Toolbar (format, tables)
    ├── SlashMenu (commandes)
    └── Block controls (move, delete)
```

### Ajouter un type de bloc

1. Creer l'extension TipTap (si custom)
2. L'ajouter aux extensions dans `BlockEditor.svelte`
3. Ajouter la commande slash dans `SlashMenu.svelte`
4. Gerer la serialisation dans l'API

---

## Travailler avec la recherche FTS5

### Fonctionnement

1. Table virtuelle `snippets_fts` indexe titre, contenu, tags
2. Triggers maintiennent l'index automatiquement
3. `rebuildFTSIndex()` reconstruit manuellement

### Modifier l'indexation

Dans `src/lib/server/db/index.ts` :

```typescript
// Ajouter un champ a l'index
db.exec(`
  DROP TRIGGER IF EXISTS snippets_fts_insert;
  CREATE TRIGGER snippets_fts_insert AFTER INSERT ON snippets
  BEGIN
    INSERT INTO snippets_fts (snippet_id, user_id, title, content, tags, new_field)
    SELECT
      NEW.id,
      NEW.author_id,
      NEW.title,
      COALESCE(...),
      COALESCE(...),
      NEW.new_field
    ;
  END;
`);
```

---

## Tests

### Structure des tests

```
tests/
├── unit/           # Tests unitaires
├── integration/    # Tests API
└── e2e/            # Tests end-to-end
```

### Executer les tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage
```

### Ecrire un test

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';
import { detectLanguage } from '$lib/utils/colors';

describe('detectLanguage', () => {
  it('detects Python', () => {
    const code = 'import os\ndef main():';
    expect(detectLanguage(code)).toBe('python');
  });

  it('detects JavaScript', () => {
    const code = 'const x = () => {};';
    expect(detectLanguage(code)).toBe('javascript');
  });
});
```

---

## Debugging

### Logs serveur

```typescript
// Ajouter des logs
console.log('[API] Request:', request.url);
console.error('[DB] Error:', error);
```

### Inspection DB

```bash
# Drizzle Studio
npm run db:studio

# SQLite CLI
sqlite3 data/snippetvault.db
.tables
.schema snippets
SELECT * FROM snippets LIMIT 5;
```

### Debug FTS

```sql
-- Voir le contenu FTS
SELECT * FROM snippets_fts LIMIT 10;

-- Tester une recherche
SELECT * FROM snippets_fts WHERE snippets_fts MATCH 'python';
```

---

## Bonnes pratiques

### TypeScript

- Types explicites pour les fonctions publiques
- Utiliser `interface` pour les objets
- Eviter `any` sauf cas exceptionnels

### Svelte 5

- Utiliser les runes ($state, $derived, $effect)
- Extension `.svelte.ts` pour les fichiers avec runes
- Props typees avec `interface Props`

### API

- Format reponse : `{ data: ... }` ou `{ error: string }`
- Codes HTTP standards
- Validation des entrees

### CSS

- Tailwind classes, eviter CSS custom
- Variables CSS pour le theme
- Responsive design (mobile-first)

### Git

- Commits atomiques
- Messages descriptifs
- Feature branches

---

## Ressources

### Documentation officielle

- [SvelteKit](https://kit.svelte.dev/docs)
- [Svelte 5](https://svelte.dev/docs/svelte)
- [Drizzle ORM](https://orm.drizzle.team/docs)
- [TipTap](https://tiptap.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shiki](https://shiki.style)

### Fichiers de reference

- `CLAUDE.md` - Instructions projet
- `reprise.md` - Notes de session
- `SnippetVault_Specification.md` - Specification complete
