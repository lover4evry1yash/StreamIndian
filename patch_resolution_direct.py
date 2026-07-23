content = open('src/core/streams/ResolutionManager.ts').read()

old_direct = """
      // Direct resolver logic for HTTP/HLS/DASH
      if (['http', 'https', 'hls', 'dash'].includes(source.sourceType) && source.url) {
        return [{
          id: source.id,
          title: source.title,
          url: source.url,
          quality: source.quality,
          format: source.sourceType === 'hls' ? 'HLS' : source.sourceType === 'dash' ? 'DASH' : 'MP4',
          codec: source.codec,
          audioChannels: source.audio,
          subtitles: source.subtitles,
          provider: source.provider,
          resolver: 'direct',
          health: source.score || 100,
          hdr: source.hdr,
          dolbyVision: source.dolbyVision,
          atmos: source.atmos,
          size: source.size,
          seeders: source.seeders,
          bitrate: source.bitrate
        } as StreamResolution];
      }
"""

new_direct = """
      // Direct resolver logic for HTTP/HLS/DASH
      if (['http', 'https', 'hls', 'dash'].includes(source.sourceType) && source.url) {
        const resolutions = await this.resolverManager.resolveUrl(source.url);
        if (resolutions.length > 0) return resolutions;
        // Fallback if no specific url resolver handles it, just pass it through
        return [{
          id: source.id,
          title: source.title,
          url: source.url,
          quality: source.quality,
          format: source.sourceType === 'hls' ? 'HLS' : source.sourceType === 'dash' ? 'DASH' : 'MP4',
          codec: source.codec,
          audioChannels: source.audio,
          subtitles: source.subtitles,
          provider: source.provider,
          resolver: 'direct',
          health: source.score || 100,
          hdr: source.hdr,
          dolbyVision: source.dolbyVision,
          atmos: source.atmos,
          size: source.size,
          seeders: source.seeders,
          bitrate: source.bitrate
        } as StreamResolution];
      }
"""

content = content.replace(old_direct.strip(), new_direct.strip())
open('src/core/streams/ResolutionManager.ts', 'w').write(content)

# add direct resolver to bootstrap
b_content = open('src/core/Bootstrap.ts').read()
b_content = b_content.replace("import {", "import {\n  DirectResolver,", 1)
b_content = b_content.replace("resolverManager.registerResolver(new TorBoxResolver(''));", "resolverManager.registerResolver(new DirectResolver());\n      resolverManager.registerResolver(new TorBoxResolver(''));")
open('src/core/Bootstrap.ts', 'w').write(b_content)

# export it
i_content = open('src/core/streams/index.ts').read()
i_content = i_content.replace("export * from './resolvers';", "export * from './resolvers';\nexport * from './resolvers/DirectResolver';")
open('src/core/streams/index.ts', 'w').write(i_content)
