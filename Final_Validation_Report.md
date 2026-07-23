# FINAL VALIDATION REPORT

This report is the implementation source of truth for the remainder of the project. It validates and corrects earlier hypotheses through deep code inspection.

## VERIFIED ISSUES

----------------------------------------
Issue ID: P0-IMAGE-QUEUE
Title: Unbounded Network Saturation in Image Pipeline
Subsystem: Rendering
Files: `src/core/rendering/ImageManager.ts`, `src/components/LazyImage.tsx`

**Evidence:**
Exact code path:
In `LazyImage.tsx`:
```typescript
  useEffect(() => {
    // ...
    imageManager.preloadImage(src, priority).then(...)
    return () => { isMounted = false; };
  }, [src]);
```
In `ImageManager.ts`:
```typescript
const req = this.getOrCreateRequest(url, 'poster', priority);
// ...
this.queue.push(url);
```
**Runtime scenario:** User holds the "Right" button on the TV remote, scrolling rapidly through 50 movies. `LazyImage` components rapidly mount and unmount.
**How the bug manifests:** `LazyImage` calls `preloadImage`, pushing 50 requests into the queue. When `LazyImage` unmounts milliseconds later, it merely sets `isMounted = false`. `ImageManager` is completely unaware the component unmounted, leaving all 50 requests in `this.queue`.
**Worst-case impact:** Tizen network limits (usually 2-4 concurrent TCP connections) become completely saturated by the 50 aborted images. The TV appears to freeze loading the poster the user actually stopped on. Network starvation.
**Current mitigation:** None. `unregisterDisplay` is only called *after* an image finishes loading.
**Remaining risk:** Complete network starvation on rapid scroll.
**Confidence:** VERIFIED
**Priority:** P0
**Estimated effort:** S (1-4 hours)
**Regression Risk:** Medium
**Testing Required:** Manual (Rapid scrolling on TV Emulator).

----------------------------------------
Issue ID: P1-APP-ROUTER
Title: Monolithic Top-Level State Bypassing Router
Subsystem: UI / Navigation
Files: `src/App.tsx`, `src/core/navigation/NavigationManager.ts`

**Evidence:**
Exact code path:
In `App.tsx`:
```typescript
const [activeTab, setActiveTab] = useState('nav-home');
const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
const [activePlayback, setActivePlayback] = useState<...>(null);
```
**Runtime scenario:** User selects a movie to view details.
**How the bug manifests:** `setSelectedMedia` triggers a full tree re-render from the absolute top of the application hierarchy. The BackStack hardware button handler (managed by `NavigationManager`) is decoupled from this state.
**Worst-case impact:** Severe frame drops on SOCs due to unoptimized React reconciliation across the entire app. The TV "Return" button on the remote will exit the app instead of closing the details view.
**Current mitigation:** `NavigationManager` exists but is unused for these core transitions.
**Remaining risk:** Poor performance and broken hardware remote behavior.
**Confidence:** VERIFIED
**Priority:** P1
**Estimated effort:** M (1 day)
**Regression Risk:** High (Total UI routing change)
**Testing Required:** Integration, Samsung TV Only (Remote Back button).

----------------------------------------
Issue ID: P2-RESOLVER-BLOCK
Title: Resolver Pipeline Blocks on Slowest Provider
Subsystem: Streams
Files: `src/core/streams/ResolverManager.ts`

**Evidence:**
Exact code path:
```typescript
const promises = sortedResolvers.map(...);
const results = await Promise.allSettled(promises);
return results.flatMap(r => r.value);
```
**Runtime scenario:** User clicks "Play" on a movie. 3 Debrid resolvers are active. Real-Debrid responds in 0.5s. TorBox API is having issues and times out after 15s.
**How the bug manifests:** `Promise.allSettled` waits for all promises to resolve or reject. The UI will spin for 15 seconds, hiding the Real-Debrid streams that were available almost instantly.
**Worst-case impact:** Unacceptable stream presentation latency when any single provider degrades.
**Current mitigation:** None.
**Remaining risk:** High perceived application slowness.
**Confidence:** VERIFIED
**Priority:** P2
**Estimated effort:** S (1-4 hours)
**Regression Risk:** Low
**Testing Required:** Unit (Mocking slow providers).

----------------------------------------
Issue ID: P3-AVPLAY-TEARDOWN
Title: Synchronous AVPlay Close Race Condition
Subsystem: AVPlay / Playback
Files: `src/core/avplay.ts`

**Evidence:**
Exact code path:
```typescript
(window as any).webapis.avplay.stop();
(window as any).webapis.avplay.close();
```
**Runtime scenario:** User exits video playback abruptly during buffering.
**How the bug manifests:** Calling `close()` immediately after `stop()` while decoders are still flushing causes a hardware decoder panic on Tizen 4/5 models.
**Worst-case impact:** Complete App crash (black screen, TV reboot required).
**Current mitigation:** None.
**Remaining risk:** Instability on legacy TVs.
**Confidence:** HIGH CONFIDENCE
**Priority:** P3
**Estimated effort:** XS (<1 hour)
**Regression Risk:** Low
**Testing Required:** Samsung TV Only (Tizen 4.0 physical device).

================================

## FINAL IMPLEMENTATION ORDER

**1. P0-IMAGE-QUEUE**
* **Reason:** Network starvation completely breaks the app's core browsing experience. Must be fixed before any real data integration testing.
* **Dependencies:** None.
* **Risk:** Medium.
* **Files:** `src/core/rendering/ImageManager.ts`, `src/components/LazyImage.tsx`
* **Expected outcome:** Rapid scrolling dequeues aborted image requests. Only the focused and adjacent items consume network bandwidth.

**2. P1-APP-ROUTER**
* **Reason:** Moving state into the Router stabilizes the hardware Back button, which is a hard certification requirement for Samsung TV apps.
* **Dependencies:** Router, BackStack.
* **Risk:** High.
* **Files:** `src/App.tsx`, `src/core/navigation/NavigationManager.ts`
* **Expected outcome:** Sub-views open via `NavigationManager.openRoute()` / `openModal()`. The hardware Return button successfully navigates backwards. Zero full-app re-renders on navigation.

**3. P2-RESOLVER-BLOCK**
* **Reason:** Guarantees fast "Time To First Stream" for users, even if one provider fails.
* **Dependencies:** None.
* **Risk:** Low.
* **Files:** `src/core/streams/ResolverManager.ts`
* **Expected outcome:** Streams yield via an observable/callback, OR a fast-timeout is applied to `Promise.race` logic to ignore stalled providers.

**4. P3-AVPLAY-TEARDOWN**
* **Reason:** Final stability fix before production testing.
* **Dependencies:** None.
* **Risk:** Low.
* **Files:** `src/core/avplay.ts`
* **Expected outcome:** Safe teardown of AVPlay surfaces preventing black-screen crashes on older Smart TVs.
