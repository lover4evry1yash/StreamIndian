import { StreamSource, PlaybackReadiness } from '../../../types/tizen';
import { StreamSortOptions } from '../types';

export class StreamSortingService {
  public sort(streams: StreamSource[], options: StreamSortOptions): StreamSource[] {
    return [...streams].sort((a, b) => {
      const scoreA = this.calculateScore(a, options);
      const scoreB = this.calculateScore(b, options);
      return scoreB - scoreA;
    });
  }

  private calculateScore(res: StreamSource, options: StreamSortOptions): number {
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
       if (res.quality === '4K HDR' || res.quality === '4K' as any) return 1000;
       if (res.quality === '1080p FHD') return 500;
       if (res.quality === '720p HD') return 250;
       return 0;
    }

    // Default 'best' scoring
    
    // 1. Resolution
    if (res.quality === '4K HDR' || res.quality === '4K' as any) score += 1000;
    else if (res.quality === '1080p FHD') score += 500;
    else if (res.quality === '720p HD') score += 250;
    
    // 2. High dynamic range
    if (res.dolbyVision) score += 200;
    else if (res.hdr) score += 100;
    
    // 3. Audio
    if (res.atmos) score += 150;
    if (res.audioTrack === '7.1') score += 100;
    else if (res.audioTrack === '5.1') score += 50;
    
    // 4. Codec
    if (res.codec === 'HEVC' || res.codec === 'H265') score += 100;
    else if (res.codec === 'H264') score += 50;

    // 5. Readiness (Cached > Direct > Debrid Required)
    if (res.readiness === PlaybackReadiness.DEBRID_CACHED) score += 300;
    else if (res.readiness === PlaybackReadiness.DIRECT) score += 200;

    // 6. Format preference for Tizen AVPlay
    if (res.format === 'HLS') score += 80;
    else if (res.format === 'DASH') score += 70;
    
    // 7. Seeders / Size
    if (res.seeders && res.seeders > 100) score += 20;

    // Language Match
    if (options.preferredLanguage && res.audioTrack?.includes(options.preferredLanguage)) {
        score += 300;
    }
    
    return score;
  }
}
