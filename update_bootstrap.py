import re

content = open('src/core/Bootstrap.ts').read()

imports = """import {
  RenderMetrics,
  ArtworkManager,
  PrefetchManager
} from './rendering';
"""

content = content.replace("import {\n  MediaDetailsRepository,", imports + "import {\n  MediaDetailsRepository,")

registrations = """
      const imageCache = new ImageCache(cacheManager);
      container.register('ImageCache', imageCache);
      
      const renderMetrics = new RenderMetrics(logger);
      container.register('RenderMetrics', renderMetrics);
      
      const artworkManager = new ArtworkManager(imageCache, logger);
      container.register('ArtworkManager', artworkManager);
"""

content = content.replace(
    "      const imageCache = new ImageCache(cacheManager);\n      container.register('ImageCache', imageCache);",
    registrations
)

prefetch_reg = """
      const prefetchManager = new PrefetchManager(metadataManager, artworkManager, eventBus, logger);
      container.register('PrefetchManager', prefetchManager);

      // 9. Initialize Search Engine
"""

content = content.replace("      // 9. Initialize Search Engine", prefetch_reg)

open('src/core/Bootstrap.ts', 'w').write(content)
