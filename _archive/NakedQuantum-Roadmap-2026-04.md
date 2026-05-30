# NakedQuantum Roadmap 16/04/26

> **Location:** `_archive/NakedQuantum-Roadmap-2026-04.md` · **Archived:** May 2026  
> **Superseded by:** `NakedQuantum-app-blueprint.md` §15 shipped log · **Keep for:** early checklist + monetisation notes (April 2026).

---
- Type - PWA ✅
- Cloudflare deployment ✅
- IndexedDB ✅
- Foundation - Merge Quantum sanctuary & cosmiOS in one shell -      Discourse engine - Folders - R2 sync ✅
- Zero dependency ✅
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
- Pre made characters - immutable (complex continue creative process) ✅
- Guardian of archives (Highly intelligent reasoning model) - A cold honest Ai lives separately from containers, summoned deliberately. ✅
- Local cartographer uses both nlp js and distil bart cnn sumariser model to feed guardian. ✅
- Fast maps and deep maps ✅
- Local js aka cartographer uses plenty of word markers - NLP ✅
- Watcher - Ai watches the patterns of discourses, thoughts, notes - Local Vector embeddings - silent observer - Ego/performance/contradiction/incomsistencies detection - Gold pulsing dot surfacing connections/patterns - Xenova/bge-base-en-v1.5 109mb ✅
- Removing motes after decay - no functions except philosophy. ✅
- Merging void into Deepsoup page.✅
- Abyss page - holds everything watcher collects, guardian logs etc.. drifts like in dark space if universe.✅
- Security audit ✅
- Drawing custom glyphs
- Onboarding tutorial, Navigation blueprint behind tiny ❓
- Work on UI to make intuitive not easy
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
- web assembly? Rust?Rust’s `ring` or `rust-crypto` libraries
- Open to evolving without bending the honest compass.

---

Optional no pressure monetisation:

1. **The Vessel Fee:** Subscription for the interface (your income/time).
2. Third party subscription platform with key 🔑. No tokens, no payment processors tied to the app.
3. **BYOK:** Users power their own discourse (their sovereignty).
4. No pro, no ultra premium plan gimmicks. No one off licenses.  One subscription plan one app. 
5. Free monthly renewable access for users who can't afford. BYOK. Simple form No proof asked. If someone hesitate to ask me access then this uncomfortable platform not for them. 
6. **The Exit:** Data is never a hostage: Export all button and  `.pdf .html .md`
7. End of subscription: Read only app with always available options to export all data. 

Everyone recommends me different marketing method, which I refused not going to do any performance, download the Reddit again or reading trends or SEO. Finally someone said, a tiny blog, I replied am not good at English writing they said it's even better.. It is true, I need to put a tiny firefly in the abyss otherwise nobody can notice. Monetisation or no users doesn't stop the app. I don't need lots of money not interested tho it is another noise. But some as energy exchange tokens in my path would be nice, even if this helps me work 20 hours instead of selling the Most precious thing in the world ‘Time’ for mindless grind. 

so my crude writing style… 🤔 like fragments and post what I am doing in the app and how it works, my dev story.. if it resonates with someone, they might find the mirror in the abyss. 

---

“I’ve built a system that mirrors the "is-ness" you're exploring—it doesn't demand, it doesn't coddle, and it doesn't lie. It just exists for whoever has the fuel or the nerve to ask for it.”
