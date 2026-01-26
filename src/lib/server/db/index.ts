import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const dbPath = env.DATABASE_URL?.replace('file:', '') || './data/snippetvault.db';
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Export raw SQLite client for recursive CTEs and FTS5
export { sqlite };

// Initialize FTS5 full-text search
initializeFTS5();

function initializeFTS5() {
	// Check if FTS table exists and has correct structure
	const tableInfo = sqlite.prepare(`
		SELECT sql FROM sqlite_master WHERE type='table' AND name='snippets_fts'
	`).get() as { sql: string } | undefined;

	// If table exists with old contentless structure, drop and recreate
	if (tableInfo?.sql?.includes("content=''")) {
		console.log('[FTS] Dropping old contentless FTS table...');
		sqlite.exec(`DROP TABLE IF EXISTS snippets_fts`);
	}

	// Create FTS5 virtual table for snippet search (NOT contentless)
	sqlite.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
			snippet_id UNINDEXED,
			user_id UNINDEXED,
			title,
			content,
			tags
		);
	`);

	// Trigger: Insert into FTS when snippet is created
	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_insert AFTER INSERT ON snippets
		BEGIN
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				NEW.id,
				NEW.author_id,
				NEW.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = NEW.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = NEW.id), '');
		END;
	`);

	// Trigger: Update FTS when snippet title is updated
	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_update AFTER UPDATE OF title ON snippets
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = OLD.id;
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				NEW.id,
				NEW.author_id,
				NEW.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = NEW.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = NEW.id), '');
		END;
	`);

	// Trigger: Delete from FTS when snippet is deleted
	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_delete AFTER DELETE ON snippets
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = OLD.id;
		END;
	`);

	// Trigger: Update FTS when blocks change
	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_block_insert AFTER INSERT ON snippet_blocks
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = NEW.snippet_id;
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				s.id,
				s.author_id,
				s.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = s.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = s.id), '')
			FROM snippets s WHERE s.id = NEW.snippet_id;
		END;
	`);

	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_block_update AFTER UPDATE ON snippet_blocks
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = NEW.snippet_id;
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				s.id,
				s.author_id,
				s.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = s.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = s.id), '')
			FROM snippets s WHERE s.id = NEW.snippet_id;
		END;
	`);

	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_block_delete AFTER DELETE ON snippet_blocks
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = OLD.snippet_id;
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				s.id,
				s.author_id,
				s.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = s.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = s.id), '')
			FROM snippets s WHERE s.id = OLD.snippet_id;
		END;
	`);

	// Trigger: Update FTS when tags change
	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_tag_insert AFTER INSERT ON snippet_tags
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = NEW.snippet_id;
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				s.id,
				s.author_id,
				s.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = s.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = s.id), '')
			FROM snippets s WHERE s.id = NEW.snippet_id;
		END;
	`);

	sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS snippets_fts_tag_delete AFTER DELETE ON snippet_tags
		BEGIN
			DELETE FROM snippets_fts WHERE snippet_id = OLD.snippet_id;
			INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
			SELECT
				s.id,
				s.author_id,
				s.title,
				COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = s.id), ''),
				COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = s.id), '')
			FROM snippets s WHERE s.id = OLD.snippet_id;
		END;
	`);
}

// Rebuild FTS index for a user (useful for initial population or repair)
export function rebuildFTSIndex(userId?: string) {
	// Clear existing FTS data
	if (userId) {
		sqlite.exec(`DELETE FROM snippets_fts WHERE user_id = '${userId}'`);
	} else {
		sqlite.exec(`DELETE FROM snippets_fts`);
	}

	// Repopulate from snippets
	const whereClause = userId ? `WHERE s.author_id = '${userId}'` : '';
	sqlite.exec(`
		INSERT INTO snippets_fts(snippet_id, user_id, title, content, tags)
		SELECT
			s.id,
			s.author_id,
			s.title,
			COALESCE((SELECT GROUP_CONCAT(content, ' ') FROM snippet_blocks WHERE snippet_id = s.id), ''),
			COALESCE((SELECT GROUP_CONCAT(t.name, ' ') FROM snippet_tags st JOIN tags t ON t.id = st.tag_id WHERE st.snippet_id = s.id), '')
		FROM snippets s ${whereClause};
	`);
}

export * from './schema';
