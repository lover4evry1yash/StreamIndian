content = open('src/core/Bootstrap.ts').read()

old_keys = """      resolverManager.registerResolver(new TorBoxResolver(config.get('TORBOX_KEY') || ''));
      resolverManager.registerResolver(new RealDebridResolver(config.get('RD_KEY') || ''));
      resolverManager.registerResolver(new PremiumizeResolver(config.get('PM_KEY') || ''));
      resolverManager.registerResolver(new EasyDebridResolver(config.get('ED_KEY') || ''));"""

new_keys = """      resolverManager.registerResolver(new TorBoxResolver(''));
      resolverManager.registerResolver(new RealDebridResolver(''));
      resolverManager.registerResolver(new PremiumizeResolver(''));
      resolverManager.registerResolver(new EasyDebridResolver(''));"""

content = content.replace(old_keys, new_keys)
open('src/core/Bootstrap.ts', 'w').write(content)
