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
- [ ] Personalized recommendations based on viewing history and mood filters.

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
