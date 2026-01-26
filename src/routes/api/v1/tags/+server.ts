import type { RequestHandler } from './$types';
import { db, tags } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { authenticateApiKey, unauthorized, serverError, success } from '$lib/server/api/auth';

// GET /api/v1/tags - List all tags for the user
export const GET: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	try {
		const userTags = await db
			.select()
			.from(tags)
			.where(eq(tags.userId, user.id))
			.all();

		const result = userTags.map((t) => ({
			id: t.id,
			name: t.name,
			color: t.color,
			createdAt: t.createdAt
		}));

		// Sort by name
		result.sort((a, b) => a.name.localeCompare(b.name));

		return success({ tags: result });
	} catch (error) {
		console.error('API v1 GET /tags error:', error);
		return serverError('Failed to fetch tags');
	}
};
