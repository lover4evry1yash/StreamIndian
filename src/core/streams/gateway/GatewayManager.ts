import { CanonicalStreamSource, MediaSearchQuery } from '../types';
import { ProviderRegistry } from './ProviderRegistry';
import { IProviderClient } from './IProviderClient';
import { AddonClient } from './AddonClient';
import { CircuitState } from './CircuitBreaker';
import { AddonTransport } from './AddonTransport';
import { normalizeAddonBaseUrl } from './AddonUrlUtils';
import { LRUCache } from 'lru-cache';

// Simple deterministic string hash for ID generation
// NOTE: This is an opaque identifier for runtime maps, NOT a credential-protection mechanism.
// It ensures that the original URL cannot be directly recovered from the ID.
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return 'addon_' + (hash >>> 0).toString(16);
}

// Utility to safely log hostnames without exposing credentials
function sanitizeAddonUrl(addonUrl: string): string {
    try {
        const urlObj = new URL(addonUrl);
        return `${urlObj.protocol}//${urlObj.hostname}[REDACTED]`;
    } catch {
        return '[INVALID URL]';
    }
}

export class GatewayManager {
  private registry: ProviderRegistry;
  public transport?: AddonTransport;
  
  // Cache for 15 minutes
  private cache = new LRUCache<string, CanonicalStreamSource[]>({
    max: 500,
    ttl: 1000 * 60 * 15 
  });

  private cacheStats = {
      hits: 0,
      misses: 0
  };

  constructor(transport?: AddonTransport) {
      this.transport = transport;
      this.registry = new ProviderRegistry();
  }

  public getDiagnostics() {
      return {
          providers: this.registry.getDiagnostics(),
          cache: {
              ...this.cacheStats,
              size: this.cache.size
          }
      };
  }

  public async search(query: MediaSearchQuery, context?: { torboxKey?: string, addons?: string[] }): Promise<CanonicalStreamSource[]> {
    const torboxKey = context?.torboxKey;
    const cacheKey = `${query.type}_${query.tmdbId || query.imdbId || query.mediaId}_${query.season}_${query.episode}`;
    const fullCacheKey = cacheKey + (torboxKey ? '_tb' : '');
    
    const fullCached = this.cache.get(fullCacheKey);
    if (fullCached) {
        this.cacheStats.hits++;
        console.log(`[GatewayManager] Cache hit for ${fullCacheKey}`);
        return fullCached;
    }

    this.cacheStats.misses++;

    let timeoutHandle: any;
    try {
      console.log(`[GatewayManager] Searching sources for ${query.title || query.tmdbId} (Type: ${query.type})`);
      
      const dynamicAddons = context?.addons || [];
      for (const addonUrl of dynamicAddons) {
          // Generate a secure, non-reversible ID for the addon based on URL
          let id = hashString(addonUrl);
          
          let hostname = 'Dynamic Addon';
          let baseUrl = addonUrl;
          try { 
              const urlObj = new URL(addonUrl);
              hostname = urlObj.hostname;
              baseUrl = normalizeAddonBaseUrl(addonUrl);
          } catch(e) {
              if (e instanceof Error && e.message.includes('Query strings')) {
                  console.warn(`[GatewayManager] Skipping invalid addon: ${e.message}`);
                  continue;
              }
              baseUrl = normalizeAddonBaseUrl(addonUrl);
          }
          
          // Collision handling: ensure we don't overwrite a different configured addon
          let collisionCount = 0;
          while (this.registry.has(id)) {
              const existingProvider = this.registry.get(id) as AddonClient;
              if (existingProvider && existingProvider.getBaseUrl && existingProvider.getBaseUrl() === baseUrl) {
                  break; // It's the exact same addon, no collision, we can reuse it
              }
              // It's a true collision, generate a new ID
              collisionCount++;
              id = hashString(addonUrl + collisionCount);
          }
          
          if (!this.registry.has(id)) {
              const sanitizedUrl = sanitizeAddonUrl(addonUrl);
              console.log(`[GatewayManager] Registering dynamic addon: ${sanitizedUrl} with ID ${id}`);
              
              this.registry.register(new AddonClient({
                  id,
                  name: hostname,
                  baseUrl: baseUrl,
                  enabled: true,
                  priority: 30,
                  transport: this.transport
              }));
          }
      }
      
      const capableProviders = this.registry.getCapableProviders(query);
    if (capableProviders.length === 0) {
        console.warn('[GatewayManager] NO_PROVIDERS_CONFIGURED: 0 capable providers found for query.');
    }
      const promises = [];
      const activeProviders: IProviderClient[] = [];

      // Early cancellation: timeout global gateway search after 14.5s to not block UI indefinitely
      const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Gateway Timeout')), 14500);
      });

      for (const provider of capableProviders) {
          const metrics = provider.getMetrics();
          if (metrics.circuitState === CircuitState.OPEN) {
              console.log(`[GatewayManager] Skipping provider ${provider.getMetadata().id} (Circuit OPEN)`);
              continue;
          }
          activeProviders.push(provider);
          promises.push(
              Promise.race([provider.search(query, context), timeoutPromise]).then(results => {
                  return { provider, results: results as CanonicalStreamSource[] };
              })
          );
      }

      const settled = await Promise.allSettled(promises);
      
      let allSources: CanonicalStreamSource[] = [];

      if (Array.isArray(settled)) {
        for (const result of settled) {
            if (result.status === 'fulfilled') {
                const caps = result.value.provider.getCapabilities();
                // Attach the dynamic score to the results for sorting later
                let dynamicScore = result.value.provider.getMetrics().dynamicScore;
                
                // Capability weighting bonus
                if (caps.uhd4k) dynamicScore += 10;
                if (query.type === 'movie' && caps.movies) dynamicScore += 5;
                if (query.type === 'episode' && caps.episodes) dynamicScore += 5;

                const enhancedResults = result.value.results.map(r => {
                    (r as any)._dynamicScore = dynamicScore;
                    return r;
                });
                allSources = allSources.concat(enhancedResults);
            } else {
            console.error(`[GatewayManager] A provider failed: ${result.reason.message || result.reason}`);
            }
        }
      }

      let deduplicated = this.removeDuplicates(allSources);
      deduplicated = this.aggregateAndSort(deduplicated);

      if (deduplicated.length > 0) {
          this.cache.set(fullCacheKey, deduplicated);
      }

      console.log(`TRACE_COUNT GatewayManager: ${deduplicated.length}`);

      clearTimeout(timeoutHandle);
      
    
    
    
    let torrentCount = 0;
    let directCount = 0;
    for (const src of deduplicated) {
        if (src.sourceType === 'torrent') {
            torrentCount++;
            console.log(`[GatewayManager:DIAG] Torrent found. infoHash present: ${!!src.infoHash}, valid: ${!!src.infoHash && src.infoHash.length > 30}, fileIndex present: ${src.fileIndex !== undefined}`);
        } else if (src.sourceType === 'http' || src.sourceType === 'hls' || src.sourceType === 'dash') {
            directCount++;
        }
    }
    console.log(`[GatewayManager:DIAG] REAL_RUNTIME_GATEWAY_RESULTS: ${deduplicated.length}`);
    console.log(`[GatewayManager:DIAG] REAL_RUNTIME_TORRENT_RESULTS: ${torrentCount}`);
    console.log(`[GatewayManager:DIAG] REAL_RUNTIME_DIRECT_RESULTS: ${directCount}`);
    return deduplicated;
    } catch (e) {
      console.error('[GatewayManager] Search error:', e);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      return [];
    }
  }

  private aggregateAndSort(results: CanonicalStreamSource[]): CanonicalStreamSource[] {
      return results.sort((a, b) => {
          const scoreA = (a as any)._dynamicScore || 0;
          const scoreB = (b as any)._dynamicScore || 0;
          // Sort descending by score
          if (scoreA !== scoreB) return scoreB - scoreA;
          
          // Fallback to basic size/resolution sorting if needed, but score is primary
          const sizeA = a.size || 0;
          const sizeB = b.size || 0;
          return sizeB - sizeA;
      }).map(r => {
          // Clean up the internal property
          delete (r as any)._dynamicScore;
          return r;
      });
  }

  private removeDuplicates(sources: CanonicalStreamSource[]): CanonicalStreamSource[] {
    const seen = new Set<string>();
    return sources.filter(src => {
      let key = src.url || src.infoHash || src.magnet;
      if (!key) key = `${src.title}_${src.quality}_${src.codec}_${src.size}`;
      
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
