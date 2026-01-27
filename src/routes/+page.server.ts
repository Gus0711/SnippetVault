import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	// If user is logged in, redirect to dashboard
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	// Detect language from Accept-Language header
	const acceptLanguage = request.headers.get('accept-language') || '';
	const prefersFrench = acceptLanguage.toLowerCase().startsWith('fr');

	return {
		user: locals.user,
		detectedLang: prefersFrench ? 'fr' : 'en'
	};
};
