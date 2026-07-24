content = open('src/core/Bootstrap.ts').read()

if "new StreamManager(resolverManager, logger, cacheManager)" not in content:
    content = content.replace("new StreamManager(resolverManager, logger)", "new StreamManager(resolverManager, logger, cacheManager)")
    open('src/core/Bootstrap.ts', 'w').write(content)
