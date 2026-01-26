import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, sqlite, snippets, snippetBlocks, collections, tags, snippetTags } from '$lib/server/db';
import { eq, and, inArray } from 'drizzle-orm';

interface FTSResult {
	snippet_id: string;
	user_id: string;
	title: string;
	content: string;
	tags: string;
	rank: number;
}

// GET /api/search?q=query&collection=id&tag=name&status=draft|published
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const query = url.searchParams.get('q')?.trim() || '';
	const collectionId = url.searchParams.get('collection');
	const tagFilter = url.searchParams.get('tag');
	const statusFilter = url.searchParams.get('status');

	// If no query and no filters, return empty
	if (!query && !collectionId && !tagFilter && !statusFilter) {
		return json({ data: [] });
	}

	try {
		let snippetIds: string[] | null = null;

		// FTS5 search if query provided
		if (query) {
			// Escape special FTS5 characters and prepare query
			const ftsQuery = query
				.replace(/[*"()]/g, ' ')
				.split(/\s+/)
				.filter(Boolean)
				.map(term => `"${term}"*`)
				.join(' OR ');

			if (ftsQuery) {
				const ftsResults = sqlite.prepare(`
					SELECT snippet_id, rank
					FROM snippets_fts
					WHERE user_id = ? AND snippets_fts MATCH ?
					ORDER BY rank
					LIMIT 50
				`).all(locals.user.id, ftsQuery) as { snippet_id: string; rank: number }[];

				snippetIds = ftsResults.map(r => r.snippet_id);

				// If FTS returned no results, return empty
				if (snippetIds.length === 0) {
					return json({ data: [] });
				}
			}
		}

		// Build the query with filters
		let results = await db.select().from(snippets).where(eq(snippets.authorId, locals.user.id)).all();

		// Filter by FTS results if we have them
		if (snippetIds) {
			results = results.filter(s => snippetIds!.includes(s.id));
			// Sort by FTS rank order
			results.sort((a, b) => snippetIds!.indexOf(a.id) - snippetIds!.indexOf(b.id));
		}

		// Filter by collection
		if (collectionId) {
			results = results.filter(s => s.collectionId === collectionId);
		}

		// Filter by status
		if (statusFilter && ['draft', 'published'].includes(statusFilter)) {
			results = results.filter(s => s.status === statusFilter);
		}

		// Filter by tag
		if (tagFilter) {
			// Find tag by name
			const tag = await db
				.select()
				.from(tags)
				.where(and(eq(tags.userId, locals.user.id), eq(tags.name, tagFilter)))
				.get();

			if (tag) {
				const taggedSnippets = await db
					.select()
					.from(snippetTags)
					.where(eq(snippetTags.tagId, tag.id))
					.all();
				const taggedIds = taggedSnippets.map(st => st.snippetId);
				results = results.filter(s => taggedIds.includes(s.id));
			} else {
				results = [];
			}
		}

		// Enrich results with collection and tags info
		const enrichedResults = await Promise.all(
			results.slice(0, 20).map(async (snippet) => {
				// Get collection
				let collection = null;
				if (snippet.collectionId) {
					collection = await db
						.select({ id: collections.id, name: collections.name, icon: collections.icon })
						.from(collections)
						.where(eq(collections.id, snippet.collectionId))
						.get();
				}

				// Get tags
				const snippetTagRelations = await db
					.select()
					.from(snippetTags)
					.where(eq(snippetTags.snippetId, snippet.id))
					.all();

				let snippetTagsList: { id: string; name: string; color: string | null }[] = [];
				if (snippetTagRelations.length > 0) {
					const tagIds = snippetTagRelations.map(st => st.tagId);
					const allTags = await db.select().from(tags).where(eq(tags.userId, locals.user.id)).all();
					snippetTagsList = allTags
						.filter(t => tagIds.includes(t.id))
						.map(t => ({ id: t.id, name: t.name, color: t.color }));
				}

				// Get first code block for preview
				const firstBlock = await db
					.select()
					.from(snippetBlocks)
					.where(eq(snippetBlocks.snippetId, snippet.id))
					.orderBy(snippetBlocks.order)
					.limit(1)
					.get();

				return {
					id: snippet.id,
					title: snippet.title,
					status: snippet.status,
					updatedAt: snippet.updatedAt,
					collection,
					tags: snippetTagsList,
					preview: firstBlock?.content?.slice(0, 150) || null,
					language: firstBlock?.language || null
				};
			})
		);

		return json({ data: enrichedResults });
	} catch (error) {
		console.error('Search error:', error);
		return json({ error: 'Search failed' }, { status: 500 });
	}
};
