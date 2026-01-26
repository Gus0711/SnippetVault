import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, tags, collections, collectionMembers } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	// Load user's owned collections
	const ownedCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user.id))
		.all();

	// Load shared collections with write permission
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

	// Filter to only write permission
	const sharedWithWrite = sharedCollectionsResult
		.filter((c) => c.permission === 'write')
		.map(({ permission, ...rest }) => rest);

	const userCollections = [...ownedCollections, ...sharedWithWrite];

	const userTags = await db.select().from(tags).where(eq(tags.userId, locals.user.id)).all();

	return {
		collections: userCollections,
		tags: userTags
	};
};
