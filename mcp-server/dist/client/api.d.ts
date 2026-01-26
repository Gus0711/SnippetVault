import type { Config } from '../config.js';
import type { Snippet, SnippetDetail, Collection, Tag, PaginatedResponse, SearchResponse, CreateSnippetInput, UpdateSnippetInput } from '../types.js';
export declare class SnippetVaultClient {
    private baseUrl;
    private apiKey;
    constructor(config: Config);
    private request;
    listSnippets(params?: {
        collection?: string;
        status?: 'draft' | 'published';
        limit?: number;
        offset?: number;
    }): Promise<PaginatedResponse<Snippet>>;
    getSnippet(id: string): Promise<SnippetDetail>;
    createSnippet(input: CreateSnippetInput): Promise<SnippetDetail>;
    updateSnippet(id: string, input: UpdateSnippetInput): Promise<SnippetDetail>;
    deleteSnippet(id: string): Promise<{
        deleted: boolean;
    }>;
    search(params: {
        query: string;
        collection?: string;
        tag?: string;
        status?: 'draft' | 'published';
        limit?: number;
    }): Promise<SearchResponse>;
    listCollections(): Promise<{
        collections: Collection[];
    }>;
    listTags(): Promise<{
        tags: Tag[];
    }>;
}
//# sourceMappingURL=api.d.ts.map