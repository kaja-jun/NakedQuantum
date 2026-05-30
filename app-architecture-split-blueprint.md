# NakedQuantum — App Architecture Split Blueprint

*Phased extraction of `app.js` into native ES modules / standalone scripts — zero npm, no bundler.*

**Last updated:** 30 May 2026  
**Status:** Active contract — S3 shipped  
**Base:** ~7.5k lines `app.js` + ~1.3k `witness-synapse.js` + ~1.8k `abyss.js` + ~1.35k `guardian.js` · PWA iPhone-first · Tauri later (same files, thicker shell)

---

## 0. One sentence

Split the monolith by **witness loop boundaries**, not by realms — each phase is one PR, smoke tests green, zero behavior change.

---

## 1. Why now (not only laptop)

| Old gate | New truth |
|----------|-----------|
| Wait for Tauri | Cursor + dogfood need readable files **now** |
| One oneness file | `cartographer.js` + `witness-weather.js` already prove the pattern |
| Big-bang rewrite | **Phased cut** — witness first, abyss second, shell last |

Laptop adds Tauri + Ollama shell; it does **not** require a 12k-line single file.

---

## 2. Rules (non-negotiable)

| Rule | Meaning |
|------|---------|
| **Zero npm** | Native `<script>` load order or `type="module"` later — no Webpack/Vite unless Kaja gates |
| **One phase = one PR** | Smoke test + manual dogfood before next phase |
| **Zero behavior change** | Extract + wire only; no feature creep in split passes |
| **Globals OK for S1–S4** | `witness-synapse.js` loads **after** `app.js`; uses existing global `dbGet`, `getDiscourses`, etc. |
| **Modules later** | S5+ may introduce `type="module"` entry when DB worker splits |
| **Worker last** | Inline SQL worker string stays in `app.js` until **S6** |
| **Blueprint first** | Update this doc shipped log when a phase lands |

---

## 3. Target map

| Phase | File | Scope | ~lines | Status |
|-------|------|-------|--------|--------|
| **S0** | `witness-weather.js` | Weather + cues matrix | 600 | ☑ shipped |
| **S1** | `witness-synapse.js` | Synapse, SUBSTRATE, ledger, bridges, wire tiers, weather UI hooks | ~1.3k | ☑ shipped |
| **S2** | `abyss.js` | Canvas engine + interaction | ~1.8k | ☑ shipped |
| **S3** | `guardian.js` | Summon, logs, archive assembly, settings | ~1.35k | ☑ shipped |
| **S4** | `watcher.js` | Embeddings shadow queue + LED strip | ~1.5k | ☐ |
| **S5** | `nq-crypto.js` | Sovereign key, WebAuthn helpers, secure storage | ~400 | ☐ |
| **S6** | `nq-db.js` | Worker blob + db helpers | ~800 | ☐ |
| **Shell** | `app.js` | Realms, Soup, Sanctuary, Lighthouse, init, routing | ~3k target | ongoing |

**Existing modules (unchanged):** `cartographer.js`, `witness-weather.js`, `sw.js`

---

## 4. S1 — `witness-synapse.js` (detail)

### 4.1 Includes

- `computeCorpusTermArcs` + corpus tier formatters used by wire
- `computeReturnDetections` (corpus return hits — witness geometry)
- Synapse: `buildSynapseSnapshot`, `runLocalPass`, posture, half-life, resurgent
- Ledger: HMAC chain append/verify/reset
- Bridges: open/close/relapse, SUBSTRATE panel, weather status line
- Wire: `buildWitnessTier4Blocks`, `assembleGuardianTier4`, posture profiles
- Bridge prompt UI: `showWitnessSummonBridgePrompt`, `handleWitnessBridgeAction`
- `dogfoodWitnessWeather` console hook

### 4.2 Stays in `app.js` (S1)

- `buildGeometrySnapshot` (Guardian helper — S3 candidate)
- `summonGuardian`, stream, log save (S3)
- DB worker, realms, init
- `parseFastMapKeyTermStrings` and shared Guardian fast-map helpers above corpus block

### 4.3 Load order (`index.html`)

```html
<script src="witness-weather.js?v=…"></script>
<script src="app.js?v=…"></script>
<script src="witness-synapse.js?v=…"></script>
```

`witness-synapse.js` runs **after** `app.js` so globals (`dbGet`, `escHtml`, `NQ_DEV_MODE`, …) exist.

### 4.4 Acceptance

- [x] `node --check witness-synapse.js app.js`
- [x] `node scripts/exoskeleton-smoke-test.mjs` passes
- [ ] SUBSTRATE + ledger + weather unchanged in dogfood (User Zero)
- [ ] Summon + tier-4 archive order unchanged (User Zero)

---

## 5. S2 — `abyss.js` (detail)

### 5.1 Includes

- Canvas loop: `abyssTick`, `abyssUpdate`, `abyssDraw`, settle physics
- Object build: `buildAbyssObjects`, DNA/weather/hash helpers
- Interaction: touch/mouse, sheet, tooltip, thread sheet
- Entry: `openAbyssView()`; lifecycle: `abyssStop()`, `abyssCloseSheet()`
- Tint (display): `refreshAbyssActiveTint`, `normalizeAbyssTintDirective`, `abyssDotMatchesActiveTint`, `abyssTintRgb`

### 5.2 Stays in `app.js` (S2)

- Realm routing: `showPanel` calls `abyssStop()` / `abyssCloseSheet()`; `btn-abyss-back` wiring
- `soupSurfaceBoost`, `watcherFocusActive`, `getWatcherSimilarityThreshold()` — relocated near Watcher block (Soup/S4 boundary)
- `deriveAbyssTintDirective()` — Guardian directive derivation (S3)
- `parseFastMapKeyTermStrings()` — shared fast-map helper

### 5.3 Load order (`index.html`)

```html
<script src="witness-weather.js?v=…"></script>
<script src="app.js?v=…"></script>
<script src="witness-synapse.js?v=…"></script>
<script src="abyss.js?v=…"></script>
```

### 5.4 Acceptance

- [x] `node --check abyss.js app.js`
- [x] `node scripts/exoskeleton-smoke-test.mjs` passes
- [ ] Abyss open / sheet / back unchanged in dogfood (User Zero)
- [ ] Guardian directive tint on disc-dots unchanged after witness field log (User Zero)

---

## 6. S3 — `guardian.js` (detail)

### 6.1 Includes

- System prompt, summon stream, log save, follow-up exchange
- Archive assembly: `buildGuardianContext`, tier-1–4 blocks, prior witness / ledger compact
- Geometry + theory line helpers, prediction scoring on save
- Directive derivation + refresh (`abyss_tint`, `soup_surface`, `watcher_focus`, revisit)
- Guardian view UI: `openGuardianView`, settings modal, logs list/detail
- `runDailyRevisitCheck`, `initGuardianModel`

### 6.2 Stays in `app.js` (S3)

- Realm routing: `showPanel` guardian teardown, header `openGuardianView` wiring
- `generateFastMap` — calls `scoreGuardianPredictionsOnSave` global from `guardian.js`
- `selectUrgentDiscourses` — shared with Cartographer deep-map pass
- `discourseHasPersistentOrbit` — Soup mesh gravity (not Guardian-only)
- DB schema migrations for `guardian_logs` / `guardian_summaries`
- Event bindings in init (summon button, settings, logs overlay)

### 6.3 Load order (`index.html`)

```html
<script src="witness-weather.js?v=…"></script>
<script src="app.js?v=…"></script>
<script src="witness-synapse.js?v=…"></script>
<script src="abyss.js?v=…"></script>
<script src="guardian.js?v=…"></script>
```

`guardian.js` runs **after** `witness-synapse.js` (wire tiers, ledger, bridge prompt) and `abyss.js` (tint refresh).

### 6.4 Acceptance

- [x] `node --check guardian.js app.js`
- [x] `node scripts/exoskeleton-smoke-test.mjs` passes
- [ ] Summon + tier-4 archive order unchanged in dogfood (User Zero)
- [ ] Directive side-effects (Abyss tint, Soup boost, Watcher focus) unchanged after witness field log

---

## 7. Future phases (sketch)

**S4 watcher.js** — embeddings shadow queue + LED strip.

**S6 nq-db.js** — worker blob extraction; highest regression risk; do last.

---

## 8. Before laptop (companion work — not split)

| Item | Blueprint | Status |
|------|-----------|--------|
| Half-life stopword filter | witness-loop / SUBSTRATE honesty | ☑ `isWitnessCorpusNoiseTerm` in `witness-synapse.js` |
| SUBSTRATE saccade line | witness-panel WP2 subset | ☑ `formatSubstrateSaccadeLine` in SUBSTRATE render |
| Desktop vessel | `desktop-vessel-blueprint.md` | ☑ pinned |
| WP1 threshold engine | console-only, no panel UI | ☑ `dogfoodWitnessThresholds()` |

---

## 9. Shipped log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-05-18 | **Blueprint pinned** | S0–S6 map; S1 load-order contract |
| 2026-05-18 | **S1** | `witness-synapse.js` — corpus arcs, synapse, ledger, bridges, SUBSTRATE, wire tiers; cache `nq-v19` |
| 2026-05-18 | **Pre-laptop backlog** | Stopword filter, SUBSTRATE saccade, WP1 console thresholds, `desktop-vessel-blueprint.md`; cache `nq-v20` |
| 2026-05-30 | **S2** | `abyss.js` — canvas engine, interaction, active tint; Soup/Watcher vars relocated in shell; cache `nq-v21` |
| 2026-05-30 | **S3** | `guardian.js` — summon, archive, logs, directives, settings; cache `nq-v22` |

---

*Split the organs. Keep one organism.*
