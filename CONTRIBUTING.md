# Contributing to StreamIndian

Thank you for your interest in contributing to StreamIndian! This document outlines our engineering standards, contribution guidelines, and quality expectations.

---

## 🎯 Project Scope & Mission

StreamIndian is built exclusively for **Samsung Tizen Smart TVs** (Tizen OS 4.0+). When writing code or designing features, remember:

1. **Hardware Constraints**: Smart TVs have limited CPU and RAM (typically 1.5GB–2GB). Keep DOM trees lightweight, minimize re-renders, and avoid unnecessary object allocations.
2. **Remote-First UX**: Mouse and touch interactions are secondary or unsupported. Every feature must be fully functional using D-Pad spatial remote navigation (`UP`, `DOWN`, `LEFT`, `RIGHT`, `ENTER`, `RETURN`).
3. **AVPlay Engine**: Samsung AVPlay (`webapis.avplay`) is our primary hardware-accelerated playback engine.
4. **Layered Architecture**: Respect the 5-layer downward architecture (`UI -> ViewModels -> Managers -> Repositories -> Aggregator -> Providers`). UI components must never communicate directly with provider APIs.

---

## 📜 Development Rules

### Code Quality
- **TypeScript**: Use strict typing (`strict: true`). Avoid `any` or implicit type coercion.
- **Components**: Functional React components with hooks. Keep components modular and single-responsibility.
- **Rendering**: Long lists must use `VirtualCarousel`. Images must use `LazyImage` routing through `ArtworkManager`.

### Security Rules (Mandatory)
- **Zero Secrets Policy**: Never commit API keys, secrets, tokens, passwords, or private certificates.
- Placeholders like `YOUR_TMDB_API_KEY` must be used in code examples and documentation.
- Always verify `.gitignore` before submitting changes.

---

## 🔄 Workflow & Pull Requests

1. **Fork & Branch**: Create a feature or fix branch from `main`:
   ```bash
   git checkout -b feature/my-feature-name
   ```

2. **Develop & Test**:
   - Ensure local dev server builds without errors:
     ```bash
     npm run dev
     ```
   - Verify TypeScript compilation and linter:
     ```bash
     npm run lint
     ```
   - Verify production build succeeds:
     ```bash
     npm run build
     ```

3. **Commit Cleanly**:
   - Use meaningful commit messages describing *what* and *why*.
   - Do not commit temporary logs, dead files, or experimental scripts.

4. **Submit PR**:
   Complete the PR checklist below.

---

## ✅ Pull Request End-of-Task Checklist

Every PR must verify:
- [ ] **Build Status**: `npm run build` succeeds without warnings/errors.
- [ ] **Lint Status**: `npm run lint` passes cleanly.
- [ ] **Architecture**: Single-direction dependency flow preserved. No provider leakage to UI.
- [ ] **Security Audit**: No API keys, secrets, or tokens exposed.
- [ ] **Remote Navigation**: Tested with spatial remote navigation or arrow keys.
- [ ] **Performance**: No memory leaks or unmanaged timers/event listeners.
- [ ] **Cleanliness**: Debug code, console spam, and unused imports removed.
