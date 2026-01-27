# Resolution de problemes

## Problemes courants

### L'application ne demarre pas

#### Port deja utilise

**Symptome :** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution :**

```bash
# Trouver le processus
lsof -i :3000
# ou sur Windows
netstat -ano | findstr :3000

# Tuer le processus
kill -9 <PID>
# ou sur Windows
taskkill /PID <PID> /F

# Ou changer le port dans docker-compose.yml
ports:
  - "3001:3000"
```

#### SECRET_KEY manquante

**Symptome :** `Error: SECRET_KEY is required`

**Solution :**

```bash
# Verifier .env
cat .env | grep SECRET_KEY

# Generer une cle
openssl rand -base64 32
```

#### Base de donnees introuvable

**Symptome :** `Error: SQLITE_CANTOPEN`

**Solution :**

```bash
# Creer le dossier data
mkdir -p data/uploads

# Verifier les permissions
chmod 755 data/
```

---

### Problemes d'authentification

#### Session expiree immediatement

**Symptome :** Deconnexion apres chaque action

**Causes possibles :**
1. ORIGIN mal configure
2. Cookies bloques

**Solutions :**

```bash
# Verifier ORIGIN dans .env
# Doit correspondre exactement a l'URL utilisee
ORIGIN=https://snippetvault.example.com  # Pas de / final
```

#### Impossible de se connecter

**Symptome :** "Invalid credentials" meme avec bon mot de passe

**Solutions :**

```bash
# Reset le mot de passe admin
node scripts/reset-password.js admin@email.com newpassword
```

---

### Problemes de recherche

#### Recherche ne retourne rien

**Symptome :** Aucun resultat meme pour des termes existants

**Solutions :**

```bash
# 1. Reconstruire l'index FTS via API
curl -X POST http://localhost:3000/api/admin/rebuild-fts \
  -H "Cookie: session=..."

# 2. Ou via SQLite directement
sqlite3 data/snippetvault.db
DELETE FROM snippets_fts;
-- Redemarrer l'application
```

#### Index FTS corrompu

**Symptome :** Erreurs `fts5: ... malformed`

**Solution :**

```sql
-- Dans SQLite
DROP TABLE IF EXISTS snippets_fts;
-- Redemarrer l'application pour recreer la table
```

---

### Problemes d'upload

#### Upload echoue silencieusement

**Symptome :** Fichier non uploade, pas d'erreur visible

**Verifications :**

```bash
# 1. Verifier les permissions du dossier
ls -la data/uploads/

# 2. Verifier l'espace disque
df -h

# 3. Verifier la taille max dans .env
cat .env | grep UPLOAD_MAX_SIZE
```

#### Fichier trop gros

**Symptome :** `413 Request Entity Too Large`

**Solutions :**

```bash
# 1. Augmenter dans .env
UPLOAD_MAX_SIZE=104857600  # 100MB

# 2. Augmenter dans Nginx
client_max_body_size 100M;

# 3. Redemarrer
docker compose restart
```

#### Type de fichier refuse

**Symptome :** "File type not allowed"

Les extensions suivantes sont bloquees : exe, bat, cmd, msi, scr, ps1, vbs, js, jar

Pour les fichiers legitimes avec ces extensions, les compresser en ZIP.

---

### Problemes de base de donnees

#### Base corrompue

**Symptome :** `SQLITE_CORRUPT` ou `database disk image is malformed`

**Solutions :**

```bash
# 1. Verifier l'integrite
sqlite3 data/snippetvault.db "PRAGMA integrity_check;"

# 2. Tenter une reparation
sqlite3 data/snippetvault.db ".recover" | sqlite3 data/recovered.db

# 3. Ou restaurer depuis backup
tar -xzf /backups/snippetvault_latest.tar.gz
```

#### Migration echouee

**Symptome :** Erreur lors de `npm run db:migrate`

**Solutions :**

```bash
# 1. Voir l'etat des migrations
cat drizzle/meta/_journal.json

# 2. Reset complet (PERTE DE DONNEES)
rm data/snippetvault.db
npm run db:migrate

# 3. Ou corriger manuellement
sqlite3 data/snippetvault.db
-- Executer les commandes SQL de la migration
```

#### WAL non vide

**Symptome :** Fichiers `-wal` et `-shm` volumineux

**Solution :**

```bash
# Checkpoint WAL
sqlite3 data/snippetvault.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

---

### Problemes Docker

#### Container ne demarre pas

**Symptome :** Container restart en boucle

```bash
# Voir les logs
docker compose logs snippetvault

# Verifier la config
docker compose config
```

#### Volume non monte

**Symptome :** Donnees perdues au redemarrage

**Solution :**

```yaml
# docker-compose.yml
volumes:
  - ./data:/app/data  # Chemin relatif ou absolu
```

#### Build echoue

**Symptome :** Erreur lors de `docker compose build`

```bash
# Clean rebuild
docker compose build --no-cache

# Nettoyer les images
docker system prune -a
```

---

### Problemes de performance

#### Recherche lente

**Symptome :** Recherche prend plusieurs secondes

**Solutions :**

```bash
# 1. Verifier la taille de l'index
sqlite3 data/snippetvault.db "SELECT COUNT(*) FROM snippets_fts;"

# 2. Optimiser FTS
sqlite3 data/snippetvault.db "INSERT INTO snippets_fts(snippets_fts) VALUES('optimize');"
```

#### Page lente a charger

**Symptome :** Dashboard met du temps

**Solutions :**

1. Verifier le nombre de snippets (limite a 50 par defaut)
2. Activer le mode WAL si pas fait
3. Ajouter des index si requetes frequentes

---

### Problemes de theme

#### Theme ne change pas

**Symptome :** Toggle sans effet

**Solutions :**

```bash
# 1. Verifier localStorage
# Dans la console navigateur
localStorage.getItem('theme')

# 2. Forcer un theme
localStorage.setItem('theme', 'dark')
location.reload()
```

#### Syntax highlighting absent

**Symptome :** Code sans couleurs dans l'editeur

**Verifications :**

1. CSS hljs charge dans `app.css`
2. lowlight configure avec les langages
3. Extension CodeBlockLowlight active

---

### Problemes API

#### 401 Unauthorized

**Symptome :** API retourne 401

**Verifications :**

```bash
# 1. Verifier la cle API
curl -H "Authorization: Bearer VOTRE_CLE" \
  http://localhost:3000/api/v1/snippets

# 2. Verifier que la cle existe
sqlite3 data/snippetvault.db "SELECT api_key FROM users WHERE id='...';"
```

#### 403 Forbidden

**Symptome :** Acces refuse a une ressource

**Cause :** Permission insuffisante (pas owner/membre de la collection)

**Solution :** Verifier les permissions de l'utilisateur sur la ressource.

#### 500 Internal Server Error

**Symptome :** Erreur serveur generique

**Debug :**

```bash
# Voir les logs complets
docker compose logs -f snippetvault

# Ou si PM2
pm2 logs snippetvault --err
```

---

### Problemes GitHub Gist

#### Export Gist echoue

**Symptome :** "Failed to create Gist"

**Verifications :**

1. Token GitHub configure dans parametres
2. Token a les permissions `gist`
3. Token non expire

**Regenerer un token :**

1. GitHub > Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Cocher `gist`
4. Copier et sauvegarder dans SnippetVault

---

## Logs et diagnostics

### Activer les logs detailles

```typescript
// Dans le code, ajouter des logs
console.log('[Module] Action:', data);
console.error('[Module] Error:', error);
```

### Verifier l'etat du systeme

```bash
# Espace disque
df -h

# Memoire
free -m

# Processus
docker stats

# Connexions
netstat -tlnp
```

### Exporter les diagnostics

```bash
# Creer un rapport
echo "=== System Info ===" > diagnostic.txt
uname -a >> diagnostic.txt
echo "=== Docker ===" >> diagnostic.txt
docker compose ps >> diagnostic.txt
docker compose logs --tail=100 >> diagnostic.txt
echo "=== Database ===" >> diagnostic.txt
sqlite3 data/snippetvault.db "PRAGMA integrity_check;" >> diagnostic.txt
```

---

## Reinitialisation complete

En dernier recours, pour repartir de zero :

```bash
# ATTENTION: Supprime toutes les donnees !

# 1. Arreter
docker compose down

# 2. Supprimer les donnees
rm -rf data/*

# 3. Recreer la structure
mkdir -p data/uploads

# 4. Relancer
docker compose up -d

# 5. Configurer via /auth/setup
```

---

## Obtenir de l'aide

1. Consulter cette documentation
2. Verifier les logs (`docker compose logs`)
3. Chercher dans les issues GitHub
4. Ouvrir une issue avec :
   - Description du probleme
   - Etapes pour reproduire
   - Logs pertinents
   - Version (git commit)
