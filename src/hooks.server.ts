import type { Handle } from '@sveltejs/kit';
import {
	validateSession,
	setSessionCookie,
	deleteSessionCookie,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);

	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const result = await validateSession(token);

	if (result) {
		setSessionCookie(event, token, result.session.expiresAt);
		event.locals.user = result.user;
		event.locals.session = result.session;
	} else {
		deleteSessionCookie(event);
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
