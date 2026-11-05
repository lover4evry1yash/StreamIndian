# Changelog

## Unreleased — Mission 6–7 engineering foundation
- Added Tizen 6.5 / Chromium M85 compatibility fallbacks, Samsung Web API bootstrap, package CSP, and native AVPlay display surface checks.
- Hardened IPTV parsing and indexed browsing; added playlist-scoped EPG queries, Xtream category mapping, playlist management, favorites, recent channels, and current-programme display.
- Added bounded Xtream VOD and series catalogs, episode browsing, a recently watched shelf, and credential-safe local recents.
- Added bounded local playback history and configurable metadata-based home recommendations without a hosted inference dependency.
- Added IPTV, network response-boundary, recommendation, identifier, and Tizen package smoke coverage.

All notable changes to the **StreamIndian** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Raised the minimum Samsung TV target to Tizen 6.5 / Chromium M85, added a restrictive package CSP, Samsung Web API bootstrap, and Tizen-specific Chrome 85 build target.
- Added the Samsung AVPlay object surface for TV playback and retained HTML video for browser preview.
- Added a dedicated static Tizen build target with relative asset URLs and a packaged web-app smoke test.
- Added explicit package identity/version and a type-check command; aligned the Tizen manifest identity with the canonical GitHub repository.
- Added an injectable AVPlay adapter boundary with async prepare timeout, abort and stale-session protection, explicit playback startup states, and focused runtime tests.
- Added deterministic bootstrap/lifecycle teardown, typed event unsubscribe handles, safe configuration snapshots, and a Tizen 5.0 minimum-runtime decision aligned with the widget manifest.
- Created official open-source documentation suite (`README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `DECISIONS.md`, `LICENSE`).
- Moved engineering audit reports into structured `docs/reports/` directory.
- Reorganized maintenance, fix, and patch scripts into modular `scripts/` directory structure (`scripts/fixes/`, `scripts/patches/`, `scripts/utilities/`).
- Updated `.gitignore` to strengthen security exclusions against credentials, log files, and build outputs.
- Enhanced `AGENTS.md` with strict pre-push security gates, cleanliness guidelines, and architectural decision constraints.

---

## [1.0.0-rc1] - 2026-07-22

### Added
- **Samsung Tizen AVPlay Engine**: Hardware-accelerated video playback integration (`webapis.avplay`) with HTML5 fallback for browser environments.
- **Remote-First Navigation**: Spatial D-Pad Focus Engine supporting Tizen remote keys (`KEY_LEFT`, `KEY_RIGHT`, `KEY_UP`, `KEY_DOWN`, `KEY_ENTER`, `KEY_RETURN`).
- **Metadata Layer**: Multi-provider metadata aggregation supporting TMDB, TVDB, AniList, Fanart.tv, RPDB, Trakt, and MDBList.
- **Rendering Pipeline**: Focus-driven `ArtworkManager` with ref-counted memory management and LRU cache eviction.
- **DOM Virtualization**: `VirtualCarousel` horizontal list virtualization for Smart TV SoCs.
- **Stream Resolvers**: Multi-debrid resolution pipeline (TorBox, Real-Debrid, Premiumize, EasyDebrid, AllDebrid, DebridLink).
- **Diagnostics Panel**: Embedded audit panel for verifying active providers, memory metrics, and Tizen key mappings.
