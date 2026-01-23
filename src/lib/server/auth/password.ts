import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

// Simple password hashing using SHA-256 with salt
// For production, consider using Argon2 via @node-rs/argon2

export function hashPassword(password: string): string {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = encodeHexLowerCase(salt);
	const hash = encodeHexLowerCase(sha256(new TextEncoder().encode(saltHex + password)));
	return `${saltHex}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [salt, hash] = storedHash.split(':');
	if (!salt || !hash) return false;

	const computedHash = encodeHexLowerCase(sha256(new TextEncoder().encode(salt + password)));
	return computedHash === hash;
}

export function generateApiKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return encodeHexLowerCase(bytes);
}

export function generateId(): string {
	return crypto.randomUUID();
}

export function generateInviteToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	return encodeHexLowerCase(bytes);
}
