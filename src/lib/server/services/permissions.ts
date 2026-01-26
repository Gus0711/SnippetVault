import { db, collections, collectionMembers, snippets } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

export type Permission = 'owner' | 'write' | 'read' | null;

/**
 * Get the permission level a user has on a collection.
 * Returns 'owner' if the user owns the collection,
 * 'write' or 'read' if they're a member, or null if no access.
 */
export async function getCollectionPermission(
	collectionId: string,
	userId: string
): Promise<Permission> {
	// Check if user is owner
	const collection = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.get();

	if (!collection) {
		return null;
	}

	if (collection.ownerId === userId) {
		return 'owner';
	}

	// Check if user is a member
	const membership = await db
		.select()
		.from(collectionMembers)
		.where(
			and(eq(collectionMembers.collectionId, collectionId), eq(collectionMembers.userId, userId))
		)
		.get();

	if (membership) {
		return membership.permission as 'read' | 'write';
	}

	return null;
}

/**
 * Get the permission level a user has on a snippet.
 * Returns 'owner' if the user authored the snippet,
 * 'write' or 'read' based on collection membership, or null if no access.
 */
export async function getSnippetPermission(
	snippetId: string,
	userId: string
): Promise<Permission> {
	const snippet = await db.select().from(snippets).where(eq(snippets.id, snippetId)).get();

	if (!snippet) {
		return null;
	}

	// Author has full ownership
	if (snippet.authorId === userId) {
		return 'owner';
	}

	// Check collection permission if snippet is in a collection
	if (snippet.collectionId) {
		return getCollectionPermission(snippet.collectionId, userId);
	}

	return null;
}

/**
 * Check if the permission allows reading.
 */
export function canRead(permission: Permission): boolean {
	return permission !== null;
}

/**
 * Check if the permission allows writing (creating/editing).
 */
export function canWrite(permission: Permission): boolean {
	return permission === 'owner' || permission === 'write';
}

/**
 * Check if the permission is owner-level.
 */
export function isOwner(permission: Permission): boolean {
	return permission === 'owner';
}
