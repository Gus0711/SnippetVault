# Reprise de session - SnippetVault

> Derniere mise a jour : 27 janvier 2026

## Etat actuel du projet

Le projet SnippetVault est **complet et fonctionnel** avec toutes les fonctionnalites principales implementees. Une documentation exhaustive a ete creee dans le dossier `docs/`.

## Documentation disponible

Le dossier `docs/` contient la documentation complete :

| Document | Description |
|----------|-------------|
| `README.md` | Vue d'ensemble de la documentation |
| `ARCHITECTURE.md` | Architecture technique detaillee |
| `FEATURES.md` | Catalogue complet des fonctionnalites |
| `API.md` | Documentation de l'API REST (42+ endpoints) |
| `DATABASE.md` | Schema et modeles de donnees (9 tables + FTS5) |
| `INSTALLATION.md` | Guide d'installation |
| `CONFIGURATION.md` | Options de configuration |
| `DEPLOYMENT.md` | Procedures de deploiement Docker |
| `DEVELOPMENT.md` | Guide du developpeur |
| `TROUBLESHOOTING.md` | Resolution de problemes courants |
| `RESET-PASSWORD.md` | Reinitialisation mot de passe admin |

## Fonctionnalites implementees

### Editeur de blocs (TipTap)
- **Fichier** : `src/lib/components/editor/BlockEditor.svelte` (1800+ lignes)
- 17+ types de blocs : markdown, code, image, fichier, tableau, callout, taches, liens, separateurs
- Menu slash (`/`) pour insertion rapide
- Detection automatique du langage de programmation
- Selecteur de langage pour les blocs code
- Upload drag & drop et paste pour images/fichiers
- Deplacement de blocs (Alt+Up/Down ou boutons)
- Tableaux avec gestion lignes/colonnes/en-tetes

### Recherche full-text (FTS5)
- Table virtuelle `snippets_fts` indexant titre, contenu, tags
- 7 triggers pour synchronisation automatique
- Reconstruction au demarrage serveur
- API : `GET /api/search?q=query&collection=id&tag=name&status=draft|published`

### Publication et partage
- URLs publiques uniques (`/s/[publicId]`)
- Embed iframe (`/embed/[publicId]`)
- 9 themes Shiki pour le rendu code
- Options d'affichage (description, pieces jointes)
- Bouton copier sur chaque bloc code

### Actions en lot
- Multi-selection dans SnippetTable
- Deplacer vers autre collection
- Ajouter tags (avec creation inline)
- Export ZIP multiple
- Suppression groupee

### Export
- Export individuel (Markdown ou ZIP)
- Export en lot (ZIP avec INDEX.md)
- Export complet du vault
- Integration GitHub Gist

### Administration
- Gestion utilisateurs (liste, suppression)
- Invitations par email
- Roles admin/user
- Reconstruction index FTS

### API REST v1
- 42+ endpoints documentes
- Authentification par cle API
- CRUD complet snippets/collections/tags
- Recherche full-text

### Theme
- Light / Dark / System
- Persistance localStorage + serveur
- Variables CSS coherentes

## Fichiers cles

```
src/
├── app.css                          # Styles globaux (Tailwind, hljs)
├── hooks.server.ts                  # Auth middleware, FTS rebuild
├── lib/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── BlockEditor.svelte   # Editeur principal
│   │   │   ├── SlashMenu.svelte     # Menu commandes
│   │   │   └── FileBlock.ts         # Extension fichiers
│   │   ├── SnippetTable.svelte      # Table avec multi-selection
│   │   ├── CollectionTree.svelte    # Arbre collections
│   │   └── Sidebar.svelte           # Navigation
│   ├── server/
│   │   ├── auth/                    # Lucia Auth
│   │   ├── db/
│   │   │   ├── schema.ts            # 9 tables Drizzle
│   │   │   └── index.ts             # FTS5, triggers
│   │   └── services/permissions.ts  # Controle d'acces
│   ├── stores/
│   │   └── theme.svelte.ts          # Theme store (Svelte 5 runes)
│   └── utils/colors.ts              # Couleurs langages, detection
├── routes/
│   ├── (app)/                       # Routes authentifiees
│   ├── (public)/                    # Routes publiques
│   ├── auth/                        # Login, register, setup
│   └── api/                         # 42+ endpoints
└── docs/                            # Documentation complete
```

## Stack technique

| Composant | Version |
|-----------|---------|
| SvelteKit | 2.49.1 |
| Drizzle ORM | 0.45.1 |
| TipTap | 3.17.0 |
| Shiki | 3.21.0 |
| Tailwind CSS | 4.1.18 |
| better-sqlite3 | 12.6.2 |

## Points d'attention

1. **FTS5** : Index reconstruit a chaque demarrage serveur (~1s/1000 snippets)
2. **Svelte 5 Runes** : Utiliser extension `.svelte.ts` pour les fichiers avec `$state`
3. **Drizzle** : `.all()` retourne un array directement (pas une Promise)
4. **Upload** : Extensions bloquees (exe, bat, cmd, msi, scr, ps1, vbs, js, jar)

## Prochaines etapes potentielles

Toutes les fonctionnalites principales sont implementees. Ameliorations futures possibles :

- [ ] Collaboration temps reel (CRDT)
- [ ] Versioning de snippets
- [ ] Import depuis GitHub Gist
- [ ] Plugins editeur personnalises
- [ ] Themes de syntaxe personnalises
- [ ] PWA pour acces offline

## Pour tester

```bash
# Developpement
npm run dev
# Ouvrir http://localhost:5173
# Premiere visite : /auth/setup pour creer l'admin

# Production Docker
docker compose up -d
# Ouvrir http://localhost:3000
```

## Commandes utiles

```bash
npm run dev              # Dev server
npm run build            # Build production
npm run db:generate      # Generer migration
npm run db:migrate       # Appliquer migrations
npm run db:studio        # GUI base de donnees
npm run create-invite    # Creer invitation
```
