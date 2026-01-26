import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db, sqlite, collections, snippets, tags, snippetTags, snippetBlocks, collectionMembers, users } from '$lib/server/db';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getCollectionPermission, canRead, canWrite, isOwner } from '$lib/server/services/permissions';
import type { Permission } from '$lib/server/services/permissions';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	// Get the toggle state from query params (default: true)
	const includeSubcollections = url.searchParams.get('sub') !== 'false';

	// Check permission
	const permission = await getCollectionPermission(params.id, locals.user!.id);

	if (!canRead(permission)) {
		error(404, 'Collection non trouvee');
	}

	// Get the collection
	const collection = await db
		.select()
		.from(collections)
		.where(eq(collections.id, params.id))
		.get();

	if (!collection) {
		error(404, 'Collection non trouvee');
	}

	// Get owner info if not owned by current user
	let ownerName: string | null = null;
	if (collection.ownerId !== locals.user!.id) {
		const owner = await db.select().from(users).where(eq(users.id, collection.ownerId)).get();
		ownerName = owner?.name || null;
	}

	// Get parent collection if exists
	const parentCollection = collection.parentId
		? await db.select().from(collections).where(eq(collections.id, collection.parentId)).get()
		: null;

	// Get child collections (only if owner - members don't see subcollections)
	let childCollections: typeof collection[] = [];
	if (isOwner(permission)) {
		childCollections = await db
			.select()
			.from(collections)
			.where(eq(collections.parentId, params.id))
			.all();
	}

	// Get all user collections for path building (only owned collections)
	const allUserCollections = await db
		.select()
		.from(collections)
		.where(eq(collections.ownerId, locals.user!.id))
		.all();
	const collectionsMap = new Map(allUserCollections.map((c) => [c.id, c]));

	// Build collection path helper
	function buildCollectionPath(collectionId: string): string {
		const parts: string[] = [];
		let current = collectionsMap.get(collectionId);
		while (current) {
			parts.unshift(current.name);
			current = current.parentId ? collectionsMap.get(current.parentId) : undefined;
		}
		return parts.join(' / ');
	}

	// Determine which collection IDs to query
	let collectionIds: string[] = [params.id];

	if (includeSubcollections && childCollections.length > 0) {
		// Recursive CTE to get all descendant collection IDs
		const stmt = sqlite.prepare(`
			WITH RECURSIVE descendants AS (
				SELECT id FROM collections WHERE id = ?
				UNION ALL
				SELECT c.id FROM collections c
				JOIN descendants d ON c.parent_id = d.id
			)
			SELECT id FROM descendants
		`);
		const descendants = stmt.all(params.id) as { id: string }[];
		collectionIds = descendants.map((d) => d.id);
	}

	// Get snippets from all relevant collections
	const collectionSnippets = await db
		.select()
		.from(snippets)
		.where(inArray(snippets.collectionId, collectionIds))
		.orderBy(desc(snippets.updatedAt))
		.all();

	// Get tags for snippets
	const allTags = await db.select().from(tags).where(eq(tags.userId, locals.user!.id)).all();
	const allSnippetTags = await db.select().from(snippetTags).all();
	const tagsMap = new Map(allTags.map((t) => [t.id, t]));

	// Get first code language and content for each snippet
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
	const snippetsWithRelations = collectionSnippets.map((snippet) => {
		const snippetTagIds = allSnippetTags
			.filter((st) => st.snippetId === snippet.id)
			.map((st) => st.tagId);

		const snippetCollection = snippet.collectionId
			? collectionsMap.get(snippet.collectionId)
			: null;

		return {
			...snippet,
			collection: snippetCollection || null,
			collectionPath: snippet.collectionId ? buildCollectionPath(snippet.collectionId) : null,
			tags: snippetTagIds.map((tagId) => tagsMap.get(tagId)).filter(Boolean),
			language: snippetLanguages.get(snippet.id) || null,
			searchContent: snippetContents.get(snippet.id) || ''
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

	// Get members if owner
	let members: Array<{
		userId: string;
		userName: string;
		userEmail: string;
		permission: string;
		invitedAt: Date;
	}> = [];

	if (isOwner(permission)) {
		const membersResult = await db
			.select({
				userId: collectionMembers.userId,
				permission: collectionMembers.permission,
				invitedAt: collectionMembers.invitedAt,
				userName: users.name,
				userEmail: users.email
			})
			.from(collectionMembers)
			.innerJoin(users, eq(collectionMembers.userId, users.id))
			.where(eq(collectionMembers.collectionId, params.id))
			.all();

		members = membersResult.map((m) => ({
			userId: m.userId,
			userName: m.userName,
			userEmail: m.userEmail,
			permission: m.permission,
			invitedAt: m.invitedAt
		}));
	}

	return {
		collection,
		parentCollection,
		childCollections,
		snippets: snippetsWithRelations,
		breadcrumb,
		tags: allTags,
		collections: allUserCollections,
		includeSubcollections,
		permission: permission as Permission,
		members,
		ownerName
	};
};

export const actions: Actions = {
	rename: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();

		if (!name) {
			return { error: 'Le nom est requis' };
		}

		// Only owner can rename
		const permission = await getCollectionPermission(params.id, locals.user!.id);
		if (!isOwner(permission)) {
			return { error: 'Acces refuse' };
		}

		await db
			.update(collections)
			.set({ name, updatedAt: new Date() })
			.where(eq(collections.id, params.id));

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		// Only owner can delete
		const permission = await getCollectionPermission(params.id, locals.user!.id);
		if (!isOwner(permission)) {
			return { error: 'Acces refuse' };
		}

		const collection = await db
			.select()
			.from(collections)
			.where(eq(collections.id, params.id))
			.get();

		if (!collection) {
			return { error: 'Collection non trouvee' };
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
