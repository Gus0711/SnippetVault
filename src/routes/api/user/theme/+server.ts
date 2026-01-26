import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { theme } = await request.json();

		if (!theme || !['light', 'dark', 'system'].includes(theme)) {
			return json({ error: 'Invalid theme' }, { status: 400 });
		}

		await db
			.update(users)
			.set({ themePreference: theme, updatedAt: new Date() })
			.where(eq(users.id, locals.user.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating theme:', error);
		return json({ error: 'Failed to update theme' }, { status: 500 });
	}
};
