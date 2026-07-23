content = open('src/core/streams/ResolutionManager.ts').read()

new_mapper = """
  private mapToStreamSource(res: StreamResolution, sources: CanonicalStreamSource[]): StreamSource {
    let tizenFormat: 'HLS' | 'DASH' | 'MP4' = 'MP4';
    if (res.format === 'HLS') tizenFormat = 'HLS';
    if (res.format === 'DASH') tizenFormat = 'DASH';
    
    let quality: StreamSource['quality'] = 'SD';
    if (res.quality === '4K HDR' || res.quality === '4K') quality = '4K HDR';
    else if (res.quality === '1080p FHD') quality = '1080p FHD';
    else if (res.quality === '720p HD') quality = '720p HD';
    
    // Determine readiness
    let readiness: any = 'DIRECT';
    if (res.resolver && res.resolver !== 'direct') {
        // Here we can check if it's actually cached on Debrid or needs resolution.
        // For now, assume if we got a url back from debrid, it's cached or resolved
        readiness = 'DEBRID_CACHED';
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
"""

import re
# find mapToStreamSource and replace it
content = re.sub(r"  private mapToStreamSource.*?}(\n|$)", new_mapper.strip() + "\n", content, flags=re.DOTALL)
open('src/core/streams/ResolutionManager.ts', 'w').write(content)
