# Watcher implementation journey

> **Location:** `_archive/Watcher-implementation-ordeal.md` · **Archived:** May 2026  
> **Superseded by:** `watcher.js` (S4 split) · **Keep for:** Safari worker / embed-queue debug journal — not a build contract.

---
Watcher Implementation — Status Report v2.0

Phase 1: Worker + Loading Indicator ✅

· Added WATCHER_CONFIG constants
· Added WATCHER_CODE blob worker with full embed + pass logic
· Added initWatcher() function to create the worker
· Added loading indicator (gold dot near wordmark)
· Added boot hook in init() to start the Watcher
· Result: App booted. Lock screen worked. Worker created successfully.
· First issue appeared: Console showed [Watcher] Error: MODEL_LOAD_FAIL

---

Phase 2: Embed Hooks ✅

· Added embed calls to saveCurrentDiscourse, confirmQuickCapture, confirmBurnDisc
· Added prune call to purgeDiscourse
· Result: Hooks worked. But model still failed to load, so no embeddings were created.

---

Debug Attempts

Attempt 1: Downgrade Transformers.js version

· Changed CDN URL from @2.17.2 to @2.15.0
· Result: Same error. MODEL_LOAD_FAIL

Attempt 2: Move importScripts from async loadModel() to synchronous root level (Claudy's fix)

· Moved importScripts(...) to the very top of WATCHER_CODE, before any functions
· Added const T = self.Transformers || self.transformers fallback for global name
· Result: New error. [Watcher] Crashed: NetworkError: Network response is CORS-cross-origin
· This error flooded the console every few seconds because the onerror handler called initWatcher() again after 5 seconds, creating an infinite restart loop

Attempt 3: Enable WASM proxy mode

· Set wasm.proxy = true and numThreads = 1 in the ONNX backend config
· Added _watcherRetried variable to prevent infinite restart loop
· Result: Same CORS error. The _watcherRetried variable threw Can't find variable because the declaration location wasn't specified.

Attempt 4: Extract worker to separate file with absolute URL (Aniki's fix)

· Created watcher.worker.js as a separate file
· Changed initWatcher() to use new URL('watcher.worker.js', window.location.origin).href for absolute path
· Removed blob worker entirely
· Deployed watcher.worker.js alongside index.html
· Result: Worker file found and loaded successfully. importScripts at root level loaded Transformers.js. But ONNX WASM fetch still fails with NetworkError: Network response is CORS-cross-origin because the worker makes cross-origin requests for WASM binaries from CDN.

Attempt 5: CDN swap to unpkg (Aniki's Option 1)

· Set wasmPaths to [https://unpkg.com/onnxruntime-web@1.14.0/dist/](https://unpkg.com/onnxruntime-web@1.14.0/dist/)
· Set allowLocalModels = false
· Result: Same CORS error. Safari blocks cross-origin WASM fetches from workers regardless of CDN provider.

Attempt 6: Host WASM files locally (Option B — IN PROGRESS)

· Downloading ort-wasm-simd.wasm and ort-wasm.wasm from unpkg
· Adding them to project root on Cloudflare Pages
· Configuring wasmPaths to self.location.origin + '/'
· Set allowLocalModels = false
· Status: Files downloaded. Awaiting deployment and test.

---

Root Cause Identified

Safari's blob workers AND file workers both fail to fetch WASM binaries from cross-origin CDNs. When importScripts loads Transformers.js from [cdn.jsdelivr.net](http://cdn.jsdelivr.net/), the JavaScript code loads successfully. But when ONNX tries to fetch the WASM runtime files (~40MB) from any CDN, Safari blocks those fetch requests as cross-origin. The worker's origin doesn't match the CDN domain, and Safari enforces this strictly even for file-based workers with absolute URLs.

This is a Safari-specific limitation. Chrome and Firefox allow workers to make cross-origin requests. Safari does not — even for dedicated worker files with proper origins.

---

What We Know Works

· The Abyss worker (SQL.js) works as a blob because sql.js WASM is loaded directly via importScripts which inlines it — no separate fetch needed
· Transformers.js differs because the ONNX runtime makes separate fetch requests for WASM files at runtime
· A separate .js worker file with absolute URL resolves the file-finding problem but does NOT resolve the WASM CORS problem
· The model weights (from HuggingFace) load fine — it's specifically the ONNX WASM runtime binaries that Safari blocks

---

Remaining Options

Option A: Main thread with idle queue

· Add <script> tag for Transformers.js in HTML <head>
· Load the pipeline on the main thread
· Queue embeds during saves, process during idle gaps
· Run pass on app foreground + time check
· Pros: No CORS issues, no workers, guaranteed to work on Safari PWA
· Cons: ~109MB model in main thread memory, ~200ms per embed, ~2 seconds for pass
· Mitigation: Embed during idle, pass only once per day

Option B: Host ONNX WASM files locally (CURRENTLY TESTING)

· Downloaded ort-wasm-simd.wasm and ort-wasm.wasm to project root
· Configured wasmPaths to self.location.origin + '/'
· Pros: Keeps Watcher in separate thread, no main thread memory pressure
· Cons: Additional files to manage (~20MB total), CDN dependency partially lost
· Status: Awaiting deployment and test

Option C: Service worker proxy

· Modify sw.js to intercept WASM requests from the Watcher worker and proxy them
· Pros: Keeps current architecture, no extra files
· Cons: Complex to implement, fragile, may still hit Safari PWA service worker limitations

Option D: Main thread with idle queue (fallback)

· Same as Option A, accepted as final fallback if Option B fails

---

Current Status

Option B is being deployed and tested. Files have been downloaded and configured. If WASM files load from same origin without CORS errors, the Watcher will work in its dedicated worker thread. If not, fall back to Option D (main thread + idle queue).

---

Phase 1: The Blob Worker (Failed)

We started clean. v0.25.3 — a stable build with encryption, sync, decay, deep soup, multi-select, gold line lineage. No Watcher code.

We added the Watcher as a blob worker — the same pattern that worked for the Abyss SQL.js worker. WATCHER_CODE as a template literal, initWatcher() creating a blob URL, importScripts loading Transformers.js from CDN.

The worker created successfully. The app booted. The lock screen worked.

Then: [Watcher] Error: MODEL_LOAD_FAIL

The model wouldn't load. We tried downgrading Transformers.js from 2.17.2 to 2.15.0. Same error.

Claudy's fix: Move importScripts from inside the async loadModel() function to the synchronous root level of the worker. Safari only honors importScripts at the top level of worker scripts. We also added a fallback for the global name (self.Transformers || self.transformers).

This got us past the first error. But a new one appeared.

---

Phase 2: The CORS Wall

[Watcher] Crashed: NetworkError: Network response is CORS-cross-origin

This error flooded the console. The importScripts loaded Transformers.js successfully, but when ONNX tried to fetch the WASM runtime files (~40MB) from the CDN, Safari blocked those requests. The blob worker's origin (blob:[http://localhost](http://localhost/):...) is opaque — Safari treats it as having no origin at all, and blocks all cross-origin requests.

The error looped because the onerror handler called initWatcher() again after 5 seconds, creating an infinite restart cycle. Every 5 seconds: crash, restart, CORS error, crash again.

We tried:

· wasm.proxy = true — didn't help
· numThreads = 1 — didn't help
· CDN swap from jsdelivr to unpkg — didn't help
· Adding retry guards to prevent infinite loops — helped the flood but didn't fix the root cause

---

Phase 3: The File Worker (Failed)

Aniki's insight: Use an absolute-path file worker instead of a blob worker. new URL('watcher.worker.js', window.location.origin) creates a proper origin that Safari might respect.

We created watcher.worker.js as a separate file, deployed it alongside index.html, and changed the worker initialization.

The worker file loaded. The importScripts at the root level ran. But the ONNX WASM fetch still failed with the same CORS error. Even with a real file worker with a proper origin, Safari blocks cross-origin WASM fetches from workers.

Root cause confirmed: Safari's PWA implementation does not allow any worker (blob or file) to make cross-origin requests for WASM binaries. This is a deliberate security policy, not a bug. Chrome and Firefox allow it. Safari does not.

---

Phase 4: Local WASM Hosting (Failed)

If cross-origin is blocked, we serve WASM from the same origin. We downloaded ort-wasm-simd.wasm and ort-wasm.wasm, added them to the project, and configured wasmPaths to self.location.origin + '/'.

Still failed. The worker's fetch was still considered cross-origin by Safari, even though the files were on the same domain. Safari's worker isolation is that strict.

---

Phase 5: The Pivot — Main Thread Shadow Queue

We had exhausted every worker-based approach. The remaining options were:

· Option A: Main thread with idle queue (guaranteed to work, ~109MB memory cost)
· Option B: Service worker proxy (complex, fragile)
· Option C: Abandon local embedding, use API (breaks sovereignty)

We chose Option A. Not as a compromise — as the only path through the wall.

Aniki's blueprint: Dynamic import() on the main thread bypasses Safari's worker CORS entirely. The model loads like a regular script — same origin permissions, no worker restrictions. The "Shadow Queue" processes embeddings during idle gaps with 250ms yields so the UI stays buttery.

The architecture:

· initWatcher() — dynamic import of Transformers.js, pipeline initialization, IndexedDB setup
· queueWatcherEmbed(id, title, body, itemType) — pushes to queue on every save
· processWatcherQueue() — drains queue with 250ms yields between each embed
· embedDiscourseMain() — title/body weighting, SHA256 hash check, vector normalization
· runSimilarityPassMain() — cosine similarity with spark boost, silence period, chunked with 20ms breathers
· scheduleWatcherPass() — runs every 20+ hours, 10 seconds after boot
· updateWatcherStatusUI() — updates Settings with count and state
· shouldWatcherShow() — threshold check for gold dot (5+ deep discourses with 80+ words)

Hooks inserted into:

· saveCurrentDiscourse — queues embed on save
· confirmQuickCapture — queues embed for sparks
· confirmBurnDisc — queues embed for engrams
· purgeDiscourse — prunes embeddings on permanent delete

Polish added:

· Module preload hint in <head> for faster first load
· Settings status line: "active · N engrams indexed"
· Word count tracked per embedding for threshold accuracy
· First-awakening toast: "◈ The Watcher has awakened"
· One-time reindex of all existing content on first boot

---

Phase 6: The Watcher Awakens

After 36 hours, 6 approaches, 5 AIs collaborating, and countless debugging rounds on an iPhone 14 without a real console...

"active · 2 engrams indexed"

The Watcher was alive. New discourses embedded instantly. Edits updated existing embeddings. The Shadow Queue kept the UI smooth. The similarity pass scheduled itself for the next cycle.

---

more than 36 hours  I did 100 plus iterations lol 😂 this watcher indeed last boss.. bugger didn’t wake up from slumber. Finally done.
Watcher has descended to the Abyss. Deepseek stayed with me in the last 36 hours brain melt. You all helped me too. Claudy helped me lot when the fight started with watcher. It was harder than opfs and conteneditable melt down lol. The reason I didn’t give up and smash the phone was the experience i accumulated by going through similar and you guys help and support. If the same watched issue happened two weeks ago or at the beginning it would have taken more than a week or never probably, I almost moved away many times and even told to accept the safari and pwa limitations.. 

---

---

Main Collabs: 

Architecture: Kaja & Metila

Coding Ordeal & Brain melt:  Deesan & Kaja 

Additional help: Claudy & GAI sensei
