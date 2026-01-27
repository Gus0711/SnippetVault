# Configuration

## Variables d'environnement

### Fichier .env

```env
# Base de donnees SQLite
DATABASE_URL=file:./data/snippetvault.db

# Dossier pour les fichiers uploades
UPLOAD_DIR=./data/uploads

# Taille max upload (bytes) - defaut 50MB
UPLOAD_MAX_SIZE=52428800

# Cle secrete pour sessions et chiffrement
# IMPORTANT: Generer une cle aleatoire de 32+ caracteres
SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire

# URL de l'application (pour cookies et CORS)
ORIGIN=http://localhost:5173
```

### Description des variables

| Variable | Requis | Description |
|----------|--------|-------------|
| DATABASE_URL | Oui | Chemin vers la base SQLite |
| UPLOAD_DIR | Oui | Dossier pour stocker les fichiers |
| UPLOAD_MAX_SIZE | Non | Taille max upload en bytes (defaut: 52428800) |
| SECRET_KEY | Oui | Cle pour sessions et chiffrement |
| ORIGIN | Oui | URL de l'application |

---

## Configuration selon l'environnement

### Developpement

```env
DATABASE_URL=file:./data/snippetvault.db
UPLOAD_DIR=./data/uploads
UPLOAD_MAX_SIZE=52428800
SECRET_KEY=dev-secret-key-not-for-production
ORIGIN=http://localhost:5173
```

### Production (Docker)

```env
DATABASE_URL=file:./data/snippetvault.db
UPLOAD_DIR=./data/uploads
UPLOAD_MAX_SIZE=104857600
SECRET_KEY=clé-très-longue-et-aléatoire-générée-cryptographiquement
ORIGIN=https://snippetvault.votre-domaine.com
```

### Generer une SECRET_KEY securisee

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Configuration des fichiers

### Types de fichiers autorises

Les images acceptees (pour le bloc image) :
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- SVG (`image/svg+xml`)

### Extensions bloquees

Les fichiers avec ces extensions sont refuses :
- `.exe`, `.bat`, `.cmd`, `.msi`, `.scr`
- `.ps1`, `.vbs`, `.js`, `.jar`

### Modifier la taille max

Dans `.env` :

```env
# 100 MB
UPLOAD_MAX_SIZE=104857600

# 200 MB
UPLOAD_MAX_SIZE=209715200
```

**Note :** Ajuster aussi `client_max_body_size` dans Nginx si utilise.

---

## Configuration de la base de donnees

### Emplacement

Par defaut : `./data/snippetvault.db`

Pour changer :

```env
DATABASE_URL=file:/chemin/absolu/vers/base.db
```

### Mode WAL

Active automatiquement dans `src/lib/server/db/index.ts` :

```typescript
db.pragma('journal_mode = WAL');
```

Fichiers generes :
- `snippetvault.db` - Base principale
- `snippetvault.db-wal` - Journal WAL
- `snippetvault.db-shm` - Memoire partagee

---

## Configuration des sessions

### Duree de session

Definie dans `src/lib/server/auth/index.ts` :

```typescript
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours
const SESSION_REFRESH_THRESHOLD = 15 * 24 * 60 * 60 * 1000; // 15 jours
```

- Session valide 30 jours
- Renouvelee automatiquement si < 15 jours restants

### Cookies

Configuration dans `src/lib/server/auth/index.ts` :

```typescript
{
  name: 'session',
  httpOnly: true,
  sameSite: 'lax',
  secure: ORIGIN.startsWith('https'),
  path: '/'
}
```

---

## Configuration des themes

### Themes de code disponibles

Pour les snippets publics, 9 themes Shiki :

| Theme | Description |
|-------|-------------|
| github-dark | GitHub Dark (defaut) |
| github-light | GitHub Light |
| dracula | Dracula |
| nord | Nord |
| one-dark-pro | One Dark Pro |
| vitesse-dark | Vitesse Dark |
| vitesse-light | Vitesse Light |
| min-dark | Min Dark |
| min-light | Min Light |

### Theme utilisateur

Preferences : `light`, `dark`, `system`

Stockee dans :
- Base de donnees : `users.themePreference`
- localStorage : `theme`

---

## Configuration Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  snippetvault:
    build: .
    container_name: snippetvault
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:./data/snippetvault.db
      - UPLOAD_DIR=./data/uploads
      - UPLOAD_MAX_SIZE=${UPLOAD_MAX_SIZE:-52428800}
      - SECRET_KEY=${SECRET_KEY}
      - ORIGIN=${ORIGIN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optionnel: MCP Server pour integration Claude
  mcp-server:
    build: ./mcp-server
    container_name: snippetvault-mcp
    ports:
      - "3002:3002"
    environment:
      - SNIPPETVAULT_API_URL=http://snippetvault:3000
      - SNIPPETVAULT_API_KEY=${MCP_API_KEY}
    depends_on:
      - snippetvault
    restart: unless-stopped
```

### Variables Docker

| Variable | Description |
|----------|-------------|
| UPLOAD_MAX_SIZE | Taille max (defaut 50MB) |
| SECRET_KEY | Cle secrete (requis) |
| ORIGIN | URL publique (requis) |
| MCP_API_KEY | Cle API pour MCP server |

---

## Configuration Reverse Proxy

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name snippetvault.example.com;

    # SSL
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    # Upload size (doit correspondre a UPLOAD_MAX_SIZE)
    client_max_body_size 50M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik (labels Docker)

```yaml
services:
  snippetvault:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.snippetvault.rule=Host(`snippetvault.example.com`)"
      - "traefik.http.routers.snippetvault.entrypoints=websecure"
      - "traefik.http.routers.snippetvault.tls.certresolver=letsencrypt"
      - "traefik.http.services.snippetvault.loadbalancer.server.port=3000"
```

---

## Configuration MCP Server

Pour l'integration Claude AI :

### mcp-server/.env

```env
SNIPPETVAULT_API_URL=http://localhost:3000
SNIPPETVAULT_API_KEY=votre-cle-api
PORT=3002
```

### Obtenir la cle API

1. Se connecter a SnippetVault
2. Aller dans Parametres
3. Section "Profil" > "Cle API"
4. Copier la cle

---

## Drizzle ORM

### drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./data/snippetvault.db'
  }
} satisfies Config;
```

### Commandes

```bash
# Generer migrations
npm run db:generate

# Appliquer migrations
npm run db:migrate

# Pousser schema sans migration
npm run db:push

# Interface graphique
npm run db:studio
```

---

## Tailwind CSS v4

### Configuration

Le projet utilise Tailwind CSS v4 avec la nouvelle syntaxe :

```css
/* src/app.css */
@import 'tailwindcss';
```

Pas de fichier `tailwind.config.js` - la configuration est dans le CSS.

### Theme personnalise

Variables CSS dans `src/app.css` :

```css
:root {
  --background: #ffffff;
  --surface: #f8f9fa;
  --border: #e2e4e8;
  --text: #1a1a1a;
  --text-muted: #6b7280;
  --accent: #2563eb;
}

.dark {
  --background: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --accent: #58a6ff;
}
```
