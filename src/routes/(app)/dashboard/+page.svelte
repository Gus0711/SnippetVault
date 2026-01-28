<script lang="ts">
	import SnippetTable from '$lib/components/SnippetTable.svelte';
	import StatsCards from '$lib/components/stats/StatsCards.svelte';
	import ActivityHeatmap from '$lib/components/stats/ActivityHeatmap.svelte';
	import LanguageDonut from '$lib/components/stats/LanguageDonut.svelte';
	import TopTagsBar from '$lib/components/stats/TopTagsBar.svelte';
	import { Plus, FileText } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="p-3">
	<!-- Header -->
	<div class="flex items-center justify-between mb-3">
		<h1 class="text-sm font-semibold text-foreground">Snippets</h1>
		<a
			href="/snippets/new"
			class="flex items-center gap-1 px-2 py-1 bg-accent/90 text-white rounded text-[11px] font-medium hover:bg-accent transition-colors"
		>
			<Plus size={11} strokeWidth={2} />
			Nouveau
		</a>
	</div>

	<!-- Stats Cards -->
	<StatsCards stats={data.stats} />

	<!-- Charts -->
	{#if data.stats.total > 0}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
			<!-- Heatmap (2 columns) -->
			<div class="lg:col-span-2 border border-border rounded p-3 bg-surface/30">
				<h3 class="text-[11px] font-medium text-muted mb-2">Activite</h3>
				<ActivityHeatmap data={data.activityData} />
			</div>

			<!-- Donut + Tags (1 column, stacked) -->
			<div class="space-y-3">
				<div class="border border-border rounded p-3 bg-surface/30">
					<h3 class="text-[11px] font-medium text-muted mb-2">Langages</h3>
					<LanguageDonut data={data.languageStats} />
				</div>
				<div class="border border-border rounded p-3 bg-surface/30">
					<h3 class="text-[11px] font-medium text-muted mb-2">Tags</h3>
					<TopTagsBar data={data.topTags} />
				</div>
			</div>
		</div>
	{/if}

	<!-- Table -->
	{#if data.snippets.length === 0}
		<div class="border border-border rounded text-center py-8 px-4">
			<FileText size={28} class="mx-auto text-muted mb-2 opacity-40" />
			<p class="text-muted text-[11px] mb-3">Aucun snippet</p>
			<a
				href="/snippets/new"
				class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/90 text-white rounded text-[11px] font-medium hover:bg-accent transition-colors"
			>
				<Plus size={11} />
				Creer un snippet
			</a>
		</div>
	{:else}
		<SnippetTable snippets={data.snippets} allTags={data.tags} allCollections={data.collections} />
	{/if}
</div>
