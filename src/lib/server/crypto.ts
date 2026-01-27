import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
	const secret = env.SECRET_KEY || 'change-me-in-production';
	// Derive a 32-byte key from SECRET_KEY using simple hash
	const crypto = require('crypto');
	return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text: string): string {
	const key = getKey();
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const authTag = cipher.getAuthTag();

	// Format: iv:authTag:encrypted
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
	const key = getKey();
	const parts = encryptedText.split(':');

	if (parts.length !== 3) {
		throw new Error('Invalid encrypted text format');
	}

	const [ivHex, authTagHex, encrypted] = parts;
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
