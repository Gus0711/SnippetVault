# Guide d'Installation

## Prerequis

- **Node.js** 20.x ou superieur
- **npm** 10.x ou superieur
- **Git** (pour cloner le repo)

Pour Docker :
- **Docker** 24.x ou superieur
- **Docker Compose** v2

---

## Installation locale (developpement)

### 1. Cloner le repository

```bash
git clone https://github.com/user/snippetvault.git
cd snippetvault
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Editer `.env` :

```env
DATABASE_URL=file:./data/snippetvault.db
UPLOAD_DIR=./data/uploads
UPLOAD_MAX_SIZE=52428800
SECRET_KEY=votre-cle-secrete-aleatoire-32-chars
ORIGIN=http://localhost:5173
```

### 4. Initialiser la base de donnees

```bash
# Creer le dossier data
mkdir -p data/uploads

# Appliquer les migrations
npm run db:migrate
```

### 5. Lancer le serveur de developpement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

### 6. Se connecter

Un compte admin est cree automatiquement au premier demarrage :

- **URL** : `http://localhost:5173`
- **Email** : `admin@snippetvault.local`
- **Mot de passe** : `admin`

> **Note :** Pour creer manuellement le compte admin via `/auth/setup`,
> ajoutez `AUTO_CREATE_ADMIN=false` dans votre `.env`.

---

## Installation Docker (production)

### 1. Cloner le repository

```bash
git clone https://github.com/user/snippetvault.git
cd snippetvault
```

### 2. Lancer avec Docker Compose

```bash
docker compose up -d
```

> **Note :** Le premier build peut prendre plusieurs minutes car il compile `better-sqlite3`.
> Prerequis : ~2 Go de RAM disponible pendant le build.

### 3. Verifier le statut

```bash
docker compose ps
docker compose logs -f snippetvault
```

### 4. Se connecter

Un compte admin est cree automatiquement :

- **URL** : `http://localhost:3000`
- **Email** : `admin@snippetvault.local`
- **Mot de passe** : `admin`

> **Important :** Changez le mot de passe apres la premiere connexion !

### 5. Configuration personnalisee (optionnel)

La `SECRET_KEY` est **automatiquement generee** au premier lancement et persistee dans `data/.secret_key`. Aucune configuration n'est requise pour demarrer.

Pour personnaliser d'autres options, creez un fichier `.env` :

```bash
cp .env.example .env
```

Variables disponibles :

| Variable | Defaut | Description |
|----------|--------|-------------|
| `SECRET_KEY` | Auto-generee | Cle de chiffrement des sessions |
| `ORIGIN` | `http://localhost:3000` | URL d'acces (important pour les cookies) |
| `UPLOAD_MAX_SIZE` | `52428800` (50 Mo) | Taille max des uploads |
| `AUTO_CREATE_ADMIN` | `true` | Creer un admin par defaut |

### Acces reseau

Si vous accedez depuis une autre machine sur le reseau, vous devez changer `ORIGIN` :

```env
# Acces via IP locale
ORIGIN=http://192.168.1.100:3000

# Acces via nom de domaine
ORIGIN=https://snippets.example.com
```

> **Important :** Si `ORIGIN` ne correspond pas a l'URL utilisee dans le navigateur,
> les cookies de session ne fonctionneront pas et vous ne pourrez pas vous connecter.

### Desactiver l'admin par defaut

Si vous preferez creer manuellement le compte admin via `/auth/setup` :

```env
AUTO_CREATE_ADMIN=false
```

---

## Structure Docker

### docker-compose.yml

```yaml
services:
  snippetvault:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/snippetvault.db
      - UPLOAD_DIR=/app/data/uploads
      # SECRET_KEY is auto-generated if not set
      - SECRET_KEY=${SECRET_KEY:-}
      - ORIGIN=${ORIGIN:-http://localhost:3000}
    restart: unless-stopped
```

### Volumes

| Volume | Contenu |
|--------|---------|
| `./data` | Base SQLite + fichiers uploades |

### Ports

| Port | Service |
|------|---------|
| 3000 | Application web |

---

## Reverse Proxy (Nginx)

Configuration recommandee pour HTTPS :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Mise a jour

### Locale

```bash
git pull
npm install
npm run db:migrate
npm run build
```

### Docker

```bash
git pull
docker compose build
docker compose up -d
```

---

## Sauvegarde

### Donnees a sauvegarder

```
data/
├── snippetvault.db      # Base de donnees SQLite
├── snippetvault.db-wal  # Journal WAL (si existe)
├── snippetvault.db-shm  # Memoire partagee (si existe)
└── uploads/             # Fichiers uploades
```

### Script de sauvegarde

```bash
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Arret temporaire pour coherence
docker compose stop snippetvault

# Copie des fichiers
tar -czf $BACKUP_DIR/snippetvault_$DATE.tar.gz data/

# Redemarrage
docker compose start snippetvault

echo "Backup created: snippetvault_$DATE.tar.gz"
```

### Restauration

```bash
# Arret
docker compose stop snippetvault

# Restauration
rm -rf data/*
tar -xzf snippetvault_20240115_120000.tar.gz

# Redemarrage
docker compose start snippetvault
```

---

## Verification de l'installation

### Checklist

- [ ] Application accessible sur l'URL configuree
- [ ] Page de setup affichee (premiere connexion)
- [ ] Compte admin cree avec succes
- [ ] Creation de snippet fonctionnelle
- [ ] Upload d'image fonctionnel
- [ ] Recherche retourne des resultats

### Tests de base

```bash
# Verifier le statut HTTP
curl -I http://localhost:3000

# Verifier l'API (apres creation compte)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/v1/snippets
```

---

## Problemes courants

### Port deja utilise

```bash
# Trouver le processus
lsof -i :3000

# Ou changer le port dans docker-compose.yml
ports:
  - "3001:3000"
```

### Permissions fichiers

```bash
# Donner les permissions au dossier data
chmod -R 755 data/
```

### Base de donnees corrompue

```bash
# Verifier l'integrite
sqlite3 data/snippetvault.db "PRAGMA integrity_check;"

# Si corrompu, restaurer depuis backup
```

Voir [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour plus de solutions.
