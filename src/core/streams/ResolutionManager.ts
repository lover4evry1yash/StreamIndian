import { Logger } from '../Logger';
import { ResolverManager } from './ResolverManager';
import { StreamResolution, CanonicalStreamSource, StreamSortOptions } from './types';
import { StreamSource } from '../../types/tizen';
import { CacheManager } from '../storage/CacheManager';
import { CachePolicyType } from '../storage/types';

export class ResolutionManager {
  private resolverManager: ResolverManager;
  private logger: Logger;
  private cacheManager: CacheManager;

  constructor(resolverManager: ResolverManager, logger: Logger, cacheManager: CacheManager) {
    this.resolverManager = resolverManager;
    this.logger = logger;
    this.cacheManager = cacheManager;
  }
    
  public getDiagnostics() {
    return {
      registeredResolvers: this.resolverManager.getDiagnostics(),
      cacheHitRate: 0,
      failures: 0,
      averageResolveTimeMs: 0,
    };
  }

  public async resolve(sources: CanonicalStreamSource[]): Promise<StreamSource[]> {
    let allResolutions: StreamResolution[] = [];

    const promises = sources.map(async (source) => {
      // Direct resolver logic for HTTP/HLS/DASH
      if (['http', 'https', 'hls', 'dash'].includes(source.sourceType) && source.url) {
        const resolutions = await this.resolverManager.resolveUrl(source.url);
        if (resolutions.length > 0) return resolutions;

        // Fallback if no specific url resolver handles it, just pass it through
        return [{
          id: source.id,
          title: source.title,
          url: source.url,
          quality: source.quality,
          format: source.sourceType === 'hls' ? 'HLS' : source.sourceType === 'dash' ? 'DASH' : 'MP4',
          codec: source.codec,
          audioChannels: source.audio,
          subtitles: source.subtitles,
          provider: source.provider,
          resolver: 'direct',
          health: source.score || 100,
          hdr: source.hdr,
          dolbyVision: source.dolbyVision,
          atmos: source.atmos,
          size: source.size,
          seeders: source.seeders,
          bitrate: source.bitrate
        } as StreamResolution];
      }

      // Torrents / Magnets go to Resolvers
      if (['torrent', 'magnet'].includes(source.sourceType)) {
        if (source.infoHash || source.magnet || source.torrentFile) {
          const torrentMeta = {
            infoHash: source.infoHash || '',
            name: source.title,
            size: source.size || 0,
            seeders: source.seeders,
            sources: source.magnet ? [source.magnet] : []
          };
          return await this.resolverManager.resolveTorrent(torrentMeta);
        }
      }

      return [];
    });

    const results = await Promise.allSettled(promises);
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allResolutions = allResolutions.concat(r.value);
      }
    });

    // Remove duplicates
    const uniqueResolutions = this.removeDuplicates(allResolutions);

    return uniqueResolutions.map(r => this.mapToStreamSource(r, sources));
  }

  private removeDuplicates(resolutions: StreamResolution[]): StreamResolution[] {
    const seen = new Set<string>();
    return resolutions.filter(res => {
      const key = res.url || `${res.title}_${res.quality}_${res.codec}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private mapToStreamSource(res: StreamResolution, sources: CanonicalStreamSource[]): StreamSource {
    let tizenFormat: 'HLS' | 'DASH' | 'MP4' = 'MP4';
    if (res.format === 'HLS') tizenFormat = 'HLS';
    if (res.format === 'DASH') tizenFormat = 'DASH';
    
    let quality: StreamSource['quality'] = 'SD';
    if (res.quality === '4K HDR' || res.quality === '4K' as any) quality = '4K HDR';
    else if (res.quality === '1080p FHD') quality = '1080p FHD';
    else if (res.quality === '720p HD') quality = '720p HD';
    
    // Determine readiness
    let readiness: any = 'DIRECT';
    const isDirectPlayable = res.url && (res.url.startsWith('http://') || res.url.startsWith('https://') || res.url.startsWith('blob:'));
    
    if (res.resolver && res.resolver !== 'direct') {
        if (!isDirectPlayable) {
             readiness = 'DEBRID_REQUIRED';
        } else {
             readiness = 'DEBRID_CACHED';
        }
    } else if (!isDirectPlayable) {
        readiness = 'DEBRID_REQUIRED';
    }

    return {
      id: res.id || `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      quality,
      format: tizenFormat,
      url: res.url,
      providerName: res.resolver && res.resolver !== 'direct' ? `${res.provider} (${res.resolver})` : res.provider,
      isLegalPublicStream: false,
      audioTrack: res.audioChannels,
      readiness,
      size: res.size,
      seeders: res.seeders,
      codec: res.codec,
      hdr: res.hdr,
      dolbyVision: res.dolbyVision,
      atmos: res.atmos,
      cacheStatus: res.resolver && res.resolver !== 'direct' ? { [res.resolver]: true } : undefined
    };
  }
}
