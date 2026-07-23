import re

content = open('src/core/Bootstrap.ts').read()

import_add = """import {
  StreamManager,
  ResolverManager,
  TorBoxResolver,
  RealDebridResolver,
  PremiumizeResolver,
  EasyDebridResolver
} from './streams';"""

if "import { StreamManager" not in content:
    content = content.replace("import { EventBus } from './EventBus';", import_add + "\nimport { EventBus } from './EventBus';")

streams_init = """
      // 7.5 Initialize Stream Resolvers
      const resolverManager = new ResolverManager(logger);
      // Retrieve keys from settings/config in a real app, placeholder for now
      resolverManager.registerResolver(new TorBoxResolver(config.get('TORBOX_KEY') || ''));
      resolverManager.registerResolver(new RealDebridResolver(config.get('RD_KEY') || ''));
      resolverManager.registerResolver(new PremiumizeResolver(config.get('PM_KEY') || ''));
      resolverManager.registerResolver(new EasyDebridResolver(config.get('ED_KEY') || ''));
      await resolverManager.initializeAll();
      container.register('ResolverManager', resolverManager);

      const streamManager = new StreamManager(resolverManager, logger);
      container.register('StreamManager', streamManager);
"""

if "7.5 Initialize Stream Resolvers" not in content:
    content = content.replace("      await providerManager.initializeAll();", "      await providerManager.initializeAll();\n" + streams_init)

open('src/core/Bootstrap.ts', 'w').write(content)
