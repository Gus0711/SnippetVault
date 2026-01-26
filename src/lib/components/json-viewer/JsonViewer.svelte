<script lang="ts">
	import { Code, GitBranch } from 'lucide-svelte';
	import { isValidJson } from './utils';
	import type { Snippet } from 'svelte';

	interface Props {
		content: string;
		blockId: string;
		children?: Snippet;
	}

	let { content, blockId, children }: Props = $props();

	let view = $state<'code' | 'graph'>('code');
	let JsonGraphView: any = $state(null);

	const isValid = $derived(isValidJson(content));
	const parsedJson = $derived(isValid ? JSON.parse(content) : null);

	// Lazy load the graph view component
	async function loadGraphView() {
		if (!JsonGraphView) {
			const module = await import('./JsonGraphView.svelte');
			JsonGraphView = module.default;
		}
	}

	function switchToGraph() {
		view = 'graph';
		loadGraphView();
	}
</script>

<div class="json-viewer">
	<!-- Toggle buttons (only if valid JSON) -->
	{#if isValid}
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
				class:active={view === 'graph'}
				onclick={switchToGraph}
			>
				<GitBranch size={12} />
				<span>Graph</span>
			</button>
		</div>
	{/if}

	<!-- Content -->
	{#if view === 'code'}
		{@render children?.()}
	{:else if JsonGraphView && parsedJson}
		<JsonGraphView json={parsedJson} />
	{:else}
		<div class="loading">Chargement...</div>
	{/if}
</div>

<style>
	.json-viewer {
		position: relative;
	}

	.view-toggle {
		display: flex;
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

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 400px;
		color: var(--tx-muted, #8b949e);
		font-size: 12px;
		background: #0d1117;
		border-radius: 0 0 8px 8px;
	}
</style>
