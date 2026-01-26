import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = env.UPLOAD_DIR || './data/uploads';
const MAX_SIZE = parseInt(env.UPLOAD_MAX_SIZE || '52428800'); // 50MB default

const IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml'
];

// Dangerous file types that should be blocked
const BLOCKED_EXTENSIONS = ['exe', 'bat', 'cmd', 'msi', 'scr', 'ps1', 'vbs', 'js', 'jar'];

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		error(401, 'Non autorise');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const snippetId = formData.get('snippetId') as string | null;
	const fileType = formData.get('type') as string | null; // 'image' or 'file'

	if (!file) {
		error(400, 'Fichier requis');
	}

	if (file.size > MAX_SIZE) {
		error(400, `Fichier trop volumineux (max ${Math.round(MAX_SIZE / 1024 / 1024)}MB)`);
	}

	// Check file extension for security
	const ext = file.name.split('.').pop()?.toLowerCase() || '';
	if (BLOCKED_EXTENSIONS.includes(ext)) {
		error(400, 'Type de fichier non autorise pour des raisons de securite');
	}

	// For image uploads, validate the MIME type
	if (fileType === 'image' && !IMAGE_TYPES.includes(file.type)) {
		error(400, 'Type d\'image non supporte. Types acceptes: JPEG, PNG, GIF, WebP, SVG');
	}

	try {
		// Create upload directory: /uploads/{userId}/{snippetId or temp}/
		const targetDir = snippetId || 'temp';
		const userDir = join(UPLOAD_DIR, locals.user.id, targetDir);
		await mkdir(userDir, { recursive: true });

		// Generate unique filename with original extension
		const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
		const safeExt = ext.replace(/[^a-z0-9]/g, '');
		const filename = `${randomUUID()}.${safeExt}`;
		const filePath = join(userDir, filename);

		// Write file to disk
		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(filePath, buffer);

		// Return URL path (relative to static serving)
		const relativePath = `/uploads/${locals.user.id}/${targetDir}/${filename}`;
		const isImage = IMAGE_TYPES.includes(file.type);

		return json({
			data: {
				path: relativePath,
				name: file.name,
				size: file.size,
				mimeType: file.type,
				isImage
			}
		});
	} catch (e) {
		console.error('Upload error:', e);
		error(500, 'Erreur lors de l\'upload du fichier');
	}
};
