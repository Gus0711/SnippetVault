import type { Node, Edge } from '@xyflow/svelte';

export type JsonValueType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonProperty {
	key: string;
	value: any;
	type: JsonValueType;
	displayValue: string;
}

export interface JsonNodeData extends Record<string, unknown> {
	label: string;
	type: JsonValueType;
	properties: JsonProperty[];
	isExpanded: boolean;
	childCount: number;
	path: string;
}

export type JsonNode = Node<JsonNodeData, 'jsonNode'>;
export type JsonEdge = Edge;

export interface JsonViewerProps {
	content: string;
	renderedHtml?: string | null;
	blockId: string;
}
