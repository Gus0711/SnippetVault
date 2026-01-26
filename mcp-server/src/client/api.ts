import type { Config } from '../config.js';
import type {
  Snippet,
  SnippetDetail,
  Collection,
  Tag,
  PaginatedResponse,
  SearchResponse,
  CreateSnippetInput,
  UpdateSnippetInput
} from '../types.js';

export class SnippetVaultClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: Config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.data;
  }

  // Snippets
  async listSnippets(params?: {
    collection?: string;
    status?: 'draft' | 'published';
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Snippet>> {
    const searchParams = new URLSearchParams();
    if (params?.collection) searchParams.set('collection', params.collection);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Snippet>>(
      `/snippets${query ? `?${query}` : ''}`
    );
  }

  async getSnippet(id: string): Promise<SnippetDetail> {
    return this.request<SnippetDetail>(`/snippets/${id}`);
  }

  async createSnippet(input: CreateSnippetInput): Promise<SnippetDetail> {
    return this.request<SnippetDetail>('/snippets', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async updateSnippet(id: string, input: UpdateSnippetInput): Promise<SnippetDetail> {
    return this.request<SnippetDetail>(`/snippets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  }

  async deleteSnippet(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/snippets/${id}`, {
      method: 'DELETE'
    });
  }

  // Search
  async search(params: {
    query: string;
    collection?: string;
    tag?: string;
    status?: 'draft' | 'published';
    limit?: number;
  }): Promise<SearchResponse> {
    const searchParams = new URLSearchParams({ q: params.query });
    if (params.collection) searchParams.set('collection', params.collection);
    if (params.tag) searchParams.set('tag', params.tag);
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));

    return this.request<SearchResponse>(`/search?${searchParams.toString()}`);
  }

  // Collections
  async listCollections(): Promise<{ collections: Collection[] }> {
    return this.request<{ collections: Collection[] }>('/collections');
  }

  // Tags
  async listTags(): Promise<{ tags: Tag[] }> {
    return this.request<{ tags: Tag[] }>('/tags');
  }
}
