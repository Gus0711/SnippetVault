import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, collections, collectionMembers } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

// PATCH /api/collections/[id]/members/[userId] - Update permission
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Verify user is collection owner
	const collection = await db
		.select()
		.from(collections)
		.where(eq(collections.id, params.id))
		.get();

	if (!collection) {
		return json({ error: 'Collection not found' }, { status: 404 });
	}

	if (collection.ownerId !== locals.user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { permission } = body;

		if (!permission || !['read', 'write'].includes(permission)) {
			return json({ error: 'Permission must be read or write' }, { status: 400 });
		}

		// Check if member exists
		const member = await db
			.select()
			.from(collectionMembers)
			.where(
				and(
					eq(collectionMembers.collectionId, params.id),
					eq(collectionMembers.userId, params.userId)
				)
			)
			.get();

		if (!member) {
			return json({ error: 'Member not found' }, { status: 404 });
		}

		// Update permission
		await db
			.update(collectionMembers)
			.set({ permission })
			.where(
				and(
					eq(collectionMembers.collectionId, params.id),
					eq(collectionMembers.userId, params.userId)
				)
			);

		return json({ data: { success: true, permission } });
	} catch (error) {
		console.error('Error updating permission:', error);
		return json({ error: 'Failed to update permission' }, { status: 500 });
	}
};

// DELETE /api/collections/[id]/members/[userId] - Remove member
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Verify user is collection owner
	const collection = await db
		.select()
		.from(collections)
		.where(eq(collections.id, params.id))
		.get();

	if (!collection) {
		return json({ error: 'Collection not found' }, { status: 404 });
	}

	if (collection.ownerId !== locals.user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	// Check if member exists
	const member = await db
		.select()
		.from(collectionMembers)
		.where(
			and(
				eq(collectionMembers.collectionId, params.id),
				eq(collectionMembers.userId, params.userId)
			)
		)
		.get();

	if (!member) {
		return json({ error: 'Member not found' }, { status: 404 });
	}

	// Remove member
	await db
		.delete(collectionMembers)
		.where(
			and(
				eq(collectionMembers.collectionId, params.id),
				eq(collectionMembers.userId, params.userId)
			)
		);

	// Check if collection still has members
	const remainingMembers = await db
		.select()
		.from(collectionMembers)
		.where(eq(collectionMembers.collectionId, params.id))
		.all();

	// If no more members, mark collection as not shared
	if (remainingMembers.length === 0) {
		await db
			.update(collections)
			.set({ isShared: false, updatedAt: new Date() })
			.where(eq(collections.id, params.id));
	}

	return json({ data: { success: true } });
};
