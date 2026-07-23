export interface AppConfig {
  version: string;
  environment: 'development' | 'production';
  apiTimeoutMs: number;
  maxRetries: number;
  tmdb: {
    apiKey: string;
    language: string;
    region: string;
    imageBaseUrl: string;
    timeoutMs: number;
  };
}

export class Config {
  private config: AppConfig;

  constructor() {
    // Default configuration
    this.config = {
      version: '1.0.0',
      environment: (import.meta as any).env?.MODE === 'production' ? 'production' : 'development',
      apiTimeoutMs: 15000,
      maxRetries: 3,
      tmdb: {
        apiKey: (import.meta as any).env?.VITE_TMDB_API_KEY || 'your_default_api_key', // Ensure VITE_TMDB_API_KEY is in .env
        language: 'en-US',
        region: 'US',
        imageBaseUrl: 'https://image.tmdb.org/t/p/',
        timeoutMs: 10000,
      },
    };
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
  }

  public getAll(): AppConfig {
    return { ...this.config };
  }
}
