export interface SnippetBlock {
    id: string;
    snippetId: string;
    order: number;
    type: 'markdown' | 'code' | 'image' | 'file';
    content: string | null;
    language: string | null;
    filePath: string | null;
    fileName: string | null;
    fileSize: number | null;
}
export interface Tag {
    id: string;
    name: string;
    color: string | null;
    createdAt?: string;
}
export interface Snippet {
    id: string;
    title: string;
    collectionId: string | null;
    status: 'draft' | 'published';
    publicId: string | null;
    createdAt: string;
    updatedAt: string;
    tags: Tag[];
}
export interface SnippetDetail extends Snippet {
    collection: {
        id: string;
        name: string;
        icon: string | null;
    } | null;
    publicTheme: string;
    publicShowDescription: boolean;
    publicShowAttachments: boolean;
    blocks: SnippetBlock[];
}
export interface Collection {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    path: string;
    isShared: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface PaginatedResponse<T> {
    snippets: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
export interface SearchResponse {
    query: string;
    total: number;
    results: Snippet[];
}
export interface BlockInput {
    type: 'markdown' | 'code' | 'image' | 'file';
    content?: string;
    language?: string;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
}
export interface CreateSnippetInput {
    title: string;
    collectionId?: string;
    blocks?: BlockInput[];
    tagIds?: string[];
}
export interface UpdateSnippetInput {
    title?: string;
    collectionId?: string | null;
    blocks?: BlockInput[];
    tagIds?: string[];
    status?: 'draft' | 'published';
}
//# sourceMappingURL=types.d.ts.map