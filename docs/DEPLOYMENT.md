# Deploiement

## Vue d'ensemble

SnippetVault est concu pour un deploiement auto-heberge simple via Docker. Un seul conteneur avec un volume pour les donnees persistantes.

---

## Deploiement Docker (recommande)

### Prerequis

- Docker 24.x+
- Docker Compose v2
- Domaine avec certificat SSL (recommande)

### Etapes

#### 1. Preparer le serveur

```bash
# Creer le dossier
mkdir -p /opt/snippetvault
cd /opt/snippetvault

# Cloner le repo
git clone https://github.com/user/snippetvault.git .

# Creer le fichier .env
cp .env.example .env
```

#### 2. Configurer l'environnement

Editer `.env` :

```env
DATABASE_URL=file:./data/snippetvault.db
UPLOAD_DIR=./data/uploads
UPLOAD_MAX_SIZE=52428800
SECRET_KEY=votre-cle-secrete-generee-aleatoirement
ORIGIN=https://snippetvault.votre-domaine.com
```

#### 3. Lancer l'application

```bash
# Build et demarrage
docker compose up -d --build

# Verifier le statut
docker compose ps

# Voir les logs
docker compose logs -f
```

#### 4. Configuration initiale

1. Ouvrir `https://snippetvault.votre-domaine.com/auth/setup`
2. Creer le compte administrateur
3. L'application est prete

---

## Deploiement manuel (sans Docker)

### Prerequis

- Node.js 20.x+
- npm 10.x+
- Process manager (PM2 recommande)

### Etapes

#### 1. Installation

```bash
git clone https://github.com/user/snippetvault.git
cd snippetvault
npm install
```

#### 2. Build production

```bash
npm run build
```

#### 3. Configuration

```bash
cp .env.example .env
# Editer .env avec les valeurs de production
```

#### 4. Lancer avec PM2

```bash
# Installer PM2
npm install -g pm2

# Demarrer
pm2 start build/index.js --name snippetvault

# Sauvegarder la config
pm2 save

# Demarrage automatique au boot
pm2 startup
```

---

## Configuration Nginx

### Avec certificat Let's Encrypt

```bash
# Installer Certbot
apt install certbot python3-certbot-nginx

# Obtenir certificat
certbot --nginx -d snippetvault.votre-domaine.com
```

### Configuration complete

```nginx
# /etc/nginx/sites-available/snippetvault
server {
    listen 80;
    server_name snippetvault.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name snippetvault.votre-domaine.com;

    # SSL (genere par Certbot)
    ssl_certificate /etc/letsencrypt/live/snippetvault.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/snippetvault.votre-domaine.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Securite
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Upload (correspondre a UPLOAD_MAX_SIZE)
    client_max_body_size 50M;

    # Proxy vers l'application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Activer le site :

```bash
ln -s /etc/nginx/sites-available/snippetvault /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Healthcheck

### Docker

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Monitoring externe

Endpoint a surveiller :
- `GET /` - Page d'accueil (200 OK)
- `GET /api/v1/snippets` - API (avec auth)

---

## Mise a jour

### Docker

```bash
cd /opt/snippetvault

# Arreter
docker compose down

# Mettre a jour
git pull

# Rebuild et relancer
docker compose up -d --build

# Verifier
docker compose logs -f
```

### Manuel (PM2)

```bash
cd /opt/snippetvault

# Mettre a jour
git pull
npm install
npm run build

# Redemarrer
pm2 restart snippetvault
```

---

## Sauvegarde et restauration

### Sauvegarde automatique (cron)

```bash
# Editer crontab
crontab -e

# Ajouter (backup quotidien a 3h du matin)
0 3 * * * /opt/snippetvault/scripts/backup.sh
```

### Script de sauvegarde

```bash
#!/bin/bash
# /opt/snippetvault/scripts/backup.sh

set -e

BACKUP_DIR=/var/backups/snippetvault
DATE=$(date +%Y%m%d_%H%M%S)
DATA_DIR=/opt/snippetvault/data

# Creer dossier backup
mkdir -p $BACKUP_DIR

# Backup avec SQLite checkpoint (pour WAL)
sqlite3 $DATA_DIR/snippetvault.db "PRAGMA wal_checkpoint(TRUNCATE);"

# Archiver
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $DATA_DIR .

# Garder les 7 derniers backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup complete: backup_$DATE.tar.gz"
```

### Restauration

```bash
#!/bin/bash
# /opt/snippetvault/scripts/restore.sh

BACKUP_FILE=$1
DATA_DIR=/opt/snippetvault/data

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh backup_20240115_030000.tar.gz"
  exit 1
fi

# Arreter l'application
docker compose stop snippetvault

# Sauvegarder l'etat actuel (au cas ou)
mv $DATA_DIR $DATA_DIR.old

# Restaurer
mkdir -p $DATA_DIR
tar -xzf /var/backups/snippetvault/$BACKUP_FILE -C $DATA_DIR

# Redemarrer
docker compose start snippetvault

echo "Restored from $BACKUP_FILE"
```

---

## Migration de serveur

### Export

Sur l'ancien serveur :

```bash
# Arreter l'application
docker compose stop snippetvault

# Creer archive complete
tar -czf snippetvault_migration.tar.gz data/ .env

# Transferer
scp snippetvault_migration.tar.gz user@nouveau-serveur:/opt/
```

### Import

Sur le nouveau serveur :

```bash
# Cloner le repo
git clone https://github.com/user/snippetvault.git /opt/snippetvault
cd /opt/snippetvault

# Extraire les donnees
tar -xzf /opt/snippetvault_migration.tar.gz

# Mettre a jour ORIGIN dans .env
nano .env

# Lancer
docker compose up -d --build
```

---

## Monitoring et logs

### Logs Docker

```bash
# Tous les logs
docker compose logs -f

# Derniers 100 lignes
docker compose logs --tail=100

# Logs d'un service
docker compose logs -f snippetvault
```

### Logs fichier (PM2)

```bash
# Voir les logs
pm2 logs snippetvault

# Emplacement
~/.pm2/logs/snippetvault-out.log
~/.pm2/logs/snippetvault-error.log
```

### Metriques

PM2 avec monitoring :

```bash
pm2 monit
```

---

## Securite en production

### Checklist

- [ ] SECRET_KEY aleatoire et unique
- [ ] HTTPS active avec certificat valide
- [ ] Pare-feu configure (ports 80, 443 uniquement)
- [ ] Backups automatiques configures
- [ ] Mise a jour regulieres planifiees
- [ ] Logs surveilles

### Durcissement

```bash
# Permissions restrictives sur .env
chmod 600 .env

# Permissions sur data/
chmod 700 data/
```

### Fail2ban (optionnel)

Pour proteger contre le brute-force sur `/auth/login` :

```ini
# /etc/fail2ban/jail.local
[snippetvault]
enabled = true
port = http,https
filter = snippetvault
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
```

```ini
# /etc/fail2ban/filter.d/snippetvault.conf
[Definition]
failregex = ^<HOST> .* "POST /auth/login HTTP/.*" 401
ignoreregex =
```
