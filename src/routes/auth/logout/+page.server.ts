import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { invalidateSession, deleteSessionCookie, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	redirect(302, '/auth/login');
};

export const actions: Actions = {
	default: async (event) => {
		const token = event.cookies.get(SESSION_COOKIE_NAME);

		if (token) {
			await invalidateSession(token);
		}

		deleteSessionCookie(event);
		redirect(302, '/auth/login');
	}
};
