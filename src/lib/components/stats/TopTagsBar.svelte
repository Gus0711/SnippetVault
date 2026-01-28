<script lang="ts">
	interface TagStat {
		id: string;
		name: string;
		color: string | null;
		count: number;
	}

	interface Props {
		data: TagStat[];
	}

	let { data }: Props = $props();

	const maxCount = $derived(Math.max(...data.map((t) => t.count), 1));
</script>

{#if data.length === 0}
	<div class="text-center py-4 text-muted text-[11px]">Aucun tag</div>
{:else}
	<div class="space-y-1.5">
		{#each data as tag}
			{@const percentage = (tag.count / maxCount) * 100}
			<div class="flex items-center gap-2 text-[10px]">
				<!-- Tag dot -->
				<span
					class="w-2 h-2 rounded-full flex-shrink-0"
					style="background-color: {tag.color || '#6b7280'}"
				></span>

				<!-- Tag name -->
				<span class="text-foreground w-20 truncate" title={tag.name}>{tag.name}</span>

				<!-- Bar -->
				<div class="flex-1 h-2 bg-surface rounded overflow-hidden">
					<div
						class="h-full rounded transition-all duration-300"
						style="width: {percentage}%; background-color: {tag.color || 'var(--color-accent)'}"
					></div>
				</div>

				<!-- Count -->
				<span class="text-muted w-6 text-right">{tag.count}</span>
			</div>
		{/each}
	</div>
{/if}
