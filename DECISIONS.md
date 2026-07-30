# Architecture Decision Records (ADR)

This file records key architectural decisions made in the StreamIndian codebase, documenting context, rationale, and consequences.

---

## ADR 001: Samsung Tizen OS as Primary Target Platform

- **Status**: Accepted
- **Date**: 2026-07-21
- **Context**: The application target is low-spec Samsung Smart TVs (Tizen OS 4.0+). TVs have strict hardware limits (~1.5GB RAM, weak single-core CPU, remote control input only).
- **Decision**: Design all systems for Samsung Tizen first. Desktop browser compatibility exists solely for local development and rapid UI previewing.
- **Consequences**:
  - All navigation MUST support D-pad spatial input without mouse dependencies.
  - DOM nodes must be virtualized to prevent memory crashes.
  - Video playback must use Samsung AVPlay (`webapis.avplay`) natively on TV.

---

## ADR 002: Layered 5-Tier Downward Architecture

- **Status**: Accepted
- **Date**: 2026-07-21
- **Context**: Mixing UI logic with API providers or stream resolvers leads to tight coupling, high regression risk, and difficult testing.
- **Decision**: Enforce a strict 5-layer downward architecture:
  `UI Layer -> ViewModels -> Managers -> Repositories -> Aggregator -> Providers`.
- **Consequences**:
  - UI components can NEVER import or call provider classes directly.
  - Providers map raw responses into canonical domain models before passing data upstream.
  - Data flows strictly downward; dependencies never reverse direction.

---

## ADR 003: Samsung AVPlay as Exclusive TV Playback Engine

- **Status**: Accepted
- **Date**: 2026-07-21
- **Context**: Standard HTML5 `<video>` tags lack hardware decoder support, 4K HDR passthrough, and custom audio track switching on Tizen Smart TVs.
- **Decision**: Wrap Samsung AVPlay (`webapis.avplay`) in `TVPlayer.ts` as the sole playback engine for Tizen. Use standard HTML5 `<video>` strictly as a development fallback in browser contexts.
- **Consequences**:
  - Ensures smooth hardware decoding and low CPU usage on TV SoCs.
  - Requires safe asynchronous teardown (`stop()` followed by event-driven `close()`) to avoid native driver panics on Tizen 4.0 devices.

---

## ADR 004: Zero Hardcoded Secrets Policy

- **Status**: Accepted
- **Date**: 2026-07-22
- **Context**: The codebase is hosted in a public GitHub repository. Exposing API keys or tokens poses severe security risks.
- **Decision**: Enforce zero hardcoded credentials across all source files, scripts, and documentation. Inject runtime keys via environment variables or user settings panels.
- **Consequences**:
  - Pre-push security audits must verify zero credential leaks.
  - All sample configs and documentation use placeholder strings (e.g. `YOUR_TMDB_API_KEY`).

---

## ADR 005: Focus-Driven Image Memory Pipeline

- **Status**: Accepted
- **Date**: 2026-07-22
- **Context**: Loading dozens of posters during rapid D-pad scrolling saturates Tizen TV network connections and causes Out-Of-Memory (OOM) crashes.
- **Decision**: Implement `ArtworkManager` with reference counting (`refCount`), LRU cache eviction (`MAX_CACHED_IMAGES = 100`), and automatic request cancellation when `LazyImage` unmounts.
- **Consequences**:
  - Prevents network thread starvation during fast scrolling.
  - Maintains stable RAM usage during long browsing sessions.

---

## ADR 006: Git Repository Recovery Protocol
- **Status**: Accepted
- **Date**: 2026-07-27
- **Context**: A corrupt Git loose object (`fatal: loose object ... is corrupt`) caused the repository to enter a broken state. In the AI Studio disposable sandbox environment (which lacks a remote origin), the `.git` directory was destroyed and recreated to unblock development.
- **Decision**: In a temporary, isolated sandbox without a remote origin, recreating the `.git` directory is an acceptable last-resort unblocking mechanism. However, for a real repository, destroying `.git` is strictly forbidden because it destroys commit history, branches, tags, reflogs, and remote configuration.
- **Consequences**:
  - `rm -rf .git` is explicitly banned for repository repairs outside of ephemeral sandbox environments.
  - Any future Git corruption in a connected repository must be handled non-destructively using `git fsck`, `git fetch origin`, and `git reset --hard origin/main`, or by restoring missing objects from the remote.
