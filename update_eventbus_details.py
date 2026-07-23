import re

content = open('src/core/EventBus.ts').read()

new_events = """  // Metadata Events
  'METADATA_MERGED': { type: 'movie' | 'series' | 'anime', id: string, data: any };
  'METADATA_UPDATED': { type: 'movie' | 'series' | 'anime', id: string, data: any };
  'ANIME_METADATA_READY': { id: string, data: any };
  'ARTWORK_UPDATED': { type: 'movie' | 'series' | 'anime', id: string, artwork: any };
  
  // Media Details Events
  'DETAILS_LOADING': { mediaId: string, mediaType: string };
  'DETAILS_READY': { mediaId: string, mediaType: string, data: any };
  'DETAILS_UPDATED': { mediaId: string, mediaType: string, data: any };
  'DETAILS_FAILED': { mediaId: string, mediaType: string, error: any };
  'ARTWORK_READY': { mediaId: string, artwork: any };
  'SEASON_CHANGED': { seriesId: string, seasonNumber: number };
  'EPISODE_SELECTED': { episodeId: string };
"""

content = content.replace(
    "  // Metadata Events\n  'METADATA_MERGED': { type: 'movie' | 'series' | 'anime', id: string, data: any };\n  'METADATA_UPDATED': { type: 'movie' | 'series' | 'anime', id: string, data: any };\n  'ANIME_METADATA_READY': { id: string, data: any };\n  'ARTWORK_UPDATED': { type: 'movie' | 'series' | 'anime', id: string, artwork: any };\n",
    new_events
)

open('src/core/EventBus.ts', 'w').write(content)
