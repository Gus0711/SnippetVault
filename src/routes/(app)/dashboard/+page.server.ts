import type { PageServerLoad } from './$types';
import { db, sqlite, snippets, snippetBlocks, collections, tags, snippetTags } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	// Get user's snippets
	const userSnippets = await db
		.select()
		.from(snippets)
		.where(eq(snippets.authorId, userId))
		.orderBy(desc(snippets.updatedAt))
		.limit(100)
		.all();

	// Get all collections for lookup
	const allCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, userId))
		.all();

	const collectionsMap = new Map(allCollections.map((c) => [c.id, c]));

	// Get all user tags
	const allTags = await db.select().from(tags).where(eq(tags.userId, userId)).all();
	const tagsMap = new Map(allTags.map((t) => [t.id, t]));

	// Get all snippet_tags relations
	const allSnippetTagsRelations = await db.select().from(snippetTags).all();

	// Get all blocks to extract languages and content for search
	const allBlocks = await db.select().from(snippetBlocks).all();
	const snippetLanguages = new Map<string, string>();
	const snippetContents = new Map<string, string>();
	for (const block of allBlocks) {
		if (block.type === 'code' && block.language && !snippetLanguages.has(block.snippetId)) {
			snippetLanguages.set(block.snippetId, block.language);
		}
		// Accumulate content for search
		if (block.content) {
			const existing = snippetContents.get(block.snippetId) || '';
			snippetContents.set(block.snippetId, existing + ' ' + block.content);
		}
	}

	// Build snippets with relations
	const snippetsWithRelations = userSnippets.map((snippet) => {
		const snippetTagIds = allSnippetTagsRelations
			.filter((st) => st.snippetId === snippet.id)
			.map((st) => st.tagId);

		return {
			...snippet,
			collection: snippet.collectionId ? collectionsMap.get(snippet.collectionId) || null : null,
			tags: snippetTagIds.map((tagId) => tagsMap.get(tagId)).filter(Boolean),
			language: snippetLanguages.get(snippet.id) || null,
			searchContent: snippetContents.get(snippet.id) || ''
		};
	});

	// Stats
	const totalSnippets = userSnippets.length;
	const publishedCount = userSnippets.filter((s) => s.status === 'published').length;
	const draftCount = userSnippets.filter((s) => s.status === 'draft').length;
	const favoritesCount = userSnippets.filter((s) => s.isFavorite).length;
	const collectionsCount = allCollections.length;

	// Activity heatmap data (last 365 days)
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	const oneYearAgoTimestamp = Math.floor(oneYearAgo.getTime() / 1000);

	const activityData = sqlite
		.prepare(
			`
		SELECT date(created_at, 'unixepoch') as day, COUNT(*) as count
		FROM snippets
		WHERE author_id = ? AND created_at >= ?
		GROUP BY day
		ORDER BY day
	`
		)
		.all(userId, oneYearAgoTimestamp) as { day: string; count: number }[];

	// Language distribution (count distinct snippets per language)
	const languageStats = sqlite
		.prepare(
			`
		SELECT sb.language, COUNT(DISTINCT sb.snippet_id) as count
		FROM snippet_blocks sb
		INNER JOIN snippets s ON s.id = sb.snippet_id
		WHERE s.author_id = ? AND sb.type = 'code' AND sb.language IS NOT NULL AND sb.language != ''
		GROUP BY sb.language
		ORDER BY count DESC
		LIMIT 10
	`
		)
		.all(userId) as { language: string; count: number }[];

	// Top tags
	const topTags = sqlite
		.prepare(
			`
		SELECT t.id, t.name, t.color, COUNT(st.snippet_id) as count
		FROM tags t
		INNER JOIN snippet_tags st ON st.tag_id = t.id
		INNER JOIN snippets s ON s.id = st.snippet_id
		WHERE t.user_id = ?
		GROUP BY t.id
		ORDER BY count DESC
		LIMIT 10
	`
		)
		.all(userId) as { id: string; name: string; color: string | null; count: number }[];

	return {
		snippets: snippetsWithRelations,
		tags: allTags,
		collections: allCollections,
		stats: {
			total: totalSnippets,
			published: publishedCount,
			drafts: draftCount,
			favorites: favoritesCount,
			collections: collectionsCount
		},
		activityData,
		languageStats,
		topTags
	};
};
