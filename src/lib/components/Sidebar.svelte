<script lang="ts">
	import { page } from '$app/stores';
	import CollectionTree from './CollectionTree.svelte';
	import type { Collection } from '$lib/server/db/schema';
	import { localeStore } from '$lib/stores/locale.svelte';
	import {
		FolderPlus,
		LayoutDashboard,
		Search,
		Settings,
		ChevronLeft,
		ChevronRight,
		Users,
		Eye,
		Star
	} from 'lucide-svelte';

	interface SharedCollection {
		id: string;
		name: string;
		icon: string | null;
		permission: 'read' | 'write';
		ownerName: string;
	}

	interface FavoriteSnippet {
		id: string;
		title: string;
	}

	interface Props {
		collections: Collection[];
		sharedCollections?: SharedCollection[];
		favoriteSnippets?: FavoriteSnippet[];
		collapsed?: boolean;
		onToggle?: () => void;
		onCreateCollection?: () => void;
	}

	let {
		collections,
		sharedCollections = [],
		favoriteSnippets = [],
		collapsed = false,
		onToggle,
		onCreateCollection
	}: Props = $props();

	const isActive = (path: string) => $page.url.pathname === path;
	const isCollectionActive = (id: string) => $page.url.pathname === `/collections/${id}`;
	const isSnippetActive = (id: string) => $page.url.pathname === `/snippets/${id}`;
</script>

<aside
	class="h-full border-r border-border bg-surface flex flex-col transition-all duration-150 {collapsed
		? 'w-9'
		: 'w-52'}"
>
	<!-- Logo -->
	<div class="h-9 flex items-center justify-between px-1.5 border-b border-border shrink-0">
		{#if !collapsed}
			<a href="/dashboard" class="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
				<img src="/images/logo.png" alt="SnippetVault" class="h-5 w-auto" />
				<span class="font-semibold text-foreground text-[11px] tracking-tight">SnippetVault</span>
			</a>
		{:else}
			<a href="/dashboard" class="hover:opacity-80 transition-opacity">
				<img src="/images/logo.png" alt="SnippetVault" class="h-5 w-auto" />
			</a>
		{/if}
		{#if !collapsed}
			<button
				onclick={onToggle}
				class="p-0.5 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
				title={localeStore.t('sidebar.collapse')}
			>
				<ChevronLeft size={12} />
			</button>
		{/if}
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto py-0.5">
		{#if !collapsed}
			<!-- Quick links -->
			<div class="px-0.5">
				<a
					href="/dashboard"
					class="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] {isActive('/dashboard')
						? 'bg-accent/10 text-accent'
						: 'text-muted hover:text-foreground hover:bg-background/70'} transition-colors"
				>
					<LayoutDashboard size={14} strokeWidth={1.5} />
					<span>{localeStore.t('sidebar.snippets')}</span>
				</a>
				<a
					href="/search"
					class="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] text-muted hover:text-foreground hover:bg-background/70 transition-colors"
				>
					<Search size={14} strokeWidth={1.5} />
					<span>{localeStore.t('sidebar.search')}</span>
				</a>
			</div>

			<!-- Favorites section -->
			{#if favoriteSnippets.length > 0}
				<div class="mt-1 pt-1 border-t border-border/40">
					<div class="px-1.5 py-1">
						<span class="text-[9px] text-muted/60 tracking-wide flex items-center gap-1">
							<Star size={9} class="fill-yellow-500 text-yellow-500" />
							{localeStore.t('sidebar.favorites')}
						</span>
					</div>
					<div class="px-0.5">
						{#each favoriteSnippets as snippet (snippet.id)}
							<a
								href="/snippets/{snippet.id}"
								class="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] {isSnippetActive(snippet.id)
									? 'bg-accent/10 text-accent'
									: 'text-muted hover:text-foreground hover:bg-background/70'} transition-colors"
							>
								<Star size={12} strokeWidth={1.5} class="shrink-0 text-yellow-500 fill-yellow-500" />
								<span class="truncate">{snippet.title}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Collections header -->
			<div class="px-1.5 py-1 mt-1 flex items-center justify-between">
				<span class="text-[9px] text-muted/60 tracking-wide">{localeStore.t('sidebar.collections')}</span>
				<button
					onclick={onCreateCollection}
					class="p-0.5 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
					title={localeStore.t('sidebar.newCollection')}
				>
					<FolderPlus size={11} strokeWidth={1.5} />
				</button>
			</div>

			<!-- Collections tree -->
			<div class="px-0.5">
				{#if collections.length === 0}
					<p class="px-1.5 py-1.5 text-[10px] text-muted italic">{localeStore.t('sidebar.noCollections')}</p>
				{:else}
					<CollectionTree {collections} {isCollectionActive} />
				{/if}
			</div>

			<!-- Shared collections -->
			{#if sharedCollections.length > 0}
				<div class="mt-2 pt-1 border-t border-border/40">
					<div class="px-1.5 py-1">
						<span class="text-[9px] text-muted/60 tracking-wide">{localeStore.t('sidebar.shared')}</span>
					</div>
					<div class="px-0.5">
						{#each sharedCollections as collection (collection.id)}
							<a
								href="/collections/{collection.id}"
								class="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] {isCollectionActive(
									collection.id
								)
									? 'bg-accent/10 text-accent'
									: 'text-muted hover:text-foreground hover:bg-background/70'} transition-colors group"
								title="{collection.ownerName} - {collection.permission === 'read'
									? localeStore.t('sidebar.readOnly')
									: localeStore.t('sidebar.readWrite')}"
							>
								{#if collection.icon}
									<span class="text-[11px]">{collection.icon}</span>
								{:else}
									<Users size={14} strokeWidth={1.5} class="shrink-0" />
								{/if}
								<span class="truncate flex-1">{collection.name}</span>
								{#if collection.permission === 'read'}
									<Eye size={10} class="text-muted/40 shrink-0" />
								{/if}
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<!-- Collapsed state - icons only -->
			<div class="flex flex-col items-center gap-0.5 px-0.5 pt-0.5">
				<a
					href="/dashboard"
					class="p-1.5 rounded {isActive('/dashboard')
						? 'bg-accent/10 text-accent'
						: 'text-muted hover:text-foreground hover:bg-background/70'} transition-colors"
					title={localeStore.t('sidebar.snippets')}
				>
					<LayoutDashboard size={15} strokeWidth={1.5} />
				</a>
				<a
					href="/search"
					class="p-1.5 rounded text-muted hover:text-foreground hover:bg-background/70 transition-colors"
					title={localeStore.t('sidebar.search')}
				>
					<Search size={15} strokeWidth={1.5} />
				</a>
				{#if favoriteSnippets.length > 0}
					<div class="w-5 h-px bg-border/40 my-0.5"></div>
					<span class="p-1.5 text-yellow-500" title="{localeStore.t('sidebar.favorites')} ({favoriteSnippets.length})">
						<Star size={15} strokeWidth={1.5} class="fill-yellow-500" />
					</span>
				{/if}
				<div class="w-5 h-px bg-border/40 my-0.5"></div>
				<button
					onclick={onCreateCollection}
					class="p-1.5 rounded text-muted hover:text-foreground hover:bg-background/70 transition-colors"
					title={localeStore.t('sidebar.newCollection')}
				>
					<FolderPlus size={15} strokeWidth={1.5} />
				</button>
				{#if sharedCollections.length > 0}
					<div class="w-5 h-px bg-border/40 my-0.5"></div>
					<span class="p-1.5 text-muted" title={localeStore.t('sidebar.sharedCollections')}>
						<Users size={15} strokeWidth={1.5} />
					</span>
				{/if}
			</div>
			<!-- Expand button at bottom -->
			<div class="mt-auto pb-1 flex justify-center">
				<button
					onclick={onToggle}
					class="p-1 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
					title={localeStore.t('sidebar.expand')}
				>
					<ChevronRight size={12} />
				</button>
			</div>
		{/if}
	</nav>

	<!-- Settings -->
	{#if !collapsed}
		<div class="px-0.5 py-0.5 border-t border-border/40">
			<a
				href="/settings"
				class="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] text-muted hover:text-foreground hover:bg-background/70 transition-colors"
			>
				<Settings size={14} strokeWidth={1.5} />
				<span>{localeStore.t('sidebar.settings')}</span>
			</a>
		</div>
	{/if}
</aside>
