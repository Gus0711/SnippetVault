<div align="center">

# SnippetVault

**Self-hosted code snippet manager**

[Features](#features) | [Installation](#installation) | [Documentation](#documentation) | [API](#api)

</div>

---

## About

SnippetVault is an open-source, self-hosted code snippet manager. It combines a powerful block editor (inspired by Notion), instant full-text search, and flexible sharing options.

**Why SnippetVault?**

- **Self-hosted**: Your data stays on your server
- **Simple**: Single Docker container, single SQLite file
- **Powerful**: Block editor, FTS5 search, full REST API
- **Private**: No telemetry, no tracking

<img width="1820" height="537" alt="image" src="https://github.com/user-attachments/assets/5e7e0dcf-d5d0-4a17-b15e-d006f07c184a" />


## Features

### Block Editor

- **17+ block types**: Markdown, code, images, files, tables, callouts, tasks
- **Slash menu**: Type `/` to insert any block
- **Auto-detection**: Code language is detected automatically
- **Drag & Drop**: Drag and drop images and files

### Organization

- **Hierarchical collections**: Organize your snippets with unlimited nesting
- **Colored tags**: Categorize with custom tags
- **Favorites and pins**: Quick access to your important snippets

### Search

- **Full-text search**: Instant search with SQLite FTS5
- **Advanced filters**: By collection, tag, or status
- **Keyboard shortcut**: `Ctrl+K` to search

### Sharing

- **Public URLs**: Share with a unique URL
- **Embed iframe**: Embed in any website
- **9 code themes**: GitHub Dark, Dracula, Nord...

### Multilingual

- **French and English**: Fully translated interface (430+ keys)
- **Instant switch**: Toggle in Settings, no reload needed
- **Persistence**: Preference saved in database and localStorage

### Export

- **Markdown**: Export with YAML frontmatter
- **ZIP**: Archive with attached files
- **GitHub Gist**: Direct export to Gist

### REST API

- **42+ endpoints**: Full CRUD for snippets, collections, tags
- **Authentication**: Secure API key
- **Documentation**: Complete in `/docs/API.md`

## Installation

### With Docker (recommended)

```bash
git clone https://github.com/Gus0711/SnippetVault.git
cd SnippetVault
docker compose up -d
```

The application is available at `http://localhost:3000`.

**Default admin account:**
- Email: `admin@snippetvault.local`
- Password: `admin`

> **Important:** Change the password after first login!

> **Note:** The first build compiles native modules (~2-5 min, ~2 GB RAM).

### Optional Configuration

The application works **without any configuration**:

- `SECRET_KEY`: Auto-generated on first launch, persisted in `data/.secret_key`
- `ORIGIN`: Defaults to `http://0.0.0.0:3000`

To customize, create a `.env` file:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | Auto-generated | Session encryption key |
| `ORIGIN` | `http://0.0.0.0:3000` | Application URL |
| `UPLOAD_MAX_SIZE` | `52428800` (50 MB) | Max upload size |

### Production (recommended)

For deployment with HTTPS and a custom domain:

```env
ORIGIN=https://snippets.example.com
```

### Security

SnippetVault is designed for **self-hosting** on a private network or behind a reverse proxy.

Protection relies on:
- **HttpOnly + SameSite=Lax cookies**: Session theft protection
- **API tokens**: Programmatic request authentication
- **Session encryption**: Via unique SECRET_KEY per instance

> **Note:** CSRF origin check is disabled to allow access from any IP/domain without configuration. This is an acceptable trade-off for self-hosted use.

### Without Docker

```bash
git clone https://github.com/Gus0711/SnippetVault.git
cd SnippetVault
npm install

cp .env.example .env
# Edit .env and set SECRET_KEY

mkdir -p data/uploads
npm run db:migrate
npm run dev
```

### Updating

```bash
cd SnippetVault
git pull origin main
docker compose up -d --build
```

Database migrations are applied **automatically** on container startup:

- SQL files in `drizzle/` are compared against a tracking table (`_drizzle_migrations`)
- Only missing migrations are applied, in order
- An **automatic backup** of the DB is created before any migration (`data/snippetvault.db.bak-YYYYMMDD-HHMMSS`)
- On error, the backup is restored and the container stops

> **Note:** Existing databases (created before the migration system was added) are detected automatically — all known migrations are marked as already applied.

## Documentation

Full documentation is available in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [FEATURES.md](docs/FEATURES.md) | Feature catalog |
| [API.md](docs/API.md) | REST API documentation |
| [DATABASE.md](docs/DATABASE.md) | Database schema |
| [INSTALLATION.md](docs/INSTALLATION.md) | Installation guide |
| [CONFIGURATION.md](docs/CONFIGURATION.md) | Configuration options |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Developer guide |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Troubleshooting |

## API

Usage example:

```bash
# List snippets
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-instance.com/api/v1/snippets

# Create a snippet
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello World", "blocks": [{"type": "code", "content": "print(\"Hello\")", "language": "python"}]}' \
  https://your-instance.com/api/v1/snippets
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | SvelteKit |
| Database | SQLite + Drizzle ORM |
| Search | SQLite FTS5 |
| Editor | TipTap |
| Syntax highlighting | Shiki |
| UI | Tailwind CSS + shadcn-svelte |
| Deployment | Docker |

## Useful Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run db:generate   # Generate migration
npm run db:migrate    # Apply migrations
npm run db:studio     # DB interface (Drizzle Studio)
npm run create-invite # Create an invitation
```

## Contributing

Contributions are welcome! See [DEVELOPMENT.md](docs/DEVELOPMENT.md) to get started.

## License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">

**[Documentation](docs/README.md)** | **[Issues](https://github.com/Gus0711/SnippetVault/issues)** | **[Discussions](https://github.com/Gus0711/SnippetVault/discussions)**

</div>
