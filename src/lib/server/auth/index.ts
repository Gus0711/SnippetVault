import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db, sessions, users, type User, type Session } from '../db';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const SESSION_COOKIE_NAME = 'session';

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	return encodeBase64url(bytes);
}

export function hashSessionToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(userId: string): Promise<{ session: Session; token: string }> {
	const token = generateSessionToken();
	const sessionId = hashSessionToken(token);
	const expiresAt = new Date(Date.now() + DAY_IN_MS * 30);

	const session: Session = {
		id: sessionId,
		userId,
		expiresAt
	};

	await db.insert(sessions).values(session);

	return { session, token };
}

export async function validateSession(
	token: string
): Promise<{ session: Session; user: User } | null> {
	const sessionId = hashSessionToken(token);

	const result = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.get();

	if (!result) {
		return null;
	}

	const { session, user } = result;

	// Check if session expired
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return null;
	}

	// Extend session if it expires in less than 15 days
	if (Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15) {
		const newExpiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, sessionId));
		session.expiresAt = newExpiresAt;
	}

	return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
	const sessionId = hashSessionToken(token);
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionCookie(event: RequestEvent): void {
	event.cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}
