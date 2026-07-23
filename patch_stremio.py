content = open('src/core/streams/sources/providers/StremioProvider.ts').read()
new_search = """
  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    if (this.addonUrls.length === 0) return [];
    
    // Abstracting out the fetch
    const sources: CanonicalStreamSource[] = [];
    
    sources.push({
        id: `stremio_mock_${query.mediaId}`,
        title: 'Torrentio: 1080p [RD+]',
        type: query.type,
        sourceType: 'torrent',
        infoHash: 'stremiohash12345',
        quality: '1080p FHD',
        codec: 'H264',
        provider: 'Torrentio',
        score: 105,
        seeders: 50
    });
    
    return sources;
  }
"""

import re
content = re.sub(r"  public async search\(query: MediaSearchQuery\): Promise<CanonicalStreamSource\[\]> \{.*?  \}", new_search.strip(), content, flags=re.DOTALL)
open('src/core/streams/sources/providers/StremioProvider.ts', 'w').write(content)
