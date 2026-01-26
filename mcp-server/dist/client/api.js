export class SnippetVaultClient {
    baseUrl;
    apiKey;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
    }
    async request(endpoint, options = {}) {
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
            throw new Error(error.error || `API request failed: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result.data;
    }
    // Snippets
    async listSnippets(params) {
        const searchParams = new URLSearchParams();
        if (params?.collection)
            searchParams.set('collection', params.collection);
        if (params?.status)
            searchParams.set('status', params.status);
        if (params?.limit)
            searchParams.set('limit', String(params.limit));
        if (params?.offset)
            searchParams.set('offset', String(params.offset));
        const query = searchParams.toString();
        return this.request(`/snippets${query ? `?${query}` : ''}`);
    }
    async getSnippet(id) {
        return this.request(`/snippets/${id}`);
    }
    async createSnippet(input) {
        return this.request('/snippets', {
            method: 'POST',
            body: JSON.stringify(input)
        });
    }
    async updateSnippet(id, input) {
        return this.request(`/snippets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(input)
        });
    }
    async deleteSnippet(id) {
        return this.request(`/snippets/${id}`, {
            method: 'DELETE'
        });
    }
    // Search
    async search(params) {
        const searchParams = new URLSearchParams({ q: params.query });
        if (params.collection)
            searchParams.set('collection', params.collection);
        if (params.tag)
            searchParams.set('tag', params.tag);
        if (params.status)
            searchParams.set('status', params.status);
        if (params.limit)
            searchParams.set('limit', String(params.limit));
        return this.request(`/search?${searchParams.toString()}`);
    }
    // Collections
    async listCollections() {
        return this.request('/collections');
    }
    // Tags
    async listTags() {
        return this.request('/tags');
    }
}
//# sourceMappingURL=api.js.map