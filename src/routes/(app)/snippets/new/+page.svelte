<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Save, X, Plus, ChevronRight, Tag as TagIcon } from 'lucide-svelte';
	import type { Collection, Tag } from '$lib/server/db/schema';
	import { BlockEditor, type Block } from '$lib/components/editor';
	import { detectLanguage } from '$lib/utils/colors';
	import { localeStore } from '$lib/stores/locale.svelte';

	let { data } = $props();

	let title = $state('');
	let blocks = $state<Block[]>([]);
	let selectedCollectionId = $state<string | null>(null);
	let selectedTagIds = $state<string[]>([]);
	let newTagName = $state('');
	let showTagInput = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	// Build collection tree for dropdown
	interface CollectionNode extends Collection {
		children: CollectionNode[];
		depth: number;
	}

	const buildTree = (collections: Collection[]): CollectionNode[] => {
		const map = new Map<string, CollectionNode>();
		const roots: CollectionNode[] = [];

		// Create nodes
		collections.forEach((c) => {
			map.set(c.id, { ...c, children: [], depth: 0 });
		});

		// Build tree
		collections.forEach((c) => {
			const node = map.get(c.id)!;
			if (c.parentId && map.has(c.parentId)) {
				const parent = map.get(c.parentId)!;
				node.depth = parent.depth + 1;
				parent.children.push(node);
			} else {
				roots.push(node);
			}
		});

		// Flatten for select
		const flatten = (nodes: CollectionNode[]): CollectionNode[] => {
			const result: CollectionNode[] = [];
			const process = (nodes: CollectionNode[]) => {
				nodes.forEach((node) => {
					result.push(node);
					process(node.children);
				});
			};
			process(nodes);
			return result;
		};

		return flatten(roots);
	};

	const collectionTree = $derived(buildTree(data.collections));

	const selectedCollection = $derived(
		data.collections.find((c) => c.id === selectedCollectionId) || null
	);

	const availableTags = $derived(data.tags.filter((t) => !selectedTagIds.includes(t.id)));

	const selectedTags = $derived(data.tags.filter((t) => selectedTagIds.includes(t.id)));

	const toggleTag = (tagId: string) => {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	};

	const createTag = async () => {
		if (!newTagName.trim()) return;

		try {
			const response = await fetch('/api/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newTagName.trim() })
			});

			if (response.ok) {
				const result = await response.json();
				data.tags = [...data.tags, result.data];
				selectedTagIds = [...selectedTagIds, result.data.id];
				newTagName = '';
				showTagInput = false;
			}
		} catch (e) {
			console.error('Failed to create tag:', e);
		}
	};

	const handleEditorUpdate = (newBlocks: Block[]) => {
		blocks = newBlocks;
	};

	const handleSubmit = async () => {
		if (!title.trim()) {
			error = localeStore.t('snippetForm.titleRequired');
			return;
		}

		saving = true;
		error = null;

		// Auto-detect language for code blocks with plaintext
		const processedBlocks = blocks.map((block) => {
			if (block.type === 'code' && (!block.language || block.language === 'plaintext')) {
				const detected = detectLanguage(block.content);
				if (detected) {
					return { ...block, language: detected };
				}
			}
			return block;
		});

		try {
			const response = await fetch('/api/snippets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					collectionId: selectedCollectionId,
					blocks: processedBlocks,
					tagIds: selectedTagIds
				})
			});

			if (response.ok) {
				const result = await response.json();
				goto(`/snippets/${result.data.id}`);
			} else {
				const result = await response.json();
				error = result.error || localeStore.t('snippetForm.createError');
			}
		} catch (e) {
			error = localeStore.t('snippetForm.connectionError');
		} finally {
			saving = false;
		}
	};
</script>

<div class="px-6 py-4 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<a
				href="/dashboard"
				class="p-1.5 hover:bg-surface rounded transition-colors text-muted hover:text-foreground"
			>
				<ArrowLeft size={20} />
			</a>
			<h1 class="text-xl font-semibold text-foreground">{localeStore.t('snippetForm.newTitle')}</h1>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/dashboard"
				class="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
			>
				{localeStore.t('snippetForm.cancel')}
			</a>
			<button
				onclick={handleSubmit}
				disabled={saving || !title.trim()}
				class="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Save size={14} />
				{saving ? localeStore.t('snippetForm.saving') : localeStore.t('snippetForm.save')}
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
			{error}
		</div>
	{/if}

	<div class="space-y-4">
		<!-- Title -->
		<div>
			<label for="title" class="block text-sm font-medium text-foreground mb-1.5">{localeStore.t('snippetForm.title')}</label>
			<input
				id="title"
				type="text"
				bind:value={title}
				placeholder={localeStore.t('snippetForm.titlePlaceholder')}
				class="w-full px-3 py-2 bg-surface border border-border rounded text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
			/>
		</div>

		<!-- Collection -->
		<div>
			<label for="collection" class="block text-sm font-medium text-foreground mb-1.5"
				>{localeStore.t('snippetForm.collection')}</label
			>
			<select
				id="collection"
				bind:value={selectedCollectionId}
				class="w-full px-3 py-2 bg-surface border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
			>
				<option value={null}>{localeStore.t('snippetForm.noCollection')}</option>
				{#each collectionTree as collection (collection.id)}
					<option value={collection.id}>
						{'  '.repeat(collection.depth)}{collection.icon || ''} {collection.name}
					</option>
				{/each}
			</select>
		</div>

		<!-- Tags -->
		<div>
			<label class="block text-sm font-medium text-foreground mb-1.5">{localeStore.t('snippetForm.tags')}</label>
			<div class="flex flex-wrap gap-2 mb-2">
				{#each selectedTags as tag (tag.id)}
					<button
						onclick={() => toggleTag(tag.id)}
						class="flex items-center gap-1 px-2 py-1 rounded text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
						style={tag.color ? `background-color: ${tag.color}20; color: ${tag.color}` : ''}
					>
						{tag.name}
						<X size={12} />
					</button>
				{/each}

				{#if showTagInput}
					<div class="flex items-center gap-1">
						<input
							type="text"
							bind:value={newTagName}
							placeholder={localeStore.t('snippetForm.newTagPlaceholder')}
							onkeydown={(e) => e.key === 'Enter' && createTag()}
							class="px-2 py-1 text-xs bg-surface border border-border rounded text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent w-24"
						/>
						<button
							onclick={createTag}
							class="p-1 text-accent hover:bg-accent/10 rounded transition-colors"
						>
							<Plus size={14} />
						</button>
						<button
							onclick={() => {
								showTagInput = false;
								newTagName = '';
							}}
							class="p-1 text-muted hover:text-foreground transition-colors"
						>
							<X size={14} />
						</button>
					</div>
				{:else}
					<button
						onclick={() => (showTagInput = true)}
						class="flex items-center gap-1 px-2 py-1 rounded text-xs border border-dashed border-border text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
					>
						<Plus size={12} />
						{localeStore.t('snippetForm.createTag')}
					</button>
				{/if}
			</div>

			{#if availableTags.length > 0}
				<div class="flex flex-wrap gap-1.5">
					{#each availableTags as tag (tag.id)}
						<button
							onclick={() => toggleTag(tag.id)}
							class="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
							style={tag.color ? `border-color: ${tag.color}40` : ''}
						>
							<TagIcon size={10} />
							{tag.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Content (Block Editor) -->
		<div>
			<label class="block text-sm font-medium text-foreground mb-1.5">{localeStore.t('snippetForm.content')}</label>
			<BlockEditor onUpdate={handleEditorUpdate} />
			<p class="mt-2 text-xs text-muted">
				{localeStore.t('snippetForm.contentHint')}
			</p>
		</div>
	</div>
</div>
