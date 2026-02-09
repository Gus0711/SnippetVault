<script lang="ts">
	import type { Snippet, Collection, Tag } from '$lib/server/db/schema';
	import { FileCode, Globe, FileText, Clock } from 'lucide-svelte';
	import { localeStore } from '$lib/stores/locale.svelte';

	interface SnippetWithRelations extends Snippet {
		collection?: Collection | null;
		tags?: (Tag | undefined)[];
	}

	interface Props {
		snippets: SnippetWithRelations[];
		emptyMessage?: string;
		showCollection?: boolean;
	}

	let { snippets, emptyMessage = undefined, showCollection = true }: Props = $props();

	const formatDate = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			const hours = Math.floor(diff / (1000 * 60 * 60));
			if (hours === 0) {
				const minutes = Math.floor(diff / (1000 * 60));
				return minutes <= 1 ? localeStore.t('time.justNow') : localeStore.t('time.minutesAgo', { count: minutes });
			}
			return localeStore.t('time.hoursAgo', { count: hours });
		}
		if (days === 1) return localeStore.t('time.yesterday');
		if (days < 7) return localeStore.t('time.daysAgo', { count: days });

		return date.toLocaleDateString(localeStore.locale === 'en' ? 'en-US' : 'fr-FR', {
			day: 'numeric',
			month: 'short',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	};
</script>

{#if snippets.length === 0}
	<div class="text-center py-12">
		<FileText size={40} class="mx-auto text-muted mb-3 opacity-50" />
		<p class="text-muted text-sm">{emptyMessage || localeStore.t('snippetList.noSnippets')}</p>
	</div>
{:else}
	<div class="divide-y divide-border">
		{#each snippets as snippet (snippet.id)}
			<a
				href="/snippets/{snippet.id}"
				class="block px-4 py-3 hover:bg-surface/50 transition-colors"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<!-- Title -->
						<div class="flex items-center gap-2">
							<h3 class="font-medium text-foreground truncate">{snippet.title}</h3>
							{#if snippet.status === 'published'}
								<span title={localeStore.t('snippetList.published')}><Globe size={14} class="text-accent shrink-0" /></span>
							{/if}
						</div>

						<!-- Meta -->
						<div class="flex items-center gap-3 mt-1 text-xs text-muted">
							{#if showCollection && snippet.collection}
								<span class="flex items-center gap-1">
									<FileCode size={12} />
									{snippet.collection.name}
								</span>
							{/if}

							<span class="flex items-center gap-1">
								<Clock size={12} />
								{formatDate(snippet.updatedAt)}
							</span>

							{#if snippet.status === 'draft'}
								<span
									class="px-1.5 py-0.5 rounded bg-surface text-muted text-[10px] uppercase tracking-wide"
								>
									{localeStore.t('snippetList.draft')}
								</span>
							{/if}
						</div>

						<!-- Tags -->
						{#if snippet.tags && snippet.tags.filter(Boolean).length > 0}
							<div class="flex items-center gap-1.5 mt-2">
								{#each snippet.tags.filter((t): t is Tag => t !== undefined) as tag (tag.id)}
									<span
										class="px-1.5 py-0.5 rounded text-[11px] bg-surface text-muted"
										style={tag.color ? `background-color: ${tag.color}20; color: ${tag.color}` : ''}
									>
										{tag.name}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
