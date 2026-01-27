import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	// Detect language from Accept-Language header
	const acceptLanguage = request.headers.get('accept-language') || '';
	const prefersFrench = acceptLanguage.toLowerCase().startsWith('fr');

	return {
		user: locals.user,
		detectedLang: prefersFrench ? 'fr' : 'en'
	};
};
