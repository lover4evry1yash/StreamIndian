# Changelog

All notable changes to the **StreamIndian** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
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
