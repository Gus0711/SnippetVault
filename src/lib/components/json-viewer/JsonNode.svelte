<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { JsonNodeData } from './types';
	import { valueColors } from './utils';

	interface Props {
		data: JsonNodeData;
		id: string;
	}

	let { data, id }: Props = $props();

	const isRoot = $derived(data.label === 'root');
	const headerLabel = $derived(isRoot
		? (data.type === 'array' ? 'Array' : 'Object')
		: data.label);
	const headerBadge = $derived(data.type === 'array'
		? `[${data.childCount}]`
		: `{${data.childCount}}`);
</script>

<div class="json-node" class:is-array={data.type === 'array'}>
	<!-- Input handle (except for root) -->
	{#if !isRoot}
		<Handle type="target" position={Position.Left} class="handle-target" />
	{/if}

	<!-- Header -->
	<div class="node-header">
		<span class="node-label">{headerLabel}</span>
		<span class="node-badge" style="color: {valueColors[data.type]}">{headerBadge}</span>
	</div>

	<!-- Properties -->
	{#if data.properties.length > 0}
		<div class="node-properties">
			{#each data.properties as prop (prop.key)}
				<div class="property">
					<span class="prop-key">{prop.key}</span>
					<span class="prop-separator">:</span>
					{#if prop.type === 'object' || prop.type === 'array'}
						<span class="prop-value prop-complex" style="color: {valueColors[prop.type]}">
							{prop.displayValue}
						</span>
					{:else}
						<span class="prop-value" style="color: {valueColors[prop.type]}">
							{prop.displayValue}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Output handle -->
	<Handle type="source" position={Position.Right} class="handle-source" />
</div>

<style>
	.json-node {
		background: var(--sf, #161b22);
		border: 1px solid var(--bd, #30363d);
		border-radius: 8px;
		min-width: 180px;
		max-width: 280px;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 11px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	.json-node.is-array {
		border-color: #7ee787;
		border-left-width: 3px;
	}

	.json-node:not(.is-array) {
		border-color: #d2a8ff;
		border-left-width: 3px;
	}

	.node-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: var(--bg, #0d1117);
		border-bottom: 1px solid var(--bd, #30363d);
	}

	.node-label {
		font-weight: 600;
		color: var(--tx, #e6edf3);
	}

	.node-badge {
		font-size: 10px;
		opacity: 0.8;
	}

	.node-properties {
		padding: 8px 12px;
		max-height: 200px;
		overflow-y: auto;
	}

	.property {
		display: flex;
		align-items: baseline;
		gap: 4px;
		padding: 2px 0;
		line-height: 1.4;
	}

	.prop-key {
		color: var(--tx-muted, #8b949e);
		flex-shrink: 0;
	}

	.prop-separator {
		color: var(--tx-muted, #8b949e);
		flex-shrink: 0;
	}

	.prop-value {
		word-break: break-all;
	}

	.prop-complex {
		font-weight: 500;
	}

	:global(.handle-target),
	:global(.handle-source) {
		width: 8px !important;
		height: 8px !important;
		background: var(--bd, #30363d) !important;
		border: 2px solid var(--sf, #161b22) !important;
	}

	:global(.handle-target) {
		left: -4px !important;
	}

	:global(.handle-source) {
		right: -4px !important;
	}
</style>
