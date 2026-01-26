import type { Handle } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { env } from '$env/dynamic/private';
import {
	validateSession,
	setSessionCookie,
	deleteSessionCookie,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';
import { rebuildFTSIndex } from '$lib/server/db';

const UPLOAD_DIR = env.UPLOAD_DIR || './data/uploads';

// Rebuild FTS index on server startup
console.log('[FTS] Rebuilding search index...');
rebuildFTSIndex();
console.log('[FTS] Search index ready');

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
