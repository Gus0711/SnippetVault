import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, invitations } from '$lib/server/db';
import { eq } from 'drizzle-orm';

// DELETE /api/admin/invitations/[id] - Revoke invitation
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.user.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const invitation = await db
		.select()
		.from(invitations)
		.where(eq(invitations.id, params.id))
		.get();

	if (!invitation) {
		return json({ error: 'Invitation not found' }, { status: 404 });
	}

	await db.delete(invitations).where(eq(invitations.id, params.id));

	return json({ data: { success: true } });
};
