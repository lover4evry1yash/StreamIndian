# StreamIndian Rendering Engine

This directory contains the central orchestrators for UI rendering and artwork fetching in the StreamIndian app. The rendering engine is heavily optimized for low-end Samsung Smart TVs (Tizen).

## Architecture

The rendering pipeline flows downward:

1. **UI Screens** (`App.tsx`, `UniversalMediaDetailView.tsx`)
2. **MediaRow/TVRow**: Renders horizontal lists of content. Poster virtualization is NOT implemented; instead, `ImageManager` uses dynamic queue prioritization to manage the load.
3. **LazyImage**: Component that intercepts `<img src>` calls, routing them through the ArtworkManager and displaying a placeholder.
4. **ArtworkManager**: Central service to manage artwork prioritization, load queues, deduplication, and lifecycle tracking.
5. **ImageCache**: Interfaces with IndexedDB/Storage for durable caching.
6. **PrefetchManager**: Automatically instructs ArtworkManager and MetadataManager to preload assets adjacent to the current focus point.

## Dynamic Queue Prioritization

Since poster virtualization is NOT implemented in standard rows, rapid D-pad scrolling could normally result in queue starvation. The engine mitigates this via:
- Dynamic focus priority promotion (focused items are immediately promoted to high priority).
- A hard queue-pruning threshold (dropping low-priority speculative requests that fall too far behind the queue head).

## Image Lifecycle Flow

Images progress through these states:
- `requested`: Initial call to `preloadImage`.
- `queued`: Enqueued for download, subject to `ArtworkManager` concurrent locks.
- `loading`: Currently downloading via `new Image()`.
- `cached`: Download completed, in RAM.
- `displayed`: Currently mounted inside a `<LazyImage>`.
- `released`: All `<LazyImage>` usages unmounted. Ready for GC if memory pressure requires.

## Memory Management Strategy

Because Samsung Tizen has strict memory constraints:
- `ArtworkManager` tracks `refCount` for each URL.
- When `refCount` drops to 0, state shifts to `released`.
- When `MAX_CACHED_IMAGES` is exceeded, the manager triggers `scheduleCleanup()`, which evicts `released` images sorted by LRU (`lastAccessed`).

## Prefetch Strategy

`PrefetchManager` listens to `FOCUS_CHANGED`.
It asks `NavigationManager.focusEngine.getNeighbors(focusedId)` for spatial neighbors (`left`, `right`, `up`, `down`) and enqueues high-priority prefetch requests. 
This guarantees the user experiences zero buffering during immediate D-Pad navigation.

## Bundle Splitting

Core chunks are split in `vite.config.ts`:
- `core`: Navigation and Services
- `rendering`: These systems
- `providers`: Data
- `details`/`player`/`search`: UI lazy chunks.
