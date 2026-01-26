import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import {
	authenticateApiKey,
	unauthorized,
	badRequest,
	notFound,
	serverError,
	success
} from '$lib/server/api/auth';

// GET /api/v1/snippets - List snippets with pagination
export const GET: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	const url = event.url;
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
	const collectionId = url.searchParams.get('collection');
	const status = url.searchParams.get('status') as 'draft' | 'published' | null;

	try {
		// Get total count
		const allSnippets = await db
			.select()
			.from(snippets)
			.where(eq(snippets.authorId, user.id))
			.all();

		let filtered = allSnippets;
		if (collectionId) {
			filtered = filtered.filter((s) => s.collectionId === collectionId);
		}
		if (status && ['draft', 'published'].includes(status)) {
			filtered = filtered.filter((s) => s.status === status);
		}

		const total = filtered.length;

		// Sort and paginate
		filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
		const paginated = filtered.slice(offset, offset + limit);

		// Get tags for each snippet
		const allTags = await db.select().from(tags).where(eq(tags.userId, user.id)).all();
		const allSnippetTags = await db.select().from(snippetTags).all();
		const tagsMap = new Map(allTags.map((t) => [t.id, t]));

		const snippetsWithTags = paginated.map((snippet) => {
			const snippetTagIds = allSnippetTags
				.filter((st) => st.snippetId === snippet.id)
				.map((st) => st.tagId);
			const snippetTagsList = snippetTagIds
				.map((id) => tagsMap.get(id))
				.filter(Boolean)
				.map((t) => ({ id: t!.id, name: t!.name, color: t!.color }));

			return {
				id: snippet.id,
				title: snippet.title,
				collectionId: snippet.collectionId,
				status: snippet.status,
				publicId: snippet.publicId,
				createdAt: snippet.createdAt,
				updatedAt: snippet.updatedAt,
				tags: snippetTagsList
			};
		});

		return success({
			snippets: snippetsWithTags,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + limit < total
			}
		});
	} catch (error) {
		console.error('API v1 GET /snippets error:', error);
		return serverError('Failed to fetch snippets');
	}
};

// POST /api/v1/snippets - Create a new snippet
export const POST: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	try {
		const body = await event.request.json();
		const { title, collectionId, blocks, tagIds } = body;

		// Validate title
		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return badRequest('Title is required');
		}

		// Verify collection belongs to user if provided
		if (collectionId) {
			const collection = await db
				.select()
				.from(collections)
				.where(eq(collections.id, collectionId))
				.get();

			if (!collection) {
				return notFound('Collection not found');
			}
			if (collection.ownerId !== user.id) {
				return badRequest('Collection does not belong to you');
			}
		}

		const snippetId = crypto.randomUUID();
		const now = new Date();

		// Create snippet
		await db.insert(snippets).values({
			id: snippetId,
			title: title.trim(),
			collectionId: collectionId || null,
			authorId: user.id,
			status: 'draft',
			createdAt: now,
			updatedAt: now
		});

		// Create blocks
		if (blocks && Array.isArray(blocks) && blocks.length > 0) {
			for (let i = 0; i < blocks.length; i++) {
				const block = blocks[i];
				if (!block.type || !['markdown', 'code', 'image', 'file'].includes(block.type)) {
					continue;
				}
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

		// Add tags
		if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
			const userTags = await db.select().from(tags).where(eq(tags.userId, user.id)).all();
			const validTagIds = userTags.map((t) => t.id);

			for (const tagId of tagIds) {
				if (validTagIds.includes(tagId)) {
					await db.insert(snippetTags).values({ snippetId, tagId });
				}
			}
		}

		// Fetch created snippet with blocks
		const newSnippet = await db.select().from(snippets).where(eq(snippets.id, snippetId)).get();
		const newBlocks = await db
			.select()
			.from(snippetBlocks)
			.where(eq(snippetBlocks.snippetId, snippetId))
			.orderBy(snippetBlocks.order)
			.all();

		return success(
			{
				...newSnippet,
				blocks: newBlocks
			},
			201
		);
	} catch (error) {
		console.error('API v1 POST /snippets error:', error);
		return serverError('Failed to create snippet');
	}
};
