import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import archiver from 'archiver';
import { createReadStream, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { PassThrough } from 'stream';

const UPLOAD_DIR = env.UPLOAD_DIR || './data/uploads';

// GET /api/export - Download backup ZIP
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const userId = locals.user.id;

	try {
		// Fetch all user data
		const userCollections = await db
			.select()
			.from(collections)
			.where(eq(collections.ownerId, userId))
			.all();

		const userSnippets = await db
			.select()
			.from(snippets)
			.where(eq(snippets.authorId, userId))
			.all();

		const snippetIds = userSnippets.map((s) => s.id);

		// Get all blocks for user's snippets
		const allBlocks = await db.select().from(snippetBlocks).all();
		const userBlocks = allBlocks.filter((b) => snippetIds.includes(b.snippetId));

		// Get all tags
		const userTags = await db.select().from(tags).where(eq(tags.userId, userId)).all();

		// Get snippet-tag relations
		const allSnippetTags = await db.select().from(snippetTags).all();
		const userSnippetTags = allSnippetTags.filter((st) => snippetIds.includes(st.snippetId));

		// Build tags map
		const tagsMap = new Map(userTags.map((t) => [t.id, t]));

		// Build blocks by snippet
		const blocksBySnippet = new Map<string, typeof userBlocks>();
		for (const block of userBlocks) {
			const existing = blocksBySnippet.get(block.snippetId) || [];
			existing.push(block);
			blocksBySnippet.set(block.snippetId, existing);
		}

		// Build snippet tags
		const tagsBySnippet = new Map<string, typeof userTags>();
		for (const st of userSnippetTags) {
			const tag = tagsMap.get(st.tagId);
			if (tag) {
				const existing = tagsBySnippet.get(st.snippetId) || [];
				existing.push(tag);
				tagsBySnippet.set(st.snippetId, existing);
			}
		}

		// Build collections map for path
		const collectionsMap = new Map(userCollections.map((c) => [c.id, c]));

		// Format collections with path
		const collectionsExport = userCollections.map((c) => {
			const buildPath = (collectionId: string): string => {
				const parts: string[] = [];
				let current = collectionsMap.get(collectionId);
				while (current) {
					parts.unshift(current.name);
					current = current.parentId ? collectionsMap.get(current.parentId) : undefined;
				}
				return parts.join(' / ');
			};

			return {
				id: c.id,
				name: c.name,
				description: c.description,
				icon: c.icon,
				parentId: c.parentId,
				path: buildPath(c.id),
				isShared: c.isShared,
				createdAt: c.createdAt,
				updatedAt: c.updatedAt
			};
		});

		// Format snippets with blocks and tags
		const snippetsExport = userSnippets.map((s) => {
			const blocks = (blocksBySnippet.get(s.id) || [])
				.sort((a, b) => a.order - b.order)
				.map((b) => ({
					id: b.id,
					order: b.order,
					type: b.type,
					content: b.content,
					language: b.language,
					filePath: b.filePath,
					fileName: b.fileName,
					fileSize: b.fileSize
				}));

			const snippetTagsList = (tagsBySnippet.get(s.id) || []).map((t) => ({
				id: t.id,
				name: t.name,
				color: t.color
			}));

			const collection = s.collectionId ? collectionsMap.get(s.collectionId) : null;

			return {
				id: s.id,
				title: s.title,
				collectionId: s.collectionId,
				collectionName: collection?.name || null,
				status: s.status,
				publicId: s.publicId,
				publicTheme: s.publicTheme,
				publicShowDescription: s.publicShowDescription,
				publicShowAttachments: s.publicShowAttachments,
				createdAt: s.createdAt,
				updatedAt: s.updatedAt,
				blocks,
				tags: snippetTagsList
			};
		});

		// Sort snippets by updatedAt desc
		snippetsExport.sort(
			(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
		);

		// Sort collections by path
		collectionsExport.sort((a, b) => a.path.localeCompare(b.path));

		// Tags export
		const tagsExport = userTags.map((t) => ({
			id: t.id,
			name: t.name,
			color: t.color,
			createdAt: t.createdAt
		}));
		tagsExport.sort((a, b) => a.name.localeCompare(b.name));

		// Create ZIP archive
		const archive = archiver('zip', { zlib: { level: 9 } });
		const passthrough = new PassThrough();

		archive.pipe(passthrough);

		// Add JSON files with pretty print
		archive.append(JSON.stringify(snippetsExport, null, 2), { name: 'snippets.json' });
		archive.append(JSON.stringify(collectionsExport, null, 2), { name: 'collections.json' });
		archive.append(JSON.stringify(tagsExport, null, 2), { name: 'tags.json' });

		// Add metadata
		const metadata = {
			exportedAt: new Date().toISOString(),
			userId: userId,
			userName: locals.user.name,
			userEmail: locals.user.email,
			counts: {
				snippets: snippetsExport.length,
				collections: collectionsExport.length,
				tags: tagsExport.length
			}
		};
		archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

		// Collect file paths from blocks
		const filePaths = new Set<string>();
		for (const block of userBlocks) {
			if (block.filePath && block.filePath.startsWith('/uploads/')) {
				filePaths.add(block.filePath.replace('/uploads/', ''));
			}
		}

		// Add uploaded files
		if (existsSync(UPLOAD_DIR)) {
			for (const relativePath of filePaths) {
				const fullPath = join(UPLOAD_DIR, relativePath);
				if (existsSync(fullPath) && statSync(fullPath).isFile()) {
					archive.file(fullPath, { name: `uploads/${relativePath}` });
				}
			}
		}

		// Finalize archive
		archive.finalize();

		// Convert stream to ReadableStream for Response
		const readable = new ReadableStream({
			start(controller) {
				passthrough.on('data', (chunk) => {
					controller.enqueue(chunk);
				});
				passthrough.on('end', () => {
					controller.close();
				});
				passthrough.on('error', (err) => {
					controller.error(err);
				});
			}
		});

		// Generate filename with date
		const date = new Date().toISOString().split('T')[0];
		const filename = `snippetvault-backup-${date}.zip`;

		return new Response(readable, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error) {
		console.error('Export error:', error);
		return new Response('Export failed', { status: 500 });
	}
};
