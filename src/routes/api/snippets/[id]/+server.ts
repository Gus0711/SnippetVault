import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

// GET /api/snippets/[id] - Get a single snippet with all relations
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		return json({ error: 'Snippet not found' }, { status: 404 });
	}

	if (snippet.authorId !== locals.user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	// Get tags
	const snippetTagRelations = await db
		.select()
		.from(snippetTags)
		.where(eq(snippetTags.snippetId, snippet.id))
		.all();

	const tagIds = snippetTagRelations.map((st) => st.tagId);
	const snippetTagsList =
		tagIds.length > 0
			? await db
					.select()
					.from(tags)
					.where(eq(tags.userId, locals.user.id))
					.all()
					.then((allTags) => allTags.filter((t) => tagIds.includes(t.id)))
			: [];

	// Get collection if exists
	let collection = null;
	if (snippet.collectionId) {
		collection = await db
			.select()
			.from(collections)
			.where(eq(collections.id, snippet.collectionId))
			.get();
	}

	return json({
		data: {
			...snippet,
			blocks: blocks.sort((a, b) => a.order - b.order),
			tags: snippetTagsList,
			collection
		}
	});
};

// PUT /api/snippets/[id] - Update a snippet
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		return json({ error: 'Snippet not found' }, { status: 404 });
	}

	if (snippet.authorId !== locals.user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { title, collectionId, content, tagIds, status } = body;

		// Validate title if provided
		if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
			return json({ error: 'Title cannot be empty' }, { status: 400 });
		}

		// Verify collection if provided
		if (collectionId) {
			const collection = await db
				.select()
				.from(collections)
				.where(eq(collections.id, collectionId))
				.get();

			if (!collection) {
				return json({ error: 'Collection not found' }, { status: 404 });
			}

			if (collection.ownerId !== locals.user.id) {
				return json({ error: 'Collection does not belong to you' }, { status: 403 });
			}
		}

		const now = new Date();
		const updateData: Record<string, unknown> = {
			updatedAt: now
		};

		if (title !== undefined) {
			updateData.title = title.trim();
		}
		if (collectionId !== undefined) {
			updateData.collectionId = collectionId || null;
		}
		if (status !== undefined && ['draft', 'published'].includes(status)) {
			updateData.status = status;
			// Generate public ID when publishing
			if (status === 'published' && !snippet.publicId) {
				updateData.publicId = generatePublicId();
			}
		}

		await db.update(snippets).set(updateData).where(eq(snippets.id, params.id));

		// Update content (simple approach: replace first block or create one)
		if (content !== undefined) {
			const existingBlocks = await db
				.select()
				.from(snippetBlocks)
				.where(eq(snippetBlocks.snippetId, params.id))
				.all();

			if (existingBlocks.length > 0) {
				// Update first block
				await db
					.update(snippetBlocks)
					.set({ content: content.trim() })
					.where(eq(snippetBlocks.id, existingBlocks[0].id));
			} else if (content.trim().length > 0) {
				// Create new block
				await db.insert(snippetBlocks).values({
					id: crypto.randomUUID(),
					snippetId: params.id,
					order: 0,
					type: 'code',
					content: content.trim(),
					language: 'plaintext'
				});
			}
		}

		// Update tags if provided
		if (tagIds !== undefined && Array.isArray(tagIds)) {
			// Remove all existing tags
			await db.delete(snippetTags).where(eq(snippetTags.snippetId, params.id));

			// Add new tags
			if (tagIds.length > 0) {
				const userTags = await db
					.select()
					.from(tags)
					.where(eq(tags.userId, locals.user.id))
					.all();

				const validTagIds = userTags.map((t) => t.id);
				const tagsToAdd = tagIds.filter((id: string) => validTagIds.includes(id));

				for (const tagId of tagsToAdd) {
					await db.insert(snippetTags).values({
						snippetId: params.id,
						tagId
					});
				}
			}
		}

		const updatedSnippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

		return json({ data: updatedSnippet });
	} catch (error) {
		console.error('Error updating snippet:', error);
		return json({ error: 'Failed to update snippet' }, { status: 500 });
	}
};

// DELETE /api/snippets/[id] - Delete a snippet
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		return json({ error: 'Snippet not found' }, { status: 404 });
	}

	if (snippet.authorId !== locals.user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	// Delete snippet (blocks and tags will cascade)
	await db.delete(snippets).where(eq(snippets.id, params.id));

	return json({ data: { success: true } });
};

// Helper to generate short public ID
function generatePublicId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
