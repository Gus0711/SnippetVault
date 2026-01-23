# 📋 SnippetVault — Product Specification Document
---
## 1. Vision & Objectifs
**Vision :** Créer l'outil ultime de gestion de snippets de code — la puissance d'organisation de Notion, la beauté de Carbon, la simplicité du self-hosting.
**Objectifs :**
- Stocker et organiser des snippets avec contexte riche (markdown, code, images, fichiers)- Retrouver n'importe quel snippet en quelques secondes- Publier et partager avec un rendu magnifique- Self-hosted en un seul container Docker- API ouverte pour intégration IA
---
## 2. Personas
| Persona | Besoin principal ||---------|------------------|| **Gus (toi)** | Centraliser ses snippets Niagara4/LoRaWAN, retrouver vite, partager avec clients/collègues || **Dev solo** | Bibliothèque personnelle de code, accessible partout || **Petite équipe** | Collections partagées, knowledge base technique commune || **Formateur** | Publier des snippets pédagogiques avec explications |
---
## 3. Architecture fonctionnelle
```┌─────────────────────────────────────────────────────────────┐│                        SnippetVault                         │├─────────────────────────────────────────────────────────────┤│  👤 Users (multi-user, invitation)                          ││    └── 📁 Collections (hiérarchie illimitée)                ││          └── 📝 Snippets (blocs markdown/code/images)       ││                └── 📎 Attachments (fichiers, images)        │├─────────────────────────────────────────────────────────────┤│  🔍 Recherche full-text (FTS5)                              ││  🌍 Publication (brouillon → publié → lien public)          ││  🎨 Thèmes (clair/sombre, choix par snippet)                ││  🔌 API REST (lecture/écriture, clé API)                    │└─────────────────────────────────────────────────────────────┤│  💾 SQLite · 📦 Docker · ⚡ SvelteKit                        │└─────────────────────────────────────────────────────────────┘```
---
## 4. Modèle de données
### 4.1 Users
| Champ | Type | Description ||-------|------|-------------|| id | UUID | Identifiant unique || email | string | Email (login) || password_hash | string | Mot de passe hashé || name | string | Nom affiché || avatar_url | string? | Photo de profil || api_key | string | Clé API unique || role | enum | `admin` / `user` || theme_preference | enum | `light` / `dark` / `system` || created_at | datetime | Date création |
### 4.2 Collections
| Champ | Type | Description ||-------|------|-------------|| id | UUID | Identifiant unique || name | string | Nom de la collection || description | string? | Description optionnelle || icon | string? | Emoji ou icône || parent_id | UUID? | Collection parente (null = racine) || owner_id | UUID | Créateur de la collection || is_shared | boolean | Collection partagée ? || created_at | datetime | || updated_at | datetime | |
### 4.3 Collection_Members (partage)
| Champ | Type | Description ||-------|------|-------------|| collection_id | UUID | || user_id | UUID | || permission | enum | `read` / `write` || invited_at | datetime | |
### 4.4 Snippets
| Champ | Type | Description ||-------|------|-------------|| id | UUID | Identifiant unique || title | string | Titre du snippet || collection_id | UUID | Collection parente || author_id | UUID | Créateur || status | enum | `draft` / `published` || public_id | string? | ID court pour URL publique (généré à la publication) || public_theme | string | Thème pour la page publique || public_show_description | boolean | Afficher description en public ? || public_show_attachments | boolean | Afficher fichiers en public ? || created_at | datetime | || updated_at | datetime | |
### 4.5 Snippet_Blocks (contenu block-based)
| Champ | Type | Description ||-------|------|-------------|| id | UUID | || snippet_id | UUID | Snippet parent || order | integer | Position dans le snippet || type | enum | `markdown` / `code` / `image` / `file` || content | text | Contenu markdown ou code || language | string? | Langage (si type=code) || file_path | string? | Chemin fichier (si type=image/file) || file_name | string? | Nom original du fichier || file_size | integer? | Taille en bytes |
### 4.6 Tags
| Champ | Type | Description ||-------|------|-------------|| id | UUID | || name | string | Nom du tag || color | string? | Couleur (hex) || user_id | UUID | Propriétaire du tag |
### 4.7 Snippet_Tags (relation N-N)
| Champ | Type ||-------|------|| snippet_id | UUID || tag_id | UUID |
### 4.8 Invitations
| Champ | Type | Description ||-------|------|-------------|| id | UUID | || email | string | Email invité || invited_by | UUID | User qui invite || token | string | Token unique || expires_at | datetime | Expiration || used_at | datetime? | Date d'utilisation |
---
## 5. Fonctionnalités détaillées
### 5.1 Authentification & Users
**Inscription :**
- Sur invitation uniquement (lien avec token)- Email + mot de passe- L'admin peut générer des invitations
**Connexion :**
- Email + mot de passe- Session persistante (cookie HTTP-only)- "Remember me" optionnel
**Profil :**
- Modifier nom, avatar, mot de passe- Régénérer sa clé API- Choisir thème par défaut (clair/sombre/système)
**Rôles :**
- `admin` : peut inviter, voir stats, gérer users- `user` : utilisation normale
---
### 5.2 Collections & Organisation
**Hiérarchie illimitée :**
```📁 Niagara4  📁 Alarmes    📁 Templates    📁 Exemples clients  📁 Schedules  📁 Historiques📁 LoRaWAN  📁 ChirpStack  📁 Devices📁 Python  📁 Scripts utils```
**Actions sur une collection :**
- Créer / Renommer / Supprimer- Déplacer (drag & drop)- Choisir icône/emoji- Partager avec d'autres users
**Partage de collection :**
- Le créateur (owner) peut inviter des users- Permission `read` ou `write`- Les invités voient la collection dans leur sidebar- Snippets créés dans une collection partagée = visibles par tous les membres
---
### 5.3 Snippets — Éditeur block-based
**Concept :**
Un snippet = une suite de blocs ordonnés, comme Notion.
**Types de blocs :**
| Type | Description | Rendu ||------|-------------|-------|| `markdown` | Texte riche | Titres, listes, liens, bold, italic... || `code` | Bloc de code | Syntax highlighting, choix du langage || `image` | Image uploadée | Affichage inline || `file` | Fichier attaché | Lien de téléchargement |
**Éditeur (style Notion) :**
- Tape `/` pour insérer un bloc  - `/code` → bloc code (puis choix langage)  - `/image` → upload image  - `/file` → upload fichier  - `/markdown` ou juste taper → bloc texte- Drag & drop pour réordonner les blocs- Raccourcis markdown : `**bold**`, `# titre`, `` `inline code` ``- Suppression bloc : bouton ou backspace sur bloc vide
**Bloc code :**
- Sélecteur de langage (autocomplete)- Syntax highlighting live (Shiki)- Numéros de lignes (optionnel)- Bouton copier
**Métadonnées snippet :**
- Titre (obligatoire)- Tags (sélection multiple, création à la volée)- Collection parente
---
### 5.4 Tags
- Création libre (nom + couleur optionnelle)- Autocomplétion lors de l'ajout- Un snippet peut avoir plusieurs tags- Filtre par tag dans la recherche- Tags personnels (chaque user a ses propres tags)
---
### 5.5 Recherche
**Full-text search (SQLite FTS5) :**
- Recherche dans : titre, contenu markdown, contenu code, tags- Résultats classés par pertinence- Highlight des termes trouvés
**Filtres combinables :**
- Par collection (et sous-collections)- Par tag(s)- Par langage de code- Par statut (brouillon/publié)- Par auteur (si collections partagées)- Par date (créé/modifié)
**UI :**
- Barre de recherche globale (raccourci `Cmd/Ctrl + K`)- Filtres en sidebar ou dropdown- Résultats en temps réel (debounce 200ms)
---
### 5.6 Publication & Partage
**Workflow :**
```📝 Brouillon (par défaut)      ↓[Bouton "Publier"]      ↓🌍 Publié   → Génère un public_id unique (ex: `x7Hk9pQ`)   → URL : snippetvault.example.com/s/x7Hk9pQ      ↓[Bouton "Dépublier"]      ↓📝 Redevient brouillon (lien cassé)```
**Options de publication :**
- Choix du thème (liste de thèmes Shiki : github-dark, dracula, one-dark, etc.)- Afficher/masquer la description markdown- Afficher/masquer les fichiers attachés
**Page publique :**
- Rendu magnifique style Carbon- Header : titre + auteur (optionnel) + date- Blocs markdown rendus- Blocs code avec syntax highlighting + bouton copier- Images affichées- Fichiers téléchargeables- Footer : "Powered by SnippetVault" (discret)
**Embed :**
```html<iframe src="https://snippetvault.example.com/embed/x7Hk9pQ"         width="100%" height="400" frameborder="0"></iframe>```
- Version compacte pour intégration blog/doc- Thème respecté
---
### 5.7 Pièces jointes
**Upload :**
- Drag & drop dans l'éditeur- Ou bouton `/image`, `/file`- Limite : 50 Mo/fichier (configurable via env)
**Stockage :**
- Dossier local `/data/uploads/{user_id}/{snippet_id}/`- Nommage : `{uuid}_{filename_original}`
**Types supportés :**
- Images : jpg, png, gif, webp, svg → preview inline- Autres : pdf, zip, txt, etc. → lien téléchargement
---
### 5.8 API REST
**Authentification :**
- Header : `Authorization: Bearer {api_key}`- Clé API visible dans le profil, régénérable
**Endpoints :**
| Méthode | Endpoint | Description ||---------|----------|-------------|| `GET` | `/api/snippets` | Liste (avec search, filtres, pagination) || `GET` | `/api/snippets/:id` | Détail d'un snippet || `POST` | `/api/snippets` | Créer un snippet || `PUT` | `/api/snippets/:id` | Modifier un snippet || `DELETE` | `/api/snippets/:id` | Supprimer || `GET` | `/api/collections` | Liste des collections || `GET` | `/api/tags` | Liste des tags || `POST` | `/api/search` | Recherche avancée |
**Exemple recherche :**
```jsonPOST /api/search{  "query": "alarme niagara",  "filters": {    "tags": ["niagara4"],    "language": "java",    "status": "published"  },  "limit": 20}```
**Réponse :**
```json{  "results": [    {      "id": "uuid",      "title": "Template alarme Niagara",      "excerpt": "...code de gestion des alarmes...",      "tags": ["niagara4", "alarmes"],      "updated_at": "2025-01-20T10:30:00Z"    }  ],  "total": 42}```
**Usage IA :**
- Claude peut chercher via `/api/search`- Lire le contenu complet via `/api/snippets/:id`- Créer/modifier via `POST`/`PUT`- Possibilité de créer un MCP server qui wrappe cette API
---
### 5.9 Export
**Export complet (backup) :**
- Format : ZIP contenant  - `snippets.json` (toutes les données)  - `/attachments/` (tous les fichiers)- Téléchargeable depuis les settings
**Export snippet unique :**
- Markdown (`.md`)- JSON- Image (capture style Carbon) → future feature
---
### 5.10 Thèmes & UI
**Thème global :**
- Clair / Sombre / Système- Stocké dans les préférences user
**Thèmes de code (Shiki) :**
- github-dark, github-light- dracula- one-dark-pro- nord- monokai- + possibilité d'en ajouter
**Responsive :**
- Desktop : sidebar + main content- Mobile : sidebar en drawer, consultation optimisée- Éditeur : desktop-first mais utilisable sur tablette
---
## 6. Architecture technique
### 6.1 Stack
| Composant | Technologie ||-----------|-------------|| Frontend | SvelteKit (SSR + SPA) || UI Components | Tailwind CSS + Shadcn-svelte || Éditeur blocks | TipTap ou BlockNote (custom) || Syntax highlighting | Shiki || Base de données | SQLite + Drizzle ORM || Full-text search | SQLite FTS5 || Auth | Lucia Auth (sessions) || File storage | Local filesystem || API | SvelteKit endpoints (REST) |
### 6.2 Structure du projet
```snippetvault/├── src/│   ├── lib/│   │   ├── components/     # Composants UI│   │   │   ├── editor/     # Éditeur block-based│   │   │   ├── snippet/    # Affichage snippet│   │   │   ├── search/     # Barre de recherche│   │   │   └── ui/         # Composants génériques│   │   ├── server/│   │   │   ├── db/         # Schema Drizzle, migrations│   │   │   ├── auth/       # Lucia config│   │   │   └── services/   # Logique métier│   │   └── utils/          # Helpers│   ├── routes/│   │   ├── (app)/          # Routes authentifiées│   │   │   ├── dashboard/│   │   │   ├── snippets/│   │   │   ├── collections/│   │   │   └── settings/│   │   ├── (public)/       # Routes publiques│   │   │   ├── s/[id]/     # Page snippet public│   │   │   └── embed/[id]/ # Embed iframe│   │   ├── api/            # API REST│   │   │   ├── snippets/│   │   │   ├── collections/│   │   │   ├── search/│   │   │   └── auth/│   │   └── auth/           # Login, register, invite│   └── app.html├── static/├── data/                   # SQLite DB + uploads (volume Docker)│   ├── snippetvault.db│   └── uploads/├── Dockerfile├── docker-compose.yml└── .env.example```
### 6.3 Déploiement Docker
**Dockerfile :**
```dockerfileFROM node:20-alpine AS builderWORKDIR /appCOPY package*.json ./RUN npm ciCOPY . .RUN npm run build
FROM node:20-alpineWORKDIR /appCOPY --from=builder /app/build ./buildCOPY --from=builder /app/package*.json ./RUN npm ci --productionEXPOSE 3000VOLUME /app/dataCMD ["node", "build"]```
**docker-compose.yml :**
```yamlversion: '3.8'services:  snippetvault:    build: .    ports:      - "3000:3000"    volumes:      - ./data:/app/data    environment:      - DATABASE_URL=file:/app/data/snippetvault.db      - UPLOAD_DIR=/app/data/uploads      - UPLOAD_MAX_SIZE=52428800  # 50MB      - SECRET_KEY=change-me-in-production      - ORIGIN=https://snippets.example.com    restart: unless-stopped```
**Backup :**
```bash# Stopper, copier /data, redémarrerdocker compose stopcp -r ./data ./backup-$(date +%Y%m%d)docker compose start```
---
## 7. UI/UX — Wireframes conceptuels
### 7.1 Dashboard (liste snippets)
```┌─────────────────────────────────────────────────────────────────┐│ 🔍 Rechercher...                          [+ Nouveau]  👤 Gus  │├──────────────┬──────────────────────────────────────────────────┤│              │                                                  ││ 📁 Mes       │  Tous les snippets                    Filtres ▼ ││   collections│  ─────────────────────────────────────────────── ││              │                                                  ││ ▼ Niagara4   │  📝 Template alarme standard          java      ││    Alarmes   │     #niagara4 #alarmes         il y a 2 heures  ││    Schedules │                                                  ││              │  📝 Script import devices            python      ││ ▼ LoRaWAN    │     #lorawan #chirpstack             hier       ││    ChirpStack│                                                  ││    Devices   │  📝 Config MQTT bridge                 yaml     ││              │     #lorawan #mqtt              20 jan. 2025    ││ ▼ Python     │                                                  ││              │  🌍 Guide démarrage Niagara    publié   java    ││ ──────────── │     #niagara4 #formation        19 jan. 2025    ││ 🏷️ Tags      │                                                  ││   #niagara4  │                                                  ││   #lorawan   │                                                  ││   #python    │                                                  ││              │                                                  │└──────────────┴──────────────────────────────────────────────────┘```
### 7.2 Éditeur de snippet
```┌─────────────────────────────────────────────────────────────────┐│ ← Retour                    [Brouillon ▼]    [Prévisualiser]   │├─────────────────────────────────────────────────────────────────┤│                                                                 ││ Titre : Template alarme standard                                ││ ─────────────────────────────────────────────────────────────── ││ Collection : Niagara4 / Alarmes          Tags : + niagara4 + al││ ─────────────────────────────────────────────────────────────── ││                                                                 ││ ┌─────────────────────────────────────────────────────────────┐ ││ │ 📝 Markdown                                            ⋮ ↕ │ ││ │                                                             │ ││ │ ## Description                                              │ ││ │ Template standard pour la gestion des alarmes dans un       │ ││ │ programme Niagara4. Inclut la configuration de base...      │ ││ └─────────────────────────────────────────────────────────────┘ ││                                                                 ││ ┌─────────────────────────────────────────────────────────────┐ ││ │ 💻 Code : Java                                     📋  ⋮ ↕ │ ││ │                                                             │ ││ │  1 │ public class AlarmTemplate extends BComponent {        │ ││ │  2 │   @Override                                            │ ││ │  3 │   public void started() {                              │ ││ │  4 │     // Init alarm config                               │ ││ │  5 │   }                                                    │ ││ │  6 │ }                                                      │ ││ └─────────────────────────────────────────────────────────────┘ ││                                                                 ││ ┌─────────────────────────────────────────────────────────────┐ ││ │ 🖼️ Image                                               ⋮ ↕ │ ││ │         [screenshot-alarme.png]                             │ ││ └─────────────────────────────────────────────────────────────┘ ││                                                                 ││                    [ / Ajouter un bloc ]                        ││                                                                 │└─────────────────────────────────────────────────────────────────┘```
### 7.3 Page publique
```┌─────────────────────────────────────────────────────────────────┐│                                                                 ││               Template alarme standard                          ││               par Gus · 20 janvier 2025                         ││                                                                 ││ ─────────────────────────────────────────────────────────────── ││                                                                 ││   ## Description                                                ││   Template standard pour la gestion des alarmes dans un         ││   programme Niagara4. Inclut la configuration de base...        ││                                                                 ││   ┌───────────────────────────────────────────────────────┐     ││   │                                              📋 Java  │     ││   │  public class AlarmTemplate extends BComponent {      │     ││   │    @Override                                          │     ││   │    public void started() {                            │     ││   │      // Init alarm config                             │     ││   │    }                                                  │     ││   │  }                                                    │     ││   └───────────────────────────────────────────────────────┘     ││                                                                 ││   [screenshot-alarme.png]                                       ││                                                                 ││ ─────────────────────────────────────────────────────────────── ││                    Powered by SnippetVault                      │└─────────────────────────────────────────────────────────────────┘```
---
## 8. Roadmap de développement
### Phase 1 — Fondations (2-3 semaines)
- [ ] Setup projet SvelteKit + Tailwind + Drizzle- [ ] Schema DB + migrations- [ ] Auth (Lucia) : login, reg