import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, tags, snippetTags, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { getSnippetPermission, canRead } from '$lib/server/services/permissions';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';

// GET /api/snippets/[id]/export?format=md|zip
export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const format = url.searchParams.get('format') || 'md';
	if (!['md', 'zip'].includes(format)) {
		error(400, 'Invalid format. Use "md" or "zip".');
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		error(404, 'Snippet not found');
	}

	// Check read permission
	const permission = await getSnippetPermission(params.id, locals.user.id);
	if (!canRead(permission)) {
		error(403, 'Access denied');
	}

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	const sortedBlocks = blocks.sort((a, b) => a.order - b.order);

	// Get tags
	const snippetTagRelations = await db
		.select()
		.from(snippetTags)
		.where(eq(snippetTags.snippetId, snippet.id))
		.all();

	const tagIds = snippetTagRelations.map((st) => st.tagId);
	let snippetTagsList: string[] = [];
	if (tagIds.length > 0) {
		const allTags = await db.select().from(tags).where(eq(tags.userId, snippet.authorId)).all();
		snippetTagsList = allTags.filter((t) => tagIds.includes(t.id)).map((t) => t.name);
	}

	// Get collection
	let collectionName: string | null = null;
	if (snippet.collectionId) {
		const collection = await db
			.select()
			.from(collections)
			.where(eq(collections.id, snippet.collectionId))
			.get();
		collectionName = collection?.name || null;
	}

	// Generate markdown content
	const generateMarkdown = (): string => {
		const lines: string[] = [];

		// Frontmatter
		lines.push('---');
		lines.push(`title: "${snippet.title}"`);
		if (collectionName) lines.push(`collection: "${collectionName}"`);
		if (snippetTagsList.length > 0) lines.push(`tags: [${snippetTagsList.map((t) => `"${t}"`).join(', ')}]`);
		lines.push(`status: ${snippet.status}`);
		lines.push(`created: ${snippet.createdAt.toISOString()}`);
		lines.push(`updated: ${snippet.updatedAt.toISOString()}`);
		if (snippet.publicId) lines.push(`publicId: ${snippet.publicId}`);
		lines.push('---');
		lines.push('');

		// Title
		lines.push(`# ${snippet.title}`);
		lines.push('');

		// Blocks
		for (const block of sortedBlocks) {
			if (block.type === 'markdown' && block.content) {
				lines.push(block.content);
				lines.push('');
			} else if (block.type === 'code' && block.content) {
				const lang = block.language || '';
				lines.push('```' + lang);
				lines.push(block.content);
				lines.push('```');
				lines.push('');
			} else if (block.type === 'image' && block.filePath) {
				const name = block.fileName || 'image';
				lines.push(`![${name}](${block.filePath})`);
				lines.push('');
			} else if (block.type === 'file' && block.filePath) {
				const name = block.fileName || 'file';
				lines.push(`[${name}](${block.filePath})`);
				lines.push('');
			}
		}

		return lines.join('\n');
	};

	const markdown = generateMarkdown();
	const safeTitle = snippet.title.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);

	if (format === 'md') {
		return new Response(markdown, {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Content-Disposition': `attachment; filename="${safeTitle}.md"`
			}
		});
	}

	// ZIP format
	if (format === 'zip') {
		const archive = archiver('zip', { zlib: { level: 9 } });
		const chunks: Buffer[] = [];

		return new Promise<Response>((resolve, reject) => {
			archive.on('data', (chunk) => chunks.push(chunk));
			archive.on('end', () => {
				const buffer = Buffer.concat(chunks);
				resolve(
					new Response(buffer, {
						headers: {
							'Content-Type': 'application/zip',
							'Content-Disposition': `attachment; filename="${safeTitle}.zip"`
						}
					})
				);
			});
			archive.on('error', reject);

			// Add markdown file
			archive.append(markdown, { name: `${safeTitle}.md` });

			// Add attached files
			const uploadDir = process.env.UPLOAD_DIR || './data/uploads';
			for (const block of sortedBlocks) {
				if ((block.type === 'image' || block.type === 'file') && block.filePath) {
					// Extract relative path from URL
					const relativePath = block.filePath.replace(/^\/uploads\//, '');
					const fullPath = path.join(uploadDir, relativePath);

					if (fs.existsSync(fullPath)) {
						const fileName = block.fileName || path.basename(fullPath);
						archive.file(fullPath, { name: `files/${fileName}` });
					}
				}
			}

			archive.finalize();
		});
	}

	error(400, 'Invalid format');
};
