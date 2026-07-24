# StreamIndian 📺

> Production-Quality, High-Performance Streaming Application for Samsung Tizen Smart TVs.

StreamIndian is a fast, lightweight, and modular OTT streaming application built specifically for Samsung Tizen Smart TVs (Tizen OS 4.0+). Designed from the ground up for 10-foot remote-first experiences, StreamIndian features spatial D-pad navigation, native hardware-accelerated video playback via Samsung AVPlay (`webapis.avplay`), multi-provider metadata aggregation, and stream resolution framework with Debrid integration.

---

## 🌟 Key Features

- **Samsung Tizen Native Engine**: Direct integration with Samsung AVPlay (`webapis.avplay`) for hardware decoding, surface rendering, and low memory consumption. Fallback to HTML5 video in desktop browser development.
- **Remote-First Spatial Navigation**: Custom Focus Engine managing spatial coordinates (`KEY_LEFT`, `KEY_RIGHT`, `KEY_UP`, `KEY_DOWN`, `KEY_ENTER`, `KEY_RETURN`), virtualized carousels, and focus restoration without mouse dependencies.
- **Multi-Provider Metadata Aggregation**: Seamless data normalization from TMDB, TVDB, AniList, Fanart.tv, RPDB, Trakt, and MDBList into canonical domain models (`Movie`, `Series`, `Season`, `Episode`, `Collection`, `Person`).
- **Stream Resolution & Debrid Integration**: Extensible resolver framework supporting direct HTTP streams and multi-debrid providers (TorBox, Real-Debrid, Premiumize, EasyDebrid, AllDebrid, DebridLink).
- **Focus-Driven Image Pipeline**: Memory-managed `ArtworkManager` with ref-counting, LRU cache eviction, and viewport prefetching tailored for low-spec TV SoCs.
- **Modular & Layered Architecture**: Strict single-direction dependency flow ensuring complete separation between UI views and provider data layers.

---

## 🏗️ Architecture Summary

StreamIndian adheres strictly to a 5-layer downward architecture:

```
UI Layer (React Views & Modals)
  └── ViewModels / Hooks
        └── Core Services / Managers (Navigation, Metadata, Playback, Image)
              └── Provider Layer (TMDB, TVDB, Fanart, Debrid Resolvers)
                    └── Infrastructure (NetworkClient, CacheManager, AVPlay)
```

- **Zero UI Knowledge of Providers**: UI components consume canonical domain models and interact exclusively with top-level managers.
- **Provider Abstraction**: Providers map raw HTTP/GraphQL responses into canonical application models with strict type validation before reaching state.
- **Memory & Render Budgets**: Virtualized rows (`VirtualCarousel`) keep DOM node counts minimal to prevent Out-Of-Memory (OOM) crashes on 2GB RAM Smart TVs.

---

## 📁 Repository Folder Structure

```
├── docs/                      # Architecture, audit reports, & system documentation
│   └── reports/               # Engineering audit & validation reports
├── src/
│   ├── components/            # React UI components (MediaRow, VirtualCarousel, Modals, LazyImage)
│   ├── context/               # Global state contexts (FocusContext, ProviderContext)
│   ├── core/                  # Core application engines
│   │   ├── metadata/          # MetadataManager, Aggregator, & Repository
│   │   ├── navigation/        # FocusEngine, NavigationManager, Router, BackStack
│   │   ├── providers/         # Metadata clients (TMDB, TVDB, AniList, Fanart, RPDB, Trakt, MDBList)
│   │   ├── rendering/         # ArtworkManager, PrefetchManager, RenderMetrics
│   │   ├── storage/           # CacheManager, Storage, SettingsManager
│   │   └── streams/           # ResolverManager, DebridManager, StreamSources
│   ├── types/                 # Shared TypeScript interfaces & canonical domain models
│   ├── App.tsx                # Main Application Shell
│   └── main.tsx               # Web entry point
├── scripts/                   # Organized maintenance, fix, & utility scripts
│   ├── fixes/                 # Verified code fixes
│   ├── patches/               # Module patches
│   └── utilities/             # Helper utilities & data mappers
├── AGENTS.md                  # Permanent repository rules & engineering constraints
├── ARCHITECTURE.md            # In-depth architectural specification
├── DEVELOPER_GUIDE.md         # Developer setup & coding standards
├── DECISIONS.md               # Architecture Decision Records (ADR)
├── ROADMAP.md                 # Project roadmap & milestones
├── CHANGELOG.md               # Version release history
├── SECURITY.md                # Security policy & disclosure guidelines
├── CONTRIBUTING.md            # Guidelines for contributors
└── LICENSE                    # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Samsung Tizen TV CLI / Studio**: Required for building `.wgt` packages and deploying to physical TVs or TV Emulators.

### Installation & Development

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/streamindian/streamindian.git
   cd streamindian
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and set necessary keys for development:
   ```bash
   cp .env.example .env
   ```

4. **Launch Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser. Note: Browser mode uses HTML5 video fallback for testing UI and navigation with keyboard arrow keys.

5. **Type Check & Linting**:
   ```bash
   npm run lint
   ```

6. **Production Build**:
   ```bash
   npm run build
   ```

---

## 📺 Deploying to Samsung Tizen TV

1. Ensure Samsung Tizen Studio is installed and developer mode is enabled on your Samsung Smart TV.
2. Package the Web Application:
   ```bash
   tizen package -t wgt -- .
   ```
3. Install to target Smart TV:
   ```bash
   tizen install -n StreamIndian.wgt -t <TV_DEVICE_ID>
   ```

---

## 🔒 Security & Privacy

This repository operates under a strict **No Secrets Policy**. Secrets, private keys, access tokens, and credentials MUST NEVER be committed to source control. Refer to [SECURITY.md](./SECURITY.md) for vulnerability disclosure procedures.

---

## 📜 License

StreamIndian is open-source software licensed under the [MIT License](./LICENSE).
