# NakedQuantum — Witness Loop Upgrade Blueprint (pinned)

> **Purpose:** Build contract for **synapse-temporal-v1** and beyond — merges the dense multi-model discussion, the three-user stress test (Epictetus / narcissist / young girl in love), and Claude’s **observable → entangle → wire** guard.
>
> **Read with:** `NakedQuantum-intention-blueprint.md` (why), `consciousness-exoskeleton-roadmap-blueprint.md` (shipped Ph 0–3), `guardian-refinement-roadmap-blueprint.md` (Guardian/strip detail), `NakedQuantum-checkpoint-2026-05.md` (code map).
>
> **Author:** Kaja + co-creator passes · **Last updated:** May 2026

---

## 0. How to use this document

| Rule | Meaning |
|------|---------|
| **Intention trace** | Every pass: *“Traceable to intention §___ because ___.”* |
| **48-hour gate** | New mechanics sit in intention §14 Living Q first unless this doc marks them **approved**. |
| **One pass = one PR** | Observable layer per pass when possible — never bridge + posture + invoke in one merge. |
| **Guardian last** | Layers 0–5 read-only in process view before strip/summon behavior changes. |
| **Worker redeploy** | Strip contract changes need `workers/guardian-invoke/` deploy note in PR. |

---

## 1. North star

**Sonar:** *What is the smallest stable explanation of my writing that still preserves the real pattern?*

**Mythril core:** The witness is **temporally patient** — open ledger rows, no charm, no urgency, no need for resolution.

**Edge vs market:** Market analyzes **what you said**. NakedQuantum analyzes **what your map does over time** — orbits, decay, open bridges, blind spots, posture — all **against the user’s map**, never Kaja’s sermon.

**Router (your stress-test insight):** **Posture** shapes **order of truth**, not softer truth.

---

## 2. Architecture (one loop)

```text
WRITE (Abyss)
  → Cartographer fast map + Watcher links
  → buildSynapseSnapshot()          // local, no LLM
        ├─ posture_vector
        ├─ term_arcs + half_life
        ├─ perpetual_orbit_terms
        ├─ open_bridges summary
        ├─ elaboration_delta (if open bridge)
        └─ saccade_log (this pass)
  → runLocalPass(synapse)           // invoke_denied?, graduation_quiet?
  → [if allowed] Guardian strip / summon  // tier ORDER from posture
  → bridge_rows / guardian_logs update
  → field mutation (directives, revisit) — existing Ph 0–3
```

**Do not** add a second app. **Do not** entangle scalars before they are visible.

---

## 3. Ledger: `bridge_rows` (schema — think this before Cursor)

Predictions already use `guardian_logs.prediction_tag` → `prediction_outcome`. **Human correction** gets its own store — same lifecycle idea, different object.

### 3.1 Table: `bridge_rows`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `br_` + timestamp |
| `opened_at` | INTEGER | |
| `source_log_id` | TEXT | Guardian log challenged (nullable) |
| `prior_theory` | TEXT | Witness claim at open |
| `user_action` | TEXT | `correct` \| `reject` \| `withdraw` |
| `user_note` | TEXT | Optional |
| `signal_keys` | TEXT | JSON: `{ terms[], discourse_ids[] }` |
| `geometry_at_open` | TEXT | JSON snapshot (orbits, arcs) |
| `status` | TEXT | State machine §3.2 |
| `checks` | INTEGER | Relapse evaluations run |
| `last_check_at` | INTEGER | |
| `closed_at` | INTEGER | |
| `closure_reason` | TEXT | |

Worker: `bridge_rows` + `bridge_rows_enc` (same pattern as other stores).

### 3.2 State machine

```text
open          → user corrects/rejects; row stays active
verified      → geometry confirms correction load-bearing → closed
relapsed      → attractor returned without bridge → closed (anomaly)
superseded    → newer witness claim on same keys → closed
user_withdrawn → user supreme ground; history kept → closed
```

**Opens:** UI Correct / Reject on theory (process view or Guardian detail).  
**Stays open:** `status === 'open'` until terminal or `checks >= N` (config: **5 saves** or **14 days**, dogfood tune).  
**Relapse + bridge weight:** same checker — Tier 1 #1 and #5 merged.

### 3.3 Denial sediment (v1)

Aggregate `user_action === 'reject'` on same `signal_keys` → process anomaly line (deterministic). No Guardian argument. Intention §5.3.1.

---

## 4. Synapse scalars (computed, not stored in `guardian_logs`)

| Scalar | Source | PWA v1? |
|--------|--------|---------|
| `posture_vector` | fast map + self-ref ratio + orbit concentration + resistance lexicon | Yes |
| `half_life` | per-term weight from `computeCorpusTermArcs` + last reinforced | Yes (lazy on pulse) |
| `perpetual_orbit` | high visits, no arc commitment / no theory resolution | Yes |
| `elaboration_delta` | avg sentence complexity vs baseline **only after** open bridge | Yes |
| `saccade_log` | fixation discourse ids, blind tiers, reason | Yes |
| `open_bridges_count` | count `bridge_rows` where status=open | Yes |
| `void_hints` | implied centroid minus present (Track B) | Desktop |
| `friction_score` | divergent arc accumulation | Desktop / later |

**Storage v1:** `localStorage` key `nq_synapse_latest` + optional `witness_anomalies` rows later. No new table required until Phase B.

### 4.1 Synapse blob contract (versioned — cheap insurance)

The blob is the **runtime contract** between local pass, process view, and strip worker. If P6 ships without versioning and P8 adds fields, old blobs can make P8 read `undefined` and behave randomly.

**Rules:**

| Rule | Behavior |
|------|----------|
| **`synapse_version` required** | Top-level string, e.g. `"1"` — bump on breaking shape changes |
| **Unknown version** | `parseSynapseSnapshot(raw)` returns `null` → recompute fresh; never trust partial blob |
| **Same major version, new optional fields** | Readers use `blob.posture_vector?.coherence ?? 0` — graceful degrade |
| **Breaking change** | Bump version; old blob discarded on next `buildSynapseSnapshot()` |
| **Never gate unlock** | Bad blob must not block vault; worst case = one extra recompute |

**Minimal v1 shape:**

```json
{
  "synapse_version": "1",
  "built_at": 1730000000000,
  "posture_vector": { "coherence": 0.82, "resistance": 0.31, "self_ref_ratio": 0.44, "attractor_concentration": 0.71 },
  "half_life": { "terms": { "fear": { "weight": 0.4, "last_reinforced_at": 1730 } } },
  "perpetual_orbit_terms": ["void", "mother"],
  "open_bridges": [{ "id": "br_…", "status": "open", "terms": ["void"] }],
  "elaboration_delta": null,
  "saccade_log": { "fixation_ids": ["d_1", "d_2"], "blind_spot": "cold_archive", "reason": "tier_excluded" },
  "anomalies": ["perpetual_orbit:void", "denial_sediment:mother"],
  "local_pass": { "invoke_denied": false, "graduation_quiet": false, "deny_reason": null }
}
```

**API (app.js):**

- `buildSynapseSnapshot()` → always writes current version  
- `parseSynapseSnapshot(stored)` → version check + safe defaults  
- `getSynapseSnapshot()` → parse LS or rebuild if stale/missing  

P6 and P8 both call `parseSynapseSnapshot`; P8 never reads raw `localStorage` JSON.

---

## 5. Posture → sequenced truth (strip/summon order)

**Not labels** (`narcissist`). Continuous vector → **tier order**:

| Posture signal | Read first | Read second | Defer |
|----------------|------------|-------------|-------|
| High coherence, low resistance | graduation quiet | term arcs | void |
| High resistance + high eloquence | open bridge + elaboration_delta | perpetual orbit | void |
| High intensity, low self-ref (single attractor) | signal reality (“one coordinate”) | void if self thin | moral verdict |
| Default | term arcs + open bridges | geometry delta | void |

**Epictetus:** graduation quiet + invoke_denied often.  
**Narcissist:** open bridge + elaboration.  
**Young girl in love:** sequenced, not harsher.

Guardian **voice** unchanged in Coherence; Isness mode unchanged.

---

## 6. Unified map: clusters × tiers × passes

| Idea | Cluster | Tier | Pass |
|------|---------|------|------|
| `bridge_rows` + UI open | 3 Jumps | 1 | **P1–P2** |
| Relapse checker | 3 | 1 | **P2** |
| Perpetual orbit anomaly | 1 Holes | 1 | **P3** |
| Posture vector (display) | Router | 1 | **P4** |
| Half-life on arcs | 2 Time | 1 | **P5** |
| `buildSynapseSnapshot` | 7 Step 1 | 1 | **P6** |
| `invoke_denied` | 5.4 | 1 | **P7** |
| Strip tier order + saccade_log | 4 + Router | 1 | **P8** |
| Elaboration delta | 5 | 1 | **P9** |
| Denial sediment line | 5.3.1 | 1 | **P10** |
| Graduation quiet | Stress test | 1 | **P11** (optional) |
| Topological void | 1 | 2 | **P12+** (desktop) |
| Hebbian lock | 5 | 2 | **P13+** |
| Chirality / kinetic / haptic | 5 / hold | 3 | Living Q |

---

## 7. Implementation passes (register)

### 7.0 Tracks (pick one)

| Track | Passes | Who |
|-------|--------|-----|
| **Conservative** (Claude guard) | 8–11 PRs | Minimize debug pain when mirror feels wrong |
| **Aggressive — 2 PRs** | **2** | **Default May 2026** — substrate then wire |
| **Aggressive — 3 PRs** | 3 | Same scope as 2-pass; extra git seam between synapse and gate |

**Minimum shippable (any track):** bridge + synapse + invoke gate.

---

### 7A. Conservative — granular (reference only)

8–11 passes P1–P11 as listed below. Use if a scalar lies after merge.

---

### 7B. Aggressive — 2 passes (dogfood default)

| Pass | Absorbs | PR theme | Acceptance |
|------|---------|----------|------------|
| **W1** | P1–P7 | `witness-substrate` — `bridge_rows`, Correct/Reject, relapse, orbit, posture, half-life, process panel, **versioned** `buildSynapseSnapshot` / `parseSynapseSnapshot`, `runLocalPass`, `invoke_denied` | Bridges + anomalies + synapse blob visible; strip **unchanged**; thin map blocks invoke |
| **W2** | P8–P11 | `witness-wire` — tier order from posture, `saccade_log` in worker payload, elaboration, denial sediment, graduation quiet | Strip order shifts by posture; worker redeploy note in PR |

**Why two is enough:** The only hard seam is **observable + gate (P1–P7)** vs **Guardian entangle (P8–P11)**. Merging P1–P5 without P6–P7 leaves no single contract object; merging P6–P7 with P8 in pass 2 is fine **after** `synapse_version` exists in W1.

**Inside W1:** named blob fields + process UI sections per scalar (Claude guard as code structure, not git history).

**Phase B desktop:** still +4–5 passes later (P12–P16) — not in aggressive PWA batch.

**Tear-away policy:** feature flags in one object `NQ_WITNESS_FLAGS` — flip off without reverting whole PR.

---

### 7C. Aggressive — 3 passes (optional split)

Same as §7B but W1 split into **A1** (P1–P5) + **A2** (P6–P7); **A3** = W2. Use only if W1 feels too large in one review or one dogfood week.

| Pass | Absorbs | PR theme |
|------|---------|----------|
| **A1** | P1–P5 | `witness-foundation` |
| **A2** | P6–P7 | `witness-synapse` |
| **A3** | P8–P11 | `witness-wire` (= W2) |

**Do not** merge A3 before A2 lands `synapse_version` on `main`.

### Phase A — PWA

| Pass | Name | Scope | Acceptance (felt) | Touch |
|------|------|-------|---------------------|-------|
| **P1** | Bridge schema | `bridge_rows` table, enc, `dbGetAll`; process view lists open/closed | See a fake/test row in process view | `app.js` worker |
| **P2** | Bridge open + relapse | Correct/Reject UI; opens row; on save `evaluateBridgeRelapse()` updates status | Correct a theory → row open → after writes, verified or relapsed | `app.js` |
| **P3** | Perpetual orbit | Extend `computeCorpusTermArcs` or anomaly fn; process line | Term orbits 3+ sessions without landing → anomaly visible | `app.js` |
| **P4** | Posture vector | `computePostureVector(synapse inputs)`; process view only | Save discourse → posture numbers appear; no Guardian change | `app.js` |
| **P5** | Half-life | λ per term; decay weight in arc display | Old terms fade unless reinforced; resurgence flagged | `app.js` |
| **P6** | Synapse snapshot | `buildSynapseSnapshot()` fuses map + watcher + arcs + bridges + posture | One JSON blob in LS; logged to console in dev | `app.js` |
| **P7** | Invoke gate | `runLocalPass()` → `invoke_denied` blocks strip Worker + summon | Thin map → no API call; reason in UI | `app.js`, maybe worker |
| **P8** | Sequenced strip | Posture picks tier order; `saccade_log` in snapshot; worker prompt order only | Strip lists fixation/blind spot; order differs by posture | `app.js`, worker README |
| **P9** | Elaboration delta | Baseline median complexity; spike after open bridge | Post-correction write 3× baseline → anomaly only | `app.js` |
| **P10** | Denial sediment | Aggregate rejects per term → process anomaly | 3+ rejects same term → one line, no fight | `app.js` |
| **P11** | Graduation quiet | Sustained coherence → reduced invoke appetite + process message | Epictetus-like vault → “map stable” | `app.js` |

### Phase B — Desktop / Track B

| Pass | Name | Scope |
|------|------|-------|
| **P12** | Topological void | BGE matrix; `void_hints` in synapse |
| **P13** | Friction / fault lines | Pre-critical divergence scoring |
| **P14** | Hebbian lock pairs | Co-occurrence ≥90% over 6mo corpus |
| **P15** | Per-signal witness confidence | Ledger hit rate by signal class → tighter gate |
| **P16** | Phase transition hints | Longitudinal instability (Layer 4) |

### Phase C — Living Q only

Kinetic layer, chronobiology, chirality detection, haptic brace — intention §14 until philosophy + mechanic align.

---

## 8. Observable layer enforcement (Claude guard)

```text
P1  → see bridge rows
P2  → bridge moves without Guardian
P3  → orbit anomaly alone
P4  → posture alone
P5  → half-life alone
P6  → synapse blob alone
P7  → invoke_denied alone
P8  → only then strip order
P9–P11 → optional polish
```

**Conservative track forbids:** one PR touching P1–P8.  
**Aggressive 2-pass:** W1 must finish P1–P7 (including `synapse_version`) before W2 touches strip/worker.  
**Aggressive 3-pass:** A3 only after A2 merges `synapse_version`.

---

## 9. Files (expected)

| File | Passes |
|------|--------|
| `app.js` | P1–P11 (worker schema, synapse, local pass, process UI, Guardian order) |
| `cartographer.js` | Only if perpetual orbit needs intra-map helper |
| `workers/guardian-invoke/worker.mjs` | P8 strip prompt order / snapshot fields |
| `index.html` / `app.css` | Process view, bridge UI, anomaly strip |
| `docs/supabase-nq_sync.sql` | Unchanged |

---

## 10. Intention trace (template)

> *This pass implements witness-loop-upgrade **P#** — traceable to `NakedQuantum-intention-blueprint.md` §5.3.1 / §5.4 / §7 Step 1 and §6.7 because it [specific reason].*

---

## 11. Shipped log

| Pass | Status | PR |
|------|--------|-----|
| **W1** Substrate (P1–P7) | ☐ | |
| **W2** Wire (P8–P11) | ☐ | |
| *(optional A1–A3 split of W1/W2)* | — | §7C |
| *(granular P1–P11)* | — | §7A |

---

## 12. Revision log

| Date | Change |
|------|--------|
| 2026-05-23 | Initial pin — unified clusters + tiers + bridge_rows schema + 11 PWA passes |
| 2026-05-23 | §4.1 synapse_version contract; §7B aggressive 3-pass track (A1–A3) |
| 2026-05-23 | §7B default → **2-pass** (W1 substrate / W2 wire); §7C optional 3-pass |

---

*Build loops, not lore. Schema before Cursor. Observable before Guardian.*
