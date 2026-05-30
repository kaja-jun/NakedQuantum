# NakedQuantum — App Blueprint v2

*Living map for Kaja + co-creator agents. Supersedes **Full App Blueprint v1** (30 April 2026).*

**Last updated:** 26 May 2026  
**Built for:** One human at a time — iPhone-first PWA, zero npm, sovereign local-first.

---

## 0. How to use this document

| When | Read |
|------|------|
| New feature / realm design | §1 vision, §3 realms, §6–§12 features |
| Before coding | Pinned sub-blueprint if one exists (§2 index) |
| Agent handoff | §15 **Shipped log** + `NakedQuantum-checkpoint-2026-05.md` §7 queue |
| Production ship | `NakedQuantum-checkpoint-2026-05.md` §5 P0 (`NQ_DEV_MODE`, worker deploy, thresholds) |

**Rules (unchanged):** accurate over comfortable, Sanctuary blind to Trio (Watcher / Cartographer / Guardian), blueprint-first, one batch per PR, no bundler without explicit approval.

---

## 1. Vision

NakedQuantum merges **CosmiOS** (archive / Soup) and **Quantum Sanctuary** (characters / chat) into one soverign fortress. Not productivity. Not wellness. A tiny universe that is **accurate** — sometimes it cuts, sometimes it smiles, never apologizes.

**I dont claim building a conscious AI brain**

**North star (quest):** *An obsessive, meta-meta-cognitive exoskeleton.* Possible as **practice** + three closed loops — see **`consciousness-exoskeleton-roadmap-blueprint.md`**

*"NakedQuantum is an epistemic asymptote. We do not promise consciousness; we build the telescope. The goal of the 'Consciousness Exoskeleton' is inward-facing—an engineering discipline for the builder, not a marketing claim for the user. By aiming for the impossible limit of structural honesty, we accidentally invent the mechanisms (Synapse, Void, Bridges) that the market didn't know it needed. We do not compete with note-taking apps; we compete with the human capacity for self-deception."*

**Compass:** fund one person's time to walk their own path. A few hundred kindred souls is enough; zero is still enough.

---

## 2. Document index (pinned contracts)

| Document | Scope |
|----------|--------|
| **`NakedQuantum-app-blueprint.md`** (this file) | Product-wide architecture, realms, data, UI language |
| **`NakedQuantum-quantum-fortress.md`** | Security pipeline (8 layers + PWA shell); **§18 phased contract**, **§18.7–18.8** migration + Meta crosswalk |
| `consciousness-exoskeleton-roadmap-blueprint.md` | Vision → three loops → phased exoskeleton (philosophy, not fantasy) |
| `NakedQuantum-checkpoint-2026-05.md` | Code review base, risks, **what to do next** |
| `guardian-refinement-roadmap-blueprint.md` | Guardian G0–G6, Cartographer C1–C8 — **Track A strip retired** (see RETIRED.md) |
| `witness-loop-upgrade-blueprint.md` | Synapse loop W1–W6 shipped; **WP1–WP8** witness panel (idea layer) |
| `witness-panel-blueprint.md` | Thinking surface + **Review gate** (replaces Summon ritual when WP7 ships) |
| `witness-weather-blueprint.md` | Atmospheric weather + witness cues (`witness-weather.js` — idea layer, post-WP2) |
| **`app-architecture-split-blueprint.md`** | Phased `app.js` extraction S0–S6 (`witness-synapse.js` S1 shipped) |
| `craft-layer-blueprint.md` | Lighthouse per-discourse writing help — voice brief, witness firewall |
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

- **PWA** on Cloudflare Pages (**interim shell** — **Tauri desktop** is the next vessel; see `lighthouse-cockpit-blueprint.md`). **No build step**, no `package.json` dependencies.
- **Shell:** `index.html` (markup only).
- **Logic:** `app.js` (~10.6k lines) — DB worker, realms, sync, crypto hooks; **`witness-synapse.js`** (~1.3k) — synapse, SUBSTRATE, ledger, bridges, tier-4 wire (S1).
- **Witness weather:** `witness-weather.js` — atmospheric cues (S0).
- **NLP / fast maps:** `cartographer.js` ES module (`CARTO_VERSION = 5`).
- **Styles:** `app.css` (~2.6k lines).
- **Offline:** `sw.js` cache `nq-v19`; network-first for `app.js` / `app.css`.
- **Guardian summon:** BYOK OpenRouter only (auto-invoke strip worker retired — `workers/guardian-invoke/RETIRED.md`).

### 4.2 Storage

| Layer | Role |
|-------|------|
| **OPFS + sql.js WASM** | Primary `nq.db` — folders, discourses, characters, guardian logs, fast maps |
| **IndexedDB `nq_watcher`** | Embedding vectors + similarity links (speed) |
| **localStorage** | Settings, sovereign flags, Guardian invoke clocks |
| **Optional Supabase** | Per-row encrypted deltas (BYOK URL + anon key in Settings) |
| **Optional R2 (Akashic)** | Cold backup via worker — **interim plaintext JSON** until client `.nq` E2EE ships |

### 4.3 Crypto & sync

- **Full pipeline:** **`NakedQuantum-quantum-fortress.md`** — eight layers, honest gaps, **§18 what to do when**, **§18.7 ledger migration (deferred)**.
- **Shippable for PWA phase; not perfect** — Layer 4 gaps + Akashic interim documented; Tauri thickens walls later.
- **AES-GCM** at rest when encryption path enabled; WebAuthn **PRF** derives key (memory only).
- **Supabase:** E2EE delta sync (`data_enc`). - **Akashic/R2:** cold backup — not client-E2EE yet (update fortress when `.nq` upload -
- **Ledger Integrity** (Local Hash Chain): Sequential HMAC SHA-256 hashing on  guardian_logs  and  bridge_rows . Enforces meta-meta honesty by making the Witness Ledger tamper-evident. If the vault is manually altered, the chain fractures, and the Guardian reports the structural anomaly rather than reading the ghost.
- **Backup key** export in Settings — user responsibility.
- **Exports:** `.md`, `.pdf`, `.docx`, `.html`, `.json` (see Data realm).

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
| `view-guardian` | **Guardian** | Interim: summon + logs; target: witness panel + **Review** (`witness-panel-blueprint.md`) |
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
- **Witness substrate** — `buildSynapseSnapshot`, bridges, ◇ SUBSTRATE; voluntary summon uses posture-ordered archive context.
- Version bumps: `CARTO_VERSION` — remaps when lexicon breaks.

---

## 12. Guardian

*See `guardian-refinement-roadmap-blueprint.md` for historical batch detail. **Auto-invoke strip retired May 2026.** North star: **`witness-panel-blueprint.md`** — loop first, **Review** after the pass (not Summon ritual).*

### Paths (interim on `main`)

| Path | Trigger | Model | Persists |
|------|---------|-------|----------|
| **Summon** | User opens Guardian realm | BYOK OpenRouter | Full log + thread + witness ledger |
| **Follow-up** | User message in session | BYOK | Thread in memory; log on stream end |
| **Witness field** | Local directive (revisit, tint, etc.) | No LLM | `guardian_logs` directive rows |

**Target (WP1–WP7):** threshold-fired witness pass → visible thinking surface → optional **Review** to extend while Guardian has something to add; ends in **silence + disabled Review** when exhausted (no nag copy). Historical `log_type: summon` rows stay in vault.

### Shipped refinements (G1–G5 + W1–W4)

- Witness ledger (`theory_one_line`), geometry snapshots, tiered summon context (~10k cap).
- W2 wire — posture-ordered archive blocks; ◇ SUBSTRATE; W4 ledger chain.
- W3 substrate honesty — resistance normalize, corpus baseline, bridge prompt on summon.
- UI copy aligned; voluntary summon + invoke gate (`runLocalPass`).

### Retired / not shipping on PWA

- **Track A — Auto strip** + Cloudflare `guardian-invoke` worker (`workers/guardian-invoke/RETIRED.md`).
- **A1–A3** production thresholds, qualifier consensus, strip Settings toggle — **cancelled with strip**.

### Idea layer (not shipped — gate before Cursor)

| Blueprint | Scope |
|-----------|--------|
| **`witness-panel-blueprint.md`** | WP1–WP8 — panel, Review gate, Summon UI removal (WP7), craft suspension (WP8) |
| **`craft-layer-blueprint.md`** | C1–C5 — Lighthouse writing help; witness firewall |

### Deferred

- **G6** Lighthouse desktop cockpit (`lighthouse-cockpit-blueprint.md`).
- **Scoped corpus witness** — user-selected discourse subset for a pass (`witness-panel-blueprint.md` §9).

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

### Craft layer (idea — `craft-layer-blueprint.md`)

- Per-discourse writing help: opinion, improve, grammar, refine, structure — **voice-preserving**, not rewrite.
- Trigger: unobtrusive “work with this piece” control (not Summon / not ◇ SUBSTRATE register).
- **Witness firewall:** craft sessions never enter synapse; witness panel `craft_suspended` while craft is open.
- Desktop: Ollama unlimited iteration; PWA interim BYOK OpenRouter.

---

## 15. Shipped log (high level)

| Milestone | Status | Notes |
|-----------|--------|-------|
| OPFS SQLite + WebAuthn PRF | ✅ | `cosm_*` tables |
| Flat mesh Soup + knots + gravity | ✅ | Replaces folder drawer |
| Watcher + IDB links | ✅ | Soup-only |
| Cartographer C1–C8 (v5) | ✅ | Fast maps |
| Guardian G0–G5 + voluntary summon | ✅ | BYOK; strip retired May 2026 |
| Abyss v0.21 Batch 1+2 + sheet Enter UX | ✅ | PRs #36–#38 |
| Alpha → main accident | ⛔ reverted | PR #41 |
| Auto-invoke strip (A1–A3) | ⛔ retired | witness loop replaces strip |
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
- **Supabase:** row-level encrypted blobs (`data_enc`); last-write-wins on `updated_at`.
- **R2 / Akashic:** cold disaster recovery, not daily sync — **client `.nq` E2EE before upload** (planned; interim plaintext JSON today — see fortress §18).
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

- **Tauri** Desktop (Power Surface): Not just a PWA escape hatch. Driven by: (1) Local Ollama Sidecar (bundled base model + tiered sovereign upgrades), (2) Track B Sentence Matrix (desktop-scale geometry), (3) Background Witness Passes & Local Hash Chains. PWA remains the Reliability Surface.
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
| 2026-05-26 | **`NakedQuantum-quantum-fortress.md`** + §4.3 truth — Supabase E2EE sync; Akashic interim; PWA→Tauri note; §18 phased contract in fortress doc |
| 2026-05-26 | Fortress §18.7 — witness ledger migration / re-anchor ceremony (W4.6 deferred) |
| 2026-05-26 | §12 Guardian — strip retired; paths updated; fortress §18.8 Meta crosswalk |
| 2026-05-26 | Pinned **`craft-layer-blueprint.md`**, **`witness-panel-blueprint.md`**; §12 Review north star; §14 Craft idea layer |
| 2026-05-18 | Pinned **`witness-weather-blueprint.md`** — weather + cues; dismiss=release |

---

*Build to this map and NakedQuantum stays true to its compass. For the next coding batch, start with `nq-review-checkpoint-2026-05.md` §7, then the relevant pinned blueprint.*
