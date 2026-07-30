import { ISourceProvider, MediaSearchQuery, CanonicalStreamSource, ProviderHealth } from '../../types';

export class StremioProvider implements ISourceProvider {
  public readonly id = 'stremio';
  public readonly name = 'Stremio Compatible';
  public readonly priority: number;

  private isAvailable: boolean = true;
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private averageSearchTimeMs: number = 0;
  private addonUrls: string[] = [];

  constructor(priority: number = 50) {
    this.priority = priority;
  }

  public addAddonUrl(url: string) {
    this.addonUrls.push(url);
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
    return !!query.imdbId || !!query.tmdbId; 
  }

  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    if (this.addonUrls.length === 0) return [];
    
    const type = query.type === 'episode' ? 'series' : 'movie';
    let idStr = query.imdbId ? query.imdbId : `tmdb:${query.tmdbId}`;
    if (query.type === 'episode') {
        idStr = `${idStr}:${query.season || 1}:${query.episode || 1}`;
    }

    const sources: CanonicalStreamSource[] = [];

    for (const addonUrl of this.addonUrls) {
        try {
            const baseUrl = addonUrl.replace(/\/manifest\.json$/, '');
            const endpoint = `${baseUrl}/stream/${type}/${encodeURIComponent(idStr)}.json`;
            
            const response = await fetch(endpoint);
            if (!response.ok) continue;
            
            const data = await response.json();
            if (data && Array.isArray(data.streams)) {
                for (const stream of data.streams) {
                    const parsed = this.parseStremioStream(stream, query);
                    if (parsed) {
                        sources.push(parsed);
                    }
                }
            }
        } catch (e) {
            console.error('[StremioProvider] Error fetching from addon:', addonUrl, e);
        }
    }
    
    return sources;
  }

  private parseStremioStream(stream: any, query: MediaSearchQuery): CanonicalStreamSource | null {
    const isTorrent = !!stream.infoHash;
    const isUrl = !!stream.url;
    
    if (!isTorrent && !isUrl) return null;

    const title = stream.title || stream.name || query.title;
    const fullText = `${title} ${stream.name || ''} ${stream.description || ''}`.toLowerCase();
    
    let quality: CanonicalStreamSource['quality'] = 'SD';
    if (fullText.includes('4k') || fullText.includes('2160p') || fullText.includes('uhd')) {
        quality = fullText.includes('hdr') || fullText.includes('dv') || fullText.includes('vision') ? '4K HDR' : '4K';
    } else if (fullText.includes('1080p') || fullText.includes('fhd')) {
        quality = '1080p FHD';
    } else if (fullText.includes('720p') || fullText.includes('hd')) {
        quality = '720p HD';
    }
    
    let codec = undefined;
    if (fullText.includes('hevc') || fullText.includes('x265') || fullText.includes('h265')) codec = 'HEVC';
    else if (fullText.includes('avc') || fullText.includes('x264') || fullText.includes('h264')) codec = 'AVC';
    else if (fullText.includes('av1')) codec = 'AV1';
    
    let size = undefined;
    const sizeMatch = fullText.match(/([0-9.]+)\s*(gb|mb)/i);
    if (sizeMatch) {
        const val = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toLowerCase();
        if (unit === 'gb') size = val * 1024 * 1024 * 1024;
        else if (unit === 'mb') size = val * 1024 * 1024;
    }
    
    let seeders = undefined;
    const seederMatch = fullText.match(/👤\s*(\d+)/) || fullText.match(/seeders?\s*:\s*(\d+)/i);
    if (seederMatch) {
        seeders = parseInt(seederMatch[1], 10);
    }
    
    const sourceType = isTorrent ? 'torrent' : 'url';
    const format = stream.url?.includes('.m3u8') ? 'hls' : stream.url?.includes('.mpd') ? 'dash' : 'http';
    const finalSourceType = isTorrent ? 'torrent' : format;

    let audio = undefined;
    if (fullText.includes('atmos')) audio = 'Atmos';
    else if (fullText.includes('5.1')) audio = '5.1';
    else if (fullText.includes('7.1')) audio = '7.1';
    else if (fullText.includes('aac')) audio = 'AAC';

    return {
        id: `stremio_${stream.infoHash || stream.url || Math.random().toString(36).substring(7)}`,
        title: title,
        type: query.type,
        sourceType: finalSourceType as any,
        url: stream.url,
        infoHash: stream.infoHash,
        magnet: stream.infoHash ? `magnet:?xt=urn:btih:${stream.infoHash}` : undefined,
        quality: quality,
        codec: codec,
        hdr: fullText.includes('hdr'),
        dolbyVision: fullText.includes('dolby vision') || fullText.includes('dv'),
        atmos: fullText.includes('atmos'),
        size: size,
        seeders: seeders,
        provider: stream.name || this.name,
        audio: audio,
        subtitles: stream.subtitles,
    };
  }
}
