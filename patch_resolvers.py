import os

resolvers = [
    'TorBoxResolver',
    'RealDebridResolver',
    'PremiumizeResolver',
    'EasyDebridResolver'
]

for resolver in resolvers:
    path = f'src/core/streams/resolvers/{resolver}.ts'
    if not os.path.exists(path):
        continue
    content = open(path).read()
    
    # Add priority, getHealth, supports
    if "public readonly priority" not in content:
        content = content.replace(f"public readonly name = '{resolver.replace('Resolver', '')}';", f"public readonly name = '{resolver.replace('Resolver', '')}';\n  public readonly priority: number = 50;")
        # Note: Real-Debrid is named 'Real-Debrid' in RealDebridResolver, so we might need a safer replacement
    
    # Let's do regex
    import re
    
    # Priority
    if "readonly priority" not in content:
        content = re.sub(r'(public readonly name = [^;]+;)', r'\1\n  public readonly priority: number = 50;', content)
    
    # Health properties
    health_props = """
  private latencyMs: number = 0;
  private reliability: number = 100;
  private failureCount: number = 0;
  private lastSuccessfulResolution?: number;
  private averageResolveTimeMs: number = 0;
  private totalResolutions: number = 0;
"""
    if "private latencyMs" not in content:
        content = re.sub(r'(private isAvailable: boolean = false;)', r'\1' + health_props, content)
    
    # getHealth
    get_health = """
  public getHealth(): import('../types').ResolverHealth {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      reliability: this.reliability,
      failureCount: this.failureCount,
      lastSuccessfulResolution: this.lastSuccessfulResolution,
      averageResolveTimeMs: this.averageResolveTimeMs
    };
  }

  public supports(type: 'torrent' | 'url', payload: any): boolean {
    return type === 'torrent';
  }
"""
    if "public getHealth()" not in content:
        content = content.replace("public async healthCheck(): Promise<boolean> {\n    return this.isAvailable;\n  }", "public async healthCheck(): Promise<boolean> {\n    return this.isAvailable;\n  }\n" + get_health)
        
    open(path, 'w').write(content)

