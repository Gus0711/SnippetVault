<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import SnippetList from '$lib/components/SnippetList.svelte';
	import {
		Plus,
		Folder,
		FolderOpen,
		ChevronRight,
		MoreHorizontal,
		Pencil,
		Trash2,
		X
	} from 'lucide-svelte';

	let { data } = $props();

	let menuOpen = $state(false);
	let renameModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let newName = $state('');

	const closeMenus = () => {
		menuOpen = false;
	};

	const openRename = () => {
		newName = data.collection.name;
		renameModalOpen = true;
		menuOpen = false;
	};

	const openDelete = () => {
		deleteModalOpen = true;
		menuOpen = false;
	};
</script>

<svelte:window onclick={closeMenus} />

<div class="p-6">
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-1 text-sm text-muted mb-4">
		<a href="/dashboard" class="hover:text-foreground transition-colors">Dashboard</a>
		{#each data.breadcrumb as crumb, i (crumb.id)}
			<ChevronRight size={14} />
			{#if i === data.breadcrumb.length - 1}
				<span class="text-foreground">{crumb.name}</span>
			{:else}
				<a href="/collections/{crumb.id}" class="hover:text-foreground transition-colors">
					{crumb.name}
				</a>
			{/if}
		{/each}
	</nav>

	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			{#if data.collection.icon}
				<span class="text-2xl">{data.collection.icon}</span>
			{:else}
				<FolderOpen size={24} class="text-muted" />
			{/if}
			<div>
				<h1 class="text-xl font-semibold text-foreground">{data.collection.name}</h1>
				{#if data.collection.description}
					<p class="text-sm text-muted mt-0.5">{data.collection.description}</p>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/snippets/new?collection={data.collection.id}"
				class="flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
			>
				<Plus size={16} />
				Nouveau snippet
			</a>

			<!-- Actions menu -->
			<div class="relative">
				<button
					onclick={(e) => {
						e.stopPropagation();
						menuOpen = !menuOpen;
					}}
					class="p-2 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<MoreHorizontal size={18} />
				</button>

				{#if menuOpen}
					<div
						class="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-md shadow-lg py-1 z-50"
					>
						<button
							onclick={openRename}
							class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors w-full text-left"
						>
							<Pencil size={14} />
							Renommer
						</button>
						<button
							onclick={openDelete}
							class="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface transition-colors w-full text-left"
						>
							<Trash2 size={14} />
							Supprimer
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Child collections -->
	{#if data.childCollections.length > 0}
		<div class="mb-6">
			<h2 class="text-sm font-medium text-muted mb-3">Sous-collections</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{#each data.childCollections as child (child.id)}
					<a
						href="/collections/{child.id}"
						class="flex items-center gap-2 p-3 bg-surface border border-border rounded-lg hover:border-accent/50 transition-colors"
					>
						{#if child.icon}
							<span class="text-lg">{child.icon}</span>
						{:else}
							<Folder size={18} class="text-muted" />
						{/if}
						<span class="text-sm text-foreground truncate">{child.name}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Snippets -->
	<div class="bg-surface border border-border rounded-lg">
		<div class="px-4 py-3 border-b border-border">
			<h2 class="text-sm font-medium text-foreground">
				Snippets ({data.snippets.length})
			</h2>
		</div>
		<SnippetList
			snippets={data.snippets}
			showCollection={false}
			emptyMessage="Aucun snippet dans cette collection"
		/>
	</div>
</div>

<!-- Rename modal -->
{#if renameModalOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (renameModalOpen = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Renommer la collection</h2>
				<button
					onclick={() => (renameModalOpen = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<form
				method="POST"
				action="?/rename"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							renameModalOpen = false;
							invalidateAll();
						}
					};
				}}
				class="p-4"
			>
				<input
					type="text"
					name="name"
					bind:value={newName}
					required
					autofocus
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
				/>
				<div class="flex justify-end gap-2 mt-4">
					<button
						type="button"
						onclick={() => (renameModalOpen = false)}
						class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
					>
						Renommer
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete modal -->
{#if deleteModalOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (deleteModalOpen = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Supprimer la collection</h2>
				<button
					onclick={() => (deleteModalOpen = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<div class="p-4">
				<p class="text-sm text-muted mb-4">
					Voulez-vous vraiment supprimer la collection "{data.collection.name}" ?
				</p>
				{#if data.snippets.length > 0 || data.childCollections.length > 0}
					<p class="text-sm text-red-500 mb-4">
						Cette collection contient {data.snippets.length} snippet(s) et/ou {data.childCollections
							.length} sous-collection(s). Supprimez-les d'abord.
					</p>
				{/if}
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								const data = result.data as { redirect?: string } | undefined;
								if (data?.redirect) {
									goto(data.redirect);
								} else {
									goto('/dashboard');
								}
							}
						};
					}}
				>
					<div class="flex justify-end gap-2">
						<button
							type="button"
							onclick={() => (deleteModalOpen = false)}
							class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							disabled={data.snippets.length > 0 || data.childCollections.length > 0}
							class="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
						>
							Supprimer
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
