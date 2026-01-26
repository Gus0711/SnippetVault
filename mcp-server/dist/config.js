export function loadConfig(apiKey) {
    const baseUrl = process.env.SNIPPETVAULT_URL || 'http://localhost:3000';
    return {
        baseUrl: baseUrl.replace(/\/$/, ''),
        apiKey
    };
}
//# sourceMappingURL=config.js.map