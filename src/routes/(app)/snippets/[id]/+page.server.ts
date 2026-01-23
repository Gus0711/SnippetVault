import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		error(404, 'Snippet not found');
	}

	if (snippet.authorId !== locals.user.id) {
		error(403, 'Access denied');
	}

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	// Get tags
	const snippetTagRelations = await db
		.select()
		.from(snippetTags)
		.where(eq(snippetTags.snippetId, snippet.id))
		.all();

	const tagIds = snippetTagRelations.map((st) => st.tagId);
	const allUserTags = await db.select().from(tags).where(eq(tags.userId, locals.user.id)).all();
	const snippetTagsList = allUserTags.filter((t) => tagIds.includes(t.id));

	// Get collection if exists
	let collection = null;
	if (snippet.collectionId) {
		collection = await db
			.select()
			.from(collections)
			.where(eq(collections.id, snippet.collectionId))
			.get();
	}

	return {
		snippet: {
			...snippet,
			blocks: blocks.sort((a, b) => a.order - b.order),
			tags: snippetTagsList,
			collection
		}
	};
};
