import re

content = open('src/core/rendering/PrefetchManager.ts').read()

content = content.replace("import { EventBus } from '../EventBus';", "import { EventBus } from '../EventBus';\nimport { container } from '../ServiceContainer';\nimport { NavigationManager } from '../navigation';")

old_onfocus = """  private async onFocusChanged(focusedId: string | null) {
    if (!focusedId) return;
    
    // Check if focusedId corresponds to a media item
    if (focusedId.startsWith('media-')) {
      const parts = focusedId.split('-');
      if (parts.length >= 3) {
        const type = parts[1] as 'movie' | 'series' | 'anime';
        const id = parts.slice(2).join('-');
        
        this.queuePrefetch(type, id);
      }
    }
  }"""

new_onfocus = """  private async onFocusChanged(focusedId: string | null) {
    if (!focusedId) return;
    
    const extractMediaInfo = (nodeId: string): { type: 'movie'|'series'|'anime', id: string } | null => {
      // Expecting something like rowId-media-movie-1234 or media-movie-1234
      const match = nodeId.match(/media-(movie|series|anime)-(.*)$/);
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
  }"""

content = content.replace(old_onfocus, new_onfocus)

content = content.replace("public queuePrefetch(type: 'movie' | 'series' | 'anime', id: string) {", "public queuePrefetch(type: 'movie' | 'series' | 'anime', id: string, highPriority: boolean = false) {")

content = content.replace("""    if (!this.prefetchQueue.includes(key)) {
      this.prefetchQueue.push(key);
      this.processQueue();
    }""", """    if (!this.prefetchQueue.includes(key)) {
      if (highPriority) {
        this.prefetchQueue.unshift(key); // Put at start of queue
      } else {
        this.prefetchQueue.push(key);
      }
      this.processQueue();
    }""")

open('src/core/rendering/PrefetchManager.ts', 'w').write(content)
