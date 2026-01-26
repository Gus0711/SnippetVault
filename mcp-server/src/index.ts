#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { loadConfig } from './config.js';
import { SnippetVaultClient } from './client/api.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';

const PORT = parseInt(process.env.PORT || '3002', 10);

// Map to store SSE transports by session ID
const transports = new Map<string, SSEServerTransport>();

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

function extractApiKey(req: IncomingMessage, url: URL): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to query parameter
  return url.searchParams.get('apiKey');
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // Health check endpoint
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
    return;
  }

  // Root endpoint - info
  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'SnippetVault MCP Server',
      version: '1.0.0',
      endpoints: {
        sse: '/sse',
        messages: '/messages',
        health: '/health'
      },
      auth: 'Pass API key via Authorization: Bearer <key> header or ?apiKey=<key> query param'
    }));
    return;
  }

  // Extract API key for protected endpoints
  const apiKey = extractApiKey(req, url);

  // GET /sse - Establish SSE connection
  if (url.pathname === '/sse' && req.method === 'GET') {
    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API key required. Use Authorization: Bearer <key> header or ?apiKey=<key> query param' }));
      return;
    }

    try {
      const config = loadConfig(apiKey);
      const client = new SnippetVaultClient(config);

      // Create MCP server instance for this session
      const mcpServer = new Server(
        {
          name: 'snippetvault',
          version: '1.0.0'
        },
        {
          capabilities: {
            resources: {},
            tools: {}
          }
        }
      );

      // Register tools and resources
      registerTools(mcpServer, client);
      registerResources(mcpServer, client);

      // Create SSE transport
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      transports.set(sessionId, transport);

      console.log(`[SSE] New session: ${sessionId}`);

      // Clean up on connection close
      res.on('close', () => {
        console.log(`[SSE] Session closed: ${sessionId}`);
        transports.delete(sessionId);
      });

      // Connect server to transport
      await mcpServer.connect(transport);
    } catch (error) {
      console.error('[SSE] Error establishing connection:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to establish SSE connection' }));
      }
    }
    return;
  }

  // POST /messages - Receive MCP messages
  if (url.pathname === '/messages' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing sessionId query parameter' }));
      return;
    }

    const transport = transports.get(sessionId);

    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found. Establish SSE connection first.' }));
      return;
    }

    // Collect request body
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        await transport.handlePostMessage(req, res, body);
      } catch (error) {
        console.error('[Messages] Error handling message:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process message' }));
        }
      }
    });

    req.on('error', (error) => {
      console.error('[Messages] Request error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request error' }));
      }
    });

    return;
  }

  // 404 for all other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Create and start HTTP server
const httpServer = createServer(handleRequest);

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║         SnippetVault MCP Server                ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(39)}║
║  SSE:  http://localhost:${PORT}/sse${' '.repeat(20 - PORT.toString().length)}║
║  Health: http://localhost:${PORT}/health${' '.repeat(14 - PORT.toString().length)}║
╚════════════════════════════════════════════════╝
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
