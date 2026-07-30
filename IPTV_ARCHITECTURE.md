# Merged IPTV Architecture Reference

This document outlines a unified, commercial-grade IPTV architecture derived from studying PlayTorrio, Kodi (PVR Subsystem), Dispatcharr, and Debrify. It is designed to handle massive live TV ecosystems efficiently within the constrained Samsung Tizen TV environment.

---

## 1. Repository Analysis: IPTV Paradigms

*   **Kodi (XBMC):** The gold standard for IPTV architecture. Uses a dedicated PVR (Personal Video Recorder) subsystem backed by robust SQLite databases. Separates the concept of "Tuners/Clients" (IPTV Simple Client) from the "Core PVR" engine. Handles XMLTV, timeshifting, and recording flawlessly, but relies on heavy C++ local database operations.
*   **PlayTorrio:** Implements basic in-memory string-parsing for M3U playlists. Fast for small lists but suffers severe UI lag and memory bloat when parsing 100k+ channel playlists. Tightly coupled to UI rendering.
*   **Dispatcharr & Debrify:** Generally ignore IPTV, focusing on VOD, torrents, and Debrid indexing.

---

## 2. The Merged IPTV Architecture Model

To support advanced commercial features without crashing a Tizen TV, the IPTV subsystem must be highly decoupled, asynchronous, and backed by a local structured database (IndexedDB).

### Architectural Layer Diagram

```text
[ Core Application Manager ]
        ↓
[ IptvManager (Orchestrator) ]
    ↙       ↓       ↘
[ Parser Engine ] [ EpgManager ] [ UserDataManager ]
    ↓               ↓                ↓
(M3U/Xtream)     (XMLTV)      (IndexedDB Storage)
```

---

## 3. Subsystem Breakdown & Capability Mapping

### A. Ingestion & Parser Engine (M3U / M3U8 / Xtream)
*   **Xtream Codes API:** The preferred integration method. Instead of parsing massive text files, the architecture natively requests JSON (`get_live_categories`, `get_live_streams`). It is paginated, structured, and incredibly fast for TVs.
*   **M3U / M3U8 Parser:** For raw `.m3u` files, parsing must be offloaded to a **Web Worker**. Using Regex on a 50MB text file on the main thread will lock up a Samsung TV for 10+ seconds.
*   **Channel Logos (`tvg-logo`):** Extracted during parsing and passed directly to the unified Image Cache system to prevent lazy-load popping.

### B. EPG (Electronic Program Guide) & XMLTV
*   **XMLTV Parser:** XMLTV files are massive. The `EpgManager` parses XML asynchronously and maps programs to channels using the `tvg-id` or channel name.
*   **Time-Sync Engine:** Calculates UTC offsets dynamically. EPG data is often timezone-agnostic or heavily skewed.
*   **Sparse Indexing:** EPG data is dropped into IndexedDB using a composite key `[channelId + startTime]` to allow instant range queries for the "Now Playing" and "Next" timelines without holding the whole EPG in memory.

### C. Playlist Lifecycle Management
*   **Playlist Refresh & Auto-Updates:** A background Cron/Timer service polls URLs. Instead of wiping the local database, it performs a **Diffing Algorithm** (inserting new, updating changed, marking dead streams).
*   **Import/Export & Backup:** Playlists and user metadata (favorites, hidden) are serialized to a compressed JSON schema to allow syncing across devices or backing up to local storage.

### D. User Data Management (Favorites, Hidden, Sorting, Groups)
*   **Channel Groups (Categories):** Channels are indexed by their group tag. The storage layer must support efficient `getByGroup(groupId)` queries.
*   **Favorites & Hidden Channels:** Managed via a separate `UserIptvState` table in IndexedDB. It stores a relation (e.g., `isFavorite: true`, `isHidden: true`) tied to the channel's unique hash (to persist across playlist updates).
*   **Channel Sorting:** Abstracted into a generic sort definition (e.g., By Number, By Name, Custom Drag-and-Drop). Custom sorting overrides are saved in the user state table.

### E. Advanced Playback Features (Catch-up, Recording, History)
*   **Catch-up TV (DVR Buffer):** The architecture parses `catchup-days` and `catchup-source` from the M3U or Xtream API. When a user clicks a past EPG event, the `PlaybackManager` formats a time-shifted URL (appending `?utc=...` or `/timeshift/` depending on the provider format) and passes it to AVPlay.
*   **Recording Support:** **Not recommended for pure web/Tizen architectures.** Web APIs lack robust persistent file-system access for writing massive multi-gigabyte TS video streams. If implemented, it must act purely as a remote trigger (telling a backend server like Tvheadend to record), rather than local Tizen disk recording.
*   **Recent / History:** Tied into the global `WatchHistoryManager` (same as VOD), tracking the last played channel and timestamp.

---

## 4. Recommended Implementation for StreamIndian

To build the best commercial IPTV experience on Samsung Tizen, StreamIndian should adopt the following specific architectural guidelines:

1.  **Web Worker Parsing (Mandatory):** 
    *   M3U and XMLTV parsing *must* happen in an isolated Web Worker. 
    *   Passing a 100,000-line M3U string through the main thread will instantly fail Samsung's certification due to UI freezing.
2.  **IndexedDB over Memory (Mandatory):**
    *   Never store the channel array in a Redux/Zustand global state. 
    *   Use an IndexedDB wrapper (like Dexie.js). Query only the channels needed for the current group/page via `limit()` and `offset()`.
3.  **Xtream API First Strategy:**
    *   Whenever a user enters an M3U URL, the `IptvManager` should regex-check if it's an Xtream Codes server (e.g., `http://domain:port/get.php?...`).
    *   If it is, StreamIndian should automatically upgrade the connection to the Xtream JSON API, bypassing the need for M3U text parsing entirely. This is 100x faster and requires 90% less RAM.
4.  **Unified Provider Abstraction:**
    *   Create an `IptvProviderClient` that implements the newly designed `IProviderClient` from the Gateway Architecture.
    *   This allows IPTV channels to seamlessly appear in global search results alongside VOD and Torrent streams without the Gateway knowing the difference.
5.  **Decoupled EPG Store:**
    *   EPG data changes constantly. Separate the `Channels` table from the `Programs (EPG)` table in IndexedDB.
    *   Use a reactive hook to fetch the current playing program for a channel dynamically, rather than statically attaching EPG objects to channel objects.

### Summary Data Flow (StreamIndian Tizen)
1. User adds Playlist (URL/File).
2. `IptvManager` dispatches to Web Worker.
3. Web Worker parses M3U -> Array of JSON.
4. Web Worker sends JSON chunks to main thread.
5. Main thread commits chunks to IndexedDB.
6. UI queries IndexedDB (e.g., `db.channels.where('group').equals('News')`).
7. User selects channel -> AVPlay URL generated (accounting for Catch-up if triggered via EPG).
