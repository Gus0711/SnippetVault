<script lang="ts">
	import type { Collection } from '$lib/server/db/schema';
	import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-svelte';
	import CollectionTree from './CollectionTree.svelte';

	interface Props {
		collections: Collection[];
		isCollectionActive: (id: string) => boolean;
		parentId?: string | null;
		level?: number;
	}

	let { collections, isCollectionActive, parentId = null, level = 0 }: Props = $props();

	// Filter collections for this level
	const currentLevelCollections = $derived(
		collections.filter((c) => c.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name))
	);

	// Check if a collection has children
	const hasChildren = (id: string) => collections.some((c) => c.parentId === id);

	// Track expanded state
	let expandedIds = $state<Set<string>>(new Set());

	const toggleExpanded = (id: string, e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		if (expandedIds.has(id)) {
			expandedIds.delete(id);
			expandedIds = new Set(expandedIds);
		} else {
			expandedIds.add(id);
			expandedIds = new Set(expandedIds);
		}
	};

	const isExpanded = (id: string) => expandedIds.has(id);
</script>

{#each currentLevelCollections as collection (collection.id)}
	{@const active = isCollectionActive(collection.id)}
	{@const expanded = isExpanded(collection.id)}
	{@const children = hasChildren(collection.id)}

	<div class="select-none">
		<a
			href="/collections/{collection.id}"
			class="group flex items-center gap-0.5 px-1 py-[3px] rounded text-[11px] {active
				? 'bg-accent/10 text-accent'
				: 'text-muted hover:text-foreground hover:bg-background/70'} transition-colors"
			style="padding-left: {level * 8 + 4}px"
		>
			<!-- Expand/collapse button -->
			{#if children}
				<button
					onclick={(e) => toggleExpanded(collection.id, e)}
					class="p-0.5 rounded hover:bg-border/30 text-muted/70 shrink-0"
				>
					{#if expanded}
						<ChevronDown size={10} strokeWidth={1.5} />
					{:else}
						<ChevronRight size={10} strokeWidth={1.5} />
					{/if}
				</button>
			{:else}
				<span class="w-3.5 shrink-0"></span>
			{/if}

			<!-- Icon -->
			{#if collection.icon}
				<span class="text-[11px] w-3.5 text-center shrink-0">{collection.icon}</span>
			{:else if expanded || active}
				<FolderOpen size={12} strokeWidth={1.5} class="text-muted/70 shrink-0" />
			{:else}
				<Folder size={12} strokeWidth={1.5} class="text-muted/70 shrink-0" />
			{/if}

			<!-- Name -->
			<span class="truncate ml-0.5">{collection.name}</span>
		</a>

		<!-- Children -->
		{#if children && expanded}
			<CollectionTree
				{collections}
				{isCollectionActive}
				parentId={collection.id}
				level={level + 1}
			/>
		{/if}
	</div>
{/each}
