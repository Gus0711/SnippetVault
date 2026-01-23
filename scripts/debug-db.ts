import Database from 'better-sqlite3';

const dbPath = './data/snippetvault.db';
const sqlite = new Database(dbPath);

console.log('=== Tables ===');
const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log('\n=== Invitations ===');
try {
	const invitations = sqlite.prepare('SELECT * FROM invitations').all();
	console.log('Count:', invitations.length);
	invitations.forEach((inv: any) => {
		console.log({
			id: inv.id,
			email: inv.email,
			token: inv.token,
			expiresAt: inv.expires_at,
			usedAt: inv.used_at
		});
	});
} catch(e: any) {
	console.error('Error:', e.message);
}

console.log('\n=== Users ===');
try {
	const users = sqlite.prepare('SELECT id, email, name, role FROM users').all();
	console.log('Count:', users.length);
	console.log(users);
} catch(e: any) {
	console.error('Error:', e.message);
}

sqlite.close();
