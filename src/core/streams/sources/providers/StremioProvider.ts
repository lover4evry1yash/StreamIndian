import { ISourceProvider, MediaSearchQuery, CanonicalStreamSource, ProviderHealth } from '../../types';

export class StremioProvider implements ISourceProvider {
  public readonly id = 'stremio';
  public readonly name = 'Stremio Compatible';
  public readonly priority: number;

  private isAvailable: boolean = true;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private averageSearchTimeMs: number = 0;
  private addonUrls: string[] = [];

  constructor(priority: number = 50) {
    this.priority = priority;
  }

  public addAddonUrl(url: string) {
    this.addonUrls.push(url);
  }

  public async initialize(): Promise<void> {}

  public async healthCheck(): Promise<boolean> {
    return this.isAvailable;
  }

  public getHealth(): ProviderHealth {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      reliability: this.reliability,
      failureCount: this.failureCount,
      averageSearchTimeMs: this.averageSearchTimeMs
    };
  }

  public supports(query: MediaSearchQuery): boolean {
    return !!query.imdbId || !!query.tmdbId; 
  }

  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    if (this.addonUrls.length === 0) return [];
    
    // Abstracting out the fetch
    const sources: CanonicalStreamSource[] = [];
    
    return sources;
  }
}
