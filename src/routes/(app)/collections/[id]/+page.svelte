<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import SnippetTable from '$lib/components/SnippetTable.svelte';
	import ShareCollectionModal from '$lib/components/ShareCollectionModal.svelte';
	import {
		Plus,
		Folder,
		FolderOpen,
		ChevronRight,
		MoreHorizontal,
		Pencil,
		Trash2,
		X,
		Share2,
		Users
	} from 'lucide-svelte';

	let { data } = $props();

	let menuOpen = $state(false);
	let renameModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let shareModalOpen = $state(false);
	let newName = $state('');

	const isOwner = data.permission === 'owner';
	const canWrite = data.permission === 'owner' || data.permission === 'write';

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

<div class="p-3">
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-1 text-[10px] text-muted mb-3">
		<a href="/dashboard" class="hover:text-foreground transition-colors">Dashboard</a>
		{#each data.breadcrumb as crumb, i (crumb.id)}
			<ChevronRight size={10} strokeWidth={1.5} />
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
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			{#if data.collection.icon}
				<span class="text-base">{data.collection.icon}</span>
			{:else if !isOwner}
				<Users size={16} strokeWidth={1.5} class="text-muted" />
			{:else}
				<FolderOpen size={16} strokeWidth={1.5} class="text-muted" />
			{/if}
			<div>
				<h1 class="text-sm font-semibold text-foreground">{data.collection.name}</h1>
				<div class="flex items-center gap-2 mt-0.5">
					{#if data.collection.description}
						<p class="text-[10px] text-muted">{data.collection.description}</p>
					{/if}
					{#if !isOwner && data.ownerName}
						<span class="text-[10px] text-muted flex items-center gap-1">
							<Users size={10} strokeWidth={1.5} />
							Partagee par {data.ownerName}
							{#if data.permission === 'read'}
								<span class="text-muted/60">(lecture seule)</span>
							{/if}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex items-center gap-1.5">
			{#if canWrite}
				<a
					href="/snippets/new?collection={data.collection.id}"
					class="flex items-center gap-1 px-2 py-1 bg-accent text-white rounded text-[11px] font-medium hover:opacity-90 transition-opacity"
				>
					<Plus size={12} strokeWidth={2} />
					Nouveau
				</a>
			{/if}

			{#if isOwner}
				<button
					onclick={() => (shareModalOpen = true)}
					class="flex items-center gap-1 px-2 py-1 border border-border rounded text-[11px] hover:bg-surface transition-colors"
				>
					<Share2 size={12} strokeWidth={1.5} />
					Partager
				</button>

				<div class="relative">
					<button
						onclick={(e) => {
							e.stopPropagation();
							menuOpen = !menuOpen;
						}}
						class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
					>
						<MoreHorizontal size={14} strokeWidth={1.5} />
					</button>

					{#if menuOpen}
						<div class="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded shadow-lg py-0.5 z-50">
							<button
								onclick={openRename}
								class="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-foreground hover:bg-surface transition-colors w-full text-left"
							>
								<Pencil size={11} strokeWidth={1.5} />
								Renommer
							</button>
							<button
								onclick={openDelete}
								class="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-red-500 hover:bg-surface transition-colors w-full text-left"
							>
								<Trash2 size={11} strokeWidth={1.5} />
								Supprimer
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Child collections -->
	{#if data.childCollections.length > 0}
		<div class="mb-3">
			<h2 class="text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Sous-collections</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
				{#each data.childCollections as child (child.id)}
					<a
						href="/collections/{child.id}"
						class="flex items-center gap-1.5 px-2 py-1.5 bg-surface border border-border rounded hover:border-accent/40 transition-colors"
					>
						{#if child.icon}
							<span class="text-[11px]">{child.icon}</span>
						{:else}
							<Folder size={12} strokeWidth={1.5} class="text-muted" />
						{/if}
						<span class="text-[11px] text-foreground truncate">{child.name}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Snippets -->
	<SnippetTable snippets={data.snippets} allTags={data.tags} allCollections={data.collections} />
</div>

<!-- Rename modal -->
{#if renameModalOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (renameModalOpen = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded shadow-lg w-full max-w-xs"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-center justify-between px-3 py-2 border-b border-border">
				<h2 class="text-sm font-medium text-foreground">Renommer</h2>
				<button
					onclick={() => (renameModalOpen = false)}
					class="p-0.5 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={14} />
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
				class="p-3"
			>
				<input
					type="text"
					name="name"
					bind:value={newName}
					required
					autofocus
					class="w-full px-2 py-1.5 bg-surface border border-border rounded text-[11px] text-foreground focus:outline-none focus:border-accent"
				/>
				<div class="flex justify-end gap-1.5 mt-3">
					<button
						type="button"
						onclick={() => (renameModalOpen = false)}
						class="px-2 py-1 text-[11px] text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						class="px-2.5 py-1 text-[11px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
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
			class="bg-background border border-border rounded shadow-lg w-full max-w-xs"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-center justify-between px-3 py-2 border-b border-border">
				<h2 class="text-sm font-medium text-foreground">Supprimer</h2>
				<button
					onclick={() => (deleteModalOpen = false)}
					class="p-0.5 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={14} />
				</button>
			</div>
			<div class="p-3">
				<p class="text-[11px] text-muted mb-3">
					Supprimer "{data.collection.name}" ?
				</p>
				{#if data.snippets.length > 0 || data.childCollections.length > 0}
					<p class="text-[10px] text-red-500 mb-3">
						Contient {data.snippets.length} snippet(s) et {data.childCollections.length} sous-collection(s).
					</p>
				{/if}
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								const data = result.data as { redirect?: string } | undefined;
								goto(data?.redirect || '/dashboard');
							}
						};
					}}
				>
					<div class="flex justify-end gap-1.5">
						<button
							type="button"
							onclick={() => (deleteModalOpen = false)}
							class="px-2 py-1 text-[11px] text-muted hover:text-foreground transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							disabled={data.snippets.length > 0 || data.childCollections.length > 0}
							class="px-2.5 py-1 text-[11px] bg-red-500 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
						>
							Supprimer
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Share modal -->
<ShareCollectionModal
	open={shareModalOpen}
	collectionId={data.collection.id}
	collectionName={data.collection.name}
	members={data.members}
	onClose={() => (shareModalOpen = false)}
	onUpdate={() => invalidateAll()}
/>
