import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, tags } from '$lib/server/db';
import { eq } from 'drizzle-orm';

// GET /api/user/tags - List user's tags
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userTags = await db
		.select()
		.from(tags)
		.where(eq(tags.userId, locals.user.id))
		.all();

	return json({ data: userTags });
};

// POST /api/user/tags - Create a new tag
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, color } = body;

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Tag name is required' }, { status: 400 });
		}

		const trimmedName = name.trim();

		// Check if tag with same name already exists for this user
		const existing = await db
			.select()
			.from(tags)
			.where(eq(tags.userId, locals.user.id))
			.all();

		const duplicate = existing.find(
			(t) => t.name.toLowerCase() === trimmedName.toLowerCase()
		);

		if (duplicate) {
			// Return the existing tag instead of creating a duplicate
			return json({ data: duplicate });
		}

		// Create new tag
		const newTag = {
			id: crypto.randomUUID(),
			name: trimmedName,
			color: color || null,
			userId: locals.user.id
		};

		await db.insert(tags).values(newTag);

		return json({ data: newTag }, { status: 201 });
	} catch (err) {
		console.error('Error creating tag:', err);
		return json({ error: 'Failed to create tag' }, { status: 500 });
	}
};
