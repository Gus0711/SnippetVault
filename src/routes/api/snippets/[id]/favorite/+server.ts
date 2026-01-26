import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { snippets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		return json({ error: 'Snippet non trouvé' }, { status: 404 });
	}

	if (snippet.authorId !== locals.user.id) {
		return json({ error: 'Non autorisé' }, { status: 403 });
	}

	// Toggle favorite status
	const newFavoriteStatus = !snippet.isFavorite;

	await db
		.update(snippets)
		.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
		.where(eq(snippets.id, params.id));

	return json({ data: { isFavorite: newFavoriteStatus } });
};
