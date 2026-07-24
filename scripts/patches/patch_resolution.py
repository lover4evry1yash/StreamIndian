content = """import { Logger } from '../Logger';
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

  public async resolve(sources: CanonicalStreamSource[], options: StreamSortOptions = { mode: 'best' }): Promise<StreamSource[]> {
    let allResolutions: StreamResolution[] = [];

    const promises = sources.map(async (source) => {
      // Direct resolver logic for HTTP/HLS/DASH
      if (['http', 'https', 'hls', 'dash'].includes(source.sourceType) && source.url) {
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

    // Rank and normalize
    const rankedResolutions = this.rankResolutions(uniqueResolutions, options);
    
    return rankedResolutions.map(r => this.mapToStreamSource(r, sources));
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

  private rankResolutions(resolutions: StreamResolution[], options: StreamSortOptions): StreamResolution[] {
    return resolutions.sort((a, b) => {
      const scoreA = this.calculateScore(a, options);
      const scoreB = this.calculateScore(b, options);
      return scoreB - scoreA;
    });
  }

  private calculateScore(res: StreamResolution, options: StreamSortOptions): number {
    let score = 0;
    
    // Configurable sorting logic based on options
    if (options.mode === 'size_desc') {
       return res.size || 0;
    }
    if (options.mode === 'size_asc') {
       return -(res.size || 0);
    }
    if (options.mode === 'seeders') {
       return res.seeders || 0;
    }
    if (options.mode === 'quality') {
       if (res.quality === '4K HDR' || res.quality === '4K') return 1000;
       if (res.quality === '1080p FHD') return 500;
       if (res.quality === '720p HD') return 250;
       return 0;
    }

    // Default 'best' scoring
    // 1. Resolution
    if (res.quality === '4K HDR' || res.quality === '4K') score += 1000;
    else if (res.quality === '1080p FHD') score += 500;
    else if (res.quality === '720p HD') score += 250;
    
    // 2. High dynamic range
    if (res.dolbyVision) score += 200;
    else if (res.hdr) score += 100;
    
    // 3. Audio
    if (res.atmos) score += 150;
    if (res.audioChannels === '7.1') score += 100;
    else if (res.audioChannels === '5.1') score += 50;
    
    // 4. Codec
    if (res.codec === 'HEVC' || res.codec === 'H265') score += 100;
    else if (res.codec === 'H264') score += 50;

    // 5. Format preference for Tizen AVPlay
    if (res.format === 'HLS') score += 80;
    else if (res.format === 'DASH') score += 70;
    
    // 6. Health & Network
    score += (res.health || 0);
    
    // 7. Seeders / Size
    if (res.seeders && res.seeders > 100) score += 20;

    // Language Match
    if (options.preferredLanguage && res.audioChannels?.includes(options.preferredLanguage)) {
        score += 300;
    }
    
    return score;
  }

  private mapToStreamSource(res: StreamResolution, sources: CanonicalStreamSource[]): StreamSource {
    let tizenFormat: 'HLS' | 'DASH' | 'MP4' = 'MP4';
    if (res.format === 'HLS') tizenFormat = 'HLS';
    if (res.format === 'DASH') tizenFormat = 'DASH';
    
    let quality: StreamSource['quality'] = 'SD';
    if (res.quality === '4K HDR' || res.quality === '4K') quality = '4K HDR';
    else if (res.quality === '1080p FHD') quality = '1080p FHD';
    else if (res.quality === '720p HD') quality = '720p HD';

    return {
      id: res.id || `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      quality,
      format: tizenFormat,
      url: res.url,
      providerName: res.resolver && res.resolver !== 'direct' ? `${res.provider} (${res.resolver})` : res.provider,
      isLegalPublicStream: false, // We'd need a field for this in discovery
      audioTrack: res.audioChannels
    };
  }
}
"""

open('src/core/streams/ResolutionManager.ts', 'w').write(content)
