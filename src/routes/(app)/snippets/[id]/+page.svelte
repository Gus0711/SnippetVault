<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		ArrowLeft,
		Edit,
		Trash2,
		Globe,
		GlobeLock,
		Copy,
		Check,
		ExternalLink,
		Clock,
		Folder
	} from 'lucide-svelte';

	let { data } = $props();

	let deleting = $state(false);
	let publishing = $state(false);
	let copied = $state(false);
	let showDeleteConfirm = $state(false);

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const handleDelete = async () => {
		deleting = true;
		try {
			const response = await fetch(`/api/snippets/${data.snippet.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				goto('/dashboard');
			}
		} catch (e) {
			console.error('Failed to delete:', e);
		} finally {
			deleting = false;
		}
	};

	const togglePublish = async () => {
		publishing = true;
		try {
			const newStatus = data.snippet.status === 'published' ? 'draft' : 'published';
			const response = await fetch(`/api/snippets/${data.snippet.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				invalidateAll();
			}
		} catch (e) {
			console.error('Failed to toggle publish:', e);
		} finally {
			publishing = false;
		}
	};

	const copyContent = async () => {
		const content = data.snippet.blocks.map((b) => b.content || '').join('\n\n');
		await navigator.clipboard.writeText(content);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	};

	const publicUrl = $derived(
		data.snippet.publicId ? `${window.location.origin}/s/${data.snippet.publicId}` : null
	);
</script>

<div class="p-6 max-w-4xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<a
				href="/dashboard"
				class="p-1.5 hover:bg-surface rounded transition-colors text-muted hover:text-foreground"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-xl font-semibold text-foreground">{data.snippet.title}</h1>
				<div class="flex items-center gap-3 mt-1 text-xs text-muted">
					{#if data.snippet.collection}
						<span class="flex items-center gap-1">
							<Folder size={12} />
							{data.snippet.collection.name}
						</span>
					{/if}
					<span class="flex items-center gap-1">
						<Clock size={12} />
						{formatDate(data.snippet.updatedAt)}
					</span>
					{#if data.snippet.status === 'published'}
						<span class="flex items-center gap-1 text-accent">
							<Globe size={12} />
							Publié
						</span>
					{:else}
						<span class="flex items-center gap-1">
							<GlobeLock size={12} />
							Brouillon
						</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={togglePublish}
				disabled={publishing}
				class="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded hover:bg-surface transition-colors disabled:opacity-50"
			>
				{#if data.snippet.status === 'published'}
					<GlobeLock size={14} />
					Dépublier
				{:else}
					<Globe size={14} />
					Publier
				{/if}
			</button>
			<a
				href="/snippets/{data.snippet.id}/edit"
				class="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded hover:bg-surface transition-colors"
			>
				<Edit size={14} />
				Modifier
			</a>
			<div class="relative">
				<button
					onclick={() => (showDeleteConfirm = !showDeleteConfirm)}
					class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
				>
					<Trash2 size={14} />
					Supprimer
				</button>
				{#if showDeleteConfirm}
					<div
						class="absolute right-0 top-full mt-2 p-3 bg-background border border-border rounded-lg shadow-lg z-10 w-56"
					>
						<p class="text-sm text-foreground mb-3">Supprimer ce snippet ?</p>
						<div class="flex gap-2">
							<button
								onclick={() => (showDeleteConfirm = false)}
								class="flex-1 px-3 py-1.5 text-sm border border-border rounded hover:bg-surface transition-colors"
							>
								Annuler
							</button>
							<button
								onclick={handleDelete}
								disabled={deleting}
								class="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
							>
								{deleting ? '...' : 'Supprimer'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Public URL -->
	{#if data.snippet.status === 'published' && publicUrl}
		<div class="mb-4 p-3 bg-accent/5 border border-accent/20 rounded flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm">
				<Globe size={14} class="text-accent" />
				<span class="text-muted">Lien public :</span>
				<a href={publicUrl} target="_blank" class="text-accent hover:underline">
					{publicUrl}
				</a>
			</div>
			<button
				onclick={() => navigator.clipboard.writeText(publicUrl)}
				class="p-1.5 hover:bg-accent/10 rounded transition-colors text-accent"
				title="Copier le lien"
			>
				<Copy size={14} />
			</button>
		</div>
	{/if}

	<!-- Tags -->
	{#if data.snippet.tags.length > 0}
		<div class="flex flex-wrap gap-1.5 mb-4">
			{#each data.snippet.tags as tag (tag.id)}
				<span
					class="px-2 py-0.5 rounded text-xs bg-surface text-muted"
					style={tag.color ? `background-color: ${tag.color}20; color: ${tag.color}` : ''}
				>
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	<!-- Content -->
	<div class="bg-surface border border-border rounded-lg overflow-hidden">
		<div class="flex items-center justify-between px-4 py-2 border-b border-border">
			<span class="text-xs text-muted">Contenu</span>
			<button
				onclick={copyContent}
				class="flex items-center gap-1.5 px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
			>
				{#if copied}
					<Check size={12} class="text-green-500" />
					Copié
				{:else}
					<Copy size={12} />
					Copier
				{/if}
			</button>
		</div>
		{#if data.snippet.blocks.length > 0}
			{#each data.snippet.blocks as block (block.id)}
				<div class="p-4 border-b border-border last:border-b-0">
					{#if block.type === 'code'}
						<pre
							class="font-mono text-sm text-foreground whitespace-pre-wrap break-words">{block.content || ''}</pre>
					{:else if block.type === 'markdown'}
						<div class="prose prose-sm text-foreground">
							{block.content || ''}
						</div>
					{:else}
						<p class="text-sm text-muted">{block.content || ''}</p>
					{/if}
				</div>
			{/each}
		{:else}
			<div class="p-8 text-center text-muted text-sm">Aucun contenu</div>
		{/if}
	</div>
</div>
