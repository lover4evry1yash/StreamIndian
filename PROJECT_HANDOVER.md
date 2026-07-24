# StreamIndian — Master Project Handover
**Version:** 1.0
**Date:** July 2026
**Role:** Lead Software Engineer
**Target Platform:** Samsung Tizen Smart TV
**Primary Language:** TypeScript
**Framework:** React + Vite
**Playback Engine:** Samsung AVPlay

---

# 1. Project Vision

## Mission

StreamIndian is a production-grade streaming platform built exclusively for Samsung Tizen Smart TVs.

The project is inspired by the architecture and modularity of PlayTorrioV2 but is **not** a Flutter port, **not** a Stremio clone, and **not** intended to be cross-platform.

Every architectural decision prioritizes:

- Samsung TV performance
- Remote-first navigation
- Low memory usage
- Native AVPlay playback
- Modular provider architecture
- Clean separation of concerns
- Long-term maintainability

The long-term objective is to build one of the highest-quality native Samsung TV streaming applications.

---

# 2. Project Goals

Primary goals:

- Native Samsung TV experience
- Lightning-fast startup
- Smooth remote navigation
- Modular architecture
- Easy feature expansion
- Minimal technical debt
- Provider independence
- Production readiness

---

# 3. Core Principles

The following principles are mandatory.

✓ Samsung Tizen First
✓ Performance First
✓ Remote First
✓ Clean Architecture
✓ Dependency Injection
✓ Modular Providers
✓ Strict Layer Separation
✓ Testability
✓ Maintainability

---

# 4. Architecture

The application follows a strict layered architecture.

```
React UI
      │
      ▼
ViewModels
      │
      ▼
Services
      │
      ▼
Managers
      │
      ▼
Repositories
      │
      ▼
Providers
      │
      ▼
External APIs
```

Dependencies always flow downward.

Nothing bypasses the layer below it.

---

# 5. Layer Responsibilities

## UI Layer

Location

```
src/components
src/App.tsx
```

Responsibilities

- Rendering
- User interaction
- Focus management
- Layout
- Animations

Must NOT contain

- Business logic
- Networking
- Provider access
- Manager access

---

## ViewModel Layer

Responsibilities

- UI state
- Loading state
- Error state
- Selection state
- Debouncing
- Pagination state
- User actions

Communicates only with Services.

Examples

- HomeViewModel
- SearchViewModel
- DetailViewModel

---

## Service Layer

Responsibilities

- Business logic
- Feature orchestration
- Domain mapping
- Validation
- Aggregation

Communicates only with Managers.

Examples

- HomeCatalogService
- SearchService
- DetailService

---

## Manager Layer

Responsibilities

- Domain logic
- Provider coordination
- Caching
- Internal state
- Event handling

Examples

- MetadataManager
- SearchManager
- ProviderManager
- PlaybackManager

---

## Provider Layer

Responsibilities

- External APIs
- Metadata providers
- Streaming providers
- Artwork providers

Examples

TMDB
Trakt
TVDB
AniList
FanArt
MDBList
RPDB
Debrid Providers

---

# 6. Dependency Injection

All application services are created inside

```
Bootstrap.ts
```

All dependencies are exposed through

```
ServiceContext.tsx
```

Never instantiate managers inside React components.

Never instantiate services inside React components.

Everything must come from Dependency Injection.

---

# 7. Architecture Rules

These rules are mandatory.

✓ React never creates Managers
✓ React never creates Providers
✓ React only communicates with ViewModels
✓ ViewModels only communicate with Services
✓ Services orchestrate Managers
✓ Managers communicate with Providers
✓ Providers never know about React
✓ Providers never know about ViewModels
✓ Bootstrap owns dependency creation
✓ ServiceContext exposes dependencies
✓ No business logic inside React

Breaking these rules introduces architectural debt.

---

# 8. Completed Architecture

The following architectural work has been completed.

## Home

Completed

- HomeCatalogService
- HomeViewModel
- Hero loading
- Row generation
- Catalog orchestration

---

## Search

Completed

- SearchService
- SearchViewModel
- Debounce extraction
- History management
- SearchManager abstraction
- UI cleanup
- EventBus removal from UI

Search flow

```
SearchView
↓
SearchViewModel
↓
SearchService
↓
SearchManager
↓
Providers
```

---

## Details

Completed

- DetailService
- Metadata abstraction
- Similar content loading
- Service extraction

---

## Metadata

Completed

- MetadataManager
- MetadataRepository
- MetadataAggregator
- ValidationLayer
- ArtworkAggregator
- ArtworkSelector
- MetadataMapper

---

## Providers

Completed

TMDB
TVDB
AniList
Trakt
FanArt
MDBList
RPDB
Debrid Providers
Provider Registry
Provider Manager
Request Scheduler
Credential Manager

---

## Streams

Completed

Resolution Pipeline
Resolver Manager
Source Manager
Ranking Engine
Duplicate Filter
Readiness Calculator
Transfer Manager
Presentation Mapper

---

## Playback

Completed

Playback Manager
Resume Manager
Browser fallback
Tizen wrapper

Remaining

Native AVPlay improvements

---

## Navigation

Completed

Focus Engine
Navigation Manager
Back Stack
Modal Manager
Router
Spatial Navigation
Focus Groups

---

## Storage

Completed

Storage Manager
Settings Manager
Metadata Cache
Image Cache
Browser Storage
Legacy Storage

---

## Rendering

Completed

Image Manager
Prefetch Manager
Render Metrics
Lazy Images
Virtual Carousel

---

# 9. Current Project Status

Architecture       ██████████ 100%
Dependency Injection ██████████ 100%
Providers          ██████████ 100%
Metadata           ██████████ 100%
Home               ██████████ 100%
Search             ██████████ 100%
Details            █████████▌ 95%
Playback           ████████░░ 80%
Settings           ████████░░ 80%
Watchlist          ████████░░ 80%
Tizen Integration  █████████▌ 95%
Optimization       ███████░░░ 70%

---

# 10. Public APIs

## HomeViewModel

```
load()
getHero()
getRows()
```

---

## SearchViewModel

```
setQuery()
loadHistory()
clearHistory()
getQuery()
getResults()
getHistory()
isLoading()
getError()
```

---

## SearchService

```
search()
getHistory()
clearHistory()
```

---

## DetailService

```
getMediaDetails()
getSimilarContent()
```

---

# 11. EventBus

EventBus remains inside the Core layer.
React no longer depends on EventBus for Search state.
Future features may continue using EventBus internally between Managers.

---

# 12. Coding Standards

Strict TypeScript
No any
Prefer interfaces
Composition over inheritance
Small focused classes
Async/await
Immutable state
Single Responsibility Principle
No duplicated logic
No circular dependencies
No Manager access from React

---

# 13. Samsung TV Guidelines

Always optimize for TV hardware.

Avoid

- Large DOM trees
- Expensive shadows
- Heavy blur filters
- Excessive animations
- Frequent re-renders

Prefer

- Lazy rendering
- Image caching
- Virtualized lists
- Lightweight components
- AVPlay playback

---

# 14. Performance Targets

Cold start           < 2 seconds
Remote latency       < 100 ms
Memory               As low as possible

Avoid unnecessary renders
Cache metadata
Cache images
Use lazy loading
Minimize bundle size

---

# 15. Build

Development

```bash
npm install
npm run dev
```

Production

```bash
npm run build
```

Package

```
dist/
↓
Samsung Tizen Studio
↓
.wgt
```

Deploy using Samsung certificates.

---

# 16. Security

Never commit

- API Keys
- Secrets
- JWT Tokens
- Certificates
- .env

Use environment variables.
Repository follows a strict No Secrets Policy.

---

# 17. AI Contributor Guidelines

Every future AI assistant must follow these rules.

Never bypass architecture.
Never instantiate Managers inside React.
Never access Providers directly.
Always register new Services inside Bootstrap.
Always expose Services through ServiceContext.
Maintain Samsung compatibility.
Maintain remote-first navigation.
Ensure build passes.
Ensure TypeScript passes.
Keep architecture clean.
Never introduce shortcuts that violate layering.

---

# 18. Next Sprint

Highest priority

- PlaybackViewModel
- AVPlayService cleanup
- Stream Selection ViewModel
- Watchlist ViewModel
- Settings ViewModel
- IPTV Integration
- Offline Metadata Cache
- Performance Optimization
- Samsung Packaging
- Samsung Store Readiness

---

# 19. Long-Term Roadmap

Phase 1

✔ Architecture
✔ Providers
✔ Metadata
✔ Search
✔ Details
✔ Home

---

Phase 2

Playback
Settings
Watchlist
History
IPTV
Downloads

---

Phase 3

Performance
Offline mode
Advanced caching
Store release
Analytics
Crash reporting

---

# 20. Project Health

Architecture is clean.
Build succeeds.
TypeScript passes.
Dependency Injection implemented.
Layer separation enforced.
Services abstract Managers.
React components remain presentation-focused.

The project is in an excellent state for continued feature development without accumulating architectural debt.

---

# Final Statement

This project now has a solid, scalable, production-quality architecture specifically designed for Samsung Tizen Smart TVs.

Future development should preserve the established layering, dependency injection, and modular provider architecture. New features should extend the existing Services and ViewModels rather than introducing shortcuts or bypassing the architectural boundaries.

The foundation is complete. The remaining work is primarily feature expansion, performance tuning, AVPlay refinement, and production hardening.
