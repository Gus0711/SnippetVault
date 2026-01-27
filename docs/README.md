# Documentation SnippetVault

## A propos

SnippetVault est un gestionnaire de snippets de code auto-heberge avec une organisation style Notion, un rendu style Carbon, et un editeur de blocs TipTap.

## Table des matieres

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | Architecture technique et structure du projet |
| [Fonctionnalites](./FEATURES.md) | Catalogue complet des fonctionnalites |
| [API](./API.md) | Documentation de l'API REST |
| [Base de donnees](./DATABASE.md) | Schema et modeles de donnees |
| [Installation](./INSTALLATION.md) | Guide d'installation |
| [Configuration](./CONFIGURATION.md) | Options de configuration |
| [Deploiement](./DEPLOYMENT.md) | Procedures de deploiement Docker |
| [Developpement](./DEVELOPMENT.md) | Guide du developpeur |
| [Resolution de problemes](./TROUBLESHOOTING.md) | Problemes courants et solutions |
| [Reset Password](./RESET-PASSWORD.md) | Reinitialisation mot de passe admin |

## Quick Start

```bash
# Cloner et installer
git clone https://github.com/user/snippetvault.git
cd snippetvault
npm install

# Configurer
cp .env.example .env
# Editer .env avec vos valeurs

# Lancer en developpement
npm run dev

# Ou via Docker
docker compose up -d
```

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Framework | SvelteKit 2.x (SSR + SPA) |
| Base de donnees | SQLite + Drizzle ORM |
| Recherche | SQLite FTS5 |
| Authentification | Lucia Auth (sessions) |
| UI | Tailwind CSS v4 + shadcn-svelte |
| Editeur | TipTap (blocs) |
| Syntax highlighting | Shiki (serveur) + lowlight (editeur) |
| Export ZIP | archiver |
| Deploiement | Docker (conteneur unique) |

## Fonctionnalites principales

- **Editeur de blocs** : Markdown, code, images, fichiers, tableaux, callouts
- **Organisation hierarchique** : Collections imbriquees a l'infini
- **Recherche full-text** : FTS5 sur titre, contenu et tags
- **Partage public** : URLs uniques + embed iframe
- **Actions en lot** : Multi-selection avec deplacer, taguer, exporter, supprimer
- **Export** : Markdown, ZIP, export complet du vault
- **API REST** : v1 avec authentification par cle API
- **Integration GitHub** : Export vers Gist

## Liens utiles

- [Specification complete](../SnippetVault_Specification.md)
- [Notes de reprise](../reprise.md)
- [Instructions Claude Code](../CLAUDE.md)
