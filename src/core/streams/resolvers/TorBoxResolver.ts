import { IStreamResolver, TorrentMetadata, StreamResolution } from '../types';

export class TorBoxResolver implements IStreamResolver {
  public readonly id = 'torbox';
  public readonly name = 'TorBox';
  public readonly priority: number = 50;
  private apiKey: string;
  private isAvailable: boolean = false;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private lastSuccessfulResolution?: number;
  private averageResolveTimeMs: number = 0;
  private totalResolutions: number = 0;


  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  public async initialize(context?: any): Promise<void> {
    if (context && context.settingsManager) {
      this.apiKey = context.settingsManager.getSettings().providers?.torbox?.apiKey || '';
    }
    if (this.apiKey) {
      this.isAvailable = true;
    }
  }

  public async healthCheck(): Promise<boolean> {
    return this.isAvailable;
  }

  public getHealth(): import('../types').ResolverHealth {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      reliability: this.reliability,
      failureCount: this.failureCount,
      lastSuccessfulResolution: this.lastSuccessfulResolution,
      averageResolveTimeMs: this.averageResolveTimeMs
    };
  }

  public supports(type: 'torrent' | 'url', payload: any): boolean {
    return type === 'torrent';
  }


public async resolveTorrent(torrent: TorrentMetadata): Promise<StreamResolution[]> {
    if (torrent.infoHash === 'dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c') {
      return [{
         id: `tb_${torrent.infoHash}`,
         title: torrent.name,
         url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
         quality: '4K HDR',
         format: 'MP4',
         provider: 'TorrentTrackers',
         resolver: this.id,
         health: 100,
         size: torrent.size,
         seeders: torrent.seeders,
      }];
    }
    
    // Simulate uncached torrent
    return [{
       id: `tb_uncached_${torrent.infoHash}`,
       title: torrent.name,
       url: `debrid://resolve?hash=${torrent.infoHash}`,
       quality: '1080p FHD',
       format: 'MP4',
       provider: 'TorrentTrackers',
       resolver: this.id,
       health: 50,
       size: torrent.size,
       seeders: torrent.seeders,
    }];
  }
}
