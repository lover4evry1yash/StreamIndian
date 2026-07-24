# Prerequisite Architecture Update

## 1. What capability was missing
The core dependency injection and provider execution layer lacked support for broad catalogue queries. Specifically:
- `ProviderCapabilities` did not declare features for `supportsPersonalization` and `supportsCollections`.
- `MetadataAggregator` had no explicit `getPopular` method and awkwardly bundled `getTrending` under `supportsRecommendations`.
- `MetadataManager` (the primary API for UI services) completely omitted `getTrending`, `getPopular`, and `getTopRated` facades.
- `TMDBProvider` did not implement `IPersonalizationProvider` or `ICollectionProvider`, nor did it expose discovery endpoints through the formal provider registry pipeline.

## 2. Files changed
- `src/core/providers/types.ts`
- `src/core/metadata/MetadataAggregator.ts`
- `src/core/metadata/MetadataManager.ts`
- `src/core/providers/tmdb/TMDBProvider.ts`
- `src/core/providers/tmdb/TMDBMapper.ts`

## 3. New interface methods added
- **types.ts**: Added `supportsPersonalization` and `supportsCollections` flags to `ProviderCapabilities`.
- **MetadataAggregator**: Added `getPopular(type)` and re-routed `getTrending` / `getTopRated` to correctly query their matching provider capabilities (`supportsPersonalization` and `supportsCollections`).
- **MetadataManager**: Added `getTrending(type)`, `getPopular(type)`, and `getTopRated(type)` proxy methods that expose the aggregator's capabilities to higher-level services.
- **TMDBProvider**: Implemented `IPersonalizationProvider` and `ICollectionProvider`, exposing `getTrending(type)`, `getPopular(type)`, `getTopRated(type)`, and `getCollection(id)` methods that use the internal HTTP client cleanly.
- **TMDBMapper**: Added `mapMediaReference(data, type)` to map TMDB raw collection results cleanly to internal domain `MediaReference` objects.

## 4. Why they are needed
These changes complete the provider layer's capabilities so that a future `HomeCatalogService` can cleanly request standard home-screen rows (trending, popular, top-rated) from `MetadataManager`. This prevents any future service from having to instantiate or import `TMDBClient` directly, maintaining strict boundary separations and enabling failover to alternative catalog providers transparently.

## 5. Build status
Build passes successfully (`vite build` completes successfully).

## 6. Typecheck status
Typecheck passes successfully (`tsc --noEmit` completes with no errors).
