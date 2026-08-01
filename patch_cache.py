import sys

with open('src/core/storage/CacheManager.ts', 'r') as f:
    content = f.read()

# Add an LRU simple logic
content = content.replace(
"""  private memoryCache: Map<string, CacheEntry<any>> = new Map();""",
"""  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly MAX_MEMORY_KEYS = 300;""")

content = content.replace(
"""    this.memoryCache.set(fullKey, entry);""",
"""    this.memoryCache.delete(fullKey); // To refresh insertion order
    this.memoryCache.set(fullKey, entry);
    this.enforceMemoryLimit();""")

content = content.replace(
"""  public clearExpired(): void {
     const now = Date.now();
     for (const [key, entry] of this.memoryCache.entries()) {
        // Need policy to determine exact expiration, this is just memory cleanup
        // Real implementation would look up policy by group
     }
  }""",
"""  private enforceMemoryLimit(): void {
    if (this.memoryCache.size > this.MAX_MEMORY_KEYS) {
      const keysToDelete = this.memoryCache.size - this.MAX_MEMORY_KEYS;
      let deleted = 0;
      for (const key of this.memoryCache.keys()) {
        this.memoryCache.delete(key);
        deleted++;
        if (deleted >= keysToDelete) break;
      }
    }
  }

  public clearExpired(): void {
     const now = Date.now();
     for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > 24 * 60 * 60 * 1000) { // Fallback 24h cleanup
           this.memoryCache.delete(key);
        }
     }
  }""")

with open('src/core/storage/CacheManager.ts', 'w') as f:
    f.write(content)
