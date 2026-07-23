content = open('src/core/Bootstrap.ts').read()

import_statement = """import {
  ResolutionManager,
  ResolverManager,
  TorBoxResolver,
  RealDebridResolver,
  PremiumizeResolver,
  EasyDebridResolver,
  SourceManager,
  DirectHttpProvider,
  HlsProvider,
  DashProvider,
  TorrentSourceProvider,
  StremioProvider
} from './streams';"""

# replace old imports
import re
content = re.sub(r"import\s*{\s*StreamManager[^\}]*}\s*from\s*'./streams';", import_statement, content)

init_block = """
      // 7.5 Initialize Stream Ecosystem
      const resolverManager = new ResolverManager(logger);
      resolverManager.registerResolver(new TorBoxResolver(''));
      resolverManager.registerResolver(new RealDebridResolver(''));
      resolverManager.registerResolver(new PremiumizeResolver(''));
      resolverManager.registerResolver(new EasyDebridResolver(''));
      await resolverManager.initializeAll();
      container.register('ResolverManager', resolverManager);

      const sourceManager = new SourceManager(logger, cacheManager);
      sourceManager.registerProvider(new DirectHttpProvider());
      sourceManager.registerProvider(new HlsProvider());
      sourceManager.registerProvider(new DashProvider());
      sourceManager.registerProvider(new TorrentSourceProvider());
      sourceManager.registerProvider(new StremioProvider());
      await sourceManager.initializeAll();
      container.register('SourceManager', sourceManager);

      const resolutionManager = new ResolutionManager(resolverManager, logger, cacheManager);
      container.register('ResolutionManager', resolutionManager);
"""

# Replace the previous StreamManager block
start_str = "// 7.5 Initialize Stream Resolvers"
end_str = "container.register('StreamManager', streamManager);"

# If the old block exists, replace it
if start_str in content:
    start_idx = content.find(start_str)
    end_idx = content.find(end_str) + len(end_str)
    content = content[:start_idx] + init_block.strip() + "\n" + content[end_idx:]
else:
    # Just insert it before metadata
    content = content.replace("// 8. Initialize Metadata Engine", init_block + "\n      // 8. Initialize Metadata Engine")

open('src/core/Bootstrap.ts', 'w').write(content)
