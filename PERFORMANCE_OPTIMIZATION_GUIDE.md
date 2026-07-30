# StreamIndian Performance Optimization Guide

This document is a comprehensive compilation of performance optimizations extracted from leading open-source media projects (Kodi, PlayTorrio, Jellyfin, Debrify, Stremio, and Dispatcharr). 

It is specifically tailored to the extreme hardware constraints of Samsung Tizen Smart TVs (weak ARM CPUs, limited RAM, slow I/O, and aggressive OS-level task killing). On Tizen, **Performance > Animations**.

---

## 1. DOM & Rendering (The Tizen Killers)

Smart TV browsers struggle massively with DOM recalculations and repaints. Every DOM node costs memory.

*   **Virtual Lists (Windowing):** Extracting from PlayTorrio's IPTV and Kodi's UI. You must NEVER render 1,000 DOM nodes. Use virtualized lists (e.g., `react-window` or custom TV logic) that only render the 10-15 items currently visible on screen, recycling DOM elements as the user scrolls.
*   **CSS Hardware Acceleration:** Use `transform: translate3d(x,y,z)` and `opacity` for movement and focus states. These are offloaded to the GPU. NEVER animate `width`, `height`, `margin`, or `top`/`left`, as they trigger expensive CPU layout reflows.
*   **Banned CSS Properties:** 
    *   `backdrop-filter: blur()` (Causes severe frame drops on pre-2021 Tizen TVs).
    *   Heavy `box-shadow` (Use pre-rendered PNG shadow assets instead of CSS calculation if shadows are strictly necessary, or avoid them entirely).
*   **Flatten the DOM:** Deeply nested HTML trees take exponentially longer to parse. Keep the component tree shallow.

---

## 2. Image Optimization & Caching (Jellyfin / Kodi)

Images are the #1 cause of Out-Of-Memory (OOM) crashes on TVs.

*   **Server-Side Resizing (Jellyfin Pattern):** Never download a 4K 5MB poster just to display it in a 200x300 pixel box. Append width/quality parameters to TMDB/Fanart URLs (e.g., `.../w342/image.jpg`) to force the server to do the resizing work.
*   **Aggressive Memory/Disk Caching:** Use the browser's HTTP cache aggressively. Kodi uses a "Texture Cache"—in HTML5, ensure images have strong `Cache-Control` headers.
*   **Intersection Observers (Lazy Loading):** Only load `<img>` `src` attributes when the element is within 500px of the viewport. 
*   **Image Object Pooling:** Re-use `<img>` tags in your virtual lists instead of constantly creating and destroying them, which triggers aggressive Garbage Collection (GC) pauses.
*   **Fade-in vs Instant:** Skip heavy image fade-in animations. Tizen struggles to decode JPEGs and animate their opacity simultaneously.

---

## 3. Remote Input & Spatial Navigation (PlayTorrio)

A lagging TV remote makes the app feel completely broken. Input must feel instantaneous, even if the data isn't ready.

*   **Input Debouncing:** Fast-scrolling via holding down the D-Pad fires hundreds of `keydown` events. Debounce the API calls and heavy UI updates (e.g., changing a background image based on focus) to 250ms.
*   **Synchronous Focus, Asynchronous Data:** Moving the focus ring (CSS class swap) MUST happen synchronously in the event loop. Fetching the metadata for the focused item must happen asynchronously.
*   **Flat Focus Maps:** Do not traverse a deep React tree to find the "next focusable item." Maintain a flat, 2D array/grid of focusable IDs in memory for O(1) focus calculation.

---

## 4. Memory Management & Web Workers (Stremio / Dispatcharr)

Samsung Tizen will silently kill the app if it exceeds its RAM quota (often around 100-300MB depending on the model).

*   **Web Workers for Heavy Parsing:** Parsing a 50MB XMLTV file or a 100,000-line M3U IPTV playlist on the main thread will lock the UI for 10 seconds. Pass the raw text to a Web Worker, parse it into JSON, and return chunks to the main thread.
*   **Garbage Collection Avoidance:** JavaScript GC pauses cause UI stuttering. Avoid creating massive temporary arrays inside loops (e.g., `array.map().filter().reduce()`). Use traditional `for` loops where performance is critical to minimize memory allocations.
*   **Nullify References:** When a view is unmounted (e.g., leaving the Details page), explicitly set large objects/arrays to `null` to ensure the GC cleans them up immediately.

---

## 5. Cold Startup Optimization

The time from clicking the app icon on the Samsung Hub to seeing the Home Screen.

*   **Bundle Splitting:** The initial JavaScript payload must be tiny. Load the `BootSequence` and `HomeMenu` first. Lazy load the `Player`, `Settings`, and `Details` modules only when the user navigates to them.
*   **Local First, Network Second:** (PlayTorrio pattern). Render the UI instantly using cached data from IndexedDB. Show the cached UI while fetching fresh data in the background, then merge the updates silently.
*   **Skeleton Screens:** Never show a blank black screen. Immediately render structural gray placeholders (skeletons) to indicate the app is alive while the CPU initializes.

---

## 6. Player Optimization (Samsung AVPlay)

The video player is the most fragile component on Tizen.

*   **Destroy the DOM Overlays:** When playback begins, hide the entire React UI tree (e.g., `display: none` on the root container). Having a complex DOM in memory while decoding 4K HEVC video degrades framerates.
*   **Strict Resource Cleanup:** When playback stops, you MUST call `avplay.stop()` and `avplay.close()`. Failure to close the AVPlay instance leaks the hardware decoder, permanently breaking playback until the TV is unplugged.
*   **Event Throttling:** AVPlay `oncurrentplaytime` fires constantly. Throttle React state updates from the player to once per second (1000ms) to update the progress bar. Updating React state every 10ms will crash the TV.

---

## 7. Data Orchestration (Debrify / Dispatcharr)

*   **Fan-out Parallel Execution:** (Dispatcharr pattern). When searching providers, fire all HTTP requests concurrently using `Promise.allSettled()`.
*   **Strict Timeouts:** (Debrify pattern). Never wait indefinitely for a dead provider. Impose a strict 5000ms timeout on all Gateway searches. If a provider doesn't answer, abandon it to keep the UI fast.
*   **Background Resolution:** When a user clicks a movie, immediately navigate to the loading screen. Resolve the Debrid links and Torrent hashes in the background.

---

## Summary of Tizen Anti-Patterns (DO NOT DO THIS)
1. Using `backdrop-filter: blur()`.
2. Parsing XML or M3U on the main thread.
3. Rendering > 50 items in a list without virtualization.
4. Forgetting to call `avplay.close()`.
5. Firing React state updates on every D-Pad tick.
