# StreamIndian Architecture Bible

This document contains a complete architectural audit of leading open-source media projects. It distills structural paradigms, scalable patterns, and design anti-patterns to guide the development of the StreamIndian Samsung Tizen TV application.

---

## 1. PlayTorrioV2

### 1. Folder Structure
- `src/core/` - Business logic, state managers, services.
- `src/ui/` - View layer, React components, TV-specific navigation.
- `src/providers/` - Extractor logic, Debrid integrations, metadata fetchers.
- `src/player/` - Video playback wrappers (AVPlay/HTML5).

### 2. Core Architecture
A modular, front-end heavy layered architecture relying on a unified event bus for cross-layer communication.

### 3. Layer Diagram
```text
[ UI Layer (React) ]
        ↓
[ Core Application Managers ]
        ↓
[ Provider Abstraction Layer ]
        ↓
[ Infrastructure (Storage, Networking, Player) ]
```

### 4. Dependency Graph
- UI strictly depends on Core Managers.
- Managers depend on Provider Interfaces.
- Providers depend on Networking/Storage Utilities.
- Strict unidirectional downward flow.

### 5. Provider Architecture
Providers are modular classes implementing a common `IProvider` interface, allowing hot-swapping of metadata (TMDB/Trakt) and stream sources (Debrid/Torrents).

### 6. Playback Architecture
An abstracted `PlayerManager` that delegates to environment-specific engines (AVPlay on Tizen, HTML5 video in browser).

### 7. IPTV Architecture
Basic M3U parser converting playlist entries into normalized stream objects, though tightly coupled to the UI list virtualization.

### 8. Metadata Architecture
Centralized `MetadataService` that aggregates TMDB and Trakt, heavily caching results to minimize network latency on smart TVs.

### 9. Settings Architecture
Persistent Key-Value store synchronized across sessions, injected into providers during initialization.

### 10. Storage Architecture
Uses IndexedDB/LocalStorage via an abstracted `StorageManager`, allowing for durable local persistence of watch history and bookmarks.

### 11. Navigation Architecture
Spatial navigation logic (D-Pad) managed globally via a `FocusManager`, retaining spatial memory when traversing views.

### 12. Extension/Plugin Architecture
Hardcoded internal plugins; lacks a dynamic runtime extension system.

### 13. Authentication
Debrid OAuth and API key flows handled via deep linking or QR codes for TV convenience.

### 14. Caching
Aggressive LRU memory caching combined with persistent disk caching for metadata and stream catalogs.

### 15. Networking
Standard `fetch` wrappers with exponential backoff and request deduplication.

### 16. Performance Optimizations
- Virtualized lists for heavy catalogs.
- Debounced D-Pad inputs.
- Image lazy loading with progressive placeholders.

### 17. Features Worth Adopting
- Unified `IProvider` abstraction.
- Strict layered dependency graph.
- TV-first FocusManager.
- Abstracted PlayerManager for AVPlay.

### 18. Features to Avoid
- Hardcoded provider classes (must use dynamic registry).
- Tight coupling of IPTV parsing to UI.

### 19. Features Unique to That Project
- Deep focus on hybrid playback (Browser + Tizen TV).

### 20. Mapping to StreamIndian
- **Adopt:** The strict UI -> Core -> Provider layering.
- **Adopt:** The Tizen-first PlayerManager design.
- **Refine:** Convert hardcoded providers into a configuration-driven registry (like the newly implemented Gateway).

---

## 2. Debrify

### 1. Folder Structure
- `app/` - UI components (often Flutter/Dart based).
- `services/` - Debrid APIs, Torrents APIs.
- `models/` - Data schemas.

### 2. Core Architecture
Service-oriented architecture heavily leaning on reactive state management (e.g., BLoC or Riverpod).

### 3. Layer Diagram
```text
[ Presentation Layer ]
        ↓
[ State Management (Reactive Streams) ]
        ↓
[ Repository Layer (Debrid, Search) ]
        ↓
[ External APIs ]
```

### 4. Dependency Graph
UI reacts to State streams. Repositories feed State. Repositories orchestrate multiple external API clients.

### 5. Provider Architecture
Heavily focused on Debrid services (Real-Debrid, AllDebrid, Premiumize) with unified unified extraction layers.

### 6. Playback Architecture
Relies on native mobile/TV video players (ExoPlayer/VLC), directly feeding unresolved Debrid links to a background resolver.

### 7. IPTV Architecture
Non-existent or minimal.

### 8. Metadata Architecture
Basic metadata, often relying on the scraper's source (e.g., Torrentio) rather than a dedicated TMDB metadata layer.

### 9. Settings Architecture
Global singleton configuration for Debrid tokens.

### 10. Storage Architecture
Local SQLite or Hive for fast structured queries of history and favorites.

### 11. Navigation Architecture
Standard mobile/Android TV focus chains, less optimized for low-end Tizen environments.

### 12. Extension/Plugin Architecture
None. Monolithic compiled application.

### 13. Authentication
OAuth device flow implementation tailored for Debrid services.

### 14. Caching
Memory caching of resolved links to prevent Debrid API rate limits.

### 15. Networking
Robust interceptors for handling Debrid token expiration and auto-refresh.

### 16. Performance Optimizations
- Reactive UI ensures only changed widgets rebuild.
- Background link resolution.

### 17. Features Worth Adopting
- Robust Debrid token lifecycle management (auto-refresh, rate-limit handling).
- Background link resolution to keep UI responsive.

### 18. Features to Avoid
- Tying UI directly to Debrid models.
- Heavy reliance on mobile-first reactive frameworks which overhead Tizen's web engine.

### 19. Features Unique to That Project
- Deep integration with multi-Debrid account balancing.

### 20. Mapping to StreamIndian
- **Adopt:** The abstract `DebridManager` handling token lifecycles and transparent link resolution independent of the UI.
- **Avoid:** The UI architecture, which is too heavy for HTML5 Tizen.

---

## 3. Kodi (XBMC)

### 1. Folder Structure
- `xbmc/` - Core C++ application.
- `addons/` - Python/XML plugins.
- `userdata/` - Local databases and configurations.

### 2. Core Architecture
Monolithic core with a massive embedded Python runtime for extensions, built entirely on a custom rendering engine.

### 3. Layer Diagram
```text
[ Custom GUI Engine (DirectX/OpenGL) ]
        ↓
[ Kodi Core Application Engine ]
    ↙       ↓       ↘
[ VFS ] [ Player ] [ Addon Subsystem ]
```

### 4. Dependency Graph
Everything depends on the Core Engine. Addons interface via SWIG/Python bindings.

### 5. Provider Architecture
Completely dynamic. Providers are ZIP files containing Python scripts that yield generic list items to the Kodi core.

### 6. Playback Architecture
Custom DVDPlayer/VideoPlayer with native hardware decoding. Unmatched codec support.

### 7. IPTV Architecture
PVR subsystem. Extremely robust, supporting EPG XMLTV, timeshifting, and recording.

### 8. Metadata Architecture
Scrapers (Regex/Python based) that parse file names or APIs and populate a central SQLite SQL database.

### 9. Settings Architecture
Hierarchical XML settings with GUI auto-generation based on XML definitions.

### 10. Storage Architecture
Relational SQLite (or MySQL for shared libraries) handling tens of thousands of media entities.

### 11. Navigation Architecture
Abstracted windowing system. Skins define layout; core handles focus movement geometrically.

### 12. Extension/Plugin Architecture
Industry-leading Python Addon API. Addons run in isolated processes/threads.

### 13. Authentication
Handled entirely by individual addons.

### 14. Caching
VFS (Virtual File System) level caching, texture caching for artwork.

### 15. Networking
Internal CURL wrappers natively handling SMB, NFS, FTP, WebDAV.

### 16. Performance Optimizations
- Native C++ execution.
- Hardware-accelerated GUI.
- Aggressive texture caching.

### 17. Features Worth Adopting
- Pure generic Addon architecture (providers as pure configs/scripts).
- Virtual File System approach to streams.
- Robust IPTV/EPG data modeling.

### 18. Features to Avoid
- Python runtime embedding (impossible on Tizen Web).
- Heavy local SQLite database (too slow for Tizen Web API).

### 19. Features Unique to That Project
- Skinnable GUI engine where logic and presentation are 100% decoupled via XML.

### 20. Mapping to StreamIndian
- **Adopt:** The strict separation of Addon Logic from Core Logic. StreamIndian's `IProviderClient` is the TypeScript equivalent of Kodi's Python addon interface.
- **Adopt:** IPTV EPG models.

---

## 4. Jellyfin

### 1. Folder Structure
- `Jellyfin.Server/` - C# .NET Core backend.
- `jellyfin-web/` - Web UI client.

### 2. Core Architecture
Client-Server architecture. The server acts as a heavy media indexer and transcoder; clients are thin presentation layers.

### 3. Layer Diagram
```text
[ Web Client / Smart TV Client ]
        ↓ (REST / WebSockets)
[ Jellyfin Server API ]
        ↓
[ Media Indexer & Transcoder (FFmpeg) ]
        ↓
[ Local File System ]
```

### 4. Dependency Graph
Clients depend strictly on standard REST contracts. The server depends on SQLite, FFmpeg, and the host OS file system.

### 5. Provider Architecture
Metadata plugins (TMDB, TVDB) inject metadata into the server's database during library scans.

### 6. Playback Architecture
Server-side transcoding if the client capabilities don't match the media. Clients use HTML5/ExoPlayer and report capabilities upstream.

### 7. IPTV Architecture
Live TV plugins via M3U tuners, with the server managing EPG scraping and active stream multiplexing.

### 8. Metadata Architecture
Centralized server database. Clients only read normalized JSON entities.

### 9. Settings Architecture
Server-side configuration files + User-specific permission models.

### 10. Storage Architecture
SQLite for the primary library database.

### 11. Navigation Architecture
Standard web-based focus management (often utilizing spatial navigation polyfills on TVs).

### 12. Extension/Plugin Architecture
C# DLL plugins loaded dynamically by the server.

### 13. Authentication
Robust multi-user ACL (Access Control Lists), LDAP, and JWT-based API auth.

### 14. Caching
Server-side image resizing and caching. Client-side HTTP caching.

### 15. Networking
REST APIs supplemented by WebSockets for real-time playback synchronization and events.

### 16. Performance Optimizations
- Server-side heavy lifting (transcoding, metadata scraping).
- Client-side pagination and lazy loading.

### 17. Features Worth Adopting
- Client capability reporting (Tizen telling the backend what codecs it supports to filter sources).
- WebSocket-based real-time event bus.

### 18. Features to Avoid
- Relying on server-side transcoding (StreamIndian is client-heavy/serverless in terms of media processing).
- Massive local database indexing.

### 19. Features Unique to That Project
- On-the-fly media transcoding via FFmpeg.

### 20. Mapping to StreamIndian
- **Adopt:** Device capability profiling. StreamIndian must know exactly what codecs AVPlay supports to filter out incompatible streams (e.g., filtering out Dolby Vision if the TV doesn't support it).

---

## 5. Dispatcharr

### 1. Folder Structure
- `cmd/` - Go entrypoints.
- `internal/` - Core business logic.
- `pkg/` - Reusable Go packages.

### 2. Core Architecture
A lightweight, backend-focused aggregator and dispatcher written in Go, acting as a middleware between media indexers and clients.

### 3. Layer Diagram
```text
[ Client Application ]
        ↓
[ Dispatcharr API Gateway ]
    ↙       ↓       ↘
[ Sonarr ] [ Radarr ] [ Prowlarr ]
```

### 4. Dependency Graph
Stateless gateway that routes and normalizes requests to underlying Arr stack services.

### 5. Provider Architecture
Connectors to specific external APIs (Sonarr/Radarr) abstracting their proprietary contracts into a unified media model.

### 6. Playback Architecture
N/A (It is an orchestrator, not a player).

### 7. IPTV Architecture
N/A.

### 8. Metadata Architecture
Pass-through metadata from TMDB/TVDB via the Arr stack.

### 9. Settings Architecture
Environment variables and YAML configurations.

### 10. Storage Architecture
Stateless or minimal Redis caching.

### 11. Navigation Architecture
N/A.

### 12. Extension/Plugin Architecture
Hardcoded integrations.

### 13. Authentication
Basic API key authentication for incoming requests.

### 14. Caching
In-memory caching of search results to reduce load on indexers.

### 15. Networking
High-concurrency Go routines for parallel outbound requests.

### 16. Performance Optimizations
- Goroutines for highly parallelized searching.
- Strict timeout contexts.

### 17. Features Worth Adopting
- Parallelized fan-out search architecture.
- Context-based timeouts for unresponsive providers.

### 18. Features to Avoid
- Statelessness (A TV app needs local state).

### 19. Features Unique to That Project
- Acts as a pure proxy/aggregator.

### 20. Mapping to StreamIndian
- **Adopt:** The fan-out search pattern. StreamIndian's `GatewayManager` must dispatch searches concurrently using `Promise.allSettled` and apply strict timeouts, matching this backend paradigm in a frontend environment.

---

## 6. Stremio Shell

### 1. Folder Structure
- `src/` - Qt/C++ or WebEngine wrappers.
- `server/` - Node.js local proxy (historically).

### 2. Core Architecture
A thin desktop shell (Qt WebEngine) encapsulating a web application, often running a local proxy server to bypass CORS and handle torrent streaming.

### 3. Layer Diagram
```text
[ Stremio Web UI ]
        ↓
[ Local HTTP Proxy / Engine (stremio-streaming-server) ]
        ↓
[ Addons (HTTP endpoints) ]
```

### 4. Dependency Graph
UI depends entirely on standard Web APIs. The streaming server handles all complex P2P/torrent logic and serves a unified HTTP stream to the UI.

### 5. Provider Architecture
The definitive "Manifest" architecture. Addons are remote HTTP servers returning JSON manifests defining their capabilities (`catalog`, `meta`, `stream`).

### 6. Playback Architecture
HTML5 video element wrapped around a local HTTP proxy that translates torrents/P2P into sequential HTTP byte streams.

### 7. IPTV Architecture
Supported via addons returning live stream URLs, handled identically to VOD.

### 8. Metadata Architecture
Cinemeta (default remote addon) provides baseline TMDB/IMDB metadata, standardizing all requests via IMDB IDs.

### 9. Settings Architecture
Cloud-synced user accounts storing installed addon configurations.

### 10. Storage Architecture
IndexedDB for local library caching; LocalStorage for UI state.

### 11. Navigation Architecture
Responsive web design (CSS Grid/Flexbox) with basic spatial navigation for TV mode.

### 12. Extension/Plugin Architecture
Remote HTTP addons. Unmatched security and sandboxing since addons are completely external web services.

### 13. Authentication
Centralized Stremio account + Addon-specific URL config parameters (e.g., `https://addon.com/API_KEY/manifest.json`).

### 14. Caching
Service Workers and heavily cached HTTP responses for addon metadata.

### 15. Networking
CORS-bypassing proxy for local clients; pure fetch for web clients.

### 16. Performance Optimizations
- Remote compute (addons do the heavy scraping).
- Streaming server handles torrent piece prioritization efficiently.

### 17. Features Worth Adopting
- Remote HTTP Addon Protocol (The Stremio Manifest).
- URL-encoded addon configuration.
- Total decoupling of provider execution from client execution.

### 18. Features to Avoid
- Local Node.js proxy (cannot run on Samsung Tizen natively).
- Reliance on IMDB IDs (TMDB is more robust for modern TV).

### 19. Features Unique to That Project
- The Addon SDK. Providers are just generic JSON endpoints.

### 20. Mapping to StreamIndian
- **Adopt:** The Stremio Addon Protocol as the primary contract for `IProviderClient`.
- **Adopt:** Moving all heavy scraping to external serverless functions or community addons, making the Tizen app a pure, lightweight aggregator.

---

## Conclusion & Architectural Mandate for StreamIndian

Based on this audit, **StreamIndian** will adopt a hybrid architectural model tailored specifically for Samsung Tizen's constrained hardware:

1. **The Kodi/Stremio Provider Abstraction:** StreamIndian will treat all sources as generic `IProviderClient` entities. The app will never know if a source is a torrent, an IPTV channel, or a direct link until the final resolution step.
2. **The Dispatcharr Fan-Out:** `GatewayManager` will act as a high-concurrency orchestrator, firing parallel searches to all registered providers with strict abort timeouts to guarantee a fast TV UI.
3. **The PlayTorrioV2 Layering:** Strict downward dependency (UI -> Managers -> Providers -> AVPlay/Network).
4. **The Jellyfin Capability Model:** The TV app will profile its own hardware (AVPlay capabilities) and aggressively filter out unsupported codecs (e.g., AV1 on older models) before passing streams to the player, preventing playback crashes.

This synthesis guarantees a maintainable, extensible, and high-performance commercial-grade TV application.
