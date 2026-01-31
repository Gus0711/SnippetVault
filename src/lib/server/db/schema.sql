-- SnippetVault Database Schema
-- Auto-generated from Drizzle schema

-- Enable WAL mode for better performance
PRAGMA journal_mode = WAL;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    api_key TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    github_token TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Sessions (for Lucia Auth)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_shared INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Collection Members (sharing)
CREATE TABLE IF NOT EXISTS collection_members (
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write')),
    invited_at INTEGER NOT NULL,
    PRIMARY KEY (collection_id, user_id)
);

-- Snippets
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    public_id TEXT UNIQUE,
    public_theme TEXT NOT NULL DEFAULT 'github-dark',
    public_show_description INTEGER NOT NULL DEFAULT 1,
    public_show_attachments INTEGER NOT NULL DEFAULT 1,
    gist_id TEXT,
    gist_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Snippet Blocks (content)
CREATE TABLE IF NOT EXISTS snippet_blocks (
    id TEXT PRIMARY KEY,
    snippet_id TEXT NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('markdown', 'code', 'image', 'file')),
    content TEXT,
    language TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Snippet Tags (many-to-many)
CREATE TABLE IF NOT EXISTS snippet_tags (
    snippet_id TEXT NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (snippet_id, tag_id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    invited_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used_at INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON collections(parent_id);
CREATE INDEX IF NOT EXISTS idx_snippets_author_id ON snippets(author_id);
CREATE INDEX IF NOT EXISTS idx_snippets_collection_id ON snippets(collection_id);
CREATE INDEX IF NOT EXISTS idx_snippets_public_id ON snippets(public_id);
CREATE INDEX IF NOT EXISTS idx_snippet_blocks_snippet_id ON snippet_blocks(snippet_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- FTS5 Full-Text Search
CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
    snippet_id UNINDEXED,
    user_id UNINDEXED,
    title,
    content,
    tags
);

-- FTS Triggers: Insert
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

-- FTS Triggers: Update snippet title
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

-- FTS Triggers: Delete snippet
CREATE TRIGGER IF NOT EXISTS snippets_fts_delete AFTER DELETE ON snippets
BEGIN
    DELETE FROM snippets_fts WHERE snippet_id = OLD.id;
END;

-- FTS Triggers: Block insert
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

-- FTS Triggers: Block update
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

-- FTS Triggers: Block delete
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

-- FTS Triggers: Tag insert
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

-- FTS Triggers: Tag delete
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
