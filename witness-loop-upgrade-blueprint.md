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

**Minimum shippable witness upgrade: 4 passes (P1–P2, P6–P7).**  
**Full Phase A (recommended): 8 passes (P1–P8).**  
**Phase A+ polish: +2 (P9–P10).**  
**Phase B desktop: +4–5 (P12–P16).**

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

**Forbidden:** “synapse-temporal-v1” single PR touching P1–P8.

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
| P1 Bridge schema | ☐ | |
| P2 Bridge + relapse | ☐ | |
| P3 Perpetual orbit | ☐ | |
| P4 Posture vector | ☐ | |
| P5 Half-life | ☐ | |
| P6 Synapse snapshot | ☐ | |
| P7 invoke_denied | ☐ | |
| P8 Sequenced strip | ☐ | |
| P9 Elaboration delta | ☐ | |
| P10 Denial sediment | ☐ | |
| P11 Graduation quiet | ☐ | |

---

## 12. Revision log

| Date | Change |
|------|--------|
| 2026-05-23 | Initial pin — unified clusters + tiers + bridge_rows schema + 11 PWA passes |

---

*Build loops, not lore. Schema before Cursor. Observable before Guardian.*
