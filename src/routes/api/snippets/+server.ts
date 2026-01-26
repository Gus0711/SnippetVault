import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import { getCollectionPermission, canWrite } from '$lib/server/services/permissions';

// GET /api/snippets - List all snippets for the user
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const collectionId = url.searchParams.get('collection');
	const status = url.searchParams.get('status') as 'draft' | 'published' | null;
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

	let query = db
		.select()
		.from(snippets)
		.where(eq(snippets.authorId, locals.user.id))
		.orderBy(desc(snippets.updatedAt))
		.limit(limit);

	const userSnippets = await query.all();

	// Filter in JS for now (simpler than building dynamic query)
	let filteredSnippets = userSnippets;
	if (collectionId) {
		filteredSnippets = filteredSnippets.filter((s) => s.collectionId === collectionId);
	}
	if (status) {
		filteredSnippets = filteredSnippets.filter((s) => s.status === status);
	}

	return json({ data: filteredSnippets });
};

// Block type from editor
interface EditorBlock {
	type: 'markdown' | 'code' | 'image' | 'file';
	content: string;
	language?: string | null;
	filePath?: string | null;
	fileName?: string | null;
	fileSize?: number | null;
}

// POST /api/snippets - Create a new snippet
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { title, collectionId, blocks, tagIds, content } = body;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		// Verify collection exists and user has write permission
		if (collectionId) {
			const collection = await db
				.select()
				.from(collections)
				.where(eq(collections.id, collectionId))
				.get();

			if (!collection) {
				return json({ error: 'Collection not found' }, { status: 404 });
			}

			// Check permission (owner or write member)
			const permission = await getCollectionPermission(collectionId, locals.user.id);
			if (!canWrite(permission)) {
				return json({ error: 'Access denied to this collection' }, { status: 403 });
			}
		}

		const snippetId = crypto.randomUUID();
		const now = new Date();

		// Create snippet
		await db.insert(snippets).values({
			id: snippetId,
			title: title.trim(),
			collectionId: collectionId || null,
			authorId: locals.user.id,
			status: 'draft',
			createdAt: now,
			updatedAt: now
		});

		// Create blocks (new format with array of blocks)
		if (blocks && Array.isArray(blocks) && blocks.length > 0) {
			for (let i = 0; i < blocks.length; i++) {
				const block = blocks[i] as EditorBlock;
				await db.insert(snippetBlocks).values({
					id: crypto.randomUUID(),
					snippetId,
					order: i,
					type: block.type,
					content: block.content || null,
					language: block.language || null,
					filePath: block.filePath || null,
					fileName: block.fileName || null,
					fileSize: block.fileSize || null
				});
			}
		}
		// Legacy: support old content format (single code block)
		else if (content && typeof content === 'string' && content.trim().length > 0) {
			await db.insert(snippetBlocks).values({
				id: crypto.randomUUID(),
				snippetId,
				order: 0,
				type: 'code',
				content: content.trim(),
				language: 'plaintext'
			});
		}

		// Add tags if provided
		if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
			// Verify tags belong to user
			const userTags = await db
				.select()
				.from(tags)
				.where(eq(tags.userId, locals.user.id))
				.all();

			const validTagIds = userTags.map((t) => t.id);
			const tagsToAdd = tagIds.filter((id: string) => validTagIds.includes(id));

			for (const tagId of tagsToAdd) {
				await db.insert(snippetTags).values({
					snippetId,
					tagId
				});
			}
		}

		const newSnippet = await db.select().from(snippets).where(eq(snippets.id, snippetId)).get();

		return json({ data: newSnippet }, { status: 201 });
	} catch (error) {
		console.error('Error creating snippet:', error);
		return json({ error: 'Failed to create snippet' }, { status: 500 });
	}
};
