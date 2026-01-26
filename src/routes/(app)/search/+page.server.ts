import type { PageServerLoad } from './$types';
import { db, collections, tags } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Get user's collections for filter
	const userCollections = await db
		.select({ id: collections.id, name: collections.name, icon: collections.icon })
		.from(collections)
		.where(eq(collections.ownerId, locals.user!.id))
		.all();

	// Get user's tags for filter
	const userTags = await db
		.select({ id: tags.id, name: tags.name, color: tags.color })
		.from(tags)
		.where(eq(tags.userId, locals.user!.id))
		.all();

	return {
		collections: userCollections,
		tags: userTags
	};
};
