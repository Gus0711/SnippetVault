<script lang="ts">
	import { Copy, Check, Calendar } from 'lucide-svelte';
	import CodeBlockCollapsible from '$lib/components/CodeBlockCollapsible.svelte';
	import { JsonViewer } from '$lib/components/json-viewer';
	import { HtmlPreview } from '$lib/components/html-preview';
	import { getLanguageColor } from '$lib/utils/colors';

	let { data } = $props();

	// Collect all CSS content from blocks for HTML preview
	const cssContent = $derived(
		data.snippet.blocks
			.filter((b: any) => b.type === 'code' && b.language === 'css')
			.map((b: any) => b.content || '')
			.join('\n\n')
	);

	let copiedBlockId = $state<string | null>(null);

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	};

	const copyCode = async (blockId: string, content: string) => {
		await navigator.clipboard.writeText(content);
		copiedBlockId = blockId;
		setTimeout(() => (copiedBlockId = null), 2000);
	};
</script>

<svelte:head>
	<title>{data.snippet.title} - SnippetVault</title>
	<meta name="description" content="Code snippet shared via SnippetVault" />
</svelte:head>

<div class="min-h-screen bg-[#0d1117] text-[#e6edf3]">
	<!-- Header -->
	<header class="border-b border-[#30363d]">
		<div class="max-w-4xl mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-xl font-semibold text-white">{data.snippet.title}</h1>
					<div class="flex items-center gap-3 mt-1 text-sm text-[#8b949e]">
						{#if data.author}
							<span>par {data.author.name}</span>
							<span>-</span>
						{/if}
						<span class="flex items-center gap-1">
							<Calendar size={14} />
							{formatDate(data.snippet.updatedAt)}
						</span>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-4xl mx-auto px-6 py-8">
		<div class="space-y-6">
			{#each data.snippet.blocks as block (block.id)}
				{#if block.type === 'code'}
					{@const langColor = getLanguageColor(block.language)}
					<div class="relative group rounded-lg overflow-hidden border border-[#30363d]">
						<!-- Header with language badge and copy button -->
						<div class="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
							<span
								class="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded"
								style="background-color: {langColor}20; color: {langColor}"
							>
								{block.language || 'code'}
							</span>
							<button
								onclick={() => copyCode(block.id, block.content || '')}
								class="flex items-center gap-1.5 px-2 py-1 text-xs text-[#8b949e] hover:text-white rounded transition-colors"
							>
								{#if copiedBlockId === block.id}
									<Check size={14} class="text-green-500" />
									<span class="text-green-500">Copied</span>
								{:else}
									<Copy size={14} />
									<span>Copy</span>
								{/if}
							</button>
						</div>
						<!-- Code content -->
						{#if block.language === 'json'}
							<JsonViewer content={block.content || ''} blockId={block.id}>
								<div class="overflow-x-auto">
									<CodeBlockCollapsible
										content={block.content || ''}
										renderedHtml={block.renderedHtml}
										language={block.language}
										blockId={block.id}
										variant="public"
									/>
								</div>
							</JsonViewer>
						{:else if block.language === 'html'}
							<HtmlPreview htmlContent={block.content || ''} cssContent={cssContent} blockId={block.id}>
								<div class="overflow-x-auto">
									<CodeBlockCollapsible
										content={block.content || ''}
										renderedHtml={block.renderedHtml}
										language={block.language}
										blockId={block.id}
										variant="public"
									/>
								</div>
							</HtmlPreview>
						{:else}
							<div class="overflow-x-auto">
								<CodeBlockCollapsible
									content={block.content || ''}
									renderedHtml={block.renderedHtml}
									language={block.language}
									blockId={block.id}
									variant="public"
								/>
							</div>
						{/if}
					</div>
				{:else if block.type === 'markdown'}
					{#if block.renderedHtml}
						<div class="prose-public">
							{@html block.renderedHtml}
						</div>
					{:else}
						<p class="text-[#e6edf3]">{block.content || ''}</p>
					{/if}
				{:else if block.type === 'image' && block.filePath && data.snippet.showAttachments}
					<div class="rounded-lg overflow-hidden border border-[#30363d]">
						<img
							src={block.filePath}
							alt={block.fileName || 'Image'}
							class="max-w-full h-auto"
						/>
					</div>
				{:else if block.type === 'file' && block.filePath && data.snippet.showAttachments}
					{@const fileSize = block.fileSize || 0}
					{@const sizeText = fileSize < 1024
						? `${fileSize} B`
						: fileSize < 1024 * 1024
							? `${(fileSize / 1024).toFixed(1)} KB`
							: `${(fileSize / (1024 * 1024)).toFixed(1)} MB`}
					<a
						href={block.filePath}
						download={block.fileName || 'file'}
						class="flex items-center gap-3 p-4 bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#58a6ff] transition-colors"
					>
						<span class="text-2xl">📎</span>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-white truncate">
								{block.fileName || 'Fichier'}
							</div>
							<div class="text-xs text-[#8b949e]">{sizeText}</div>
						</div>
						<span class="px-3 py-1.5 bg-[#238636] text-white text-xs rounded-md">
							Download
						</span>
					</a>
				{/if}
			{/each}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-[#30363d] mt-16">
		<div class="max-w-4xl mx-auto px-6 py-6 text-center">
			<p class="text-sm text-[#8b949e]">
				Powered by <a href="/" class="text-[#58a6ff] hover:underline">SnippetVault</a>
			</p>
		</div>
	</footer>
</div>

<style>
	/* Shiki code blocks */
	.shiki-wrapper :global(pre) {
		margin: 0;
		padding: 1rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		overflow-x: auto;
	}

	.shiki-wrapper :global(pre code) {
		background: none;
		padding: 0;
	}

	/* Public prose styles */
	.prose-public {
		color: #e6edf3;
	}

	.prose-public :global(h1),
	.prose-public :global(h2),
	.prose-public :global(h3),
	.prose-public :global(h4) {
		color: #ffffff;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.prose-public :global(h1) {
		font-size: 1.75rem;
	}

	.prose-public :global(h2) {
		font-size: 1.5rem;
	}

	.prose-public :global(h3) {
		font-size: 1.25rem;
	}

	.prose-public :global(p) {
		margin: 0.75rem 0;
		line-height: 1.7;
	}

	.prose-public :global(ul),
	.prose-public :global(ol) {
		padding-left: 1.5rem;
		margin: 0.75rem 0;
	}

	.prose-public :global(li) {
		margin: 0.375rem 0;
	}

	.prose-public :global(code) {
		background: #161b22;
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.875em;
		color: #f0883e;
	}

	.prose-public :global(pre) {
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 0.5rem;
		padding: 1rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.875rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	.prose-public :global(pre code) {
		background: none;
		padding: 0;
		color: inherit;
	}

	.prose-public :global(blockquote) {
		border-left: 3px solid #30363d;
		padding-left: 1rem;
		margin: 1rem 0;
		color: #8b949e;
	}

	.prose-public :global(a) {
		color: #58a6ff;
		text-decoration: none;
	}

	.prose-public :global(a:hover) {
		text-decoration: underline;
	}

	.prose-public :global(strong) {
		color: #ffffff;
		font-weight: 600;
	}

	.prose-public :global(hr) {
		border: none;
		border-top: 1px solid #30363d;
		margin: 2rem 0;
	}

	/* Table card wrapper */
	.prose-public :global(table) {
		border-collapse: collapse;
		width: auto;
		max-width: 100%;
		margin: 0;
		font-size: 0.875rem;
	}

	.prose-public :global(th),
	.prose-public :global(td) {
		border: 1px solid #30363d;
		padding: 0.75rem 1rem;
		text-align: left;
		vertical-align: top;
	}

	.prose-public :global(th) {
		background-color: #21262d;
		font-weight: 600;
		color: #ffffff;
		border-bottom: 2px solid #30363d;
	}

	.prose-public :global(td) {
		background-color: transparent;
	}

	.prose-public :global(tr:hover td) {
		background-color: #161b22;
	}

	/* Table wrapper card */
	.prose-public :global(.table-wrapper) {
		background-color: #161b22;
		border: 1px solid #30363d;
		border-radius: 0.5rem;
		padding: 1rem;
		margin: 1rem 0;
		max-width: 900px;
		overflow-x: auto;
	}

	.prose-public :global(.table-wrapper table) {
		margin: 0;
	}

	/* Rich text formatting */
	.prose-public :global(u) {
		text-decoration: underline;
	}

	.prose-public :global(s) {
		text-decoration: line-through;
	}

	.prose-public :global(mark) {
		border-radius: 0.15em;
		padding: 0.1em 0.2em;
		box-decoration-break: clone;
	}
</style>
