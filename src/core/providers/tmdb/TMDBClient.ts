import { NetworkClient } from '../../NetworkClient';
import { SettingsManager } from '../../storage/SettingsManager';
import { Config } from '../../Config';

export class TMDBClient {
  private network: NetworkClient;
  private settings: SettingsManager;
  private config: Config;
  private baseUrl: string = 'https://api.themoviedb.org/3';

  constructor(network: NetworkClient, settings: SettingsManager, config: Config) {
    this.network = network;
    this.settings = settings;
    this.config = config;
  }

  public async get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const tmdbConfigSettings = this.settings.getSettings().providers?.tmdb;
    const tmdbConfig = { 
        apiKey: tmdbConfigSettings?.apiKey || this.config.get('tmdb').apiKey, 
        language: 'en-US', 
        timeoutMs: 10000 
    };
    
    if (!tmdbConfig || !tmdbConfig.apiKey || tmdbConfig.apiKey === 'your_default_api_key') {
      throw new Error('TMDB API Key is not configured');
    }

    const queryParams = new URLSearchParams({
      api_key: tmdbConfig.apiKey,
      language: tmdbConfig.language,
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ),
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    
    try {
      return await this.network.getJson<T>(url, {
        timeoutMs: tmdbConfig.timeoutMs,
      });
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message.includes('abort')) {
        throw new Error('Timeout'); // Map to Timeout error eventually
      }
      if (err.message.includes('HTTP Error: 401') || err.message.includes('HTTP Error: 403')) {
        throw new Error('Authentication');
      }
      if (err.message.includes('HTTP Error: 429')) {
        throw new Error('RateLimit');
      }
      throw err;
    }
  }
}
