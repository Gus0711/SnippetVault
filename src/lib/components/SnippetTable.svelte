<script lang="ts">
	import type { Snippet, Collection, Tag } from '$lib/server/db/schema';
	import { goto, invalidateAll } from '$app/navigation';
	import { Search, Globe, FileText, ArrowUp, ArrowDown, Filter, X, Pin, Trash2, FolderInput, Tags, Check, Square, CheckSquare, Minus, Download } from 'lucide-svelte';
	import { getLanguageColor, formatLang } from '$lib/utils/colors';
	import { localeStore } from '$lib/stores/locale.svelte';

	interface SnippetWithRelations extends Snippet {
		collection?: Collection | null;
		tags?: (Tag | undefined)[];
		language?: string | null;
		searchContent?: string;
		isPinned?: boolean;
	}

	interface Props {
		snippets: SnippetWithRelations[];
		allTags?: Tag[];
		allCollections?: Collection[];
	}

	let { snippets, allTags = [], allCollections = [] }: Props = $props();

	// Selection state
	let selectedIds = $state<Set<string>>(new Set());
	let showMoveMenu = $state(false);
	let showTagMenu = $state(false);
	let actionInProgress = $state(false);

	// Selection count (allSelected/someSelected defined after filteredSnippets)
	const selectedCount = $derived(selectedIds.size);

	// Toggle single selection
	const toggleSelect = (id: string, e: Event) => {
		e.stopPropagation();
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedIds = newSet;
	};

	// Toggle all selection
	const toggleSelectAll = () => {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredSnippets().map((s) => s.id));
		}
	};

	// Clear selection
	const clearSelection = () => {
		selectedIds = new Set();
		showMoveMenu = false;
		showTagMenu = false;
	};

	// Bulk delete
	const bulkDelete = async () => {
		if (selectedCount === 0) return;
		const confirmed = confirm(localeStore.t(selectedCount > 1 ? 'table.confirmDelete' : 'table.confirmDelete', { count: selectedCount, plural: selectedCount > 1 ? 's' : '' }));
		if (!confirmed) return;

		actionInProgress = true;
		try {
			const promises = Array.from(selectedIds).map((id) =>
				fetch(`/api/snippets/${id}`, { method: 'DELETE' })
			);
			await Promise.all(promises);
			clearSelection();
			invalidateAll();
		} catch (err) {
			console.error('Bulk delete failed:', err);
		} finally {
			actionInProgress = false;
		}
	};

	// Bulk move to collection
	const bulkMove = async (collectionId: string | null) => {
		if (selectedCount === 0) return;

		actionInProgress = true;
		try {
			const promises = Array.from(selectedIds).map((id) =>
				fetch(`/api/snippets/${id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ collectionId })
				})
			);
			await Promise.all(promises);
			clearSelection();
			invalidateAll();
		} catch (err) {
			console.error('Bulk move failed:', err);
		} finally {
			actionInProgress = false;
			showMoveMenu = false;
		}
	};

	// New tag input
	let newTagName = $state('');

	// Bulk add tag
	const bulkAddTag = async (tagId: string) => {
		if (selectedCount === 0) return;

		actionInProgress = true;
		try {
			const promises = Array.from(selectedIds).map((id) =>
				fetch(`/api/snippets/${id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ addTagId: tagId })
				})
			);
			await Promise.all(promises);
			clearSelection();
			invalidateAll();
		} catch (err) {
			console.error('Bulk tag failed:', err);
		} finally {
			actionInProgress = false;
			showTagMenu = false;
		}
	};

	// Create new tag and apply to selected snippets
	const createAndApplyTag = async () => {
		const name = newTagName.trim();
		if (!name || selectedCount === 0) return;

		actionInProgress = true;
		try {
			// Create the tag
			const createRes = await fetch('/api/user/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});

			if (!createRes.ok) {
				throw new Error('Failed to create tag');
			}

			const { data: newTag } = await createRes.json();

			// Apply to all selected snippets
			const promises = Array.from(selectedIds).map((id) =>
				fetch(`/api/snippets/${id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ addTagId: newTag.id })
				})
			);
			await Promise.all(promises);

			newTagName = '';
			clearSelection();
			invalidateAll();
		} catch (err) {
			console.error('Create tag failed:', err);
		} finally {
			actionInProgress = false;
			showTagMenu = false;
		}
	};

	// Bulk export
	const bulkExport = async () => {
		if (selectedCount === 0) return;

		actionInProgress = true;
		try {
			const ids = Array.from(selectedIds).join(',');
			const response = await fetch(`/api/export/snippets?ids=${ids}`);

			if (response.ok) {
				const blob = await response.blob();
				const contentDisposition = response.headers.get('content-disposition');
				const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
				const filename = filenameMatch ? filenameMatch[1] : 'snippets-export.zip';

				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch (err) {
			console.error('Bulk export failed:', err);
		} finally {
			actionInProgress = false;
		}
	};

	// Search
	let searchQuery = $state('');
	let searchInputRef: HTMLInputElement;

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

	// Toggle pin
	const togglePin = async (e: Event, snippetId: string) => {
		e.stopPropagation();
		try {
			const response = await fetch(`/api/snippets/${snippetId}/pin`, { method: 'PUT' });
			if (response.ok) {
				invalidateAll();
			}
		} catch (err) {
			console.error('Failed to toggle pin:', err);
		}
	};

	// Filtered and sorted snippets
	const filteredSnippets = $derived(() => {
		let result = [...snippets];

		// Search filter
		const query = searchQuery.toLowerCase().trim();
		if (query) {
			result = result.filter(
				(s) =>
					s.title.toLowerCase().includes(query) ||
					(s.searchContent && s.searchContent.toLowerCase().includes(query))
			);
		}

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

		// Sort - pinned items always first, then by selected sort
		result.sort((a, b) => {
			// Pinned items first
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;

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

	// Selection derived states (must be after filteredSnippets)
	const allSelected = $derived(
		filteredSnippets().length > 0 && filteredSnippets().every((s) => selectedIds.has(s.id))
	);
	const someSelected = $derived(selectedCount > 0 && !allSelected);

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

	const clearSearch = () => {
		searchQuery = '';
	};

	const handleGlobalKeydown = (e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault();
			searchInputRef?.focus();
			searchInputRef?.select();
		}
		// Escape to clear selection
		if (e.key === 'Escape' && selectedCount > 0) {
			clearSelection();
		}
	};

	// Close dropdown menus when clicking outside
	const handleGlobalClick = () => {
		showMoveMenu = false;
		showTagMenu = false;
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const d = new Date(date);
		const diff = now.getTime() - d.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return localeStore.t('time.justNow');
		if (minutes < 60) return localeStore.t('time.minutesAgo', { count: minutes });
		if (hours < 24) return localeStore.t('time.hoursAgo', { count: hours });
		if (days === 1) return localeStore.t('time.yesterday');
		if (days < 7) return localeStore.t('time.daysAgo', { count: days });

		return d.toLocaleDateString(localeStore.locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' });
	};
</script>

<svelte:window onkeydown={handleGlobalKeydown} onclick={handleGlobalClick} />

<div class="border border-border rounded overflow-hidden">
	<!-- Bulk actions bar -->
	{#if selectedCount > 0}
		<div class="px-3 py-2 border-b border-border bg-accent/10 flex items-center gap-3">
			<button
				onclick={clearSelection}
				class="p-1 text-muted hover:text-foreground transition-colors"
				title={localeStore.t('table.deselect')}
			>
				<X size={14} />
			</button>
			<span class="text-sm font-medium text-accent">
				{localeStore.t(selectedCount > 1 ? 'table.selectedPlural' : 'table.selected', { count: selectedCount })}
			</span>

			<div class="flex-1"></div>

			<!-- Move to collection -->
			<div class="relative">
				<button
					onclick={(e) => { e.stopPropagation(); showMoveMenu = !showMoveMenu; showTagMenu = false; }}
					disabled={actionInProgress}
					class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded hover:border-accent/50 transition-colors disabled:opacity-50"
				>
					<FolderInput size={14} />
					{localeStore.t('table.move')}
				</button>
				{#if showMoveMenu}
					<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
					<div
						class="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg py-1 w-52 z-50 max-h-56 overflow-y-auto"
						onclick={(e) => e.stopPropagation()}
					>
						<button
							onclick={() => bulkMove(null)}
							class="w-full px-3 py-2 text-left text-sm hover:bg-surface transition-colors text-muted"
						>
							{localeStore.t('table.noCollection')}
						</button>
						{#each allCollections as collection (collection.id)}
							<button
								onclick={() => bulkMove(collection.id)}
								class="w-full px-3 py-2 text-left text-sm hover:bg-surface transition-colors text-foreground truncate"
							>
								{collection.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Add tag -->
			<div class="relative">
				<button
					onclick={(e) => { e.stopPropagation(); showTagMenu = !showTagMenu; showMoveMenu = false; }}
					disabled={actionInProgress}
					class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded hover:border-accent/50 transition-colors disabled:opacity-50"
				>
					<Tags size={14} />
					{localeStore.t('table.addTag')}
				</button>
				{#if showTagMenu}
					<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
					<div
						class="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg py-1 w-56 z-50"
						onclick={(e) => e.stopPropagation()}
					>
						<!-- Create new tag -->
						<div class="px-3 py-2 border-b border-border">
							<form
								onsubmit={(e) => { e.preventDefault(); createAndApplyTag(); }}
								class="flex gap-2"
							>
								<input
									type="text"
									bind:value={newTagName}
									placeholder={localeStore.t('table.newTagPlaceholder')}
									class="flex-1 px-2 py-1.5 bg-surface border border-border rounded text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent min-w-0"
								/>
								<button
									type="submit"
									disabled={!newTagName.trim() || actionInProgress}
									class="px-3 py-1.5 bg-accent text-white rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
								>
									+
								</button>
							</form>
						</div>
						<!-- Existing tags -->
						<div class="max-h-44 overflow-y-auto">
							{#if allTags.length === 0}
								<div class="px-3 py-2 text-sm text-muted">{localeStore.t('table.noExistingTags')}</div>
							{:else}
								{#each allTags as tag (tag.id)}
									<button
										onclick={() => bulkAddTag(tag.id)}
										class="w-full px-3 py-2 text-left text-sm hover:bg-surface transition-colors flex items-center gap-2"
									>
										<span
											class="w-2.5 h-2.5 rounded-full shrink-0"
											style={tag.color ? `background-color: ${tag.color}` : 'background-color: var(--muted)'}
										></span>
										<span class="text-foreground truncate">{tag.name}</span>
									</button>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Export -->
			<button
				onclick={bulkExport}
				disabled={actionInProgress}
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded hover:border-accent/50 transition-colors disabled:opacity-50"
			>
				<Download size={14} />
				{localeStore.t('table.export')}
			</button>

			<!-- Delete -->
			<button
				onclick={bulkDelete}
				disabled={actionInProgress}
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
			>
				<Trash2 size={14} />
				{localeStore.t('table.delete')}
			</button>
		</div>
	{/if}

	<!-- Header with search -->
	<div class="px-3 py-2 border-b border-border bg-surface flex items-center gap-3">
		<!-- Search input -->
		<div class="relative flex-1 max-w-[240px]">
			<Search size={14} class="absolute left-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
			<input
				bind:this={searchInputRef}
				bind:value={searchQuery}
				type="text"
				placeholder={localeStore.t('table.search')}
				class="w-full pl-8 pr-8 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
			/>
			{#if searchQuery}
				<button
					onclick={clearSearch}
					class="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
				>
					<X size={14} />
				</button>
			{:else}
				<kbd class="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-surface border border-border rounded text-[10px] text-muted hidden sm:block">
					^K
				</kbd>
			{/if}
		</div>

		<!-- Count -->
		<span class="text-xs text-muted tabular-nums">
			{localeStore.t(filteredSnippets().length !== 1 ? 'table.snippetsCount' : 'table.snippetCount', { count: filteredSnippets().length })}
		</span>

		<div class="flex-1"></div>

		<!-- Filters -->
		<div class="flex items-center gap-2">
			{#if activeFiltersCount > 0}
				<button
					onclick={clearFilters}
					class="px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
				>
					{localeStore.t('table.clear')}
				</button>
			{/if}
			<button
				onclick={() => (showFilters = !showFilters)}
				class="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors {showFilters || activeFiltersCount > 0
					? 'border-accent/40 text-accent bg-accent/5'
					: 'border-transparent text-muted hover:text-foreground'}"
			>
				<Filter size={14} />
				{#if activeFiltersCount > 0}
					<span class="w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-medium">
						{activeFiltersCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Filters bar -->
	{#if showFilters}
		<div class="px-3 py-2 border-b border-border bg-background/50 flex items-center gap-4 text-xs">
			<!-- Status -->
			<label class="flex items-center gap-2">
				<span class="text-muted uppercase tracking-wide text-[10px]">{localeStore.t('table.status')}</span>
				<select
					bind:value={statusFilter}
					class="bg-surface border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-accent"
				>
					<option value="all">{localeStore.t('table.all')}</option>
					<option value="draft">{localeStore.t('table.drafts')}</option>
					<option value="published">{localeStore.t('table.publishedFilter')}</option>
				</select>
			</label>

			<!-- Tags -->
			{#if usedTags().length > 0}
				<label class="flex items-center gap-2">
					<span class="text-muted uppercase tracking-wide text-[10px]">Tag</span>
					<select
						bind:value={tagFilter}
						class="bg-surface border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-accent"
					>
						<option value={null}>{localeStore.t('table.all')}</option>
						{#each usedTags() as tag (tag.id)}
							<option value={tag.id}>{tag.name}</option>
						{/each}
					</select>
				</label>
			{/if}

			<!-- Language -->
			{#if languages.length > 0}
				<label class="flex items-center gap-2">
					<span class="text-muted uppercase tracking-wide text-[10px]">Lang</span>
					<select
						bind:value={languageFilter}
						class="bg-surface border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-accent font-mono"
					>
						<option value={null}>{localeStore.t('table.all')}</option>
						{#each languages as lang}
							<option value={lang}>{lang}</option>
						{/each}
					</select>
				</label>
			{/if}
		</div>
	{/if}

	<!-- Table -->
	{#if filteredSnippets().length === 0}
		<div class="text-center py-8">
			<FileText size={32} class="mx-auto text-muted mb-2 opacity-40" />
			<p class="text-sm text-muted">
				{searchQuery.trim() || activeFiltersCount > 0 ? localeStore.t('table.noResults') : localeStore.t('table.noSnippets')}
			</p>
		</div>
	{:else}
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-surface/50">
					<!-- Checkbox column -->
					<th class="w-10 px-3">
						<button
							onclick={toggleSelectAll}
							class="p-0.5 text-muted hover:text-foreground transition-colors"
							title={allSelected ? localeStore.t('table.deselectAll') : localeStore.t('table.selectAll')}
						>
							{#if allSelected}
								<CheckSquare size={16} class="text-accent" />
							{:else if someSelected}
								<Minus size={16} class="text-accent" />
							{:else}
								<Square size={16} />
							{/if}
						</button>
					</th>
					<th class="font-normal text-muted/70 text-left">
						<button
							onclick={() => toggleSort('title')}
							class="flex items-center gap-1 px-3 py-2 hover:text-foreground transition-colors w-full"
						>
							{localeStore.t('table.title')}
							{#if sortKey === 'title'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
					<th class="font-medium text-muted text-left w-24">
						<button
							onclick={() => toggleSort('language')}
							class="flex items-center gap-1 px-3 py-2 hover:text-foreground transition-colors"
						>
							Lang
							{#if sortKey === 'language'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
					<th class="font-normal text-muted/70 text-left px-3 py-2 w-36">{localeStore.t('table.tags')}</th>
					<th class="font-medium text-muted text-left w-20">
						<button
							onclick={() => toggleSort('updatedAt')}
							class="flex items-center gap-1 px-3 py-2 hover:text-foreground transition-colors"
						>
							{localeStore.t('table.modified')}
							{#if sortKey === 'updatedAt'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
					<th class="font-medium text-muted text-left w-20">
						<button
							onclick={() => toggleSort('status')}
							class="flex items-center gap-1 px-3 py-2 hover:text-foreground transition-colors"
						>
							{localeStore.t('table.statusCol')}
							{#if sortKey === 'status'}
								{#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
							{/if}
						</button>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border/50">
				{#each filteredSnippets() as snippet (snippet.id)}
					<tr
						onclick={() => goto(`/snippets/${snippet.id}`)}
						class="hover:bg-surface/50 cursor-pointer transition-colors group {selectedIds.has(snippet.id) ? 'bg-accent/5' : ''}"
					>
						<!-- Checkbox -->
						<td class="px-3 py-2.5">
							<button
								onclick={(e) => toggleSelect(snippet.id, e)}
								class="p-0.5 text-muted hover:text-foreground transition-colors"
							>
								{#if selectedIds.has(snippet.id)}
									<CheckSquare size={16} class="text-accent" />
								{:else}
									<Square size={16} class="opacity-30 group-hover:opacity-100" />
								{/if}
							</button>
						</td>
						<!-- Title -->
						<td class="px-3 py-2.5">
							<div class="flex items-center gap-2">
								<!-- Pin button -->
								<button
									onclick={(e) => togglePin(e, snippet.id)}
									class="p-0.5 rounded transition-colors shrink-0 {snippet.isPinned
										? 'text-accent'
										: 'text-transparent group-hover:text-muted/40 hover:!text-accent'}"
									title={snippet.isPinned ? localeStore.t('table.unpin') : localeStore.t('table.pin')}
								>
									<Pin size={14} class={snippet.isPinned ? 'fill-current' : ''} />
								</button>
								<span class="text-foreground font-medium truncate max-w-[300px]">
									{snippet.title}
								</span>
								{#if snippet.collection}
									<span class="text-xs text-muted/70 truncate max-w-[120px]">
										{snippet.collection.name}
									</span>
								{/if}
							</div>
						</td>

						<!-- Language -->
						<td class="px-3 py-2.5">
							{#if snippet.language}
								{@const langColor = getLanguageColor(snippet.language)}
								<span
									class="px-1.5 py-0.5 text-xs font-mono rounded"
									style="background-color: {langColor}15; color: {langColor}; border: 1px solid {langColor}30"
								>
									{formatLang(snippet.language)}
								</span>
							{:else}
								<span class="text-muted/30">-</span>
							{/if}
						</td>

						<!-- Tags -->
						<td class="px-3 py-2.5">
							{#if snippet.tags && snippet.tags.filter(Boolean).length > 0}
								<div class="flex items-center gap-1 flex-wrap">
									{#each snippet.tags.filter((t): t is Tag => t !== undefined).slice(0, 2) as tag (tag.id)}
										<span
											class="px-1.5 py-0.5 rounded text-xs"
											style={tag.color
												? `background-color: ${tag.color}12; color: ${tag.color}`
												: 'background-color: var(--sf); color: var(--tx-muted)'}
										>
											{tag.name}
										</span>
									{/each}
									{#if snippet.tags.filter(Boolean).length > 2}
										<span class="text-xs text-muted/50">+{snippet.tags.filter(Boolean).length - 2}</span>
									{/if}
								</div>
							{:else}
								<span class="text-muted/30">-</span>
							{/if}
						</td>

						<!-- Updated -->
						<td class="px-3 py-2.5 text-muted tabular-nums">
							{formatDate(snippet.updatedAt)}
						</td>

						<!-- Status -->
						<td class="px-3 py-2.5">
							{#if snippet.status === 'published'}
								<span class="flex items-center gap-1 text-xs text-accent">
									<Globe size={12} />
									{localeStore.t('table.published')}
								</span>
							{:else}
								<span class="text-xs text-muted/50">{localeStore.t('table.draft')}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
