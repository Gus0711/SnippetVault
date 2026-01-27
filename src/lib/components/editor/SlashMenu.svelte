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

	interface Command {
		id: string;
		label: string;
		description: string;
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
		{ id: 'code', label: 'Bloc code', description: 'Inserer un bloc de code', icon: Code },
		{ id: 'json', label: 'JSON', description: 'Bloc JSON avec visualisation', icon: Braces },
		{ id: 'html', label: 'HTML', description: 'Bloc HTML avec apercu', icon: Globe },
		{ id: 'css', label: 'CSS', description: 'Bloc CSS (styles)', icon: Palette },
		{ id: 'image', label: 'Image', description: 'Uploader une image', icon: Image },
		{ id: 'file', label: 'Fichier', description: 'Joindre un fichier (PDF, ZIP...)', icon: FileIcon },
		{ id: 'table', label: 'Tableau', description: 'Inserer un tableau 3x3', icon: Table },
		{ id: 'divider', label: 'Separateur', description: 'Ligne de separation horizontale', icon: Minus },
		{ id: 'callout', label: 'Callout', description: 'Bloc d\'alerte (info, warning...)', icon: AlertCircle },
		{ id: 'todo', label: 'Todo', description: 'Liste de taches avec cases', icon: CheckSquare },
		{ id: 'link', label: 'Lien', description: 'Inserer un lien URL', icon: Link },
		{ id: 'h1', label: 'Titre 1', description: 'Grand titre', icon: Heading1 },
		{ id: 'h2', label: 'Titre 2', description: 'Titre moyen', icon: Heading2 },
		{ id: 'h3', label: 'Titre 3', description: 'Petit titre', icon: Heading3 },
		{ id: 'bullet', label: 'Liste', description: 'Liste a puces', icon: List },
		{ id: 'numbered', label: 'Liste numerotee', description: 'Liste ordonnee', icon: ListOrdered },
		{ id: 'quote', label: 'Citation', description: 'Bloc de citation', icon: Quote }
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
					<div class="text-foreground font-medium">{cmd.label}</div>
					<div class="text-xs text-muted truncate">{cmd.description}</div>
				</div>
			</button>
		{/each}
	</div>
{/if}
