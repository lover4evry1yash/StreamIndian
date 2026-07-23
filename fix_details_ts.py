import re

content = open('src/core/details/MediaActionResolver.ts').read()
content = content.replace("media.videos && media.videos", "(media as any).videos && (media as any).videos")
open('src/core/details/MediaActionResolver.ts', 'w').write(content)

content = open('src/core/details/MediaSectionBuilder.ts').read()
content = content.replace("media.credits?.cast", "(media as any).credits?.cast")
content = content.replace("media.credits.cast", "(media as any).credits.cast")
content = content.replace("media.credits?.crew", "(media as any).credits?.crew")
content = content.replace("media.credits.crew", "(media as any).credits.crew")
content = content.replace("media.videos?.length", "(media as any).videos?.length")
content = content.replace("media.videos)", "(media as any).videos)")
open('src/core/details/MediaSectionBuilder.ts', 'w').write(content)

content = open('src/core/details/MediaDetailsManager.ts').read()
replacement = """{ id: `${id}_s${seasonNumber}`, seriesId: id, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } }"""
content = content.replace("""{ id: `${id}_s${seasonNumber}`, seriesId: id, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '' }""", replacement)

replacement2 = """{ id: `${seriesId}_s${seasonNumber}`, seriesId, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } }"""
content = content.replace("""{ id: `${seriesId}_s${seasonNumber}`, seriesId, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '' }""", replacement2)
open('src/core/details/MediaDetailsManager.ts', 'w').write(content)
