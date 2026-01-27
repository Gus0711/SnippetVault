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
		Folder,
		Settings,
		X,
		Star,
		Download,
		Code,
		FileText,
		FileArchive,
		Github,
		RefreshCw
	} from 'lucide-svelte';
	import CodeBlockCollapsible from '$lib/components/CodeBlockCollapsible.svelte';
	import { JsonViewer } from '$lib/components/json-viewer';
	import { HtmlPreview } from '$lib/components/html-preview';
	import { getLanguageColor } from '$lib/utils/colors';

	// Collect all CSS content from blocks for HTML preview
	const cssContent = $derived(
		data.snippet.blocks
			.filter((b: any) => b.type === 'code' && b.language === 'css')
			.map((b: any) => b.content || '')
			.join('\n\n')
	);

	let { data } = $props();

	let deleting = $state(false);
	let publishing = $state(false);
	let copied = $state(false);
	let linkCopied = $state(false);
	let showDeleteConfirm = $state(false);
	let showPublishModal = $state(false);
	let isFavorite = $state(data.snippet.isFavorite);
	let togglingFavorite = $state(false);

	const toggleFavorite = async () => {
		togglingFavorite = true;
		try {
			const response = await fetch(`/api/snippets/${data.snippet.id}/favorite`, {
				method: 'PUT'
			});
			if (response.ok) {
				const result = await response.json();
				isFavorite = result.data.isFavorite;
				invalidateAll();
			}
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
		} finally {
			togglingFavorite = false;
		}
	};

	// Permission checks
	const canWrite = data.permission === 'owner' || data.permission === 'write';
	const canDelete = data.permission === 'owner';

	// Publication options
	let selectedTheme = $state(data.snippet.publicTheme || 'github-dark');
	let showDescription = $state(data.snippet.publicShowDescription ?? true);
	let showAttachments = $state(data.snippet.publicShowAttachments ?? true);

	const themes = [
		{ id: 'github-dark', label: 'GitHub Dark' },
		{ id: 'github-light', label: 'GitHub Light' },
		{ id: 'dracula', label: 'Dracula' },
		{ id: 'nord', label: 'Nord' },
		{ id: 'one-dark-pro', label: 'One Dark Pro' },
		{ id: 'vitesse-dark', label: 'Vitesse Dark' },
		{ id: 'vitesse-light', label: 'Vitesse Light' },
		{ id: 'min-dark', label: 'Min Dark' },
		{ id: 'min-light', label: 'Min Light' }
	];

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const handleDelete = async () => {
		deleting = true;
		try {
			const response = await fetch(`/api/snippets/${data.snippet.id}`, { method: 'DELETE' });
			if (response.ok) {
				goto('/dashboard');
			}
		} catch (e) {
			console.error('Failed to delete:', e);
		} finally {
			deleting = false;
		}
	};

	const handlePublish = async () => {
		publishing = true;
		try {
			const response = await fetch(`/api/snippets/${data.snippet.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'published',
					publicTheme: selectedTheme,
					publicShowDescription: showDescription,
					publicShowAttachments: showAttachments
				})
			});
			if (response.ok) {
				showPublishModal = false;
				invalidateAll();
			}
		} catch (e) {
			console.error('Failed to publish:', e);
		} finally {
			publishing = false;
		}
	};

	const handleUnpublish = async () => {
		publishing = true;
		try {
			const response = await fetch(`/api/snippets/${data.snippet.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'draft' })
			});
			if (response.ok) {
				invalidateAll();
			}
		} catch (e) {
			console.error('Failed to unpublish:', e);
		} finally {
			publishing = false;
		}
	};

	const updatePublicOptions = async () => {
		try {
			await fetch(`/api/snippets/${data.snippet.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					publicTheme: selectedTheme,
					publicShowDescription: showDescription,
					publicShowAttachments: showAttachments
				})
			});
			invalidateAll();
		} catch (e) {
			console.error('Failed to update options:', e);
		}
	};

	const copyContent = async () => {
		const content = data.snippet.blocks.map((b: any) => b.content || '').join('\n\n');
		await navigator.clipboard.writeText(content);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	};

	const copyPublicLink = async () => {
		if (publicUrl) {
			await navigator.clipboard.writeText(publicUrl);
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 2000);
		}
	};

	const publicUrl = $derived(
		data.snippet.publicId ? `${window.location.origin}/s/${data.snippet.publicId}` : null
	);

	// Embed modal
	let showEmbedModal = $state(false);
	let embedCopied = $state(false);
	let embedHeight = $state(400);

	const embedUrl = $derived(
		data.snippet.publicId ? `${window.location.origin}/embed/${data.snippet.publicId}` : null
	);

	const embedCode = $derived(
		embedUrl
			? `<iframe src="${embedUrl}" width="100%" height="${embedHeight}" frameborder="0" style="border-radius: 8px; border: 1px solid #30363d;"></iframe>`
			: ''
	);

	const copyEmbedCode = async () => {
		if (embedCode) {
			await navigator.clipboard.writeText(embedCode);
			embedCopied = true;
			setTimeout(() => (embedCopied = false), 2000);
		}
	};

	// Export
	let showExportMenu = $state(false);
	let exporting = $state(false);

	// Gist export
	let exportingToGist = $state(false);
	let gistError = $state<string | null>(null);
	let gistUrl = $state<string | null>(data.snippet.gistUrl);
	let showGistModal = $state(false);
	let gistIsPublic = $state(false);

	const exportSnippet = async (format: 'md' | 'zip') => {
		exporting = true;
		showExportMenu = false;
		try {
			const response = await fetch(`/api/snippets/${data.snippet.id}/export?format=${format}`);
			if (response.ok) {
				const blob = await response.blob();
				const contentDisposition = response.headers.get('content-disposition');
				const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
				const filename = filenameMatch ? filenameMatch[1] : `snippet.${format}`;

				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch (e) {
			console.error('Export failed:', e);
		} finally {
			exporting = false;
		}
	};

	const exportToGist = async () => {
		exportingToGist = true;
		gistError = null;
		try {
			const response = await fetch('/api/gist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					snippetId: data.snippet.id,
					isPublic: gistIsPublic
				})
			});

			const result = await response.json();

			if (!response.ok) {
				gistError = result.error || 'Erreur lors de l\'export';
				return;
			}

			gistUrl = result.data.gistUrl;
			showGistModal = false;
			invalidateAll();
		} catch (e) {
			console.error('Gist export failed:', e);
			gistError = 'Erreur lors de l\'export vers Gist';
		} finally {
			exportingToGist = false;
		}
	};
</script>

<div class="px-6 py-4 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<a
				href="/dashboard"
				class="p-1 hover:bg-surface rounded transition-colors text-muted hover:text-foreground"
			>
				<ArrowLeft size={16} strokeWidth={1.5} />
			</a>
			<button
				onclick={toggleFavorite}
				disabled={togglingFavorite}
				class="p-1 rounded transition-colors {isFavorite ? 'text-yellow-500' : 'text-muted hover:text-yellow-500'}"
				title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
			>
				<Star size={16} strokeWidth={1.5} class={isFavorite ? 'fill-yellow-500' : ''} />
			</button>
			<div>
				<h1 class="text-base font-semibold text-foreground">{data.snippet.title}</h1>
				<div class="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
					{#if data.snippet.collection}
						<span class="flex items-center gap-0.5">
							<Folder size={10} strokeWidth={1.5} />
							{data.snippet.collection.name}
						</span>
					{/if}
					<span class="flex items-center gap-0.5">
						<Clock size={10} strokeWidth={1.5} />
						{formatDate(data.snippet.updatedAt)}
					</span>
					{#if data.snippet.status === 'published'}
						<span class="flex items-center gap-0.5 text-accent">
							<Globe size={10} strokeWidth={1.5} />
							Publie
						</span>
					{:else}
						<span class="flex items-center gap-0.5">
							<GlobeLock size={10} strokeWidth={1.5} />
							Brouillon
						</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex items-center gap-1.5">
			{#if canWrite}
				{#if data.snippet.status === 'published'}
					<button
						onclick={handleUnpublish}
						disabled={publishing}
						class="flex items-center gap-1 px-2 py-1 text-[11px] border border-border rounded hover:bg-surface transition-colors disabled:opacity-50"
					>
						<GlobeLock size={12} strokeWidth={1.5} />
						Depublier
					</button>
					<button
						onclick={() => (showPublishModal = true)}
						class="p-1 border border-border rounded hover:bg-surface transition-colors"
						title="Options de publication"
					>
						<Settings size={12} strokeWidth={1.5} />
					</button>
				{:else}
					<button
						onclick={() => (showPublishModal = true)}
						disabled={publishing}
						class="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						<Globe size={12} strokeWidth={1.5} />
						Publier
					</button>
				{/if}
				<a
					href="/snippets/{data.snippet.id}/edit"
					class="flex items-center gap-1 px-2 py-1 text-[11px] border border-border rounded hover:bg-surface transition-colors"
				>
					<Edit size={12} strokeWidth={1.5} />
					Modifier
				</a>
			{/if}
			{#if canDelete}
				<div class="relative">
					<button
						onclick={() => (showDeleteConfirm = !showDeleteConfirm)}
						class="p-1 text-red-500 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
					>
						<Trash2 size={12} strokeWidth={1.5} />
					</button>
					{#if showDeleteConfirm}
						<div class="absolute right-0 top-full mt-1 p-2.5 bg-background border border-border rounded shadow-lg z-10 w-48">
							<p class="text-[11px] text-foreground mb-2">Supprimer ce snippet ?</p>
							<div class="flex gap-1.5">
								<button
									onclick={() => (showDeleteConfirm = false)}
									class="flex-1 px-2 py-1 text-[10px] border border-border rounded hover:bg-surface transition-colors"
								>
									Annuler
								</button>
								<button
									onclick={handleDelete}
									disabled={deleting}
									class="flex-1 px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
								>
									{deleting ? '...' : 'Supprimer'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Public URL Banner -->
	{#if data.snippet.status === 'published' && publicUrl}
		<div class="mb-3 px-2.5 py-2 bg-accent/5 border border-accent/20 rounded flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Globe size={14} strokeWidth={1.5} class="text-accent" />
				<span class="text-[11px] text-foreground">Lien public disponible</span>
			</div>
			<div class="flex items-center gap-1.5">
				<button
					onclick={copyPublicLink}
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors"
				>
					{#if linkCopied}
						<Check size={10} class="text-accent" />
						Copie
					{:else}
						<Copy size={10} />
						Copier
					{/if}
				</button>
				<button
					onclick={() => (showEmbedModal = true)}
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors"
				>
					<Code size={10} />
					Embed
				</button>
				<a
					href={publicUrl}
					target="_blank"
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
				>
					<ExternalLink size={10} />
					Voir
				</a>
			</div>
		</div>
	{/if}

	<!-- Export buttons -->
	<div class="mb-3 flex items-center gap-1.5 flex-wrap">
		<span class="text-[10px] text-muted">Export:</span>
		<button
			onclick={() => exportSnippet('md')}
			disabled={exporting}
			class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors disabled:opacity-50"
		>
			<FileText size={10} />
			.md
		</button>
		<button
			onclick={() => exportSnippet('zip')}
			disabled={exporting}
			class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors disabled:opacity-50"
		>
			<FileArchive size={10} />
			.zip
		</button>
		{#if canWrite}
			<span class="text-[10px] text-muted mx-1">|</span>
			{#if gistUrl}
				<a
					href={gistUrl}
					target="_blank"
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
				>
					<Github size={10} />
					Voir le Gist
					<ExternalLink size={8} />
				</a>
				<button
					onclick={() => (showGistModal = true)}
					disabled={exportingToGist}
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors disabled:opacity-50"
					title="Mettre a jour le Gist"
				>
					<RefreshCw size={10} />
				</button>
			{:else if data.hasGithubToken}
				<button
					onclick={() => (showGistModal = true)}
					disabled={exportingToGist}
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors disabled:opacity-50"
				>
					<Github size={10} />
					Gist
				</button>
			{:else}
				<a
					href="/settings"
					class="flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border rounded hover:bg-surface transition-colors text-muted"
					title="Configurez votre token GitHub dans les parametres"
				>
					<Github size={10} />
					Gist
				</a>
			{/if}
		{/if}
	</div>

	<!-- Tags -->
	{#if data.snippet.tags.length > 0}
		<div class="flex flex-wrap gap-1 mb-3">
			{#each data.snippet.tags as tag (tag.id)}
				<span
					class="px-1.5 py-0.5 rounded text-[10px]"
					style={tag.color
						? `background-color: ${tag.color}15; color: ${tag.color}`
						: 'background-color: var(--sf); color: var(--tx-muted)'}
				>
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	<!-- Content -->
	<div class="border border-border rounded overflow-hidden">
		<div class="flex items-center justify-between px-2.5 py-1.5 border-b border-border bg-surface/50">
			<span class="text-[10px] text-muted uppercase tracking-wide">Contenu</span>
			<button
				onclick={copyContent}
				class="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-muted hover:text-foreground transition-colors"
			>
				{#if copied}
					<Check size={10} class="text-accent" />
					Copie
				{:else}
					<Copy size={10} />
					Copier
				{/if}
			</button>
		</div>
		{#if data.snippet.blocks.length > 0}
			{#each data.snippet.blocks as block (block.id)}
				<div class="border-b border-border/50 last:border-b-0">
					{#if block.type === 'code'}
						<div class="relative group">
							<div class="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-10">
								{#if block.language && block.language !== 'plaintext'}
									{@const langColor = getLanguageColor(block.language)}
									<span
										class="px-1.5 py-0.5 text-[9px] rounded font-mono"
										style="background-color: {langColor}20; color: {langColor}"
									>
										{block.language}
									</span>
								{/if}
								<button
									onclick={() => navigator.clipboard.writeText(block.content || '')}
									class="p-1 bg-background/90 text-muted hover:text-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
									title="Copier"
								>
									<Copy size={11} />
								</button>
							</div>
							{#if block.language === 'json'}
								<JsonViewer content={block.content || ''} blockId={block.id}>
									<div class="snippet-code-block overflow-x-auto">
										<CodeBlockCollapsible
											content={block.content || ''}
											renderedHtml={block.renderedHtml}
											language={block.language}
											blockId={block.id}
										/>
									</div>
								</JsonViewer>
							{:else if block.language === 'html'}
								<HtmlPreview htmlContent={block.content || ''} cssContent={cssContent} blockId={block.id}>
									<div class="snippet-code-block overflow-x-auto">
										<CodeBlockCollapsible
											content={block.content || ''}
											renderedHtml={block.renderedHtml}
											language={block.language}
											blockId={block.id}
										/>
									</div>
								</HtmlPreview>
							{:else}
								<div class="snippet-code-block overflow-x-auto">
									<CodeBlockCollapsible
										content={block.content || ''}
										renderedHtml={block.renderedHtml}
										language={block.language}
										blockId={block.id}
									/>
								</div>
							{/if}
						</div>
					{:else if block.type === 'markdown'}
						<div class="p-3">
							{#if block.renderedHtml}
								<div class="prose prose-sm dark:prose-invert max-w-none text-[12px]">
									{@html block.renderedHtml}
								</div>
							{:else}
								<p class="text-[12px] text-foreground">{block.content || ''}</p>
							{/if}
						</div>
					{:else if block.type === 'image'}
						<div class="p-3">
							{#if block.filePath}
								<img
									src={block.filePath}
									alt={block.fileName || 'Image'}
									class="max-w-full h-auto rounded border border-border"
								/>
							{:else}
								<p class="text-[11px] text-muted">Image non disponible</p>
							{/if}
						</div>
					{:else if block.type === 'file'}
						<div class="p-3">
							{#if block.filePath}
								{@const fileSize = block.fileSize || 0}
								{@const sizeText = fileSize < 1024
									? `${fileSize} B`
									: fileSize < 1024 * 1024
										? `${(fileSize / 1024).toFixed(1)} KB`
										: `${(fileSize / (1024 * 1024)).toFixed(1)} MB`}
								<a
									href={block.filePath}
									download={block.fileName || 'file'}
									class="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-accent transition-colors"
								>
									<span class="text-xl">📎</span>
									<div class="flex-1 min-w-0">
										<div class="text-[12px] font-medium text-foreground truncate">
											{block.fileName || 'Fichier'}
										</div>
										<div class="text-[10px] text-muted">{sizeText}</div>
									</div>
									<span class="px-2 py-1 bg-accent text-white text-[10px] rounded">
										Telecharger
									</span>
								</a>
							{:else}
								<p class="text-[11px] text-muted">Fichier non disponible</p>
							{/if}
						</div>
					{:else}
						<div class="p-3">
							<p class="text-[11px] text-muted">{block.content || ''}</p>
						</div>
					{/if}
				</div>
			{/each}
		{:else}
			<div class="p-6 text-center text-muted text-[11px]">Aucun contenu</div>
		{/if}
	</div>
</div>

<!-- Publish Modal -->
{#if showPublishModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-background border border-border rounded shadow-xl w-full max-w-sm">
			<div class="flex items-center justify-between px-3 py-2 border-b border-border">
				<h2 class="text-sm font-semibold text-foreground">
					{data.snippet.status === 'published' ? 'Options de publication' : 'Publier'}
				</h2>
				<button
					onclick={() => (showPublishModal = false)}
					class="p-0.5 text-muted hover:text-foreground rounded transition-colors"
				>
					<X size={14} />
				</button>
			</div>
			<div class="p-3 space-y-3">
				<!-- Theme selector -->
				<div>
					<label class="block text-[11px] font-medium text-foreground mb-1">Theme</label>
					<select
						bind:value={selectedTheme}
						class="w-full px-2 py-1.5 bg-surface border border-border rounded text-foreground text-[11px] focus:outline-none focus:border-accent"
					>
						{#each themes as theme (theme.id)}
							<option value={theme.id}>{theme.label}</option>
						{/each}
					</select>
				</div>

				<!-- Options -->
				<div class="space-y-2">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={showDescription}
							class="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent"
						/>
						<span class="text-[11px] text-foreground">Afficher la description</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={showAttachments}
							class="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent"
						/>
						<span class="text-[11px] text-foreground">Afficher les images/fichiers</span>
					</label>
				</div>

				{#if data.snippet.status !== 'published'}
					<p class="text-[10px] text-muted p-2 bg-surface rounded">
						Un lien unique sera genere pour le partage public.
					</p>
				{/if}
			</div>
			<div class="flex justify-end gap-1.5 px-3 py-2 border-t border-border">
				<button
					onclick={() => (showPublishModal = false)}
					class="px-2.5 py-1 text-[11px] border border-border rounded hover:bg-surface transition-colors"
				>
					Annuler
				</button>
				{#if data.snippet.status === 'published'}
					<button
						onclick={() => {
							updatePublicOptions();
							showPublishModal = false;
						}}
						class="px-2.5 py-1 text-[11px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
					>
						Enregistrer
					</button>
				{:else}
					<button
						onclick={handlePublish}
						disabled={publishing}
						class="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						<Globe size={11} />
						{publishing ? '...' : 'Publier'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Embed Modal -->
{#if showEmbedModal && embedUrl}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-background border border-border rounded shadow-xl w-full max-w-md">
			<div class="flex items-center justify-between px-3 py-2 border-b border-border">
				<h2 class="text-sm font-semibold text-foreground">Code d'integration</h2>
				<button
					onclick={() => (showEmbedModal = false)}
					class="p-0.5 text-muted hover:text-foreground rounded transition-colors"
				>
					<X size={14} />
				</button>
			</div>
			<div class="p-3 space-y-3">
				<!-- Height slider -->
				<div>
					<label class="block text-[11px] font-medium text-foreground mb-1">
						Hauteur: {embedHeight}px
					</label>
					<input
						type="range"
						bind:value={embedHeight}
						min="200"
						max="800"
						step="50"
						class="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
					/>
				</div>

				<!-- Code preview -->
				<div>
					<label class="block text-[11px] font-medium text-foreground mb-1">Code iframe</label>
					<div class="relative">
						<pre class="p-2 bg-surface border border-border rounded text-[10px] text-foreground overflow-x-auto whitespace-pre-wrap break-all font-mono">{embedCode}</pre>
						<button
							onclick={copyEmbedCode}
							class="absolute top-1.5 right-1.5 p-1 bg-background border border-border rounded hover:bg-surface transition-colors"
						>
							{#if embedCopied}
								<Check size={12} class="text-accent" />
							{:else}
								<Copy size={12} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Preview link -->
				<div class="flex items-center justify-between pt-2 border-t border-border">
					<span class="text-[10px] text-muted">Apercu:</span>
					<a
						href={embedUrl}
						target="_blank"
						class="flex items-center gap-1 text-[10px] text-accent hover:underline"
					>
						<ExternalLink size={10} />
						Ouvrir dans un nouvel onglet
					</a>
				</div>
			</div>
			<div class="flex justify-end px-3 py-2 border-t border-border">
				<button
					onclick={() => (showEmbedModal = false)}
					class="px-2.5 py-1 text-[11px] border border-border rounded hover:bg-surface transition-colors"
				>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Gist Export Modal -->
{#if showGistModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-background border border-border rounded shadow-xl w-full max-w-sm">
			<div class="flex items-center justify-between px-3 py-2 border-b border-border">
				<h2 class="text-sm font-semibold text-foreground flex items-center gap-2">
					<Github size={16} />
					{gistUrl ? 'Mettre a jour le Gist' : 'Exporter vers GitHub Gist'}
				</h2>
				<button
					onclick={() => (showGistModal = false)}
					class="p-0.5 text-muted hover:text-foreground rounded transition-colors"
				>
					<X size={14} />
				</button>
			</div>
			<div class="p-3 space-y-3">
				{#if !gistUrl}
					<div>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={gistIsPublic}
								class="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent"
							/>
							<span class="text-[11px] text-foreground">Gist public</span>
						</label>
						<p class="text-[10px] text-muted mt-1 ml-5">
							Les Gists secrets sont accessibles via URL mais ne sont pas indexés.
						</p>
					</div>
				{/if}

				<div class="p-2 bg-surface rounded text-[10px] text-muted">
					<p class="font-medium text-foreground mb-1">Contenu du Gist:</p>
					<ul class="list-disc list-inside space-y-0.5">
						<li>README.md - Description et code formaté</li>
						<li>Fichiers de code séparés par langage</li>
					</ul>
				</div>

				{#if gistError}
					<p class="text-[11px] text-red-500">{gistError}</p>
				{/if}
			</div>
			<div class="flex justify-end gap-1.5 px-3 py-2 border-t border-border">
				<button
					onclick={() => (showGistModal = false)}
					class="px-2.5 py-1 text-[11px] border border-border rounded hover:bg-surface transition-colors"
				>
					Annuler
				</button>
				<button
					onclick={exportToGist}
					disabled={exportingToGist}
					class="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors disabled:opacity-50"
				>
					{#if exportingToGist}
						<RefreshCw size={11} class="animate-spin" />
						Export...
					{:else}
						<Github size={11} />
						{gistUrl ? 'Mettre a jour' : 'Creer le Gist'}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
