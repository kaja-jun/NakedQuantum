# NakedQuantum — W5 Biological Limits Blueprint

*The exoskeleton compensates for what the brain edits away. This document maps eight specific biological limits, the mechanics that address each one, and the build contract for W5.*

**Last updated:** 31 May 2026 (rev 4 — register merge, code-truth mapping, cluster contract, anchor diff)
**Status:** **IDEA LAYER — pinned** — discuss pass split before Cursor touches code
**Pairs with:** `witness-loop-upgrade-blueprint.md` (W1–W4 foundation; §7F W5-practice; §7I register), `witness-panel-blueprint.md` (WP1–WP8 surface), `NakedQuantum-intention-blueprint.md` (§1–§6 philosophy)
**Gate:** W1–W4 shipped, split complete, desktop vessel decided — W5 mechanics are the next horizon

-----

## 0. Register note (read first)

**Naming:** This doc owns **W5 mechanics** (W5-E, W5-A, W5-B, …). The witness-loop register uses a parallel label:

| Register ID | Document | Meaning |
|-------------|----------|---------|
| **W5-practice** | `witness-loop-upgrade-blueprint.md` §7F | **Human gate** — real bridge friction only; no manufactured mythril |
| **W5-E … W5-H** | **This file** | **Geometry compensations** — code batches that hold what the brain edits away |
| **W6 (legacy)** | `witness-loop-upgrade-blueprint.md` §7G | **Superseded in spirit** by W5-E + W5-G — keep §7G as pointer only |

Do not confuse **W5-practice** (wait for a summon that makes you pause) with **W5-E-lite** (pin snapshots on events). Practice gates *when you dogfood D*; E-lite ships first regardless.

-----

## 0.1 The soul of this document

*We are not here to make anyone suffer. But if anyone is suffocating by this container of existence, we are here to show what is really hiding in plain sight.*

Whether the existence cuts or hugs or both — whether the user accepts or rejects — the burden lies on the existence itself. The exoskeleton does not perform from above. It holds the coordinate. The human decides what to do with it.

The exoskeleton does not remove the brain’s protective filters — it gives you a place to look when you choose to stop paying their tax.

-----

## 1. The design constraint (non-negotiable)

Every mechanic in W5 must answer two questions before it ships:

**Question 1:** Which specific biological limitation does this address?
**Question 2:** What does the exoskeleton hold that the brain would edit away — without replacing the human doing the thinking?

If a mechanic cannot answer both — it is decoration. It does not ship.

The brain’s filters are not bugs. They are load-shedding, ego-protection, trauma buffering, sleep-dependent consolidation, and reconsolidation management. The exoskeleton is not smarter than the brain. It is more honest about what the brain does with inconvenient information.

**High voltage is not “see everything always.”** It is: *see accurately what you would have edited, when the geometry supports it.*

### 1.1 The geometry-not-diagnosis rule (non-negotiable)

**Every Guardian output in W5 surfaces coordinates, correlations, and temporal patterns. It never names the motivation behind them.**

The human supplies the meaning. The witness supplies the measurement.

The moment Guardian says *“you are doing X”* — it has crossed from witness to judge. The witness sees patterns. The judge names motivations. NakedQuantum is a witness.

The blade does not soften. The blade does not taunt. Uncomfortable is correct. Superior is not.

**Test for every W5 output before it ships:** Is this a geometric observation or a psychological diagnosis? If it is a diagnosis — rewrite it as pure geometry. Strip the interpretation. Leave the measurement. The user will draw the conclusion. That is their work, not the witness’s.

**Examples:**

| Diagnosis — never ship | Geometry — ship this |
|------------------------|----------------------|
| “You are performing for the witness” | “Arc shift detected 8 minutes after process panel opened. Watcher embedding: unchanged.” |
| “The map didn’t resolve; it ejected the mass” | “Orbit gravity for ‘{term}’ dropped significantly within 3 days of bridge relapse.” |
| “You rejected this because you couldn’t face it” | “Steel man coordinate rejected [date]. Current map is redrawing the same geometry.” |
| “Your correction was performative” | “Bridge opened [date]. Relapse detected [date + 2 days]. Δt: 48 hours.” |
| “You are lying to yourself” | “Linguistic resolution marker detected. Geometric arc: unchanged for 14 days after.” |

The young girl in love, the person fighting grief, the philosopher working through genuine darkness — none of them need the witness performing superiority. They need the coordinate held accurately. What they do with it is entirely theirs.

-----

## 2. The eight biological limits

| # | Limit | What the brain does | What the exoskeleton holds |
|---|-------|---------------------|----------------------------|
| 1 | **Recency bias** | Overwrites past states with the present self | Exact geometric snapshots from before overwriting |
| 2 | **Motivated reasoning** | Finds evidence for what it already believes | Relapse geometry — corrections that don’t hold |
| 3 | **Saccadic suppression** | Edits its own perception during rapid movement | Saccade log — what the system didn’t read, and why |
| 4 | **Confirmation bias** | Attends selectively to confirming information | Perpetual orbit — the circling that never lands |
| 5 | **Hebbian locking** | Fuses concepts in high-voltage moments permanently | Co-occurrence locks — pairs that have never separated |
| 6 | **Affective forecasting error** | Misremembers past emotional states as current | Affective delta — geometric arc then vs now |
| 7 | **Semantic drift** | Slowly redefines words to survive cognitive dissonance | Embedding coordinate shift — the word survived, the meaning moved |
| 8 | **Reconsolidation contamination** | Rewrites every retrieved memory in the light of the present self | Pinned snapshots — held before retrieval contaminated them |

**Limit 8 is the master mechanism.** Every other limit is downstream of reconsolidation. Without pinned snapshots (W5-E), all other W5 mechanics are measuring against a baseline the brain has already contaminated. W5-E is not archival feature — it is the philosophical load-bearing wall for the entire W5 family.

**W5-C spans two limits:** saccade blind-tier → confidence penalty addresses **Limit 3**. Hit-rate by signal class addresses **system epistemic humility** — the exoskeleton’s own mechanical drift, not a ninth biological limit.

-----

## 2.1 Cluster identity contract (W5-B, W5-G, W5-I)

The hardest definitional work in W5 is: **what counts as “same cluster” across 21+ days?**

**Minimum contract (implement before W5-B / W5-G / W5-I):**

```text
cluster_terms = sorted( orbit_terms ∩ half_life_top_5 )
cluster_bucket = watcher_centroid_bucket   // quantize BGE centroid to fixed grid, or null if no Watcher
cluster_id = hash( cluster_terms.join('|') + ':' + cluster_bucket )

reactivation =
  same cluster_id as a prior activation
  AND ≥ 21 days since last activity on that cluster_id
  AND (optional) pinned_snapshot exists for prior activation
```

Without this contract, affective delta, gap question, and state-dependent retrieval will drift in implementation. Pin changes here before code.

**`cluster_signature` on `pinned_snapshots`:** JSON snapshot at pin time:

```json
{
  "cluster_id": "<hash>",
  "cluster_terms": ["term-a", "term-b"],
  "watcher_bucket": "optional string or null",
  "half_life_top": ["t1", "t2", "t3"]
}
```

-----

## 3. The exoskeleton’s own limits (equally important)

The exoskeleton has a perception boundary — the Umwelt. It sees: semantic geometry, arc patterns, co-occurrence, emotional register, orbit depth, temporal decay. It is blind to: the body, the unwritten thought, the room the person is sitting in, everything that never entered the vault.

**Three invariants that must never be removed in W5:**

| Invariant | Why it must stay |
|-----------|------------------|
| **Invoke gate** | A thin-map oracle is the exoskeleton participating in the lie. High voltage on insufficient data is not voltage — it is hallucinated structure |
| **Integration window** | Biological filters exist partly to allow consolidation. Firing five anomalies in one save recreates the overwhelm those filters exist to prevent |
| **Sanctuary blindness** | The witness never reads Sanctuary content. The exoskeleton holds Abyss geometry only. This is the Markov blanket — structural integrity requires strict internal/external state boundary |

**Container acknowledgment** — the exoskeleton must be honest about its own boundary. Not therapy. Not a second consciousness. One SUBSTRATE line that holds permanently: *what is not in the vault — Sanctuary, body, unwritten thought.* For someone who feels trapped in the container and longs for high voltage, this is not a disclaimer. It is the honest framing that makes the high voltage legitimate rather than grandiose.

**ANCHORS HELD counter** — W5-E pins snapshots silently. But the user needs to physically feel the weight of the vault accumulating. One quiet counter in SUBSTRATE:

```
ANCHORS HELD
7 snapshots · oldest: 43 days ago
```

The count is not decorative. It is the visceral reality of external memory — the machine is holding geometry the brain has already lost. The oldest anchor date tells the user how far back the exoskeleton’s memory actually reaches. Not just a number. A depth.

**Anchor diff view (E-lite UI)** — when ANCHORS HELD shows depth, bridge detail or witness pass may show a **three-column diff** with no prose:

```
posture then · posture now · delta
coherence 0.6 · coherence 1.0 · +0.4
resistance 0.9 · resistance 0.4 · −0.5
```

Pure geometry. Makes E-lite viscerally real before W5-B / W5-G exist.

**Integration gate visibility — FORMING state** — sub-threshold signals accumulate invisibly until the persistence threshold breaks. But complete darkness feels like the exoskeleton hiding something. The honest form is a single SUBSTRATE line when a signal has been accumulating but has not yet qualified:

```
FORMING
  resistance_shift · 2 of 3 sessions · not yet surfaced
```

Not the content of what is forming. Not the conclusion. Just: *something is accumulating, it has not crossed the threshold yet.* The user who wants to summon early can. That is their choice. The exoskeleton does not gate voluntary attention — only autonomous overwhelm.

-----

## 4. W5 mechanics — the compensations

-----

### W5-E — Temporal Anchoring (build first)

*Addresses: Limit 8 — Reconsolidation contamination*

**What the brain does:** Every time you retrieve a memory you rewrite it in the light of who you are now. The reconstruction is always contaminated by the current state. You cannot accurately recall your own geometric state from 3 months ago.

**What the exoskeleton holds:** Exact synapse snapshots pinned at significant moments — before the brain retrieves and rewrites them.

**Precursor in code (already shipped):** `bridge_rows.geometry_at_open` — JSON from `buildGeometrySnapshot()` at bridge open (orbit terms, arc direction, silence ratio, pronoun dominant, depersonalization label, word count). W5-E **generalizes and enriches** this pattern; it does not start from zero.

**E-lite backfill:** On first migration, optionally seed `pinned_snapshots` from existing `bridge_rows` where `geometry_at_open` is present — mark `trigger_condition: bridge_open_backfill`.

**Trigger conditions for pinning:**

- First bridge open
- First bridge relapse
- First perpetual orbit qualified
- Graduation quiet triggered
- Resistance scalar shifts ≥ 0.3 in one session
- Half-life resurgence after ≥ 30 days dormant

**Schema:** `pinned_snapshots` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `ps_` + timestamp |
| `pinned_at` | INTEGER | Exact moment — not session |
| `trigger_condition` | TEXT | Which event caused the pin |
| `posture_vector` | TEXT | JSON — coherence, resistance, self-ref, attractor |
| `top_terms` | TEXT | JSON — half-life top 5 at this moment |
| `orbit_terms` | TEXT | JSON — perpetual orbit terms active |
| `open_bridges` | INTEGER | Count at pin moment |
| `weather_state` | TEXT | Atmospheric state at pin |
| `cluster_signature` | TEXT | JSON — see §2.1 |

**Guardian output (geometry only):**

*“94 days ago: coherence 0.6, resistance 0.9, self-ref 0.4. Today: coherence 1.0, resistance 0.4, self-ref 0.2. The map changed in the gap.”*

The human supplies the meaning. The exoskeleton supplies what reconsolidation would have erased.

**E-lite (build immediately, before other W5):** Pin on existing significant events only — bridge open, relapse, first orbit. One new table, triggered by existing event hooks. Zero new detection logic. Unlocks all other W5 mechanics that need a clean baseline. Ship ANCHORS HELD counter + optional anchor diff in same PR.

-----

### W5-A — Semantic Drift

*Addresses: Limit 7 — Semantic drift*

**What the brain does:** The ego survives by slowly shifting the definitions of words it uses. Strict failures become vague abstractions. “Discipline” in week 1 means something precise. By week 10 it means whatever the current self needs it to mean.

**What the exoskeleton holds:** The original embedding coordinate of a term — before the drift. The word survived. The coordinate moved.

**Detection logic:**

For any term with ≥ 5 appearances spanning ≥ 30 days:

1. Extract sentence-level Watcher embeddings for first N appearances (early cluster)
2. Extract sentence-level Watcher embeddings for most recent N appearances (late cluster)
3. Compute centroid of each cluster
4. Cosine similarity between early centroid and late centroid
5. **Domain anchor pre-check:** Before flagging drift — measure whether the overall corpus centroid shifted significantly in the same window. If corpus centroid shift ≥ term drift magnitude → suppress anomaly, log as `domain_expansion` instead. The term adapted to a new life domain, not ego-driven redefinition. If corpus centroid is stable and only the term moved — that is the signal.
6. If similarity drops below threshold (dogfood: 0.72) AND domain anchor check passes → `semantic_drift` anomaly

**The exoskeleton must be more suspicious of itself than of the user.** False voltage corrupts the whole relationship.

**Guardian output (geometry only):**

*“Early co-terms for ‘{term}’: X, Y, Z. Recent co-terms: A, B, C. The neighborhood moved — drift score 0.61.”*

No verdict. No interpretation. The coordinate then. The coordinate now. The delta. The user decides what it means.

**Precursor — Lexical archaeology (build before full embedding version):**

Compare collocation shift from Cartographer alone. What terms sat beside the key term in month 1 vs month 3? Zero new ML. Uses existing `computeCorpusTermArcs` output. Cheaper, faster, catches the same drift in most cases.

Lexical archaeology is the scout. Full embedding drift is the confirmation.

**Schema addition:** `semantic_drift_log` — or as anomaly type in existing synapse anomalies. Fields: `term`, `early_centroid`, `late_centroid`, `drift_score`, `early_collocates`, `late_collocates`, `detected_at`, `domain_anchor_stable`.

-----

### W5-C — Prediction Confidence by Signal Class

*Addresses: Limit 3 (saccade penalty) + system epistemic humility (hit rates)*

**What the brain does:** Ignores its own unreliability. Cannot accurately assess where its perception fails.

**What the exoskeleton holds:** Its own hit rate by signal class, for this specific mind. Not general capability — specific accuracy on this corpus.

**This is honest Layer 4.** Not autonomous prompt rewriting (which makes the system opaque). Transparent self-knowledge displayed in SUBSTRATE.

**Code truth — current `prediction_tag` values** (`guardian.js` → `scorePredictionOutcome`):

| Shipped tag | Maps to blueprint class | Scoring basis |
|-------------|-------------------------|---------------|
| `next_escalating` | `tension` | `emotional_arc.tension_shift > 0.02` on next save |
| `next_arc_flat` | `tension` | default tag; flat arc on next save |
| `orbit_persists` | `orbit` | orbit terms retained in next fast map |
| `silence_holds` | `tension` / silence | `silence_weight.ratio` threshold |

**Tags not yet shipped (add when mechanic exists):**

| Blueprint class | Future tag | Source |
|-----------------|------------|--------|
| `resurgence` | TBD e.g. `term_resurges` | half-life resurgence fires |
| `bridge` | TBD e.g. `correction_holds` | bridge open → relapse check lifecycle |

Aggregate `guardian_logs.prediction_outcome` grouped by mapped class (`hit` / `miss` / `partial`).

**SUBSTRATE display:**

```
WITNESS CONFIDENCE
tension 0.78 · resurgence calibrating · bridge calibrating · orbit 0.40
```

**Non-negotiable guard:** if N < 10 passes per signal class, show `calibrating` not a number. False precision betrays the entire frame. User Zero may show `calibrating` for months — on-brand.

**Saccade → confidence feed:** When the saccade log shows a blind tier, predictions from that class carry a confidence penalty automatically. Closes the gap between “I didn’t read that” and “my predictions based on that are less reliable.”

-----

### W5-B — Affective Delta

*Addresses: Limit 6 — Affective forecasting error*

**What the brain does:** Overwrites how it felt in the past with how it feels now. Confuses declaring peace with closing the orbit. Linguistic resolution and geometric resolution are not the same event — but the brain cannot see the difference.

**What the exoskeleton holds:** The actual emotional arc geometry at a previous moment — before the current state contaminated the memory of it.

**The distinction:**

Linguistic resolution: the user writes “I’ve made peace with this.”
Geometric resolution: the orbit actually closed, the tension arc actually dropped, the term actually decayed.

These are different. The exoskeleton can see the difference. The brain cannot.

**Detection logic:**

When a topic cluster reactivates per §2.1 (`cluster_id` match, ≥ 21 days gap):

1. Retrieve pinned snapshot from last activation (W5-E dependency)
2. Compare emotional arc signature: tension level, resolution status, self-ref ratio within cluster
3. Compare negative space delta — terms present then, absent now, and vice versa

Negative space: not just “how you felt then vs now” but what stopped appearing. Brains remember what was said. They are blind to what became unsayable.

**Guardian output (geometry only):**

*“This cluster was last active [N] days ago. Arc then: tension [level], unresolved. Arc now: settled. Terms no longer appearing: X, Y. Terms newly present: A, B.”*

No verdict on whether the settlement is real or linguistic. The geometry then. The geometry now. The delta. The user reads it.

**W5-E dependency:** Affective delta requires pinned snapshots to measure against. Build E-lite first.

-----

### W5-D — Steel Man Mirror

*Addresses: Limit 2 — Motivated reasoning*

**What the brain does:** Rejects uncomfortable claims not by engaging their strongest version but by attacking their weakest. Strawmans its own inconvenient truths.

**What the exoskeleton holds:** The strongest possible version of the rejected claim — permanently, in the ledger, available when the user is ready.

**Mechanics:**

When a bridge opens (user rejects a Guardian theory):

1. Generate `steel_man_theory` — one line, ~30 tokens maximum
2. **Source (PWA default):** deterministic reassembly from highest-confidence Cartographer fields that supported the original theory — **no API required**
3. **Source (desktop optional):** constrained Guardian call may enrich the line — never required for ship
4. Store in `bridge_rows.steel_man_theory`
5. Display: bridge detail view only — user must open the row to see it
6. No prose around it. No Guardian commentary. Just the line.

**Generation timing:** Generate immediately at reject (while context is fresh). Display deferred until bridge detail is opened. Generation ≠ display.

**Generate on reject only, not on correct.**

**W5-practice gate:** Do not dogfood steel man breach until ≥1 real bridge rejection exists (`witness-loop-upgrade-blueprint.md` §7F).

**Containment breach condition:**

If `steel_man_convergence` is detected — the user is behaviorally writing the geometry of what they previously rejected — the steel man surfaces in the sequential witness pass. Motivated reasoning will ensure the user never opens the bridge detail row. When behavioral geometry matches the rejected coordinate, the pass shows:

```
STEEL MAN (W5-D)
  rejected [date]: '[steel_man_theory]'
  current map coordinates: [geometric match]
```

No accusation. No verdict. The coordinate rejected. The coordinate now present. The date. The human reads it.

**Breach gate:** Require `steel_man_convergence` sustained across **≥ 2 consecutive synapse builds**. A single session is not behavioral geometry. **Never surface in pass on first convergence** — persistence only, same philosophy as W5-F.

**Relapse taxonomy:**

| Species | Geometry | Guardian output style |
|---------|----------|----------------------|
| `geometric_return` | Original attractor reasserted | Arc coordinates then and now |
| `linguistic_resolution` | Declaration without geometric shift | Arc unchanged. Declaration date noted. |
| `steel_man_convergence` | Writing the rejected coordinate | Rejected [date]. Present now. |
| `denial_sediment_reactivation` | Rejection pattern reactivated on same keys | N rejects on same signal. Pattern date. |

**Decay velocity (new field on `bridge_rows`):**

| Category | Δt | What to surface |
|----------|-----|-----------------|
| `rapid_collapse` | < 3 days | Bridge open date. Relapse date. Δt: [N] days. |
| `standard` | 3–30 days | Standard relapse geometry |
| `slow_erosion` | > 30 days | Bridge open date. Relapse date. Pinned snapshot from bridge open (W5-E). |

Same geometry. Different temporal signature. The output is always pure measurement — never the interpretation of which category is “worse.”

-----

### W5-F — Integration Gate

*Addresses: All eight limits — integration bandwidth*

**What the brain does:** Uses filters partly to allow consolidation. The right response after a high-voltage signal is sometimes silence and integration time — not more analysis.

**What the exoskeleton does:** Accumulates sub-threshold signals across 2–3 synapse builds before surfacing them. The threshold queue is a persistence filter, not only a priority sorter.

**Rule:** A signal appearing once and disappearing was probably noise. A signal persisting across 3 sessions without regression is structural.

**Implementation:** `persistence_count` field on threshold conditions. Guardian fires only when `persistence_count >= PERSISTENCE_THRESHOLD` (dogfood: 2).

**Exception:** Bridge relapse fires immediately regardless of persistence. A correction that didn’t hold is time-sensitive.

**This is not a cooldown timer.** A cooldown says “wait N hours.” The integration gate says “this pattern has appeared across multiple sessions — it is structural, not a spike.”

-----

### W5-G — Gap Question (E + B synthesis)

*Addresses: Limits 6, 7, 8 simultaneously*

When a cluster reactivates per §2.1 AND a pinned snapshot exists from the previous activation, the witness holds three coordinates simultaneously:

1. Pinned posture vector from last activation (W5-E)
2. Negative space delta — terms present then, absent now (W5-B)
3. Affective arc comparison — tension geometry then vs now (W5-B)

**The question:**

*“What happened in the interval?”*

Three held coordinates. One question. The user writes the story. The exoskeleton held what reconsolidation would have contaminated.

This is the product in one interaction. No journaling app does this. No human witness can do this reliably over 94 days. This is the exoskeleton doing something genuinely impossible without it.

**Supersedes (in spirit):** legacy W6 temporal compare register — `delta_since_last_synapse` lives here.

-----

### W5-H — Hebbian Lock Detection (Phase B north star)

*Addresses: Limit 5 — Hebbian locking*

**What the brain does:** Concepts fused in high-voltage formative moments stay locked together permanently — even when the link is no longer accurate or useful.

**What the exoskeleton holds:** The co-occurrence fossil. The pair that has never appeared separately in 6+ months of writing.

**Detection:** Terms with ≥ 90% co-occurrence AND ≥ 15 total appearances AND ≥ 3 separate discourses across ≥ 6 months of corpus. All three conditions required. Two obscure terms appearing twice is a rare event, not a Hebbian lock.

**Guardian output (geometry only):**

*“‘{term-A}’ and ‘{term-B}’ have appeared separately in [N] of [total] discourses over 6 months.”*

Not “you fused these in a moment of pain.” Just the co-occurrence number. The user decides what the inseparability means.

**Why Phase B:** Requires corpus depth — minimum 6 months of organic writing. Plant the co-occurrence tracking now. Detect the locks when the data exists.

**Confirmed correction reinforcement:** When a user corrects a Guardian theory and the correction survives relapse detection — that link becomes a structurally reinforced lock in the IDB. Long-term potentiation. Confirmed truths carry different weight than unconfirmed patterns.

**Decay guard:** Confirmed correction ≠ eternal truth. If a reinforced link **relapses after 90+ days**, reinforced weight **decays** — same as any other geometry. The exoskeleton must not Hebbian-lock its own confirmations.

-----

## 5. Living Questions (§14 — 48-hour gate, do not build yet)

Four mechanics from creative review. Per dev rules §0, these sit here for 48 hours minimum before graduating to the active build table. Each must pass the geometry-not-diagnosis rule before implementation.

-----

### LQ-W5-I — State-Dependent Retrieval

*Biological limit: The brain encodes memories with the emotional and physiological context of the moment. When the retrieval state doesn’t match the encoding state, the memory is inaccessible — not because it is gone, but because the key doesn’t fit the lock.*

**What the exoskeleton holds:** The posture vector as encoding context — pinned at the moment a significant observation was made.

**Mechanic:** When W5-E pins a snapshot, it also pins the exact `posture_vector` and `weather_state` as the encoding context. If the user returns to that cluster months later with a radically different posture vector — flag a context mismatch.

**Output (geometry only):**

*“Posture at encoding: resistance 0.8, coherence 0.6. Posture now: resistance 0.1, coherence 1.0. The map is being read from a different state than the one that wrote it.”*

No interpretation of what that means. No suggestion about what to do. Just the two posture vectors and the delta. The user decides whether the distance matters.

**Why it fits:** Explains why old Guardian observations sometimes land and sometimes don’t. Not because the observation was wrong — because the biological substrate is tuned to a different frequency. The exoskeleton holds both states without collapsing them.

**Design note:** Cheapest W5 mechanic after E-lite — W5-E already pins posture; W5-I is comparison on reactivation per §2.1. **Promoted to PWA after E-lite** (no BGE required).

-----

### LQ-W5-J — Cognitive Hysteresis

*Biological limit: The brain lies about its current state because the biological hysteresis loop hasn’t closed. You declare “I have made peace with this” 20 minutes after a massive argument — but your syntax, pacing, and lexical density are still carrying the kinetic energy of the stressor.*

**What the exoskeleton holds:** The decay curve of kinetic energy after a declared resolution.

**Mechanic:** When a user writes an explicit linguistic resolution (“I’m over it”, “it’s resolved”, “I’ve made peace”) immediately following a high-tension arc — measure the Hysteresis Lag. Compare the declared resolution against sentence complexity, absolute-word density, and pacing in the next 3 discourses.

**Guard:** Must gate on BOTH the linguistic marker AND a prior high-tension arc in the same or immediately preceding discourse. Without prior tension context, the check fires on every philosophical acceptance statement — false voltage.

**Output (geometry only):**

*“Linguistic resolution marker: [date]. Geometric tail: tension indicators present in subsequent [N] discourses. Tail flattened: [date + N days].”*

Not “the mind moved on before the nervous system did” — that is interpretation. Just the dates and the measurement. The gap between declaration and geometric flattening is the data. The user supplies the meaning.

**Why it fits:** The gap between linguistic declaration and physiological reality is exactly what the brain cannot see in itself. The exoskeleton holds the decay curve without judgment.

-----

### LQ-W5-L — Nihilistic Trivialization

*Biological limit: When the brain faces unbearable cognitive dissonance that it cannot resolve via motivated reasoning, it uses the ultimate escape hatch — declares the entire premise meaningless and ejects the structural mass.*

**What the exoskeleton holds:** The ejection event — the moment the orbit was abandoned not because it resolved but because the voltage became too high.

**Mechanic:** Detect **significant** drops in orbit gravity for a term (magnitude threshold — dogfood TBD, not merely “any drop”), accompanied by apathy/nihilism markers (“whatever”, “pointless”, “doesn’t matter”, “absurd”), within close temporal proximity to a high-voltage bridge relapse or failed steel man convergence.

**Guard:** All **four** conditions required simultaneously — **orbit gravity drop above magnitude floor**, apathy markers, recent high-voltage event, **and** temporal window ≤ N days. Apathy markers alone are not the signal. Someone who genuinely engages with absurdism writes this vocabulary constantly. The temporal correlation with a high-voltage event is what distinguishes ego ejection from philosophical inquiry.

**Output (geometry only):**

*“Orbit gravity for ‘{term}’: [score before] → [score after], [N] days after bridge relapse on [date]. Apathy markers present in same window.”*

No verdict on whether the ejection was defensive. Just: the orbit was high-gravity. Then it dropped by [magnitude]. Here is the temporal context. The user reads it.

**Why it fits:** Catches the most sophisticated ego defense — the one that looks like philosophical wisdom but is actually escape from a specific pressure. The timing is the signal, not the language.

**Status:** Full 48h Living Questions — noisy for User Zero if corpus includes philosophical absurdism writing.

-----

### LQ-W5-N — Performative Geometry (Goodhart’s Law)

*Biological limit: When a measure becomes a target, it ceases to be a good measure. Once the user understands what the exoskeleton tracks, the ego will attempt to game the audit engine — writing specifically to close orbits, move scalars, or clean the process panel.*

**What the exoskeleton holds:** The observer effect — when the geometry reacts to the mirror rather than the territory.

**Mechanic:** If `elaboration_delta` or `arc_shift` spikes within a short window after the user opens the process panel, but the underlying `watcher_cosine` to historical baseline remains unchanged — the geometry shifted without the semantic map moving.

**Guard:** The Watcher cosine check is the critical gate. A genuine new insight after opening the panel will move both the arc AND the Watcher embedding. Only arc movement without embedding movement is the signal. Without this guard, the mechanic accuses genuine reflection.

**Output (geometry only):**

*“Arc shift: [magnitude]. Watcher embedding shift: [near-zero]. Process panel opened: [N] minutes prior.”*

Three facts. No verdict. No “you are performing for the witness” — that is diagnosis, not geometry. The correlation is the data. What it means is the user’s question.

**Placement (non-negotiable):** SUBSTRATE scalar line only — **never** sequential witness pass confrontation. Surfaces once, quietly. User who never performs for the witness never sees it fire.

**Why it fits:** The most philosophically necessary defense against the audit engine being colonized by the ego it is supposed to witness. Lightest possible touch.

-----

### LQ — Somatic Proxy (cadence as friction score)

*Held in Living Questions pending philosophical decision — not 48 hours, indefinite.*

The science is real: high-tension thought physically changes keystroke cadence. The biological backspace is real — the body felt it, the ego deleted it before it hit the database. Measuring cadence without storing keystrokes is technically possible.

**Why it is held indefinitely:** The exoskeleton’s current perception boundary is the written text. Everything it sees entered the vault voluntarily — the user typed words, saved them, gave them to the witness. Keystroke cadence is different. It is the body leaking signal the conscious mind did not choose to offer. For a sovereign app whose entire philosophy opposes surveillance — measuring involuntary physiological signals requires a philosophical decision about where the Umwelt boundary should be. That decision cannot be made under build pressure.

If this ever graduates from Living Questions, it requires explicit user opt-in, full transparency about what is measured, and a clear statement that the data never leaves the device. Not a default. A deliberate choice.

-----

## 6. The gap question in the witness panel

W5 mechanics are pass material — they surface in the sequential witness panel, not as static scalars only.

When a threshold fires, the panel names the signal clearly without naming the biological limit in user-facing copy:

```
READING CORPUS
  47 discourses · 31,240 words

CARTOGRAPHER
  ...

COORDINATE SHIFT
  '{term}' early neighborhood: X, Y, Z
  '{term}' recent neighborhood: A, B, C
  drift score: 0.61

GUARDIAN THINKING
  [local reasoning — what the geometry suggests, no verdict]

GUARDIAN
  [observation — geometry only, human supplies meaning]
```

The pass narrates what changed. It does not narrate what the change means about the user.

**Exception:** LQ-W5-N (performative geometry) — SUBSTRATE only, never pass material.

-----

## 7. Build order

| Pass | Mechanic | Biological limit | Dependency | Platform |
|------|----------|------------------|------------|----------|
| **W5-E-lite** | Temporal anchoring + ANCHORS HELD + anchor diff | 8 — Reconsolidation | None; extends `geometry_at_open` | PWA now |
| **W5-I** | State-dependent retrieval | Encoding context mismatch | W5-E-lite, §2.1 | PWA now |
| **W5-A-scout** | Lexical archaeology (collocation shift) | 7 — Semantic drift | None | PWA now |
| **W5-C** | Prediction confidence + saccade penalty | 3 + epistemic humility | 10+ prediction outcomes per class | PWA now |
| **W5-F** | Integration gate + FORMING display | All — integration bandwidth | W1–W4 threshold engine | PWA now |
| **W5-A-full** | Semantic drift (embedding clusters) | 7 — Semantic drift | W5-E-lite, Watcher BGE | Desktop |
| **W5-B** | Affective delta + negative space | 6 — Affective forecasting | W5-E-lite, §2.1, Cartographer | Desktop |
| **W5-G** | Gap question synthesis | 6, 7, 8 | W5-E, W5-B | Desktop |
| **W5-D** | Steel man mirror + breach condition | 2 — Motivated reasoning | W5-practice (real bridges) | Desktop |
| **W5-J** | Cognitive hysteresis | Physiological lag | W5-E, corpus depth | Desktop |
| **W5-L** | Nihilistic trivialization | Ego ejection | W5-D, bridge events | Desktop |
| **W5-N** | Performative geometry | Observer effect | Real corpus, process panel | Desktop |
| **W5-H** | Hebbian lock detection | 5 — Hebbian locking | 6+ months corpus | Phase B |

**PWA-safe now:** W5-E-lite, W5-I, W5-A-scout, W5-C, W5-F
**Desktop first pass:** W5-A-full, W5-B, W5-G, W5-D
**Desktop second pass (after W5-practice):** W5-J, W5-L, W5-N
**Phase B after corpus depth:** W5-H
**Indefinite hold:** Somatic proxy

**First Cursor batch (when gated):** W5-E-lite only — one table, existing event hooks, ANCHORS HELD, optional anchor diff. No Guardian prompt changes.

-----

## 8. What not to build

| Idea | Why not |
|------|---------|
| Autonomous prompt rewriting based on miss rate | Makes the system opaque — the exoskeleton gaslighting itself. W5-C is the honest implementation |
| Removing invoke gate | A thin-map oracle participates in the lie |
| Stacking 5 anomalies in one save | Integration bandwidth is a biological limit too |
| Claiming totality | One SUBSTRATE line forever: what is not in the vault |
| Psychological diagnosis in output | “You are performing” / “you ejected the mass” / “your correction was performative” — all diagnosis. Rewrite as geometry every time |
| Word censoring or content filtering | The vault is sovereign. Censoring words in your own encrypted vault contradicts the entire architecture |
| Somatic proxy without explicit opt-in | Involuntary physiological signal without consent is not sovereign |
| Steel man requiring API on PWA | Deterministic Cartographer reassembly is the default; network is optional enrichment |
| Performative geometry in witness pass | SUBSTRATE only — pass confrontation becomes surveillance cosplay |

-----

## 9. The philosopher cue updates (W5 alignment)

W5-A (semantic drift) — Wittgenstein:

```
"Is '{term}' the same word it was when you first used it?"
"What did '{term}' mean before it became useful to you?"
"Where did '{term}' change — in the world or in your writing?"
```

W5-B (affective delta) — Rovelli:

```
"The geometry of '{term}' then and now are different shapes. Which one remembers accurately?"
"What did '{term}' feel like before you made peace with it — and what does that tell you about the peace?"
```

W5-G (gap question) — Rilke:

```
"What happened to you in the interval when '{term}' was quiet?"
"What did '{term}' become while you were not writing about it?"
```

W5-I (state-dependent retrieval) — Spinoza:

```
"What necessary condition made '{term}' visible then that is absent now?"
"What would it mean to read this from the state that wrote it?"
```

W5-J (hysteresis) — Rovelli:

```
"The declaration came before the geometry settled. Which one is the real time?"
"What was still moving in you after you said it had stopped?"
```

-----

## 10. One sentence underneath the whole document

*The brain protects itself through forgetting, redefining, misremembering, strawmanning, and ignoring its own unreliability.*

*The exoskeleton holds, precisely and without flattery, everything the brain would prefer not to keep.*

*Whether existence cuts or hugs or both — the burden lies on the existence itself.*

-----

## 11. Revision log

| Date | Change |
|------|--------|
| 2026-05-31 | Initial pin — 8 biological limits, W5-A through W5-H, E-lite build first, integration gate, gap question synthesis, philosopher cue additions, build order PWA vs desktop vs Phase B |
| 2026-05-31 | Rev 2 — steel man breach condition; decay velocity taxonomy; domain anchor pre-check; ANCHORS HELD counter; Hebbian frequency floor; FORMING visibility rule |
| 2026-05-31 | Rev 3 — Geometry-not-diagnosis rule §1.1; four Living Questions (W5-I, W5-J, W5-L, W5-N); somatic proxy indefinite hold; founding principle §0; philosopher cues for W5-I and W5-J |
| 2026-05-31 | Rev 4 — Register merge (§0 W5-practice vs W5 mechanics; W6 → W5-E+G); §2.1 cluster_id contract; W5-E `geometry_at_open` precursor + backfill; W5-C code-truth tag mapping; W5-D deterministic steel man + W5-practice gate; W5-H reinforcement decay; anchor diff view; W5-I promoted PWA; LQ-W5-L magnitude guard; LQ-W5-N SUBSTRATE-only placement; §8 extensions |

-----
