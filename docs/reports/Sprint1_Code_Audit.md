# StreamIndian Code Audit - Sprint 1 (Type Safety & Stabilization)

## 1. Executive Summary
A comprehensive engineering code audit has been conducted on the StreamIndian codebase to identify technical debt, type safety issues, mock data leakage, and architectural duplications. The findings indicate that while the core architectural layering is solid, several provider implementations rely on hardcoded "Sintel" fallback streams and fake metadata (such as the "Kalki" mock catalog). Additionally, there are structural redundancies in the Stream Ecosystem DI registrations, unsafe `any` usages bypassing strict typing, and areas where AVPlay error handling and Tizen memory management must be optimized for smart TV environments.

## 2. Critical Issues (P0)

**A. Hardcoded Stream Resolvers & Sintel Fallbacks**
- **Files**: 
  - `src/core/streams/debrid/providers/TorBoxDebridProvider.ts` (and all other Debrid providers)
  - `src/core/streams/resolvers/TorBoxResolver.ts`
  - `src/core/streams/sources/providers/DirectHttpProvider.ts`
- **Finding**: The `resolve(infoHash)` method across debrid providers is hardcoded to return `https://media.w3.org/2010/05/sintel/trailer.mp4`.
- **Why it matters**: Returning fake video URLs completely bypasses real debrid stream resolution, leading to a broken streaming experience for the user. It masks incomplete integrations.
- **Recommended Fix**: Remove the hardcoded Sintel return values. Throw a `NotImplementedError` or return `null` if the provider logic is unfinished, ensuring the app handles failures gracefully.

**B. Fake Indian Media Catalog (Kalki, etc.)**
- **Files**: `src/providers/indianMediaCatalog.ts`
- **Finding**: Contains a static, hardcoded list of movies (`Kalki 2898 AD`, `RRR`, `Aavesham`) pointing to Sintel MP4 streams.
- **Why it matters**: Pollutes the real provider ecosystem with demo content. This repository is for production, not prototyping.
- **Recommended Fix**: Delete `indianMediaCatalog.ts` entirely. Remove any references to it from UI or container registrations.

**C. Placeholder Episode Metadata Injection**
- **Files**: `src/core/details/MediaDetailsManager.ts` (Lines 72, 100)
- **Finding**: If a season fetch fails or returns empty, the manager injects a fake `Episode 1 (Placeholder)` into `details.activeEpisodes`.
- **Why it matters**: Hides genuine provider failures and presents misleading UI data.
- **Recommended Fix**: If episode data is unavailable, `activeEpisodes` should be an empty array `[]` and `activeSeason` should not mock placeholder titles. The UI should display a graceful "No episodes found" state.

## 3. Medium Issues (P1, P2, P4, P5)

**A. Loose `mediaType` Propagation (P1)**
- **Files**: `src/core/models/DomainModels.ts`, `src/core/metadata/ValidationLayer.ts`, `src/core/providers/tmdb/TMDBMapper.ts`
- **Finding**: `mediaType` is marked as optional (`readonly mediaType?: 'movie' | 'series' | 'anime';`) in `DomainModels.ts`, yet UI components expect a strict, non-optional `mediaType`. `ValidationLayer.ts` forces it using unsafe `as any` casting.
- **Why it matters**: Without strict typing on `mediaType` at the domain model level, invalid items might pass through the pipeline causing routing failures in the UI.
- **Recommended Fix**: Make `mediaType` a required property on all canonical media interfaces. Update mappers to guarantee its presence.

**B. Duplicated Stream Provider Architectures (P4)**
- **Files**: `src/core/Bootstrap.ts`, `src/core/streams/ResolverManager.ts`, `src/core/streams/debrid/DebridManager.ts`
- **Finding**: The bootstrap process initializes identical concepts across two separate ecosystems. `ResolverManager` registers `TorBoxResolver` etc., while `DebridManager` registers `TorBoxDebridProvider` etc. 
- **Why it matters**: Indicates a half-completed migration between an old `ResolverManager` pattern and a new `DebridManager` orchestration layer. Duplicate DI registrations bloat memory and create competing sources of truth.
- **Recommended Fix**: Reconcile the streaming architecture. Choose either `ResolutionManager` or `DebridManager` as the singular orchestration layer and deprecate/delete the other.

**C. Incorrect Network Retry Strategy for 404s (P2)**
- **Files**: `src/core/providers/tmdb/TMDBProvider.ts`, `src/core/NetworkClient.ts`
- **Finding**: Providers catch errors and use string matching `err.message.includes('404')` to return `null`.
- **Why it matters**: Depending on localized string parsing for HTTP error codes is fragile. If `NetworkClient` changes its error message string, the fast-fail mechanism will break.
- **Recommended Fix**: Add a specific `statusCode` property to custom HTTP errors in `NetworkClient`. Check `error.statusCode === 404` directly.

**D. AVPlay Asynchronous Teardown Vulnerability (P5)**
- **Files**: `src/core/avplay.ts`
- **Finding**: The `stop()` method synchronously calls `stop()` followed instantly by `close()` on the native `webapis.avplay` object.
- **Why it matters**: ADR 003 specifies that closing should be event-driven. Calling `close()` immediately after `stop()` synchronously on older Tizen 4.0 drivers can cause native player panics.
- **Recommended Fix**: Delay `close()` using a short timeout or bind it to an internal state confirmation that playback has fully stopped.

**E. VirtualCarousel Throttling (P5)**
- **Files**: `src/components/VirtualCarousel.tsx`
- **Finding**: The `onScroll` listener invokes `handleScroll` directly on every tick, updating React state (`scrollLeft`) rapidly.
- **Why it matters**: High-frequency React state updates on Tizen Smart TV CPUs cause layout thrashing, frame drops, and potential memory exhaustion during rapid D-pad scrolling.
- **Recommended Fix**: Throttle or debounce the scroll event state updates.

## 4. Low Priority Issues (P3)

**A. Pervasive Usage of Unsafe `any`**
- **Files**: `MetadataAggregator.ts`, `TMDBClient.ts`, `SearchManager.ts`, `RenderMetrics.ts`, `UniversalMediaDetailView.tsx`, etc.
- **Finding**: Extensive use of `any` disables TypeScript's static analysis, particularly inside error catch blocks (`catch (error: any)`), promise maps, and event payloads.
- **Why it matters**: Weakens the overall type safety of the codebase and makes refactoring dangerous.
- **Recommended Fix**: Replace `any` with `unknown` in catch blocks (narrowing via `instanceof Error`). Use explicit generic types for Promises. Use properly defined interfaces for EventBus payloads.

## 5. Recommended Fix Order & Estimated Effort

1. **P0 (Immediate)**: Purge all fake Kalki metadata, delete `indianMediaCatalog.ts`, and remove Sintel fallbacks from all resolvers. Remove placeholder injections in `MediaDetailsManager`. *(Est. effort: 1 hour)*
2. **P4 (High)**: Consolidate stream resolver architecture in `Bootstrap.ts` to remove duplicate debrid manager registrations. *(Est. effort: 2 hours)*
3. **P1 (Medium)**: Enforce strict `mediaType` across domain models and remove `as any` casts. *(Est. effort: 1 hour)*
4. **P5 (Medium)**: Fix AVPlay teardown sequence and implement `VirtualCarousel` scroll throttling. *(Est. effort: 1 hour)*
5. **P2 (Low)**: Refactor HTTP error handling in `NetworkClient` to expose explicit status codes instead of string matching. *(Est. effort: 0.5 hours)*
6. **P3 (Ongoing)**: Systematically replace remaining `any` types with `unknown` or specific interfaces. *(Est. effort: 2 hours)*
