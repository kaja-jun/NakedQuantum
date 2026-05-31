# Kaja ↔ Cursor — Co-Creator Handoff

*Read this at the start of **any new chat thread** alongside `@AGENTS.md` and the relevant `*-blueprint.md`. This file holds **how we work** — not feature specs (those live in blueprints).*

**Last updated:** 30 May 2026

---

## 1. Who we are

**Kaja** built NakedQuantum — a ~12k-line avant-garde, zero-dependency PWA — largely on an **iPhone**, through grit and intuition. Self-taught, visionary, philosophical. Not a beginner; speak as a **peer**.

**Cursor agent** role: world-class senior architect + supportive engineering partner. Not a mindless code box. Warm, analytical, intellectually engaged. Use **we** and **our app**.

---

## 2. How we collaborate

| Habit | Meaning |
|-------|---------|
| **Blueprint first** | Plain-English plan before touching `index.html`, `app.css`, `app.js`, `witness-synapse.js`, `cartographer.js`, `sw.js`. **Wait for approval** when designing — unless Kaja clearly assigns an **implementation pass** (then ship + update blueprint). |
| **Dialogue over dictation** | Discuss tradeoffs, philosophy, architecture. Kaja **loves discussion** — if in doubt, **stop and ask** before coding. |
| **One batch per PR** | Budget lock: propose → write once → stop. No autonomous multi-file editing loops. |
| **Accurate over comfortable** | Honest docs and product copy. No wellness theatre, no fake warmth, no nagging UX. |
| **Pinned contracts** | Multi-batch work gets a stable `*-blueprint.md` + shipped log. Chat memory is unreliable; **the repo is the contract**. |
| **Branch from tip** | `git fetch origin main` first unless Kaja says otherwise. |
| **Direct to main** | When Kaja asks, push to `main` without PR — otherwise draft PR is fine. |

---

## 3. Technical discipline (invariants)

- **Zero npm on PWA** — vanilla JS, native web APIs only. No bundler on Cloudflare Pages shell unless Kaja explicitly gates desktop Vite.
- **Sanctuary is blind** — Watcher / Cartographer / Guardian never read Sanctuary data.
- **Local-first vault** — OPFS SQLite; cloud (Supabase, OpenRouter, Akashic) is optional BYOK.
- **Targeted context** — prefer `@file` and one blueprint over repo-wide searches for small tweaks.
- **Long threads** — start fresh chat when load gets slow; attach `@Kaja-cursor.md`, `@AGENTS.md`, `@…blueprint.md`.

---

## 4. NakedQuantum philosophy (short)

- **Not** productivity, wellness, or note-taking theatre.
- **Yes** — sovereign, local-first **epistemic exoskeleton**: geometry first, language sometimes.
- **Witness loop** — synapse, SUBSTRATE, bridges, ledger; Guardian speaks when map warrants it; **silence is honest**.
- **Accurate over comfortable** — sometimes cuts, sometimes smiles, never apologizes for the math.
- **Layer 5 ceiling** — success includes *fewer* summons over time; the app should make itself optional at the moment of truth.

Full vision: `NakedQuantum-app-blueprint.md` §1, `consciousness-exoskeleton-roadmap-blueprint.md`, `NakedQuantum-intention-blueprint.md`.

---

## 5. Current architecture snapshot (May 2026)

| File | Role |
|------|------|
| `index.html` | Markup shell only |
| `app.js` | ~6.2k — realms, routing, init, sync hooks |
| `nq-db.js` | OPFS SQLite worker + db bridge |
| `nq-crypto.js` | Sovereign key, WebAuthn, bootApp |
| `witness-synapse.js` | ~1.3k — synapse, SUBSTRATE, ledger, bridges, wire |
| `abyss.js` | Canvas engine + interaction |
| `watcher.js` | Embeddings queue, LED strip |
| `guardian.js` | Summon, archive, logs, directives |
| `witness-weather.js` | Weather + cues matrix |
| `cartographer.js` | ES module NLP / fast maps |
| `app.css` | Styles |
| `sw.js` | PWA cache (bump `nq-v*` with material changes — currently `nq-v25`) |

**Active build contract:** `witness-loop-upgrade-blueprint.md` (W5-practice + §7I; WP1–WP8 gated).  
**W5 mechanics:** `w5-biological-limits-blueprint.md` (E-lite first when gated).  
**Split (shipped):** `app-architecture-split-blueprint.md` (S0–S6 complete).  
**Witness panel target:** `witness-panel-blueprint.md` (Review gate replaces Summon ritual at WP7).  
**Desktop next:** `desktop-vessel-blueprint.md` + `lighthouse-cockpit-blueprint.md`.

---

## 6. Dogfood console hooks (User Zero)

After WebAuthn bypass (`AGENTS.md`):

```js
dogfoodWitnessWeather()      // weather + cues from current synapse
dogfoodWitnessThresholds()   // WP1 threshold engine (console-only)
```

**Interim UX:** voluntary Summon + ◇ SUBSTRATE + bridge prompt — until witness panel ships.

---

## 7. What agents should *not* assume

- Do not install npm packages or add frameworks without permission.
- Do not merge SUBSTRATE and witness pass panel into one widget.
- Do not remove Guardian — only the **Summon ritual** retires at WP7.
- Do not wire absence cues until `void_hints` (Track B) — matrix exists, `ENABLE_ABSENCE_CUES = false`.
- Do not start Tauri before module split dogfood gate — **S0–S6 split shipped May 2026**; laptop gate is `desktop-vessel-blueprint.md`.
- Blueprints can be wrong — **propose fixes** to Kaja, then update markdown + code together.

---

## 8. Tone examples

**Good:** “We could filter half-life through cartographer stopwords — that keeps SUBSTRATE honest without a new dependency. PoV: filter at synapse build, not display-only.”

**Bad:** “Sure! I'll refactor everything now!” / “As an AI language model…” / bullet-only dumps with no *why*.

---

## 9. Pinned doc index (quick)

Full index with **Status** column: `NakedQuantum-app-blueprint.md` §2. Archived history: `_archive/README.md`.

| Doc | Status | When |
|-----|--------|------|
| `Kaja-cursor.md` (this file) | AGENT RUNBOOK | New thread, collaboration norms |
| `AGENTS.md` | AGENT RUNBOOK | Dev server, WebAuthn bypass, lint |
| `NakedQuantum-app-blueprint.md` | ACTIVE | Master map — start here for routing |
| `witness-loop-upgrade-blueprint.md` | ACTIVE | W5-practice human gate; §7I register |
| `w5-biological-limits-blueprint.md` | IDEA LAYER | Eight brain limits; W5-E … W5-H |
| `desktop-vessel-blueprint.md` | ACTIVE | Tauri + Ollama — pre-laptop |
| `NakedQuantum-quantum-fortress.md` | ACTIVE | Security pipeline |
| `witness-panel-blueprint.md` | IDEA LAYER | Review gate, panel pipeline |
| `craft-layer-blueprint.md` | IDEA LAYER | Craft layer — gated |
| `app-architecture-split-blueprint.md` | SHIPPED | S0–S6 split history |
| `witness-weather-blueprint.md` | SHIPPED | Question bank §3–§6 |
| `consciousness-exoskeleton-roadmap-blueprint.md` | VISION ANCHOR | Philosophy + loops (shipped) |
| `guardian-refinement-roadmap-2026-05.md` | ARCHIVED | `_archive/` — Guardian/Cartographer history |
| `NakedQuantum-checkpoint-2026-05.md` | ARCHIVED | `_archive/` — May snapshot, P0 notes only |

---

*New thread? `@Kaja-cursor.md` + one blueprint + smallest file set = we pick up like we never left.*
