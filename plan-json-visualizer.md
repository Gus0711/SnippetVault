# Plan : Visualiseur JSON Interactif

## Objectif
Ajouter un visualiseur JSON interactif pour les blocs code de type JSON, avec une vue graphique style massCode/JSON Crack permettant de visualiser la structure sous forme d'arbre de nodes connectés.

---

## Analyse technique

### Choix de librairie
Après analyse, je recommande **@xyflow/svelte** (anciennement Svelte Flow, fork de React Flow) :
- Natif Svelte 5 compatible
- Gestion intégrée du zoom/pan
- Nodes et edges personnalisables
- Layout automatique possible avec **elkjs** ou **dagre**
- Léger et performant

Alternative : **D3.js** (plus bas niveau, plus de travail)

### Architecture proposée
```
src/lib/components/json-viewer/
├── JsonViewer.svelte          # Composant principal avec toggle Code/Graph
├── JsonGraphView.svelte       # Vue graphique avec Svelte Flow
├── JsonNode.svelte            # Node personnalisé pour Svelte Flow
├── utils.ts                   # Parsing JSON -> nodes/edges
└── types.ts                   # Types TypeScript
```

---

## Fichiers à créer

### 1. Types (`src/lib/components/json-viewer/types.ts`)
```typescript
export interface JsonNodeData {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  depth: number;
  isExpanded: boolean;
  properties?: { key: string; value: any; type: string }[];
}

export interface JsonViewerProps {
  content: string;           // JSON string
  initialView?: 'code' | 'graph';
}
```

### 2. Utilitaires (`src/lib/components/json-viewer/utils.ts`)
```typescript
// Valider si une string est du JSON valide
export function isValidJson(str: string): boolean

// Parser JSON en structure de nodes/edges pour Svelte Flow
export function jsonToNodesAndEdges(json: any, options?: LayoutOptions): { nodes: Node[], edges: Edge[] }

// Calculer le layout avec elkjs/dagre
export function calculateLayout(nodes: Node[], edges: Edge[]): Promise<{ nodes: Node[], edges: Edge[] }>

// Obtenir la couleur selon le type de valeur
export function getValueColor(type: string): string
```

### 3. Node personnalisé (`src/lib/components/json-viewer/JsonNode.svelte`)
```svelte
<!-- Node représentant un objet/array JSON -->
<script lang="ts">
  interface Props {
    data: JsonNodeData;
    onToggle: (id: string) => void;
  }
</script>

<!-- Structure du node -->
<div class="json-node">
  <div class="node-header">
    <button class="toggle-btn">{data.isExpanded ? '−' : '+'}</button>
    <span class="node-key">{data.key}</span>
    <span class="node-type">{data.type === 'array' ? `[${count}]` : `{${count}}`}</span>
  </div>
  {#if data.isExpanded && data.properties}
    <div class="node-properties">
      {#each data.properties as prop}
        <div class="property">
          <span class="prop-key">{prop.key}:</span>
          <span class="prop-value" style="color: {getValueColor(prop.type)}">{formatValue(prop.value)}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

### 4. Vue graphique (`src/lib/components/json-viewer/JsonGraphView.svelte`)
```svelte
<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import JsonNode from './JsonNode.svelte';
  import { jsonToNodesAndEdges } from './utils';

  interface Props {
    json: any;
  }

  let { json }: Props = $props();

  const nodeTypes = { jsonNode: JsonNode };

  let { nodes, edges } = $derived(jsonToNodesAndEdges(json));

  // Gestion du toggle expand/collapse
  function toggleNode(nodeId: string) {
    // Mettre à jour l'état et recalculer le layout
  }
</script>

<div class="graph-container">
  <SvelteFlow {nodes} {edges} {nodeTypes} fitView>
    <Controls />
    <Background />
    <MiniMap />
  </SvelteFlow>
</div>
```

### 5. Composant principal (`src/lib/components/json-viewer/JsonViewer.svelte`)
```svelte
<script lang="ts">
  import { Code, GitBranch, ZoomIn, ZoomOut, Maximize } from 'lucide-svelte';
  import JsonGraphView from './JsonGraphView.svelte';
  import { isValidJson } from './utils';

  interface Props {
    content: string;
    renderedHtml?: string;
    blockId: string;
  }

  let { content, renderedHtml, blockId }: Props = $props();

  let view = $state<'code' | 'graph'>('code');
  let isValid = $derived(isValidJson(content));
  let parsedJson = $derived(isValid ? JSON.parse(content) : null);
</script>

{#if isValid}
  <div class="view-toggle">
    <button class:active={view === 'code'} onclick={() => view = 'code'}>
      <Code size={14} /> Code
    </button>
    <button class:active={view === 'graph'} onclick={() => view = 'graph'}>
      <GitBranch size={14} /> Graph
    </button>
  </div>
{/if}

{#if view === 'code'}
  <!-- Affichage code classique avec syntax highlighting -->
  <slot />
{:else}
  <JsonGraphView json={parsedJson} />
{/if}
```

---

## Fichiers à modifier

### 1. Vue lecture (`src/routes/(app)/snippets/[id]/+page.svelte`)
- Wrapper le bloc code JSON avec `JsonViewer`
- Détecter si `block.language === 'json'`

```svelte
{#if block.type === 'code'}
  {#if block.language === 'json'}
    <JsonViewer content={block.content} blockId={block.id}>
      <CodeBlockCollapsible ... />
    </JsonViewer>
  {:else}
    <CodeBlockCollapsible ... />
  {/if}
{/if}
```

### 2. Vue publique (`src/routes/(public)/s/[publicId]/+page.svelte`)
- Même modification que la vue lecture

### 3. Éditeur (`src/lib/components/editor/BlockEditor.svelte`)
- Plus complexe : TipTap gère le rendu
- Option A : Ajouter un bouton dans la toolbar quand dans un bloc JSON
- Option B : Créer une modal/panel séparé pour la visualisation

---

## Dépendances à installer

```bash
npm install @xyflow/svelte elkjs
```

- `@xyflow/svelte` : Librairie de graphes pour Svelte
- `elkjs` : Layout automatique des nodes (algorithme ELK)

---

## Couleurs par type de valeur

```typescript
const valueColors = {
  string: '#a5d6ff',   // Bleu clair
  number: '#79c0ff',   // Bleu
  boolean: '#ff7b72',  // Rouge/orange
  null: '#8b949e',     // Gris
  object: '#d2a8ff',   // Violet
  array: '#7ee787'     // Vert
};
```

---

## Styles des nodes

```css
.json-node {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  min-width: 180px;
  max-width: 300px;
  font-size: 12px;
  font-family: monospace;
}

.node-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-properties {
  padding: 8px 12px;
  max-height: 200px;
  overflow-y: auto;
}

.property {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}

.prop-key {
  color: var(--muted);
}
```

---

## Interactions détaillées

### Zoom/Pan
- Géré nativement par Svelte Flow
- Molette = zoom
- Drag sur le fond = pan
- Boutons +/- dans le composant Controls

### Expand/Collapse des nodes
- Clic sur le bouton +/- dans le header du node
- Collapse = cache les nodes enfants et les edges
- Recalcul du layout après toggle

### Fit to screen
- Bouton dans les Controls de Svelte Flow
- Recentre et ajuste le zoom pour voir tous les nodes

---

## Ordre d'implémentation

1. **Installer les dépendances** (`@xyflow/svelte`, `elkjs`)

2. **Créer les types et utilitaires**
   - `types.ts`
   - `utils.ts` avec validation JSON et conversion nodes/edges

3. **Créer le node personnalisé**
   - `JsonNode.svelte` avec styles

4. **Créer la vue graphique**
   - `JsonGraphView.svelte` avec Svelte Flow

5. **Créer le composant principal**
   - `JsonViewer.svelte` avec toggle Code/Graph

6. **Intégrer dans la vue lecture**
   - Modifier `snippets/[id]/+page.svelte`

7. **Intégrer dans la vue publique**
   - Modifier `s/[publicId]/+page.svelte`

8. **Intégrer dans l'éditeur** (optionnel, plus complexe)
   - Ajouter bouton "Visualiser" dans la toolbar code block

9. **Tests et polish**
   - Tester avec différentes structures JSON
   - Gérer les gros JSON (lazy loading des nodes)
   - Animations smooth

---

## Edge cases à gérer

- JSON invalide → afficher seulement la vue code
- JSON très profond (> 10 niveaux) → collapse par défaut
- JSON très large (> 100 propriétés) → pagination ou scroll
- Valeurs très longues (strings) → truncate avec tooltip
- Arrays très longs → afficher les premiers + "... +N more"

---

## Estimation

- Types + Utils : ~1h
- JsonNode : ~1h
- JsonGraphView : ~2h
- JsonViewer + intégration : ~1h
- Tests + polish : ~1h

**Total estimé : ~6h de développement**
