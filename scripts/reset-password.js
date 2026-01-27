#!/usr/bin/env node

/**
 * Reset password for a SnippetVault user
 * Usage: node scripts/reset-password.js <email> <new-password>
 *
 * This script uses the same hashing as the app (SHA-256 with salt)
 */

import { createHash, randomBytes } from 'crypto';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';

// Hash password using the same method as the app
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Reset password for a SnippetVault user\n');
  console.log('Usage: node scripts/reset-password.js <email> <new-password>\n');
  console.log('Example:');
  console.log('  node scripts/reset-password.js admin@example.com newpassword123\n');

  // Try to list users if database exists
  const dbPaths = [
    '/app/data/snippetvault.db',
    './data/snippetvault.db',
    process.env.DATABASE_URL?.replace('file:', '')
  ].filter(Boolean);

  for (const dbPath of dbPaths) {
    if (existsSync(dbPath)) {
      try {
        const db = new Database(dbPath);
        const users = db.prepare('SELECT email, name, role FROM users').all();
        if (users.length > 0) {
          console.log('Available users:');
          users.forEach(u => console.log(`  - ${u.email} (${u.name}) [${u.role}]`));
        }
        db.close();
      } catch (e) {
        // Ignore errors
      }
      break;
    }
  }

  process.exit(1);
}

const [email, newPassword] = args;

// Find database
const dbPaths = [
  '/app/data/snippetvault.db',
  './data/snippetvault.db',
  process.env.DATABASE_URL?.replace('file:', '')
].filter(Boolean);

let dbPath = null;
for (const path of dbPaths) {
  if (existsSync(path)) {
    dbPath = path;
    break;
  }
}

if (!dbPath) {
  console.error('Database not found. Tried:');
  dbPaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

console.log(`Database: ${dbPath}`);

try {
  const db = new Database(dbPath);

  // Find user
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(email);

  if (!user) {
    console.error(`\nUser not found: ${email}`);

    // List available users
    const users = db.prepare('SELECT email, name, role FROM users').all();
    if (users.length > 0) {
      console.log('\nAvailable users:');
      users.forEach(u => console.log(`  - ${u.email} (${u.name}) [${u.role}]`));
    } else {
      console.log('\nNo users in database.');
    }

    db.close();
    process.exit(1);
  }

  // Hash new password
  const passwordHash = hashPassword(newPassword);

  // Update password
  const result = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(passwordHash, Math.floor(Date.now() / 1000), user.id);

  if (result.changes > 0) {
    console.log(`\nPassword reset successful!`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name:  ${user.name}`);
    console.log(`  Role:  ${user.role}`);
  } else {
    console.error('Failed to update password');
    process.exit(1);
  }

  db.close();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
