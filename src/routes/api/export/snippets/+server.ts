import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, tags, snippetTags, collections } from '$lib/server/db';
import { eq, inArray } from 'drizzle-orm';
import { getSnippetPermission, canRead } from '$lib/server/services/permissions';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

// GET /api/export/snippets?ids=id1,id2,id3
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const idsParam = url.searchParams.get('ids');
	if (!idsParam) {
		error(400, 'Missing ids parameter');
	}

	const ids = idsParam.split(',').filter(Boolean);
	if (ids.length === 0) {
		error(400, 'No snippet IDs provided');
	}

	// Get all snippets
	const snippetsList = await db
		.select()
		.from(snippets)
		.where(inArray(snippets.id, ids))
		.all();

	if (snippetsList.length === 0) {
		error(404, 'No snippets found');
	}

	// Check permissions for all snippets
	for (const snippet of snippetsList) {
		const permission = await getSnippetPermission(snippet.id, locals.user.id);
		if (!canRead(permission)) {
			error(403, `Access denied for snippet: ${snippet.title}`);
		}
	}

	// Get all blocks
	const allBlocks = await db
		.select()
		.from(snippetBlocks)
		.where(inArray(snippetBlocks.snippetId, ids))
		.all();

	// Get all tags
	const allSnippetTags = await db
		.select()
		.from(snippetTags)
		.where(inArray(snippetTags.snippetId, ids))
		.all();

	const allTagIds = [...new Set(allSnippetTags.map((st) => st.tagId))];
	const allTagsList = allTagIds.length > 0
		? await db.select().from(tags).where(inArray(tags.id, allTagIds)).all()
		: [];
	const tagsMap = new Map(allTagsList.map((t) => [t.id, t]));

	// Get all collections
	const collectionIds = [...new Set(snippetsList.map((s) => s.collectionId).filter(Boolean))] as string[];
	const allCollections = collectionIds.length > 0
		? await db.select().from(collections).where(inArray(collections.id, collectionIds)).all()
		: [];
	const collectionsMap = new Map(allCollections.map((c) => [c.id, c]));

	// Generate markdown for a snippet
	const generateMarkdown = (snippet: typeof snippetsList[0]): string => {
		const snippetBlocks = allBlocks
			.filter((b) => b.snippetId === snippet.id)
			.sort((a, b) => a.order - b.order);

		const snippetTagIds = allSnippetTags
			.filter((st) => st.snippetId === snippet.id)
			.map((st) => st.tagId);
		const snippetTagNames = snippetTagIds
			.map((id) => tagsMap.get(id)?.name)
			.filter(Boolean);

		const collectionName = snippet.collectionId
			? collectionsMap.get(snippet.collectionId)?.name
			: null;

		const lines: string[] = [];

		// Frontmatter
		lines.push('---');
		lines.push(`title: "${snippet.title}"`);
		if (collectionName) lines.push(`collection: "${collectionName}"`);
		if (snippetTagNames.length > 0) lines.push(`tags: [${snippetTagNames.map((t) => `"${t}"`).join(', ')}]`);
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
		for (const block of snippetBlocks) {
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
				lines.push(`![${name}](files/${name})`);
				lines.push('');
			} else if (block.type === 'file' && block.filePath) {
				const name = block.fileName || 'file';
				lines.push(`[${name}](files/${name})`);
				lines.push('');
			}
		}

		return lines.join('\n');
	};

	// Create ZIP archive
	const archive = archiver('zip', { zlib: { level: 9 } });
	const chunks: Buffer[] = [];

	return new Promise<Response>((resolve, reject) => {
		archive.on('data', (chunk) => chunks.push(chunk));
		archive.on('end', () => {
			const buffer = Buffer.concat(chunks);
			const timestamp = new Date().toISOString().slice(0, 10);
			resolve(
				new Response(buffer, {
					headers: {
						'Content-Type': 'application/zip',
						'Content-Disposition': `attachment; filename="snippets-export-${timestamp}.zip"`
					}
				})
			);
		});
		archive.on('error', reject);

		// Add each snippet
		const uploadDir = process.env.UPLOAD_DIR || './data/uploads';
		const addedFiles = new Set<string>();

		for (const snippet of snippetsList) {
			const safeTitle = snippet.title.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
			const markdown = generateMarkdown(snippet);

			// Add markdown file in a folder per snippet
			archive.append(markdown, { name: `${safeTitle}/${safeTitle}.md` });

			// Add attached files
			const snippetBlocksList = allBlocks.filter((b) => b.snippetId === snippet.id);
			for (const block of snippetBlocksList) {
				if ((block.type === 'image' || block.type === 'file') && block.filePath) {
					const relativePath = block.filePath.replace(/^\/uploads\//, '');
					const fullPath = path.join(uploadDir, relativePath);
					const fileName = block.fileName || path.basename(fullPath);

					// Avoid duplicates
					const fileKey = `${safeTitle}/files/${fileName}`;
					if (!addedFiles.has(fileKey) && fs.existsSync(fullPath)) {
						archive.file(fullPath, { name: fileKey });
						addedFiles.add(fileKey);
					}
				}
			}
		}

		// Add index file
		const indexLines = [
			'# Snippets Export',
			'',
			`Exported: ${new Date().toISOString()}`,
			`Total: ${snippetsList.length} snippet(s)`,
			'',
			'## Contents',
			''
		];
		for (const snippet of snippetsList) {
			const safeTitle = snippet.title.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
			indexLines.push(`- [${snippet.title}](./${safeTitle}/${safeTitle}.md)`);
		}
		archive.append(indexLines.join('\n'), { name: 'INDEX.md' });

		archive.finalize();
	});
};
