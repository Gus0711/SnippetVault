import type { RequestHandler } from './$types';
import { db, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { authenticateApiKey, unauthorized, serverError, success } from '$lib/server/api/auth';

// GET /api/v1/collections - List all collections
export const GET: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	try {
		const userCollections = await db
			.select()
			.from(collections)
			.where(eq(collections.ownerId, user.id))
			.all();

		// Build hierarchical structure
		const collectionsMap = new Map(userCollections.map((c) => [c.id, c]));

		const buildPath = (collectionId: string): string => {
			const parts: string[] = [];
			let current = collectionsMap.get(collectionId);
			while (current) {
				parts.unshift(current.name);
				current = current.parentId ? collectionsMap.get(current.parentId) : undefined;
			}
			return parts.join(' / ');
		};

		const result = userCollections.map((c) => ({
			id: c.id,
			name: c.name,
			description: c.description,
			icon: c.icon,
			parentId: c.parentId,
			path: buildPath(c.id),
			isShared: c.isShared,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt
		}));

		// Sort by path for hierarchical display
		result.sort((a, b) => a.path.localeCompare(b.path));

		return success({ collections: result });
	} catch (error) {
		console.error('API v1 GET /collections error:', error);
		return serverError('Failed to fetch collections');
	}
};
