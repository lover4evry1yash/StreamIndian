# StreamIndian Architecture

Version: 1.0
Status: Stable Platform Foundation

---

# Vision

StreamIndian is a high-performance OTT platform designed primarily for Samsung Tizen TVs while remaining portable to Android TV, Fire TV, LG webOS, and desktop browsers.

The architecture is provider-agnostic, rendering-first, performance-first, and optimized for D-pad navigation.

---

# Architectural Principles

- Performance First
- TV First
- Provider Agnostic
- Canonical Data Models
- Dependency Injection
- Layered Architecture
- Event Driven Communication
- Strong TypeScript Typing
- Lazy Loading
- Virtualization
- Memory Stability
- Zero UI Knowledge of Providers

---

# Layered Architecture

UI
│
▼
ViewModels
│
▼
Managers
│
▼
Repositories
│
▼
Metadata Aggregator
│
▼
Provider Manager
│
▼
Providers

---

# Core Modules

## Runtime Startup and Ownership

`src/main.tsx` is the single browser entry point. It awaits `Bootstrap.initializeCritical()` before mounting React. Bootstrap constructs and registers shared services in the singleton `ServiceContainer`; React receives access through `ServiceProvider` and typed context hooks. Feature-specific view models are registered by `initializeOnDemand`, not constructed by components.

The startup order is configuration and logging, event bus and platform capabilities, storage/settings/cache, lifecycle and navigation, AVPlay adapter and playback manager, providers, then metadata and home services. Idle and on-demand initialization run only after the critical path.

`Bootstrap.shutdown()` is the matching teardown boundary: it destroys playback and navigation listeners, removes lifecycle listeners, shuts down providers, clears event subscriptions and releases the service registry. It is invoked from the lifecycle exit event. Initialization flags are set only after successful phase completion.

## Errors and Events

The `EventBus` is typed by `EventMap`, returns unsubscribe functions from subscriptions, dispatches against a listener snapshot, and routes handler exceptions to the bootstrap logger. `Logger` supplies structured severity/prefix output. The React `ErrorBoundary` remains the UI rendering boundary; playback errors are represented by typed playback error events.

## Playback Platform Boundary

`PlaybackManager` depends on the `AVPlayAdapter` interface. `AVPlayManager` implements that boundary and owns the Samsung `webapis.avplay` calls, while browser preview uses the registered HTML video element. Tests inject a fake AVPlay API into the manager, so desktop tests exercise state and failure handling without claiming hardware compatibility.

The AVPlay prepare operation is asynchronous and session-scoped. Timeout, abort, replacement, or stop invalidates the active session; callbacks from older sessions are ignored. Native listener subscriptions and lifecycle listeners have explicit cleanup methods. AVPlay callback times are milliseconds and are normalized to seconds at the adapter boundary.

## Runtime Test Strategy

`npm run test:core` covers safe configuration defaults, event subscription/error handling, lifecycle teardown, AVPlay state transitions, errors, timeout, cancellation, stale callbacks, and repeated stop. The full Node test suite and production/Tizen builds remain separate checks. Passing these tests does not verify codec support, playback surfaces, audio output, or performance on a Samsung TV.

## Platform Support

Tizen 5.0 is the minimum declared runtime because it matches `public/config.xml`; Tizen 4 compatibility has not been verified. Device packaging, signing, AVPlay tracks, buffering, and playback still require Tizen Studio plus emulator or physical TV validation.

## Bootstrap

Responsibilities

- Dependency Injection
- Startup
- Service Registration
- Configuration
- Logging

---

## Navigation

Components

- Router
- FocusEngine
- NavigationManager
- BackStack
- ModalManager

Responsibilities

- TV navigation
- D-pad focus
- Back navigation

---

## Rendering

Components

- VirtualCarousel
- LazyImage
- ArtworkManager
- RenderMetrics
- SkeletonRenderer
- PrefetchManager

Responsibilities

- Virtualization
- Image lifecycle
- Rendering budgets
- Memory management

---

## Storage

Components

- CacheManager
- MetadataCache
- ImageCache
- SettingsManager

Responsibilities

- Persistent storage
- Cache
- Settings

---

## Metadata

Components

- MetadataManager
- MetadataRepository
- MetadataAggregator
- Canonical Models

Responsibilities

- Aggregate metadata
- Merge providers
- Produce canonical objects

---

## Providers

Current

- TMDB

Planned

- TVDB
- AniList
- Fanart.tv
- RPDB
- Trakt
- MDBList

Rules

Providers never communicate with UI.

---

## Playback

Components

- PlaybackManager
- ResumeManager
- TVPlayer

Responsibilities

- Stream playback
- Resume
- Lifecycle

---

## Dependency Flow

UI

↓

Managers

↓

Repositories

↓

Aggregator

↓

Providers

Never reverse this direction.

---

# Rendering Pipeline

Screen

↓

VirtualCarousel

↓

LazyImage

↓

ArtworkManager

↓

ImageCache

↓

Browser

↓

GPU

---

# Metadata Pipeline

UI

↓

MediaDetailsManager

↓

Repository

↓

Aggregator

↓

ProviderManager

↓

Providers

↓

Canonical Model

---

# Provider Rules

Every provider must:

- implement Provider interface
- map into canonical models
- never expose provider-specific models
- support graceful failure
- support caching

---

# Performance Targets

Cold Start

<2s

Focus

<8ms

Details

<100ms

Memory

Stable

DOM

Virtualized

Bundle

<250KB target

---

# Future Milestones

12 TVDB

13 AniList

14 Fanart + RPDB

15 Trakt + MDBList

16 Stream Resolution

17 AI Discovery

18 Offline

19 Samsung Optimization

20 Production Release

---

# Definition of Done

Every milestone must

- Build
- Lint
- Pass architecture review
- Preserve performance targets
- Preserve provider abstraction
- Preserve rendering abstraction
