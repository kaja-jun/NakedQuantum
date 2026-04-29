# NakedQunatum Roadmap 16/04/26

- Type - PWA ✅
- Cloudflare deployment ✅
- IndexedDB ✅ ❌
- Foundation - Merge Quantum sanctuary & cosmiOS in one shell -      Discourse engine - Folders - R2 sync ✅
- Exports - json, md, pdf, .docx ✅
- Data - Cloudflare R2 ✅
- Character page ✅
- Memory vault ✅
- Burn Disc - (Save discourse) ✅
- Persona ✅
- Persona room, Persona selector ✅
- Multi select ✅
- Horizontal bottom scrollable modal ✅
- Local OPFS SQLite ✅
- AES GCM (.nq) ✅
- Web authn and **The `prf`Extension ✅**
- Export HTML ✅
- Export to Files - Own folder in the device memory - even OPFS is still under mercy of safari.
- Gold-thread Abyss descent ✅
- Folder lineage to Gold-thread ✅
- Overhaul the old multi-select, removed friction of [long press- select the ‘select’ from pill bar] to long press to select mode ✅
- UI refinements - Unique glyphs, changed Burn disc to Engram and capture to spark. ✅
- UI refinements (Discourse editor, Pill navigation bars, glyph buttons) ✅
- Decaying memories/discourses to forgotten, buried in the Deep-soup (can bring it back intentionally) “Nothing is destroys in the abyss, it may forgotten” ✅
- Delta sync - E2EE- Supabase ✅
- Pre made characters - immutable (complex continue creative process)
- Guardian of archives (Highly intelligent reasoning model) - A cold honest Ai lives separately from containers, summoned deliberately.
- Watcher - Ai watches the patterns of discourses, thoughts, notes - Local Vector embeddings - silent observer - Ego/performance/contradiction/incomsistencies detection - Gold pulsing dot surfacing connections/patterns ✅
- Potential - move away from vanilla html5 if pwa limit hits
- Vite
- Nope ❌ - no AppStore or play store, no under some corporate, no ads, no wellness app, no benevolent app, no edgy app, no give away 30% cut

Data architecture:

Phase 1, local foundation

1.  mount OPFS, create nq.db with SQLite WASM

2.  create tables: discourses(id, title, body, updated_at, deleted_at), personas, etc

3.  write migration: copy any test data from IndexedDB once, then disable IndexedDB writes

4.  test kill Safari, reopen, data persists

Phase 2, crypto

5.  bring AES-GCM from QuantumSanctuary, make encryptJSON(obj) and decryptJSON(str)

6.  add WebAuthn prf, derive key on first unlock, keep in memory only

7.  test encrypt and decrypt one discourse, no cloud yet

Phase 3, sync layer delta

8.  create Supabase table sync_discourses with id text, updated_at bigint, deleted_at bigint, data_enc text

9.  write syncPush(discourse): if deleted_at set, encrypt empty payload, upsert row

10.  write syncPull(since): fetch rows where updated_at > since, for each, if deleted_at then delete locally, else decrypt and upsert locally

11.  store last_sync timestamp in local settings

Phase 4, wiring

12.  hook saveDiscourse to call syncPush after local write

13.  hook deleteDiscourse to set deleted_at, then syncPush

14.  on app start, run syncPull(last_sync)

Phase 5, cold backup

15.  weekly job: export nq.db, encrypt to .nq, upload to R2, not for daily sync

**More organised map for you**

- Truth lives in OPFS SQLite only
- Cloud is just encrypted rows, never a full file
- Deletes are soft first, hard later
- Key never leaves device, derived by WebAuthn prf
- Supabase handles delta automatically because you push per row
- R2 handles disaster recovery, not sync

---

Way into future, like when the NQ get stabilised and officially enter the polishing stage before we think of monetising. It's just an option of map in the lighthouse table that could either we change or pick it up along the path. Question is.. they align with our life long personal project of myself that live as a metacognition uncomfortable personal space of mine for years if I survive lol then it survives years of digital and world transformation too.

- Tauri
- P2P Syncing (GunDB/Waku), web assembly? Rust?Rust’s `ring` or `rust-crypto` libraries
- Open to evolving without bending the honest compass.

---

Optional no pressure monetisation:

1. **The Vessel Fee:** Subscription for the interface (your income/time).
2. **BYOK:** Users power their own discourse (their sovereignty).
3. Free monthly renewable access for users who can't afford. BYOK. Simple form No proof asked. If someone hesitate to ask me access then this uncomfortable platform not for them. 
4. **The Communal Well:** A proxy key for the "keyless" funded by your "Sanctuary Fund" and user donations.
5. **The Exit:** Data is never a hostage; `.md` and `.pdf` belong to the user.

I’ve built a system that mirrors the "is-ness" you're exploring—it doesn't demand, it doesn't coddle, and it doesn't lie. It just exists for whoever has the fuel or the nerve to ask for it.