<script lang="ts">
	import { Code, Eye, Maximize2, Minimize2 } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		htmlContent: string;
		cssContent?: string;
		blockId: string;
		children?: Snippet;
	}

	let { htmlContent, cssContent = '', blockId, children }: Props = $props();

	let view = $state<'code' | 'preview'>('code');
	let size = $state<'small' | 'medium' | 'large' | 'full'>('medium');

	const sizes = {
		small: 200,
		medium: 350,
		large: 500,
		full: 800
	};

	const currentHeight = $derived(sizes[size]);

	// Build the complete HTML document for the iframe
	const iframeContent = $derived(`<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		*, *::before, *::after {
			box-sizing: border-box;
		}
		body {
			margin: 0;
			padding: 16px;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #1e1e2e;
			color: #cdd6f4;
			min-height: 100%;
		}
		${cssContent}
	</style>
</head>
<body>
${htmlContent}
</body>
</html>`);
</script>

<div class="html-preview">
	<!-- Toggle buttons -->
	<div class="view-toggle">
		<button
			class="toggle-btn"
			class:active={view === 'code'}
			onclick={() => (view = 'code')}
		>
			<Code size={12} />
			<span>Code</span>
		</button>
		<button
			class="toggle-btn"
			class:active={view === 'preview'}
			onclick={() => (view = 'preview')}
		>
			<Eye size={12} />
			<span>Preview</span>
		</button>

		{#if view === 'preview'}
			<div class="size-controls">
				<button
					class="size-btn"
					class:active={size === 'small'}
					onclick={() => (size = 'small')}
					title="Petit (200px)"
				>S</button>
				<button
					class="size-btn"
					class:active={size === 'medium'}
					onclick={() => (size = 'medium')}
					title="Moyen (350px)"
				>M</button>
				<button
					class="size-btn"
					class:active={size === 'large'}
					onclick={() => (size = 'large')}
					title="Grand (500px)"
				>L</button>
				<button
					class="size-btn"
					class:active={size === 'full'}
					onclick={() => (size = 'full')}
					title="Plein (800px)"
				>
					<Maximize2 size={10} />
				</button>
			</div>
		{/if}

		{#if cssContent}
			<span class="css-indicator">+ CSS</span>
		{/if}
	</div>

	<!-- Content -->
	{#if view === 'code'}
		{@render children?.()}
	{:else}
		<div class="preview-container">
			<iframe
				title="HTML Preview"
				srcdoc={iframeContent}
				sandbox="allow-scripts allow-same-origin"
				class="preview-iframe"
				style="height: {currentHeight}px"
			></iframe>
		</div>
	{/if}
</div>

<style>
	.html-preview {
		position: relative;
	}

	.view-toggle {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 6px;
		background: var(--sf, #161b22);
		border-bottom: 1px solid var(--bd, #30363d);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		color: var(--tx-muted, #8b949e);
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-btn:hover {
		color: var(--tx, #e6edf3);
		background: var(--bg, #0d1117);
	}

	.toggle-btn.active {
		color: var(--tx, #e6edf3);
		background: var(--bg, #0d1117);
		border-color: var(--bd, #30363d);
	}

	.size-controls {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-left: 8px;
		padding-left: 8px;
		border-left: 1px solid var(--bd, #30363d);
	}

	.size-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		color: var(--tx-muted, #8b949e);
		font-size: 10px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.size-btn:hover {
		color: var(--tx, #e6edf3);
		background: var(--bg, #0d1117);
	}

	.size-btn.active {
		color: var(--accent, #58a6ff);
		background: rgba(88, 166, 255, 0.1);
		border-color: rgba(88, 166, 255, 0.3);
	}

	.css-indicator {
		margin-left: auto;
		padding: 2px 8px;
		font-size: 10px;
		color: #c6538c;
		background: rgba(198, 83, 140, 0.15);
		border-radius: 4px;
	}

	.preview-container {
		background: #1e1e2e;
		border-radius: 0 0 8px 8px;
		overflow: hidden;
	}

	.preview-iframe {
		width: 100%;
		border: none;
		background: #1e1e2e;
		display: block;
		transition: height 0.2s ease;
	}
</style>
