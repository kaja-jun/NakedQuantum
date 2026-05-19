# Guardian & Cartographer Refinement — Roadmap Blueprint

> **Canonical roadmap** for evolving Guardian from *accurate mirror* toward *obsessive meta‑meta cognition* — and hardening Cartographer so the mirror does not lie at the sensory layer.
>
> Consolidates: co-creator Guardian architecture session (May 2026), Kimi 2.6 honest review, cartographer v0.3 merge (PR #31), and Kaja’s production/dev intent.
>
> **Read with:** `lighthouse-cockpit-blueprint.md` (desktop strip / cockpit — *wait for laptop/Tauri*), `NQ blueprint.md`, `AGENTS.md`.

---

## 0. How to use this document

| Rule | Meaning |
|------|---------|
| **One batch at a time** | Pick the next unchecked item; ship; tick + date in **Shipped log**; re-read this file before the next batch. |
| **Blueprint first** | If implementation diverges, update **this file** (or spell delta in PR), not only chat. |
| **Sanctuary is blind** | Guardian never reads Sanctuary, characters-in-chat, or pre-Engram private writing. |
| **Geometry vs language** | Cartographer + Watcher = always-on dumb signal; Guardian language = rare, bounded, dismissible. |
| **Zero-deps default** | No npm for Cartographer fixes; lexicon expansion manual or offline-bundled only if Kaja approves. |

---

## 1. North star

**Not:** a mirror that reflects the archive back (intimidating, sacred, passive).

**Not:** a chatbot coach, wellness tone, or spammy “AI insights.”

**Yes:** a **witness with memory shape** — can doubt its own prior theories using structured data, not only two paragraphs of past prose.

| Today (architecturally) | Target |
|-------------------------|--------|
| Auto strip: one-liner from single-discourse geometry | Cheap path that can reference **one prior theory line** |
| Summon: full archive dump + last 2 log texts | **Tiered** archive + **witness ledger** + geometry diffs |
| Prompt asks “compare your last witness” | Database gives Guardian **enough of himself to wonder** |
| Labels like “Completely detached” | **Suggests…** + confidence; consensus before strong claims |

**One sentence:** Cartographer measures honestly; Watcher connects; Guardian speaks rarely — and when he speaks, he remembers what he claimed and can see whether the archive moved.

---

## 2. Constraints (not excuses — design boundaries)

| Constraint | Implication for this roadmap |
|------------|------------------------------|
| Built on **iPhone**, no laptop yet | Monolithic `app.js`, main-thread models, inline SQL worker — **acceptable for now**; module split waits for Tauri/desktop gate. |
| **Safari** gates workers/CORS/blob WASM paths | Prefer fixes that work in PWA today; don’t assume Worker-first ML without a Safari proof. |
| **Zero user / dev mode** | Thresholds intentionally low for continuous testing; **production values** documented in §3 — must be flipped before “real” ship. |
| **Abyss ~0.10** | Hash layout is placeholder; **3D living cosmos** is the goal; honesty label or embedding-driven layout comes before pretending x/y is semantic. |
| **DistilBART deep maps** | Already the compression layer before Guardian; summon diet = **when/what tier** hits the model, not “add summarization.” |

---

## 3. Dev vs production knobs (record when changed)

| Knob | Dev (now) | Production intent (Kaja) |
|------|-----------|---------------------------|
| Guardian auto-invoke cadence | Low cooldowns, easy qualifiers | ~**72h** minimum; only if **important** |
| Watcher similarity threshold | ~0.5 (testing) | **0.72+** |
| Dismiss backoff | 5+ with &lt;2 qualifiers; cap 10 | Keep ethics; raise qualifier **confidence** bar |
| Auto-invoke surface | **Strip under header only** — never modal, never other realms | Unchanged |
| Summon context | All discourses’ fast maps + all deep maps + watcher aggregates | **Tiered** (§7) |

---

## 4. Guardian today — three doors, one archive

```mermaid
flowchart TB
  subgraph soup [Soup only — never Sanctuary]
    D[cosm_discourses raw_text]
    FM[guardian_summaries fast maps]
    DM[guardian_summaries id_deep DistilBART]
    GL[guardian_logs]
  end
  subgraph pathA [Path A — Auto invoke strip]
    T[checkGuardianTrigger geometry + LS clocks]
    W[naked-guardian worker tiny snapshot]
    GL
  end
  subgraph pathB [Path B — Full summon realm]
    CTX[buildGuardianContext all discs]
    L2[last 2 non-silent log response_text]
    LLM[BYOK OpenRouter + GUARDIAN_SYSTEM_PROMPT]
    GL
  end
  subgraph pathC [Path C — Session follow-up]
    TH[guardianThread in memory only]
    LLM
  end
  D --> FM
  FM --> T
  T --> W
  D --> CTX
  FM --> CTX
  DM --> CTX
  CTX --> L2
  L2 --> LLM
  TH --> LLM
```

### What each path is fed

| Path | Trigger | Data fed | Own logs / bias memory? |
|------|---------|----------|-------------------------|
| **A — Auto strip** | After `generateFastMap` + `checkGuardianTrigger` | Worker snapshot: orbiting terms, writing signature, silence markers, paradox/contradiction flags, dominant theme — **not** raw text, **not** archive | **No** |
| **B — Full summon** | User summons (BYOK) | `buildGuardianContext`: every discourse fast map (or excerpt), all `*_deep` summaries, watcher top links + recurring terms + arc aggregates; **+ last 2** `guardian_logs.response_text` with compare instructions | **Partial** — 2 prose blobs only |
| **C — Follow-up** | User types in Guardian realm | `guardianThread` + initial `guardianContextBlock` | Session only; **not** reloaded next summon |

### Data layers (Guardian-visible)

| Layer | Source | Notes |
|-------|--------|-------|
| 0 | Soup discourses only | `getDiscourses()` — engrammed archive |
| 1 | Fast maps | `cartographer.js` → `generateFastMapData` + `injectWatcherFlags` → `guardian_summaries` (`map_type: 'fast'`) |
| 2 | Deep maps | Sovereign Cartographer run → `{id}_deep` DistilBART |
| 3 | Watcher aggregates | On full summon only: top links, recurring terms, arc patterns |
| — | `log_type`, `auto_invoked`, `triggered_by` in DB | **Not** in LLM context today |

### Gap (why it still feels like a mirror)

- Prompt says Guardian is **not** a mirror; architecture still **reflects** (archive dump + compare two monologues).
- **Obsessive meta‑meta cognition** needs **memory shape**: prior claims indexed, geometry-then-vs-now, explicit uncertainty — not only “last 2 paragraphs.”

---

## 5. Epistemological gaps (Kimi + our code review)

| Layer | Risk | Roadmap phase |
|-------|------|----------------|
| **Sensory** (Cartographer) | Tiny lexicons, no negation, `-ing` stemmer mangles `nothing`→`noth`, noisy paradox window, strong labels without confidence | **§6** |
| **Interpretive** (Guardian summon) | Linear context growth with archive size; deep maps + all fast maps | **§7** |
| **Cross-modal** | Watcher similarity vs Cartographer arc not synthesized | **§8** |
| **Representational** (Abyss) | Hash x/y + similarity lines look semantic | **§9** |
| **Interruption** (Auto-invoke) | Weak qualifiers in dev mode | **§10** + §3 production knobs |
| **Self-model** (Guardian) | No witness ledger, no theory diff | **§7 G1–G4** |

---

## 6. Phase C — Cartographer hardening (highest leverage first)

*Cartographer is the nervous system for Guardian, auto-invoke, and Abyss dots. Fix sensing before more Guardian prose.*

- [ ] **C1 — Stemmer safety** — Never emit broken stems (`nothing`→`noth`, `thing`→`th`). Prefer: expand `LEMMA_MAP`, or only strip `-ing` when result is in a lexicon / min length.
- [ ] **C2 — Negation flipper** — `not|never|no|n't` within 2 tokens flips sentiment hit for scoring functions (not full NLP).
- [ ] **C3 — Lexicon expansion** — Manual curated batches per category (aim ~10× coverage); include contractions (`don't` → treat as negation + stem). **No** runtime GloVe unless offline bundle approved.
- [ ] **C4 — Detector confidence** — Each detector returns `confidence: 0–1` from signal strength; `checkGuardianTrigger` ignores low-confidence qualifiers.
- [ ] **C5 — Label softening** — e.g. depersonalisation: “Suggests detachment…” not “Completely detached”; require 2+ detectors for auto-invoke “strong” claims (policy).
- [ ] **C6 — extractiveSummary** — Score all sentences; don’t pre-drop &lt;20 char lines before pick; split on `/[.!?]+/` cleanly.
- [ ] **C7 — Paradox proximity** — Tighten or require clausal tension; reduce “I love this dark room” false positives (tune window / POS-free heuristics).
- [ ] **C8 — Tokenize once** — Optional refactor: single `tokenize(text)` pass shared by detectors (perf; not required for correctness).

**Shipped (main):** PR #31 — emotional arc fix, orphan block removed, `tokenize` in summary/incompleteness, `depersonalisation` in `buildGuardianContext`, `silenceMarkers` rename.

---

## 7. Phase G — Guardian meta-memory & summon diet

### G0 — Understand (done)

- [x] Document three paths, data layers, log behavior (this blueprint §4).

### G1 — Witness ledger (local, no new LLM)

- [ ] Extend `guardian_logs` (or companion store) with structured fields: `primary_discourse_id`, `qualifiers[]`, `theory_one_line` (optional extract post-response), `fast_map_snapshot_hash` or key terms at invoke time.
- [ ] On summon: feed **last N structured theories** (not only raw `response_text`).
- [ ] Include `log_type` / `auto_invoked` / `triggered_by` in context so Guardian can separate strip vs summon voice.

### G2 — Self-diff on summon (Cartographer-only)

- [ ] Before LLM: compute **geometry delta** since last invoke on same discourse / shared orbit terms.
- [ ] Inject block: `GEOMETRY SINCE LAST WITNESS` (facts, not performative doubt).
- [ ] Optional: “I said X when orbit was high; orbit still high but terms shifted.”

### G3 — Tiered summon context (fix “memory bomb”)

- [ ] **Tier 1 (always):** Last 3 discourses — full fast maps + edges + depersonalisation + new dimensions.
- [ ] **Tier 2:** Top 5 watcher echoes/contradictions **with synthesis line** (§8).
- [ ] **Tier 3:** Deep maps only for “urgent” discourses (existing urgent logic), not all `*_deep` every summon.
- [ ] **Tier 4:** Archive rollup — counts, date span, arc aggregates (one paragraph stats).
- [ ] Cap total context budget (chars/tokens) with deterministic truncation order.

### G4 — Worker strip upgrade (optional, cheap)

- [ ] Auto-invoke worker receives **one prior theory line** + current snapshot (still no full archive).
- [ ] Starts minimal “wondering” without summon cost.

### G5 — Guardian interaction (beyond mirror)

- [ ] Refine `GUARDIAN_SYSTEM_PROMPT` for meta-cognition: questions not verdicts; explicit uncertainty; SILENCE unchanged.
- [ ] UI: less intimidating / more accurate — copy and rhythm in Guardian realm (design pass; no Sanctuary bleed).
- [ ] Follow-up sessions: optional reload of **ledger summary** (not full thread JSON) on new summon.

### G6 — Cockpit whisper (desktop — defer)

- [ ] See `lighthouse-cockpit-blueprint.md` Phases A–D; uses ledger + live map.
- [ ] **Gate:** laptop / Tauri shell ready.

**Anti-edgy guardrails (all G phases):** dismiss; silence; no Sanctuary; rate limits; strip-only auto surface.

---

## 8. Phase X — Cross-modal synthesis (Watcher × Cartographer)

- [ ] `divergenceNote(link, mapA, mapB, embeddingScore)` — one line for Guardian context, e.g. “High semantic echo (87%) but opposing emotional arc (escalating vs resolving).”
- [ ] Feed in **Tier 2** summon block, not separate orphan lists.
- [ ] Do **not** merge Watcher into Cartographer code — keep modules separate, synthesize at context-build time in `app.js` (or future `guardian.js`).

---

## 9. Phase AB — Abyss honesty (parallel track, 3D future)

*Current: hash-seeded positions (`abyssHash(d.id)`); threads connect hash points — ritual layout, not semantic map.*

- [ ] **AB1 — Honest labeling** — Subtle UI copy: constellation / ritual layout until embedding-driven positions ship.
- [ ] **AB2 — 3D cosmos** — Continue Kaja’s 0.10 → living cosmos; positions driven by real geometry when ready (UMAP/t-SNE on cached BGE or equivalent **offline**).
- [ ] **AB3 — Thread semantics** — Only draw “proximity” threads when layout coordinates reflect similarity (or style differently for chronological/hash links).

*Does not block G1–G3; blocks trusting Abyss as “my mind map” without disclaimer.*

---

## 10. Phase A — Auto-invoke production ethics

- [ ] **A1 — Production thresholds** — Apply §3 (72h, higher watcher, confidence-gated qualifiers).
- [ ] **A2 — Opt-in** — Settings: master off / per trigger type (orbit, paradox, silence, escalating arc).
- [ ] **A3 — Consensus** — Auto-invoke requires 2+ **high-confidence** qualifiers OR single “strong” signal (define in C4/C5).

*Strip under header remains the only auto surface.*

---

## 11. Phase ARCH — Structural (later, not blocking truth)

| Item | Gate |
|------|------|
| Split `app.js` → `db.js`, `watcher.js`, `guardian.js`, `abyss.js`, UI modules | Tauri / build story / Kaja approval |
| Panel state machine instead of `showPanel` god path | After split or desktop |
| Single-flight embedder load/dispose (Guardian entry) | iPhone 14 soak test |
| iPhone 14 memory soak | Before raising Watcher/DeepMapper concurrency |

*Kimi’s “split app.js” is valid; **not** laziness — Safari + solo iPhone dev order.*

---

## 12. Recommended batch order (one by one)

| Order | Phase | Why |
|-------|-------|-----|
| 1 | **C1–C2** | Stop wrong geometry (stemmer, negation) |
| 2 | **C3–C5** | Coverage + confidence + label ethics |
| 3 | **G3** | Summon usable at scale (tiered context) |
| 4 | **G1–G2** | Meta-memory + self-diff |
| 5 | **X1** | Cross-modal truth in one line |
| 6 | **G4–G5** | Strip upgrade + prompt/UI interaction |
| 7 | **A1–A3** | Flip dev → production auto-invoke |
| 8 | **C6–C8** | Summary/paradox/perf polish |
| 9 | **AB1–AB3** | Abyss honesty alongside 3D work |
| 10 | **G6, ARCH** | Desktop / refactor when laptop ready |

---

## 13. Explicitly out of scope (unless amended)

- Sanctuary surveillance or Guardian in Sanctuary chat.
- Replacing Cartographer with one big LLM for geometry.
- npm/bundler for lexicon expansion without approval.
- Auto-invoke modals, banners, or notification-style spam.
- Open-sourcing or growth-hack onboarding.

---

## 14. Related documents

| Doc | Relationship |
|-----|----------------|
| `lighthouse-cockpit-blueprint.md` | Desktop write column + live strip; Guardian whisper channel; **wait for Tauri** |
| `NQ blueprint.md` | Realms, Engram, core ethics |
| `NakedQuantum story.md` | Vision and tone |
| `AGENTS.md` | Agent collaboration, Safari, lint |
| Kimi review (conversation export) | External honest review — sensory/interpretive/representational gaps |

---

## 15. Open questions (resolve before implementing G1/G3)

1. **N for witness ledger** — 3 vs 5 structured theories on summon?
2. **theory_one_line** — LLM-extracted after response vs rule-based from qualifiers?
3. **Tier 1 “last 3 discourses”** — by `updated_at` or `created_at`?
4. **Deep map tier** — keep “urgent” heuristic as-is or tie to word count + arc delta?
5. **Re-map policy** — force Cartographer refresh on all discs after C1–C3 lexicon change?

```
(decisions log — Kaja fills when decided)
```

---

## Shipped log

| Item | Date | Notes |
|------|------|-------|
| G0 | 2026-05 | Three-path architecture documented (co-creator session) |
| Cartographer PR #31 | 2026-05 | Blockers, tokenize consistency, depersonalisation in summon context, silenceMarkers |
| This blueprint pinned | 2026-05-18 | Roadmap consolidates Guardian + Kimi + production intent |

---

*Closer to the code and philosophy than anyone else: Kaja + the next agent who reads this file first.*
