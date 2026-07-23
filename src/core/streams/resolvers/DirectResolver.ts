import { IStreamResolver, TorrentMetadata, StreamResolution, ResolverHealth } from '../types';

export class DirectResolver implements IStreamResolver {
  public readonly id = 'direct';
  public readonly name = 'Direct Stream';
  public readonly priority: number = 100; // High priority, no debrid needed

  private isAvailable: boolean = true;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private averageResolveTimeMs: number = 0;

  public async initialize(): Promise<void> {}

  public async healthCheck(): Promise<boolean> {
    return this.isAvailable;
  }

  public getHealth(): ResolverHealth {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      reliability: this.reliability,
      failureCount: this.failureCount,
      averageResolveTimeMs: this.averageResolveTimeMs
    };
  }

  public supports(type: 'torrent' | 'url', payload: any): boolean {
    return type === 'url';
  }

  public async resolveUrl(url: string): Promise<StreamResolution[]> {
    // For direct URLs, the URL is the stream
    return []; // Handled inside ResolutionManager mapping, or we could pass the CanonicalStreamSource here
  }
}
