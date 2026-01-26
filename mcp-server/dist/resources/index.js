import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
const RESOURCE_PREFIX = 'snippetvault://';
export function registerResources(server, client) {
    // List available resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: `${RESOURCE_PREFIX}snippets`,
                    name: 'Recent Snippets',
                    description: 'List of recent code snippets',
                    mimeType: 'text/plain'
                },
                {
                    uri: `${RESOURCE_PREFIX}collections`,
                    name: 'Collections',
                    description: 'Hierarchical collection tree',
                    mimeType: 'text/plain'
                }
            ]
        };
    });
    // Read resource content
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        if (!uri.startsWith(RESOURCE_PREFIX)) {
            throw new Error(`Unknown resource URI scheme: ${uri}`);
        }
        const resourcePath = uri.slice(RESOURCE_PREFIX.length);
        // Handle snippetvault://snippets
        if (resourcePath === 'snippets') {
            const result = await client.listSnippets({ limit: 20 });
            const text = formatSnippetsResource(result.snippets);
            return {
                contents: [{
                        uri,
                        mimeType: 'text/plain',
                        text
                    }]
            };
        }
        // Handle snippetvault://collections
        if (resourcePath === 'collections') {
            const result = await client.listCollections();
            const text = formatCollectionsResource(result.collections);
            return {
                contents: [{
                        uri,
                        mimeType: 'text/plain',
                        text
                    }]
            };
        }
        // Handle snippetvault://snippet/{id}
        if (resourcePath.startsWith('snippet/')) {
            const snippetId = resourcePath.slice('snippet/'.length);
            const snippet = await client.getSnippet(snippetId);
            const text = formatSnippetResource(snippet);
            return {
                contents: [{
                        uri,
                        mimeType: 'text/markdown',
                        text
                    }]
            };
        }
        throw new Error(`Unknown resource: ${uri}`);
    });
}
function formatSnippetsResource(snippets) {
    const lines = ['# Recent Snippets', ''];
    for (const s of snippets) {
        lines.push(`## ${s.title}`);
        lines.push(`- ID: ${s.id}`);
        lines.push(`- Status: ${s.status}`);
        lines.push(`- Tags: ${s.tags.map((t) => t.name).join(', ') || 'None'}`);
        lines.push(`- Updated: ${s.updatedAt}`);
        lines.push('');
    }
    if (snippets.length === 0) {
        lines.push('No snippets found.');
    }
    return lines.join('\n');
}
function formatCollectionsResource(collections) {
    const lines = ['# Collections', ''];
    for (const c of collections) {
        const indent = (c.path.match(/\//g) || []).length;
        const prefix = '  '.repeat(indent);
        lines.push(`${prefix}- ${c.name} [${c.id}]`);
        if (c.description) {
            lines.push(`${prefix}  ${c.description}`);
        }
    }
    if (collections.length === 0) {
        lines.push('No collections found.');
    }
    return lines.join('\n');
}
function formatSnippetResource(snippet) {
    const lines = [
        `# ${snippet.title}`,
        '',
        '## Metadata',
        `- ID: ${snippet.id}`,
        `- Status: ${snippet.status}`,
        `- Collection: ${snippet.collection?.name || 'None'}`,
        `- Tags: ${snippet.tags.map((t) => t.name).join(', ') || 'None'}`,
        `- Created: ${snippet.createdAt}`,
        `- Updated: ${snippet.updatedAt}`,
        ''
    ];
    if (snippet.publicId) {
        lines.push(`- Public ID: ${snippet.publicId}`);
        lines.push('');
    }
    lines.push('## Content');
    lines.push('');
    for (const block of snippet.blocks) {
        if (block.type === 'markdown') {
            lines.push(block.content || '');
        }
        else if (block.type === 'code') {
            lines.push('```' + (block.language || ''));
            lines.push(block.content || '');
            lines.push('```');
        }
        else if (block.type === 'image') {
            lines.push(`![${block.fileName || 'Image'}](${block.filePath})`);
        }
        else if (block.type === 'file') {
            lines.push(`[${block.fileName || 'File'}](${block.filePath})`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=index.js.map