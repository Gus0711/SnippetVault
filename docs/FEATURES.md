# Catalogue des Fonctionnalites

## Vue d'ensemble

SnippetVault offre une gestion complete de snippets de code avec editeur de blocs, recherche full-text, partage public, et operations en lot.

---

## 1. Editeur de blocs (TipTap)

**Fichier principal** : `src/lib/components/editor/BlockEditor.svelte`

### Types de blocs supportes

| Type | Description | Commande slash |
|------|-------------|----------------|
| Markdown | Texte riche (gras, italique, liens) | Par defaut |
| Code | Bloc code avec syntax highlighting | `/code` |
| Image | Image uploadee ou collee | `/image` |
| Fichier | Piece jointe (PDF, ZIP, etc.) | `/file` |
| Tableau | Tableau avec en-tetes | `/table` |
| Callout | Encadre (info, warning, success, error) | `/callout` |
| Titre H1 | Titre niveau 1 | `/h1` |
| Titre H2 | Titre niveau 2 | `/h2` |
| Titre H3 | Titre niveau 3 | `/h3` |
| Liste a puces | Liste non ordonnee | `/bullet` |
| Liste numerotee | Liste ordonnee | `/numbered` |
| Liste de taches | Checkboxes | `/task` |
| Citation | Blockquote | `/quote` |
| Separateur | Ligne horizontale | `/divider` |
| Lien | Lien hypertexte | `/link` |

### Fonctionnalites de l'editeur

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Menu slash | Taper `/` pour inserer un bloc | Complet |
| Detection de langage | Auto-detection du langage de code | Complet |
| Selecteur de langage | Dropdown pour choisir le langage | Complet |
| Upload drag & drop | Glisser-deposer images/fichiers | Complet |
| Upload paste | Coller images depuis presse-papier | Complet |
| Deplacement de blocs | Alt+Up/Down ou boutons | Complet |
| Collapse code | Replier les blocs code longs | Complet |
| Tableaux | Ajouter/supprimer lignes/colonnes | Complet |
| Callouts | 4 types avec couleurs | Complet |

### Langages detectes automatiquement

Python, JavaScript, TypeScript, Java, C, C++, HTML, CSS, SQL, Bash, JSON, YAML, Markdown, Go, Rust, PHP, Ruby, Swift, Kotlin

---

## 2. Organisation des snippets

### Collections hierarchiques

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Collections imbriquees | Profondeur illimitee | Complet |
| Icones de collection | Emoji ou icone | Complet |
| Deplacement de snippets | Vers autre collection | Complet |
| Suppression en cascade | Collections + enfants | Complet |

### Tags

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Tags utilisateur | Chaque user a ses tags | Complet |
| Couleurs de tags | 12+ couleurs predefinies | Complet |
| Multi-tags | Plusieurs tags par snippet | Complet |
| Filtre par tag | Dans recherche et listes | Complet |

### Favoris et epingles

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Marquer favori | Etoile sur snippet | Complet |
| Epingler | Pin en haut de liste | Complet |
| Section favoris | Dans sidebar | Complet |

---

## 3. Recherche full-text (FTS5)

**Fichier** : `src/lib/server/db/index.ts`

### Champs indexes

| Champ | Description |
|-------|-------------|
| Titre | Titre du snippet |
| Contenu | Tous les blocs concatenes |
| Tags | Noms des tags associes |

### Filtres de recherche

| Filtre | Description | API |
|--------|-------------|-----|
| Collection | Limiter a une collection | `?collection=id` |
| Tag | Filtrer par tag | `?tag=name` |
| Statut | Draft ou published | `?status=draft` |

### Caracteristiques

- Sync automatique via triggers
- Reconstruction au demarrage serveur
- Debounce 200ms cote client
- Navigation clavier dans resultats

---

## 4. Partage et publication

### Snippets publics

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Publication | Genere URL unique | Complet |
| Depublication | Supprime l'acces public | Complet |
| Theme de code | 9 themes Shiki | Complet |
| Options d'affichage | Description, pieces jointes | Complet |

### Themes disponibles

- GitHub Dark / GitHub Light
- Dracula
- Nord
- One Dark Pro
- Vitesse Dark / Vitesse Light
- Min Dark / Min Light

### Embed iframe

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Vue embed | Design compact | Complet |
| Code iframe | Copier HTML | Complet |
| Hauteur ajustable | Dans code embed | Complet |
| Bouton copier | Sur blocs code | Complet |

---

## 5. Actions en lot

**Fichier** : `src/lib/components/SnippetTable.svelte`

### Selection multiple

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Checkbox par ligne | Selection individuelle | Complet |
| Tout selectionner | En-tete de colonne | Complet |
| Compteur selection | "X selectionnes" | Complet |

### Actions disponibles

| Action | Description | API |
|--------|-------------|-----|
| Deplacer | Changer de collection | `PATCH /api/snippets/[id]` |
| Taguer | Ajouter tag(s) | `PATCH /api/snippets/[id]` |
| Exporter | Telecharger en ZIP | `GET /api/export/snippets` |
| Supprimer | Suppression avec confirmation | `DELETE /api/snippets/[id]` |

---

## 6. Export

### Export individuel

| Format | Contenu | API |
|--------|---------|-----|
| Markdown (.md) | Frontmatter YAML + contenu | `GET /api/snippets/[id]/export?format=md` |
| ZIP (.zip) | Markdown + fichiers joints | `GET /api/snippets/[id]/export?format=zip` |

### Export en lot

| Fonctionnalite | Description | API |
|----------------|-------------|-----|
| ZIP multiple | INDEX.md + dossiers par snippet | `GET /api/export/snippets?ids=...` |
| Export complet | Tout le vault (JSON + fichiers) | `GET /api/export` |

### Format Markdown

```markdown
---
title: "Titre du snippet"
collection: "Nom collection"
tags: ["tag1", "tag2"]
status: published
created: 2024-01-15T10:30:00.000Z
updated: 2024-01-15T10:30:00.000Z
publicId: abc123
---

# Titre

Contenu markdown...

```javascript
// Code avec langage
console.log('hello');
```

![image](files/screenshot.png)
```

---

## 7. Integration GitHub

### Export Gist

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Creer Gist | Depuis un snippet | Complet |
| Gist public/prive | Option a la creation | Complet |
| Mise a jour | Re-sync vers meme Gist | Complet |
| Token chiffre | Stockage securise | Complet |

**API** : `POST /api/gist`

---

## 8. Administration

### Gestion utilisateurs

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Liste users | Voir tous les utilisateurs | Complet |
| Supprimer user | Avec confirmation | Complet |
| Roles | admin / user | Complet |

### Invitations

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Creer invitation | Email + token | Complet |
| Liste invitations | Pending avec expiration | Complet |
| Revoquer | Supprimer invitation | Complet |
| Expiration | Token time-limited | Complet |

### Maintenance

| Fonctionnalite | Description | API |
|----------------|-------------|-----|
| Rebuild FTS | Reconstruire index | `POST /api/admin/rebuild-fts` |

---

## 9. Parametres utilisateur

**Route** : `/settings`

### Sections

| Section | Options |
|---------|---------|
| Profil | Cle API (afficher, regenerer, copier) |
| Mot de passe | Changement |
| Tags | Creer, editer, supprimer |
| GitHub | Ajouter/supprimer token |
| Export | Telecharger tout le vault |

---

## 10. API REST v1

**Base** : `/api/v1`

### Authentification

- Header : `Authorization: Bearer {api_key}`
- API key visible dans parametres

### Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /snippets | Lister snippets (pagination) |
| POST | /snippets | Creer snippet |
| GET | /snippets/[id] | Detail snippet |
| PUT | /snippets/[id] | Modifier snippet |
| DELETE | /snippets/[id] | Supprimer snippet |
| GET | /collections | Lister collections |
| GET | /tags | Lister tags |
| GET | /search?q=... | Recherche full-text |

---

## 11. Partage de collections

### Membres

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Ajouter membre | Par email | Complet |
| Permissions | read / write | Complet |
| Modifier permission | Upgrade/downgrade | Complet |
| Retirer membre | Supprimer acces | Complet |

### Niveaux de permission

| Permission | Droits |
|------------|--------|
| read | Voir snippets de la collection |
| write | Voir + modifier snippets |
| owner | Tout + gerer membres |

---

## 12. Interface utilisateur

### Theme

| Fonctionnalite | Description | Statut |
|----------------|-------------|--------|
| Theme clair | Light mode | Complet |
| Theme sombre | Dark mode | Complet |
| Theme systeme | Suivre OS | Complet |
| Persistance | LocalStorage + serveur | Complet |

### Sidebar

| Element | Description |
|---------|-------------|
| Logo | Lien vers dashboard |
| Dashboard | Vue d'ensemble |
| Recherche | Ctrl+K |
| Favoris | Snippets marques |
| Collections | Arbre hierarchique |
| Collections partagees | Acces membre |
| Parametres | Lien vers /settings |
| Theme toggle | Light/Dark switch |

### Navigation clavier

| Raccourci | Action |
|-----------|--------|
| Ctrl+K | Ouvrir recherche |
| / | Menu slash (dans editeur) |
| Alt+Up/Down | Deplacer bloc |
| Enter | Selectionner (menus) |
| Escape | Fermer modal |

---

## 13. Securite

### Authentification

| Fonctionnalite | Description |
|----------------|-------------|
| Sessions | 30 jours, extension auto |
| Cookies | HttpOnly, SameSite=Lax |
| Hachage | bcrypt pour mots de passe |

### Upload fichiers

| Securite | Description |
|----------|-------------|
| Extensions bloquees | exe, bat, cmd, msi, scr, ps1, vbs, js, jar |
| Taille max | 50MB (configurable) |
| Types MIME | Validation pour images |

### Donnees

| Protection | Description |
|------------|-------------|
| Token GitHub | Chiffre AES en DB |
| Isolation | Donnees par utilisateur |
| Permissions | Verification sur chaque acces |

---

## Roadmap

Les fonctionnalites suivantes etaient listees dans `reprise.md` comme prochaines etapes mais sont maintenant implementees :

- [x] Toggle theme sombre/clair
- [x] Page de parametres utilisateur
- [x] Export de snippets (JSON, Gist)
- [x] Partage de collections
- [x] API REST documentee pour integration AI
- [x] Embed de snippets (iframe)

### Fonctionnalites futures potentielles

- [ ] Collaboration temps reel (CRDT)
- [ ] Versioning de snippets
- [ ] Import depuis GitHub Gist
- [ ] Plugins editeur
- [ ] Themes personnalises
