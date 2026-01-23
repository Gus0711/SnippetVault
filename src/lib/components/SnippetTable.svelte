<script lang="ts">
	import type { Snippet, Collection, Tag } from '$lib/server/db/schema';
	import { goto } from '$app/navigation';
	import { Globe, FileText, ArrowUp, ArrowDown, Filter, X } from 'lucide-svelte';

	interface SnippetWithRelations extends Snippet {
		collection?: Collection | null;
		tags?: (Tag | undefined)[];
		language?: string | null;
	}

	interface Props {
		snippets: SnippetWithRelations[];
		allTags?: Tag[];
	}

	let { snippets, allTags = [] }: Props = $props();

	// Filters
	let statusFilter = $state<'all' | 'draft' | 'published'>('all');
	let tagFilter = $state<string | null>(null);
	let languageFilter = $state<string | null>(null);
	let showFilters = $state(false);

	// Sorting
	type SortKey = 'title' | 'language' | 'updatedAt' | 'status';
	let sortKey = $state<SortKey>('updatedAt');
	let sortDir = $state<'asc' | 'desc'>('desc');

	// Unique languages from snippets
	const languages = $derived([...new Set(snippets.map((s) => s.language).filter(Boolean))].sort());

	// Unique tags from snippets
	const usedTags = $derived(() => {
		const tagIds = new Set(snippets.flatMap((s) => s.tags?.map((t) => t?.id) || []));
		return allTags.filter((t) => tagIds.has(t.id));
	});

	// Filtered and sorted snippets
	const filteredSnippets = $derived(() => {
		let result = [...snippets];

		// Status filter
		if (statusFilter !== 'all') {
			result = result.filter((s) => s.status === statusFilter);
		}

		// Tag filter
		if (tagFilter) {
			result = result.filter((s) => s.tags?.some((t) => t?.id === tagFilter));
		}

		// Language filter
		if (languageFilter) {
			result = result.filter((s) => s.language === languageFilter);
		}

		// Sort
		result.sort((a, b) => {
			let cmp = 0;
			switch (sortKey) {
				case 'title':
					cmp = a.title.localeCompare(b.title);
					break;
				case 'language':
					cmp = (a.language || '').localeCompare(b.language || '');
					break;
				case 'updatedAt':
					cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
					break;
				case 'status':
					cmp = a.status.localeCompare(b.status);
					break;
			}
			return sortDir === 'asc' ? cmp : -cmp;
		});

		return result;
	});

	const activeFiltersCount = $derived(
		(statusFilter !== 'all' ? 1 : 0) + (tagFilter ? 1 : 0) + (languageFilter ? 1 : 0)
	);

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'updatedAt' ? 'desc' : 'asc';
		}
	};

	const clearFilters = () => {
		statusFilter = 'all';
		tagFilter = null;
		languageFilter = null;
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const d = new Date(date);
		const diff = now.getTime() - d.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return "à l'instant";
		if (minutes < 60) return `il y a ${minutes}min`;
		if (hours < 24) return `il y a ${hours}h`;
		if (days === 1) return 'hier';
		if (days < 7) return `il y a ${days}j`;

		return d.toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short'
		});
	};

	const SortIcon = (key: SortKey) => {
		if (sortKey !== key) return null;
		return sortDir === 'asc' ? ArrowUp : ArrowDown;
	};
</script>

<div class="bg-surface border border-border rounded-lg overflow-hidden">
	<!-- Header -->
	<div class="px-3 py-2 border-b border-border flex items-center justify-between gap-4">
		<span class="text-xs text-muted">
			{filteredSnippets().length} snippet{filteredSnippets().length !== 1 ? 's' : ''}
			{#if activeFiltersCount > 0}
				<span class="text-foreground/60">
					(filtré{filteredSnippets().length !== snippets.length ? ` sur ${snippets.length}` : ''})
				</span>
			{/if}
		</span>

		<div class="flex items-center gap-2">
			{#if activeFiltersCount > 0}
				<button
					onclick={clearFilters}
					class="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-muted hover:text-foreground transition-colors"
				>
					<X size={10} />
					Effacer
				</button>
			{/if}
			<button
				onclick={() => (showFilters = !showFilters)}
				class="flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors {showFilters ||
				activeFiltersCount > 0
					? 'border-accent/50 text-accent bg-accent/5'
					: 'border-border text-muted hover:text-foreground hover:border-foreground/20'}"
			>
				<Filter size={12} />
				Filtres
				{#if activeFiltersCount > 0}
					<span
						class="w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center"
					>
						{activeFiltersCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Filters bar -->
	{#if showFilters}
		<div class="px-3 py-2 border-b border-border bg-background/50 flex items-center gap-3">
			<!-- Status -->
			<div class="flex items-center gap-1.5">
				<span class="text-[10px] text-muted uppercase tracking-wide">Statut</span>
				<select
					bind:value={statusFilter}
					class="text-xs bg-surface border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
				>
					<option value="all">Tous</option>
					<option value="draft">Brouillons</option>
					<option value="published">Publiés</option>
				</select>
			</div>

			<!-- Tags -->
			{#if usedTags().length > 0}
				<div class="flex items-center gap-1.5">
					<span class="text-[10px] text-muted uppercase tracking-wide">Tag</span>
					<select
						bind:value={tagFilter}
						class="text-xs bg-surface border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
					>
						<option value={null}>Tous</option>
						{#each usedTags() as tag (tag.id)}
							<option value={tag.id}>{tag.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Language -->
			{#if languages.length > 0}
				<div class="flex items-center gap-1.5">
					<span class="text-[10px] text-muted uppercase tracking-wide">Langage</span>
					<select
						bind:value={languageFilter}
						class="text-xs bg-surface border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono"
					>
						<option value={null}>Tous</option>
						{#each languages as lang}
							<option value={lang}>{lang}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Table -->
	{#if filteredSnippets().length === 0}
		<div class="text-center py-8">
			<FileText size={32} class="mx-auto text-muted mb-2 opacity-50" />
			<p class="text-sm text-muted">
				{snippets.length === 0 ? 'Aucun snippet' : 'Aucun résultat'}
			</p>
		</div>
	{:else}
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border text-left">
					<th class="font-medium text-muted">
						<button
							onclick={() => toggleSort('title')}
							class="flex items-center gap-1 px-3 py-2 hover:text-foreground transition-colors w-full"
						>
							Titre
							{#if sortKey === 'title'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
					<th class="font-medium text-muted w-24">
						<button
							onclick={() => toggleSort('language')}
							class="flex items-center gap-1 px-2 py-2 hover:text-foreground transition-colors"
						>
							Langage
							{#if sortKey === 'language'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
					<th class="font-medium text-muted px-2 py-2">Tags</th>
					<th class="font-medium text-muted w-24">
						<button
							onclick={() => toggleSort('updatedAt')}
							class="flex items-center gap-1 px-2 py-2 hover:text-foreground transition-colors"
						>
							Modifié
							{#if sortKey === 'updatedAt'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
					<th class="font-medium text-muted w-16">
						<button
							onclick={() => toggleSort('status')}
							class="flex items-center gap-1 px-2 py-2 hover:text-foreground transition-colors"
						>
							Statut
							{#if sortKey === 'status'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredSnippets() as snippet (snippet.id)}
					<tr
						onclick={() => goto(`/snippets/${snippet.id}`)}
						class="border-b border-border/50 last:border-b-0 hover:bg-background/50 cursor-pointer transition-colors"
					>
						<!-- Title -->
						<td class="px-3 py-2">
							<div class="flex items-center gap-2">
								<span class="text-foreground font-medium truncate max-w-[300px]">
									{snippet.title}
								</span>
								{#if snippet.collection}
									<span class="text-[10px] text-muted truncate max-w-[120px]">
										{snippet.collection.name}
									</span>
								{/if}
							</div>
						</td>

						<!-- Language -->
						<td class="px-2 py-2">
							{#if snippet.language}
								<span
									class="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-background rounded text-muted"
								>
									{snippet.language}
								</span>
							{:else}
								<span class="text-muted/50">-</span>
							{/if}
						</td>

						<!-- Tags -->
						<td class="px-2 py-2">
							{#if snippet.tags && snippet.tags.filter(Boolean).length > 0}
								<div class="flex items-center gap-1 flex-wrap">
									{#each snippet.tags.filter((t): t is Tag => t !== undefined).slice(0, 3) as tag (tag.id)}
										<span
											class="px-1.5 py-0.5 rounded text-[10px] bg-background text-muted"
											style={tag.color
												? `background-color: ${tag.color}15; color: ${tag.color}`
												: ''}
										>
											{tag.name}
										</span>
									{/each}
									{#if snippet.tags.filter(Boolean).length > 3}
										<span class="text-[10px] text-muted">
											+{snippet.tags.filter(Boolean).length - 3}
										</span>
									{/if}
								</div>
							{:else}
								<span class="text-muted/50">-</span>
							{/if}
						</td>

						<!-- Updated -->
						<td class="px-2 py-2 text-xs text-muted whitespace-nowrap">
							{formatDate(snippet.updatedAt)}
						</td>

						<!-- Status -->
						<td class="px-2 py-2">
							{#if snippet.status === 'published'}
								<span class="flex items-center gap-1 text-[10px] text-accent">
									<Globe size={10} />
									Publié
								</span>
							{:else}
								<span class="text-[10px] text-muted/70">Brouillon</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
