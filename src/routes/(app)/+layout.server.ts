import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db, collections, collectionMembers, users, snippets } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

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

	// Load shared collections (where user is a member)
	const sharedCollectionsResult = await db
		.select({
			id: collections.id,
			name: collections.name,
			icon: collections.icon,
			permission: collectionMembers.permission,
			ownerName: users.name
		})
		.from(collectionMembers)
		.innerJoin(collections, eq(collectionMembers.collectionId, collections.id))
		.innerJoin(users, eq(collections.ownerId, users.id))
		.where(eq(collectionMembers.userId, locals.user.id))
		.all();

	const sharedCollections = sharedCollectionsResult.map((sc) => ({
		id: sc.id,
		name: sc.name,
		icon: sc.icon,
		permission: sc.permission as 'read' | 'write',
		ownerName: sc.ownerName
	}));

	// Load favorite snippets
	const favoriteSnippets = await db
		.select({
			id: snippets.id,
			title: snippets.title
		})
		.from(snippets)
		.where(and(eq(snippets.authorId, locals.user.id), eq(snippets.isFavorite, true)))
		.all();

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name,
			role: locals.user.role,
			themePreference: locals.user.themePreference
		},
		collections: userCollections,
		sharedCollections,
		favoriteSnippets
	};
};
