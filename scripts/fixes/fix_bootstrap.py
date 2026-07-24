import re

content = open('src/core/Bootstrap.ts').read()
content = content.replace(
"  MetadataManager\n}",
"  MetadataManager,\n  MetadataAggregator\n}")

content = content.replace(
"      const metadataManager = new MetadataManager(providerManager, metadataRepository, eventBus, logger);",
"""      const mergePolicy = {
        overview: ['tmdb', 'tvdb', 'trakt', 'anilist'],
        episodes: ['tmdb', 'tvdb'],
        anime: ['anilist', 'tmdb'],
        artwork: ['fanart', 'rpdb', 'tmdb'],
        poster: ['rpdb', 'tmdb', 'tvdb'],
        ratings: ['trakt', 'mdblist', 'tmdb'],
        collections: ['mdblist', 'tmdb']
      };
      const metadataAggregator = new MetadataAggregator(providerManager, mergePolicy, logger);
      container.register('MetadataAggregator', metadataAggregator);

      const metadataManager = new MetadataManager(metadataAggregator, metadataRepository, eventBus, logger);"""
)

open('src/core/Bootstrap.ts', 'w').write(content)
