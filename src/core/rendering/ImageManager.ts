import { Logger } from '../Logger';
import { NetworkClient } from '../NetworkClient';
import { ArtworkAggregator } from '../metadata/ArtworkAggregator';
import { ArtworkSet, Image as DomainImage } from '../models/DomainModels';

export type ArtworkType = 'poster' | 'backdrop' | 'logo' | 'clearart';
export type ArtworkPriority = 'high' | 'medium' | 'low';
type ArtworkState = 'requested' | 'queued' | 'loading' | 'cached' | 'displayed' | 'released';

interface ArtworkRequest {
  id: string;
  url: string; // The virtual URL
  type: ArtworkType;
  priority: ArtworkPriority;
  state: ArtworkState;
  resolveCallbacks: ((url: string | null) => void)[];
  blobUrl?: string; // The local Blob URL we generated
  refCount: number;
  lastAccessed: number;
}

export interface ImageDiagnostics {
  cacheHits: number;
  cacheMisses: number;
  evictions: number;
  failedLoads: number;
  totalLoadTimeMs: number;
  completedLoads: number;
  averageLatencyMs: number;
}

export class ImageManager {
  private network: NetworkClient;
  private artworkAgg: ArtworkAggregator;
  private logger: Logger;

  private requests = new Map<string, ArtworkRequest>();
  private queue: string[] = [];
  
  private MAX_CACHED_IMAGES = 100; // Increased capacity for TV
  private MAX_CONCURRENT_LOADS = 4;
  private currentLoads = 0;

  private diagnostics: ImageDiagnostics = {
    cacheHits: 0,
    cacheMisses: 0,
    evictions: 0,
    failedLoads: 0,
    totalLoadTimeMs: 0,
    completedLoads: 0,
    averageLatencyMs: 0
  };

  constructor(network: NetworkClient, artworkAgg: ArtworkAggregator, logger: Logger) {
    this.network = network;
    this.artworkAgg = artworkAgg;
    this.logger = logger;
  }

  public getDiagnostics(): ImageDiagnostics {
    if (this.diagnostics.completedLoads > 0) {
      this.diagnostics.averageLatencyMs = Math.round(this.diagnostics.totalLoadTimeMs / this.diagnostics.completedLoads);
    }
    return { ...this.diagnostics };
  }

  public async preloadImage(url: string, priority: ArtworkPriority = 'low'): Promise<string | null> {
    if (!url) return null;

    return new Promise((resolve) => {
      const req = this.getOrCreateRequest(url, 'poster', priority);
      
      if (req.state === 'cached' || req.state === 'displayed') {
        req.lastAccessed = Date.now();
        this.diagnostics.cacheHits++;
        resolve(req.blobUrl || null);
        return;
      }
      
      req.resolveCallbacks.push(resolve);
      
      if (req.state === 'requested') {
        this.diagnostics.cacheMisses++;
        req.state = 'queued';
        this.queue.push(url);
        this.sortQueue();
        this.processQueue();
      }
    });
  }

  public registerDisplay(url: string): void {
    const req = this.requests.get(url);
    if (req) {
      req.refCount++;
      req.lastAccessed = Date.now();
      if (req.state === 'cached' || req.state === 'released') {
        req.state = 'displayed';
      }
    }
  }

  public unregisterDisplay(url: string): void {
    const req = this.requests.get(url);
    if (req) {
      req.refCount--;
      if (req.refCount <= 0) {
        req.refCount = 0;
        if (req.state === 'displayed' || req.state === 'cached') {
          req.state = 'released';
          this.scheduleCleanup();
        } else if (req.state === 'queued' || req.state === 'requested') {
          this.queue = this.queue.filter(q => q !== url);
          req.resolveCallbacks.forEach(cb => cb(null));
          this.requests.delete(url);
        }
      }
    }
  }

  private getOrCreateRequest(url: string, type: ArtworkType, priority: ArtworkPriority): ArtworkRequest {
    if (this.requests.has(url)) {
      const req = this.requests.get(url)!;
      if (priority === 'high' && req.priority !== 'high') {
        req.priority = 'high';
        this.sortQueue();
      }
      req.lastAccessed = Date.now();
      return req;
    }

    const newReq: ArtworkRequest = {
      id: url,
      url,
      type,
      priority,
      state: 'requested',
      resolveCallbacks: [],
      refCount: 0,
      lastAccessed: Date.now()
    };
    this.requests.set(url, newReq);
    return newReq;
  }

  private sortQueue() {
    this.queue.sort((urlA, urlB) => {
      const a = this.requests.get(urlA);
      const b = this.requests.get(urlB);
      if (!a || !b) return 0;
      if (a.priority === b.priority) return b.lastAccessed - a.lastAccessed;
      return a.priority === 'high' ? -1 : (b.priority === 'high' ? 1 : 0);
    });
  }

  private processQueue() {
    while (this.currentLoads < this.MAX_CONCURRENT_LOADS && this.queue.length > 0) {
      const url = this.queue.shift();
      if (!url) continue;
      
      const req = this.requests.get(url);
      if (!req || req.state !== 'queued') continue;
      
      this.currentLoads++;
      req.state = 'loading';
      this.loadArtworkRequest(req);
    }
  }

  private async loadArtworkRequest(req: ArtworkRequest) {
    const startTime = Date.now();
    let finalBlobUrl: string | null = null;
    
    try {
      if (req.url.startsWith('artwork://')) {
        // e.g. artwork://movie/1234/poster
        const parts = req.url.split('/');
        const mediaType = parts[2] as 'movie' | 'series';
        const mediaId = parts[3];
        const artType = parts[4] as ArtworkType;
        
        const artworkSet = await this.artworkAgg.getArtwork(mediaId, mediaType);
        if (artworkSet) {
           const fallbacks = this.getFallbackChain(artworkSet, artType);
           for (const img of fallbacks) {
              try {
                 const variantUrl = this.selectVariant(img.url, artType, req.priority);
                 finalBlobUrl = await this.downloadImageAsBlob(variantUrl);
                 if (finalBlobUrl) break; // Found a working image!
              } catch (e) {
                 this.logger.debug(`ImageManager: Failed to load fallback ${img.url}, trying next.`);
              }
           }
        }
      } else if (req.url.startsWith('http')) {
        // Standard URL handling
        finalBlobUrl = await this.downloadImageAsBlob(req.url);
      }
    } catch (e) {
      this.logger.error(`ImageManager: Failed to load ${req.url}`, e);
    }

    this.currentLoads--;
    
    if (finalBlobUrl) {
      req.state = 'cached';
      req.blobUrl = finalBlobUrl;
      this.diagnostics.completedLoads++;
      this.diagnostics.totalLoadTimeMs += (Date.now() - startTime);
      req.resolveCallbacks.forEach(cb => cb(finalBlobUrl));
    } else {
      this.diagnostics.failedLoads++;
      req.resolveCallbacks.forEach(cb => cb(null));
      this.requests.delete(req.url); // Allow retry later
    }
    req.resolveCallbacks = [];
    this.processQueue();
  }

  private async downloadImageAsBlob(url: string): Promise<string> {
    const res = await this.network.fetch(url, { timeoutMs: 10000, retries: 1 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  private selectVariant(url: string, type: ArtworkType, priority: ArtworkPriority): string {
    // Basic TMDB variant selection
    if (url.includes('image.tmdb.org')) {
       if (type === 'poster') {
           if (priority === 'low') return url.replace('/original/', '/w342/');
           return url.replace('/original/', '/w500/');
       } else if (type === 'backdrop') {
           if (priority === 'low') return url.replace('/original/', '/w780/');
           return url.replace('/original/', '/w1280/');
       }
    }
    return url;
  }

  private getFallbackChain(set: ArtworkSet, type: string): DomainImage[] {
    if (type === 'logo') return [...(set.clearLogos || []), ...(set.logos || [])];
    if (type === 'poster') return [...(set.posters || []), ...(set.clearArts || [])];
    if (type === 'backdrop') return [...(set.backdrops || []), ...(set.landscapes || []), ...(set.banners || [])];
    return [];
  }

  private scheduleCleanup() {
    let cachedCount = 0;
    for (const req of this.requests.values()) {
      if (req.state === 'cached' || req.state === 'released') cachedCount++;
    }
    if (cachedCount > this.MAX_CACHED_IMAGES) {
      this.logger.info(`ImageManager: Memory pressure, evicting images. Cached: ${cachedCount}`);
      const evictable = Array.from(this.requests.values())
        .filter(r => r.state === 'released' || (r.state === 'cached' && r.refCount === 0))
        .sort((a, b) => a.lastAccessed - b.lastAccessed);
        
      while (evictable.length > 0 && cachedCount > this.MAX_CACHED_IMAGES * 0.8) {
        const toEvict = evictable.shift()!;
        if (toEvict.blobUrl) URL.revokeObjectURL(toEvict.blobUrl);
        toEvict.blobUrl = undefined;
        this.requests.delete(toEvict.url);
        cachedCount--;
        this.diagnostics.evictions++;
      }
    }
  }

  public clearLoading() {
    this.queue = this.queue.filter(url => { 
       const req = this.requests.get(url);
       return req && req.priority === 'high';
    });
  }
}
