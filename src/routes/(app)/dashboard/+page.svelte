<script lang="ts">
	import SnippetTable from '$lib/components/SnippetTable.svelte';
	import { Plus, FileCode, Globe, FileText } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="p-4">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<div>
			<h1 class="text-lg font-semibold text-foreground">Snippets</h1>
		</div>
		<a
			href="/snippets/new"
			class="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent text-white rounded text-xs font-medium hover:opacity-90 transition-opacity"
		>
			<Plus size={14} />
			Nouveau
		</a>
	</div>

	<!-- Stats -->
	{#if data.stats.total > 0}
		<div class="flex items-center gap-4 mb-4 text-xs">
			<div class="flex items-center gap-1.5 text-muted">
				<FileCode size={14} />
				<span><strong class="text-foreground">{data.stats.total}</strong> total</span>
			</div>
			<div class="flex items-center gap-1.5 text-muted">
				<Globe size={14} class="text-accent" />
				<span><strong class="text-foreground">{data.stats.published}</strong> publiés</span>
			</div>
			<div class="flex items-center gap-1.5 text-muted">
				<FileText size={14} />
				<span><strong class="text-foreground">{data.stats.drafts}</strong> brouillons</span>
			</div>
		</div>
	{/if}

	<!-- Table -->
	{#if data.snippets.length === 0}
		<div class="bg-surface border border-border rounded-lg text-center py-12 px-4">
			<FileText size={40} class="mx-auto text-muted mb-3 opacity-50" />
			<p class="text-muted text-sm mb-4">Aucun snippet</p>
			<a
				href="/snippets/new"
				class="inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
			>
				<Plus size={14} />
				Créer un snippet
			</a>
		</div>
	{:else}
		<SnippetTable snippets={data.snippets} allTags={data.tags} />
	{/if}
</div>
