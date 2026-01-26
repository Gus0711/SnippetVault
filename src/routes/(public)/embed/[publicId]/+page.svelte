<script lang="ts">
	import { Copy, Check, FileText, Download } from 'lucide-svelte';

	let { data } = $props();

	let copied = $state<string | null>(null);

	const copyCode = async (content: string, blockId: string) => {
		await navigator.clipboard.writeText(content);
		copied = blockId;
		setTimeout(() => (copied = null), 2000);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};
</script>

<svelte:head>
	<title>{data.snippet.title}</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			background: #0d1117;
		}
	</style>
</svelte:head>

<div class="embed-container">
	<!-- Compact header -->
	<div class="embed-header">
		<span class="embed-title">{data.snippet.title}</span>
		<a href="/s/{data.snippet.publicId}" target="_blank" class="embed-link">
			SnippetVault
		</a>
	</div>

	<!-- Blocks -->
	<div class="embed-content">
		{#each data.blocks as block (block.id)}
			{#if block.type === 'code' && block.html}
				<div class="code-block">
					<div class="code-header">
						<span class="code-lang">{block.language || 'code'}</span>
						<button
							onclick={() => copyCode(block.content || '', block.id)}
							class="copy-btn"
							title="Copier"
						>
							{#if copied === block.id}
								<Check size={12} />
							{:else}
								<Copy size={12} />
							{/if}
						</button>
					</div>
					<div class="code-content">
						{@html block.html}
					</div>
				</div>
			{:else if block.type === 'markdown' && block.html}
				<div class="markdown-block">
					{@html block.html}
				</div>
			{:else if block.type === 'image' && block.filePath}
				<div class="image-block">
					<img src={block.filePath} alt={block.fileName || 'Image'} />
				</div>
			{:else if block.type === 'file' && block.filePath}
				<a href={block.filePath} download class="file-block">
					<FileText size={14} />
					<span class="file-name">{block.fileName || 'Fichier'}</span>
					{#if block.fileSize}
						<span class="file-size">{formatFileSize(block.fileSize)}</span>
					{/if}
					<Download size={12} />
				</a>
			{/if}
		{/each}
	</div>
</div>

<style>
	.embed-container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #0d1117;
		color: #e6edf3;
		min-height: 100vh;
		font-size: 13px;
	}

	.embed-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: #161b22;
		border-bottom: 1px solid #30363d;
	}

	.embed-title {
		font-weight: 600;
		font-size: 12px;
		color: #e6edf3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.embed-link {
		font-size: 10px;
		color: #8b949e;
		text-decoration: none;
		flex-shrink: 0;
	}

	.embed-link:hover {
		color: #58a6ff;
	}

	.embed-content {
		padding: 12px;
	}

	.code-block {
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 12px;
	}

	.code-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		background: #21262d;
		border-bottom: 1px solid #30363d;
	}

	.code-lang {
		font-size: 10px;
		font-family: ui-monospace, monospace;
		color: #8b949e;
		text-transform: uppercase;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		padding: 4px;
		background: transparent;
		border: none;
		color: #8b949e;
		cursor: pointer;
		border-radius: 4px;
	}

	.copy-btn:hover {
		background: #30363d;
		color: #e6edf3;
	}

	.code-content {
		overflow-x: auto;
	}

	.code-content :global(pre) {
		margin: 0;
		padding: 12px;
		font-size: 12px;
		line-height: 1.5;
	}

	.code-content :global(code) {
		font-family: ui-monospace, 'SF Mono', monospace;
	}

	.markdown-block {
		color: #e6edf3;
		line-height: 1.6;
		margin-bottom: 12px;
	}

	.markdown-block :global(h1),
	.markdown-block :global(h2),
	.markdown-block :global(h3) {
		margin: 0 0 8px 0;
		color: #e6edf3;
	}

	.markdown-block :global(h1) { font-size: 16px; }
	.markdown-block :global(h2) { font-size: 14px; }
	.markdown-block :global(h3) { font-size: 13px; }

	.markdown-block :global(p) {
		margin: 0 0 8px 0;
	}

	.markdown-block :global(code) {
		background: #21262d;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 11px;
		font-family: ui-monospace, monospace;
	}

	.markdown-block :global(a) {
		color: #58a6ff;
	}

	.image-block {
		margin-bottom: 12px;
	}

	.image-block img {
		max-width: 100%;
		border-radius: 6px;
		border: 1px solid #30363d;
	}

	.file-block {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		text-decoration: none;
		font-size: 12px;
		margin-bottom: 12px;
	}

	.file-block:hover {
		border-color: #58a6ff;
	}

	.file-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-size {
		color: #8b949e;
		font-size: 10px;
	}
</style>
