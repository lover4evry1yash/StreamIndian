content = """import { Logger } from '../Logger';
import { ResolverManager } from './ResolverManager';
import { TorrentMetadata, StreamResolution } from './types';
import { StreamSource } from '../../types/tizen';
import { CacheManager } from '../storage/CacheManager';
import { CachePolicyType } from '../storage/types';

export class StreamManager {
  private resolverManager: ResolverManager;
  private logger: Logger;
  private cacheManager: CacheManager;

  constructor(resolverManager: ResolverManager, logger: Logger, cacheManager: CacheManager) {
    this.resolverManager = resolverManager;
    this.logger = logger;
    this.cacheManager = cacheManager;
  }

  public async getResolvedStreams(mediaId: string, torrents: TorrentMetadata[], directUrls: string[]): Promise<StreamSource[]> {
    const cacheKey = `streams_${mediaId}`;
    
    // 1. Check cache first
    const cached = await this.cacheManager.get<StreamSource[]>(
      'streams', 
      cacheKey, 
      CachePolicyType.STREAM_RESOLUTIONS
    );
    
    if (cached && cached.length > 0) {
      this.logger.debug(`[StreamManager] Cache hit for mediaId: ${mediaId}`);
      return cached;
    }

    let allResolutions: StreamResolution[] = [];

    // 2. Resolve torrents (Debrid services)
    for (const torrent of torrents) {
      let attempts = 0;
      let success = false;
      while (attempts < 3 && !success) {
        try {
          const resolutions = await this.resolverManager.resolveTorrent(torrent);
          if (resolutions.length > 0) {
            allResolutions = allResolutions.concat(resolutions);
            success = true;
          } else {
            attempts++;
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        } catch (e) {
          attempts++;
        }
      }
    }

    // 3. Resolve direct URLs (Hosters / Direct extractors)
    for (const url of directUrls) {
      try {
        const resolutions = await this.resolverManager.resolveUrl(url);
        allResolutions = allResolutions.concat(resolutions);
      } catch (e) {
        this.logger.error(`Error resolving URL: ${url}`, e);
      }
    }

    // 4. Remove duplicates
    const uniqueResolutions = this.removeDuplicates(allResolutions);

    // 5. Rank and normalize
    const rankedResolutions = this.rankResolutions(uniqueResolutions);
    const streamSources = rankedResolutions.map(this.mapToStreamSource);

    // 6. Cache the result
    if (streamSources.length > 0) {
      await this.cacheManager.set('streams', cacheKey, streamSources, CachePolicyType.STREAM_RESOLUTIONS);
    }

    return streamSources;
  }

  private removeDuplicates(resolutions: StreamResolution[]): StreamResolution[] {
    const seen = new Set<string>();
    return resolutions.filter(res => {
      // Create a unique key based on URL, or Title + Quality + Codec
      const key = res.url || `${res.title}_${res.quality}_${res.codec}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private rankResolutions(resolutions: StreamResolution[]): StreamResolution[] {
    return resolutions.sort((a, b) => {
      return this.calculateScore(b) - this.calculateScore(a);
    });
  }

  private calculateScore(res: StreamResolution): number {
    let score = 0;
    
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
    
    // 7. Seeders / Size (Small bonus)
    if (res.seeders && res.seeders > 100) score += 20;
    
    return score;
  }

  private mapToStreamSource(res: StreamResolution): StreamSource {
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
      providerName: res.resolver ? `${res.provider} (${res.resolver})` : res.provider,
      isLegalPublicStream: false,
      audioTrack: res.audioChannels
    };
  }
}
"""

open('src/core/streams/StreamManager.ts', 'w').write(content)
