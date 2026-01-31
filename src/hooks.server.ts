import type { Handle } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import {
	validateSession,
	setSessionCookie,
	deleteSessionCookie,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';

const UPLOAD_DIR = env.UPLOAD_DIR || './data/uploads';

// Initialize on server startup (skip during build)
if (!building) {
	const { db, users, rebuildFTSIndex } = await import('$lib/server/db');
	const { hashPassword, generateApiKey, generateId } = await import('$lib/server/auth/password');

	// Rebuild FTS index
	console.log('[FTS] Rebuilding search index...');
	rebuildFTSIndex();
	console.log('[FTS] Search index ready');

	// Create default admin if no users exist and AUTO_CREATE_ADMIN is enabled
	const autoCreateAdmin = env.AUTO_CREATE_ADMIN !== 'false'; // true by default
	if (autoCreateAdmin) {
		const existingUsers = await db.select().from(users).limit(1).all();
		if (existingUsers.length === 0) {
			console.log('[AUTH] No users found, creating default admin...');
			const adminUser = {
				id: generateId(),
				email: 'admin@snippetvault.local',
				passwordHash: hashPassword('admin'),
				name: 'Admin',
				apiKey: generateApiKey(),
				role: 'admin' as const,
				themePreference: 'system' as const
			};
			await db.insert(users).values(adminUser);
			console.log('[AUTH] Default admin created:');
			console.log('[AUTH]   Email: admin@snippetvault.local');
			console.log('[AUTH]   Password: admin');
			console.log('[AUTH]   WARNING: Change this password after first login!');
		}
	}
}

// MIME types for uploaded files
const MIME_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml'
};

export const handle: Handle = async ({ event, resolve }) => {
	// Serve uploaded files
	if (event.url.pathname.startsWith('/uploads/')) {
		try {
			const relativePath = event.url.pathname.replace('/uploads/', '');
			const filePath = join(UPLOAD_DIR, relativePath);

			// Prevent directory traversal
			if (relativePath.includes('..')) {
				return new Response('Not found', { status: 404 });
			}

			const fileBuffer = await readFile(filePath);
			const ext = filePath.split('.').pop()?.toLowerCase() || '';
			const contentType = MIME_TYPES[ext] || 'application/octet-stream';

			return new Response(fileBuffer, {
				headers: {
					'Content-Type': contentType,
					'Cache-Control': 'public, max-age=31536000, immutable'
				}
			});
		} catch {
			return new Response('Not found', { status: 404 });
		}
	}
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
