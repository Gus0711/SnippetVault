<script lang="ts">
	import { Search, X, Filter, Folder, Tag, FileText, Globe, Loader2 } from 'lucide-svelte';
	import { getLanguageColor } from '$lib/utils/colors';
	import { localeStore } from '$lib/stores/locale.svelte';

	let { data } = $props();

	let query = $state('');
	let collectionFilter = $state('');
	let tagFilter = $state('');
	let statusFilter = $state('');
	let results = $state<any[]>([]);
	let searching = $state(false);
	let searched = $state(false);
	let showFilters = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout>;

	const search = async () => {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (collectionFilter) params.set('collection', collectionFilter);
		if (tagFilter) params.set('tag', tagFilter);
		if (statusFilter) params.set('status', statusFilter);

		if (!params.toString()) {
			results = [];
			searched = false;
			return;
		}

		searching = true;
		try {
			const response = await fetch(`/api/search?${params}`);
			const json = await response.json();
			results = json.data || [];
			searched = true;
		} catch (e) {
			console.error('Search failed:', e);
			results = [];
		} finally {
			searching = false;
		}
	};

	const debouncedSearch = () => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(search, 300);
	};

	const clearFilters = () => {
		query = '';
		collectionFilter = '';
		tagFilter = '';
		statusFilter = '';
		results = [];
		searched = false;
	};

	const hasFilters = $derived(!!collectionFilter || !!tagFilter || !!statusFilter);

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString(localeStore.locale === 'en' ? 'en-US' : 'fr-FR', {
			day: 'numeric',
			month: 'short'
		});
	};
</script>

<div class="p-3">
	<!-- Header -->
	<div class="mb-3">
		<h1 class="text-sm font-semibold text-foreground mb-2">{localeStore.t('search.title')}</h1>

		<!-- Search input -->
		<div class="relative">
			<Search size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
			<input
				type="text"
				bind:value={query}
				oninput={debouncedSearch}
				placeholder={localeStore.t('search.placeholder')}
				class="w-full pl-8 pr-8 py-1.5 bg-surface border border-border rounded text-[11px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
			/>
			{#if query || hasFilters}
				<button
					onclick={clearFilters}
					class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
				>
					<X size={14} />
				</button>
			{/if}
		</div>

		<!-- Filter toggle -->
		<div class="flex items-center gap-2 mt-2">
			<button
				onclick={() => (showFilters = !showFilters)}
				class="flex items-center gap-1 px-2 py-1 text-[10px] border border-border rounded hover:bg-surface transition-colors {hasFilters
					? 'text-accent border-accent/50'
					: 'text-muted'}"
			>
				<Filter size={11} />
				{localeStore.t('search.filters')}
				{#if hasFilters}
					<span class="px-1 bg-accent/20 rounded text-[9px]">
						{[collectionFilter, tagFilter, statusFilter].filter(Boolean).length}
					</span>
				{/if}
			</button>
			{#if searching}
				<Loader2 size={12} class="animate-spin text-muted" />
			{/if}
		</div>

		<!-- Filters -->
		{#if showFilters}
			<div class="flex flex-wrap gap-2 mt-2 p-2 bg-surface border border-border rounded">
				<!-- Collection filter -->
				<div class="flex items-center gap-1">
					<Folder size={11} class="text-muted" />
					<select
						bind:value={collectionFilter}
						onchange={search}
						class="px-2 py-1 bg-background border border-border rounded text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
					>
						<option value="">{localeStore.t('search.allCollections')}</option>
						{#each data.collections as collection (collection.id)}
							<option value={collection.id}>
								{collection.icon || ''} {collection.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Tag filter -->
				<div class="flex items-center gap-1">
					<Tag size={11} class="text-muted" />
					<select
						bind:value={tagFilter}
						onchange={search}
						class="px-2 py-1 bg-background border border-border rounded text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
					>
						<option value="">{localeStore.t('search.allTags')}</option>
						{#each data.tags as tag (tag.id)}
							<option value={tag.name}>{tag.name}</option>
						{/each}
					</select>
				</div>

				<!-- Status filter -->
				<div class="flex items-center gap-1">
					<FileText size={11} class="text-muted" />
					<select
						bind:value={statusFilter}
						onchange={search}
						class="px-2 py-1 bg-background border border-border rounded text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
					>
						<option value="">{localeStore.t('search.allStatuses')}</option>
						<option value="draft">{localeStore.t('search.drafts')}</option>
						<option value="published">{localeStore.t('search.published')}</option>
					</select>
				</div>
			</div>
		{/if}
	</div>

	<!-- Results -->
	{#if results.length > 0}
		<div class="text-[10px] text-muted mb-2">
			{localeStore.t(results.length !== 1 ? 'search.resultsCount' : 'search.resultCount', { count: results.length })}
		</div>
		<div class="border border-border rounded overflow-hidden">
			<table class="w-full text-[11px]">
				<thead class="bg-surface border-b border-border">
					<tr>
						<th class="text-left px-2 py-1.5 font-medium text-muted">{localeStore.t('search.titleCol')}</th>
						<th class="text-left px-2 py-1.5 font-medium text-muted w-24">{localeStore.t('search.collection')}</th>
						<th class="text-left px-2 py-1.5 font-medium text-muted w-32">{localeStore.t('search.tags')}</th>
						<th class="text-left px-2 py-1.5 font-medium text-muted w-16">{localeStore.t('search.status')}</th>
						<th class="text-left px-2 py-1.5 font-medium text-muted w-16">{localeStore.t('search.date')}</th>
					</tr>
				</thead>
				<tbody>
					{#each results as snippet (snippet.id)}
						<tr class="border-b border-border/50 last:border-b-0 hover:bg-surface/50 transition-colors">
							<td class="px-2 py-1.5">
								<a
									href="/snippets/{snippet.id}"
									class="text-foreground hover:text-accent transition-colors font-medium"
								>
									{snippet.title}
								</a>
								{#if snippet.preview}
									<p class="text-[10px] text-muted truncate max-w-xs mt-0.5">
										{snippet.preview}
									</p>
								{/if}
							</td>
							<td class="px-2 py-1.5 text-muted">
								{#if snippet.collection}
									<span class="flex items-center gap-1 truncate">
										{#if snippet.collection.icon}
											<span class="text-[10px]">{snippet.collection.icon}</span>
										{/if}
										{snippet.collection.name}
									</span>
								{:else}
									<span class="text-muted/50">-</span>
								{/if}
							</td>
							<td class="px-2 py-1.5">
								{#if snippet.tags?.length > 0}
									<div class="flex flex-wrap gap-0.5">
										{#each snippet.tags.slice(0, 2) as tag (tag.id)}
											<span
												class="px-1 py-0.5 rounded text-[9px]"
												style={tag.color
													? `background-color: ${tag.color}15; color: ${tag.color}`
													: 'background-color: var(--sf); color: var(--tx-muted)'}
											>
												{tag.name}
											</span>
										{/each}
										{#if snippet.tags.length > 2}
											<span class="text-[9px] text-muted">+{snippet.tags.length - 2}</span>
										{/if}
									</div>
								{:else}
									<span class="text-muted/50">-</span>
								{/if}
							</td>
							<td class="px-2 py-1.5">
								{#if snippet.status === 'published'}
									<span class="flex items-center gap-0.5 text-accent">
										<Globe size={10} />
										<span class="text-[10px]">{localeStore.t('search.public')}</span>
									</span>
								{:else}
									<span class="text-muted text-[10px]">{localeStore.t('search.draft')}</span>
								{/if}
							</td>
							<td class="px-2 py-1.5 text-muted text-[10px]">
								{formatDate(snippet.updatedAt)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if searched && !searching}
		<div class="border border-border rounded text-center py-8 px-4">
			<Search size={28} class="mx-auto text-muted mb-2 opacity-40" />
			<p class="text-muted text-[11px]">{localeStore.t('search.noResults')}</p>
		</div>
	{:else}
		<div class="border border-border rounded text-center py-8 px-4">
			<Search size={28} class="mx-auto text-muted mb-2 opacity-40" />
			<p class="text-muted text-[11px]">{localeStore.t('search.typeToSearch')}</p>
			<p class="text-muted/60 text-[10px] mt-1">{localeStore.t('search.searchHint')}</p>
		</div>
	{/if}
</div>
