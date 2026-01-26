export interface Config {
  baseUrl: string;
  apiKey: string;
}

export function loadConfig(apiKey: string): Config {
  const baseUrl = process.env.SNIPPETVAULT_URL || 'http://localhost:3000';

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey
  };
}
