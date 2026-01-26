<script lang="ts">
	import { SvelteFlow, Controls, Background, MiniMap, useSvelteFlow } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import JsonNode from './JsonNode.svelte';
	import { parseJsonToGraph } from './utils';
	import { onMount } from 'svelte';

	interface Props {
		json: any;
	}

	let { json }: Props = $props();

	// Parse JSON into nodes and edges (reactive to json changes)
	const graphData = $derived(parseJsonToGraph(json));

	let nodes = $derived(graphData.nodes);
	let edges = $derived(graphData.edges);

	const nodeTypes = {
		jsonNode: JsonNode
	};

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="graph-container">
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		fitView
		minZoom={0.1}
		maxZoom={2}
		defaultEdgeOptions={{
			type: 'smoothstep'
		}}
		proOptions={{ hideAttribution: true }}
	>
		<Background bgColor="#0d1117" gap={20} />
		<Controls />
		<MiniMap
			nodeColor={() => '#30363d'}
			maskColor="rgba(13, 17, 23, 0.8)"
		/>
	</SvelteFlow>
</div>

<style>
	.graph-container {
		position: relative;
		width: 100%;
		height: 600px;
		background: #0d1117;
		border-radius: 0 0 8px 8px;
		overflow: hidden;
	}

	.graph-container :global(.svelte-flow) {
		background: #0d1117;
	}

	.graph-container :global(.svelte-flow__edge-path) {
		stroke: #30363d;
		stroke-width: 2px;
	}

	.graph-container :global(.svelte-flow__controls) {
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}

	.graph-container :global(.svelte-flow__controls-button) {
		background: #161b22;
		border: none;
		border-bottom: 1px solid #30363d;
		color: #8b949e;
		width: 28px;
		height: 28px;
	}

	.graph-container :global(.svelte-flow__controls-button:hover) {
		background: #21262d;
		color: #e6edf3;
	}

	.graph-container :global(.svelte-flow__controls-button:last-child) {
		border-bottom: none;
	}

	.graph-container :global(.svelte-flow__controls-button svg) {
		fill: currentColor;
	}

	.graph-container :global(.svelte-flow__minimap) {
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
	}

	</style>
