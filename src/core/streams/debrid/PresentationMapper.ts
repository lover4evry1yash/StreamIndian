import { CanonicalStreamSource } from '../types';
import { StreamPresentationModel, PlaybackReadiness } from '../../../types/tizen';
import { ReadinessCalculator } from './ReadinessCalculator';

export class PresentationMapper {
    private readinessCalculator: ReadinessCalculator;
    
    constructor() {
        this.readinessCalculator = new ReadinessCalculator();
    }

    public map(source: CanonicalStreamSource, cacheMatrix: Record<string, boolean>, preferredDebrid?: string): StreamPresentationModel {
        const readiness = this.readinessCalculator.calculate(source, cacheMatrix);
        
        let format = 'MP4';
        if (source.sourceType === 'hls') format = 'HLS';
        if (source.sourceType === 'dash') format = 'DASH';
        if (source.format) format = source.format; // Fallback if available on type?
        
        return {
            id: source.id || `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: source.title,
            quality: source.quality || 'SD',
            format: format,
            codec: source.codec,
            audio: source.audio,
            hdr: source.hdr,
            dolbyVision: source.dolbyVision,
            atmos: source.atmos,
            bitrate: source.bitrate,
            size: source.size,
            seeders: source.seeders,
            readiness: readiness,
            score: source.score,
            providerName: source.provider,
            cacheMatrix: cacheMatrix,
            preferredDebrid: preferredDebrid,
            isLegalPublicStream: false,
            streamSource: source // Opaque reference for later resolution
        };
    }
}
