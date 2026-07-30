# Master Streaming Providers Database

This document catalogs every streaming, metadata, debrid, and subtitle provider identified across the audited repositories (PlayTorrioV2, Debrify, Kodi, Jellyfin, Dispatcharr, Stremio Shell). It serves as the single source of truth for integrating future providers into the StreamIndian Gateway Architecture.

---

## 1. Torrentio
* **Provider Type:** Torrent / Search / Debrid Integrator
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes
  * Live TV: No
  * VOD: Yes
  * Debrid: Yes (Real-Debrid, AllDebrid, Premiumize, TorBox, etc.)
  * Search: Yes
* **Authentication:** Encoded within the URL path as a configuration hash (no standard auth headers).
* **Region Restrictions:** None natively, though ISP-level torrent blocking may apply without Debrid.
* **API Requirements:** Stremio Addon Protocol (Manifest v3).
* **Rate Limits:** Extremely aggressive Cloudflare rate limits. Prone to 403/429 errors if heavily polled.
* **Provider Health:** Volatile. Highly popular and frequently overloaded. Requires resilient fallback logic.
* **Project Where Found:** Stremio Shell, PlayTorrioV2.
* **Generic Implementation Possible:** **Yes.** Fully adheres to the generic Stremio `IProviderClient` parser.

---

## 2. MediaFusion
* **Provider Type:** Torrent / Direct / IPTV / Search / Debrid Integrator
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes
  * Live TV: Yes (Sports & Broadcast via M3U integration)
  * VOD: Yes
  * Debrid: Yes
  * Search: Yes
* **Authentication:** URL-encoded configuration string.
* **Region Restrictions:** None.
* **API Requirements:** Stremio Addon Protocol (Manifest v3).
* **Rate Limits:** Managed by ElfHosted. Generally stable with standard anti-abuse limits.
* **Provider Health:** Stable. Highly active community maintenance.
* **Project Where Found:** Stremio Shell.
* **Generic Implementation Possible:** **Yes.** Standard `IProviderClient` works perfectly (with minor error-string filtering).

---

## 3. TorBox (Native API)
* **Provider Type:** Debrid / Torrent Search
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes
  * Live TV: No
  * VOD: Yes
  * Debrid: Yes (Native functionality)
  * Search: Yes (Global torrent index search)
* **Authentication:** Bearer Token (`Authorization: Bearer <API_KEY>`).
* **Region Restrictions:** None.
* **API Requirements:** Custom REST API (`/v1/api/torrents/search`).
* **Rate Limits:** Tied to user account tiers (Free vs. Pro).
* **Provider Health:** Excellent/Highly reliable.
* **Project Where Found:** PlayTorrioV2.
* **Generic Implementation Possible:** **No.** Requires a custom `TorBoxProviderClient` implementing `IProviderClient` to map TorBox REST responses into `CanonicalStreamSource[]`.

---

## 4. Real-Debrid / AllDebrid / Premiumize (Core Debrid Services)
* **Provider Type:** Debrid
* **Supported:**
  * Movies: N/A (Resolves streams, does not index them natively)
  * TV: N/A
  * Anime: N/A
  * Live TV: No
  * VOD: N/A
  * Debrid: Yes
  * Search: No
* **Authentication:** OAuth2 Device Flow or API Key.
* **Region Restrictions:** Minimal, though VPN usage is strictly regulated by Real-Debrid.
* **API Requirements:** Proprietary REST APIs per service.
* **Rate Limits:** Fair-use bandwidth limits; strict concurrent IP connection limits.
* **Provider Health:** Rock solid commercial stability.
* **Project Where Found:** Debrify, PlayTorrioV2.
* **Generic Implementation Possible:** **No.** Each requires a bespoke Debrid client (e.g., `RealDebridClient`) to handle token refresh and magnet un-restricting.

---

## 5. Cinemeta
* **Provider Type:** Metadata
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: No
  * Live TV: No
  * VOD: Yes
  * Debrid: No
  * Search: Yes (Catalog level)
* **Authentication:** None.
* **Region Restrictions:** None.
* **API Requirements:** Stremio Addon Protocol (Catalog/Meta definitions). Relies entirely on IMDb IDs (e.g., `tt0111161`).
* **Rate Limits:** Massive scale capability; virtually no aggressive rate limiting.
* **Provider Health:** Rock solid (Official Stremio Service).
* **Project Where Found:** Stremio Shell.
* **Generic Implementation Possible:** **Yes.**

---

## 6. TMDB (The Movie Database)
* **Provider Type:** Metadata / Search
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes
  * Live TV: No
  * VOD: Yes
  * Debrid: No
  * Search: Yes
* **Authentication:** API Key (Header or Query Parameter).
* **Region Restrictions:** None. Highly localized metadata support via `language` params.
* **API Requirements:** REST API (v3/v4).
* **Rate Limits:** ~50 requests per second (Standard free tier).
* **Provider Health:** Flawless.
* **Project Where Found:** PlayTorrioV2, Kodi, Jellyfin, Dispatcharr.
* **Generic Implementation Possible:** **No.** Requires a custom metadata integration service to translate to internal UI models.

---

## 7. Prowlarr / Jackett
* **Provider Type:** Search (Indexer Aggregator)
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes
  * Live TV: No
  * VOD: Yes
  * Debrid: No (Returns magnets/torrents, requires external Debrid)
  * Search: Yes
* **Authentication:** API Key header.
* **Region Restrictions:** None (Depends on local host).
* **API Requirements:** Torznab standard / Proprietary REST.
* **Rate Limits:** Limited by the underlying torrent trackers it queries, not Prowlarr itself.
* **Provider Health:** Dependent on the user's self-hosted instance.
* **Project Where Found:** Dispatcharr.
* **Generic Implementation Possible:** **No.** Requires a Torznab XML/JSON parser.

---

## 8. OpenSubtitles (v3 / v2)
* **Provider Type:** Subtitle
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes
  * Live TV: No
  * VOD: Yes
  * Debrid: No
  * Search: Yes (Hash or IMDB ID matching)
* **Authentication:** Stremio Addon config string, or direct API Key / User credentials.
* **Region Restrictions:** Global, huge multi-language support.
* **API Requirements:** REST API or Stremio Subtitle Protocol.
* **Rate Limits:** Strict daily download limits on free accounts.
* **Provider Health:** Functional but often throttled or slow on free tiers.
* **Project Where Found:** Kodi, Stremio Shell.
* **Generic Implementation Possible:** **Yes.** Standard Stremio Subtitle handlers apply perfectly.

---

## 9. IPTV Org (Generic M3U)
* **Provider Type:** IPTV
* **Supported:**
  * Movies: No
  * TV: No
  * Anime: No
  * Live TV: Yes
  * VOD: No
  * Debrid: No
  * Search: No (Filter based)
* **Authentication:** None.
* **Region Restrictions:** Many underlying streams are geo-blocked by broadcasters.
* **API Requirements:** M3U / M3U8 Playlist Parsing.
* **Rate Limits:** Varies completely based on the target stream host.
* **Provider Health:** Highly volatile. Links rot and go dead constantly.
* **Project Where Found:** Kodi, PlayTorrioV2.
* **Generic Implementation Possible:** **No.** Requires an M3U stream parser/tokenizer.

---

## 10. Comet / KnightCrawler / Annatar
* **Provider Type:** Torrent / Search / Debrid Integrator
* **Supported:**
  * Movies: Yes
  * TV: Yes
  * Anime: Yes (Specialized instances)
  * Live TV: No
  * VOD: Yes
  * Debrid: Yes
  * Search: Yes
* **Authentication:** URL-encoded configuration.
* **Region Restrictions:** None.
* **API Requirements:** Stremio Addon Protocol.
* **Rate Limits:** Subject to hosting environment (e.g., ElfHosted limits) or personal self-hosting.
* **Provider Health:** Medium/High (Alternatives to Torrentio).
* **Project Where Found:** Stremio Shell (Community Addons).
* **Generic Implementation Possible:** **Yes.** Full `IProviderClient` compatibility out of the box.

---

## Conclusion
The majority of streaming link providers (Torrentio, MediaFusion, Comet, KnightCrawler) utilize the **Stremio Addon Protocol**, making them eligible for a single generic implementation (`AddonClient`). 

Metadata providers (TMDB), Debrid resolvers (Real-Debrid), and custom APIs (TorBox) require specialized clients but can still conform to the generic `IProviderClient` interface for the Gateway to orchestrate them uniformly.
