# Abyss v0.21 — Blueprint (pinned)

> **Canonical contract** for fixing the Abyss “honest sky” without becoming a 3D mind-graph product.
>
> **Read with:** `guardian-refinement-roadmap-blueprint.md` (§9 AB track), `nq-review-checkpoint-2026-05.md`, `AGENTS.md`
>
> **Supersedes:** draft `abyss-v0.20` discussion doc. **Two batches** — ship Batch 1, tick + date, re-read this file, then Batch 2.

---

## 0. How to use this document

| Rule | Meaning |
|------|---------|
| **Two batches only** | Batch 1 → merge → tick **Shipped log** → Batch 2. No scope creep mid-batch. |
| **Blueprint first** | If implementation diverges, update **this file** (or PR delta), not only chat. |
| **Zero new npm** | Layout uses existing Watcher vectors + forces. No UMAP/t-SNE in-browser. |
| **Sanctuary blind to Trio** | Watcher, Cartographer, Guardian never read Sanctuary content. Abyss may show **presence only**. |
| **Files touched** | Primarily `app.js` (Abyss engine ~5814+). `index.html` / `app.css` only if AB1 copy needs a host. |

---

## 1. North star

The Abyss is the **only place that sees the whole sovereign app without reading it**.

| Realm | Role |
|-------|------|
| Soup | Where you write |
| Guardian | Where you are witnessed |
| Sanctuary | Where you relate |
| **Abyss** | Shows that all three **exist** — overview, interactive, useful — without fake cartography |

**Not:** Obsidian-style 3D mind graphs, labeled node maps, or Sanctuary surveillance.

**Yes:** A living 2D cosmos — canvas, emerge, neural signals, thread honesty — where **position and phenotype earn meaning** from Watcher + Cartographer, not from hash alone.

---

## 2. What we fix / keep

### Lies to fix

| ID | Lie | Fix (batch) |
|----|-----|-------------|
| **L1** | Hash x/y implies spatial meaning | **M1 + M1b** — force-settle before emerge (Batch 1) |
| **L2** | Every disc-dot looks identical | **M2** — dot DNA from fast map (Batch 1) |
| **L3** | Sanctuary invisible | **M3** — presence dots only (Batch 2) |
| **L4** | Tap disc-dot → sheet immediately | **M4** — tooltip + Enter ◈ (Batch 2) |

### Soul to keep

- Canvas engine, `ABYSS_EMERGE` sequence, neural signals, thread alpha breathing
- Watcher similarity + Cartographer arc **contradiction** threads (real signal)
- Brownian drift, touch repulsion (disc-dots), cluster orbits, touch ripples, guardian ring nodes
- Sheet model for **explicit** Enter and thread detail

### Explicitly unchanged in v0.21

- `abyssHash()` — seed for initial scatter, orphans, Sanctuary
- Guardian nodes — ring language; **no** M2 DNA
- Subconscious discourses — normal `disc-dot` (age-dimmed); no separate species yet
- No navigation to Sanctuary chat from Abyss (header only)
- **AB2** (3D / laptop UMAP snapshot) — **out of scope** (see §12)
- No npm, no re-embed at Abyss open

---

## 3. Code baseline (read before coding)

| Fact | Location |
|------|----------|
| Vectors **already persisted** | IDB `nq_watcher` → `embeddings.vector` (`embedDiscourseMain`) |
| Links persisted | `links` store; scores from `watcherCosine` |
| Abyss link filter **hardcoded 0.73** today | `buildAbyssObjects` ~6020 — must align with `W_SIMILARITY_THRESHOLD` |
| Fast maps in SQL | `guardian_summaries` row, `map_type: 'fast'`, `id === discourse_id` — **not** nested `fast_map` |
| `summariesMap` | Built once per open inside `buildAbyssObjects` try (~5997–6001) |
| `openAbyssView` bug | `abyssEnterTime` set **before** build today — move after settle |
| Cosine helper exists | `watcherCosine(a, b)` ~962 — reuse; do **not** add `cosineSim` |
| Contradiction logic exists | `abyssArcTension` + arc compare ~6035–6037 — extract shared helper |

---

## 4. Batch 1 — Honest sky (layout + phenotype + weather)

**Goal:** First frame after open shows **relationship-organized** Soup dots with **visible geometry**, honest copy, and stable plumbing.

### Batch 1 checklist

#### B1.0 — Plumbing & filters

- [x] Declare `summariesMap = new Map()` at **start** of `buildAbyssObjects` (survives try/catch).
- [x] Load `guardian_summaries` **once** (`getAll`) → fill `summariesMap` **before** disc-dot loop (dedupe today’s double `getAll` if easy).
- [x] Filter active discourses: `!d.isDeleted && !d.deleted_at` (align with Soup elsewhere).
- [x] Add module-level `var abyssWeather = 'neutral'` near other Abyss vars.
- [x] Add `getAbyssLinkThreshold()` — use for **both** thread build and settle link list.
- [x] Extract `abyssArcTension(mapRow)` and `abyssLinkIsContradiction(mapA, mapB)` — used by threads **and** settle.

#### B1.1 — M1 + M1b: `abyssSettle(iterations, strongLinks)`

- [x] New `async function abyssSettle(iterations, strongLinks)` after `buildAbyssObjects` helpers.
- [x] Read vectors: `wdb.getAll('embeddings')` → map `id → vector` (no `watcherEmbedder` call).
- [x] Target only `kind === 'disc-dot'`.
- [x] **Vector springs (M1b):** all pairs with both vectors; `sim = watcherCosine(Float32Array, …)`; rest length `0.15 + (1 - sim) * 0.55`; force scaled by `sim`.
- [x] **Link forces (M1):** for each `strongLinks` entry `{ a, b, score, isContra }`; pull `score * 0.018`, repel `-0.012` if contra.
- [x] **Global repulsion** when `dist < 0.18` (prevent collapse).
- [x] **Orphans** (no vector): skip velocity apply in loop; after settle, rim bias from center.
- [x] **Skip settle** if `discDots.length < 3`.
- [x] **Cap:** if `discDots.length > 80` → `iterations = 100`; sparse pairs `sim > 0.55` when `n > 50`.
- [x] **Yield:** every 20 iterations `await new Promise(r => setTimeout(r, 0))`.
- [x] **Cancel:** if `!abyssRunning` return mid-loop.
- [x] Do **not** settle `sanctuary-presence`, `guardian-node`, anchors, clusters (clusters follow parent).

#### B1.2 — `buildAbyssObjects` + thread build

- [x] Build disc-dots at hash positions (unchanged seed).
- [x] Build `strongLinks` array while creating threads: filter `score >= abyssLinkThreshold`, slice(0, 30), attach `isContra` from shared helper.
- [x] Threads only connect `disc-dot` ↔ `disc-dot` (unchanged).
- [x] Return `{ strongLinks }` for `openAbyssView` → `abyssSettle(200, strongLinks)`.

#### B1.3 — M2: Dot DNA (second pass)

- [x] After `summariesMap` full, loop disc-dots: `buildAbyssDna(summariesMap.get(dot.id))` → attach `dot.dna`.
- [x] Only rows with `map_type === 'fast'`.
- [x] Parse `emotional_arc` if string (same as `abyssArcTension`).
- [ ] DNA fields:

```js
// buildAbyssDna(fm) → defaults if missing
{
  paradox: 0,           // signature.paradox.count
  arcDir: 'flat',       // emotional_arc.direction
  silenceRatio: 0,      // silence_weight.ratio
  dominantTone: 'neutral', // escalating | resolving | charged | neutral
  depersonalLabel: '',  // depersonalisation.label (e.g. Dissolving)
  driftScale: 0.04      // Brownian multiplier (resolved → lower)
}
```

- [ ] Tone rules: `tension_shift > 0.02` → escalating; `< -0.02` → resolving; else if `paradox >= 3` → charged; check depersonalisation for cooler tint when label suggests dissolution/detachment.
- [ ] `driftScale`: resolving ~0.025; escalating ~0.045; default 0.04.

#### B1.4 — `abyssDraw` M2 phenotype

- [x] Replace flat disc-dot block: tone-based RGB, age + emerge alpha.
- [x] `paradox >= 3` → faint double-ring (radii ~4.5, ~7).
- [x] `silenceRatio > 0.1` → multiply `dotAlpha` ~0.75.
- [x] Depersonalisation “dissolving/detached” → nudge RGB cooler (subtle).
- [x] Selected glow ring unchanged.

#### B1.5 — `abyssUpdate` drift scale

- [x] In disc-dot Brownian block: `driftScale` from `obj.dna` (default 0.04).

#### B1.6 — M5: Weather layer

- [x] In `buildAbyssObjects`, after map fill: compute `abyssWeather` from **fast maps only**.
- [x] Collect `emotional_arc.tension_shift`; require **`arcScores.length >= 3`** else stay `neutral`.
- [x] `avg > 0.025` → `charged`; `avg < -0.025` → `resolving`; else `neutral`.
- [x] In spark draw loop: shift `sparkR/G/B` by weather.

#### B1.7 — AB1: Honest labeling

- [x] Subtle copy under Abyss nav (`#abyss-honesty-hint` in `index.html`).
- [x] No modal; one line, low opacity.

#### B1.8 — `openAbyssView` call order

- [x] `abyssRunning = true`
- [x] `await buildAbyssObjects()` → capture `strongLinks`
- [x] `await abyssSettle(200, strongLinks)` (or 100 if large archive)
- [x] **Then** `abyssEnterTime = Date.now()`
- [x] Seed sparks, reset timers, `abyssTick()`
- [x] Remove early `abyssEnterTime` assignment.

#### B1.9 — Validation (Batch 1)

- [x] `node --check app.js`
- [ ] Manual: open Abyss with 5+ embedded discourses — clusters near threads; orphans toward rim.
- [ ] Dev mode: threads appear at 0.50 threshold links, not only 0.73.
- [ ] Fast map missing → neutral dot (legacy look).

---

## 5. Batch 2 — Presence + sovereignty (Sanctuary + interaction)

**Goal:** Whole app visible; user never accidentally leaves the cosmos.

### Batch 2 checklist

#### B2.1 — M3: Sanctuary presence

- [ ] After guardian layer (or end of `buildAbyssObjects` try): `dbGetAll('characters')`.
- [ ] Filter: `!c.is_deleted && !c.isDeleted` (and not soft-deleted).
- [ ] Push `kind: 'sanctuary-presence'`: `id, name, x, y` from `abyssHash(id + 'sanctuary')`, `age` from `updated_at`, `brownianScale: 0.012`, `emergeAt: ABYSS_EMERGE.dots`.
- [ ] **No** Watcher embed, **no** fast map, **no** threads to/from Soup dots.
- [ ] **No** M1/M1b settle on these objects.
- [ ] Optional rim bias same as orphans (keeps them in outer field).

#### B2.2 — `abyssDraw` sanctuary branch

- [ ] Smaller dot (~1.2px), `rgba(78,200,138,…)` bioluminescent green.
- [ ] Slow outer pulse ring; no paradox rings, no arc warmth.

#### B2.3 — `abyssUpdate` sanctuary physics

- [ ] Change guard from `disc-dot` only to:

```js
if (obj.kind === 'disc-dot' || obj.kind === 'sanctuary-presence') {
  var scale = obj.brownianScale || (obj.kind === 'sanctuary-presence' ? 0.012 : ((obj.dna && obj.dna.driftScale) || 0.04));
  // touch repulsion: disc-dot ONLY
}
```

#### B2.4 — M4: Two-step interaction

- [ ] Add `abyssShowDiscTooltip(obj, tapX, tapY)` — title, type, optional `dna.arcDir`, **Enter ◈** button.
- [ ] `enterBtn.onclick = function …` (single handler; **no** duplicate `addEventListener` per tap).
- [ ] Enter → `abyssOpenSheet(obj)` (v0.21 keeps sheet; direct Lighthouse optional later).
- [ ] Add `abyssShowSanctuaryTooltip` — name, Sanctuary label, optional date; **no Enter button**.
- [ ] `abyssTouchEndCore`: `disc-dot` → disc tooltip; `sanctuary-presence` → sanctuary tooltip; guardian/cluster unchanged.
- [ ] Tap canvas void / another node → hide `#abyss-tooltip`.
- [ ] `abyssCloseSheet()` still on tooltip show (sheet not open until Enter).

#### B2.5 — Hit testing

- [ ] Include `sanctuary-presence` in closest-dot loop (~6992) with same radius threshold.

#### B2.6 — Validation (Batch 2)

- [ ] Sanctuary character appears, stiller, green; no threads to Soup.
- [ ] Disc-dot tap shows tooltip; cosmos keeps animating; Enter opens sheet.
- [ ] Guardian node tap still lightweight tooltip only.

---

## 6. Shared implementation notes

### `buildAbyssDna(fm)` (sketch)

```js
function buildAbyssDna(fm) {
  var dna = { paradox: 0, arcDir: 'flat', silenceRatio: 0, dominantTone: 'neutral', depersonalLabel: '', driftScale: 0.04 };
  if (!fm || fm.map_type !== 'fast') return dna;
  var arc = fm.emotional_arc;
  if (typeof arc === 'string') { try { arc = JSON.parse(arc); } catch (e) { arc = null; } }
  var sig = fm.signature;
  if (sig && sig.paradox) dna.paradox = sig.paradox.count || 0;
  if (arc && arc.direction) dna.arcDir = arc.direction;
  if (fm.silence_weight && typeof fm.silence_weight.ratio === 'number') dna.silenceRatio = fm.silence_weight.ratio;
  if (fm.depersonalisation && fm.depersonalisation.label) dna.depersonalLabel = fm.depersonalisation.label;
  var ts = arc && typeof arc.tension_shift === 'number' ? arc.tension_shift : 0;
  if (ts > 0.02) { dna.dominantTone = 'escalating'; dna.driftScale = 0.045; }
  else if (ts < -0.02) { dna.dominantTone = 'resolving'; dna.driftScale = 0.025; }
  else if (dna.paradox >= 3) dna.dominantTone = 'charged';
  return dna;
}
```

### `strongLinks` for settle

Build while iterating watcher links:

```js
strongLinks.push({ a: link.a, b: link.b, score: link.score, isContra: abyssLinkIsContradiction(mapA, mapB) });
```

Pass array to `abyssSettle`; do not rebuild with `isContra: false` placeholder.

### Post-settle live physics

Live `abyssUpdate` thread pulls stay **weaker** than settle. If dots drift back to hash chaos over time, reduce live pull constants slightly in a follow-up — not required for v0.21 if settle + repulsion holds.

### Re-settle policy (v0.21)

**Every `openAbyssView`** — simple, correct when new links/embeds appear. Cache invalidation later if perf demands.

---

## 7. Edge cases

| Case | Behavior |
|------|----------|
| 0 vectors (Watcher never ran) | All orphans → rim nebula; settle skipped; hash cosmos + threads if any stale links |
| 1–2 discourses | Skip settle (`< 3`) |
| User leaves mid-settle | `!abyssRunning` abort |
| No Sanctuary characters | Zero sanctuary objects; fine |
| No fast map for discourse | `dna` defaults; dot looks pre-M2 |
| Only deep map row | Ignored for DNA and weather |
| `summariesMap` try throws | Map still exists; DNA neutral; warn console |
| Many dots (80+) | 100 iterations + yield; optional sparse vector pairs |
| Guardian / cluster tap | Unchanged tooltips |
| Thread tap | `abyssOpenThreadSheet` unchanged |

---

## 8. What NOT to do (v0.21)

- UMAP/t-SNE in PWA or re-embed all discourses on Abyss open
- Threads involving Sanctuary presences
- Guardian reading Sanctuary or Abyss showing chat excerpts
- M2 DNA on guardian nodes
- npm force-layout libraries
- Marketing Abyss as “semantic mind map” without AB1 line
- Sheet on first disc-dot tap (Batch 2 fixes)

---

## 9. Relationship to guardian roadmap §9

| Old AB item | v0.21 |
|-------------|-------|
| **AB1** honest label | Batch 1 (B1.7) |
| **AB2** 3D / UMAP offline | **Deferred** — laptop snapshot when Tauri; not blocking v0.21 |
| **AB3** thread semantics | **Addressed** by M1 settle + existing thread honesty; hash threads no longer *only* signal |

After v0.21 ships, update `guardian-refinement-roadmap-blueprint.md` §9 checkboxes and shipped log.

---

## 10. Recommended implement order (Cursor)

### Batch 1

1. Plumbing (B1.0)  
2. `abyssSettle` + `strongLinks` (B1.1–B1.2)  
3. `openAbyssView` order (B1.8)  
4. `buildAbyssDna` + draw + update drift (B1.3–B1.5)  
5. Weather (B1.6)  
6. AB1 copy (B1.7)  
7. Validate (B1.9)

### Batch 2

1. Sanctuary build + draw + physics (B2.1–B2.3)  
2. Tooltips + touch core (B2.4–B2.5)  
3. Validate (B2.6)

---

## 11. Shipped log

| Item | Date | Notes |
|------|------|-------|
| Blueprint pinned v0.21 | 2026-05-19 | Two batches; code review + v0.20 draft merged |
| **Batch 1** | 2026-05-20 | M1/M1b settle, M2 DNA, M5 weather, AB1 hint, link threshold alignment |
| **Batch 2** | | |

---

*Honest sky first. Presence and sovereignty second. The Abyss earns its place — it does not pretend to be a map.*
