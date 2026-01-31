<div align="center">

# SnippetVault

**Gestionnaire de snippets de code auto-heberge**

[Fonctionnalites](#fonctionnalites) | [Installation](#installation) | [Documentation](#documentation) | [API](#api)

</div>

---

## A propos

SnippetVault est un gestionnaire de snippets de code open source et auto-heberge. Il combine un editeur de blocs puissant (inspire de Notion), une recherche full-text instantanee et des options de partage flexibles.

**Pourquoi SnippetVault ?**

- **Auto-heberge** : Vos donnees restent sur votre serveur
- **Simple** : Un seul conteneur Docker, un fichier SQLite
- **Puissant** : Editeur de blocs, recherche FTS5, API REST complete
- **Prive** : Aucune telemetrie, aucun tracking

## Fonctionnalites

### Editeur de blocs

- **17+ types de blocs** : Markdown, code, images, fichiers, tableaux, callouts, taches
- **Menu slash** : Tapez `/` pour inserer n'importe quel bloc
- **Detection automatique** : Le langage de code est detecte automatiquement
- **Drag & Drop** : Glissez-deposez images et fichiers

### Organisation

- **Collections hierarchiques** : Organisez vos snippets a l'infini
- **Tags colores** : Categorisez avec des tags personnalises
- **Favoris et epingles** : Acces rapide a vos snippets importants

### Recherche

- **Full-text search** : Recherche instantanee avec SQLite FTS5
- **Filtres avances** : Par collection, tag ou statut
- **Raccourci clavier** : `Ctrl+K` pour rechercher

### Partage

- **URLs publiques** : Partagez avec une URL unique
- **Embed iframe** : Integrez dans n'importe quel site
- **9 themes de code** : GitHub Dark, Dracula, Nord...

### Export

- **Markdown** : Export avec frontmatter YAML
- **ZIP** : Archive avec fichiers attaches
- **GitHub Gist** : Export direct vers Gist

### API REST

- **42+ endpoints** : CRUD complet pour snippets, collections, tags
- **Authentification** : Cle API securisee
- **Documentation** : Complete dans `/docs/API.md`

## Installation

### Avec Docker (recommande)

```bash
# Cloner le repository
git clone https://github.com/Gus0711/SnippetVault.git
cd SnippetVault

# Lancer (aucune configuration requise pour tester)
docker compose up -d

# Ouvrir http://localhost:3000
```

> **Note :** Le premier build compile des modules natifs et peut prendre quelques minutes.
> Prerequis : ~2 Go de RAM disponible pendant le build.

**Compte admin par defaut :**
- Email : `admin@snippetvault.local`
- Mot de passe : `admin`

> **Important :** Changez le mot de passe apres la premiere connexion !

### Sans Docker

```bash
# Cloner et installer
git clone https://github.com/Gus0711/SnippetVault.git
cd SnippetVault
npm install

# Configurer
cp .env.example .env
mkdir -p data/uploads

# Base de donnees
npm run db:migrate

# Lancer en developpement
npm run dev
```

## Configuration

Le fichier `.env` est **optionnel** pour un test local. Le `docker-compose.yml` a des valeurs par defaut.

Pour personnaliser, copiez `.env.example` vers `.env` :

```env
SECRET_KEY=votre-cle-secrete-aleatoire
ORIGIN=http://localhost:3000
```

### Acces reseau / Production

Si vous accedez depuis une autre machine (homelab, serveur), changez `ORIGIN` :

```env
# Acces via IP locale
ORIGIN=http://192.168.1.100:3000

# Acces via domaine
ORIGIN=https://snippets.example.com
```

> **Note :** `ORIGIN` doit correspondre a l'URL utilisee dans le navigateur, sinon les cookies de session ne fonctionneront pas.

## Documentation

La documentation complete est disponible dans le dossier `docs/` :

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique |
| [FEATURES.md](docs/FEATURES.md) | Catalogue des fonctionnalites |
| [API.md](docs/API.md) | Documentation API REST |
| [DATABASE.md](docs/DATABASE.md) | Schema de base de donnees |
| [INSTALLATION.md](docs/INSTALLATION.md) | Guide d'installation |
| [CONFIGURATION.md](docs/CONFIGURATION.md) | Options de configuration |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploiement en production |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Guide du developpeur |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Resolution de problemes |

## API

Exemple d'utilisation de l'API :

```bash
# Lister les snippets
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-instance.com/api/v1/snippets

# Creer un snippet
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello World", "blocks": [{"type": "code", "content": "print(\"Hello\")", "language": "python"}]}' \
  https://your-instance.com/api/v1/snippets
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | SvelteKit |
| Base de donnees | SQLite + Drizzle ORM |
| Recherche | SQLite FTS5 |
| Editeur | TipTap |
| Syntax highlighting | Shiki |
| UI | Tailwind CSS + shadcn-svelte |
| Deploiement | Docker |

## Commandes utiles

```bash
npm run dev           # Serveur de developpement
npm run build         # Build production
npm run db:generate   # Generer migration
npm run db:migrate    # Appliquer migrations
npm run db:studio     # Interface DB (Drizzle Studio)
npm run create-invite # Creer une invitation
```

## Contribution

Les contributions sont les bienvenues ! Consultez [DEVELOPMENT.md](docs/DEVELOPMENT.md) pour commencer.

## Licence

MIT License - voir [LICENSE](LICENSE)

---

<div align="center">

**[Documentation](docs/README.md)** | **[Issues](https://github.com/Gus0711/SnippetVault/issues)** | **[Discussions](https://github.com/Gus0711/SnippetVault/discussions)**

</div>
