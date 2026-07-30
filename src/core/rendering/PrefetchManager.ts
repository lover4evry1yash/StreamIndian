import { MetadataManager } from '../metadata';
import { ImageManager } from './ImageManager';
import { Logger } from '../Logger';
import { EventBus } from '../EventBus';
import { container } from '../ServiceContainer';
import { NavigationManager } from '../navigation';

export class PrefetchManager {
  private metadataManager: MetadataManager;
  private artworkManager: ImageManager;
  private eventBus: EventBus;
  private logger: Logger;
  
  private prefetchQueue: string[] = [];
  private isProcessing = false;
  private activePrefetches: Set<string> = new Set();

  constructor(
    metadataManager: MetadataManager, 
    artworkManager: ImageManager,
    eventBus: EventBus,
    logger: Logger
  ) {
    this.metadataManager = metadataManager;
    this.artworkManager = artworkManager;
    this.eventBus = eventBus;
    this.logger = logger;

    this.eventBus.on('FOCUS_CHANGED', this.onFocusChanged.bind(this));
  }

  private async onFocusChanged(focusedId: string | null) {
    if (!focusedId) return;
    
    const extractMediaInfo = (nodeId: string): { type: 'movie'|'series'|'anime', id: string } | null => {
      // Expecting something like rowId-media-movie-1234 or media-movie-1234
      const match = nodeId.match(/media-(movie|series|anime)-(.*?)(?:-\d+)?$/);
      if (match) {
        return { type: match[1] as 'movie'|'series'|'anime', id: match[2] };
      }
      return null;
    };
    
    const current = extractMediaInfo(focusedId);
    if (current) {
      this.queuePrefetch(current.type, current.id, true);
    }
    
    // Spatial Prefetching: Previous, Next, Adjacent Row
    const navManager = container.resolve<NavigationManager>('NavigationManager');
    if (navManager && navManager.focusEngine) {
      const neighbors = navManager.focusEngine.getNeighbors(focusedId);
      
      const toPrefetch = [
        neighbors.right, // Next
        neighbors.left,  // Previous
        neighbors.down,  // Adjacent row below
        neighbors.up     // Adjacent row above
      ];
      
      // We can also get +2 Ahead by getting right of right, but that's expensive.
      
      toPrefetch.forEach(neighborId => {
         if (neighborId) {
            const info = extractMediaInfo(neighborId);
            if (info) this.queuePrefetch(info.type, info.id, false);
         }
      });
    }
  }

  public queuePrefetch(type: 'movie' | 'series' | 'anime', id: string, highPriority: boolean = false) {
    const key = `${type}:${id}`;
    if (!this.prefetchQueue.includes(key) && !this.activePrefetches.has(key)) {
      if (highPriority) {
        this.prefetchQueue.unshift(key); // Put at start of queue
      } else {
        this.prefetchQueue.push(key);
      }
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;
    this.isProcessing = true;

    while (this.prefetchQueue.length > 0) {
      const key = this.prefetchQueue.shift();
      if (!key) continue;
      
      const [type, id] = key.split(':');
      this.activePrefetches.add(key);
      try {
        if (type === 'movie' || type === 'series') {
           await this.metadataManager.prefetch(type, id);
           // After metadata is cached, we prefetch the poster image
           const virtualUrl = `artwork://${type}/${id}/poster`;
           await this.artworkManager.preloadImage(virtualUrl, 'low');
        }
      } catch (err) {
        this.logger.warn(`Failed to prefetch ${key}`, err);
      } finally {
        this.activePrefetches.delete(key);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    this.isProcessing = false;
  }
}
