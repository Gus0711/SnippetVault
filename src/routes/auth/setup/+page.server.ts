import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, users } from '$lib/server/db';
import { hashPassword, generateApiKey, generateId } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	// Check if any users exist
	const userCount = await db.select().from(users).all();
	if (userCount.length > 0) {
		// Users already exist, redirect to login
		redirect(302, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const name = formData.get('name')?.toString().trim();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!email || !name || !password || !confirmPassword) {
			return fail(400, { error: 'Tous les champs sont requis' });
		}

		if (!email.includes('@')) {
			return fail(400, { error: 'Email invalide' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Le mot de passe doit contenir au moins 8 caractères' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Les mots de passe ne correspondent pas' });
		}

		// Double-check no users exist (prevent race condition)
		const userCount = await db.select().from(users).all();
		if (userCount.length > 0) {
			return fail(400, { error: 'Un administrateur existe déjà' });
		}

		// Create admin user
		const userId = generateId();
		const user = {
			id: userId,
			email,
			passwordHash: hashPassword(password),
			name,
			apiKey: generateApiKey(),
			role: 'admin' as const,
			themePreference: 'system' as const
		};

		await db.insert(users).values(user);

		// Create session
		const { session, token } = await createSession(userId);
		setSessionCookie(event, token, session.expiresAt);

		redirect(302, '/dashboard');
	}
};
