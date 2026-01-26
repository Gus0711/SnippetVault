import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, invitations, users } from '$lib/server/db';
import { eq, isNull, gt, and } from 'drizzle-orm';

// GET /api/admin/invitations - List pending invitations
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.user.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Get pending invitations (not used, not expired)
	const pendingInvitations = await db
		.select({
			id: invitations.id,
			email: invitations.email,
			token: invitations.token,
			expiresAt: invitations.expiresAt,
			invitedBy: invitations.invitedBy,
			inviterName: users.name,
			inviterEmail: users.email
		})
		.from(invitations)
		.leftJoin(users, eq(invitations.invitedBy, users.id))
		.where(and(isNull(invitations.usedAt), gt(invitations.expiresAt, new Date())))
		.all();

	return json({ data: pendingInvitations });
};

// POST /api/admin/invitations - Create invitation
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.user.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { email } = body;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return json({ error: 'Valid email is required' }, { status: 400 });
		}

		// Check if email already exists as a user
		const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
		if (existingUser) {
			return json({ error: 'Un utilisateur avec cet email existe deja' }, { status: 400 });
		}

		// Check if there's already a pending invitation for this email
		const existingInvitation = await db
			.select()
			.from(invitations)
			.where(
				and(eq(invitations.email, email), isNull(invitations.usedAt), gt(invitations.expiresAt, new Date()))
			)
			.get();

		if (existingInvitation) {
			return json({ error: 'Une invitation est deja en attente pour cet email' }, { status: 400 });
		}

		// Generate token and create invitation (7 days expiry)
		const token = crypto.randomUUID();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		const invitation = {
			id: crypto.randomUUID(),
			email: email.toLowerCase().trim(),
			token,
			invitedBy: locals.user.id,
			expiresAt
		};

		await db.insert(invitations).values(invitation);

		return json({ data: invitation }, { status: 201 });
	} catch (error) {
		console.error('Error creating invitation:', error);
		return json({ error: 'Failed to create invitation' }, { status: 500 });
	}
};
