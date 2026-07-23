import { StreamPresentationModel } from '../../../types/tizen';
import { StreamSortOptions } from '../types';

export class RankingEngine {
    public rank(streams: StreamPresentationModel[], options: StreamSortOptions): StreamPresentationModel[] {
        return streams.sort((a, b) => {
            const scoreA = this.calculateScore(a, options);
            const scoreB = this.calculateScore(b, options);
            return scoreB - scoreA;
        });
    }
    
    private calculateScore(stream: StreamPresentationModel, options: StreamSortOptions): number {
        let score = stream.score || 0; // Baseline score from providers
        
        // 1. Resolution
        if (stream.quality === '4K HDR' || stream.quality === '4K') score += 1000;
        else if (stream.quality === '1080p FHD') score += 500;
        else if (stream.quality === '720p HD') score += 250;
        
        // 2. High dynamic range
        if (stream.dolbyVision) score += 200;
        else if (stream.hdr) score += 100;
        
        // 3. Audio
        if (stream.atmos) score += 150;
        if (stream.audio?.includes('7.1')) score += 100;
        else if (stream.audio?.includes('5.1')) score += 50;
        
        // 4. Codec
        if (stream.codec === 'HEVC' || stream.codec === 'H265') score += 100;
        else if (stream.codec === 'H264') score += 50;
        
        // 5. Readiness (Crucial for Tizen)
        if (stream.readiness === 'DIRECT') score += 2000;
        else if (stream.readiness === 'MULTI_PROVIDER_CACHED' || stream.readiness === 'DEBRID_CACHED') score += 1500;
        else if (stream.readiness === 'DEBRID_REQUIRED') score -= 500; // Uncached gets penalized heavily
        
        // 6. Configurable sorting overrides
        if (options.mode === 'size_desc') score += ((stream.size || 0) / 1000000000); // 1 point per GB
        if (options.mode === 'size_asc') score -= ((stream.size || 0) / 1000000000);
        if (options.mode === 'seeders') score += (stream.seeders || 0) * 10;
        
        // 7. Preferred Provider Boost
        if (stream.preferredDebrid && stream.cacheMatrix[stream.preferredDebrid]) {
             score += 500;
        }
        
        return score;
    }
}
