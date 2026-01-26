import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, snippets, snippetBlocks, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { createHighlighter } from 'shiki';
import { marked } from 'marked';

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: ['github-dark', 'github-light', 'dracula', 'nord', 'one-dark-pro', 'vitesse-dark', 'vitesse-light', 'monokai', 'slack-dark'],
			langs: ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'sql', 'json', 'yaml', 'bash', 'shell', 'markdown', 'xml', 'plaintext']
		});
	}
	return highlighter;
}

export const load: PageServerLoad = async ({ params }) => {
	const snippet = await db
		.select()
		.from(snippets)
		.where(eq(snippets.publicId, params.publicId))
		.get();

	if (!snippet || snippet.status !== 'published') {
		error(404, 'Snippet not found');
	}

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	const sortedBlocks = blocks.sort((a, b) => a.order - b.order);

	// Get author
	const author = await db
		.select({ name: users.name })
		.from(users)
		.where(eq(users.id, snippet.authorId))
		.get();

	// Render blocks
	const hl = await getHighlighter();
	const theme = snippet.publicTheme || 'github-dark';

	const renderedBlocks = await Promise.all(
		sortedBlocks.map(async (block) => {
			if (block.type === 'code' && block.content) {
				const lang = block.language || 'plaintext';
				let html: string;
				try {
					html = hl.codeToHtml(block.content, { lang, theme });
				} catch {
					html = hl.codeToHtml(block.content, { lang: 'plaintext', theme });
				}
				return { ...block, html };
			}
			if (block.type === 'markdown' && block.content) {
				const html = await marked.parse(block.content);
				return { ...block, html };
			}
			return block;
		})
	);

	// Filter blocks based on settings
	const filteredBlocks = renderedBlocks.filter((block) => {
		if (!snippet.publicShowDescription && block.type === 'markdown') return false;
		if (!snippet.publicShowAttachments && (block.type === 'image' || block.type === 'file')) return false;
		return true;
	});

	return {
		snippet,
		blocks: filteredBlocks,
		author: author?.name || 'Anonyme',
		theme
	};
};
