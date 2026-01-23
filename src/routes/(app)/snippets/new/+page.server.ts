import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db, tags, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	// Load user's collections and tags
	const userCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user.id))
		.all();

	const userTags = await db.select().from(tags).where(eq(tags.userId, locals.user.id)).all();

	return {
		collections: userCollections,
		tags: userTags
	};
};
