import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, collections, collectionMembers, users } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

// GET /api/collections/[id]/members - List members
export const GET: RequestHandler = async ({ locals, params }) => {
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

	// Get members with user info
	const members = await db
		.select({
			userId: collectionMembers.userId,
			permission: collectionMembers.permission,
			invitedAt: collectionMembers.invitedAt,
			userName: users.name,
			userEmail: users.email
		})
		.from(collectionMembers)
		.innerJoin(users, eq(collectionMembers.userId, users.id))
		.where(eq(collectionMembers.collectionId, params.id))
		.all();

	return json({ data: members });
};

// POST /api/collections/[id]/members - Add member
export const POST: RequestHandler = async ({ locals, params, request }) => {
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
		const { email, permission } = body;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return json({ error: 'Valid email is required' }, { status: 400 });
		}

		if (!permission || !['read', 'write'].includes(permission)) {
			return json({ error: 'Permission must be read or write' }, { status: 400 });
		}

		// Find user by email
		const userToAdd = await db
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase().trim()))
			.get();

		if (!userToAdd) {
			return json({ error: 'Utilisateur non trouve' }, { status: 404 });
		}

		// Cannot add owner as member
		if (userToAdd.id === collection.ownerId) {
			return json({ error: 'Le proprietaire ne peut pas etre ajoute comme membre' }, { status: 400 });
		}

		// Check if already a member
		const existingMember = await db
			.select()
			.from(collectionMembers)
			.where(
				and(
					eq(collectionMembers.collectionId, params.id),
					eq(collectionMembers.userId, userToAdd.id)
				)
			)
			.get();

		if (existingMember) {
			return json({ error: 'Cet utilisateur est deja membre' }, { status: 400 });
		}

		// Add member
		await db.insert(collectionMembers).values({
			collectionId: params.id,
			userId: userToAdd.id,
			permission,
			invitedAt: new Date()
		});

		// Mark collection as shared
		if (!collection.isShared) {
			await db
				.update(collections)
				.set({ isShared: true, updatedAt: new Date() })
				.where(eq(collections.id, params.id));
		}

		return json({
			data: {
				userId: userToAdd.id,
				userName: userToAdd.name,
				userEmail: userToAdd.email,
				permission,
				invitedAt: new Date()
			}
		}, { status: 201 });
	} catch (error) {
		console.error('Error adding member:', error);
		return json({ error: 'Failed to add member' }, { status: 500 });
	}
};
