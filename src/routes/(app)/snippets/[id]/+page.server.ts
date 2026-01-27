import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, snippets, snippetBlocks, snippetTags, tags, collections, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { createHighlighter } from 'shiki';
import { marked } from 'marked';
import { getSnippetPermission, canRead, canWrite, isOwner } from '$lib/server/services/permissions';
import type { Permission } from '$lib/server/services/permissions';

// Create highlighter singleton
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: [
				'javascript',
				'typescript',
				'python',
				'rust',
				'go',
				'java',
				'c',
				'cpp',
				'csharp',
				'php',
				'ruby',
				'swift',
				'kotlin',
				'sql',
				'html',
				'css',
				'json',
				'yaml',
				'markdown',
				'bash',
				'shell',
				'plaintext'
			]
		});
	}
	return highlighter;
}

// Render code with Shiki
async function renderCode(code: string, language: string): Promise<string> {
	const hl = await getHighlighter();
	const validLangs = hl.getLoadedLanguages();
	const lang = validLangs.includes(language) ? language : 'plaintext';

	return hl.codeToHtml(code, {
		lang,
		theme: 'github-dark'
	});
}

// Render markdown
function renderMarkdown(content: string): string {
	return marked.parse(content, { async: false }) as string;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	const snippet = await db.select().from(snippets).where(eq(snippets.id, params.id)).get();

	if (!snippet) {
		error(404, 'Snippet not found');
	}

	// Check permission
	const permission = await getSnippetPermission(params.id, locals.user.id);

	if (!canRead(permission)) {
		error(403, 'Access denied');
	}

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	// Render blocks with syntax highlighting and markdown
	const renderedBlocks = await Promise.all(
		blocks.sort((a, b) => a.order - b.order).map(async (block) => {
			if (block.type === 'code' && block.content) {
				const html = await renderCode(block.content, block.language || 'plaintext');
				return { ...block, renderedHtml: html };
			} else if (block.type === 'markdown' && block.content) {
				const html = renderMarkdown(block.content);
				return { ...block, renderedHtml: html };
			}
			return { ...block, renderedHtml: null };
		})
	);

	// Get tags
	const snippetTagRelations = await db
		.select()
		.from(snippetTags)
		.where(eq(snippetTags.snippetId, snippet.id))
		.all();

	const tagIds = snippetTagRelations.map((st) => st.tagId);
	// Use snippet author's tags, not current user's (for shared snippets)
	const allAuthorTags = await db.select().from(tags).where(eq(tags.userId, snippet.authorId)).all();
	const snippetTagsList = allAuthorTags.filter((t) => tagIds.includes(t.id));

	// Get collection if exists
	let collection = null;
	if (snippet.collectionId) {
		collection = await db
			.select()
			.from(collections)
			.where(eq(collections.id, snippet.collectionId))
			.get();
	}

	// Check if user has GitHub token configured
	const user = await db.select().from(users).where(eq(users.id, locals.user.id)).get();
	const hasGithubToken = !!user?.githubToken;

	return {
		snippet: {
			...snippet,
			blocks: renderedBlocks,
			tags: snippetTagsList,
			collection
		},
		permission: permission as Permission,
		hasGithubToken
	};
};
