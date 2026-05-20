# NakedQuantum — App Blueprint v2

*Living map for Kaja + co-creator agents. Supersedes **Full App Blueprint v1** (30 April 2026).*

**Last updated:** 20 May 2026  
**Built for:** One human at a time — iPhone-first PWA, zero npm, sovereign local-first.

---

## 0. How to use this document

| When | Read |
|------|------|
| New feature / realm design | §1 vision, §3 realms, §6–§12 features |
| Before coding | Pinned sub-blueprint if one exists (§2 index) |
| Agent handoff | §15 **Shipped log** + `nq-review-checkpoint-2026-05.md` §7 queue |
| Production ship | Checkpoint §5 P0 (`NQ_DEV_MODE`, worker deploy, thresholds) |

**Rules (unchanged):** accurate over comfortable, Sanctuary blind to Trio (Watcher / Cartographer / Guardian), blueprint-first, one batch per PR, no bundler without explicit approval.

---

## 1. Vision

NakedQuantum merges **CosmiOS** (archive / Soup) and **Quantum Sanctuary** (characters / chat) into one organism. Not productivity. Not wellness. A place that is **accurate** — sometimes it cuts, sometimes it smiles, never apologizes.

**Compass:** fund one person's time to walk their own path. A few hundred kindred souls is enough; zero is still enough.

---

## 2. Document index (pinned contracts)

| Document | Scope |
|----------|--------|
| **`NQ blueprint.md`** (this file) | Product-wide architecture, realms, data, UI language |
| `nq-review-checkpoint-2026-05.md` | Code review base, risks, **what to do next** |
| `guardian-refinement-roadmap-blueprint.md` | Guardian G0–G6, Cartographer C1–C8, auto-invoke A1–A3 |
| `abyss-v021-blueprint.md` | Abyss honest sky (settle, DNA, sanctuary presence, sheet UX) |
| `lighthouse-cockpit-blueprint.md` | Desktop Guardian / editor (G6, deferred) |
| `NakedQuantum Roadmap.md` | Historical checklist + monetisation notes |
| `Watcher implementation.md` | Watcher / embeddings notes |
| `AGENTS.md` | Agent runbook (dev server, WebAuthn bypass, lint) |

When a sub-blueprint and this file disagree, **update both** or spell the delta in the PR — not only in chat.

---

## 3. Core principles

- **Accurate over comfortable** — no cold performance, no warm coddling.
- **Sovereignty absolute** — data on device; key derived via WebAuthn PRF; loss is unrecoverable by design.
- **One-way flow** — Sanctuary → Soup via **Engram**. Never back.
- **Nothing destroyed, maybe forgotten** — decay → Deep Soup; soft delete → merged Void/Deep Soup UX.
- **No App Store theatre** — no ads, investors, or dopamine loops.
- **Intentional names** — Spark, Discourse, Chronicle, Engram, Watcher, Cartographer, Guardian, Abyss.

---

## 4. Technical foundation (current)

### 4.1 Deployment & runtime

- **PWA** on Cloudflare Pages. **No build step**, no `package.json` dependencies.
- **Shell:** `index.html` (markup only).
- **Logic:** `app.js` (~10.2k lines) — DB worker, all realms, sync, crypto hooks.
- **NLP / fast maps:** `cartographer.js` ES module (`CARTO_VERSION = 5`).
- **Styles:** `app.css` (~2.6k lines).
- **Offline:** `sw.js` cache `nq-v15`; network-first for `app.js` / `app.css`.
- **Guardian strip:** `workers/guardian-invoke/worker.mjs` (deploy separately from Pages).

### 4.2 Storage

| Layer | Role |
|-------|------|
| **OPFS + sql.js WASM** | Primary `nq.db` — folders, discourses, characters, guardian logs, fast maps |
| **IndexedDB `nq_watcher`** | Embedding vectors + similarity links (speed) |
| **localStorage** | Settings, sovereign flags, Guardian invoke clocks |
| **Optional Supabase** | Per-row encrypted deltas (BYOK URL + anon key in Settings) |
| **Optional R2 (Akashic)** | Weekly cold `.nq` backup |

### 4.3 Crypto & sync

- **AES-GCM** at rest when encryption path enabled; WebAuthn **PRF** derives key (memory only).
- **Backup key** export in Settings — user responsibility.
- **Sync:** encrypt → `syncPush` / `syncPull` by `updated_at`; tombstones via `deleted_at`.
- **Exports:** `.md`, `.pdf`, `.docx`, `.html`, `.json`, `.nq` (see Data realm).

### 4.4 Dev vs production knobs

Several thresholds are **dev-soft** today (`NQ_DEV_MODE = true` in `app.js`): WebAuthn bypass paths, Watcher similarity ~0.50, Guardian cooldown ~6 min, fake strip surface. **Do not ship to strangers until P0 checklist** in `nq-review-checkpoint-2026-05.md`.

---

## 5. The realms (navigation)

| View ID | Name | Role |
|---------|------|------|
| `view-sanctuary` | **Sanctuary** | Live, private — characters, chat, Forge, Memory Vault |
| `view-soup` | **Soup** | Active archive — flat mesh, Engram source |
| `view-lighthouse` | **Lighthouse** | Discourse / Chronicle / Spark editor (post-open) |
| `view-subconscious` | **Deep Soup** | Forgotten items (30-day decay); resurrect on open |
| `view-guardian` | **Guardian** | Deliberate oracle — summon, follow-up, logs |
| `view-abyss` | **Abyss** | Honest sky — Watcher links, fast-map phenotype, presence |
| `view-data` | **Data** | Export, sync, backup, sovereignty tools |
| `view-chat` / `view-persona` / `view-forge` / `view-ie` / `view-memory` | Sanctuary sub-flows | Characters, IE deck, forge, vault |

**Flow law:** Watcher, Cartographer, Guardian read **Soup-active** content only — not Sanctuary chat, not Deep Soup, not Void.

---

## 6. Sanctuary

- **Sparks** (`item_type: 'note'`) — quick capture; `openSparkEditSheet` for edit; mesh glyph ◇.
- **Discourses** — longer writing before Engram; glyph ◈.
- **Chronicles** — external arrivals; glyph ○; distinct Lighthouse placeholder.
- **Characters** — custom personas + **Immutable Entities (IE)** in top strip / ∞ page.
- **Persona room / chat** — multi-model BYOK; sessions private until Engrammed.
- **Memory Vault** — per-character snippets; **never** fed to Watcher or Guardian.
- **Forge** — character photos / sheets; Sanctuary-local.

---

## 7. Soup — flat mesh archive

*Replaces v1 folder-tree + side drawer model.*

- **Flat mesh grid** — folders, sparks, chronicles, discourses at root simultaneously.
- **RPG cards** — ~120px height; glyphs: ▤ folder, ◇ spark, ○ chronicle, ◈ discourse.
- **Three-tier focus** — tap → tier-1 children rise, tier-2 siblings visible, tier-3 fade.
- **Nested folders** — thick stacked card + count badge on parent focus.
- **Chain of Path Knots** — gold thread replaces breadcrumb; records focus journey.
- **Gravity** — `+1` open, `+2` edit, `-1` per 7 days idle; sorts mesh.
- **Favourites** — gold dot pin; float to top *(v1 §22 “no favorites” is obsolete)*.
- **30-day decay** — unfavourited untouched → Deep Soup on next render.
- **Creation card** — dashed first cell → folder / spark / chronicle / discourse.
- **Long press** — quick actions (rename, move, burn, convert spark → chronicle).

---

## 8. Engram — central ritual

- Trigger **only in Soup**. Tall bottom sheet (~90% height).
- Sections: Recent (3), Immutables, Customs; sticky search.
- Pick character + folder (folder defaults to character name).
- Confirm → discourse leaves Sanctuary path into Soup archive; **one-way** consent.
- IE names locked; custom names editable.

---

## 9. Deep Soup & Void

- **Deep Soup** — forgotten, not deleted; faded cards; open → `updated_at` reset → Active.
- **Void** — soft delete; restorable; permanent purge removes OPFS + sync tombstone + R2 exclusion.
- UI: Void merged into Deep Soup page philosophy (“nothing destroyed, maybe forgotten”).

---

## 10. Watcher

- **Local embeddings** — Transformers.js / Xenova on main thread; shadow queue.
- On save (discourse + spark): embed title+body → normalized vector + hash in IDB.
- **Idle similarity pass** (~20h) — links in IDB; gold pulse near wordmark in Soup.
- **Soup only** — never Sanctuary, Deep Soup, Void, Guardian logs.
- **Spark boost** in link scoring — sparks surface in resonance slightly easier.
- Threshold: production ~0.73; dev lower when `NQ_DEV_MODE`.

---

## 11. Cartographer

- **`cartographer.js`** — fast map on save (≥30 words, stale `carto_version`).
- NLP markers + extractive summary + emotional arc + qualifiers.
- Output → `guardian_summaries` (`map_type: 'fast'`, id = discourse id).
- **`checkGuardianTrigger`** — qualifier gate for **strip** path (worker); summon uses tiered context separately.
- Version bumps: `CARTO_VERSION` — remaps when lexicon breaks.

---

## 12. Guardian

*See `guardian-refinement-roadmap-blueprint.md` for batch detail.*

### Three doors

| Path | Trigger | Model | Persists |
|------|---------|-------|----------|
| **A — Strip** | After fast map qualifiers | Cloudflare worker | `guardian_logs` + theory line + geometry snapshot |
| **B — Summon** | User opens Guardian realm | BYOK OpenRouter | Full log + thread + witness ledger |
| **C — Follow-up** | User message in session | BYOK | Thread in memory; log on stream end |

### Shipped refinements (G1–G5)

- Witness ledger (`theory_one_line`), geometry snapshots, tiered summon context (~10k cap).
- Tier 2 watcher links carry `divergenceNote`; strip gets `priorTheoryLine` (worker redeploy).
- UI copy aligned; prior theory stripped from summon block where specified.

### Not shipped (intentional)

- **A1–A3** production thresholds, qualifier consensus, auto-invoke ethics.
- **A2** Settings toggle + onboarding for auto strip.
- **G6** Lighthouse desktop cockpit.

---

## 13. Abyss (v0.21 shipped)

*Detail: `abyss-v021-blueprint.md`.*

- **2D canvas cosmos** — not a 3D mind map; hash seed + **force settle** from Watcher links before emerge.
- **Disc-dot DNA** — phenotype from fast map (arc, paradox, silence, drift).
- **Weather** on sparks — light motion cue from map signals.
- **Sanctuary presence** — green still dots (characters exist; **no** chat excerpts, no threads).
- **Interaction (post #38):**
  - Tap **content dot** → bottom sheet (type, excerpt, echoes).
  - **Enter ◈** in sheet → Lighthouse for discourse/chronicle; **Spark edit sheet** for `note`.
  - Type badge: **SPARK NOTE** (not generic NOTE).
  - Sanctuary / guardian / cluster → lightweight tooltip only.
- **AB1** honesty hint under nav — shipped.
- **Out of scope:** in-browser UMAP, Sanctuary chat from Abyss, npm layout libs.

---

## 14. Lighthouse (editor)

- Unified textarea flow; title/meta/mosaic display.
- **Chronicle** / **Spark** / **Discourse** placeholders and meta labels differ.
- **Mosaic** — experimental inline anchors from discourse (early).
- Opened from Soup mesh, search, Guardian links, or **Abyss Enter**.

---

## 15. Shipped log (high level)

| Milestone | Status | Notes |
|-----------|--------|-------|
| OPFS SQLite + WebAuthn PRF | ✅ | `cosm_*` tables |
| Flat mesh Soup + knots + gravity | ✅ | Replaces folder drawer |
| Watcher + IDB links | ✅ | Soup-only |
| Cartographer C1–C8 (v5) | ✅ | Fast maps |
| Guardian G0–G5 + strip worker | ✅ | BYOK summon |
| Abyss v0.21 Batch 1+2 + sheet Enter UX | ✅ | PRs #36–#38 |
| Alpha → main accident | ⛔ reverted | PR #41 |
| Auto-invoke production ethics (A1–A3) | ⏳ | Waiting |
| Custom glyphs | ⏳ | Kaja art pass |
| Onboarding `?` blueprint | ⏳ | |
| `app.js` module split / Tauri | ⏳ | ARCH / G6 |

*Tick sub-blueprints when merging batches — this table is the executive summary.*

---

## 16. Data model (OPFS)

**Unified content table** — sparks are not a separate table:

### `cosm_discourses`

| Column | Notes |
|--------|-------|
| `id` | UUID |
| `title`, `raw_text` | Body |
| `folder_id` | Nullable; mesh nesting |
| `item_type` | `discourse` \| `note` (spark) \| `chronicle` |
| `created_at`, `updated_at` | Decay + gravity |
| `is_deleted`, `deleted_at` | Soft delete |
| `is_favourite`, `gravity` | Mesh ordering |
| `source_link` | Engram / backlink |

### Other core tables

- `cosm_folders` — name, parent_id, soft delete
- `characters` — Sanctuary personas
- `immutable_entities` — IE spec (see IE docs)
- `guardian_logs` — invoke metadata, response, thread JSON, `theory_one_line`, geometry
- `guardian_summaries` — fast/deep maps keyed by discourse id
- `cosm_mosaic_tiles`, `cosm_backlinks`, `history`
- `*_enc` variants when encryption enabled
- Settings / sync meta via app settings stores

**Watcher vectors** live in IndexedDB (`embeddings`, `links`), not SQL.

*v1 separate `sparks` table is obsolete.*

---

## 17. Encryption, sync, backup

- Encrypt on write when enabled → `*_enc` tables.
- **Supabase:** row-level encrypted blobs; last-write-wins on `updated_at`.
- **R2:** weekly encrypted `.nq`; disaster recovery, not daily sync.
- **Read-only lapse** (future monetisation): view + export always; no new writes.

---

## 18. UI language

- **Palette:** black `#000`, gold `#c8a050`, text white, muted `#6b6560`.
- **Cards:** ~120px height, 12px radius, responsive `minmax` grid.
- **Gold SVG threads** — focus chain knots; continuous with Abyss accent language.
- **Glyphs** — minimal unicode set today; custom SVG glyphs on horizon.

---

## 19. Monetisation (unchanged intent)

1. **Vessel Fee** — subscription for the interface.
2. **BYOK** — user API keys for AI; sovereignty preserved.
3. **Communal Well** — simple form, no proof; renewable access.
4. **Exit** — export always; read-only after lapse, no hostage data.

No ads, SEO theatre, or performance marketing.

---

## 20. Future horizon

- **Tauri** desktop when PWA limits bite (`lighthouse-cockpit-blueprint.md`).
- Rust / WASM for Watcher perf.
- Optional P2P sync (Waku / GunDB) — same principles.
- **AB2** — optional 3D / UMAP snapshot for laptop; not in v0.21 PWA.

---

## 21. What not to build

- Social, collaboration, streaks, wellness prompts.
- AI comfort/judgment in Sanctuary chat.
- Editing IE definitions, Guardian logs, or completed Engrams.
- Guardian reading Sanctuary or dumping all deep maps on summon.
- Bundler/npm without explicit approval.
- Marketing Abyss as “semantic mind map” without honesty copy.
- Horizontal folder-only navigation or separate section headers (Folders / Sparks / …) — **mesh replaced that**.

---

## 22. Revision log

| Date | Change |
|------|--------|
| 2026-04-30 | v1 — Metila + Kaja initial full map |
| 2026-05-20 | **v2** — Mesh Soup, unified `cosm_discourses`, Cartographer v5, Guardian G1–G5, Abyss v0.21, file split, document index, shipped log; removed obsolete anti-favorites line |

---

*Build to this map and NakedQuantum stays true to its compass. For the next coding batch, start with `nq-review-checkpoint-2026-05.md` §7, then the relevant pinned blueprint.*
