import type { JsonNodeData, JsonProperty, JsonValueType, JsonNode, JsonEdge } from './types';

// Colors for different JSON value types
export const valueColors: Record<JsonValueType, string> = {
	string: '#a5d6ff',
	number: '#79c0ff',
	boolean: '#ff7b72',
	null: '#8b949e',
	object: '#d2a8ff',
	array: '#7ee787'
};

// Check if a string is valid JSON
export function isValidJson(str: string): boolean {
	if (!str || !str.trim()) return false;
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}

// Get the type of a JSON value
export function getValueType(value: any): JsonValueType {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	const type = typeof value;
	if (type === 'object') return 'object';
	if (type === 'string') return 'string';
	if (type === 'number') return 'number';
	if (type === 'boolean') return 'boolean';
	return 'string';
}

// Format a value for display
export function formatDisplayValue(value: any, type: JsonValueType): string {
	if (type === 'null') return 'null';
	if (type === 'string') {
		const str = String(value);
		if (str.length > 50) return `"${str.slice(0, 47)}..."`;
		return `"${str}"`;
	}
	if (type === 'boolean') return value ? 'true' : 'false';
	if (type === 'number') return String(value);
	if (type === 'object') return `{${Object.keys(value).length}}`;
	if (type === 'array') return `[${value.length}]`;
	return String(value);
}

// Check if a value should be rendered as a child node
export function isComplexValue(value: any): boolean {
	if (value === null) return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === 'object') return Object.keys(value).length > 0;
	return false;
}

interface ParseResult {
	nodes: JsonNode[];
	edges: JsonEdge[];
}

// Parse JSON into nodes and edges for visualization
export function parseJsonToGraph(
	json: any,
	options: { maxDepth?: number; maxProperties?: number } = {}
): ParseResult {
	const { maxDepth = 10, maxProperties = 20 } = options;
	const nodes: JsonNode[] = [];
	const edges: JsonEdge[] = [];

	let nodeIdCounter = 0;

	function createNode(
		key: string,
		value: any,
		depth: number,
		path: string,
		parentId?: string
	): string | null {
		if (depth > maxDepth) return null;

		const nodeId = `node-${nodeIdCounter++}`;
		const type = getValueType(value);

		// Only create nodes for objects and arrays
		if (type !== 'object' && type !== 'array') {
			return null;
		}

		const entries = type === 'array'
			? value.map((v: any, i: number) => [String(i), v])
			: Object.entries(value);

		const properties: JsonProperty[] = [];
		const childNodeIds: string[] = [];

		for (let i = 0; i < entries.length; i++) {
			const [k, v] = entries[i];
			const propType = getValueType(v);
			const propPath = type === 'array' ? `${path}[${k}]` : `${path}.${k}`;

			if (isComplexValue(v) && i < maxProperties) {
				// Create child node for complex values
				const childId = createNode(k, v, depth + 1, propPath, nodeId);
				if (childId) {
					childNodeIds.push(childId);
					properties.push({
						key: type === 'array' ? `[${k}]` : k,
						value: v,
						type: propType,
						displayValue: propType === 'array' ? `[${v.length}]` : `{${Object.keys(v).length}}`
					});
				}
			} else if (i < maxProperties) {
				// Add as property
				properties.push({
					key: type === 'array' ? `[${k}]` : k,
					value: v,
					type: propType,
					displayValue: formatDisplayValue(v, propType)
				});
			}
		}

		// Add "more" indicator if truncated
		if (entries.length > maxProperties) {
			properties.push({
				key: '...',
				value: null,
				type: 'null',
				displayValue: `+${entries.length - maxProperties} more`
			});
		}

		const nodeData: JsonNodeData = {
			label: key,
			type,
			properties,
			isExpanded: true,
			childCount: entries.length,
			path
		};

		// Calculate position (will be refined by layout)
		const node: JsonNode = {
			id: nodeId,
			type: 'jsonNode',
			position: { x: 0, y: 0 },
			data: nodeData
		};

		nodes.push(node);

		// Create edge from parent
		if (parentId) {
			edges.push({
				id: `edge-${parentId}-${nodeId}`,
				source: parentId,
				target: nodeId,
				type: 'smoothstep',
				animated: false
			});
		}

		return nodeId;
	}

	// Start parsing from root
	const rootType = getValueType(json);
	if (rootType === 'object' || rootType === 'array') {
		createNode('root', json, 0, '$');
	}

	// Apply simple horizontal layout
	applySimpleLayout(nodes, edges);

	return { nodes, edges };
}

// Simple layout algorithm (left to right, tree structure)
function applySimpleLayout(nodes: JsonNode[], edges: JsonEdge[]) {
	if (nodes.length === 0) return;

	const nodeWidth = 250;
	const nodeHeight = 150;
	const horizontalGap = 100;
	const verticalGap = 50;

	// Build adjacency list
	const children: Map<string, string[]> = new Map();
	const parents: Map<string, string> = new Map();

	for (const edge of edges) {
		if (!children.has(edge.source)) {
			children.set(edge.source, []);
		}
		children.get(edge.source)!.push(edge.target);
		parents.set(edge.target, edge.source);
	}

	// Find root nodes (nodes without parents)
	const roots = nodes.filter(n => !parents.has(n.id));

	// Position nodes level by level
	function positionNode(nodeId: string, x: number, y: number): number {
		const node = nodes.find(n => n.id === nodeId);
		if (!node) return y;

		node.position = { x, y };

		const nodeChildren = children.get(nodeId) || [];
		let currentY = y;

		for (const childId of nodeChildren) {
			currentY = positionNode(childId, x + nodeWidth + horizontalGap, currentY);
			currentY += verticalGap;
		}

		// Center parent vertically among children
		if (nodeChildren.length > 0) {
			const firstChild = nodes.find(n => n.id === nodeChildren[0]);
			const lastChild = nodes.find(n => n.id === nodeChildren[nodeChildren.length - 1]);
			if (firstChild && lastChild) {
				node.position.y = (firstChild.position.y + lastChild.position.y) / 2;
			}
		}

		return Math.max(currentY, y + nodeHeight);
	}

	let currentY = 0;
	for (const root of roots) {
		currentY = positionNode(root.id, 0, currentY);
		currentY += verticalGap;
	}
}
