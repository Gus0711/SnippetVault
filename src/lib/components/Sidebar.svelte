<script lang="ts">
	import { page } from '$app/stores';
	import CollectionTree from './CollectionTree.svelte';
	import type { Collection } from '$lib/server/db/schema';
	import {
		FolderPlus,
		LayoutDashboard,
		Search,
		Settings,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	interface Props {
		collections: Collection[];
		collapsed?: boolean;
		onToggle?: () => void;
		onCreateCollection?: () => void;
	}

	let { collections, collapsed = false, onToggle, onCreateCollection }: Props = $props();

	const isActive = (path: string) => $page.url.pathname === path;
	const isCollectionActive = (id: string) => $page.url.pathname === `/collections/${id}`;
</script>

<aside
	class="h-full border-r border-border bg-surface flex flex-col transition-all duration-200 {collapsed
		? 'w-10'
		: 'w-56'}"
>
	<!-- Logo -->
	<div class="h-10 flex items-center justify-between px-2 border-b border-border shrink-0">
		{#if !collapsed}
			<a href="/dashboard" class="font-semibold text-foreground text-xs tracking-tight"
				>SnippetVault</a
			>
		{/if}
		<button
			onclick={onToggle}
			class="p-1 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
			title={collapsed ? 'Expand' : 'Collapse'}
		>
			{#if collapsed}
				<ChevronRight size={14} />
			{:else}
				<ChevronLeft size={14} />
			{/if}
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto py-1">
		{#if !collapsed}
			<!-- Quick links -->
			<div class="px-1 mb-1">
				<a
					href="/dashboard"
					class="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs {isActive('/dashboard')
						? 'bg-accent/10 text-accent'
						: 'text-muted hover:text-foreground hover:bg-background'} transition-colors"
				>
					<LayoutDashboard size={14} />
					<span>Snippets</span>
				</a>
				<a
					href="/search"
					class="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted hover:text-foreground hover:bg-background transition-colors"
				>
					<Search size={14} />
					<span>Recherche</span>
				</a>
			</div>

			<!-- Collections header -->
			<div class="px-2 py-1 flex items-center justify-between">
				<span class="text-[10px] font-medium text-muted uppercase tracking-wider">Collections</span
				>
				<button
					onclick={onCreateCollection}
					class="p-0.5 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
					title="Nouvelle collection"
				>
					<FolderPlus size={12} />
				</button>
			</div>

			<!-- Collections tree -->
			<div class="px-1">
				{#if collections.length === 0}
					<p class="px-1.5 py-2 text-[10px] text-muted text-center">Aucune collection</p>
				{:else}
					<CollectionTree {collections} {isCollectionActive} />
				{/if}
			</div>
		{:else}
			<!-- Collapsed state - icons only -->
			<div class="flex flex-col items-center gap-0.5 px-1">
				<a
					href="/dashboard"
					class="p-1.5 rounded {isActive('/dashboard')
						? 'bg-accent/10 text-accent'
						: 'text-muted hover:text-foreground hover:bg-background'} transition-colors"
					title="Snippets"
				>
					<LayoutDashboard size={16} />
				</a>
				<a
					href="/search"
					class="p-1.5 rounded text-muted hover:text-foreground hover:bg-background transition-colors"
					title="Recherche"
				>
					<Search size={16} />
				</a>
				<button
					onclick={onCreateCollection}
					class="p-1.5 rounded text-muted hover:text-foreground hover:bg-background transition-colors"
					title="Nouvelle collection"
				>
					<FolderPlus size={16} />
				</button>
			</div>
		{/if}
	</nav>

	<!-- Settings -->
	{#if !collapsed}
		<div class="px-1 py-1 border-t border-border">
			<a
				href="/settings"
				class="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted hover:text-foreground hover:bg-background transition-colors"
			>
				<Settings size={14} />
				<span>Paramètres</span>
			</a>
		</div>
	{/if}
</aside>
