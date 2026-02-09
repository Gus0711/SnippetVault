import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, users, invitations } from '$lib/server/db';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { hashPassword, generateApiKey, generateId } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	const invitation = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.token, params.token),
				isNull(invitations.usedAt),
				gt(invitations.expiresAt, new Date())
			)
		)
		.get();

	if (!invitation) {
		error(404, 'Invitation invalide ou expirée');
	}

	return {
		email: invitation.email
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { params } = event;
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!name || !password || !confirmPassword) {
			return fail(400, { error: 'auth.register.allFieldsRequired' as const });
		}

		if (password.length < 8) {
			return fail(400, { error: 'auth.register.passwordTooShort' as const });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'auth.register.passwordMismatch' as const });
		}

		const invitation = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.token, params.token),
					isNull(invitations.usedAt),
					gt(invitations.expiresAt, new Date())
				)
			)
			.get();

		if (!invitation) {
			return fail(400, { error: 'auth.register.invalidInvitation' as const });
		}

		// Check if email already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, invitation.email))
			.get();

		if (existingUser) {
			return fail(400, { error: 'auth.register.emailExists' as const });
		}

		// Check if this is the first user (will be admin)
		const userCount = await db.select().from(users).all();
		const isFirstUser = userCount.length === 0;

		// Create user
		const userId = generateId();
		const user = {
			id: userId,
			email: invitation.email,
			passwordHash: hashPassword(password),
			name,
			apiKey: generateApiKey(),
			role: isFirstUser ? 'admin' : 'user',
			themePreference: 'system'
		} as const;

		await db.insert(users).values(user);

		// Mark invitation as used
		await db
			.update(invitations)
			.set({ usedAt: new Date() })
			.where(eq(invitations.id, invitation.id));

		// Create session
		const { session, token } = await createSession(userId);
		setSessionCookie(event, token, session.expiresAt);

		redirect(302, '/dashboard');
	}
};
