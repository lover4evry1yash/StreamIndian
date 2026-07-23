# StreamIndian Developer Guide

---

# Folder Structure

src/

components/

core/

providers/

metadata/

storage/

navigation/

rendering/

types/

---

# Coding Standards

Always

- Use TypeScript
- Avoid any
- Prefer composition
- Prefer immutable data
- Keep files focused

Never

- Call providers directly from UI
- Duplicate rendering logic
- Fetch metadata inside components
- Create provider-specific models

---

# Adding a Provider

Create

Provider

Client

Mapper

Register in ProviderManager

Update MetadataAggregator

Never modify UI.

---

# Adding a Screen

Create

View

ViewModel

Manager

Register routes

Declare Render Budget

---

# Adding Images

Never use

<img>

Always use

<LazyImage>

---

# Rendering Rules

Lists

↓

VirtualCarousel

Images

↓

LazyImage

Artwork

↓

ArtworkManager

Never bypass these layers.

---

# Dependency Injection

Register services in Bootstrap.

Access services through ServiceContainer.

Never instantiate shared services directly.

---

# Performance Rules

Virtualize long lists.

Memoize expensive renders.

Lazy load screens.

Keep DOM small.

Respect render budgets.

---

# Samsung Tizen Rules

Avoid

Heavy shadows

Backdrop blur

Large DOM trees

Continuous animations

Prefer

Opacity

Transform

Lazy loading

Recycling

Caching

---

# Testing

Every milestone

npm run build

npm run lint

Verify

Navigation

Playback

Rendering

Memory

Images

---

# Pull Request Checklist

- Architecture respected
- No provider leakage
- No duplicated logic
- Strong typing
- Performance maintained
- Documentation updated
