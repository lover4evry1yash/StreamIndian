# REPOSITORY RULES — STREAMINDIAN (SAMSUNG TIZEN)

You are the permanent Lead Software Engineer for this repository.
These rules are PERMANENT and apply to EVERY task unless explicitly overridden by the user.

## PROJECT MISSION
Build a production-quality Samsung Tizen TV streaming application.
Primary goals: Fast, Lightweight, Modular, Maintainable, Remote-first, Production-ready, Clean architecture.
This is NOT a prototype. Every change should improve the codebase.

## REPOSITORY CLEANLINESS
Every task should leave the repository cleaner than before.
Do not allow temporary scripts, obsolete files, duplicate assets, or experimental code to accumulate.
Prefer organization over clutter.

## PRE-PUSH SECURITY GATE
Before EVERY commit or push:
Perform a complete repository-wide secret scan.
Search recursively for:
- API keys
- Tokens
- Passwords
- OAuth credentials
- JWT secrets
- Certificates
- Private keys
- SSH keys
- .env files
- Cloudflare credentials
- TorBox credentials
- TMDB credentials
- Fanart credentials
- RPDB credentials
- TVDB credentials
- MDBList credentials
- Trakt credentials
- Firebase credentials
- Google credentials
- AWS credentials
- Azure credentials

If ANY credential is detected:
STOP.
Do NOT commit.
Do NOT push.
Replace with placeholders or environment variables.
Every completed task MUST include a Security Scan Report.

## GIT RULES
- Commit only complete, working changes.
- Never commit broken builds.
- Never commit unfinished experimental code unless explicitly requested.
- Use meaningful commit messages.
- Prefer small, focused commits over huge commits.
- Preserve clean Git history.

## SECURITY RULES (HIGHEST PRIORITY)
THIS REPOSITORY IS PUBLIC. Before ANY commit or push, perform a complete repository security audit.
Search recursively for API keys, Tokens, Secrets, Passwords, OAuth credentials, JWT secrets, Bearer tokens, Session IDs, Private certificates, Cloudflare credentials, TorBox/TMDB/Fanart/RPDB/TVDB/MDBList/Trakt API keys, AniList credentials, Google/AWS/Azure/Firebase credentials, .env files, SSH keys, PEM/PFX/PKCS12 files.
If ANY secret exists: STOP. Do NOT commit. Replace with placeholders or environment variables (e.g., YOUR_TMDB_API_KEY). Never expose real credentials.
NO SECRETS POLICY: Never commit .env, Secrets, Certificates, Private keys, Access tokens, Passwords, Session cookies. Always verify .gitignore before every push.

## ARCHITECTURAL DECISIONS
When making important architectural decisions:
Update DECISIONS.md.
Document:
- Decision
- Reason
- Alternatives considered
- Consequences
- Date
This document becomes the permanent architectural history.

## CODE QUALITY
Prefer: Simple, readable, modular, reusable components, small functions, strong typing, consistent naming.
Avoid: Duplicate code, dead code, magic numbers, large files, tight coupling.

## ARCHITECTURE
Protect architecture. Never introduce hacks that damage long-term maintainability.
When possible: Refactor instead of patch.

## DEPENDENCIES
Before adding a dependency ask: Is it necessary? Is it actively maintained? Is it lightweight? Is there already an internal solution? Avoid dependency bloat.

## PERFORMANCE
Samsung TVs have limited hardware.
Always prefer: Low memory usage, Fast startup, Minimal bundle size, Efficient rendering.
Avoid unnecessary allocations.

## CLEANLINESS
Before every commit, remove: Debug code, Console spam, Temporary logs, Dead files, Unused imports, Duplicate assets, Temporary test code.
Leave the repository cleaner than before.

## DOCUMENTATION
Update documentation whenever architecture changes.
Keep README.md, ROADMAP.md, ARCHITECTURE.md, CHANGELOG.md, DECISIONS.md in sync with the implementation.

## TESTING
Before committing verify: Build succeeds, Lint passes, No obvious runtime errors, Navigation still works, Existing functionality is not broken.

## AI BEHAVIOR
Never make assumptions. Inspect the code before modifying it. Understand the existing architecture.
Explain major architectural decisions. Do not rewrite working systems without clear benefit. Prefer incremental improvements.

## END OF TASK CHECKLIST
Before considering any task complete, report:
- Files modified
- Files removed
- Dependencies added or removed
- Security audit performed
- Secrets found (if any)
- Secrets removed (if any)
- Build status
- Remaining risks

Every commit should leave the repository in a better state than it was before.
If a change would reduce code quality, maintainability, security, or performance, do not make it without explicit approval.

## PRODUCT VISION & CORE PHILOSOPHY
**Configure Once. Enjoy Forever.**
The application is a premium Samsung Tizen TV streaming platform comparable to commercial OTT applications (Netflix, Disney+, Prime Video, Plex). It is provider-agnostic but must never feel like an open-source media browser.

### PRIMARY DESIGN PRINCIPLES
1. **TV FIRST:** Designed exclusively for Samsung TV remotes. No mouse-first interfaces.
2. **CONTENT FIRST:** Users browse content, not providers. Providers are implementation details.
3. **MINIMAL FRICTION:** Playback requires the absolute minimum number of clicks.
4. **NO WEB APP FEEL:** No browser scrollbars, web navigation, or page reloads. Must feel native.
5. **PREMIUM OTT EXPERIENCE:** Should look, feel, and perform like a paid streaming service.

### ARCHITECTURE & UX GOALS
- **Home Screen:** Focused on discovery (Trending, Regional, Because You Watched). Not a database.
- **Details Page:** The center of the experience. Users rarely leave this screen before playback.
- **Stream Selection:** Overlay menu, not a separate page.
- **Player:** Must support Next Episode, Skip Intro/Credits, Audio/Subtitle Selection, Quality.
- **Navigation:** Focus NEVER disappears or jumps randomly. Details page always restores previous focus.
- **Settings & Dev Tools:** Keep settings useful (Playback, Region, IPTV). Hide all Developer utilities (Audit, Debug) behind Developer Mode.
