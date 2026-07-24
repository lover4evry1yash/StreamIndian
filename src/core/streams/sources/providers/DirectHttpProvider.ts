import { ISourceProvider, MediaSearchQuery, CanonicalStreamSource, ProviderHealth } from '../../types';

export class DirectHttpProvider implements ISourceProvider {
  public readonly id = 'direct_http';
  public readonly name = 'Direct HTTP';
  public readonly priority: number;

  private isAvailable: boolean = true;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private averageSearchTimeMs: number = 0;

  constructor(priority: number = 70) {
    this.priority = priority;
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
    return true; 
  }

  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    // Return a dummy direct HTTP stream for playback testing
    return [
      {
        id: `direct_sintel_${query.mediaId}`,
        title: 'Sintel Trailer (Test)',
        type: 'movie',
        sourceType: 'http',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        quality: '1080p FHD',
        size: 15000000,
        provider: this.name
      }
    ];
  }
}
