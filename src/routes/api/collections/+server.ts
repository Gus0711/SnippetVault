import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, collections } from '$lib/server/db';
import { eq, or } from 'drizzle-orm';

// GET /api/collections - List all collections for the user
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user.id))
		.all();

	return json({ data: userCollections });
};

// POST /api/collections - Create a new collection
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, icon, parentId } = body;

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// Verify parent exists and belongs to user if provided
		if (parentId) {
			const parent = await db
				.select()
				.from(collections)
				.where(eq(collections.id, parentId))
				.get();

			if (!parent) {
				return json({ error: 'Parent collection not found' }, { status: 404 });
			}

			if (parent.ownerId !== locals.user.id) {
				return json({ error: 'Parent collection does not belong to you' }, { status: 403 });
			}
		}

		const id = crypto.randomUUID();
		const now = new Date();

		await db.insert(collections).values({
			id,
			name: name.trim(),
			icon: icon?.trim() || null,
			parentId: parentId || null,
			ownerId: locals.user.id,
			isShared: false,
			createdAt: now,
			updatedAt: now
		});

		const newCollection = await db.select().from(collections).where(eq(collections.id, id)).get();

		return json({ data: newCollection }, { status: 201 });
	} catch (error) {
		console.error('Error creating collection:', error);
		return json({ error: 'Failed to create collection' }, { status: 500 });
	}
};
