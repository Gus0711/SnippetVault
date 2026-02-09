<script lang="ts">
	import {
		Code,
		Braces,
		Globe,
		Palette,
		Image,
		FileIcon,
		Table,
		Heading1,
		Heading2,
		Heading3,
		List,
		ListOrdered,
		Quote,
		Minus,
		AlertCircle,
		CheckSquare,
		Link
	} from 'lucide-svelte';
	import { localeStore } from '$lib/stores/locale.svelte';
	import type { TranslationKey } from '$lib/i18n';

	interface Command {
		id: string;
		labelKey: TranslationKey;
		descKey: TranslationKey;
		icon: typeof Code;
	}

	interface Props {
		query: string;
		position: { x: number; y: number };
		selectedIndex: number;
		onSelect: (command: string) => void;
		onHover: (index: number) => void;
	}

	let { query, position, selectedIndex, onSelect, onHover }: Props = $props();

	const commands: Command[] = [
		{ id: 'code', labelKey: 'slash.code', descKey: 'slash.codeDesc', icon: Code },
		{ id: 'json', labelKey: 'slash.json', descKey: 'slash.jsonDesc', icon: Braces },
		{ id: 'html', labelKey: 'slash.html', descKey: 'slash.htmlDesc', icon: Globe },
		{ id: 'css', labelKey: 'slash.css', descKey: 'slash.cssDesc', icon: Palette },
		{ id: 'image', labelKey: 'slash.image', descKey: 'slash.imageDesc', icon: Image },
		{ id: 'file', labelKey: 'slash.file', descKey: 'slash.fileDesc', icon: FileIcon },
		{ id: 'table', labelKey: 'slash.table', descKey: 'slash.tableDesc', icon: Table },
		{ id: 'divider', labelKey: 'slash.divider', descKey: 'slash.dividerDesc', icon: Minus },
		{ id: 'callout', labelKey: 'slash.callout', descKey: 'slash.calloutDesc', icon: AlertCircle },
		{ id: 'todo', labelKey: 'slash.todo', descKey: 'slash.todoDesc', icon: CheckSquare },
		{ id: 'link', labelKey: 'slash.link', descKey: 'slash.linkDesc', icon: Link },
		{ id: 'h1', labelKey: 'slash.h1', descKey: 'slash.h1Desc', icon: Heading1 },
		{ id: 'h2', labelKey: 'slash.h2', descKey: 'slash.h2Desc', icon: Heading2 },
		{ id: 'h3', labelKey: 'slash.h3', descKey: 'slash.h3Desc', icon: Heading3 },
		{ id: 'bullet', labelKey: 'slash.bullet', descKey: 'slash.bulletDesc', icon: List },
		{ id: 'numbered', labelKey: 'slash.numbered', descKey: 'slash.numberedDesc', icon: ListOrdered },
		{ id: 'quote', labelKey: 'slash.quote', descKey: 'slash.quoteDesc', icon: Quote }
	];

	// Filter using same keywords as BlockEditor
	const keywords: Record<string, string[]> = {
		code: ['code', 'snippet', 'pre', 'bloc'],
		json: ['json', 'api', 'data', 'object'],
		html: ['html', 'web', 'page', 'markup'],
		css: ['css', 'style', 'styles', 'stylesheet'],
		image: ['image', 'photo', 'picture', 'img'],
		file: ['file', 'fichier', 'attachment', 'upload', 'pdf', 'zip'],
		table: ['table', 'tableau', 'grid', 'grille'],
		divider: ['divider', 'separator', 'hr', 'ligne', 'separateur'],
		callout: ['callout', 'alert', 'note', 'warning', 'info', 'alerte'],
		todo: ['todo', 'task', 'tache', 'checkbox', 'checklist'],
		link: ['link', 'lien', 'url', 'href', 'http'],
		h1: ['heading', 'titre', 'h1', 'title'],
		h2: ['heading', 'titre', 'h2', 'subtitle'],
		h3: ['heading', 'titre', 'h3'],
		bullet: ['list', 'bullet', 'liste', 'ul'],
		numbered: ['numbered', 'ordered', 'ol', 'numero'],
		quote: ['quote', 'citation', 'blockquote']
	};

	const filtered = $derived(
		query.length === 0
			? commands
			: commands.filter((cmd) =>
					keywords[cmd.id]?.some((k) => k.toLowerCase().startsWith(query.toLowerCase()))
				)
	);
</script>

{#if filtered.length > 0}
	<div
		class="absolute z-50 bg-background border border-border rounded-lg shadow-lg py-1 w-56 max-h-64 overflow-y-auto"
		style="left: {position.x}px; top: {position.y}px"
		role="listbox"
	>
		{#each filtered as cmd, i (cmd.id)}
			<button
				onclick={() => onSelect(cmd.id)}
				onmouseenter={() => onHover(i)}
				class="flex items-center gap-3 px-3 py-2 text-sm w-full text-left transition-colors {i ===
				selectedIndex
					? 'bg-surface'
					: 'hover:bg-surface'}"
				role="option"
				aria-selected={i === selectedIndex}
			>
				<div
					class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-surface border border-border rounded"
				>
					<cmd.icon size={16} class="text-muted" />
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-foreground font-medium">{localeStore.t(cmd.labelKey)}</div>
					<div class="text-xs text-muted truncate">{localeStore.t(cmd.descKey)}</div>
				</div>
			</button>
		{/each}
	</div>
{/if}
