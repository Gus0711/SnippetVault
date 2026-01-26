import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections, collectionMembers } from '$lib/server/db';
import { eq, or } from 'drizzle-orm';
import { getSnippetPermission, canWrite } from '$lib/server/services/permissions';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		error(404, 'Snippet not found');
	}

	// Check write permission
	const permission = await getSnippetPermission(params.id, locals.user.id);

	if (!canWrite(permission)) {
		error(403, 'Access denied');
	}

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	// Get snippet's tags
	const snippetTagRelations = await db
		.select()
		.from(snippetTags)
		.where(eq(snippetTags.snippetId, snippet.id))
		.all();

	const snippetTagIds = snippetTagRelations.map((st) => st.tagId);

	// Get snippet author's tags (for shared snippets, use author's tags, not editor's)
	const allUserTags = await db.select().from(tags).where(eq(tags.userId, snippet.authorId)).all();

	// Get all user's collections (owned)
	const ownedCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user.id))
		.all();

	// Get shared collections with write permission
	const sharedCollectionsResult = await db
		.select({
			id: collections.id,
			name: collections.name,
			icon: collections.icon,
			parentId: collections.parentId,
			ownerId: collections.ownerId,
			isShared: collections.isShared,
			description: collections.description,
			createdAt: collections.createdAt,
			updatedAt: collections.updatedAt,
			permission: collectionMembers.permission
		})
		.from(collectionMembers)
		.innerJoin(collections, eq(collectionMembers.collectionId, collections.id))
		.where(eq(collectionMembers.userId, locals.user.id))
		.all();

	// Filter to only collections with write permission
	const sharedWithWrite = sharedCollectionsResult.filter((c) => c.permission === 'write');

	const userCollections = [...ownedCollections, ...sharedWithWrite];

	// Get collection if exists
	let collection = null;
	if (snippet.collectionId) {
		collection = await db
			.select()
			.from(collections)
			.where(eq(collections.id, snippet.collectionId))
			.get();
	}

	return {
		snippet: {
			...snippet,
			blocks: blocks.sort((a, b) => a.order - b.order),
			tagIds: snippetTagIds,
			collection
		},
		collections: userCollections,
		tags: allUserTags
	};
};
