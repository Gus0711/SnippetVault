import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { SnippetVaultClient } from '../client/api.js';
import type { Snippet, SnippetDetail, Collection, Tag } from '../types.js';

// Zod schemas for tool inputs
const searchSnippetsSchema = z.object({
  query: z.string().min(2).describe('Search query (minimum 2 characters)'),
  collection: z.string().optional().describe('Filter by collection ID'),
  tag: z.string().optional().describe('Filter by tag name'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by status'),
  limit: z.number().min(1).max(100).default(20).describe('Maximum results (1-100)')
});

const getSnippetSchema = z.object({
  id: z.string().describe('Snippet ID')
});

const listSnippetsSchema = z.object({
  collection: z.string().optional().describe('Filter by collection ID'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by status'),
  limit: z.number().min(1).max(100).default(20).describe('Maximum results (1-100)'),
  offset: z.number().min(0).default(0).describe('Pagination offset')
});

const blockSchema = z.object({
  type: z.enum(['markdown', 'code', 'image', 'file']).describe('Block type'),
  content: z.string().optional().describe('Block content (for markdown/code)'),
  language: z.string().optional().describe('Programming language (for code blocks)')
});

const createSnippetSchema = z.object({
  title: z.string().min(1).describe('Snippet title'),
  collectionId: z.string().optional().describe('Collection ID to add snippet to'),
  blocks: z.array(blockSchema).default([]).describe('Content blocks'),
  tagIds: z.array(z.string()).default([]).describe('Tag IDs to apply')
});

const updateSnippetSchema = z.object({
  id: z.string().describe('Snippet ID to update'),
  title: z.string().min(1).optional().describe('New title'),
  collectionId: z.string().nullable().optional().describe('Move to collection (null to remove)'),
  blocks: z.array(blockSchema).optional().describe('Replace all blocks'),
  tagIds: z.array(z.string()).optional().describe('Replace all tags'),
  status: z.enum(['draft', 'published']).optional().describe('Change status')
});

const deleteSnippetSchema = z.object({
  id: z.string().describe('Snippet ID to delete')
});

// Tool definitions for ListToolsRequest
const TOOLS = [
  {
    name: 'search_snippets',
    description: 'Search code snippets by text query. Searches titles, content, and tags.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query (minimum 2 characters)' },
        collection: { type: 'string', description: 'Filter by collection ID' },
        tag: { type: 'string', description: 'Filter by tag name' },
        status: { type: 'string', enum: ['draft', 'published'], description: 'Filter by status' },
        limit: { type: 'number', description: 'Maximum results (1-100)', default: 20 }
      },
      required: ['query']
    }
  },
  {
    name: 'get_snippet',
    description: 'Get a snippet by ID with all its content blocks and tags.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Snippet ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'list_snippets',
    description: 'List snippets with optional filtering by collection or status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection: { type: 'string', description: 'Filter by collection ID' },
        status: { type: 'string', enum: ['draft', 'published'], description: 'Filter by status' },
        limit: { type: 'number', description: 'Maximum results (1-100)', default: 20 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 }
      }
    }
  },
  {
    name: 'create_snippet',
    description: 'Create a new code snippet with optional blocks and tags.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Snippet title' },
        collectionId: { type: 'string', description: 'Collection ID' },
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['markdown', 'code', 'image', 'file'] },
              content: { type: 'string', description: 'Block content' },
              language: { type: 'string', description: 'Language for code blocks' }
            },
            required: ['type']
          },
          description: 'Content blocks'
        },
        tagIds: { type: 'array', items: { type: 'string' }, description: 'Tag IDs' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_snippet',
    description: 'Update an existing snippet. Only provided fields are updated.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Snippet ID to update' },
        title: { type: 'string', description: 'New title' },
        collectionId: { type: ['string', 'null'], description: 'Move to collection' },
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['markdown', 'code', 'image', 'file'] },
              content: { type: 'string' },
              language: { type: 'string' }
            },
            required: ['type']
          },
          description: 'Replace all blocks'
        },
        tagIds: { type: 'array', items: { type: 'string' }, description: 'Replace all tags' },
        status: { type: 'string', enum: ['draft', 'published'], description: 'Change status' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_snippet',
    description: 'Permanently delete a snippet.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Snippet ID to delete' }
      },
      required: ['id']
    }
  },
  {
    name: 'list_collections',
    description: 'List all collections with their hierarchy paths.',
    inputSchema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'list_tags',
    description: 'List all available tags.',
    inputSchema: { type: 'object' as const, properties: {} }
  }
];

export function registerTools(server: Server, client: SnippetVaultClient) {
  // Handle ListToolsRequest
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle CallToolRequest
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'search_snippets': {
          const input = searchSnippetsSchema.parse(args);
          const result = await client.search({
            query: input.query,
            collection: input.collection,
            tag: input.tag,
            status: input.status,
            limit: input.limit
          });
          return {
            content: [{
              type: 'text' as const,
              text: formatSearchResults(result)
            }]
          };
        }

        case 'get_snippet': {
          const input = getSnippetSchema.parse(args);
          const snippet = await client.getSnippet(input.id);
          return {
            content: [{
              type: 'text' as const,
              text: formatSnippetDetail(snippet)
            }]
          };
        }

        case 'list_snippets': {
          const input = listSnippetsSchema.parse(args);
          const result = await client.listSnippets(input);
          return {
            content: [{
              type: 'text' as const,
              text: formatSnippetList(result)
            }]
          };
        }

        case 'create_snippet': {
          const input = createSnippetSchema.parse(args);
          const snippet = await client.createSnippet(input);
          return {
            content: [{
              type: 'text' as const,
              text: `Created snippet "${snippet.title}" with ID: ${snippet.id}`
            }]
          };
        }

        case 'update_snippet': {
          const { id, ...updates } = updateSnippetSchema.parse(args);
          const snippet = await client.updateSnippet(id, updates);
          return {
            content: [{
              type: 'text' as const,
              text: `Updated snippet "${snippet.title}" (ID: ${snippet.id})`
            }]
          };
        }

        case 'delete_snippet': {
          const input = deleteSnippetSchema.parse(args);
          await client.deleteSnippet(input.id);
          return {
            content: [{
              type: 'text' as const,
              text: `Deleted snippet with ID: ${input.id}`
            }]
          };
        }

        case 'list_collections': {
          const result = await client.listCollections();
          return {
            content: [{
              type: 'text' as const,
              text: formatCollections(result.collections)
            }]
          };
        }

        case 'list_tags': {
          const result = await client.listTags();
          return {
            content: [{
              type: 'text' as const,
              text: formatTags(result.tags)
            }]
          };
        }

        default:
          return {
            isError: true,
            content: [{
              type: 'text' as const,
              text: `Unknown tool: ${name}`
            }]
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        isError: true,
        content: [{
          type: 'text' as const,
          text: `Error: ${message}`
        }]
      };
    }
  });
}

// Formatting helpers
function formatSearchResults(result: { query: string; total: number; results: Snippet[] }): string {
  const lines = [
    `Search results for "${result.query}" (${result.total} found):`,
    ''
  ];

  for (const snippet of result.results) {
    const tags = snippet.tags.map((t) => t.name).join(', ');
    lines.push(`- [${snippet.id}] ${snippet.title}`);
    lines.push(`  Status: ${snippet.status}${tags ? ` | Tags: ${tags}` : ''}`);
  }

  if (result.results.length === 0) {
    lines.push('No snippets found.');
  }

  return lines.join('\n');
}

function formatSnippetDetail(snippet: SnippetDetail): string {
  const lines = [
    `# ${snippet.title}`,
    '',
    `ID: ${snippet.id}`,
    `Status: ${snippet.status}`,
    `Collection: ${snippet.collection?.name || 'None'}`,
    `Tags: ${snippet.tags.map((t) => t.name).join(', ') || 'None'}`,
    `Created: ${snippet.createdAt}`,
    `Updated: ${snippet.updatedAt}`,
    ''
  ];

  if (snippet.publicId) {
    lines.push(`Public ID: ${snippet.publicId}`);
    lines.push('');
  }

  lines.push('## Content');
  lines.push('');

  for (const block of snippet.blocks) {
    if (block.type === 'markdown') {
      lines.push(block.content || '');
    } else if (block.type === 'code') {
      lines.push('```' + (block.language || ''));
      lines.push(block.content || '');
      lines.push('```');
    } else if (block.type === 'image') {
      lines.push(`[Image: ${block.fileName || 'unnamed'}]`);
    } else if (block.type === 'file') {
      lines.push(`[File: ${block.fileName || 'unnamed'}]`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatSnippetList(result: { snippets: Snippet[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }): string {
  const { snippets, pagination } = result;
  const lines = [
    `Snippets (${pagination.offset + 1}-${pagination.offset + snippets.length} of ${pagination.total}):`,
    ''
  ];

  for (const snippet of snippets) {
    const tags = snippet.tags.map((t) => t.name).join(', ');
    lines.push(`- [${snippet.id}] ${snippet.title}`);
    lines.push(`  Status: ${snippet.status}${tags ? ` | Tags: ${tags}` : ''}`);
  }

  if (snippets.length === 0) {
    lines.push('No snippets found.');
  }

  if (pagination.hasMore) {
    lines.push('');
    lines.push(`(More results available, use offset: ${pagination.offset + pagination.limit})`);
  }

  return lines.join('\n');
}

function formatCollections(collections: Collection[]): string {
  const lines = ['Collections:', ''];

  for (const c of collections) {
    lines.push(`- [${c.id}] ${c.path}${c.icon ? ` ${c.icon}` : ''}`);
    if (c.description) {
      lines.push(`  ${c.description}`);
    }
  }

  if (collections.length === 0) {
    lines.push('No collections found.');
  }

  return lines.join('\n');
}

function formatTags(tags: Tag[]): string {
  const lines = ['Tags:', ''];

  for (const t of tags) {
    lines.push(`- [${t.id}] ${t.name}${t.color ? ` (${t.color})` : ''}`);
  }

  if (tags.length === 0) {
    lines.push('No tags found.');
  }

  return lines.join('\n');
}
