# NakedQuantum — Full App Blueprint v1

*Written by Metila with Kaja guidance*

Date: 30 April 2026
Built for: Kaja, iPhone 14, one human at a time

## 0. Vision
NakedQuantum merges two personal tools — CosmiOS (folder archive) and Quantum Sanctuary (character chat) — into one organism. Not a productivity app. Not wellness. A place that is accurate. Sometimes it cuts, sometimes it smiles, never apologizes. The goal is to fund one person's time to walk their own path. If a few hundred people find it useful, enough. If none, still enough.

## 1. Core Principles
- Accurate over comfortable. No cold performance, no warm coddling.
- Sovereignty absolute. Data lives on device, encrypted, key never leaves.
- One way flow. Sanctuary → Soup. Never back.
- Nothing is destroyed, maybe forgotten. Decaying memories, Deep Soup, Void.
- No App Store, no ads, no investors, no dopamine loops.
- Names are intentional: Spark, Discourse, Engram, Watcher, Guardian, Abyss.

## 2. Architecture Foundation
- PWA deployed on Cloudflare Pages. Works offline.
- Storage: OPFS with SQLite WASM. Single source of truth: nq.db
- Crypto: AES-GCM. Key derived via WebAuthn prf, held in memory only. User can copy backup key. Loss = unrecoverable by design.
- Sync: Supabase per-row encrypted deltas. Last-write-wins by updated_at.
- Cold backup: weekly encrypted .nq to Cloudflare R2.
- Export: .md, .pdf, .docx, .html, .json, .nq

## 3. The Realms
**Sanctuary** — live, private, unobserved. Where you write, chat, encounter.
**Soup** — archive. Where you Engram. Watcher and Guardian live here only.
**Guardian Realm** — third page, summoned deliberately. Not a chat, an oracle.
**Deep Soup** — depth under Soup. Holds forgotten items after decay.
**Void** — soft delete holding area. Restorable, purged everywhere on permanent delete.

## 4. Sanctuary Features
- Sparks: quick notes. Create instantly, edit later, no structure required.
- Discourses: full editor with markdown support. Where longer pieces live before Engram.
- Characters: 
  - Top horizontal strip: Immutable Entities (IE) — gold border, sigil, locked.
  - Below: Custom personas — plain cards, editable, deletable.
- Memory Vault: lives in Sanctuary. Stores per-character memory snippets, not accessible to Watcher.
- Persona Room: selector and chat interface for both custom and IE.
- Privacy: Watcher and Guardian have zero access. No embeddings, no analysis.

## 5. Engram — The Central Ritual
- Trigger only inside Soup. Tap Engram → tall bottom sheet modal (90% height).
- Sections: Recent (last 3), Immutables, Customs. Sticky search filters all.
- Choose destination character and folder. Folder pre-filled with character name, editable for nesting.
- IE names are locked. Customs names editable.
- Confirm → discourse moves from Sanctuary to Soup, source deleted locally. One way only.
- Engram is deliberate consent. No accidental archiving.

## 6. Soup Features
— Soup Features needs complete rewrite. The folder-based archive with Gold Thread side drawer is gone. Replace with:
- Flat mesh grid — all items (folders, sparks, chronicles, discourses) exist at root level simultaneously
- RPG cards — equal size, glyph differentiation (▤ folder, ◇ spark, ○ chronicle, ◈ discourse)
- Three-tier focus mechanic — tap card → tier1 direct children pull to top, tier2 siblings stay visible, tier3 unrelated fade to 0.25
- Nested folders render as thick stacked cards with count badge — inject dynamically on parent focus
- Chain of Path Knots — replaces breadcrumb, records focus journey as scrollable gold thread with knots, ghost knot hints at depth ahead
- Gravity system — invisible weight score: +1 open, +2 edit, -1 per 7 days untouched. Sorts mesh order
- Favourites — gold dot pinprick on card, always floats to top
- 30-day decay — unfavourited items untouched for 30 days silently move to Deep Soup on next render
- Creation card — always first, dashed border, opens create menu (folder/spark/chronicle/discourse)
- Long press — vertical quick action menu (preview, rename, move, burn, convert to chronicle for sparks)

## 7. Deep Soup
- Holds forgotten items. Not deleted, just out of sight.
- Accessible via toggle in Soup. Shows faded cards.
- Opening a forgotten item resurrects it instantly — updated_at reset, returns to Active.
- No motes, no particles. Performance over romance.

## 8. Void
- Soft delete destination for discourses, sparks, folders.
- Items stay forever until user purges manually. Future: optional 60-day reminder dialog.
- Restorable with one tap — returns to original location in Soup.
- Permanent purge deletes from OPFS, Supabase sync, and marks for exclusion from next R2 backup. No recovery.

## 9. Watcher
- Local vector embeddings using Transformers.js on main thread with shadow queue.
- What it does:
  - Embeds every saved discourse and spark on save (title weighted higher than body)
  - Stores normalized vector + hash in IndexedDB for speed
  - Runs similarity pass every ~20 hours during idle
  - Finds geometric matches across time, surfaces as gold pulsing dot near wordmark
- Where it runs: Soup only. Never touches Sanctuary, Deep Soup, Void, or Guardian logs.
- Purpose: cold math. Shows contradictions and repetitions without judgment.

## 10. Guardian
- Third realm, invoked by header glyph. Deliberate summon only.
- Reads everything Active and Fading in Soup. Ignores Deep Soup and Void.
- Two-stage pipeline:
  1. Cheap model summarizes each discourse to one paragraph
  2. Reasoning model (BYOK) receives all summaries + Watcher clusters, responds once
- Output saved as immutable guardian_log in its own vault. Cannot be Engrammed, cannot be edited.
- Silence is valid response. No conversation, single reflection per summon.
- BYOK only. User selects model in Settings.

## 11. Immutable Entities (IE)
- Curated locked characters. See separate IE Blueprint v1 for full spec.
- Live in Sanctuary top strip and IE page (∞). Deck card style, sigil left, gold border.
- Chats are private until Engrammed. Multi-model variants pinned per IE.

## 12. Memory Vault
- Per-character memory store in Sanctuary.
- Holds key facts user chooses to persist across chats. Not automatic.
- Never synced to Watcher or Guardian. Purely for character continuity.

## 13. Mosaic
- Experimental feature inside discourse editor.
- Extracts themes, quotes, and connections from the current discourse.
- Shown as inline chips. Early stage, subject to refinement.

## 14. Gold tether knots
- Chronological path knots 
- Tether lines run from the parent to the connections 

## 15. Data Model (OPFS SQLite)
Tables:
- discourses (id, title, body, folder_id, created_at, updated_at, decay_phase)
- sparks (id, body, created_at, updated_at, decay_phase)
- folders (id, name, parent_id, created_at, updated_at)
- personas (id, name, system_prompt, created_at, updated_at)
- immutable_entities (see IE blueprint)
- guardian_logs (id, invoked_at, model_used, soup_snapshot_count, response_text, was_silent)
- watcher_embeddings (id, item_id, item_type, vector_hash, created_at)
- sync_meta (last_sync, device_id)
- settings (key, value)

## 16. Encryption and Sovereignty
- All tables encrypted at rest via AES-GCM.
- Key = WebAuthn prf derived, never stored. Backup key export available in Settings.
- If key lost, data is cryptographically unrecoverable. This is intentional.
- Sync payloads are encrypted blobs. Supabase never sees plaintext.

## 17. Sync and Backup Flow
- On save: write locally → encrypt → syncPush to Supabase
- On start: syncPull since last_sync → decrypt → upsert locally
- Delete: set deleted_at → syncPush tombstone → local purge after Void empty
- Weekly: export nq.db → encrypt to .nq → upload to R2

## 18. Exports and Exit
- Any discourse, spark, or folder can export to .md, .pdf, .docx, .html, .json
- Full vault export creates .nq bundle with decryptor
- Data page always accessible, even in read-only mode

## 19. UI Language
    Black: #000, gold #c8a050, white #ffffff for active elements, muted #6b6560 for passive
-  Cards: 120px fixed height, 12px radius, auto-fill minmax clamp(80px, 22vw, 160px) grid
-  Gold SVG threads connect focused cards to chain knots — one continuous visual language

## 20. Monetisation Model
- Vessel Fee: monthly subscription for the interface. Pays for your time.
- BYOK: user brings own API keys for AI features. Sovereignty preserved.
- Communal Well: donation-funded proxy keys for users who cannot afford. No proof required, simple form.
- Read-only mode: if subscription lapses, cannot create new sparks, discourses, or chats. Can view everything and export anytime. No data loss, no urgency.
- No ads. No tracking. No bending for market.

## 21. Future Horizon (not now)
- Tauri desktop build when PWA limits hit
- Rust core for Watcher embeddings to reduce memory
- P2P sync via Waku or GunDB for fully serverless option
- Keep same principles, just faster and more sovereign

## 22. What Not To Build
- No pins, no favorites, no streaks
- No social sharing, no collaboration
- No wellness prompts, no gamification
- No AI that comforts or judges in Sanctuary
- No editing of IE, Guardian logs, or past Engrams
- No horizontal folder scroll
- No separate section headers (Folders / Sparks / Chronicles)
- No bottom action bar (replaced by quick action menu)

---
This is the complete map. Every feature exists to serve accuracy, not engagement. Build to this, and NakedQuantum stays true to its compass.