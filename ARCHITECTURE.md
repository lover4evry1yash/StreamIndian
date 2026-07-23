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
