import { Node, mergeAttributes } from '@tiptap/core';

export interface FileBlockOptions {
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		fileBlock: {
			setFileBlock: (options: { src: string; name: string; size: number }) => ReturnType;
		};
	}
}

const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (name: string): string => {
	const ext = name.split('.').pop()?.toLowerCase() || '';
	const icons: Record<string, string> = {
		pdf: '📄',
		doc: '📝',
		docx: '📝',
		xls: '📊',
		xlsx: '📊',
		ppt: '📽️',
		pptx: '📽️',
		zip: '📦',
		rar: '📦',
		'7z': '📦',
		txt: '📃',
		csv: '📊',
		json: '📋',
		xml: '📋',
		html: '🌐',
		css: '🎨',
		js: '⚙️',
		ts: '⚙️',
		py: '🐍',
		md: '📝'
	};
	return icons[ext] || '📎';
};

export const FileBlock = Node.create<FileBlockOptions>({
	name: 'fileBlock',

	group: 'block',

	atom: true,

	draggable: true,

	addOptions() {
		return {
			HTMLAttributes: {}
		};
	},

	addAttributes() {
		return {
			src: {
				default: null
			},
			name: {
				default: 'file'
			},
			size: {
				default: 0
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-file-block]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		const { src, name, size } = HTMLAttributes;
		const icon = getFileIcon(name);
		const sizeText = formatFileSize(size || 0);

		return [
			'div',
			mergeAttributes(this.options.HTMLAttributes, {
				'data-file-block': '',
				class: 'file-block',
				contenteditable: 'false'
			}),
			[
				'a',
				{
					href: src,
					download: name,
					class: 'file-block-link'
				},
				[
					'span',
					{ class: 'file-block-icon' },
					icon
				],
				[
					'span',
					{ class: 'file-block-info' },
					[
						'span',
						{ class: 'file-block-name' },
						name
					],
					[
						'span',
						{ class: 'file-block-size' },
						sizeText
					]
				],
				[
					'span',
					{ class: 'file-block-download' },
					'Telecharger'
				]
			]
		];
	},

	addCommands() {
		return {
			setFileBlock:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options
					});
				}
		};
	}
});
