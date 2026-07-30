# StreamIndian Roadmap & Feature Analysis

This master matrix analyzes core capabilities across audited repositories to define the architectural roadmap for StreamIndian on Samsung Tizen.

| Feature | PlayTorrio | Kodi | Jellyfin | Debrify | Dispatcharr | Stremio | Recommended (StreamIndian) | Priority | Complexity | Reuse Possible | Rewrite Required | Benefits | Future Roadmap |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Unified Provider Orchestration (Fan-out Search)** | Partial (Sequential) | N/A | N/A | Partial | Yes (Highly Parallel) | Partial | **Dispatcharr Fan-out Pattern** | HIGH | Medium | Partial (Existing Gateway) | Partial (Need parallel orchestration) | Extremely fast global search results. | Q1: Core search engine |
| **Dynamic Extension Store (Manifest API)** | No | Yes (Python) | Yes (C#) | No | No | Yes (Remote HTTP) | **Stremio HTTP Manifest Protocol** | HIGH | High | Yes (AddonClient exists) | Yes (Need sandboxing & UI) | Zero-downtime updates, infinite community scaling. | Q2: Extension marketplace |
| **TV-First Playback Engine (AVPlay)** | Yes | No | No | No | N/A | No | **PlayTorrio AVPlay + Strict State Machine** | CRITICAL | High | Yes (PlayTorrio base) | Partial (Need robust error recovery) | Native hardware decoding, seamless playback. | Q1: Essential pipeline |
| **Debrid Resolution Pipeline** | Yes | No | No | Yes (Robust) | No | Yes | **Debrify's Background Resolution** | HIGH | Medium | Partial | Yes (Extract from UI) | Buffer-free premium streams without exposing tokens. | Q1: Core feature |
| **IPTV: Xtream Codes Integration** | No | Yes | No | No | N/A | No | **Native Xtream API** | HIGH | Low | No | Yes (New Implementation) | 100x faster than M3U parsing, paginated live TV. | Q2: Live TV Module |
| **IPTV: M3U & XMLTV Parsing** | Yes (Main thread) | Yes (C++) | Yes | No | N/A | Partial | **Web Worker Parsing** | MEDIUM | Medium | No | Yes (Move off main thread) | Prevents UI lockups on Tizen TVs with massive lists. | Q2: Live TV Module |
| **Unified Metadata Aggregator** | Partial | Yes | Yes (Server) | Partial | No | Yes (Cinemeta) | **Jellyfin Aggregator pattern (TMDB + Fanart)** | HIGH | Medium | Partial (IdMapper) | Yes (Add Fanart & caching) | Netflix-level premium UI (clearlogos, textless backdrops). | Q1: Visual identity |
| **Circuit Breaker & Health Monitoring** | No | No | No | No | Partial | No | **Custom Circuit Breaker** | HIGH | Low | Partial | Yes (Enhance Gateway) | Auto-bans dead providers, prevents cascading timeouts. | Q1: Stability |
| **UI Virtualization & Flat Focus Map** | Yes | Yes | Partial | Yes | N/A | Partial | **PlayTorrio's Flat Focus / Virtual Lists** | CRITICAL | High | Yes | No (Refine existing) | Zero DOM bloat, instant D-pad navigation. | Q1: Core UI |
| **Device Capability Profiling (Codec check)** | No | Yes | Yes | No | N/A | No | **Jellyfin's Capability Negotiation** | HIGH | Medium | No | Yes (New layer before AVPlay) | Prevents TV crashes from unsupported Dolby Vision/AV1. | Q1: Playback Stability |
| **Local DB Caching (IndexedDB)** | Yes | Yes (SQLite) | No | Yes (Hive) | No | Partial | **Stale-while-revalidate IndexedDB** | HIGH | Medium | Yes | Partial (Expand schema) | Instant load times, offline-first feel. | Q1: Performance |
| **Subtitles & Audio Track Selection** | Partial | Yes (Perfect) | Yes | Yes | N/A | Yes | **Kodi's Track Management + Stremio Subtitles** | MEDIUM | Medium | Partial | Yes (Deep AVPlay integration) | Accessibility, global language support. | Q2: Player features |
| **Continue Watching & Watch History** | Yes | Yes | Yes | Yes | N/A | Yes | **Stremio Trakt Sync + Local DB** | HIGH | Low | Yes | Partial (Add Trakt sync) | Seamless cross-session resumption. | Q1: Core feature |
| **Web Worker Offloading (Memory Mgmt)** | No | N/A | N/A | N/A | N/A | No | **Strict Tizen Memory Offloading** | HIGH | High | No | Yes (Architectural shift) | Prevents Out-Of-Memory (OOM) silent app kills. | Q2: Tizen Optimizations |
| **Recommendations & Smart Lists** | No | Yes | Yes | No | N/A | Yes (Addons) | **Trakt & MDBList Integration** | LOW | Low | No | Yes | High engagement, dynamic content discovery. | Q3: Discovery features |

## Strategic Summary for StreamIndian

1. **Q1 Focus (The Core Engine):** Prioritize the **Dispatcharr Fan-out Search**, **PlayTorrio AVPlay Engine**, **Debrify Background Resolution**, and **Device Capability Profiling**. This guarantees the app can reliably find and play VOD content on Tizen without crashing.
2. **Q2 Focus (Extensions & Live TV):** Implement the **Stremio Manifest Protocol** for dynamic extensions, alongside the **Web Worker-backed IPTV Engine** (Xtream + M3U). This expands content exponentially without bloating the core app.
3. **Q3 Focus (Discovery & Polish):** Add **Trakt Sync**, **MDBList Smart Lists**, and advanced **Subtitle/Audio Track** features to match commercial OTTs like Netflix.

*Note: All UI/UX implementations must strictly adhere to the Performance Optimization Guide (Virtualization, Flat Focus Maps, and aggressive Garbage Collection avoidance) due to Tizen constraints.*
