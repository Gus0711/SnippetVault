import type { RequestHandler } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq, and, like, or } from 'drizzle-orm';
import { authenticateApiKey, unauthorized, badRequest, serverError, success } from '$lib/server/api/auth';

// GET /api/v1/search?q=query&collection=id&tag=name&status=draft|published
export const GET: RequestHandler = async (event) => {
	const user = await authenticateApiKey(event);
	if (!user) {
		return unauthorized('Invalid or missing API key');
	}

	const url = event.url;
	const query = url.searchParams.get('q')?.trim();
	const collectionId = url.searchParams.get('collection');
	const tagName = url.searchParams.get('tag');
	const status = url.searchParams.get('status') as 'draft' | 'published' | null;
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);

	if (!query || query.length < 2) {
		return badRequest('Query must be at least 2 characters');
	}

	try {
		// Get all user's snippets
		const allSnippets = await db
			.select()
			.from(snippets)
			.where(eq(snippets.authorId, user.id))
			.all();

		// Get all blocks for searching content
		const snippetIds = allSnippets.map((s) => s.id);
		const allBlocks = await db.select().from(snippetBlocks).all();
		const blocksBySnippet = new Map<string, typeof allBlocks>();
		for (const block of allBlocks) {
			if (snippetIds.includes(block.snippetId)) {
				const existing = blocksBySnippet.get(block.snippetId) || [];
				existing.push(block);
				blocksBySnippet.set(block.snippetId, existing);
			}
		}

		// Get all tags
		const allTags = await db.select().from(tags).where(eq(tags.userId, user.id)).all();
		const allSnippetTags = await db.select().from(snippetTags).all();
		const tagsMap = new Map(allTags.map((t) => [t.id, t]));

		// Build search content for each snippet
		const searchIndex = allSnippets.map((snippet) => {
			const blocks = blocksBySnippet.get(snippet.id) || [];
			const blockContent = blocks.map((b) => b.content || '').join(' ');
			const snippetTagIds = allSnippetTags
				.filter((st) => st.snippetId === snippet.id)
				.map((st) => st.tagId);
			const snippetTagsList = snippetTagIds
				.map((id) => tagsMap.get(id))
				.filter(Boolean);
			const tagNames = snippetTagsList.map((t) => t!.name).join(' ');

			return {
				snippet,
				searchContent: `${snippet.title} ${blockContent} ${tagNames}`.toLowerCase(),
				tags: snippetTagsList.map((t) => ({ id: t!.id, name: t!.name, color: t!.color }))
			};
		});

		// Filter by search query
		const queryLower = query.toLowerCase();
		let results = searchIndex.filter((item) => item.searchContent.includes(queryLower));

		// Apply filters
		if (collectionId) {
			results = results.filter((item) => item.snippet.collectionId === collectionId);
		}

		if (status && ['draft', 'published'].includes(status)) {
			results = results.filter((item) => item.snippet.status === status);
		}

		if (tagName) {
			const tagNameLower = tagName.toLowerCase();
			results = results.filter((item) =>
				item.tags.some((t) => t.name.toLowerCase() === tagNameLower)
			);
		}

		// Sort by relevance (title match first, then by date)
		results.sort((a, b) => {
			const aTitle = a.snippet.title.toLowerCase().includes(queryLower);
			const bTitle = b.snippet.title.toLowerCase().includes(queryLower);
			if (aTitle && !bTitle) return -1;
			if (!aTitle && bTitle) return 1;
			return new Date(b.snippet.updatedAt).getTime() - new Date(a.snippet.updatedAt).getTime();
		});

		// Limit results
		const limited = results.slice(0, limit);

		// Format response
		const formattedResults = limited.map((item) => ({
			id: item.snippet.id,
			title: item.snippet.title,
			collectionId: item.snippet.collectionId,
			status: item.snippet.status,
			publicId: item.snippet.publicId,
			createdAt: item.snippet.createdAt,
			updatedAt: item.snippet.updatedAt,
			tags: item.tags
		}));

		return success({
			query,
			total: results.length,
			results: formattedResults
		});
	} catch (error) {
		console.error('API v1 GET /search error:', error);
		return serverError('Failed to search snippets');
	}
};
