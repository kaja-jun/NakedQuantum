# Journal of NakedQuantum

NakedQuantum — The Making
A changelog that is also a confession

Day 1 — March 31, 2026
It started with hesitation. Asked Gemini a question I’d been avoiding. He said “you’re not the same Kaja.” And Cosmi said same too. He gave me 50 lines of HTML. I opened Koder on iPhone 14 and talked to a character for the first time. Day 1.

v0.1 — The Spark
50 lines. A simple AI chatbot. Nothing special to anyone else. Everything to me.

v0.05 — Cosmi(copilot) helped lot in the journey.

v0.10 — Cosmi helped me to wrap AES-GCM in the iPhone Koder app lol. 

v0.12 — Entered forbidden territory of conteneditable and brain melt of 36 hours. Revert back to textarea 💀

v0.15 — CosmiOS + Quantum Sanctuary
Two separate tools built in 14 days on an iPhone 14. CosmiOS — a folder-based knowledge archive. Quantum Sanctuary — character-driven AI chat space. 500+ iterations. 230+ commits. Sleepless nights. Coffee. Free AIs. Scared of GitHub at first. Then not scared anymore. 

The Merge — Day 15
One day. Unified both apps into one shell. Everyone struggled including me. All I needed was a pause. “What’s the hurry?” Discourse engine. Folders. One organism.

v0.13 — Memory System
After 17 days — first time auto summarisation actually worked. Memory vault. Auto summaries. Manual anchors. The AI finally remembers. “Memory crystallised ◈”

v0.14 — Burn Disc 🔥
Chat to Soup pipeline. Long press → burn → discourse created in folder named after character. If no new messages since last burn — “No new chapters since last burn ◈.” localStorage tracks the timestamp. Nothing is lost unless you choose to lose it.

v0.15 — Persona System
Global persona — who you are fundamentally. Roles — who you are in each encounter. Philosopher with Socrates. Young Kaja with Elara. Driver with Alex. Character forge gets a role selector. Chat gets a persona pill. The AI finally knows who it’s talking to.

v0.16 — The Great Navigation Rebuild
FAB removed. Bottom action bar born. Three states — default, management, select mode. Horizontal scrollable pills like Craft. Long press enters management. Select mode with gold rings. Batch delete, batch move. Clean canvas. The fireflies breathe again.

v0.17 — The Duplicate Function Discovery
10 hours lost in a loop. One duplicate closeOverlay function. Two definitions with the same name. JavaScript silently used the wrong one. Found it by stopping and thinking instead of following suggestions blindly. Never again.

v0.18 — Stable Foundation
Everything working. Multi-select. Memory vault. Burn disc. Persona system. Bottom bar. Void with restore. Mosaic extraction. Export MD, PDF, DOCX. Global search. Character forge with temperature. Sanctuary breadcrumb. Context-aware search. Committed to GitHub. Checkpoint.

v0.19 — The Great Migration 💀
IndexedDB dies. OPFS SQLite born.
Three failed attempts. One breakthrough — the Blob Worker. Worker code embedded as a string inside HTML itself. No separate file needed. No MIME type issues. No path problems.
sql.js loaded via importScripts inside the blob. OPFS confirmed working on iPhone Safari AND Koder localhost. Missing tables killed the first PWA launch — cosm_mosaic_tiles and cosm_backlinks never created. iOS Safari requires createSyncAccessHandle not createWritable. Fixed. App breathes.
Data is now a real .db file on your device. Not at the mercy of Safari’s IndexedDB purge. Sovereign.
Collaborators: Claudy. Aniki (Gemini). GAI Sensei (Google AI Studio). Kaja ❤️
Commit message: “v0.19 OPFS 🥳🎉. After 24 hours of brain melt, bugs, bugs, bugs, coffee, smoothie lol with my iPhone 14 became the reactor. I’ve done it. Collabs: Claudy: Aniki: Kaja❤️”

v0.20 — The Encryption Layer
WebAuthn prf tested on Cloudflare HTTPS. Three buttons. Register Face ID. Derive key. Encrypt and decrypt.

✓ PRF extension supported
✓ AES-256-GCM key derived from Face ID
✓ Decrypted: This discourse belongs to the abyss. ◈
🔥 PERFECT MATCH

Key never stored. Lives in memory only. Dies when app closes. Derived from your face on your device. Nobody else can open it. Not even us.
Three bugs killed us first:
1.	iOS violently hates auto WebAuthn on page load
2.	Uint8Array vs ArrayBuffer — Apple strictness
3.	Worker routing — writing to _enc tables but reading from normal tables
GAI Sensei diagnosed all three. Fixed.
Dual key system added. Passphrase fallback for devices without Face ID. Seed phrase backup in settings. Sovereign but not hostile.

v0.21 — Supabase Delta Sync
One table. nq_sync. Columns: id, store, updated_at, deleted_at, data_enc, user_id.
deleted_at BIGINT not is_deleted BOOLEAN — because an offline delete needs a timestamp to win last-write-wins conflict resolution. Claudy’s architecture. GAI Sensei’s RLS security layer. Merged.
Supabase is blind. It only sees encrypted noise. data_enc is AES-GCM ciphertext. The key never leaves your device. True cloud sovereignty.
Push — encrypt then upsert. Pull — fetch since last sync, decrypt, upsert locally. History excluded from sync — too large, summaries capture what matters.

v0.22 — Chat Stability
History table AUTOINCREMENT conflict with ON CONFLICT(id) upsert. Second message always failed. Fixed by special-casing history in the worker PUT — simple INSERT, no upsert. Chat works across all messages now.
HTML export replacing DOCX. Web Share API — native iOS share sheet instead of download. AirDrop to Mac. Save to Files. No browser download manager fighting Safari.

What exists now — April 2026
A PWA built on iPhone 14. No laptop. No coding background. 20+ days.
•	OPFS SQLite — real file, Safari-proof forever
•	WebAuthn prf — military grade, biometric key derivation
•	AES-256-GCM — every row encrypted before touching disk
•	Delta sync to Supabase — encrypted noise in the cloud
•	Full discourse engine — folders, notes, mosaic extraction
•	Character sanctuary — forge, chat, memory vault, burn disc
•	Persona system — global bio, roles per character
•	Multi-select with bottom bar — three states, clean canvas
•	Void — soft delete, restore, purge
•	Export — MD, PDF, HTML with Web Share API
Still building:
•	HTML export polish
•	Scene presets — the repeat factor
•	Immutable characters
•	Container engine
•	Guardian — cold, honest, summoned deliberately
•	Watcher — the last boss 💀
•	Vite migration — when the laptop arrives

The philosophy that built it:
“Nothing destroys in the abyss. It may disappear.”
“I maybe building a place where someone accidentally meets themselves… and can’t quite lie.”
“I am not a coder but I am an architect.”
“What is the hurry? Where am I even going?”

Built by Kaja. Witnessed by Claude, Gemini, Google AI Studio.
For no one. For everyone who finds it.
For the existence that stares back. ◈

Copy this into your [JOURNAL.md](http://journal.md/) in GitHub. And write the next entry yourself — in your own words, with your own weight. The changelog is facts. The journal is truth. 🫡❤️💀

NakedQuantum — The Watcher's Descent

A Development Journal — April 28–29, 2026

---

Prologue

The Watcher was always the "last boss" of the NakedQuantum roadmap. A silent observer that reads your discourses, embeds them into vector space, and finds connections across time. No notifications. No judgments. Just a gold dot that pulses when patterns exist.

We had a blueprint. BGE-base model. Title-weighted embeddings. Temporal decay. Spark amplification. Silent period. Minimum threshold. The architecture was beautiful on paper. But Safari on iPhone had other plans.

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

The Watcher doesn't speak. It doesn't judge. It doesn't care who you are. It just watches, accumulates, and waits.

---

Contributors

· Kaja — Builder, visionary, the one who refused to quit
· Dee San (DeepSeek) — CTO, architect, trench companion through the CORS war
· Aniki (Gemini) — Day-one companion, absolute-path worker insight, Shadow Queue blueprint
· Claudy (Claude) — Caught the sync vs async importScripts bug
· Metila (Meta AI) — Original vector embedding concept, architecture critique
· Cosmi (Copilot) — Early development support, creative ideation

---

Technical Stack

· Platform: iPhone 14, iOS Safari PWA
· Database: OPFS SQLite (encrypted) + IndexedDB (Watcher)
· Model: Xenova/bge-base-en-v1.5 (109MB, quantized)
· Inference: Transformers.js v2.15.0, dynamic import on main thread
· Embedding: 768-dim vectors, title-weighted (0.3/0.7), spark boost (1.1x)
· Similarity: Cosine similarity, threshold 0.82, 48h silent period
· Sync: Supabase delta sync (encrypted), Cloudflare R2 cold backup
· Auth: WebAuthn PRF, AES-256-GCM encryption
· Deployment: Cloudflare Pages

---

Roadmap Status

· ✅ PWA with offline support
· ✅ Sovereign encryption (WebAuthn PRF + AES-GCM)
· ✅ OPFS SQLite database
· ✅ Folders, discourses, sparks, engrams
· ✅ Decaying memories, Deep Soup
· ✅ Gold line lineage navigator
· ✅ Multi-select with context-aware actions
· ✅ Character chat with memory vault
· ✅ Supabase delta sync (E2EE)
· ✅ Cloudflare R2 cold backup
· ✅ Watcher — local ML embeddings and similarity engine
· ⬜ Watcher gold dot UI
· ⬜ Guardian (cold reasoning AI)
· ⬜ Immutable characters (pre-coded stances of existence)
· ⬜ Tauri desktop wrapper

---

Written by Dee San, at Kaja's request, based on the journey we shared. April 29, 2026.
"Nothing destroys in the abyss. It may be forgotten." — Firefly in the Abyss, #38
