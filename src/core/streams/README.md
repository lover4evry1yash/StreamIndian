# Stream Resolution Framework

This framework provides an abstraction layer between metadata/catalog components and the Samsung Tizen AVPlay engine. 
It enables the application to integrate any streaming resolver (e.g., TorBox, Real-Debrid, Direct HTTP Extractors) without breaking the core architecture.

## Architecture

```
Metadata
   │
   ▼
StreamManager
   │ (Selects/Ranks/Caches)
   ▼
ResolverManager
   │ (Tracks Priority/Health/Registration)
   ▼
Resolver (e.g. TorBox, RealDebrid)
   │
   ▼
Resolved Stream (StreamResolution Canonical Model)
   │
   ▼
PlaybackManager
   │
   ▼
TVPlayer (Samsung AVPlay)
```

## Stream Lifecycle
1. **Metadata Requests Streams**: Playback engine invokes `StreamManager.getResolvedStreams(torrents, urls)`.
2. **Cache Check**: `CacheManager` checks `STREAM_RESOLUTIONS` policy for recent valid streams.
3. **Resolving**: `ResolverManager` selects resolvers based on health, priority, and format matching.
4. **Ranking**: Results are sorted via a unified scoring engine (Quality, HDR, Audio, Priority, Seeders).
5. **Caching**: Successful resolutions are cached to avoid redundant network overhead.
6. **Delivery**: The canonical `StreamSource` is returned for `TVPlayer`.

## Extension Guide (Adding new Resolvers)
To add a new resolver:
1. Implement the `IStreamResolver` interface.
2. Ensure you return canonical `StreamResolution` arrays (never provider-specific structures).
3. Return accurate `healthCheck()` reports.
4. Register your resolver in `Bootstrap.ts` under `Initialize Stream Resolvers`.

## Constraints & Tizen Rules
- **No DOM Access**: Resolvers run in the background thread context, without access to DOM elements.
- **Asynchronous Only**: Samsung Tizen network calls are strictly asynchronous.
- **Garbage Collection**: Objects mapping to AVPlay must cleanly dereference to avoid memory leaks on TV SOCs.

## Resolution Architecture update
* `StreamManager` was refactored into `ResolutionManager`.
* Discovery logic shifted to `SourceManager` (`ISourceProvider` plugin architecture).
