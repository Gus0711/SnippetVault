import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, snippets, snippetBlocks, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { createHighlighter, type BundledTheme } from 'shiki';
import { marked } from 'marked';

// Available themes for public snippets
const availableThemes: BundledTheme[] = [
	'github-dark',
	'github-light',
	'dracula',
	'nord',
	'one-dark-pro',
	'vitesse-dark',
	'vitesse-light',
	'min-dark',
	'min-light'
];

// Create highlighter singleton
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: availableThemes,
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
async function renderCode(code: string, language: string, theme: BundledTheme): Promise<string> {
	const hl = await getHighlighter();
	const validLangs = hl.getLoadedLanguages();
	const lang = validLangs.includes(language) ? language : 'plaintext';

	return hl.codeToHtml(code, {
		lang,
		theme
	});
}

// Render markdown
function renderMarkdown(content: string): string {
	return marked.parse(content, { async: false }) as string;
}

export const load: PageServerLoad = async ({ params }) => {
	// Find snippet by publicId
	const snippet = await db
		.select()
		.from(snippets)
		.where(eq(snippets.publicId, params.publicId))
		.get();

	// 404 if not found or not published
	if (!snippet || snippet.status !== 'published') {
		error(404, 'Snippet not found');
	}

	// Get author info (for display)
	const author = await db.select().from(users).where(eq(users.id, snippet.authorId)).get();

	// Get blocks
	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippet.id))
		.all();

	// Get theme (validate it's in available themes)
	const theme = (
		availableThemes.includes(snippet.publicTheme as BundledTheme)
			? snippet.publicTheme
			: 'github-dark'
	) as BundledTheme;

	// Render blocks with syntax highlighting and markdown
	const renderedBlocks = await Promise.all(
		blocks.sort((a, b) => a.order - b.order).map(async (block) => {
			if (block.type === 'code' && block.content) {
				const html = await renderCode(block.content, block.language || 'plaintext', theme);
				return { ...block, renderedHtml: html };
			} else if (block.type === 'markdown' && block.content) {
				const html = renderMarkdown(block.content);
				return { ...block, renderedHtml: html };
			}
			return { ...block, renderedHtml: null };
		})
	);

	return {
		snippet: {
			title: snippet.title,
			publicId: snippet.publicId,
			theme,
			showDescription: snippet.publicShowDescription,
			showAttachments: snippet.publicShowAttachments,
			createdAt: snippet.createdAt,
			updatedAt: snippet.updatedAt,
			blocks: renderedBlocks
		},
		author: author
			? {
					name: author.name
				}
			: null
	};
};
