import { StorageManager } from './StorageManager';
import { CachePolicy, CachePolicyType, CachePolicies } from './types';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  version: number;
}

export class CacheManager {
  private storage: StorageManager;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  private generateKey(group: string, key: string): string {
    return `cache_${group}_${key}`;
  }

  public async get<T>(group: string, key: string, policyType: CachePolicyType = CachePolicyType.PROVIDER_RESPONSES, version: number = 1): Promise<T | null> {
    const fullKey = this.generateKey(group, key);
    const policy = CachePolicies[policyType];

    const memEntry = this.memoryCache.get(fullKey);
    if (memEntry) {
      if (this.isValid(memEntry, policy, version)) {
        return memEntry.value as T;
      } else {
        this.memoryCache.delete(fullKey);
      }
    }

    if (!policy.persistence) {
      return null;
    }

    const storageEntry = await this.storage.get<CacheEntry<T>>(fullKey);
    if (storageEntry) {
       if (this.isValid(storageEntry, policy, version)) {
         this.memoryCache.set(fullKey, storageEntry);
         return storageEntry.value;
       } else {
         await this.storage.remove(fullKey);
       }
    }

    return null;
  }

  public async set<T>(group: string, key: string, value: T, policyType: CachePolicyType = CachePolicyType.PROVIDER_RESPONSES, version: number = 1): Promise<void> {
    const fullKey = this.generateKey(group, key);
    const policy = CachePolicies[policyType];
    const entry: CacheEntry<T> = { value, timestamp: Date.now(), version };

    this.memoryCache.set(fullKey, entry);

    if (policy.persistence) {
       // Avoid blocking UI on Tizen by wrapping in setTimeout/Promise
       Promise.resolve().then(() => {
          this.storage.set(fullKey, entry);
       });
    }
  }

  public async invalidate(group: string, key: string): Promise<void> {
    const fullKey = this.generateKey(group, key);
    this.memoryCache.delete(fullKey);
    await this.storage.remove(fullKey);
  }

  public async invalidateGroup(group: string): Promise<void> {
    const prefix = `cache_${group}_`;
    for (const key of this.memoryCache.keys()) {
       if (key.startsWith(prefix)) {
         this.memoryCache.delete(key);
       }
    }
    // We ideally clear persistent storage matching this prefix too
  }

  public clearExpired(): void {
     const now = Date.now();
     for (const [key, entry] of this.memoryCache.entries()) {
        // Need policy to determine exact expiration, this is just memory cleanup
        // Real implementation would look up policy by group
     }
  }

  private isValid(entry: CacheEntry<any>, policy: CachePolicy, version: number): boolean {
    if (entry.version !== version) return false;
    if (policy.ttlMs === 0) return true; // Infinite
    return Date.now() - entry.timestamp < policy.ttlMs;
  }
}
