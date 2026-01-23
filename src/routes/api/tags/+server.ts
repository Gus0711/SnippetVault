import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, tags } from '$lib/server/db';
import { eq } from 'drizzle-orm';

// GET /api/tags - List all tags for the user
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userTags = await db.select().from(tags).where(eq(tags.userId, locals.user.id)).all();

	return json({ data: userTags });
};

// POST /api/tags - Create a new tag
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, color } = body;

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// Check if tag with same name exists
		const existingTags = await db
			.select()
			.from(tags)
			.where(eq(tags.userId, locals.user.id))
			.all();

		const normalizedName = name.trim().toLowerCase();
		if (existingTags.some((t) => t.name.toLowerCase() === normalizedName)) {
			return json({ error: 'Tag with this name already exists' }, { status: 400 });
		}

		const id = crypto.randomUUID();

		await db.insert(tags).values({
			id,
			name: name.trim(),
			color: color?.trim() || null,
			userId: locals.user.id
		});

		const newTag = await db.select().from(tags).where(eq(tags.id, id)).get();

		return json({ data: newTag }, { status: 201 });
	} catch (error) {
		console.error('Error creating tag:', error);
		return json({ error: 'Failed to create tag' }, { status: 500 });
	}
};
