import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db, collections, snippets, tags, snippetTags } from '$lib/server/db';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	// Get the collection
	const collection = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, params.id), eq(collections.ownerId, locals.user!.id)))
		.get();

	if (!collection) {
		error(404, 'Collection non trouvée');
	}

	// Get parent collection if exists
	const parentCollection = collection.parentId
		? await db.select().from(collections).where(eq(collections.id, collection.parentId)).get()
		: null;

	// Get child collections
	const childCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.parentId, params.id))
		.all();

	// Get snippets in this collection
	const collectionSnippets = await db
		.select()
		.from(snippets)
		.where(eq(snippets.collectionId, params.id))
		.orderBy(desc(snippets.updatedAt))
		.all();

	// Get tags for snippets
	const allTags = await db.select().from(tags).where(eq(tags.userId, locals.user!.id)).all();
	const allSnippetTags = await db.select().from(snippetTags).all();
	const tagsMap = new Map(allTags.map((t) => [t.id, t]));

	// Build snippets with relations
	const snippetsWithRelations = collectionSnippets.map((snippet) => {
		const snippetTagIds = allSnippetTags
			.filter((st) => st.snippetId === snippet.id)
			.map((st) => st.tagId);

		return {
			...snippet,
			collection,
			tags: snippetTagIds.map((tagId) => tagsMap.get(tagId)).filter(Boolean)
		};
	});

	// Build breadcrumb
	const breadcrumb: { id: string; name: string }[] = [];
	let current: typeof collection | null = collection;
	while (current) {
		breadcrumb.unshift({ id: current.id, name: current.name });
		if (current.parentId) {
			const parent = await db
				.select()
				.from(collections)
				.where(eq(collections.id, current.parentId))
				.get();
			current = parent || null;
		} else {
			break;
		}
	}

	return {
		collection,
		parentCollection,
		childCollections,
		snippets: snippetsWithRelations,
		breadcrumb
	};
};

export const actions: Actions = {
	rename: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();

		if (!name) {
			return { error: 'Le nom est requis' };
		}

		const collection = await db
			.select()
			.from(collections)
			.where(and(eq(collections.id, params.id), eq(collections.ownerId, locals.user!.id)))
			.get();

		if (!collection) {
			return { error: 'Collection non trouvée' };
		}

		await db
			.update(collections)
			.set({ name, updatedAt: new Date() })
			.where(eq(collections.id, params.id));

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const collection = await db
			.select()
			.from(collections)
			.where(and(eq(collections.id, params.id), eq(collections.ownerId, locals.user!.id)))
			.get();

		if (!collection) {
			return { error: 'Collection non trouvée' };
		}

		// Check for snippets
		const snippetCount = await db
			.select()
			.from(snippets)
			.where(eq(snippets.collectionId, params.id))
			.all();

		if (snippetCount.length > 0) {
			return { error: 'Impossible de supprimer une collection contenant des snippets' };
		}

		// Check for children
		const children = await db
			.select()
			.from(collections)
			.where(eq(collections.parentId, params.id))
			.all();

		if (children.length > 0) {
			return { error: 'Impossible de supprimer une collection contenant des sous-collections' };
		}

		await db.delete(collections).where(eq(collections.id, params.id));

		return { success: true, redirect: collection.parentId ? `/collections/${collection.parentId}` : '/dashboard' };
	}
};
