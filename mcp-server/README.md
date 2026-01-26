# SnippetVault MCP Server

MCP (Model Context Protocol) server for SnippetVault. Connect AI assistants like Claude to your code snippets.

## Features

- **8 Tools**: Search, list, create, update, delete snippets + list collections and tags
- **3 Resources**: Access recent snippets, collection tree, and individual snippet content
- **HTTP/SSE Transport**: Compatible with Claude.ai and other remote MCP clients

## Installation

### Option 1: Docker (Recommended)

The MCP server is included in the SnippetVault Docker Compose setup:

```bash
docker compose up -d
```

### Option 2: Standalone

```bash
cd mcp-server
npm install
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SNIPPETVAULT_URL` | URL of SnippetVault instance | `http://localhost:3000` |
| `PORT` | MCP server port | `3002` |

### Authentication

Pass your SnippetVault API key via:
- **Header**: `Authorization: Bearer YOUR_API_KEY`
- **Query param**: `?apiKey=YOUR_API_KEY`

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | SSE connection (requires API key) |
| `/messages` | POST | MCP message handler |
| `/health` | GET | Health check |
| `/` | GET | Server info |

## Usage with Claude.ai

1. Go to Claude.ai Settings > Integrations > MCP
2. Add a new MCP server
3. Enter URL: `https://your-domain.com/sse?apiKey=YOUR_API_KEY`

## Available Tools

| Tool | Description |
|------|-------------|
| `search_snippets` | Full-text search across snippets |
| `get_snippet` | Get snippet with all content blocks |
| `list_snippets` | List snippets with filtering |
| `create_snippet` | Create a new snippet |
| `update_snippet` | Update an existing snippet |
| `delete_snippet` | Delete a snippet |
| `list_collections` | List all collections |
| `list_tags` | List all available tags |

### Tool Examples

**Search snippets:**
```json
{
  "name": "search_snippets",
  "arguments": {
    "query": "react hooks",
    "limit": 10
  }
}
```

**Create snippet:**
```json
{
  "name": "create_snippet",
  "arguments": {
    "title": "My Code Snippet",
    "blocks": [
      {
        "type": "markdown",
        "content": "# Description\nThis is my snippet."
      },
      {
        "type": "code",
        "language": "javascript",
        "content": "console.log('Hello');"
      }
    ]
  }
}
```

## Available Resources

| URI | Description |
|-----|-------------|
| `snippetvault://snippets` | List of 20 recent snippets |
| `snippetvault://collections` | Collection tree hierarchy |
| `snippetvault://snippet/{id}` | Full content of a specific snippet |

## Getting Your API Key

1. Log into your SnippetVault instance
2. Go to Settings > API
3. Copy your API key (32+ characters)

## Development

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build
npm run build

# Start production server
npm start
```

## Architecture

```
┌─────────────┐     HTTPS      ┌────────────────┐     HTTP      ┌─────────────────┐
│  Claude.ai  │ ──────────────►│   Cloudflare   │ ────────────►│  MCP Server     │
│             │◄────── SSE ────│   (Tunnel)     │◄─────────────│  (port 3002)    │
└─────────────┘                └────────────────┘              └────────┬────────┘
                                                                        │
                                                                        │ HTTP
                                                                        ▼
                                                               ┌─────────────────┐
                                                               │  SnippetVault   │
                                                               │  (port 3000)    │
                                                               └─────────────────┘
```

## License

MIT
