<script lang="ts">
	import type { Collection } from '$lib/server/db/schema';
	import { X, Folder } from 'lucide-svelte';

	interface Props {
		open: boolean;
		collections: Collection[];
		parentId?: string | null;
		onClose: () => void;
		onSubmit: (data: { name: string; icon?: string; parentId?: string | null }) => void;
	}

	let { open, collections, parentId = null, onClose, onSubmit }: Props = $props();

	let name = $state('');
	let icon = $state('');
	let selectedParentId = $state<string | null>(null);
	let loading = $state(false);

	// Reset form when opened
	$effect(() => {
		if (open) {
			name = '';
			icon = '';
			selectedParentId = parentId;
			loading = false;
		}
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!name.trim() || loading) return;

		loading = true;
		onSubmit({
			name: name.trim(),
			icon: icon.trim() || undefined,
			parentId: selectedParentId
		});
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	// Root collections for parent select
	const rootCollections = $derived(collections.filter((c) => c.parentId === null));

	// Build a flat list with indentation
	const buildFlatList = (
		cols: Collection[],
		parentId: string | null = null,
		level = 0
	): { collection: Collection; level: number }[] => {
		const result: { collection: Collection; level: number }[] = [];
		const children = cols.filter((c) => c.parentId === parentId);
		for (const child of children) {
			result.push({ collection: child, level });
			result.push(...buildFlatList(cols, child.id, level + 1));
		}
		return result;
	};

	const flatCollections = $derived(buildFlatList(collections));
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={onClose} role="presentation"></div>

	<!-- Modal -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-md"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Nouvelle collection</h2>
				<button
					onclick={onClose}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="p-4 space-y-4">
				<!-- Name -->
				<div>
					<label for="name" class="block text-sm font-medium text-foreground mb-1">Nom</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						required
						autofocus
						class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
						placeholder="Ma collection"
					/>
				</div>

				<!-- Icon (optional) -->
				<div>
					<label for="icon" class="block text-sm font-medium text-foreground mb-1">
						Icone <span class="text-muted font-normal">(optionnel)</span>
					</label>
					<div class="flex items-center gap-2">
						<input
							type="text"
							id="icon"
							bind:value={icon}
							maxlength="2"
							class="w-16 px-3 py-2 bg-surface border border-border rounded-md text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
							placeholder="📁"
						/>
						<span class="text-xs text-muted">Un emoji ou caractère</span>
					</div>
				</div>

				<!-- Parent collection -->
				<div>
					<label for="parent" class="block text-sm font-medium text-foreground mb-1">
						Collection parente <span class="text-muted font-normal">(optionnel)</span>
					</label>
					<select
						id="parent"
						bind:value={selectedParentId}
						class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
					>
						<option value={null}>Racine</option>
						{#each flatCollections as { collection, level } (collection.id)}
							<option value={collection.id}>
								{'─'.repeat(level)}{level > 0 ? ' ' : ''}{collection.icon || ''}{collection.icon
									? ' '
									: ''}{collection.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={onClose}
						class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						disabled={!name.trim() || loading}
						class="px-4 py-2 text-sm bg-accent text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
					>
						{loading ? 'Création...' : 'Créer'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
