<script lang="ts">
	import { ChevronDown, ChevronUp, Hash } from 'lucide-svelte';

	interface Props {
		content: string;
		renderedHtml?: string | null;
		language?: string | null;
		blockId: string;
		threshold?: number; // Lines threshold for auto-collapse (default: 15)
		previewLines?: number; // Lines visible when collapsed (default: 5)
		variant?: 'default' | 'public'; // Styling variant
	}

	let {
		content,
		renderedHtml = null,
		language = null,
		blockId,
		threshold = 15,
		previewLines = 5,
		variant = 'default'
	}: Props = $props();

	let isExpanded = $state(false);
	let showLineNumbers = $state(true);

	const lines = $derived(content.split('\n'));
	const totalLines = $derived(lines.length);
	const shouldCollapse = $derived(totalLines > threshold);
	const hiddenLines = $derived(totalLines - previewLines);

	// Calculate height based on line count (approximate line height 1.7em + padding)
	const collapsedHeight = $derived(`calc(1.7em * ${previewLines} + 2.5rem)`);

	const toggle = () => {
		isExpanded = !isExpanded;
	};

	const toggleLineNumbers = () => {
		showLineNumbers = !showLineNumbers;
	};
</script>

<div class="code-block-collapsible" class:is-public={variant === 'public'} class:show-line-numbers={showLineNumbers}>
	<!-- Top controls -->
	<div class="top-controls">
		{#if shouldCollapse}
			<button class="top-btn" onclick={toggle} type="button" title={isExpanded ? 'Reduire' : 'Voir tout'}>
				{#if isExpanded}
					<ChevronUp size={14} />
				{:else}
					<ChevronDown size={14} />
				{/if}
			</button>
		{/if}
		<button
			class="top-btn"
			class:active={showLineNumbers}
			onclick={toggleLineNumbers}
			type="button"
			title={showLineNumbers ? 'Masquer les numeros' : 'Afficher les numeros de ligne'}
		>
			<Hash size={14} />
		</button>
	</div>

	<div
		class="code-content"
		class:is-collapsed={shouldCollapse && !isExpanded}
		style={shouldCollapse && !isExpanded ? `max-height: ${collapsedHeight}` : ''}
	>
		{#if showLineNumbers}
			<div class="line-numbers" aria-hidden="true">
				{#each lines as _, i}
					<span class="line-number">{i + 1}</span>
				{/each}
			</div>
		{/if}

		<div class="code-wrapper">
			{#if renderedHtml}
				<div class="rendered-code">
					{@html renderedHtml}
				</div>
			{:else}
				<pre class="fallback-code">{content}</pre>
			{/if}
		</div>

		{#if shouldCollapse && !isExpanded}
			<div class="fade-overlay"></div>
		{/if}
	</div>

	{#if shouldCollapse}
		<button class="expand-toggle" onclick={toggle} type="button">
			{#if isExpanded}
				<ChevronUp size={14} />
				<span>Reduire</span>
			{:else}
				<ChevronDown size={14} />
				<span>+{hiddenLines} lignes</span>
			{/if}
		</button>
	{/if}
</div>

<style>
	.code-block-collapsible {
		position: relative;
	}

	.top-controls {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 5;
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.code-block-collapsible:hover .top-controls {
		opacity: 1;
	}

	.top-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--bg);
		border: 1px solid var(--bd);
		border-radius: 0.25rem;
		color: var(--tx-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.top-btn:hover {
		background: var(--sf);
		color: var(--tx);
	}

	.top-btn.active {
		background: var(--accent, #58a6ff);
		border-color: var(--accent, #58a6ff);
		color: white;
	}

	.is-public .top-btn {
		background: #0d1117;
		border-color: #30363d;
		color: #8b949e;
	}

	.is-public .top-btn:hover {
		background: #1c2128;
		color: #e6edf3;
	}

	.is-public .top-btn.active {
		background: #58a6ff;
		border-color: #58a6ff;
		color: white;
	}

	.code-content {
		position: relative;
		overflow: hidden;
		transition: max-height 0.2s ease-out;
		display: flex;
	}

	.code-content.is-collapsed {
		overflow: hidden;
	}

	.line-numbers {
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
		padding-right: 0.75rem;
		padding-left: 0.75rem;
		background: var(--bg);
		border-right: 1px solid var(--bd);
		user-select: none;
		text-align: right;
		flex-shrink: 0;
	}

	.is-public .line-numbers {
		background: #0d1117;
		border-right-color: #30363d;
	}

	.line-number {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.9375rem;
		line-height: 1.7;
		color: var(--tx-muted);
		opacity: 0.5;
	}

	.is-public .line-number {
		color: #8b949e;
	}

	.code-wrapper {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
	}

	.fade-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3rem;
		background: linear-gradient(transparent, var(--sf));
		pointer-events: none;
	}

	.is-public .fade-overlay {
		background: linear-gradient(transparent, #161b22);
	}

	.rendered-code :global(pre) {
		margin: 0;
		padding: 1.25rem;
		overflow-x: auto;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.9375rem;
		line-height: 1.7;
	}

	.rendered-code :global(pre code) {
		background: none;
		padding: 0;
	}

	.fallback-code {
		margin: 0;
		padding: 1.25rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.9375rem;
		line-height: 1.7;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--tx);
	}

	.is-public .fallback-code {
		color: #e6edf3;
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.5rem;
		background: var(--sf);
		border: none;
		border-top: 1px solid var(--bd);
		color: var(--tx-muted);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.expand-toggle:hover {
		background: var(--bg);
		color: var(--tx);
	}

	.is-public .expand-toggle {
		background: #161b22;
		border-top-color: #30363d;
		color: #8b949e;
	}

	.is-public .expand-toggle:hover {
		background: #1c2128;
		color: #e6edf3;
	}
</style>
