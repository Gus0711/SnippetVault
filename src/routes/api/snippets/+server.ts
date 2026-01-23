import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq, desc, and } from 'drizzle-orm';

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

// POST /api/snippets - Create a new snippet
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { title, collectionId, content, tagIds } = body;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		// Verify collection exists and belongs to user if provided
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

		// Create initial block with content (if provided)
		if (content && content.trim().length > 0) {
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
