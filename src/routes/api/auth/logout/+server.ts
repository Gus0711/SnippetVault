import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateSession, deleteSessionCookie, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);

	if (token) {
		await invalidateSession(token);
	}

	deleteSessionCookie(event);

	return json({ success: true });
};
