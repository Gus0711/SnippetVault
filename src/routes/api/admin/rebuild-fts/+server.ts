import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rebuildFTSIndex, sqlite } from '$lib/server/db';

// GET /api/admin/rebuild-fts - Rebuild FTS5 search index
export const GET: RequestHandler = async ({ locals }) => {
	// Only allow authenticated users (optionally check for admin role)
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get count before rebuild
		const beforeCount = sqlite.prepare(`SELECT COUNT(*) as count FROM snippets_fts`).get() as { count: number };

		// Rebuild the FTS index
		rebuildFTSIndex();

		// Get count after rebuild
		const afterCount = sqlite.prepare(`SELECT COUNT(*) as count FROM snippets_fts`).get() as { count: number };

		// Get snippet count for comparison
		const snippetCount = sqlite.prepare(`SELECT COUNT(*) as count FROM snippets`).get() as { count: number };

		return json({
			success: true,
			message: 'FTS index rebuilt successfully',
			stats: {
				snippetsInDb: snippetCount.count,
				ftsEntriesBefore: beforeCount.count,
				ftsEntriesAfter: afterCount.count
			}
		});
	} catch (error) {
		console.error('FTS rebuild error:', error);
		return json({ error: 'Failed to rebuild FTS index', details: String(error) }, { status: 500 });
	}
};
