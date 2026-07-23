import { CanonicalStreamSource } from '../types';
import { PlaybackReadiness } from '../../../types/tizen';

export class ReadinessCalculator {
    public calculate(source: CanonicalStreamSource, cacheMatrix: Record<string, boolean>): PlaybackReadiness {
        if (['http', 'https', 'hls', 'dash'].includes(source.sourceType)) {
             return PlaybackReadiness.DIRECT;
        }
        
        if (['torrent', 'magnet'].includes(source.sourceType)) {
            const cachedProviders = Object.keys(cacheMatrix).filter(k => cacheMatrix[k]);
            
            if (cachedProviders.length > 1) {
                return PlaybackReadiness.MULTI_PROVIDER_CACHED;
            } else if (cachedProviders.length === 1) {
                return PlaybackReadiness.DEBRID_CACHED;
            } else {
                return PlaybackReadiness.DEBRID_REQUIRED;
            }
        }
        
        return PlaybackReadiness.UNAVAILABLE;
    }
}
