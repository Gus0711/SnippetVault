#!/usr/bin/env node

/**
 * Script to reset a user's password in SnippetVault
 * Usage: node scripts/reset-password.js <email> <new-password>
 */

import { createHash, randomBytes } from 'crypto';
import Database from 'better-sqlite3';
import { resolve } from 'path';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/reset-password.js <email> <new-password>');
  console.log('Example: node scripts/reset-password.js admin@example.com newpassword123');
  process.exit(1);
}

const [email, newPassword] = args;

// Find database
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || resolve('./data/snippetvault.db');

console.log(`Database: ${dbPath}`);

try {
  const db = new Database(dbPath);

  // Find user
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(email);

  if (!user) {
    console.error(`User not found: ${email}`);

    // List available users
    const users = db.prepare('SELECT email, name, role FROM users').all();
    if (users.length > 0) {
      console.log('\nAvailable users:');
      users.forEach(u => console.log(`  - ${u.email} (${u.name}) [${u.role}]`));
    }

    db.close();
    process.exit(1);
  }

  // Hash new password
  const passwordHash = hashPassword(newPassword);

  // Update password
  const result = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(passwordHash, Date.now(), user.id);

  if (result.changes > 0) {
    console.log(`\nPassword reset successful for ${user.email} (${user.name})`);
    console.log(`Role: ${user.role}`);
  } else {
    console.error('Failed to update password');
  }

  db.close();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
