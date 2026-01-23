import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { invitations } from '../src/lib/server/db/schema';

const sqlite = new Database('./data/snippetvault.db');
const db = drizzle(sqlite);

const token = '2a189ee229c1bce6c74e79ee28e6ba496d2d88a814395906';
const now = new Date();

console.log('Current time:', now.toISOString());
console.log('Current timestamp (ms):', now.getTime());
console.log('Current timestamp (s):', Math.floor(now.getTime() / 1000));

// Test raw query first
console.log('\n=== Raw query ===');
const raw = sqlite.prepare('SELECT * FROM invitations WHERE token = ?').get(token);
console.log(raw);

// Test Drizzle query
console.log('\n=== Drizzle query (same as page) ===');
const result = db
	.select()
	.from(invitations)
	.where(
		and(
			eq(invitations.token, token),
			isNull(invitations.usedAt),
			gt(invitations.expiresAt, now)
		)
	)
	.get();

console.log('Result:', result);

// Test without date condition
console.log('\n=== Without date condition ===');
const result2 = db
	.select()
	.from(invitations)
	.where(
		and(
			eq(invitations.token, token),
			isNull(invitations.usedAt)
		)
	)
	.get();

console.log('Result:', result2);

sqlite.close();
