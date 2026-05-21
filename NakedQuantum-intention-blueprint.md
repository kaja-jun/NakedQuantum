# NakedQuantum — Intention Blueprint (pinned)

> **Purpose:** Canonical statement of **what NakedQuantum is for** and **what it must never become**. Use this for contemplation, design sessions, and agent handoff — **before** feature blueprints or code.
>
> **Not this doc:** Implementation batches, shipped PRs, or file-level maps. Those live in `consciousness-exoskeleton-roadmap-blueprint.md`, `guardian-refinement-roadmap-blueprint.md`, `lighthouse-cockpit-blueprint.md`, `NakedQuantum-app-blueprint.md`, and `NakedQuantum-checkpoint-2026-05.md`.
>
> **Author:** Kaja (vision) · **Last updated:** May 2026

---

## 0. How to use this document

| Rule | Meaning |
|------|---------|
| **Intention first** | If a feature idea isn’t traceable to §2–§8, it’s scaffolding — question it. |
| **Blueprint before code** | Update this doc when intention shifts; update feature blueprints when scope shifts. |
| **Discussion welcome** | Sections marked *Living* are deliberate questions, not omissions. |
| **Shipped code ≠ final form** | The PWA on `main` is a valid nervous system; the **costume** (nav, chat-default Guardian, strip-as-voice) may still change. |

---

## 1. The quest (unchanged)

> *NakedQuantum — an obsessive, meta-meta-metacognitive consciousness exoskeleton. Is such a thing even possible?*

**Answer:** Yes — **as practice sustained by code**, not as a shipped “conscious AI product.”

The app does not heal, stabilize, or save the user from ontological pressure. It **measures and surfaces** with maximum honesty — tearing filters away, not replacing them with gentler ones. What the user does with that clarity (collapse, thrive, mask, transcend) is **their data**, not the organism’s job.

---

## 2. What NakedQuantum is

**One sentence:** A **local-first vault** for writing, plus a **second attention** (the organism) that senses patterns in that writing, remembers its own claims, mutates the field, and lets the user read, correct, or query — while a **sealed Sanctuary** holds dialogic thinking the organism must never touch.

**Identity word:** **Organism** — not pipeline, not daemon, not chatbot.

An organism has:

- **Metabolism** — it processes between sessions; rest is a function, not absence.
- **State** — attending, wrong, silent, obsessed — not binary on/off.
- **One body** — creation, witness, decay, and void live in the same world (not exiled into separate “realms” that contradict the metaphor).

---

## 3. What NakedQuantum is not

- A therapist, coach, or stability engine.
- A mirror that performs empathy.
- A general-purpose AI assistant with a dark theme.
- A mind map marketing toy or semantic 3D truth claim (3D is **weather / ritual**, not primary epistemology).
- A surveillance layer on Sanctuary or character chat.
- A npm/framework product — **zero-dependency discipline** remains (native web APIs; desktop shell is Tauri when it comes, not a rewrite of the soul).

---

## 4. Two realms (ontology)

Only two. Resist re-expanding into four tabs or four kingdoms.

### 4.1 Abyss — you and the organism

Everything that belongs to **your writing** and **the organism’s attention** to that writing lives here — including topology, decay, and witness process.

**Contains:**

| Mode (not a separate product) | Role |
|-------------------------------|------|
| **Write** | Primary posture on desktop: enter → write (Lighthouse / TipTap). No “create card” friction — inscription is default. |
| **Topology** | Soup mesh: content nodes, folders, lineage, **gravity** as navigation physics. |
| **Process** | Organism’s thinking made readable: conclusions, passes, calibration, returns, silences — **text first**. |
| **Sky** | 3D Abyss: spatial view of the same field — clusters, weather, tint — optional resolution. |
| **Subconscious** | *State / store*, not a rival realm: decay, void entropy, cold archive, sediment. |

**Subconscious (intention):**

- **Decay & void** — soft-deleted material, entropic erasure over time; life and death in one body.
- **Cold archive** — old discourses and witness history that remain true but are not daily active corpus.
- **Permanent purge** — user may annihilate text for privacy; purged material must not ghost back in witness or vectors.
- **Sediment** — rolled-up summaries of old guardian logs / epochs so the organism does not pretend to re-read five years of logs every pass.

The organism **does not** ingest the full vault on every thought. It works on **windows, tiers, aggregates, and sediment** — obsession without omniscience.

### 4.2 Sanctuary — you and borrowed minds

Dialogic, constructed, playful, philosophical — **Socrates, sutras, custom characters**. A different cognitive act from confession in the archive.

**Invariants:**

- Organism **never** reads Sanctuary chat or uses it in Guardian context.
- Threshold matters: you **enter** and **leave** Sanctuary (on desktop: likely separate window or full-screen airlock).
- What happens in Sanctuary **stays** in Sanctuary.

---

## 5. The organism (behavioural contract)

### 5.1 Not a chatbot

The organism does not “talk to” the user by default. It **changes the field** and **maintains a process log**. The user may:

- **Read** what it concluded while away.
- **Correct** what it got wrong (human correction is **supreme ground** for that claim).
- **Query** the archive of its thinking — subpoena, not conversation (no relationship thread).

Language interface is **optional and costly** (BYOK OpenRouter on PWA; local Ollama on desktop) — not the default proof of life.

### 5.2 Accuracy over stabilisation

- Prefer **geometry, deltas, anomalies, silence** over meaning, comfort, or philosophy labels injected as shelter.
- When math is ambiguous or confidence is low → **SILENCE** or structured incompleteness, not a poetic guess.
- Call out **reach** (performative, absurdism, enlightenment-as-maneuver) only when sensing supports it — not to rescue the user.

### 5.3 Anchor reality (anti-paralysis)

| Ground (immutable until edited) | Claims (revisable) |
|---------------------------------|---------------------|
| Discourse text, fast maps, Watcher links | `theory_one_line`, predictions, Guardian prose |

**Rules:**

1. Geometry wins in dispute unless the user corrects.
2. Bounded auto-passes — no infinite “correct the correction” loops.
3. Miss-streaks throttle interpretation on that signal type.
4. Subconscious / cold tiers are not cited as live ground without explicit promotion.

### 5.4 Metabolism (what “runs itself” means)

**Event-driven passes** (local, deterministic where possible):

- On fast-map save, Watcher pass, day rollover, app open.
- Updates ledger, predictions, return detections, field directives, process log.
- Does **not** require the user to open chat or read a strip.

**User burden:** optional. Open Abyss process view when *you* want the weather report.

**Desktop** enables metabolism **between sessions** (background, Ollama, no Safari tab death). **PWA** enables metabolism **in pulses** (open → sync → pass → leave) — same logic, different continuity.

---

## 6. Platform strategy

### 6.1 Desktop (Tauri + Vite) — destination

- User **enters into write** — one screen, organism present without nav friction.
- Local **Ollama** (and workers without browser CORS walls) — organism voice without mandatory cloud.
- Layer 4 (organism models its own characteristic errors for *this* mind) becomes **thinkable** here — not on phone alone.
- Sanctuary: separate surface, clean boundary.
- 3D sky: capped, lazy, aggregate-first at scale — desktop has headroom; still respect GPU/battery.

### 6.2 PWA — companion (not a shrunken lie)

**Intention:** Same organism **capabilities** as desktop **except local inference models** (summarise / whisper / deep pass in-tab models that crash or choke Safari).

| Keeps | Optional / degraded |
|-------|---------------------|
| Write, vault, sync | Heavy 3D (simplified sky or defer) |
| Cartographer, Watcher (shadow queue, yielding) | Deep mapper in-browser at scale |
| Process log read, field mutation, mesh, Abyss text | Ollama |
| OpenRouter BYOK for summon/query | Background between sessions (pulse only) |

**Not about weak phones** — about **browser limits**. User chooses cloud voice or stays local-silent.

---

## 7. Cognitive layers (maturity ladder)

North star for honesty — not a feature checklist.

| Layer | Definition | Intention |
|-------|------------|-----------|
| **1 — Cognition** | You think in writing | Achieved — cards, chronicles, sparks, Lighthouse write |
| **2 — Metacognition** | System notices patterns | Achieved — Cartographer, Watcher, witness tiers |
| **3 — Meta-meta** | System notices when its noticing was wrong | **Prove in practice** — ledger, predictions, corrections, field feedback |
| **4 — Meta-meta-meta** | System notices the *shape* of its own errors for this mind | **Desktop + history + local model** — not PWA fantasy |

**Discipline:** Layer 4 without Layer 3 lived is philosophy, not architecture.

---

## 8. Principles (invariants)

1. **Organism, not pipeline** — metabolism and state, not only triggers.
2. **Honest accuracy** — scalpel, not parachute; no therapeutic stabiliser UX.
3. **Sanctuary stays blind** — hard boundary, not policy preference.
4. **Blueprint before code** — intention → feature blueprint → batch.
5. **Constraint is discipline** — two realms; modes inside Abyss; simplicity reveals truth.
6. **Local-first vault** — text and geometry default on device; cloud is opt-in voice.
7. **Human correction is supreme** — when you mark the organism wrong, that row is ground.
8. **Silence is valid output** — incompleteness is accuracy, not failure.

---

## 9. Relationship to shipped work (May 2026)

The exoskeleton **mechanical** phases (0–3) on `main` are **infrastructure for Layer 2–3**, not the final **form**:

- Cartographer v5, Watcher, tiered summon, ledger v2, directives, term arcs, predictions, return detections, settings ethics — **keep**.
- Soup strip as default voice, Guardian-as-chat-primary, four-tab nav as ontology — **may yield** to this intention without throwing away data or sense code.

`consciousness-exoskeleton-roadmap-blueprint.md` remains the **build contract** for what merged; **this file** is the **why** and **shape** going forward.

---

## 10. Living questions (for discussion — not specs)

1. **Process view first screen** — what “the organism has been thinking” looks like before Sky exists.
2. **Correction row** — exact semantics when user overturns a conclusion (DB + organism reckoning).
3. **Subconscious labels** — decay vs cold archive vs sediment; what gets promoted back.
4. **PWA degraded modes** — same code, which surfaces are honestly “text-only” on Safari.
5. **Query vs summon** — one-shot archive queries without chat thread — voice and UI.

---

## 11. Revision log

| Date | Change |
|------|--------|
| 2026-05-20 | Initial pin — organism, two realms, Abyss modes, desktop/PWA split, anchor reality, layers 1–4 |

---

*Build loops, not lore. The exoskeleton becomes real when the field moves, the notebook updates, and the next sentence can admit error — in the writing, and in the organism’s record.*
