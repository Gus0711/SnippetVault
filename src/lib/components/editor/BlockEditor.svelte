<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TableHeader } from '@tiptap/extension-table-header';
	import { all, createLowlight } from 'lowlight';
	import { FileBlock } from './FileBlock';
	import SlashMenu from './SlashMenu.svelte';
	import {
		Code,
		Upload,
		ChevronDown,
		ChevronUp,
		ChevronsUpDown,
		ChevronsDownUp,
		Plus,
		Minus,
		Trash2,
		ToggleLeft,
		Rows3,
		Columns3,
		Sparkles,
		GripVertical
	} from 'lucide-svelte';
	import { detectLanguage } from '$lib/utils/colors';

	export interface Block {
		type: 'markdown' | 'code' | 'image' | 'file';
		content: string;
		language?: string | null;
		filePath?: string | null;
		fileName?: string | null;
		fileSize?: number | null;
	}

	interface Props {
		initialBlocks?: Block[];
		onUpdate?: (blocks: Block[]) => void;
		snippetId?: string | null;
	}

	let { initialBlocks = [], onUpdate, snippetId = null }: Props = $props();

	let element: HTMLDivElement;
	let editor: Editor | null = $state(null);

	// Slash menu state
	let showSlashMenu = $state(false);
	let slashMenuPosition = $state({ x: 0, y: 0 });
	let slashQuery = $state('');
	let slashRange = $state<{ from: number; to: number } | null>(null);
	let slashSelectedIndex = $state(0);

	// Slash menu commands
	const slashCommands = [
		{ id: 'code', keywords: ['code', 'snippet', 'pre', 'bloc'] },
		{ id: 'json', keywords: ['json', 'api', 'data', 'object'] },
		{ id: 'html', keywords: ['html', 'web', 'page', 'markup'] },
		{ id: 'css', keywords: ['css', 'style', 'styles', 'stylesheet'] },
		{ id: 'image', keywords: ['image', 'photo', 'picture', 'img'] },
		{ id: 'file', keywords: ['file', 'fichier', 'attachment', 'upload', 'pdf', 'zip'] },
		{ id: 'table', keywords: ['table', 'tableau', 'grid', 'grille'] },
		{ id: 'divider', keywords: ['divider', 'separator', 'hr', 'ligne', 'separateur'] },
		{ id: 'callout', keywords: ['callout', 'alert', 'note', 'warning', 'info', 'alerte'] },
		{ id: 'todo', keywords: ['todo', 'task', 'tache', 'checkbox', 'checklist'] },
		{ id: 'link', keywords: ['link', 'lien', 'url', 'href', 'http'] },
		{ id: 'h1', keywords: ['heading', 'titre', 'h1', 'title'] },
		{ id: 'h2', keywords: ['heading', 'titre', 'h2', 'subtitle'] },
		{ id: 'h3', keywords: ['heading', 'titre', 'h3'] },
		{ id: 'bullet', keywords: ['list', 'bullet', 'liste', 'ul'] },
		{ id: 'numbered', keywords: ['numbered', 'ordered', 'ol', 'numero'] },
		{ id: 'quote', keywords: ['quote', 'citation', 'blockquote'] }
	];

	// Filter commands based on query
	const getFilteredCommands = (query: string) => {
		if (query.length === 0) return slashCommands;
		return slashCommands.filter((cmd) =>
			cmd.keywords.some((k) => k.toLowerCase().startsWith(query.toLowerCase()))
		);
	};

	// File inputs
	let imageInput: HTMLInputElement;
	let fileInput: HTMLInputElement;
	let uploading = $state(false);

	// Language selector state
	let showLanguageSelector = $state(false);
	let currentCodeBlockLanguage = $state('plaintext');

	// Code block collapse state
	const CODE_COLLAPSE_THRESHOLD = 15;
	const CODE_PREVIEW_LINES = 5;
	let codeBlockCollapsed = $state(false); // Default to expanded in editor for easy editing
	let currentCodeBlockLineCount = $state(0);
	let shouldShowCollapseToggle = $derived(currentCodeBlockLineCount > CODE_COLLAPSE_THRESHOLD);

	// Auto-detect language state
	let detectedLanguage = $state<string | null>(null);
	let currentCodeBlockContent = $state('');

	// Drag handle state
	let dragHandleVisible = $state(false);
	let dragHandleTop = $state(0);
	let draggedBlockPos = $state<number | null>(null);
	let editorContainer: HTMLDivElement;

	// Auto-detect language for current code block
	const autoDetectLanguage = () => {
		if (!editor) return;
		const detected = detectLanguage(currentCodeBlockContent);
		if (detected && detected !== currentCodeBlockLanguage) {
			editor.chain().focus().updateAttributes('codeBlock', { language: detected }).run();
			detectedLanguage = detected;
			// Clear the notification after 2 seconds
			setTimeout(() => {
				detectedLanguage = null;
			}, 2000);
		}
	};

	// Table menu state
	let showTableMenu = $state(false);

	// Callout menu state
	let showCalloutMenu = $state(false);
	const calloutTypes = [
		{ id: 'info', label: 'Info', icon: 'ℹ️', color: '#3b82f6' },
		{ id: 'warning', label: 'Attention', icon: '⚠️', color: '#f59e0b' },
		{ id: 'success', label: 'Succes', icon: '✓', color: '#22c55e' },
		{ id: 'error', label: 'Erreur', icon: '✕', color: '#ef4444' }
	];

	// Link prompt state
	let showLinkPrompt = $state(false);
	let linkUrl = $state('');
	let linkText = $state('');

	// Common programming languages
	const languages = [
		{ id: 'javascript', label: 'JavaScript' },
		{ id: 'typescript', label: 'TypeScript' },
		{ id: 'python', label: 'Python' },
		{ id: 'java', label: 'Java' },
		{ id: 'csharp', label: 'C#' },
		{ id: 'cpp', label: 'C++' },
		{ id: 'c', label: 'C' },
		{ id: 'go', label: 'Go' },
		{ id: 'rust', label: 'Rust' },
		{ id: 'php', label: 'PHP' },
		{ id: 'ruby', label: 'Ruby' },
		{ id: 'swift', label: 'Swift' },
		{ id: 'kotlin', label: 'Kotlin' },
		{ id: 'html', label: 'HTML' },
		{ id: 'css', label: 'CSS' },
		{ id: 'sql', label: 'SQL' },
		{ id: 'json', label: 'JSON' },
		{ id: 'yaml', label: 'YAML' },
		{ id: 'bash', label: 'Bash' },
		{ id: 'shell', label: 'Shell' },
		{ id: 'markdown', label: 'Markdown' },
		{ id: 'xml', label: 'XML' },
		{ id: 'plaintext', label: 'Plain text' }
	];

	const lowlight = createLowlight(all);

	// Parse markdown table lines into TipTap table node
	function parseMarkdownTable(tableLines: string[]): any | null {
		if (tableLines.length < 2) return null;

		const rows: any[] = [];
		let isFirstRow = true;

		for (const line of tableLines) {
			// Skip separator row (| --- | --- |)
			if (line.match(/^\|[\s-:|]+\|$/)) continue;

			const cells = line
				.split('|')
				.slice(1, -1) // Remove empty strings from start/end
				.map((cell) => cell.trim());

			if (cells.length === 0) continue;

			const cellType = isFirstRow ? 'tableHeader' : 'tableCell';
			const rowContent = cells.map((cellText) => ({
				type: cellType,
				content: [
					{
						type: 'paragraph',
						content: cellText ? [{ type: 'text', text: cellText }] : []
					}
				]
			}));

			rows.push({
				type: 'tableRow',
				content: rowContent
			});

			isFirstRow = false;
		}

		if (rows.length === 0) return null;

		return {
			type: 'table',
			content: rows
		};
	}

	// Convert blocks to TipTap content
	function blocksToContent(blocks: Block[]): any {
		if (blocks.length === 0) {
			return { type: 'doc', content: [{ type: 'paragraph' }] };
		}

		const content: any[] = [];

		for (const block of blocks) {
			if (block.type === 'code') {
				content.push({
					type: 'codeBlock',
					attrs: { language: block.language || 'plaintext' },
					content: block.content ? [{ type: 'text', text: block.content }] : []
				});
			} else if (block.type === 'image' && block.filePath) {
				content.push({
					type: 'image',
					attrs: { src: block.filePath }
				});
			} else if (block.type === 'file' && block.filePath) {
				content.push({
					type: 'fileBlock',
					attrs: {
						src: block.filePath,
						name: block.fileName || 'file',
						size: block.fileSize || 0
					}
				});
			} else if (block.type === 'markdown') {
				const lines = (block.content || '').split('\n');
				let i = 0;

				while (i < lines.length) {
					const line = lines[i];

					// Check if this starts a markdown table
					if (line.match(/^\|.*\|$/)) {
						const tableLines: string[] = [line];
						i++;
						while (i < lines.length && lines[i].match(/^\|.*\|$/)) {
							tableLines.push(lines[i]);
							i++;
						}
						const tableNode = parseMarkdownTable(tableLines);
						if (tableNode) {
							content.push(tableNode);
						}
						continue;
					}

					if (line.startsWith('# ')) {
						content.push({
							type: 'heading',
							attrs: { level: 1 },
							content: [{ type: 'text', text: line.slice(2) }]
						});
					} else if (line.startsWith('## ')) {
						content.push({
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: line.slice(3) }]
						});
					} else if (line.startsWith('### ')) {
						content.push({
							type: 'heading',
							attrs: { level: 3 },
							content: [{ type: 'text', text: line.slice(4) }]
						});
					} else if (line.startsWith('- ')) {
						// Parse bullet list
						const listItems: any[] = [];
						while (i < lines.length && lines[i].startsWith('- ')) {
							listItems.push({
								type: 'listItem',
								content: [
									{
										type: 'paragraph',
										content: [{ type: 'text', text: lines[i].slice(2) }]
									}
								]
							});
							i++;
						}
						content.push({
							type: 'bulletList',
							content: listItems
						});
						continue;
					} else if (line.match(/^\d+\.\s/)) {
						// Parse ordered list
						const listItems: any[] = [];
						while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
							const text = lines[i].replace(/^\d+\.\s/, '');
							listItems.push({
								type: 'listItem',
								content: [
									{
										type: 'paragraph',
										content: [{ type: 'text', text }]
									}
								]
							});
							i++;
						}
						content.push({
							type: 'orderedList',
							content: listItems
						});
						continue;
					} else if (line.startsWith('> ')) {
						// Parse blockquote
						const quoteLines: any[] = [];
						while (i < lines.length && lines[i].startsWith('> ')) {
							quoteLines.push({
								type: 'paragraph',
								content: [{ type: 'text', text: lines[i].slice(2) }]
							});
							i++;
						}
						content.push({
							type: 'blockquote',
							content: quoteLines
						});
						continue;
					} else if (line.trim()) {
						content.push({
							type: 'paragraph',
							content: [{ type: 'text', text: line }]
						});
					}
					i++;
				}
			}
		}

		return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] };
	}

	// Extract blocks from TipTap content
	function extractBlocks(ed: Editor): Block[] {
		const blocks: Block[] = [];
		const doc = ed.getJSON() as { content?: any[] };

		if (!doc.content) return blocks;

		let currentMarkdown: string[] = [];

		const flushMarkdown = () => {
			if (currentMarkdown.length > 0) {
				blocks.push({
					type: 'markdown',
					content: currentMarkdown.join('\n')
				});
				currentMarkdown = [];
			}
		};

		const getTextContent = (node: any): string => {
			if (!node?.content) return '';
			return node.content.map((c: any) => c.text || '').join('');
		};

		for (const node of doc.content) {
			if (node.type === 'codeBlock') {
				flushMarkdown();
				blocks.push({
					type: 'code',
					content: getTextContent(node),
					language: node.attrs?.language || 'plaintext'
				});
			} else if (node.type === 'image') {
				flushMarkdown();
				blocks.push({
					type: 'image',
					content: '',
					filePath: node.attrs?.src || null
				});
			} else if (node.type === 'fileBlock') {
				flushMarkdown();
				blocks.push({
					type: 'file',
					content: '',
					filePath: node.attrs?.src || null,
					fileName: node.attrs?.name || 'file',
					fileSize: node.attrs?.size || 0
				});
			} else if (node.type === 'table') {
				flushMarkdown();
				// Convert table to markdown format for storage
				const rows: string[][] = [];
				for (const row of node.content || []) {
					const cells: string[] = [];
					for (const cell of row.content || []) {
						const text = getTextContent(cell?.content?.[0]);
						cells.push(text);
					}
					rows.push(cells);
				}
				if (rows.length > 0) {
					const mdRows: string[] = [];
					mdRows.push('| ' + rows[0].join(' | ') + ' |');
					mdRows.push('| ' + rows[0].map(() => '---').join(' | ') + ' |');
					for (let i = 1; i < rows.length; i++) {
						mdRows.push('| ' + rows[i].join(' | ') + ' |');
					}
					currentMarkdown.push(mdRows.join('\n'));
				}
			} else if (node.type === 'paragraph') {
				const text = getTextContent(node);
				currentMarkdown.push(text);
			} else if (node.type === 'heading') {
				const level = node.attrs?.level || 1;
				const text = getTextContent(node);
				const prefix = '#'.repeat(level) + ' ';
				currentMarkdown.push(prefix + text);
			} else if (node.type === 'bulletList') {
				for (const item of node.content || []) {
					const text = getTextContent(item?.content?.[0]);
					currentMarkdown.push('- ' + text);
				}
			} else if (node.type === 'orderedList') {
				let i = 1;
				for (const item of node.content || []) {
					const text = getTextContent(item?.content?.[0]);
					currentMarkdown.push(`${i}. ` + text);
					i++;
				}
			} else if (node.type === 'blockquote') {
				for (const p of node.content || []) {
					const text = getTextContent(p);
					currentMarkdown.push('> ' + text);
				}
			}
		}

		flushMarkdown();

		return blocks;
	}

	// Change language of current code block
	const changeLanguage = (language: string) => {
		if (!editor) return;
		editor.chain().focus().updateAttributes('codeBlock', { language }).run();
		showLanguageSelector = false;
	};

	// Insert callout
	const insertCallout = (type: string) => {
		if (!editor) return;
		const callout = calloutTypes.find(c => c.id === type);
		if (!callout) return;

		// Insert a blockquote with a special format
		editor.chain().focus()
			.setBlockquote()
			.insertContent(`[!${type.toUpperCase()}] `)
			.run();

		// Set the data attribute on the blockquote after a brief delay
		setTimeout(() => {
			const { selection } = editor!.state;
			const resolved = selection.$from;
			// Find the blockquote ancestor
			for (let depth = resolved.depth; depth > 0; depth--) {
				const node = resolved.node(depth);
				if (node.type.name === 'blockquote') {
					const pos = resolved.before(depth);
					const domNode = editor!.view.nodeDOM(pos);
					if (domNode instanceof HTMLElement) {
						domNode.setAttribute('data-callout', type);
					}
					break;
				}
			}
		}, 0);

		showCalloutMenu = false;
	};

	// Prompt for link
	const promptForLink = () => {
		// Get selected text if any
		if (editor) {
			const { from, to } = editor.state.selection;
			const selectedText = editor.state.doc.textBetween(from, to, '');
			linkText = selectedText;
		}
		linkUrl = '';
		showLinkPrompt = true;
	};

	// Insert link
	const insertLink = () => {
		if (!editor || !linkUrl) return;

		if (linkText) {
			// Insert link with text
			editor.chain().focus()
				.insertContent(`<a href="${linkUrl}">${linkText}</a>`)
				.run();
		} else {
			// Set link on selection or insert URL as text
			editor.chain().focus()
				.setLink({ href: linkUrl })
				.run();
		}

		showLinkPrompt = false;
		linkUrl = '';
		linkText = '';
	};

	// Handle slash command
	const handleSlashCommand = (command: string) => {
		if (!editor || !slashRange) return;

		// Delete the slash and query
		editor.chain().focus().deleteRange(slashRange).run();

		switch (command) {
			case 'code':
				editor.chain().focus().setCodeBlock({ language: 'plaintext' }).run();
				break;
			case 'json':
				editor.chain().focus().setCodeBlock({ language: 'json' }).run();
				break;
			case 'html':
				editor.chain().focus().setCodeBlock({ language: 'html' }).run();
				break;
			case 'css':
				editor.chain().focus().setCodeBlock({ language: 'css' }).run();
				break;
			case 'image':
				imageInput?.click();
				break;
			case 'file':
				fileInput?.click();
				break;
			case 'table':
				editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
				break;
			case 'divider':
				editor.chain().focus().setHorizontalRule().run();
				break;
			case 'callout':
				showCalloutMenu = true;
				break;
			case 'todo':
				editor.chain().focus().toggleTaskList().run();
				break;
			case 'link':
				promptForLink();
				break;
			case 'h1':
				editor.chain().focus().toggleHeading({ level: 1 }).run();
				break;
			case 'h2':
				editor.chain().focus().toggleHeading({ level: 2 }).run();
				break;
			case 'h3':
				editor.chain().focus().toggleHeading({ level: 3 }).run();
				break;
			case 'bullet':
				editor.chain().focus().toggleBulletList().run();
				break;
			case 'numbered':
				editor.chain().focus().toggleOrderedList().run();
				break;
			case 'quote':
				editor.chain().focus().toggleBlockquote().run();
				break;
		}

		showSlashMenu = false;
		slashQuery = '';
		slashRange = null;
	};

	// Upload file (image or general file)
	const uploadFile = async (file: File, type: 'image' | 'file') => {
		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', type);
			if (snippetId) {
				formData.append('snippetId', snippetId);
			}

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				if (result.data.isImage) {
					editor?.chain().focus().setImage({ src: result.data.path }).run();
				} else {
					editor?.chain().focus().setFileBlock({
						src: result.data.path,
						name: result.data.name,
						size: result.data.size
					}).run();
				}
			}
		} catch (e) {
			console.error('Upload failed:', e);
		} finally {
			uploading = false;
		}
	};

	const handleImageSelect = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			uploadFile(file, 'image');
			target.value = '';
		}
	};

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			uploadFile(file, 'file');
			target.value = '';
		}
	};

	// Handle paste for images
	const handlePaste = (e: ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) {
					uploadFile(file, 'image');
				}
				return;
			}
		}
	};

	// Handle drop for files
	const handleDrop = (e: DragEvent) => {
		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		e.preventDefault();
		const file = files[0];
		const type = file.type.startsWith('image/') ? 'image' : 'file';
		uploadFile(file, type);
	};

	// Handle mouse move to show block handle
	const handleEditorMouseMove = (e: MouseEvent) => {
		if (!editor || !editorContainer) return;

		const editorRect = editorContainer.getBoundingClientRect();
		const x = e.clientX - editorRect.left;

		// Only show handle when mouse is near the left edge (within 50px)
		if (x > 50) {
			dragHandleVisible = false;
			return;
		}

		// Find the block at the current mouse position
		const pos = editor.view.posAtCoords({ left: e.clientX + 60, top: e.clientY });
		if (!pos) {
			dragHandleVisible = false;
			return;
		}

		try {
			const resolved = editor.state.doc.resolve(pos.pos);
			const blockPos = resolved.before(1);
			const blockNode = editor.state.doc.nodeAt(blockPos);

			if (!blockNode) {
				dragHandleVisible = false;
				return;
			}

			// Get the DOM element for this block
			const domNode = editor.view.nodeDOM(blockPos);
			if (!domNode || !(domNode instanceof HTMLElement)) {
				dragHandleVisible = false;
				return;
			}

			const blockRect = domNode.getBoundingClientRect();
			dragHandleTop = blockRect.top - editorRect.top;
			draggedBlockPos = blockPos;
			dragHandleVisible = true;
		} catch {
			dragHandleVisible = false;
		}
	};

	const handleEditorMouseLeave = () => {
		// Delay hiding to allow clicking the buttons
		setTimeout(() => {
			dragHandleVisible = false;
		}, 200);
	};

	// Move block at stored position up
	const moveHandleBlockUp = () => {
		if (!editor || draggedBlockPos === null) return;

		const { state, view } = editor;
		const blockNode = state.doc.nodeAt(draggedBlockPos);
		if (!blockNode) return;

		// Check if there's a previous block
		const resolvedBefore = state.doc.resolve(draggedBlockPos);
		if (resolvedBefore.nodeBefore === null) return;

		const prevBlockPos = draggedBlockPos - resolvedBefore.nodeBefore.nodeSize;

		// Create transaction
		const tr = state.tr;
		const blockEnd = draggedBlockPos + blockNode.nodeSize;
		const content = blockNode.copy(blockNode.content);

		tr.delete(draggedBlockPos, blockEnd);
		tr.insert(prevBlockPos, content);

		view.dispatch(tr.scrollIntoView());

		// Update stored position
		draggedBlockPos = prevBlockPos;
	};

	// Move block at stored position down
	const moveHandleBlockDown = () => {
		if (!editor || draggedBlockPos === null) return;

		const { state, view } = editor;
		const blockNode = state.doc.nodeAt(draggedBlockPos);
		if (!blockNode) return;

		const blockEnd = draggedBlockPos + blockNode.nodeSize;

		// Check if there's a next block
		if (blockEnd >= state.doc.content.size) return;

		const nextBlockNode = state.doc.nodeAt(blockEnd);
		if (!nextBlockNode) return;

		const nextBlockEnd = blockEnd + nextBlockNode.nodeSize;

		// Create transaction - swap the two blocks
		const tr = state.tr;
		const currentContent = blockNode.copy(blockNode.content);
		const nextContent = nextBlockNode.copy(nextBlockNode.content);

		tr.delete(draggedBlockPos, nextBlockEnd);
		tr.insert(draggedBlockPos, nextContent);
		tr.insert(draggedBlockPos + nextBlockNode.nodeSize, currentContent);

		view.dispatch(tr.scrollIntoView());

		// Update stored position
		draggedBlockPos = draggedBlockPos + nextBlockNode.nodeSize;
	};

	// Table actions
	const addRowBefore = () => editor?.chain().focus().addRowBefore().run();
	const addRowAfter = () => editor?.chain().focus().addRowAfter().run();
	const deleteRow = () => editor?.chain().focus().deleteRow().run();
	const addColumnBefore = () => editor?.chain().focus().addColumnBefore().run();
	const addColumnAfter = () => editor?.chain().focus().addColumnAfter().run();
	const deleteColumn = () => editor?.chain().focus().deleteColumn().run();
	const deleteTable = () => editor?.chain().focus().deleteTable().run();
	const toggleHeaderRow = () => editor?.chain().focus().toggleHeaderRow().run();
	const toggleHeaderColumn = () => editor?.chain().focus().toggleHeaderColumn().run();
	const toggleHeaderCell = () => editor?.chain().focus().toggleHeaderCell().run();

	// Block movement - move current block up or down
	const moveBlockUp = () => {
		if (!editor) return false;
		const { state, view } = editor;
		const { selection } = state;
		const fromPos = selection.$from;

		// Find the top-level block containing the cursor
		// In ProseMirror, depth 0 is the doc, depth 1 is the top-level block
		let blockPos = fromPos.before(1);
		let blockNode = state.doc.nodeAt(blockPos);

		if (!blockNode || blockPos === 0) return false; // Already at the top or invalid

		// Find the previous block
		const resolvedBefore = state.doc.resolve(blockPos);
		if (resolvedBefore.nodeBefore === null) return false; // No previous block

		const prevBlockPos = blockPos - resolvedBefore.nodeBefore.nodeSize;
		const prevBlockNode = state.doc.nodeAt(prevBlockPos);

		if (!prevBlockNode) return false;

		// Create transaction to swap blocks
		const tr = state.tr;

		// Calculate positions
		const currentBlockEnd = blockPos + blockNode.nodeSize;
		const prevBlockEnd = blockPos;

		// Delete current block and insert before previous
		const currentBlockContent = blockNode.copy(blockNode.content);
		tr.delete(blockPos, currentBlockEnd);
		tr.insert(prevBlockPos, currentBlockContent);

		// Set selection to the moved block
		const newPos = prevBlockPos + 1;
		tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newPos)));

		view.dispatch(tr.scrollIntoView());
		return true;
	};

	const moveBlockDown = () => {
		if (!editor) return false;
		const { state, view } = editor;
		const { selection } = state;
		const fromPos = selection.$from;

		// Find the top-level block containing the cursor
		let blockPos = fromPos.before(1);
		let blockNode = state.doc.nodeAt(blockPos);

		if (!blockNode) return false;

		const blockEnd = blockPos + blockNode.nodeSize;

		// Check if there's a next block
		if (blockEnd >= state.doc.content.size) return false; // Already at the bottom

		const nextBlockNode = state.doc.nodeAt(blockEnd);
		if (!nextBlockNode) return false;

		const nextBlockEnd = blockEnd + nextBlockNode.nodeSize;

		// Create transaction to swap blocks
		const tr = state.tr;

		// Copy the next block and current block
		const nextBlockContent = nextBlockNode.copy(nextBlockNode.content);
		const currentBlockContent = blockNode.copy(blockNode.content);

		// Replace both blocks with swapped order
		tr.delete(blockPos, nextBlockEnd);
		tr.insert(blockPos, nextBlockContent);
		tr.insert(blockPos + nextBlockNode.nodeSize, currentBlockContent);

		// Set selection to the moved block (now after the swapped block)
		const newPos = blockPos + nextBlockNode.nodeSize + 1;
		tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newPos)));

		view.dispatch(tr.scrollIntoView());
		return true;
	};

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({
					codeBlock: false,
					heading: { levels: [1, 2, 3] },
					dropcursor: {
						color: 'var(--accent, #58a6ff)',
						width: 2
					}
				}),
				Placeholder.configure({
					placeholder: 'Tapez / pour inserer un bloc...'
				}),
				Image.configure({
					inline: false,
					allowBase64: false
				}),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: 'editor-link'
					}
				}),
				TaskList.configure({
					HTMLAttributes: {
						class: 'editor-task-list'
					}
				}),
				TaskItem.configure({
					nested: true,
					HTMLAttributes: {
						class: 'editor-task-item'
					}
				}),
				CodeBlockLowlight.configure({
					lowlight,
					defaultLanguage: 'plaintext'
				}),
				Table.configure({
					resizable: true,
					HTMLAttributes: {
						class: 'editor-table'
					}
				}),
				TableRow,
				TableHeader,
				TableCell,
				FileBlock
			],
			content: blocksToContent(initialBlocks),
			onUpdate: ({ editor: ed }) => {
				onUpdate?.(extractBlocks(ed));

				// Update callout styles based on content
				setTimeout(() => {
					const blockquotes = element?.querySelectorAll('blockquote');
					blockquotes?.forEach((bq) => {
						const text = bq.textContent || '';
						const match = text.match(/^\[!(INFO|WARNING|SUCCESS|ERROR)\]/i);
						if (match) {
							bq.setAttribute('data-callout', match[1].toLowerCase());
						} else {
							bq.removeAttribute('data-callout');
						}
					});
				}, 0);
			},
			onTransaction: ({ editor: ed }) => {
				// Check for slash commands
				const { selection } = ed.state;
				const fromPos = selection.$from;
				const textBefore = fromPos.parent.textContent.slice(0, fromPos.parentOffset);

				const slashMatch = textBefore.match(/\/(\w*)$/);

				if (slashMatch) {
					const from = fromPos.pos - slashMatch[0].length;
					const to = fromPos.pos;

					// Get cursor position for menu
					const coords = ed.view.coordsAtPos(from);
					const editorRect = element.getBoundingClientRect();

					slashMenuPosition = {
						x: coords.left - editorRect.left,
						y: coords.bottom - editorRect.top + 4
					};
					if (slashQuery !== slashMatch[1]) {
						slashSelectedIndex = 0;
					}
					slashQuery = slashMatch[1];
					slashRange = { from, to };
					showSlashMenu = true;
				} else {
					showSlashMenu = false;
					slashQuery = '';
					slashRange = null;
					slashSelectedIndex = 0;
				}

				// Check if cursor is in a code block
				const isInCodeBlock = ed.isActive('codeBlock');
				if (isInCodeBlock) {
					const attrs = ed.getAttributes('codeBlock');
					currentCodeBlockLanguage = attrs.language || 'plaintext';

					// Count lines in current code block and get content
					const { from } = ed.state.selection;
					const resolved = ed.state.doc.resolve(from);
					const node = resolved.node(resolved.depth);
					if (node && node.type.name === 'codeBlock') {
						const content = node.textContent || '';
						currentCodeBlockLineCount = content.split('\n').length;
						currentCodeBlockContent = content;
					}
				} else {
					currentCodeBlockLineCount = 0;
					currentCodeBlockContent = '';
				}
			},
			editorProps: {
				attributes: {
					class: 'tiptap prose prose-sm max-w-none'
				},
				handleKeyDown: (view, event) => {
					// Block movement: Alt + Arrow Up/Down
					if (event.altKey && event.key === 'ArrowUp') {
						event.preventDefault();
						moveBlockUp();
						return true;
					}
					if (event.altKey && event.key === 'ArrowDown') {
						event.preventDefault();
						moveBlockDown();
						return true;
					}

					if (showSlashMenu) {
						const filtered = getFilteredCommands(slashQuery);

						if (event.key === 'Escape') {
							showSlashMenu = false;
							slashQuery = '';
							slashRange = null;
							slashSelectedIndex = 0;
							return true;
						}

						if (event.key === 'ArrowDown') {
							event.preventDefault();
							slashSelectedIndex = (slashSelectedIndex + 1) % filtered.length;
							return true;
						}

						if (event.key === 'ArrowUp') {
							event.preventDefault();
							slashSelectedIndex = (slashSelectedIndex - 1 + filtered.length) % filtered.length;
							return true;
						}

						if (event.key === 'Enter') {
							event.preventDefault();
							if (filtered[slashSelectedIndex]) {
								handleSlashCommand(filtered[slashSelectedIndex].id);
							}
							return true;
						}
					}
					return false;
				}
			}
		});

		if (initialBlocks.length === 0) {
			onUpdate?.([]);
		}
	});

	onDestroy(() => {
		editor?.destroy();
	});
</script>

<div class="relative block-editor">
	<!-- Language selector for code blocks -->
	{#if editor?.isActive('codeBlock')}
		<div class="absolute top-2 right-2 z-20 flex items-center gap-1">
			<!-- Auto-detect button -->
			{#if currentCodeBlockLanguage === 'plaintext' && currentCodeBlockContent.length > 10}
				<button
					onclick={autoDetectLanguage}
					class="flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 border border-accent/30 text-accent rounded hover:bg-accent/20 transition-colors"
					title="Detecter le langage automatiquement"
				>
					<Sparkles size={12} />
					<span class="text-[10px]">Auto</span>
				</button>
			{/if}
			<!-- Detection notification -->
			{#if detectedLanguage}
				<span class="px-2 py-1 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded">
					{detectedLanguage}
				</span>
			{/if}
			<!-- Collapse toggle -->
			{#if shouldShowCollapseToggle}
				<button
					onclick={() => (codeBlockCollapsed = !codeBlockCollapsed)}
					class="flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded hover:bg-surface transition-colors"
					title={codeBlockCollapsed ? 'Expand code' : 'Collapse code'}
				>
					{#if codeBlockCollapsed}
						<ChevronsUpDown size={12} class="text-muted" />
						<span class="text-foreground text-[10px]">+{currentCodeBlockLineCount - CODE_PREVIEW_LINES}</span>
					{:else}
						<ChevronsDownUp size={12} class="text-muted" />
					{/if}
				</button>
			{/if}
			<div class="relative">
				<button
					onclick={() => (showLanguageSelector = !showLanguageSelector)}
					class="flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded hover:bg-surface transition-colors"
				>
					<Code size={12} class="text-muted" />
					<span class="text-foreground"
						>{languages.find((l) => l.id === currentCodeBlockLanguage)?.label ||
							currentCodeBlockLanguage}</span
					>
					<ChevronDown size={12} class="text-muted" />
				</button>
				{#if showLanguageSelector}
					<button
						class="fixed inset-0 z-40"
						onclick={() => (showLanguageSelector = false)}
						aria-label="Close menu"
					></button>
					<div
						class="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg py-1 w-40 max-h-64 overflow-y-auto z-50"
					>
						{#each languages as lang (lang.id)}
							<button
								onclick={() => changeLanguage(lang.id)}
								class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors {lang.id ===
								currentCodeBlockLanguage
									? 'text-accent bg-accent/5'
									: 'text-foreground'}"
							>
								{lang.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Table toolbar -->
	{#if editor?.isActive('table')}
		<div class="absolute top-2 right-2 z-20">
			<div class="relative">
				<button
					onclick={() => (showTableMenu = !showTableMenu)}
					class="flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded hover:bg-surface transition-colors"
				>
					<span class="text-foreground">Tableau</span>
					<ChevronDown size={12} class="text-muted" />
				</button>
				{#if showTableMenu}
					<button
						class="fixed inset-0 z-40"
						onclick={() => (showTableMenu = false)}
						aria-label="Close menu"
					></button>
					<div
						class="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg py-1 w-52 z-50"
					>
						<div class="px-2 py-1 text-[10px] text-muted uppercase tracking-wide">En-tetes</div>
						<button
							onclick={() => {
								toggleHeaderRow();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<Rows3 size={12} />
							Basculer ligne en-tete
						</button>
						<button
							onclick={() => {
								toggleHeaderColumn();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<Columns3 size={12} />
							Basculer colonne en-tete
						</button>
						<button
							onclick={() => {
								toggleHeaderCell();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<ToggleLeft size={12} />
							Basculer cellule en-tete
						</button>

						<div class="border-t border-border my-1"></div>
						<div class="px-2 py-1 text-[10px] text-muted uppercase tracking-wide">Lignes</div>
						<button
							onclick={() => {
								addRowBefore();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<Plus size={12} />
							Ajouter ligne avant
						</button>
						<button
							onclick={() => {
								addRowAfter();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<Plus size={12} />
							Ajouter ligne apres
						</button>
						<button
							onclick={() => {
								deleteRow();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-red-500 flex items-center gap-2"
						>
							<Minus size={12} />
							Supprimer ligne
						</button>

						<div class="border-t border-border my-1"></div>
						<div class="px-2 py-1 text-[10px] text-muted uppercase tracking-wide">Colonnes</div>
						<button
							onclick={() => {
								addColumnBefore();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<Plus size={12} />
							Ajouter colonne avant
						</button>
						<button
							onclick={() => {
								addColumnAfter();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-foreground flex items-center gap-2"
						>
							<Plus size={12} />
							Ajouter colonne apres
						</button>
						<button
							onclick={() => {
								deleteColumn();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-red-500 flex items-center gap-2"
						>
							<Minus size={12} />
							Supprimer colonne
						</button>

						<div class="border-t border-border my-1"></div>
						<button
							onclick={() => {
								deleteTable();
								showTableMenu = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm hover:bg-surface transition-colors text-red-500 flex items-center gap-2"
						>
							<Trash2 size={12} />
							Supprimer tableau
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Editor container with drag handle -->
	<!-- Editor container with block handle -->
	<div
		bind:this={editorContainer}
		class="editor-container relative"
		onmousemove={handleEditorMouseMove}
		onmouseleave={handleEditorMouseLeave}
	>
		<!-- Block move handle (horizontal) -->
		{#if dragHandleVisible}
			<div
				class="block-handle"
				style="top: {dragHandleTop}px"
				onmouseenter={() => dragHandleVisible = true}
			>
				<button
					type="button"
					class="handle-btn"
					onclick={moveHandleBlockUp}
					title="Deplacer vers le haut (Alt+Up)"
				>
					<ChevronUp size={14} />
				</button>
				<button
					type="button"
					class="handle-btn"
					onclick={moveHandleBlockDown}
					title="Deplacer vers le bas (Alt+Down)"
				>
					<ChevronDown size={14} />
				</button>
			</div>
		{/if}

		<div
			bind:this={element}
			class="min-h-[200px] bg-surface border border-border rounded-lg p-4 pl-10 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent"
			class:code-blocks-collapsed={codeBlockCollapsed && shouldShowCollapseToggle}
			onpaste={handlePaste}
			ondrop={handleDrop}
			ondragover={(e) => e.preventDefault()}
			role="textbox"
			tabindex="0"
		></div>
	</div>

	{#if showSlashMenu}
		<SlashMenu
			query={slashQuery}
			position={slashMenuPosition}
			selectedIndex={slashSelectedIndex}
			onSelect={handleSlashCommand}
			onHover={(i) => (slashSelectedIndex = i)}
		/>
	{/if}

	{#if uploading}
		<div class="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
			<div class="flex items-center gap-2 text-sm text-muted">
				<Upload size={16} class="animate-pulse" />
				Upload en cours...
			</div>
		</div>
	{/if}

	<!-- Hidden file inputs -->
	<input
		type="file"
		accept="image/*"
		class="hidden"
		bind:this={imageInput}
		onchange={handleImageSelect}
	/>
	<input type="file" class="hidden" bind:this={fileInput} onchange={handleFileSelect} />

	<!-- Callout menu -->
	{#if showCalloutMenu}
		<button
			class="fixed inset-0 z-40"
			onclick={() => (showCalloutMenu = false)}
			aria-label="Close menu"
		></button>
		<div
			class="absolute z-50 bg-background border border-border rounded-lg shadow-lg py-2 w-48"
			style="left: {slashMenuPosition.x}px; top: {slashMenuPosition.y}px"
		>
			<div class="px-3 py-1 text-xs text-muted uppercase tracking-wide">Type de callout</div>
			{#each calloutTypes as callout (callout.id)}
				<button
					onclick={() => insertCallout(callout.id)}
					class="w-full px-3 py-2 text-left text-sm hover:bg-surface transition-colors flex items-center gap-3"
				>
					<span
						class="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
						style="background-color: {callout.color}"
					>
						{callout.icon}
					</span>
					<span class="text-foreground">{callout.label}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Link prompt -->
	{#if showLinkPrompt}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm p-4">
				<h3 class="text-sm font-medium text-foreground mb-3">Inserer un lien</h3>
				<div class="space-y-3">
					<div>
						<label class="block text-xs text-muted mb-1">URL</label>
						<input
							type="url"
							bind:value={linkUrl}
							placeholder="https://example.com"
							class="w-full px-3 py-2 bg-surface border border-border rounded text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
							autofocus
						/>
					</div>
					<div>
						<label class="block text-xs text-muted mb-1">Texte (optionnel)</label>
						<input
							type="text"
							bind:value={linkText}
							placeholder="Texte du lien"
							class="w-full px-3 py-2 bg-surface border border-border rounded text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
						/>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-4">
					<button
						onclick={() => (showLinkPrompt = false)}
						class="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						onclick={insertLink}
						disabled={!linkUrl}
						class="px-3 py-1.5 text-sm bg-accent text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						Inserer
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Keyboard shortcuts hint -->
	<div class="keyboard-hint">
		<kbd>Alt</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd> deplacer le bloc
	</div>
</div>

<style>
	/* Table card wrapper in editor */
	:global(.block-editor .tiptap .tableWrapper) {
		background-color: var(--surface, #161b22);
		border: 1px solid var(--border, #30363d);
		border-radius: 0.5rem;
		padding: 1rem;
		margin: 1rem 0;
		max-width: 900px;
		overflow-x: auto;
	}

	:global(.block-editor .tiptap table),
	:global(.block-editor .editor-table) {
		border-collapse: collapse;
		width: auto;
		margin: 0;
		table-layout: auto;
	}

	:global(.block-editor .tiptap th),
	:global(.block-editor .tiptap td) {
		border: 1px solid var(--border, #30363d);
		padding: 0.75rem 1rem;
		text-align: left;
		min-width: 80px;
		position: relative;
		vertical-align: top;
		font-size: 0.875rem;
	}

	:global(.block-editor .tiptap th) {
		background-color: color-mix(in srgb, var(--surface, #161b22) 50%, var(--background, #0d1117));
		font-weight: 600;
		color: var(--foreground, #e6edf3);
		border-bottom: 2px solid var(--border, #30363d);
	}

	:global(.block-editor .tiptap td) {
		background-color: transparent;
	}

	:global(.block-editor .tiptap tr:hover td) {
		background-color: color-mix(in srgb, var(--surface, #161b22) 30%, transparent);
	}

	:global(.block-editor .tiptap .selectedCell::after) {
		content: '';
		position: absolute;
		inset: 0;
		background-color: var(--accent, #58a6ff);
		opacity: 0.15;
		pointer-events: none;
	}

	:global(.block-editor .tiptap .column-resize-handle) {
		position: absolute;
		right: -2px;
		top: 0;
		bottom: 0;
		width: 4px;
		background-color: var(--accent, #58a6ff);
		cursor: col-resize;
		opacity: 0;
		transition: opacity 0.15s;
	}

	:global(.block-editor .tiptap table:hover .column-resize-handle),
	:global(.block-editor .tiptap .column-resize-handle:hover) {
		opacity: 1;
	}

	/* File block styles */
	:global(.block-editor .file-block) {
		margin: 0.75rem 0;
		user-select: none;
	}

	:global(.block-editor .file-block-link) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		text-decoration: none;
		color: var(--foreground);
		transition: all 0.15s ease;
	}

	:global(.block-editor .file-block-link:hover) {
		background-color: var(--background);
		border-color: var(--accent);
	}

	:global(.block-editor .file-block-icon) {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	:global(.block-editor .file-block-info) {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.block-editor .file-block-name) {
		font-weight: 500;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.block-editor .file-block-size) {
		font-size: 0.75rem;
		color: var(--muted);
	}

	:global(.block-editor .file-block-download) {
		flex-shrink: 0;
		padding: 0.375rem 0.75rem;
		background-color: var(--accent);
		color: white;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.block-editor .file-block-link:hover .file-block-download) {
		opacity: 0.9;
	}

	/* Code block collapse styles */
	.code-blocks-collapsed :global(.tiptap pre) {
		position: relative;
		max-height: calc(1.6em * 5 + 2rem);
		overflow: hidden;
	}

	.code-blocks-collapsed :global(.tiptap pre)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3rem;
		background: linear-gradient(transparent, var(--sf));
		pointer-events: none;
	}

	/* Expand on focus */
	.code-blocks-collapsed :global(.tiptap pre:focus-within) {
		max-height: none;
	}

	.code-blocks-collapsed :global(.tiptap pre:focus-within)::after {
		display: none;
	}

	/* Drop cursor */
	:global(.block-editor .ProseMirror-dropcursor) {
		background-color: var(--accent, #58a6ff) !important;
	}

	/* Editor container */
	.editor-container {
		position: relative;
	}

	/* Block move handle (horizontal) */
	.block-handle {
		position: absolute;
		left: 2px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0;
		z-index: 10;
		background: var(--surface, #161b22);
		border: 1px solid var(--border, #30363d);
		border-radius: 4px;
		padding: 1px;
		opacity: 0.7;
		transition: opacity 0.15s ease;
	}

	.block-handle:hover {
		opacity: 1;
	}

	.handle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		color: var(--muted, #8b949e);
		cursor: pointer;
		border-radius: 2px;
		transition: all 0.1s ease;
	}

	.handle-btn:hover {
		color: var(--foreground, #e6edf3);
		background: var(--accent, #58a6ff);
	}

	/* Keyboard shortcut hint */
	.keyboard-hint {
		font-size: 0.625rem;
		color: var(--muted, #8b949e);
		text-align: right;
		padding-top: 0.25rem;
		opacity: 0.6;
	}

	.keyboard-hint kbd {
		padding: 0.125rem 0.25rem;
		background: var(--surface, #161b22);
		border: 1px solid var(--border, #30363d);
		border-radius: 0.25rem;
		font-family: ui-monospace, monospace;
		font-size: 0.5625rem;
	}

	/* Task list styles */
	:global(.block-editor .editor-task-list) {
		list-style: none;
		padding-left: 0;
		margin: 0.5rem 0;
	}

	:global(.block-editor .editor-task-item) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin: 0.25rem 0;
	}

	:global(.block-editor .editor-task-item > label) {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	:global(.block-editor .editor-task-item > label > input[type="checkbox"]) {
		appearance: none;
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--border, #30363d);
		border-radius: 0.25rem;
		background: var(--background, #0d1117);
		cursor: pointer;
		position: relative;
		transition: all 0.15s ease;
	}

	:global(.block-editor .editor-task-item > label > input[type="checkbox"]:checked) {
		background: var(--accent, #58a6ff);
		border-color: var(--accent, #58a6ff);
	}

	:global(.block-editor .editor-task-item > label > input[type="checkbox"]:checked::after) {
		content: '';
		position: absolute;
		left: 0.25rem;
		top: 0.0625rem;
		width: 0.25rem;
		height: 0.5rem;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	:global(.block-editor .editor-task-item > label > input[type="checkbox"]:hover) {
		border-color: var(--accent, #58a6ff);
	}

	:global(.block-editor .editor-task-item > div) {
		flex: 1;
		min-width: 0;
	}

	:global(.block-editor .editor-task-item[data-checked="true"] > div) {
		text-decoration: line-through;
		color: var(--muted, #8b949e);
	}

	/* Horizontal rule / divider styles */
	:global(.block-editor .tiptap hr) {
		border: none;
		border-top: 2px solid var(--border, #30363d);
		margin: 1.5rem 0;
	}

	:global(.block-editor .tiptap hr.ProseMirror-selectednode) {
		border-top-color: var(--accent, #58a6ff);
	}

	/* Link styles */
	:global(.block-editor .editor-link),
	:global(.block-editor .tiptap a) {
		color: var(--accent, #58a6ff);
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	:global(.block-editor .editor-link:hover),
	:global(.block-editor .tiptap a:hover) {
		opacity: 0.8;
	}

	/* Callout / alert styles */
	:global(.block-editor .tiptap blockquote) {
		border-left: 4px solid var(--accent, #58a6ff);
		padding: 0.75rem 1rem;
		margin: 1rem 0;
		background: var(--surface, #161b22);
		border-radius: 0 0.375rem 0.375rem 0;
	}

	:global(.block-editor .tiptap blockquote p) {
		margin: 0;
	}

	/* Callout type styling via data attribute (set by JS) */
	:global(.block-editor .tiptap blockquote[data-callout="info"]) {
		border-left-color: #3b82f6;
		background: rgba(59, 130, 246, 0.1);
	}

	:global(.block-editor .tiptap blockquote[data-callout="warning"]) {
		border-left-color: #f59e0b;
		background: rgba(245, 158, 11, 0.1);
	}

	:global(.block-editor .tiptap blockquote[data-callout="success"]) {
		border-left-color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
	}

	:global(.block-editor .tiptap blockquote[data-callout="error"]) {
		border-left-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}
</style>
