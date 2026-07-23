import { Logger } from '../Logger';
import { IStreamResolver, TorrentMetadata, StreamResolution, ResolverDiagnostics } from './types';

export class ResolverManager {
  private resolvers: Map<string, IStreamResolver> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public registerResolver(resolver: IStreamResolver) {
    this.resolvers.set(resolver.id, resolver);
    this.logger.info(`Registered stream resolver: ${resolver.name} (Priority: ${resolver.priority})`);
  }

  public async initializeAll(context?: any): Promise<void> {
    for (const resolver of this.resolvers.values()) {
      try {
        await resolver.initialize(context);
      } catch (err) {
        this.logger.error(`Failed to initialize resolver: ${resolver.name}`, err);
      }
    }
  }

  public getDiagnostics(): ResolverDiagnostics[] {
    return Array.from(this.resolvers.values()).map(r => ({
      id: r.id,
      name: r.name,
      health: r.getHealth(),
      totalResolutions: 0, // Tracked per-resolver
      cacheHitRate: 0 // Cache hit logic to be implemented
    }));
  }

  private getSortedResolvers(): IStreamResolver[] {
    return Array.from(this.resolvers.values()).sort((a, b) => b.priority - a.priority);
  }

  private async withResolverTimeout<T>(promise: Promise<T>, ms: number = 8000, resolverName: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Resolver ${resolverName} timed out after ${ms}ms`));
      }, ms);
      promise.then(
        (res) => {
          clearTimeout(timeoutId);
          resolve(res);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      );
    });
  }

  public async resolveTorrent(torrent: TorrentMetadata): Promise<StreamResolution[]> {
    const sortedResolvers = this.getSortedResolvers().filter(r => r.supports('torrent', torrent));
    
    const promises = sortedResolvers.map(async (resolver) => {
      try {
        const isHealthy = await resolver.healthCheck();
        if (!isHealthy) return [];
        if (typeof resolver.resolveTorrent !== 'function') return [];
        return await this.withResolverTimeout(resolver.resolveTorrent(torrent), 8000, resolver.name);
      } catch (err) {
        this.logger.error(`Resolver ${resolver.name} failed for torrent: ${torrent.infoHash}`, err);
        return [];
      }
    });
      
    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<StreamResolution[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }

  public async resolveUrl(url: string): Promise<StreamResolution[]> {
    const sortedResolvers = this.getSortedResolvers().filter(r => r.supports('url', url));
    
    const promises = sortedResolvers.map(async (resolver) => {
      try {
        const isHealthy = await resolver.healthCheck();
        if (!isHealthy) return [];
        if (typeof resolver.resolveUrl !== 'function') return [];
        return await this.withResolverTimeout(resolver.resolveUrl(url), 8000, resolver.name);
      } catch (err) {
        this.logger.error(`Resolver ${resolver.name} failed for URL: ${url}`, err);
        return [];
      }
    });
      
    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<StreamResolution[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }
}

