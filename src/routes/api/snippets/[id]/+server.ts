import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getSnippetPermission, getCollectionPermission, canRead, canWrite, isOwner } from '$lib/server/services/permissions';

// GET /api/snippets/[id] - Get a single snippet with all relations
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		return json({ error: 'Snippet not found' }, { status: 404 });
	}

	// Check read permission
	const permission = await getSnippetPermission(params.id, locals.user.id);
	if (!canRead(permission)) {
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
	let snippetTagsList: { id: string; name: string; color: string | null; userId: string }[] = [];
	if (tagIds.length > 0) {
		// Use snippet author's tags, not current user's (for shared snippets)
		const allTags = await db.select().from(tags).where(eq(tags.userId, snippet.authorId)).all();
		snippetTagsList = allTags.filter((t) => tagIds.includes(t.id));
	}

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

// Block type from editor
interface EditorBlock {
	type: 'markdown' | 'code' | 'image' | 'file';
	content: string;
	language?: string | null;
	filePath?: string | null;
	fileName?: string | null;
	fileSize?: number | null;
}

// PUT /api/snippets/[id] - Update a snippet
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snippetId = params.id;
	if (!snippetId) {
		return json({ error: 'Missing snippet ID' }, { status: 400 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, snippetId)).get();

	if (!snippet) {
		return json({ error: 'Snippet not found' }, { status: 404 });
	}

	// Check write permission
	const permission = await getSnippetPermission(snippetId, locals.user.id);
	if (!canWrite(permission)) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { title, collectionId, blocks, content, tagIds, status, publicTheme, publicShowDescription, publicShowAttachments } = body;

		// Validate title if provided
		if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
			return json({ error: 'Title cannot be empty' }, { status: 400 });
		}

		// Verify collection permission if changing collection
		if (collectionId !== undefined && collectionId !== snippet.collectionId) {
			if (collectionId) {
				const collectionPermission = await getCollectionPermission(collectionId, locals.user.id);
				if (!canWrite(collectionPermission)) {
					return json({ error: 'Access denied to target collection' }, { status: 403 });
				}
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
				updateData.publicId = nanoid(10);
			}
			// Remove public ID when unpublishing (breaks the link)
			if (status === 'draft') {
				updateData.publicId = null;
			}
		}

		// Publication options
		if (publicTheme !== undefined) {
			updateData.publicTheme = publicTheme;
		}
		if (publicShowDescription !== undefined) {
			updateData.publicShowDescription = publicShowDescription;
		}
		if (publicShowAttachments !== undefined) {
			updateData.publicShowAttachments = publicShowAttachments;
		}

		await db.update(snippets).set(updateData).where(eq(snippets.id, snippetId));

		// Update blocks (new format with array of blocks)
		if (blocks !== undefined && Array.isArray(blocks)) {
			// Delete all existing blocks
			await db.delete(snippetBlocks).where(eq(snippetBlocks.snippetId, snippetId));

			// Create new blocks
			for (let i = 0; i < blocks.length; i++) {
				const block = blocks[i] as EditorBlock;
				await db.insert(snippetBlocks).values({
					id: crypto.randomUUID(),
					snippetId: snippetId,
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
		else if (content !== undefined) {
			const existingBlocks = await db
				.select()
				.from(snippetBlocks)
				.where(eq(snippetBlocks.snippetId, snippetId))
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
					snippetId: snippetId,
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
			await db.delete(snippetTags).where(eq(snippetTags.snippetId, snippetId));

			// Add new tags
			if (tagIds.length > 0) {
				// Use snippet author's tags, not current user's (for shared snippets)
				const authorTags = await db
					.select()
					.from(tags)
					.where(eq(tags.userId, snippet.authorId))
					.all();

				const validTagIds = authorTags.map((t) => t.id);
				// Deduplicate and filter to valid author tags only
				const tagsToAdd = [...new Set(tagIds.filter((id: string) => validTagIds.includes(id)))];

				for (const tagId of tagsToAdd) {
					await db.insert(snippetTags).values({
						snippetId: snippetId,
						tagId
					});
				}
			}
		}

		const updatedSnippet = await db.select().from(snippets).where(eq(snippets.id, snippetId)).get();

		return json({ data: updatedSnippet });
	} catch (err) {
		console.error('Error updating snippet:', err);
		return json({ error: 'Failed to update snippet' }, { status: 500 });
	}
};

// PATCH /api/snippets/[id] - Partial update (move, add tag)
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		return json({ error: 'Snippet not found' }, { status: 404 });
	}

	// Check write permission
	const permission = await getSnippetPermission(params.id, locals.user.id);
	if (!canWrite(permission)) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { collectionId, addTagId } = body;

		const now = new Date();

		// Move to collection
		if (collectionId !== undefined) {
			// Verify collection permission if moving to a collection
			if (collectionId) {
				const collectionPermission = await getCollectionPermission(collectionId, locals.user.id);
				if (!canWrite(collectionPermission)) {
					return json({ error: 'Access denied to target collection' }, { status: 403 });
				}
			}
			await db
				.update(snippets)
				.set({ collectionId: collectionId || null, updatedAt: now })
				.where(eq(snippets.id, params.id));
		}

		// Add a tag (without removing existing ones)
		if (addTagId) {
			// Check if tag belongs to snippet author
			const tag = await db.select().from(tags).where(eq(tags.id, addTagId)).get();
			if (tag && tag.userId === snippet.authorId) {
				// Check if relation already exists
				const existing = await db
					.select()
					.from(snippetTags)
					.where(eq(snippetTags.snippetId, params.id))
					.all();

				if (!existing.some((st) => st.tagId === addTagId)) {
					await db.insert(snippetTags).values({
						snippetId: params.id,
						tagId: addTagId
					});
					await db.update(snippets).set({ updatedAt: now }).where(eq(snippets.id, params.id));
				}
			}
		}

		return json({ data: { success: true } });
	} catch (err) {
		console.error('Error patching snippet:', err);
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

	// Only author (owner) can delete
	const permission = await getSnippetPermission(params.id, locals.user.id);
	if (!isOwner(permission)) {
		return json({ error: 'Only the author can delete this snippet' }, { status: 403 });
	}

	// Delete snippet (blocks and tags will cascade)
	await db.delete(snippets).where(eq(snippets.id, params.id));

	return json({ data: { success: true } });
};
