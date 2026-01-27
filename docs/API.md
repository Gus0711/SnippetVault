# Documentation API

## Vue d'ensemble

SnippetVault expose deux APIs :
1. **API interne** : Utilisee par l'interface web (authentification par session)
2. **API v1** : API REST publique (authentification par cle API)

---

## Authentification

### API interne

Authentification automatique via cookies de session. Necesssite d'etre connecte via l'interface web.

### API v1

```http
Authorization: Bearer {api_key}
```

La cle API est disponible dans Parametres > Profil.

---

## Format des reponses

### Succes

```json
{
  "data": { ... }
}
```

### Erreur

```json
{
  "error": "Message d'erreur"
}
```

### Codes HTTP

| Code | Description |
|------|-------------|
| 200 | Succes |
| 201 | Cree avec succes |
| 400 | Requete invalide |
| 401 | Non authentifie |
| 403 | Non autorise |
| 404 | Non trouve |
| 500 | Erreur serveur |

---

## API v1 - Endpoints publics

Base URL : `/api/v1`

### Snippets

#### Lister les snippets

```http
GET /api/v1/snippets?limit=20&offset=0&collection=id&status=draft|published
```

**Parametres :**

| Nom | Type | Defaut | Description |
|-----|------|--------|-------------|
| limit | number | 20 | Max 100 |
| offset | number | 0 | Pagination |
| collection | string | - | Filtrer par collection |
| status | string | - | draft ou published |

**Reponse :**

```json
{
  "snippets": [
    {
      "id": "uuid",
      "title": "Titre",
      "collectionId": "uuid",
      "status": "published",
      "publicId": "abc123",
      "isFavorite": false,
      "isPinned": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "blocks": [...],
      "tags": [...]
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Creer un snippet

```http
POST /api/v1/snippets
Content-Type: application/json

{
  "title": "Mon snippet",
  "collectionId": "uuid (optionnel)",
  "blocks": [
    {
      "type": "markdown",
      "content": "Description"
    },
    {
      "type": "code",
      "content": "console.log('hello');",
      "language": "javascript"
    }
  ],
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

**Reponse (201) :**

```json
{
  "id": "uuid",
  "title": "Mon snippet",
  "status": "draft",
  "blocks": [...],
  "tags": [...],
  "createdAt": "..."
}
```

#### Obtenir un snippet

```http
GET /api/v1/snippets/{id}
```

**Reponse :**

```json
{
  "id": "uuid",
  "title": "Titre",
  "collectionId": "uuid",
  "status": "published",
  "publicId": "abc123",
  "isFavorite": false,
  "isPinned": false,
  "publicTheme": "github-dark",
  "publicShowDescription": true,
  "publicShowAttachments": true,
  "gistId": null,
  "gistUrl": null,
  "createdAt": "...",
  "updatedAt": "...",
  "blocks": [
    {
      "id": "uuid",
      "type": "code",
      "content": "...",
      "language": "python",
      "order": 0
    }
  ],
  "tags": [
    {
      "id": "uuid",
      "name": "python",
      "color": "#3776ab"
    }
  ],
  "collection": {
    "id": "uuid",
    "name": "Scripts"
  }
}
```

#### Modifier un snippet

```http
PUT /api/v1/snippets/{id}
Content-Type: application/json

{
  "title": "Nouveau titre",
  "collectionId": "uuid",
  "blocks": [...],
  "tagIds": [...],
  "status": "published"
}
```

#### Supprimer un snippet

```http
DELETE /api/v1/snippets/{id}
```

**Reponse :**

```json
{
  "deleted": true
}
```

### Collections

#### Lister les collections

```http
GET /api/v1/collections
```

**Reponse :**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Scripts",
      "description": null,
      "icon": null,
      "parentId": null,
      "isShared": false,
      "createdAt": "...",
      "path": "Scripts"
    },
    {
      "id": "uuid",
      "name": "Python",
      "parentId": "parent-uuid",
      "path": "Scripts / Python"
    }
  ]
}
```

### Tags

#### Lister les tags

```http
GET /api/v1/tags
```

**Reponse :**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "python",
      "color": "#3776ab"
    },
    {
      "id": "uuid",
      "name": "javascript",
      "color": "#f7df1e"
    }
  ]
}
```

### Recherche

#### Rechercher des snippets

```http
GET /api/v1/search?q=query&collection=id&tag=name&status=draft&limit=50
```

**Parametres :**

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| q | string | Oui | Terme de recherche (min 2 chars) |
| collection | string | Non | Filtrer par collection ID |
| tag | string | Non | Filtrer par nom de tag |
| status | string | Non | draft ou published |
| limit | number | Non | Max 100, defaut 50 |

**Reponse :**

```json
{
  "query": "python",
  "total": 5,
  "results": [
    {
      "id": "uuid",
      "title": "Script Python",
      "collectionId": "uuid",
      "status": "published",
      "publicId": "abc123",
      "createdAt": "...",
      "updatedAt": "...",
      "tags": [...]
    }
  ]
}
```

---

## API interne - Endpoints

### Snippets

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/snippets | Lister snippets |
| POST | /api/snippets | Creer snippet |
| GET | /api/snippets/{id} | Obtenir snippet |
| PUT | /api/snippets/{id} | Modifier snippet |
| PATCH | /api/snippets/{id} | Modification partielle |
| DELETE | /api/snippets/{id} | Supprimer snippet |
| PUT | /api/snippets/{id}/favorite | Toggle favori |
| PUT | /api/snippets/{id}/pin | Toggle epingle |
| GET | /api/snippets/{id}/export | Exporter snippet |

#### Export individuel

```http
GET /api/snippets/{id}/export?format=md|zip
```

| Format | Description |
|--------|-------------|
| md | Markdown avec frontmatter YAML |
| zip | Markdown + fichiers joints |

### Collections

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/collections | Lister collections |
| POST | /api/collections | Creer collection |
| GET | /api/collections/{id} | Obtenir collection |
| PATCH | /api/collections/{id} | Modifier collection |
| DELETE | /api/collections/{id} | Supprimer collection |

#### Membres de collection

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/collections/{id}/members | Lister membres |
| POST | /api/collections/{id}/members | Ajouter membre |
| PATCH | /api/collections/{id}/members/{userId} | Modifier permission |
| DELETE | /api/collections/{id}/members/{userId} | Retirer membre |

**Ajouter un membre :**

```http
POST /api/collections/{id}/members
Content-Type: application/json

{
  "email": "user@example.com",
  "permission": "read|write"
}
```

### Tags

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/tags | Lister tags |
| POST | /api/tags | Creer tag |
| PUT | /api/tags/{id} | Modifier tag |
| DELETE | /api/tags/{id} | Supprimer tag |
| POST | /api/user/tags | Creer tag (retourne existant si doublon) |

### Recherche

```http
GET /api/search?q=query&collection=id&tag=name&status=draft|published
```

### Export

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/export/snippets?ids=id1,id2,... | Export ZIP multiple |
| GET | /api/export | Export complet du vault |

### Upload

```http
POST /api/upload
Content-Type: multipart/form-data

file: (binary)
snippetId: uuid (optionnel)
type: image|file
```

**Reponse :**

```json
{
  "data": {
    "path": "/uploads/{userId}/{snippetId}/{filename}",
    "name": "original-filename.png",
    "size": 1024,
    "mimeType": "image/png",
    "isImage": true
  }
}
```

**Restrictions :**

- Taille max : 50MB (configurable)
- Images : JPEG, PNG, GIF, WebP, SVG
- Extensions bloquees : exe, bat, cmd, msi, scr, ps1, vbs, js, jar

### GitHub Gist

```http
POST /api/gist
Content-Type: application/json

{
  "snippetId": "uuid",
  "isPublic": true|false
}
```

**Reponse :**

```json
{
  "data": {
    "gistId": "github-gist-id",
    "gistUrl": "https://gist.github.com/...",
    "updated": false
  }
}
```

**Prerequis :** Token GitHub configure dans les parametres.

### Utilisateur

| Methode | Endpoint | Description |
|---------|----------|-------------|
| PUT | /api/user/theme | Sauvegarder preference theme |

```http
PUT /api/user/theme
Content-Type: application/json

{
  "theme": "light|dark|system"
}
```

### Administration

**Requis :** Role admin

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/admin/users | Lister utilisateurs |
| DELETE | /api/admin/users/{id} | Supprimer utilisateur |
| GET | /api/admin/invitations | Lister invitations |
| POST | /api/admin/invitations | Creer invitation |
| DELETE | /api/admin/invitations/{id} | Revoquer invitation |
| GET | /api/admin/rebuild-fts | Reconstruire index FTS |

#### Creer une invitation

```http
POST /api/admin/invitations
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

---

## Exemples d'utilisation

### cURL - Lister mes snippets

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://your-server.com/api/v1/snippets?limit=10"
```

### cURL - Creer un snippet

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello World",
    "blocks": [
      {"type": "code", "content": "print(\"Hello\")", "language": "python"}
    ]
  }' \
  "https://your-server.com/api/v1/snippets"
```

### Python - Client simple

```python
import requests

API_KEY = "your-api-key"
BASE_URL = "https://your-server.com/api/v1"

headers = {"Authorization": f"Bearer {API_KEY}"}

# Lister snippets
response = requests.get(f"{BASE_URL}/snippets", headers=headers)
snippets = response.json()["snippets"]

# Creer snippet
new_snippet = {
    "title": "Nouveau snippet",
    "blocks": [
        {"type": "markdown", "content": "Description"},
        {"type": "code", "content": "print('hello')", "language": "python"}
    ]
}
response = requests.post(f"{BASE_URL}/snippets", json=new_snippet, headers=headers)
created = response.json()
```

### JavaScript - Fetch API

```javascript
const API_KEY = 'your-api-key';
const BASE_URL = 'https://your-server.com/api/v1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Rechercher
const search = async (query) => {
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
    { headers }
  );
  return response.json();
};

// Creer snippet
const createSnippet = async (title, code, language) => {
  const response = await fetch(`${BASE_URL}/snippets`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      blocks: [{ type: 'code', content: code, language }]
    })
  });
  return response.json();
};
```
