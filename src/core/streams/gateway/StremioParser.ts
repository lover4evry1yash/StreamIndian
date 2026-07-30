import { CanonicalStreamSource, MediaSearchQuery } from '../types';

export class StremioParser {
  public static parse(stream: any, query: MediaSearchQuery, providerName: string): CanonicalStreamSource | null {
    const isTorrent = !!stream.infoHash;
    const isUrl = !!stream.url;
    
    // Explicitly ignore streams that only have externalUrl, as they are not playable inside AVPlay.
    if (!isTorrent && !isUrl) {
        if (stream.externalUrl) {
            console.log(`[StremioParser] Ignoring external link from ${providerName}: ${stream.name}`);
        }
        return null;
    }

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
    
    const format = stream.url?.includes('.m3u8') ? 'hls' : stream.url?.includes('.mpd') ? 'dash' : 'http';
    const finalSourceType = isTorrent ? 'torrent' : format;

    let audio = undefined;
    if (fullText.includes('atmos')) audio = 'Atmos';
    else if (fullText.includes('5.1')) audio = '5.1';
    else if (fullText.includes('7.1')) audio = '7.1';
    else if (fullText.includes('aac')) audio = 'AAC';

    return {
        id: `${providerName}_${stream.infoHash || stream.url || Math.random().toString(36).substring(7)}`.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        title: title,
        type: query.type,
        sourceType: finalSourceType as any,
        url: stream.url,
        infoHash: stream.infoHash, fileIndex: stream.fileIdx,
        magnet: stream.infoHash ? `magnet:?xt=urn:btih:${stream.infoHash}` : undefined,
        quality: quality,
        codec: codec,
        hdr: fullText.includes('hdr'),
        dolbyVision: fullText.includes('dolby vision') || fullText.includes('dv'),
        atmos: fullText.includes('atmos'),
        size: size,
        seeders: seeders,
        provider: stream.name || providerName,
        audio: audio,
        subtitles: stream.subtitles,
    };
  }
}
