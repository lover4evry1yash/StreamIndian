# Legacy Catalog Pipeline Investigation

## 1. Current Catalog Flow
The current home screen catalog relies on a legacy architecture that is completely separate from the new core DI container.

```mermaid
graph TD
    App[src/App.tsx] --> |calls| getUnifiedCatalog
    Watchlist[src/components/WatchlistHistoryView.tsx] --> |calls| getUnifiedCatalog
    Audit[src/components/AuditPanel.tsx] --> |inspects| legacyProviderManager
    
    getUnifiedCatalog[src/providers/index.ts (ProviderManager)] --> |fetches from| IndianMediaProvider[IndianMediaProvider]
    IndianMediaProvider[src/providers/indianMediaCatalog.ts] --> |returns mock data| SAMPLE_INDIAN_MEDIA_CATALOG
    getUnifiedCatalog --> |deduplicates & sorts| App
```

## 2. Every File Involved
- **`src/App.tsx`**: Uses `providerManager.getUnifiedCatalog()` to populate home screen rows (Trending, Popular, Regional, etc.).
- **`src/providers/index.ts`**: The legacy orchestration file. It exports a singleton `providerManager` (unrelated to the new DI `ProviderManager`) and registers legacy `CatalogProvider`s.
- **`src/providers/indianMediaCatalog.ts`**: Contains the hardcoded `SAMPLE_INDIAN_MEDIA_CATALOG` array and the `IndianMediaProvider` class implementation.
- **`src/components/WatchlistHistoryView.tsx`**: Calls `getUnifiedCatalog()` to fake a watchlist history.
- **`src/components/AuditPanel.tsx`**: Imports the legacy `providerManager` to toggle mock provider states for debugging.

## 3. Which Component Should Eventually Replace IndianMediaProvider
`IndianMediaProvider` should be replaced by real implementations of the `ICollectionProvider` and `IPersonalizationProvider` interfaces defined in `src/core/providers/types.ts`. 
Specifically, the existing `TMDBProvider` should be extended to implement `getTrending()`, `getPopular()`, and `getTopRated()`, making real network calls to TMDB's discovery endpoints.

## 4. Smallest Migration Path
1. **Extend TMDBProvider**: Implement the `ICollectionProvider` interface on the `TMDBProvider` to fetch real trending/popular lists from TMDB.
2. **Expose Core Aggregator Methods**: Add methods to the new `MetadataManager` (e.g., `getTrending()`) that delegate to the core `ProviderManager` to fetch from TMDB.
3. **Refactor UI**: Update `App.tsx` and `WatchlistHistoryView.tsx` to pull data from the new `MetadataManager` and local database instead of the legacy `providerManager`.
4. **Remove Legacy Code**: Once `App.tsx` successfully renders TMDB data, delete `src/providers/index.ts` and `src/providers/indianMediaCatalog.ts`.

## 5. Which PR Should Actually Delete indianMediaCatalog.ts
The deletion should occur in a dedicated PR (e.g., **"Sprint 2: TMDB Home Catalog Integration & Legacy Provider Deprecation"**). It cannot be deleted during the current stabilization sprint because `App.tsx` lacks a fallback content source, which would result in an empty, broken home screen.
