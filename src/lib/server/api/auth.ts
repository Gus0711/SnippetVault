import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export interface ApiUser {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'user';
}

/**
 * Authenticate a request using API key from Authorization header
 * Returns the user if authenticated, null otherwise
 */
export async function authenticateApiKey(event: RequestEvent): Promise<ApiUser | null> {
	const authHeader = event.request.headers.get('Authorization');

	if (!authHeader) {
		return null;
	}

	// Support "Bearer {key}" format
	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	if (!match) {
		return null;
	}

	const apiKey = match[1];
	if (!apiKey || apiKey.length < 32) {
		return null;
	}

	// Find user by API key
	const user = await db.select().from(users).where(eq(users.apiKey, apiKey)).get();

	if (!user) {
		return null;
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role as 'admin' | 'user'
	};
}

/**
 * Helper to return unauthorized response
 */
export function unauthorized(message = 'Unauthorized') {
	return json({ error: message }, { status: 401 });
}

/**
 * Helper to return not found response
 */
export function notFound(message = 'Not found') {
	return json({ error: message }, { status: 404 });
}

/**
 * Helper to return bad request response
 */
export function badRequest(message = 'Bad request') {
	return json({ error: message }, { status: 400 });
}

/**
 * Helper to return forbidden response
 */
export function forbidden(message = 'Forbidden') {
	return json({ error: message }, { status: 403 });
}

/**
 * Helper to return server error response
 */
export function serverError(message = 'Internal server error') {
	return json({ error: message }, { status: 500 });
}

/**
 * Helper to return success response
 */
export function success<T>(data: T, status = 200) {
	return json({ data }, { status });
}
