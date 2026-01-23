import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, collections, snippets } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

// GET /api/collections/[id] - Get a single collection
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const collection = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, params.id), eq(collections.ownerId, locals.user.id)))
		.get();

	if (!collection) {
		return json({ error: 'Collection not found' }, { status: 404 });
	}

	return json({ data: collection });
};

// PATCH /api/collections/[id] - Update a collection
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const collection = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, params.id), eq(collections.ownerId, locals.user.id)))
		.get();

	if (!collection) {
		return json({ error: 'Collection not found' }, { status: 404 });
	}

	try {
		const body = await request.json();
		const { name, icon, parentId } = body;

		const updates: Partial<typeof collections.$inferInsert> = {
			updatedAt: new Date()
		};

		if (name !== undefined) {
			if (typeof name !== 'string' || name.trim().length === 0) {
				return json({ error: 'Name cannot be empty' }, { status: 400 });
			}
			updates.name = name.trim();
		}

		if (icon !== undefined) {
			updates.icon = icon?.trim() || null;
		}

		if (parentId !== undefined) {
			// Prevent circular reference
			if (parentId === params.id) {
				return json({ error: 'Collection cannot be its own parent' }, { status: 400 });
			}

			if (parentId !== null) {
				// Verify parent exists and belongs to user
				const parent = await db
					.select()
					.from(collections)
					.where(and(eq(collections.id, parentId), eq(collections.ownerId, locals.user.id)))
					.get();

				if (!parent) {
					return json({ error: 'Parent collection not found' }, { status: 404 });
				}

				// Check for circular reference (parent cannot be a descendant of this collection)
				let current = parent;
				while (current.parentId) {
					if (current.parentId === params.id) {
						return json({ error: 'Circular reference detected' }, { status: 400 });
					}
					const next = await db
						.select()
						.from(collections)
						.where(eq(collections.id, current.parentId))
						.get();
					if (!next) break;
					current = next;
				}
			}

			updates.parentId = parentId;
		}

		await db.update(collections).set(updates).where(eq(collections.id, params.id));

		const updated = await db.select().from(collections).where(eq(collections.id, params.id)).get();

		return json({ data: updated });
	} catch (error) {
		console.error('Error updating collection:', error);
		return json({ error: 'Failed to update collection' }, { status: 500 });
	}
};

// DELETE /api/collections/[id] - Delete a collection
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const collection = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, params.id), eq(collections.ownerId, locals.user.id)))
		.get();

	if (!collection) {
		return json({ error: 'Collection not found' }, { status: 404 });
	}

	// Check if collection has snippets
	const snippetCount = await db
		.select()
		.from(snippets)
		.where(eq(snippets.collectionId, params.id))
		.all();

	if (snippetCount.length > 0) {
		return json(
			{
				error: 'Cannot delete collection with snippets. Move or delete snippets first.'
			},
			{ status: 400 }
		);
	}

	// Check if collection has children
	const children = await db
		.select()
		.from(collections)
		.where(eq(collections.parentId, params.id))
		.all();

	if (children.length > 0) {
		return json(
			{
				error: 'Cannot delete collection with sub-collections. Delete sub-collections first.'
			},
			{ status: 400 }
		);
	}

	await db.delete(collections).where(eq(collections.id, params.id));

	return json({ data: { success: true } });
};
