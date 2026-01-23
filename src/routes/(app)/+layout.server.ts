import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	// Load user's collections
	const userCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user.id))
		.all();

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name,
			role: locals.user.role,
			themePreference: locals.user.themePreference
		},
		collections: userCollections
	};
};
