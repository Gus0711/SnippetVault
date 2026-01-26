import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	// Redirect to setup if no users exist
	const userCount = await db.select().from(users).all();
	if (userCount.length === 0) {
		redirect(302, '/auth/setup');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email et mot de passe requis' });
		}

		const user = await db.select().from(users).where(eq(users.email, email)).get();

		if (!user) {
			return fail(400, { error: 'Email ou mot de passe incorrect' });
		}

		const validPassword = verifyPassword(password, user.passwordHash);
		if (!validPassword) {
			return fail(400, { error: 'Email ou mot de passe incorrect' });
		}

		const { session, token } = await createSession(user.id);
		setSessionCookie(event, token, session.expiresAt);

		redirect(302, '/dashboard');
	}
};
