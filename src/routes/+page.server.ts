import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { db, users } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, request }) => {
	// If user is logged in, redirect to dashboard
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	// Check if landing page should be shown (for promo site)
	const showLanding = env.SHOW_LANDING_PAGE === 'true';

	if (showLanding) {
		// Detect language from Accept-Language header
		const acceptLanguage = request.headers.get('accept-language') || '';
		const prefersFrench = acceptLanguage.toLowerCase().startsWith('fr');

		return {
			showLanding: true,
			user: locals.user,
			detectedLang: prefersFrench ? 'fr' : 'en'
		};
	}

	// Self-hosted mode: redirect to auth
	const userCount = await db.select().from(users).all();

	if (userCount.length === 0) {
		// No users exist, redirect to setup
		redirect(302, '/auth/setup');
	}

	// Users exist but not logged in, redirect to login
	redirect(302, '/auth/login');
};
