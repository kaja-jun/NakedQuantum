# NakedQuantum — Witness Panel Blueprint

*Idea-layer architecture — transparent witness thinking surface + Review gate. Replaces Summon **ritual**, not the loop.*

**Last updated:** 18 May 2026  
**Status:** Idea blueprint — north star for recursive loop **as experience**  
**Base (shipped):** W1–W4 in `witness-loop-upgrade-blueprint.md`, `NakedQuantum-quantum-fortress.md`  
**Pairs with:** `craft-layer-blueprint.md` (WP8 suspension), `witness-weather-blueprint.md` (weather line + post-pass cues)

---

## 0. One sentence

The witness loop runs visibly — corpus read, geometry, reasoning, observation — and when the pass is complete, the user may press **Review** to extend the exchange only while Guardian still has something worth saying; otherwise the pass ends in silence and the gate rests closed.

---

## 1. Philosophy

| Principle | Meaning |
|-----------|---------|
| **Process is the product** | Geometry and reasoning arrive visibly — verdict without trial is over |
| **Loop first, voice second** | Synapse + thresholds do the work; Guardian speaks when the map warrants it |
| **Review, not Summon** | No “tap to invoke oracle.” User engages **after** the loop has shown its work |
| **Graceful exhaustion** | When nothing remains to say — or the user circles — **silence + disabled Review**; no robotic scolding |
| **Linear pass** | Mind is chaos; the app navigates it **one sequence at a time**. No mid-pass redirect, pause, or branch — that adds confusion, not sovereignty |
| **Opacity is not honesty** | Silence shows **why** (gate reason, thin map, threshold fired) — never performative apology |
| **Minimal motion** | Sparingly, consciously — section reveal, active-step cue, continuity while a pass runs. Continuity, not gimmick; not fake token streaming |
| **Craft suspends witness** | Craft open → panel hidden (`craft_suspended`) |

**Not:** dashboard, chatbot, token dump, therapy bot, pre-flight “summon preview,” mid-pass interrupt UI.

---

## 2. Summon → Review (product decision)

**Current on `main` (interim):** voluntary Summon + ◇ SUBSTRATE + bridge prompt.  
**Target:** remove Summon **button and ritual** when witness panel ships — **not** because Guardian is gone, but because the loop **already ran**.

| Old | New |
|-----|-----|
| User taps Summon | Loop completes (threshold or scheduled refresh) → thinking surface renders |
| Immediate API call | Local sections first; Guardian prose only when pass qualifies |
| Open-ended chat | **Review** opens extension; Guardian decides length; ends in silence |

**Historical logs:** `log_type: summon` rows stay in vault. New passes: `witness_pass` (same table).

**Auto-invoke strip:** already retired — unrelated to this design.

**No summon preview:** There is nothing to pre-show before an API call that the pass itself will not already show. Tier order, saccade, posture route, gate state, and local GUARDIAN THINKING all render **in the sequential pass**. Review is the only post-pass extension — not a second confirmation layer.

---

## 2.1 Two surfaces — SUBSTRATE vs witness pass

Same synapse; different resolution. Do not merge into one widget.

| Surface | When | What |
|---------|------|------|
| **◇ SUBSTRATE** (shipped W1–W4) | Always available between passes | Steady scalars: posture, gate, wire profile, bridges, half-life, baseline, ledger. Refreshes on save |
| **Witness pass panel** (WP1–WP7) | Threshold fires | Episodic sequence: READING → … → GUARDIAN THINKING → prose/SILENCE → optional Review |

**SUBSTRATE gaps to close (same PR family as WP2 / substrate honesty):**

- **Saccade log** — fixation ids, blind tier, reason (already in blob; **SUBSTRATE render shipped** pre-laptop — `[why?]` expandables remain WP2)
- **`[why?]` expandables** — per scalar, show exact computation (e.g. resistance normalize inputs). Math, not diagnosis copy

Abyss stays phenomenological sky; SUBSTRATE stays instrumental readout. Witness pass may overlay either realm — placement TBD at WP2 — but **does not replace** SUBSTRATE.

---

## 3. When the loop runs (triggers)

Guardian prose does **not** fire on every save. Threshold engine (extends `runLocalPass`):

| Condition | Example threshold |
|-----------|-------------------|
| Orbit deepened | Term ≥ 5 cross-discourse appearances |
| Bridge relapsed | `bridge_rows` → `relapsed` |
| Resistance shift | Δ resistance ≥ 0.3 in session |
| Half-life resurgence | Dormant ≥ 14d, reappeared |
| Denial sediment | 3+ rejects same signal keys |
| Graduation quiet | coherence ≥ 0.85, resistance < 0.25, 0 bridges, sustained |
| Thin map | `invoke_denied` — partial panel, honest reason |

**One fire per qualifying event max.** Multiple thresholds → posture router picks priority; others queue.

**Future (thinking):** user selects specific discourses (subset of corpus) and asks witness to **process that scope** — pin below §9; not v1.

---

## 4. Panel pipeline (thinking surface)

Sequential sections with deliberate pacing. **Not** streamed LLM tokens — local sections first; Guardian prose last when qualified.

```
READING CORPUS → CARTOGRAPHER → WATCHER → HALF-LIFE → POSTURE →
BRIDGES → SACCADE LOG → GUARDIAN THINKING (local, deterministic) →
GUARDIAN (prose or SILENCE)
```

### 4.1 Motion (minimal, conscious)

Purpose: **continuity** — user knows a pass is alive and which step is active. Same family as coding-agent process indicators (Cursor, Replit, Claude process): something is going on, without pretending the machine is “typing thought.”

| Allow | Avoid |
|-------|-------|
| Section fade/slide-in as each step completes | Character-by-character prose reveal |
| Subtle active-step indicator (glyph pulse, gold thread, step N/M) | Infinite spinner with no step context |
| Brief hold between sections (200–600ms tunable) | Looping “thinking…” dots with no structure |
| Dim completed sections; highlight current | Sound, haptics, or dopamine confetti |

**Rule:** motion serves **sequence legibility**, not performance. When pass ends (prose, SILENCE, or `invoke_denied` partial), motion stops — SUBSTRATE or idle.

**GUARDIAN THINKING:** built locally — trigger condition, relevant terms/arcs, prior observation on same keys, posture route. No API.

**GUARDIAN prose:** BYOK (PWA) or Ollama (desktop). Prompt includes THINKING context — **do not repeat** what the panel already showed.

**invoke_denied:** partial render — “map too thin… need N more discourses” — waiting, not broken.

---

## 5. Review gate (replaces continue? / Summon)

After the pass completes (prose or SILENCE rendered):

```
[ Review ]   ← enabled only when extension is warranted
```

**On Review:**

- Opens minimal reply input (one exchange at a time, not a chat thread)
- User text treated as **new writing** — joins map on **next** synapse refresh, not mid-session
- Guardian may respond with further observation or **SILENCE** (with optional parenthetical — reference case 26/5)

**When Review disables (graceful, not nagging):**

| Signal | UI |
|--------|-----|
| Guardian returned SILENCE twice on same pass thread | Review disabled |
| User reply duplicates prior theme (local similarity / orbit repeat) | Review disabled after one more SILENCE |
| Guardian internal “nothing to add” (token budget / explicit SILENCE contract) | Review disabled |
| Pass logged and closed | Review hidden until next threshold pass |

**No copy like:** “You are circling the same theme.” **Do:** witness rests — button grey, glyph dim, SUBSTRATE returns. The architecture enforces the limit; prose doesn’t lecture.

**Bridge prompt:** unchanged in spirit — after substantive `theory_one_line`, Correct/Reject still available (W3-5).

---

## 6. Panel states

| State | Display |
|-------|---------|
| `idle` | SUBSTRATE visible; no active pass |
| `reading` | Sections rendering sequentially |
| `thinking` | GUARDIAN THINKING active |
| `speaking` | Prose or SILENCE |
| `review_open` | Review enabled; reply input visible |
| `review_exhausted` | Review disabled — pass complete |
| `closed` | Logged; ledger appended |
| `craft_suspended` | Hidden — craft mode open |

---

## 7. Logging & ledger

```javascript
{
  log_type: 'witness_pass',
  trigger_condition: 'orbit_deepened' | ...,
  thinking_context: { ... },
  theory_one_line: '...',
  review_extensions: [{ user_reply, response, was_silent }],
  review_exhausted: true | false
}
```

Append `witness_pass` to ledger chain (existing W4 hooks).

---

## 8. Implementation passes (when gated)

| Pass | Scope |
|------|-------|
| **WP1** | Threshold engine + priority queue |
| **WP2** | Sequential panel render + pacing + **minimal step motion**; SUBSTRATE saccade + `[why?]` expandables |
| **WP3** | Local GUARDIAN THINKING builder |
| **WP4** | Guardian prompt — observation only |
| **WP5** | **Review gate** + extension + exhaustion disable |
| **WP6** | `invoke_denied` partial panel |
| **WP7** | Remove Summon UI; migrate to Review model |
| **WP8** | `craft_suspended` (with Craft C1) |

**Minimum shippable:** WP1–WP5 + WP6.

---

## 9. Future — corpus scope selection (pin, not v1)

Kaja direction (under consideration):

- User selects one or more discourses (including older / off-mesh items)
- Witness runs synapse + panel pass on **that subset** only
- Use cases: “process Elara arc only,” “re-read these five before Guardian speaks”

**Open design questions:**

- Subset synapse: temporary snapshot vs tagged `scope_ids` on pass log
- Whether Review works differently on scoped passes
- Sync implications if subset spans devices

**Do not implement until loop + Review dogfood on full corpus.**

---

## 10. Explicitly out of scope

| Idea | Verdict |
|------|---------|
| **Summon / invoke preview** | Pass *is* the preview. No Proceed/Cancel before API |
| **Mid-pass redirect / pause / branch** | Linear pass only. Chaos navigated in order, not interrupted |
| **User overrides on geometry** (exclude term, lower gate threshold) | Not v1. Scoped corpus (§9) is the honest pre-pass control |
| **Single headline “confidence %” for invoke** | Prefer reason codes + which threshold fired; avoid certainty theater |
| **Replace SUBSTRATE with pass panel** | Coexist — steady vs episodic |

---

## 11. Desktop / Ollama

- THINKING: unchanged (local)
- Prose + Review extensions: Ollama swap — same prompt contract
- Background passes while away: observation ready when user returns; **keep panel pacing + minimal motion** when user opens the completed pass (or replay last pass — TBD)

**No** `guardian-invoke` worker — direct Ollama or OpenRouter from app.

---

## 12. Files (expected, when building)

| File | Passes |
|------|--------|
| `app.js` | WP1–WP8 |
| `index.html` / `app.css` | Panel sections, Review control, pacing, step motion |
| `craft-layer-blueprint.md` | WP8 + Craft C1 |

---

## 13. Revision log

| Date | Change |
|------|--------|
| 2026-05-18 | SUBSTRATE saccade line shipped (`formatSubstrateSaccadeLine`); WP1 threshold engine console-only |
| 2026-05-26 | Pinned — Review gate replaces Summon; graceful exhaustion; scoped corpus deferred; strip/worker refs removed |
| 2026-05-18 | §2.1 SUBSTRATE vs pass; saccade + `[why?]` on SUBSTRATE; §4.1 minimal motion; §10 out of scope (no preview, no mid-pass redirect) |
| 2026-05-18 | Cross-link `witness-weather-blueprint.md` — weather + cues after Guardian |

---

*The loop shows its work. Review opens the door. Silence closes it without a sermon.*
