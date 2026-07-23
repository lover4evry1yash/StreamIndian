# StreamIndian Rendering Engine

This directory contains the central orchestrators for UI rendering and artwork fetching in the StreamIndian app. The rendering engine is heavily optimized for low-end Samsung Smart TVs (Tizen).

## Architecture

The rendering pipeline flows downward:

1. **UI Screens** (`App.tsx`, `UniversalMediaDetailView.tsx`)
2. **VirtualCarousel**: Renders only the items in the immediate vicinity of the user's `focusedIndex`.
3. **LazyImage**: Component that intercepts `<img src>` calls, routing them through the ArtworkManager and displaying a placeholder.
4. **ArtworkManager**: Central service to manage artwork prioritization, load queues, deduplication, and lifecycle tracking.
5. **ImageCache**: Interfaces with IndexedDB/Storage for durable caching.
6. **PrefetchManager**: Automatically instructs ArtworkManager and MetadataManager to preload assets adjacent to the current focus point.

## Focus-Driven Virtualization

`VirtualCarousel` tracks `focusedIndex` (intercepted via native `onFocusCapture`). The active DOM window guarantees:
- The currently focused item is mounted.
- At least `overscan` (e.g. 2) items in either direction are mounted.
- When FocusEngine shifts focus, the native `scrollIntoView` correctly scrolls the row. This makes it a seamless spatial interaction.

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
