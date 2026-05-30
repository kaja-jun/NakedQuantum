# NakedQuantum — App Architecture Split Blueprint

*Phased extraction of `app.js` into native ES modules / standalone scripts — zero npm, no bundler.*

**Last updated:** 18 May 2026  
**Status:** Active contract — S1 shipped  
**Base:** ~10.6k lines `app.js` + ~1.3k `witness-synapse.js` · PWA iPhone-first · Tauri later (same files, thicker shell)

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
| **S2** | `abyss.js` | Canvas engine + interaction | ~3.5k | ☐ |
| **S3** | `guardian.js` | Summon, logs, archive assembly, settings | ~2k | ☐ |
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

## 5. Future phases (sketch)

**S2 abyss.js** — `#abyss-canvas` only; export `initAbyss()`, `refreshAbyssTint()`.

**S3 guardian.js** — `#view-guardian`; depends on `NQWitness.*` for synapse/ledger.

**S6 nq-db.js** — worker blob extraction; highest regression risk; do last.

---

## 6. Before laptop (companion work — not split)

| Item | Blueprint |
|------|-----------|
| Half-life stopword filter | witness-loop / SUBSTRATE honesty |
| SUBSTRATE saccade line | witness-panel WP2 subset |
| Desktop vessel | `desktop-vessel-blueprint.md` (TBD pin) |
| WP1 threshold engine | console-only, no panel UI |

---

## 7. Shipped log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-05-18 | **Blueprint pinned** | S0–S6 map; S1 load-order contract |
| 2026-05-18 | **S1** | `witness-synapse.js` — corpus arcs, synapse, ledger, bridges, SUBSTRATE, wire tiers; cache `nq-v19` |

---

*Split the organs. Keep one organism.*
