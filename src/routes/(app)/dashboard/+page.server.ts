import type { PageServerLoad } from './$types';
import { db, snippets, snippetBlocks, collections, tags, snippetTags } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Get user's snippets
	const userSnippets = await db
		.select()
		.from(snippets)
		.where(eq(snippets.authorId, locals.user!.id))
		.orderBy(desc(snippets.updatedAt))
		.limit(100)
		.all();

	// Get all collections for lookup
	const allCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user!.id))
		.all();

	const collectionsMap = new Map(allCollections.map((c) => [c.id, c]));

	// Get all user tags
	const allTags = await db.select().from(tags).where(eq(tags.userId, locals.user!.id)).all();
	const tagsMap = new Map(allTags.map((t) => [t.id, t]));

	// Get all snippet_tags relations
	const allSnippetTagsRelations = await db.select().from(snippetTags).all();

	// Get all blocks to extract languages
	const allBlocks = await db.select().from(snippetBlocks).all();
	const snippetLanguages = new Map<string, string>();
	for (const block of allBlocks) {
		if (block.type === 'code' && block.language && !snippetLanguages.has(block.snippetId)) {
			snippetLanguages.set(block.snippetId, block.language);
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
			language: snippetLanguages.get(snippet.id) || null
		};
	});

	// Stats
	const totalSnippets = userSnippets.length;
	const publishedCount = userSnippets.filter((s) => s.status === 'published').length;
	const draftCount = userSnippets.filter((s) => s.status === 'draft').length;

	return {
		snippets: snippetsWithRelations,
		tags: allTags,
		stats: {
			total: totalSnippets,
			published: publishedCount,
			drafts: draftCount
		}
	};
};
