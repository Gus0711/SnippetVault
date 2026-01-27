import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, users, snippets, snippetBlocks } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { decrypt } from '$lib/server/crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non authentifie' }, { status: 401 });
	}

	const body = await request.json();
	const { snippetId, isPublic = false } = body;

	if (!snippetId) {
		return json({ error: 'snippetId requis' }, { status: 400 });
	}

	// Get user with GitHub token
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, locals.user.id))
		.get();

	if (!user?.githubToken) {
		return json({ error: 'Token GitHub non configure. Allez dans Parametres > Integrations.' }, { status: 400 });
	}

	// Get snippet with blocks
	const snippet = await db
		.select()
		.from(snippets)
		.where(eq(snippets.id, snippetId))
		.get();

	if (!snippet) {
		return json({ error: 'Snippet non trouve' }, { status: 404 });
	}

	if (snippet.authorId !== locals.user.id) {
		return json({ error: 'Acces refuse' }, { status: 403 });
	}

	const blocks = await db
		.select()
		.from(snippetBlocks)
		.where(eq(snippetBlocks.snippetId, snippetId))
		.orderBy(snippetBlocks.order)
		.all();

	// Build Gist files
	const files: Record<string, { content: string }> = {};

	// Add a main file with all content
	let mainContent = `# ${snippet.title}\n\n`;

	let codeBlockIndex = 0;
	for (const block of blocks) {
		if (block.type === 'markdown' && block.content) {
			mainContent += block.content + '\n\n';
		} else if (block.type === 'code' && block.content) {
			codeBlockIndex++;
			const ext = getExtension(block.language || 'txt');
			const fileName = `code-${codeBlockIndex}.${ext}`;
			files[fileName] = { content: block.content };
			mainContent += `\`\`\`${block.language || ''}\n${block.content}\n\`\`\`\n\n`;
		}
	}

	files['README.md'] = { content: mainContent.trim() };

	// Decrypt GitHub token
	let githubToken: string;
	try {
		githubToken = decrypt(user.githubToken);
	} catch {
		return json({ error: 'Erreur de dechiffrement du token GitHub' }, { status: 500 });
	}

	// Capture values for nested function
	const snippetTitle = snippet.title;
	const existingGistId = snippet.gistId;

	try {
		let gistResponse;
		let gistUrl: string;
		let gistId: string;

		if (existingGistId) {
			// Update existing Gist
			gistResponse = await fetch(`https://api.github.com/gists/${existingGistId}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${githubToken}`,
					'Content-Type': 'application/json',
					'Accept': 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28'
				},
				body: JSON.stringify({
					description: snippetTitle,
					files
				})
			});

			if (!gistResponse.ok) {
				const errorData = await gistResponse.json().catch(() => ({}));
				// If Gist not found, create a new one
				if (gistResponse.status === 404) {
					return createNewGist();
				}
				return json({ error: errorData.message || 'Erreur GitHub API' }, { status: gistResponse.status });
			}

			const gistData = await gistResponse.json();
			gistUrl = gistData.html_url;
			gistId = gistData.id;
		} else {
			return createNewGist();
		}

		// Update snippet with Gist info
		await db
			.update(snippets)
			.set({
				gistId,
				gistUrl,
				updatedAt: new Date()
			})
			.where(eq(snippets.id, snippetId));

		return json({
			data: {
				gistId,
				gistUrl,
				updated: !!existingGistId
			}
		});

		async function createNewGist() {
			const response = await fetch('https://api.github.com/gists', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${githubToken}`,
					'Content-Type': 'application/json',
					'Accept': 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28'
				},
				body: JSON.stringify({
					description: snippetTitle,
					public: isPublic,
					files
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return json({ error: errorData.message || 'Erreur lors de la creation du Gist' }, { status: response.status });
			}

			const gistData = await response.json();

			// Update snippet with Gist info
			await db
				.update(snippets)
				.set({
					gistId: gistData.id,
					gistUrl: gistData.html_url,
					updatedAt: new Date()
				})
				.where(eq(snippets.id, snippetId));

			return json({
				data: {
					gistId: gistData.id,
					gistUrl: gistData.html_url,
					updated: false
				}
			});
		}
	} catch (error) {
		console.error('Gist export error:', error);
		return json({ error: 'Erreur lors de l\'export vers Gist' }, { status: 500 });
	}
};

function getExtension(language: string): string {
	const extensions: Record<string, string> = {
		javascript: 'js',
		typescript: 'ts',
		python: 'py',
		ruby: 'rb',
		java: 'java',
		csharp: 'cs',
		cpp: 'cpp',
		c: 'c',
		go: 'go',
		rust: 'rs',
		swift: 'swift',
		kotlin: 'kt',
		php: 'php',
		html: 'html',
		css: 'css',
		scss: 'scss',
		less: 'less',
		json: 'json',
		yaml: 'yaml',
		yml: 'yml',
		xml: 'xml',
		markdown: 'md',
		sql: 'sql',
		shell: 'sh',
		bash: 'sh',
		powershell: 'ps1',
		dockerfile: 'dockerfile',
		makefile: 'makefile',
		lua: 'lua',
		perl: 'pl',
		r: 'r',
		scala: 'scala',
		haskell: 'hs',
		elixir: 'ex',
		clojure: 'clj',
		vue: 'vue',
		svelte: 'svelte',
		jsx: 'jsx',
		tsx: 'tsx'
	};

	return extensions[language.toLowerCase()] || language || 'txt';
}
