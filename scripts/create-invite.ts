import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { invitations } from '../src/lib/server/db/schema';

const email = process.argv[2];

if (!email) {
	console.error('Usage: npx tsx scripts/create-invite.ts <email>');
	process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
	console.error('Invalid email format');
	process.exit(1);
}

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/snippetvault.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

function generateId(): string {
	return crypto.randomUUID();
}

function generateInviteToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	return encodeHexLowerCase(bytes);
}

const token = generateInviteToken();
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

db.insert(invitations).values({
	id: generateId(),
	email: email.toLowerCase(),
	invitedBy: null, // null for system-generated invitations
	token,
	expiresAt
}).run();

console.log('Invitation created successfully!');
console.log('');
console.log(`Email: ${email}`);
console.log(`Token: ${token}`);
console.log(`Expires: ${expiresAt.toISOString()}`);
console.log('');
console.log(`Registration URL: http://localhost:5173/auth/register/${token}`);

sqlite.close();
