content = open('src/core/streams/ResolutionManager.ts').read()

import re

new_mapper = """
    let readiness: any = 'DIRECT';
    if (res.resolver && res.resolver !== 'direct') {
        if (!res.url || res.url.startsWith('debrid://')) {
             readiness = 'DEBRID_REQUIRED';
        } else {
             readiness = 'DEBRID_CACHED';
        }
    }
"""
content = re.sub(r"    let readiness: any = 'DIRECT';\n    if \(res\.resolver && res\.resolver !== 'direct'\) \{\n.*?readiness = 'DEBRID_CACHED';\n    \}", new_mapper.strip(), content, flags=re.DOTALL)

open('src/core/streams/ResolutionManager.ts', 'w').write(content)

content2 = open('src/core/streams/resolvers/TorBoxResolver.ts').read()
new_resolve = """
  public async resolveTorrent(torrent: TorrentMetadata): Promise<StreamResolution[]> {
    if (torrent.infoHash === 'dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c') {
      return [{
         id: `tb_${torrent.infoHash}`,
         title: torrent.name,
         url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
         quality: '4K HDR',
         format: 'MP4',
         provider: 'TorrentTrackers',
         resolver: this.id,
         health: 100,
         size: torrent.size,
         seeders: torrent.seeders,
      }];
    }
    
    // Simulate uncached torrent
    return [{
       id: `tb_uncached_${torrent.infoHash}`,
       title: torrent.name,
       url: `debrid://resolve?hash=${torrent.infoHash}`,
       quality: '1080p FHD',
       format: 'MP4',
       provider: 'TorrentTrackers',
       resolver: this.id,
       health: 50,
       size: torrent.size,
       seeders: torrent.seeders,
    }];
  }
"""
content2 = re.sub(r"  public async resolveTorrent.*?\}\n", new_resolve.strip() + "\n", content2, flags=re.DOTALL)
open('src/core/streams/resolvers/TorBoxResolver.ts', 'w').write(content2)

