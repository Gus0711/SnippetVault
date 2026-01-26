import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import {
	authenticateApiKey,
	unauthorized,
	badRequest,
	notFound,
	forbidden,
	serverError,
	success
} from '$lib/server/api/auth';

// GET /api/v1/snippets/:id - Get snippet details with blocks
export const GET: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	const { id } = event.params;

	try {
		const snippet = await db
			.select()
			.from(snippets)
			.where(and(eq(snippets.id, id), eq(snippets.authorId, user.id)))
			.get();

		if (!snippet) {
			return notFound('Snippet not found');
		}

		// Get blocks
		const blocks = await db
			.select()
			.from(snippetBlocks)
			.where(eq(snippetBlocks.snippetId, id))
			.orderBy(snippetBlocks.order)
			.all();

		// Get tags
		const snippetTagRelations = await db
			.select()
			.from(snippetTags)
			.where(eq(snippetTags.snippetId, id))
			.all();

		const allTags = await db.select().from(tags).where(eq(tags.userId, user.id)).all();
		const tagsMap = new Map(allTags.map((t) => [t.id, t]));

		const snippetTagsList = snippetTagRelations
			.map((st) => tagsMap.get(st.tagId))
			.filter(Boolean)
			.map((t) => ({ id: t!.id, name: t!.name, color: t!.color }));

		// Get collection info if exists
		let collection = null;
		if (snippet.collectionId) {
			collection = await db
				.select({ id: collections.id, name: collections.name, icon: collections.icon })
				.from(collections)
				.where(eq(collections.id, snippet.collectionId))
				.get();
		}

		return success({
			id: snippet.id,
			title: snippet.title,
			collectionId: snippet.collectionId,
			collection,
			status: snippet.status,
			publicId: snippet.publicId,
			publicTheme: snippet.publicTheme,
			publicShowDescription: snippet.publicShowDescription,
			publicShowAttachments: snippet.publicShowAttachments,
			createdAt: snippet.createdAt,
			updatedAt: snippet.updatedAt,
			blocks,
			tags: snippetTagsList
		});
	} catch (error) {
		console.error('API v1 GET /snippets/:id error:', error);
		return serverError('Failed to fetch snippet');
	}
};

// PUT /api/v1/snippets/:id - Update snippet
export const PUT: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	const { id } = event.params;

	try {
		// Check snippet exists and belongs to user
		const snippet = await db
			.select()
			.from(snippets)
			.where(and(eq(snippets.id, id), eq(snippets.authorId, user.id)))
			.get();

		if (!snippet) {
			return notFound('Snippet not found');
		}

		const body = await event.request.json();
		const { title, collectionId, blocks, tagIds, status } = body;

		// Build update object
		const updates: Record<string, unknown> = {
			updatedAt: new Date()
		};

		if (title !== undefined) {
			if (typeof title !== 'string' || title.trim().length === 0) {
				return badRequest('Title cannot be empty');
			}
			updates.title = title.trim();
		}

		if (collectionId !== undefined) {
			if (collectionId === null) {
				updates.collectionId = null;
			} else {
				const collection = await db
					.select()
					.from(collections)
					.where(eq(collections.id, collectionId))
					.get();
				if (!collection) {
					return notFound('Collection not found');
				}
				if (collection.ownerId !== user.id) {
					return forbidden('Collection does not belong to you');
				}
				updates.collectionId = collectionId;
			}
		}

		if (status !== undefined) {
			if (!['draft', 'published'].includes(status)) {
				return badRequest('Invalid status');
			}
			updates.status = status;

			// Generate publicId when publishing
			if (status === 'published' && !snippet.publicId) {
				updates.publicId = crypto.randomUUID().slice(0, 8);
			}
		}

		// Update snippet
		await db.update(snippets).set(updates).where(eq(snippets.id, id));

		// Update blocks if provided
		if (blocks !== undefined && Array.isArray(blocks)) {
			// Delete existing blocks
			await db.delete(snippetBlocks).where(eq(snippetBlocks.snippetId, id));

			// Insert new blocks
			for (let i = 0; i < blocks.length; i++) {
				const block = blocks[i];
				if (!block.type || !['markdown', 'code', 'image', 'file'].includes(block.type)) {
					continue;
				}
				await db.insert(snippetBlocks).values({
					id: crypto.randomUUID(),
					snippetId: id,
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

		// Update tags if provided
		if (tagIds !== undefined && Array.isArray(tagIds)) {
			// Delete existing tag relations
			await db.delete(snippetTags).where(eq(snippetTags.snippetId, id));

			// Add new tags
			const userTags = await db.select().from(tags).where(eq(tags.userId, user.id)).all();
			const validTagIds = userTags.map((t) => t.id);

			for (const tagId of tagIds) {
				if (validTagIds.includes(tagId)) {
					await db.insert(snippetTags).values({ snippetId: id, tagId });
				}
			}
		}

		// Fetch updated snippet
		const updatedSnippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();
		const updatedBlocks = await db
			.select()
			.from(snippetBlocks)
			.where(eq(snippetBlocks.snippetId, id))
			.orderBy(snippetBlocks.order)
			.all();

		return success({
			...updatedSnippet,
			blocks: updatedBlocks
		});
	} catch (error) {
		console.error('API v1 PUT /snippets/:id error:', error);
		return serverError('Failed to update snippet');
	}
};

// DELETE /api/v1/snippets/:id - Delete snippet
export const DELETE: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	const { id } = event.params;

	try {
		const snippet = await db
			.select()
			.from(snippets)
			.where(and(eq(snippets.id, id), eq(snippets.authorId, user.id)))
			.get();

		if (!snippet) {
			return notFound('Snippet not found');
		}

		// Delete snippet (cascade will handle blocks and tags)
		await db.delete(snippets).where(eq(snippets.id, id));

		return success({ deleted: true });
	} catch (error) {
		console.error('API v1 DELETE /snippets/:id error:', error);
		return serverError('Failed to delete snippet');
	}
};
