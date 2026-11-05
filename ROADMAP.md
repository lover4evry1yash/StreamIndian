# StreamIndian Project Roadmap

This document outlines the development milestones and feature roadmap for StreamIndian on Samsung Tizen Smart TVs.

---

## 🏁 Completed Milestones

### M01–M11: Core Platform Foundation ✅
- [x] Custom Spatial Remote Focus Engine & Navigation Router
- [x] Samsung AVPlay Hardware Playback Engine (`webapis.avplay`)
- [x] Layered Architecture (`UI -> Managers -> Repositories -> Aggregator -> Providers`)
- [x] Canonical Domain Models & Metadata Pipeline
- [x] TMDB Provider Integration with Rate-Limiting & Caching
- [x] Focus-Driven `ArtworkManager` & Memory-Managed `LazyImage`
- [x] `VirtualCarousel` DOM Virtualization for Low-Spec Smart TVs
- [x] Diagnostics & Audit Dashboard Panel
- [x] Static Tizen package baseline for Tizen 6.5 / Chromium M85, including Samsung Web API bootstrap, AVPlay surface, package CSP, and CSS compatibility fallbacks.
- [x] IPTV playlist foundation: local M3U and Xtream live playlists, bounded channel browsing/search, favorites, recent channels, and playlist-scoped XMLTV now/next data.
- [x] Local recommendation foundation: continue-watching and metadata-based recommendations from saved history, favorites, and language preferences.

---

## 🚀 Active & Upcoming Milestones

### Milestone 12: TVDB Provider Integration 🚧
- [ ] Implement `TVDBClient` and mapper into canonical `Series`, `Season`, and `Episode` models.
- [ ] Multi-season episode metadata fetching and language translation mapping.
- [ ] Token refresh & authentication handling.

### Milestone 13: AniList Provider Integration 📋
- [ ] Implement `AniListClient` for anime catalog discovery.
- [ ] GraphQL query optimization and canonical anime media normalization.
- [ ] Rate-limit header parsing (`Retry-After`).

### Milestone 14: Artwork Expansion (Fanart.tv & RPDB) 🎨
- [ ] Integrate Fanart.tv as fallback provider for high-resolution logos, backdrops, and banners.
- [ ] Integrate RatingPosterDB (RPDB) for dynamic poster overlays with IMDb/Rotten Tomatoes ratings.

### Milestone 15: Trakt & MDBList Integration 🍿
- [ ] Trakt user watchlists, history synchronization, and scrobbling.
- [ ] MDBList custom user lists and curated collection feeds.

### Milestone 16: Advanced Stream Resolution Framework 🌊
- [ ] Multi-provider Debrid stream resolution (TorBox, Real-Debrid, Premiumize, EasyDebrid, AllDebrid, DebridLink).
- [ ] Fast-timeout and parallel stream racing mechanics to prevent blocked playback.
- [ ] Stream quality ranking engine (4K/1080p, HDR/Dolby Vision, Audio Codecs, Seeders).

### Milestone 17: AI Discovery & Recommendations 🤖
- [ ] Contextual natural-language media search and discovery.
- [x] Initial local recommendations from viewing history, watchlist, and language metadata; no inference service is required.
- [ ] Richer personalized recommendations, mood filters, and evaluation against real user outcomes.

### Milestone 18: Durable Offline Engine & Caching 💾
- [ ] IndexedDB persistence for metadata repositories and user preferences.
- [ ] Offline watchlist and continue-watching state synchronization.

### Milestone 19: Deep Samsung Tizen Hardware Optimization ⚡
- [ ] Memory footprint reduction (<100MB RAM budget).
- [ ] Startup cold boot optimization (<1.5s).
- [ ] TV remote Back key certification compliance testing on Tizen 4.0, 5.0, 6.0, and 7.0 devices.

### Milestone 20: Production Release 🌟
- [ ] Final security audit & zero-secret verification.
- [ ] Samsung Tizen Seller Store packaging (`.wgt`) and certification submission.

### IPTV Foundation
- [x] Add and refresh M3U or Xtream live playlists and optional XMLTV EPG.
- [x] Keep playlist queries scoped and result pages bounded; preserve existing channels if a refresh yields no live channels.
- [x] Add core Xtream VOD and series browsing with a recently watched channel shelf.
- [ ] Add catch-up after provider URL contracts are validated, plus provider-specific compatibility testing.

### Validation still required
- [ ] Package and install with Tizen Studio on a supported Samsung TV or emulator.
- [ ] Verify D-pad/soft-keyboard flows, AVPlay surface sizing, codecs, audio/subtitle tracks, and playback on physical hardware.
