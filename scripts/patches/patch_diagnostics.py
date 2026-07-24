content = open('src/core/streams/ResolutionManager.ts').read()
diag = """
  public getDiagnostics() {
    return {
      registeredResolvers: this.resolverManager.getDiagnostics(),
      cacheHitRate: 0,
      failures: 0,
      averageResolveTimeMs: 0,
    };
  }
"""
if "getDiagnostics" not in content:
    content = content.replace("public async resolve(", diag + "\n  public async resolve(")
    open('src/core/streams/ResolutionManager.ts', 'w').write(content)
