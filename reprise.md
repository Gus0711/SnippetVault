# Reprise de session - SnippetVault

> Dernière mise à jour : 23 janvier 2026

## État actuel du projet

Le projet SnippetVault est fonctionnel avec les fonctionnalités principales implémentées.

## Fonctionnalités implémentées récemment

### 1. Éditeur de blocs (TipTap)
- **Fichier** : `src/lib/components/editor/BlockEditor.svelte`
- Slash menu (`/`) pour insérer : code, image, titres, listes, citations
- **Sélecteur de langage** pour les blocs code (dropdown en haut à droite)
- Upload d'images par drag & drop ou paste
- Navigation clavier : Enter pour sélectionner, ↑↓ pour naviguer

### 2. Syntax Highlighting
- **Éditeur** : lowlight (highlight.js) avec tous les langages (`all`)
- **Lecture/Public** : Shiki côté serveur avec thèmes configurables
- **CSS** : Styles hljs dans `src/app.css` (light + dark mode)

### 3. Publication de snippets
- **API** : `src/routes/api/snippets/[id]/+server.ts`
  - `status: 'published' | 'draft'`
  - Génère `publicId` avec nanoid (10 caractères)
  - Dépublier supprime le `publicId` (casse le lien)
- **Page publique** : `src/routes/(public)/s/[publicId]/`
  - Design sombre professionnel
  - Shiki avec thème configurable
  - Bouton "Copy" sur chaque bloc code
  - Footer "Powered by SnippetVault"
- **Options de publication** (modale) :
  - Thème de code (GitHub Dark/Light, Dracula, Nord, etc.)
  - Afficher/masquer description
  - Afficher/masquer images

### 4. Recherche FTS5
- **Table virtuelle** : `snippets_fts` (titre, contenu, tags)
- **Triggers auto** : sync sur insert/update/delete de snippets, blocks, tags
- **API** : `GET /api/search?q=query&collection=id&tag=name&status=draft|published`
- **UI** : Modal Ctrl+K avec debounce 200ms
  - Filtres : collection, statut, tag
  - Navigation clavier
  - Résultats avec preview, tags, collection
- **Rebuild au démarrage** : `hooks.server.ts` appelle `rebuildFTSIndex()`

## Fichiers clés modifiés

```
src/
├── app.css                          # Styles hljs + prose
├── hooks.server.ts                  # + FTS rebuild au démarrage
├── lib/
│   ├── components/
│   │   └── editor/
│   │       ├── BlockEditor.svelte   # Éditeur TipTap + sélecteur langage
│   │       └── SlashMenu.svelte     # Menu slash commands
│   └── server/
│       └── db/
│           └── index.ts             # + FTS5 table + triggers + rebuildFTSIndex()
├── routes/
│   ├── (app)/
│   │   ├── +layout.svelte           # + Modal recherche Ctrl+K
│   │   └── snippets/[id]/
│   │       ├── +page.server.ts      # Shiki + marked rendering
│   │       └── +page.svelte         # UI publication + modale options
│   ├── (public)/
│   │   ├── +layout.svelte           # Layout sans auth
│   │   └── s/[publicId]/            # Page publique
│   │       ├── +page.server.ts
│   │       └── +page.svelte
│   └── api/
│       ├── search/+server.ts        # API recherche FTS5
│       └── snippets/[id]/+server.ts # + nanoid + options publication
```

## Packages ajoutés

- `nanoid` - Génération d'IDs publics
- `shiki` - Syntax highlighting côté serveur
- `marked` - Parsing markdown
- `lowlight` - Syntax highlighting dans TipTap (déjà via @tiptap/extension-code-block-lowlight)

## Points d'attention

1. **FTS5** : L'index est reconstruit à chaque démarrage du serveur. C'est intentionnel pour garantir la cohérence.

2. **Thème sombre/clair** : Le CSS supporte les deux (`.dark` prefix), mais le toggle n'est pas implémenté. L'app est en mode clair par défaut.

3. **Syntax highlighting éditeur** : Utilise les classes `hljs-*` stylées dans `app.css`. Si ça ne marche pas, vérifier que lowlight génère bien les classes.

## Prochaines étapes possibles

- [ ] Toggle thème sombre/clair
- [ ] Page de paramètres utilisateur
- [ ] Export de snippets (JSON, Gist)
- [ ] Partage de collections
- [ ] API REST documentée pour intégration AI
- [ ] Embed de snippets (iframe)

## Pour tester

```bash
npm run dev
# Ouvrir http://localhost:5173
# Ctrl+K pour rechercher
# Créer un snippet, ajouter du code avec /code
# Publier et voir la page publique /s/[id]
```
