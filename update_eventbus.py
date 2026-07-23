import re

content = open('src/core/EventBus.ts').read()

new_events = """  'SEARCH_CANCELLED': { query: import('./search/types').SearchQuery };
  'SETTINGS_LOADED': any;
  'SETTINGS_UPDATED': any;
  
  // Provider Events
  'PROVIDER_REGISTERED': { providerId: string };
  'PROVIDER_AVAILABLE': { providerId: string };
  'PROVIDER_UNAVAILABLE': { providerId: string, error?: any };
  'PROVIDER_RECOVERED': { providerId: string };
  
  // Metadata Events
  'METADATA_MERGED': { type: 'movie' | 'series' | 'anime', id: string, data: any };
  'METADATA_UPDATED': { type: 'movie' | 'series' | 'anime', id: string, data: any };
  'ANIME_METADATA_READY': { id: string, data: any };
  'ARTWORK_UPDATED': { type: 'movie' | 'series' | 'anime', id: string, artwork: any };
"""

content = content.replace(
    "  'SEARCH_CANCELLED': { query: import('./search/types').SearchQuery };\n  'SETTINGS_LOADED': any;\n  'SETTINGS_UPDATED': any;",
    new_events
)

open('src/core/EventBus.ts', 'w').write(content)
