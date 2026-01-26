import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';

// DELETE /api/admin/users/[id] - Delete user
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.user.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Prevent self-delete
	if (params.id === locals.user.id) {
		return json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
	}

	const user = await db.select().from(users).where(eq(users.id, params.id)).get();

	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	// Delete user (cascade will handle related data)
	await db.delete(users).where(eq(users.id, params.id));

	return json({ data: { success: true } });
};
