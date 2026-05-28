# NakedQuantum — Witness Loop Upgrade Blueprint (pinned)

> **Purpose:** Build contract for **synapse-temporal-v1** and beyond — merges the dense multi-model discussion, the three-user stress test (Epictetus / narcissist / young girl in love), and Claude’s **observable → entangle → wire** guard.
>
> **Read with:** `NakedQuantum-intention-blueprint.md` (why), `consciousness-exoskeleton-roadmap-blueprint.md` (shipped Ph 0–3), `guardian-refinement-roadmap-blueprint.md` (Guardian/strip detail), `witness-panel-blueprint.md` (Review gate + panel — idea layer), `NakedQuantum-checkpoint-2026-05.md` (code map).
>
> **Author:** Kaja + co-creator passes · **Last updated:** May 2026

---

## 0. How to use this document

| Rule | Meaning |
|------|---------|
| **Intention trace** | Every pass: *“Traceable to intention §___ because ___.”* |
| **48-hour gate** | New mechanics sit in intention §14 Living Q first unless this doc marks them **approved**. |
| **One pass = one PR** | Observable layer per pass when possible — never bridge + posture + invoke in one merge. |
| **Guardian last** | Layers 0–5 read-only in process view before summon behavior changes. |
| **No auto strip** | Soup auto-invoke strip + `naked-guardian` worker **retired May 2026** — witness loop + voluntary summon only. |

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
  → [interim] voluntary Guardian summon  // tier ORDER from posture (BYOK)
  → [target] threshold witness pass → panel → optional Review (WP1–WP7)
  → bridge_rows / guardian_logs update
  → field mutation (directives, revisit) — existing Ph 0–3
```

**Do not** add a second app. **Do not** entangle scalars before they are visible.

---

## 2.1 User Zero constraints (dogfood calibration)

The primary dogfooder is also the **builder**. Early vaults are not “pure self-examination from day one.”

| Effect | Why it matters |
|--------|----------------|
| **Meta-writing contamination** | Notes about NakedQuantum, architecture, philosophy-of-app use the **resistance lexicon** analytically (“against this pattern,” “must not,” “wrong approach”) — not necessarily psychological resistance in the Abyss sense. |
| **Builder feedback loop** | Writing *about* the witness inside the witnessed vault inflates coherence/resistance readings. Hardest person to witness accurately — not gaming, **domain bleed**. |
| **Migration baseline** | Bulk import (e.g. 30k words at once) produces **false stability**: synapse looks mature before temporal patience runs. |

**Calibration stance (not a bug to “fix” before strangers):**

- Witness the person writing in **Abyss**, not only the architect writing about the app.
- Annotate baseline honestly (`corpus_baseline` — §7D W3-1); tune scalars in W3, don’t reinterpret philosophy in chat.
- Future users start clean; User Zero data is **calibration notes** when reading back high resistance.

**Later (post-W3, optional):** folder/item_type weight — meta/work discourses contribute less to resistance than Abyss self-examination. Defer until Abyss vs meta split is obvious in dogfood.

---

## 2.2 Reference case — summon silence (26 May 2026)

**Vault:** ~30k words, migrated corpus. **Substrate:** coherence 1 · resistance 1 · self-ref 0.25 · attractor 0.11 · profile `resistance_eloquent` · 0 bridges.

**Summon:** Guardian read geometry accurately (distributed map, pronoun trajectories, paradox as entanglement). User replied with fluency — *“when I go there I will know”* — not a wound or a question.

**Guardian:** `SILENCE` + parenthetical why (*“To dissect it would be violence.”*).

**Proof:** Posture router can sequence **silence as highest truth** — not softer, **correctly ordered**. Not a template to repeat; proof the system can **not speak** when speech would contaminate.

**Not Epictetus:** resistance 1 blocks `graduation_quiet`; router correctly classifies **coherent + combative** (worldview built, edges tested), not integrated calm.

**Mythril still dormant:** zero `bridge_rows` — sensors read; loop has not **watched** via correction yet.

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
| **W2** | P8–P11 | `witness-wire` — summon archive tier order from posture; elaboration; denial sediment; graduation quiet (strip retired) | Summon context order shifts by profile; SUBSTRATE shows wire profile |

**Why two is enough:** The only hard seam is **observable + gate (P1–P7)** vs **Guardian entangle (P8–P11)** on **voluntary summon**. Merging P1–P5 without P6–P7 leaves no single contract object.

**Inside W1:** named blob fields + process UI sections per scalar (Claude guard as code structure, not git history).

**Phase B desktop:** still +4–5 passes later (P12–P16) — not in aggressive PWA batch.

**Tear-away policy:** feature flags in one object `NQ_WITNESS_FLAGS` — flip off without reverting whole PR.

---

### 7D. W3 — Substrate honesty (next PWA pass, iPhone-only)

**Gate:** Ship W3 before W4 ledger chain. **One PR**, five sub-items. **Do not** open W6 until at least one **real** bridge (not manufactured — wait for summon friction).

| ID | Name | Scope | Acceptance |
|----|------|-------|------------|
| **W3-2** | Resistance normalization | `computePostureVector`: normalize resistance hits by mapped discourse count, e.g. `Math.min(1, hits / Math.max(12, mapped * 1.5))` | 30k corpus: one dense discourse doesn’t solo-max resistance |
| **W3-1** | Corpus baseline | Synapse field `corpus_baseline: { built_at, total_discourses, organic_writes_since }`; persist on first build; increment when discourse count grows | SUBSTRATE: `baseline: N discourses · M organic since` |
| **W3-3** | SUBSTRATE empty states | Always show sections with honest copy when empty; always show `built_at` / age | User can tell “working but quiet” vs broken |
| **W3-4** | Half-life surface | Top 5 terms by weight + bottom 3 decayed in SUBSTRATE | Decayed orbits visible without dev console |
| **W3-5** | Bridge prompt on summon | After summon response: quiet line + Correct/Reject when `theory_one_line` exists (reuse `openBridgeRow`) | Mythril unlock on mobile — no log archaeology |

**W3-3 copy (v1):**

- Perpetual orbit empty → *no orbit yet — need 3+ cross-discourse appearances*
- Anomalies empty → *no anomalies — map reading clean*
- Bridges empty → *0 open · 0 total — correction loop dormant*
- Footer → *synapse built: {relative time}*

**W3-5 UI (v1):** Below Guardian response: `theory logged · correct or reject?` + `[Correct]` `[Reject]` — only on completed summon with theory line.

**Cursor sequence:** W3-2 → W3-1 → W3-3 → W3-4 → W3-5 (resistance first; bridge prompt last).

**Version bump:** Optional `synapse_version: "2"` only if `corpus_baseline` shape is required at parse time; prefer same major version + optional field degrade.

---

### 7E. W4 — Witness ledger chain (pre-bridge dogfood)

**Gate:** Ship after W3. **One PR.** Forward-only chain from first unlock — no backfill of pre-chain logs.

| ID | Name | Scope | Acceptance |
|----|------|-------|------------|
| **W4-1** | Schema | `witness_ledger_chain` table: seq, event_type, event_id, payload_hash, prev_hash, link_hash, created_at | Row persists in OPFS SQLite |
| **W4-2** | Append hooks | After `saveGuardianLog`, `persistWitnessDirectiveLog`, `openBridgeRow`, `closeBridgeRow` | Summon + bridge events extend chain |
| **W4-3** | HMAC links | `payload_hash` = SHA-256(canonical JSON); `link_hash` = HMAC-SK(seq\|type\|id\|payload\|prev) | Tamper of chained event breaks verify |
| **W4-4** | Verify on unlock | `verifyWitnessLedgerChain()` on `initializeApp`; SUBSTRATE line | “N links · verified” or “break at seq X” |
| **W4-5** | Import re-anchor | `importJSON` / Akashic restore clears chain + new genesis | Toast/honest copy; no false alarm |

**Genesis:** `prev_hash` for link 1 = `SHA256("nq-witness-genesis:" + chain_id)`. Pre-chain `guardian_logs` / `bridge_rows` remain valid but unlinked.

**Not chained (v1):** `prediction_outcome` updates, `evaluateBridgeRelapse` check mutations — derived state, not ledger ground.

**W4.6 (deferred — pin):** **`reanchorWitnessLedgerChain()`** — signed `chain_close` under old SK, archive old chain, new genesis under new SK; interim key fingerprint for “key changed” vs “tamper”. Full spec: **`NakedQuantum-quantum-fortress.md` §18.7**. Do not auto-reset on verify fail.

**Out of scope:** full-DB hash, sync merge, export carry chain, `correction_event` table (future).

---

### 7F. W5 — Bridge as practice (after W4)

| Scope | Rule |
|-------|------|
| Real bridge only | Wait for summon that makes you **pause** — slightly wrong, slightly off. No manufactured bridge to exercise mechanics. |
| `mechanical_miss` / calibration feedback | **Skip until desktop/Tauri** — use `user_withdrawn` as escape if signal wrong today |
| Elaboration delta | Lives once bridge open — already wired |

---

### 7G. W6 — Temporal compare (after ≥1 real bridge)

| Scope | Skip until |
|-------|------------|
| `delta_since_last_synapse` — posture/term shift %, new write weight vs baseline | W5 bridge proof |
| Recent-write weighting for migration vaults | Can extend W3-1 if needed |
| `void_hints`, BGE matrix | Desktop (P12+) |
| Local LLM witness side panel | Desktop/Tauri — **not** blocking PWA mythril |

---

### 7C. Aggressive — 3 passes (optional split)

Same as §7B but W1 split into **A1** (P1–P5) + **A2** (P6–P7); **A3** = W2. Use only if W1 feels too large in one review or one dogfood week.

| Pass | Absorbs | PR theme |
|------|---------|----------|
| **A1** | P1–P5 | `witness-foundation` |
| **A2** | P6–P7 | `witness-synapse` |
| **A3** | P8–P11 | `witness-wire` (= W2) |

**Do not** merge A3 before A2 lands `synapse_version` on `main`.

---

### 7H. Witness panel — WP1–WP8 (idea layer; not shipped)

**Contract:** **`witness-panel-blueprint.md`**. Builds on W1–W4 substrate. **Review replaces Summon ritual** when WP7 lands — Guardian is not removed; the loop runs first.

| Pass | Scope | Acceptance |
|------|-------|------------|
| **WP1** | Threshold engine + priority queue | One fire per qualifying event; posture router picks priority |
| **WP2** | Sequential panel render + pacing + minimal step motion; SUBSTRATE saccade + `[why?]` | READING → … → GUARDIAN visible; continuity cues; inspectable scalars between passes |
| **WP3** | Local GUARDIAN THINKING builder | Deterministic context block; no API |
| **WP4** | Guardian prompt — observation only | Prose does not repeat panel; BYOK / Ollama |
| **WP5** | **Review gate** + extension + exhaustion | Review disables on silence / circling — UI rest, no lecture copy |
| **WP6** | `invoke_denied` partial panel | Honest thin-map state |
| **WP7** | Remove Summon UI; migrate to Review model | Historical `summon` logs preserved |
| **WP8** | `craft_suspended` | With Craft C1 — panel hidden while craft open |

**Minimum shippable:** WP1–WP6 + WP5 Review. **Gate:** Kaja approves pass before Cursor.

**Deferred (pin only):** user-selected discourse subset for scoped witness pass — `witness-panel-blueprint.md` §9.

### Phase A — PWA

| Pass | Name | Scope | Acceptance (felt) | Touch |
|------|------|-------|---------------------|-------|
| **P1** | Bridge schema | `bridge_rows` table, enc, `dbGetAll`; process view lists open/closed | See a fake/test row in process view | `app.js` worker |
| **P2** | Bridge open + relapse | Correct/Reject UI; opens row; on save `evaluateBridgeRelapse()` updates status | Correct a theory → row open → after writes, verified or relapsed | `app.js` |
| **P3** | Perpetual orbit | Extend `computeCorpusTermArcs` or anomaly fn; process line | Term orbits 3+ sessions without landing → anomaly visible | `app.js` |
| **P4** | Posture vector | `computePostureVector(synapse inputs)`; process view only | Save discourse → posture numbers appear; no Guardian change | `app.js` |
| **P5** | Half-life | λ per term; decay weight in arc display | Old terms fade unless reinforced; resurgence flagged | `app.js` |
| **P6** | Synapse snapshot | `buildSynapseSnapshot()` fuses map + watcher + arcs + bridges + posture | One JSON blob in LS; logged to console in dev | `app.js` |
| **P7** | Invoke gate | `runLocalPass()` → `invoke_denied` blocks voluntary summon | Thin map → toast + reason; SUBSTRATE shows deny |
| **P8** | Sequenced summon archive | Posture picks tier-4 block order; `saccade_log` in header | Summon context order differs by profile |
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
| — | *(auto strip worker retired — see `workers/guardian-invoke/RETIRED.md`)* |
| `index.html` / `app.css` | Process view, bridge UI, anomaly strip |
| `docs/supabase-nq_sync.sql` | Unchanged |

---

## 10. Intention trace (template)

> *This pass implements witness-loop-upgrade **P#** — traceable to `NakedQuantum-intention-blueprint.md` §5.3.1 / §5.4 / §7 Step 1 and §6.7 because it [specific reason].*

---

## 11. Shipped log

| Pass | Status | PR |
|------|--------|-----|
| **W1** Substrate (P1–P7) | ☑ | witness-substrate PR |
| **W2** Wire (P8–P11) | ☑ | witness-wire PR |
| **W3** Substrate honesty | ☑ | §7D — resistance normalize, corpus_baseline, SUBSTRATE empty states, half-life surface, summon bridge prompt |
| **W4** Witness ledger chain | ☑ | §7E — HMAC chain on summon + bridge events; import re-anchor |
| **W5** Bridge practice | ☐ | §7F — after W4 + real friction |
| **W4.6** Ledger re-anchor ceremony | ☐ | fortress §18.7 — migration vs tamper |
| **W6** Temporal compare | ☐ | §7G — after bridge |
| **WP1–WP8** Witness panel + Review | ☐ | §7H + `witness-panel-blueprint.md` — idea layer |
| *(optional A1–A3 split of W1/W2)* | — | §7C |
| *(granular P1–P11)* | — | §7A |

---

## 12. Revision log

| Date | Change |
|------|--------|
| 2026-05-23 | Initial pin — unified clusters + tiers + bridge_rows schema + 11 PWA passes |
| 2026-05-23 | §4.1 synapse_version contract; §7B aggressive 3-pass track (A1–A3) |
| 2026-05-23 | §7B default → **2-pass** (W1 substrate / W2 wire); §7C optional 3-pass |
| 2026-05-23 | Auto-invoke strip + worker retired; loop = synapse + voluntary summon |
| 2026-05-26 | §2.1 User Zero constraints; §2.2 reference case 26/5; §7D–7F W3–W5 register (iPhone-first) |
| 2026-05-26 | **W3 shipped** — W3-2 resistance normalize; W3-1 corpus_baseline; W3-3 empty states; W3-4 half-life panel; W3-5 inline bridge prompt |
| 2026-05-26 | **Register rename** — old W4 bridge practice → **W5**; old W5 temporal → **W6**; new **W4** = witness ledger chain (§7E) |
| 2026-05-26 | **W4 shipped** — witness_ledger_chain table; HMAC links; append hooks; verify on unlock; SUBSTRATE ledger line; import re-anchor |
| 2026-05-26 | **W4.6 register** — ledger migration / re-anchor deferred; pin fortress §18.7 |
| 2026-05-26 | Security hardening pin — fortress §18.8 Meta crosswalk (PWA + Tauri) |
| 2026-05-26 | **§7H register** — WP1–WP8 witness panel (Review gate); cross-link `witness-panel-blueprint.md` |
| 2026-05-18 | WP2 scope — minimal motion, SUBSTRATE saccade/why; no summon preview / mid-pass redirect (witness-panel §10) |

---

*Build loops, not lore. Schema before Cursor. Observable before Guardian.*
