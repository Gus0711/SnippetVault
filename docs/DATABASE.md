# Base de Donnees

## Vue d'ensemble

SnippetVault utilise SQLite avec Drizzle ORM. La base de donnees est stockee dans un fichier unique avec le mode WAL active pour de meilleures performances.

**Fichiers cles :**
- Schema : `src/lib/server/db/schema.ts`
- Initialisation : `src/lib/server/db/index.ts`
- Migrations : `drizzle/`
- Configuration : `drizzle.config.ts`

---

## Schema

### Diagramme des relations

```
┌─────────────────────────────────────────────────────────────┐
│                          users                               │
│  (id, email, passwordHash, name, apiKey, role, githubToken) │
└────┬──────────────────────────────────────────────────┬─────┘
     │ 1:N                                              │ 1:N
     │                                                  │
     ├─► sessions (auth)                                │
     │                                                  │
     ├─► collections (owner) ◄──────────┐               │
     │   │ 1:N (self)                   │               │
     │   └─► collections (parent)       │               │
     │       └─► snippets ◄─────────────┼───────────────┤
     │           │ 1:N                  │               │
     │           ├─► snippet_blocks     │               │
     │           │                      │               │
     │           └─► snippet_tags ──────┼─► tags ◄──────┘
     │               (N:M)              │
     │                                  │
     └─► invitations                    │
                                        │
                                  collection_members
                                  (N:M sharing)
```

---

## Tables

### users

Utilisateurs de l'application.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| email | TEXT | UNIQUE, NOT NULL | Email de connexion |
| passwordHash | TEXT | NOT NULL | Hash bcrypt |
| name | TEXT | NOT NULL | Nom affiche |
| avatarUrl | TEXT | - | URL avatar (optionnel) |
| apiKey | TEXT | UNIQUE, NOT NULL | Cle API pour v1 |
| role | TEXT | NOT NULL, DEFAULT 'user' | 'admin' ou 'user' |
| themePreference | TEXT | NOT NULL, DEFAULT 'system' | 'light', 'dark', 'system' |
| githubToken | TEXT | - | Token GitHub chiffre |
| createdAt | INTEGER | NOT NULL | Timestamp creation |
| updatedAt | INTEGER | NOT NULL | Timestamp modification |

### sessions

Sessions d'authentification (Lucia Auth).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | Token de session |
| userId | TEXT | FK → users.id (CASCADE) | Utilisateur associe |
| expiresAt | INTEGER | NOT NULL | Timestamp expiration |

### collections

Collections hierarchiques de snippets.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | Nom de la collection |
| description | TEXT | - | Description (optionnel) |
| icon | TEXT | - | Emoji ou icone |
| parentId | TEXT | FK → collections.id (CASCADE) | Collection parente |
| ownerId | TEXT | FK → users.id (CASCADE) | Proprietaire |
| isShared | INTEGER | NOT NULL, DEFAULT 0 | Collection partagee |
| createdAt | INTEGER | NOT NULL | Timestamp creation |
| updatedAt | INTEGER | NOT NULL | Timestamp modification |

**Note :** La profondeur d'imbrication est illimitee via `parentId`.

### collection_members

Partage de collections avec d'autres utilisateurs.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| collectionId | TEXT | PK, FK → collections.id (CASCADE) | Collection partagee |
| userId | TEXT | PK, FK → users.id (CASCADE) | Membre |
| permission | TEXT | NOT NULL, DEFAULT 'read' | 'read' ou 'write' |
| invitedAt | INTEGER | NOT NULL | Timestamp invitation |

### snippets

Snippets de code.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| title | TEXT | NOT NULL | Titre |
| collectionId | TEXT | FK → collections.id (SET NULL) | Collection parente |
| authorId | TEXT | FK → users.id (CASCADE) | Auteur |
| status | TEXT | NOT NULL, DEFAULT 'draft' | 'draft' ou 'published' |
| isFavorite | INTEGER | NOT NULL, DEFAULT 0 | Marque favori |
| isPinned | INTEGER | NOT NULL, DEFAULT 0 | Epingle en haut |
| publicId | TEXT | UNIQUE | ID public pour partage |
| publicTheme | TEXT | NOT NULL, DEFAULT 'github-dark' | Theme Shiki |
| publicShowDescription | INTEGER | NOT NULL, DEFAULT 1 | Afficher description |
| publicShowAttachments | INTEGER | NOT NULL, DEFAULT 1 | Afficher fichiers |
| gistId | TEXT | - | ID GitHub Gist |
| gistUrl | TEXT | - | URL GitHub Gist |
| createdAt | INTEGER | NOT NULL | Timestamp creation |
| updatedAt | INTEGER | NOT NULL | Timestamp modification |

### snippet_blocks

Blocs de contenu d'un snippet.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| snippetId | TEXT | FK → snippets.id (CASCADE) | Snippet parent |
| order | INTEGER | NOT NULL | Ordre d'affichage (0-based) |
| type | TEXT | NOT NULL | 'markdown', 'code', 'image', 'file' |
| content | TEXT | - | Contenu texte |
| language | TEXT | - | Langage (pour code) |
| filePath | TEXT | - | Chemin fichier serveur |
| fileName | TEXT | - | Nom fichier original |
| fileSize | INTEGER | - | Taille en bytes |

### tags

Tags utilisateur pour categoriser les snippets.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | Nom du tag |
| color | TEXT | - | Couleur hex |
| userId | TEXT | FK → users.id (CASCADE) | Proprietaire du tag |

### snippet_tags

Relation N:M entre snippets et tags.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| snippetId | TEXT | PK, FK → snippets.id (CASCADE) | Snippet |
| tagId | TEXT | PK, FK → tags.id (CASCADE) | Tag |

### invitations

Invitations pour creer un compte.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| email | TEXT | NOT NULL | Email invite |
| invitedBy | TEXT | FK → users.id (CASCADE) | Qui a invite |
| token | TEXT | UNIQUE, NOT NULL | Token unique |
| expiresAt | INTEGER | NOT NULL | Timestamp expiration |
| usedAt | INTEGER | - | Timestamp utilisation |

---

## FTS5 - Recherche Full-Text

### Table virtuelle

```sql
CREATE VIRTUAL TABLE snippets_fts USING fts5(
  snippet_id UNINDEXED,
  user_id UNINDEXED,
  title,
  content,
  tags
);
```

### Champs indexes

| Champ | Source | Description |
|-------|--------|-------------|
| title | snippets.title | Titre du snippet |
| content | snippet_blocks.content | Tous les blocs concatenes |
| tags | tags.name | Noms des tags associes |

### Triggers de synchronisation

7 triggers maintiennent l'index automatiquement :

| Trigger | Evenement | Action |
|---------|-----------|--------|
| snippets_fts_insert | INSERT snippets | Ajouter a FTS |
| snippets_fts_update | UPDATE snippets.title | Mettre a jour FTS |
| snippets_fts_delete | DELETE snippets | Supprimer de FTS |
| snippets_fts_block_insert | INSERT snippet_blocks | Re-indexer |
| snippets_fts_block_update | UPDATE snippet_blocks | Re-indexer |
| snippets_fts_block_delete | DELETE snippet_blocks | Re-indexer |
| snippets_fts_tag_insert | INSERT snippet_tags | Re-indexer |
| snippets_fts_tag_delete | DELETE snippet_tags | Re-indexer |

### Reconstruction manuelle

```typescript
import { rebuildFTSIndex } from '$lib/server/db';

// Reconstruire pour tous les utilisateurs
await rebuildFTSIndex();

// Reconstruire pour un utilisateur specifique
await rebuildFTSIndex(userId);
```

**Note :** L'index est automatiquement reconstruit au demarrage du serveur dans `hooks.server.ts`.

---

## Index

### Index automatiques (PK)

- users.id
- sessions.id
- collections.id
- snippets.id
- snippet_blocks.id
- tags.id
- invitations.id

### Index uniques

- users.email
- users.apiKey
- snippets.publicId
- invitations.token

### Index de foreign key (implicites)

- sessions.userId
- collections.parentId
- collections.ownerId
- snippets.collectionId
- snippets.authorId
- snippet_blocks.snippetId
- tags.userId
- invitations.invitedBy

---

## Regles de cascade

### ON DELETE CASCADE

Suppression en cascade :

| Parent | Enfants supprimes |
|--------|-------------------|
| User | Sessions, Collections, Snippets, Tags, Invitations |
| Collection | Collections enfants, Snippets |
| Snippet | Blocs, Associations tags |
| Tag | Associations snippet_tags |

### ON DELETE SET NULL

| Parent | Champ mis a NULL |
|--------|------------------|
| Collection | snippets.collectionId |

---

## Migrations

### Creer une migration

```bash
npm run db:generate
```

### Appliquer les migrations

```bash
npm run db:migrate
```

### Interface graphique

```bash
npm run db:studio
```

### Fichiers de migration

```
drizzle/
├── 0000_giant_archangel.sql    # Schema initial
├── 0001_dusty_shen.sql         # + isPinned, gistId, gistUrl, githubToken
└── meta/
    ├── _journal.json
    ├── 0000_snapshot.json
    └── 0001_snapshot.json
```

---

## Requetes courantes

### Lister les snippets d'un utilisateur

```typescript
const snippets = await db
  .select()
  .from(snippetsTable)
  .where(eq(snippetsTable.authorId, userId))
  .orderBy(desc(snippetsTable.updatedAt));
```

### Recherche full-text

```typescript
const results = await db.all(sql`
  SELECT s.*, fts.rank
  FROM snippets_fts fts
  JOIN snippets s ON s.id = fts.snippet_id
  WHERE fts.user_id = ${userId}
    AND snippets_fts MATCH ${query}
  ORDER BY fts.rank
  LIMIT 50
`);
```

### Arbre de collections

```typescript
const collections = await db
  .select()
  .from(collectionsTable)
  .where(eq(collectionsTable.ownerId, userId))
  .orderBy(collectionsTable.name);

// Construire l'arbre cote client avec parentId
```

### Snippets avec blocs et tags

```typescript
const snippet = await db.query.snippets.findFirst({
  where: eq(snippetsTable.id, snippetId),
  with: {
    blocks: { orderBy: [asc(snippet_blocks.order)] },
    tags: { with: { tag: true } },
    collection: true
  }
});
```

---

## Performance

### Mode WAL

Active dans `src/lib/server/db/index.ts` :

```typescript
db.pragma('journal_mode = WAL');
```

Avantages :
- Lectures concurrentes
- Meilleures performances d'ecriture
- Pas de verrou en lecture

### Limites SQLite

- ~1000 ecritures/seconde
- Taille fichier : jusqu'a 281 TB
- Concurrence : 1 ecrivain, N lecteurs

### Optimisations

1. **FTS5** pour recherche O(log n)
2. **Index** sur colonnes frequemment filtrees
3. **Triggers** pour sync automatique (pas de polling)
4. **Pagination** sur listes longues
