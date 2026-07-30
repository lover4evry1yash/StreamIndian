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
  abort?: () => void;
  aborted?: boolean;
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
          if (this.requests.get(url) === req) this.requests.delete(url);
        } else if (req.state === 'loading') {
          req.aborted = true;
          if (req.abort) {
            req.abort();
            req.abort = undefined;
          }
          req.resolveCallbacks.forEach(cb => cb(null));
          if (this.requests.get(url) === req) this.requests.delete(url);
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
    
    // Prune obsolete low-priority requests to prevent queue starvation
    const PRUNE_THRESHOLD = 40;
    if (this.queue.length > PRUNE_THRESHOLD) {
      const keepQueue: string[] = [];
      const dropQueue: string[] = [];
      
      for (let i = 0; i < this.queue.length; i++) {
        const url = this.queue[i];
        if (i < PRUNE_THRESHOLD) {
          keepQueue.push(url);
        } else {
          const req = this.requests.get(url);
          if (req && req.refCount === 0 && req.priority === 'low') {
            dropQueue.push(url);
          } else {
            keepQueue.push(url);
          }
        }
      }
      
      this.queue = keepQueue;
      for (const url of dropQueue) {
        const req = this.requests.get(url);
        if (req) {
          req.resolveCallbacks.forEach(cb => cb(null));
          if (this.requests.get(url) === req) this.requests.delete(url);
        }
      }
    }
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
    let isAborted = false;
        
    try {
      if (req.url.startsWith('artwork://')) {
        // e.g. artwork://movie/1234/poster
        const parts = req.url.split('/');
        const mediaType = parts[2] as 'movie' | 'series';
        const mediaId = parts[3];
        const artType = parts[4] as ArtworkType;
                
        const artworkSet = await this.artworkAgg.getArtwork(mediaId, mediaType);
        if (req.aborted) throw new Error('Aborted');
        if (artworkSet) {
           const fallbacks = this.getFallbackChain(artworkSet, artType);
           for (const img of fallbacks) {
              try {
                 const variantUrl = this.selectVariant(img.url, artType, req.priority);
                 finalBlobUrl = await this.downloadImageAsBlob(variantUrl, req);
                 if (finalBlobUrl) break; // Found a working image!
              } catch (e: any) {
                 if (e.message === 'Aborted') {
                    isAborted = true;
                    break;
                 }
                 this.logger.debug(`ImageManager: Failed to load fallback ${img.url}, trying next.`);
              }
           }
        }
      } else if (req.url.startsWith('http')) {
        // Standard URL handling
        finalBlobUrl = await this.downloadImageAsBlob(req.url, req);
      }
    } catch (e: any) {
      if (e.message === 'Aborted') {
         isAborted = true;
      } else {
         const cleanUrl = req.url.replace(/([?&](?:api_key|apikey|token|auth_token)=)[^&]+/gi, '$1***');
         this.logger.debug(`ImageManager: Failed to load ${cleanUrl}`, e);
      }
    }
    this.currentLoads--;
        
    if (isAborted) {
      this.processQueue();
      return;
    }

    if (finalBlobUrl) {
      req.state = 'cached';
      req.blobUrl = finalBlobUrl;
      this.diagnostics.completedLoads++;
      this.diagnostics.totalLoadTimeMs += (Date.now() - startTime);
      req.resolveCallbacks.forEach(cb => cb(finalBlobUrl));
    } else {
      this.diagnostics.failedLoads++;
      const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      req.resolveCallbacks.forEach(cb => cb(placeholder));
      if (this.requests.get(req.url) === req) {
        this.requests.delete(req.url); // Allow retry later
      }
    }
    req.resolveCallbacks = [];
    this.processQueue();
  }

  private async downloadImageAsBlob(url: string, req: ArtworkRequest): Promise<string> {
    if (req.aborted) return Promise.reject(new Error('Aborted'));
    // Use an Image object to preload it, bypassing CORS restrictions for fetch
    return new Promise((resolve, reject) => {
      const img = new Image();
      let isSettled = false;
      
      req.abort = () => {
        if (isSettled) return;
        isSettled = true;
        img.onload = null;
        img.onerror = null;
        img.src = '';
        reject(new Error('Aborted'));
      };
      
      img.onload = () => {
        if (isSettled) return;
        isSettled = true;
        req.abort = undefined;
        resolve(url);
      };
      
      img.onerror = () => {
        if (isSettled) return;
        isSettled = true;
        req.abort = undefined;
        reject(new Error('Failed to load image via Image object'));
      };
      
      img.src = url;
    });
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
        if (toEvict.blobUrl && toEvict.blobUrl.startsWith("blob:")) URL.revokeObjectURL(toEvict.blobUrl);
        toEvict.blobUrl = undefined;
        if (this.requests.get(toEvict.url) === toEvict) this.requests.delete(toEvict.url);
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
