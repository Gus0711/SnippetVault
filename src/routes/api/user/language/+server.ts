import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { language } = await request.json();

		if (!language || !['fr', 'en'].includes(language)) {
			return json({ error: 'Invalid language' }, { status: 400 });
		}

		await db
			.update(users)
			.set({ languagePreference: language, updatedAt: new Date() })
			.where(eq(users.id, locals.user.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating language:', error);
		return json({ error: 'Failed to update language' }, { status: 500 });
	}
};
