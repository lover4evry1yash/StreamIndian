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
    return [{
      id: `http_mock_${query.mediaId}`,
      title: 'Direct MP4 Stream',
      type: query.type,
      sourceType: 'https',
      url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      quality: '720p HD',
      codec: 'H264',
      provider: this.name,
      score: 70
    }];
  }
}
