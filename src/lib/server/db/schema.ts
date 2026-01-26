import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// Users
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	name: text('name').notNull(),
	avatarUrl: text('avatar_url'),
	apiKey: text('api_key').notNull().unique(),
	role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
	themePreference: text('theme_preference', { enum: ['light', 'dark', 'system'] })
		.notNull()
		.default('system'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Sessions (for Lucia Auth)
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Collections
export const collections = sqliteTable('collections', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	icon: text('icon'),
	parentId: text('parent_id').references((): ReturnType<typeof text> => collections.id, {
		onDelete: 'cascade'
	}),
	ownerId: text('owner_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Collection Members (sharing)
export const collectionMembers = sqliteTable(
	'collection_members',
	{
		collectionId: text('collection_id')
			.notNull()
			.references(() => collections.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		permission: text('permission', { enum: ['read', 'write'] }).notNull().default('read'),
		invitedAt: integer('invited_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [primaryKey({ columns: [table.collectionId, table.userId] })]
);

// Snippets
export const snippets = sqliteTable('snippets', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	collectionId: text('collection_id').references(() => collections.id, { onDelete: 'set null' }),
	authorId: text('author_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
	isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
	isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
	publicId: text('public_id').unique(),
	publicTheme: text('public_theme').notNull().default('github-dark'),
	publicShowDescription: integer('public_show_description', { mode: 'boolean' })
		.notNull()
		.default(true),
	publicShowAttachments: integer('public_show_attachments', { mode: 'boolean' })
		.notNull()
		.default(true),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Snippet Blocks (content)
export const snippetBlocks = sqliteTable('snippet_blocks', {
	id: text('id').primaryKey(),
	snippetId: text('snippet_id')
		.notNull()
		.references(() => snippets.id, { onDelete: 'cascade' }),
	order: integer('order').notNull(),
	type: text('type', { enum: ['markdown', 'code', 'image', 'file'] }).notNull(),
	content: text('content'),
	language: text('language'),
	filePath: text('file_path'),
	fileName: text('file_name'),
	fileSize: integer('file_size')
});

// Tags
export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	color: text('color'),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});

// Snippet Tags (many-to-many)
export const snippetTags = sqliteTable(
	'snippet_tags',
	{
		snippetId: text('snippet_id')
			.notNull()
			.references(() => snippets.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.snippetId, table.tagId] })]
);

// Invitations
export const invitations = sqliteTable('invitations', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	invitedBy: text('invited_by').references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	usedAt: integer('used_at', { mode: 'timestamp' })
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;
export type SnippetBlock = typeof snippetBlocks.$inferSelect;
export type NewSnippetBlock = typeof snippetBlocks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
