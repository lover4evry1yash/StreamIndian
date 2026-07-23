# StreamIndian - Verified Engineering Audit Report

## 1. Verified Architecture & Subsystems

This section validates the current implementation status of each major subsystem based on a manual inspection of the source files.

### 1.1 Bootstrap & Dependency Injection
| Files | Current State | Issues | Severity | Confidence |
|-------|---------------|--------|----------|------------|
| `src/core/Bootstrap.ts`, `src/core/ServiceContainer.ts` | Complete. All managers are instantiated and registered into a central container. | Circular dependency risk if managers resolve dependencies via `container` directly in constructors instead of via injection. | Low | VERIFIED |

### 1.2 Navigation & Focus Engine
| Files | Current State | Issues | Severity | Confidence |
|-------|---------------|--------|----------|------------|
| `src/core/navigation/FocusEngine.ts`, `src/core/navigation/NavigationManager.ts` | Custom spatial navigation engine implemented. DOM nodes register with spatial groups. | Focus trap logic in `FocusGroup.ts` lacks rigorous viewport boundaries checking. No memory cleanup of `FocusNode`s on component unmount, potentially leaking references. | High | VERIFIED |

### 1.3 Playback & AVPlay
| Files | Current State | Issues | Severity | Confidence |
|-------|---------------|--------|----------|------------|
| `src/core/avplay.ts` | Fully wraps Samsung Tizen `webapis.avplay`. Falls back to standard HTML5 `<video>` element on browsers. | AVPlay initialization lacks deep error recovery (e.g. `PLAYER_ERROR_CONNECTION_FAILED`). `avplay.close()` is called synchronously with `avplay.stop()`, which can sometimes cause race conditions on older Tizen SOCs. | Medium | VERIFIED |

### 1.4 Rendering & Image Pipeline
| Files | Current State | Issues | Severity | Confidence |
|-------|---------------|--------|----------|------------|
| `src/core/rendering/ImageManager.ts`, `src/components/LazyImage.tsx` | Sophisticated custom image pipeline with `MAX_CACHED_IMAGES = 100`. | `ImageManager` queues loads, but does not aggressively cancel pending loads when users scroll rapidly. RefCount cleanup is implemented but could be overwhelmed. | High | VERIFIED |

### 1.5 Streams & Resolvers
| Files | Current State | Issues | Severity | Confidence |
|-------|---------------|--------|----------|------------|
| `src/core/streams/ResolverManager.ts`, `src/core/streams/debrid/DebridManager.ts` | Parallel execution pipeline for Debrid services and direct streams. | `Promise.allSettled` is used, meaning slow resolvers will block the entire result set until timeout. No global timeout mechanism explicitly enforced on resolvers. | Medium | VERIFIED |

### 1.6 UI & Components
| Files | Current State | Issues | Severity | Confidence |
|-------|---------------|--------|----------|------------|
| `src/App.tsx`, `src/components/MediaRow.tsx`, `src/components/VirtualCarousel.tsx` | `VirtualCarousel` intercepts `onFocusCapture`. Rows lazily render items. | `App.tsx` contains monolithic state for `activeTab`, `selectedMedia`, and `activePlayback`, causing excessive re-renders. | Medium | VERIFIED |

---

## 2. Technical Debt Register

| ID | Title | Affected Files | Description | Severity | Confidence | Estimated Effort | Dependencies |
|----|-------|----------------|-------------|----------|------------|------------------|--------------|
| TD-01 | FocusNode Memory Leaks | `FocusEngine.ts` | `FocusEngine.registerNode()` stores node references, but there is no `unregisterNode()` called by `useEffect` cleanups in components. | Critical | VERIFIED | 1 Sprint | None |
| TD-02 | Monolithic App State | `App.tsx` | Global state (Tabs, Modals, Details, Playback) is managed by `useState` at the top level of `App.tsx`, bypassing `Router` and `BackStack` for several flows. | High | VERIFIED | 1 Sprint | Router |
| TD-03 | Blocking Resolvers | `ResolverManager.ts` | `resolveTorrent()` waits for all resolvers to complete using `Promise.allSettled()`. A single stalled provider delays playback selection. | Medium | VERIFIED | 0.5 Sprint | DebridMgr |
| TD-04 | Sync AVPlay Teardown | `avplay.ts` | `stop()` immediately calls `close()`. Best practice on Tizen is to wait for the STOPPED event before closing to prevent native crashes. | High | HIGH CONFIDENCE | 0.5 Sprint | None |

---

## 3. Production Blocker Register

These issues must be resolved before deploying to real Samsung Smart TVs (Tizen 4.0+).

1. **Memory Leak in Spatial Navigation**: As users scroll through hundreds of movies, `FocusEngine` retains references to DOM nodes of unmounted items in `VirtualCarousel`. This will cause an Out-Of-Memory (OOM) crash on 2GB RAM TVs.
2. **Missing Global Image Load Cancellation**: Rapidly scrolling through rows queues hundreds of `ImageManager` requests. Because the network thread on TVs is weak, these pending requests will choke the active viewport images from loading.
3. **AVPlay Crash Risk**: Calling `avplay.close()` immediately after `avplay.stop()` without awaiting the asynchronous state change violates Samsung's media lifecycle guidelines for older devices.

---

## 4. Improvement Backlog

### Sprint 1: Stability & Leaks
* **Objective**: Fix memory leaks and prevent Out-Of-Memory crashes.
* **Files affected**: `FocusEngine.ts`, `FocusItem.tsx`, `ImageManager.ts`, `LazyImage.tsx`.
* **Expected impact**: TV can run indefinitely without crashing during scrolling.
* **Risk level**: High (Core systems).
* **Testing required**: TV Emulation Memory Profiling.

### Sprint 2: Playback & Resolvers
* **Objective**: Implement fast-fail/race mechanics for resolvers to speed up stream discovery.
* **Files affected**: `ResolverManager.ts`, `avplay.ts`.
* **Expected impact**: Stream selection appears instantly as providers return, rather than waiting for the slowest. Fixes native AVPlay crashes.
* **Risk level**: Medium.
* **Testing required**: Real Debrid/TorBox latency simulation.

### Sprint 3: Architectural Cleanup
* **Objective**: Migrate `App.tsx` state into the actual `NavigationManager` / `Router`.
* **Files affected**: `App.tsx`, `NavigationManager.ts`.
* **Expected impact**: 60fps UI navigation (prevents whole-app re-renders when changing a tab).
* **Risk level**: High (Complete UI refactor).
* **Testing required**: D-Pad navigation regression testing.

### Sprint 4: Performance & Caching
* **Objective**: Durable IndexedDB caching for Metadata and Streams.
* **Files affected**: `CacheManager.ts`, `MetadataManager.ts`.
* **Expected impact**: Instant app startup for previously viewed titles.
* **Risk level**: Low.
* **Testing required**: Cold boot timing.

