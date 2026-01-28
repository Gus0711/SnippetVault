<script lang="ts">
	import { FileCode, Globe, Star, FolderOpen } from 'lucide-svelte';

	interface Props {
		stats: {
			total: number;
			published: number;
			favorites: number;
			collections: number;
		};
	}

	let { stats }: Props = $props();
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
	<div class="border border-border rounded p-2.5 bg-surface/50">
		<div class="flex items-center gap-2">
			<div class="p-1.5 rounded bg-accent/10">
				<FileCode size={14} strokeWidth={1.5} class="text-accent" />
			</div>
			<div>
				<div class="text-lg font-semibold text-foreground leading-none">{stats.total}</div>
				<div class="text-[10px] text-muted mt-0.5">Snippets</div>
			</div>
		</div>
	</div>

	<div class="border border-border rounded p-2.5 bg-surface/50">
		<div class="flex items-center gap-2">
			<div class="p-1.5 rounded bg-green-500/10">
				<Globe size={14} strokeWidth={1.5} class="text-green-500" />
			</div>
			<div>
				<div class="text-lg font-semibold text-foreground leading-none">{stats.published}</div>
				<div class="text-[10px] text-muted mt-0.5">Publies</div>
			</div>
		</div>
	</div>

	<div class="border border-border rounded p-2.5 bg-surface/50">
		<div class="flex items-center gap-2">
			<div class="p-1.5 rounded bg-yellow-500/10">
				<Star size={14} strokeWidth={1.5} class="text-yellow-500" />
			</div>
			<div>
				<div class="text-lg font-semibold text-foreground leading-none">{stats.favorites}</div>
				<div class="text-[10px] text-muted mt-0.5">Favoris</div>
			</div>
		</div>
	</div>

	<div class="border border-border rounded p-2.5 bg-surface/50">
		<div class="flex items-center gap-2">
			<div class="p-1.5 rounded bg-purple-500/10">
				<FolderOpen size={14} strokeWidth={1.5} class="text-purple-500" />
			</div>
			<div>
				<div class="text-lg font-semibold text-foreground leading-none">{stats.collections}</div>
				<div class="text-[10px] text-muted mt-0.5">Collections</div>
			</div>
		</div>
	</div>
</div>
