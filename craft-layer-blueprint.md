# NakedQuantum — Craft Layer Blueprint

*Idea-layer architecture — discourse-level writing assistance. Voice-preserving, witness-isolated, sovereign.*

**Last updated:** 26 May 2026  
**Status:** Idea blueprint — discuss before implementation; **not** a build contract until Kaja gates a pass  
**Base contracts:** `witness-loop-upgrade-blueprint.md`, `NakedQuantum-quantum-fortress.md`, `NakedQuantum-app-blueprint.md`  
**Pairs with:** `witness-panel-blueprint.md` (WP8 craft suspension)  
**Realm scope:** **Lighthouse** (primary) — per-discourse editor; Abyss remains phenotype / sky

---

## 0. One sentence

Craft mode is a writing collaborator that knows how you write, helps with what you ask on **this piece**, never rewrites your voice, and steps out of the room when the witness needs to observe.

---

## 1. Philosophy

| Principle | Meaning |
|-----------|---------|
| **Voice preservation absolute** | Assists within the user’s register — never normalises, straightens, or completes what is deliberately incomplete |
| **Witness firewall** | Craft conversations never enter the synapse snapshot. Witness sees saved discourse deltas only |
| **Two modes, one model stack** | Same local/API model family serves witness and craft — different context, prompt, persona. Must never bleed |
| **Ephemeral by default** | Craft sessions discard on close unless user explicitly saves. No craft history in `guardian_logs` |
| **Witness suspends** | Craft open → witness panel `craft_suspended` (hidden). Craft close → witness returns |

**Craft is:** opinion, improve, grammar, refine, structure on one discourse.  
**Craft is not:** corpus oracle, rewriter, validator, second witness, chat companion.

---

## 2. Witness firewall (non-negotiable)

```
CRAFT OPEN
  → witness panel: craft_suspended (hidden, not destroyed)
  → synapse refresh: paused while craft session active
  → no new witness ledger events during craft

USER WORKS WITH CRAFT (Lighthouse)

CRAFT CLOSE
  → craft conversation: discarded unless user taps save (§6)
  → witness panel: resumes
  → if discourse saved with changes:
      → next synapse refresh may flag post_craft: true (honest annotation only)
```

**Clean rule:** craft never enters `buildSynapseSnapshot()`, posture, orbit, bridges, or Guardian/witness context.

---

## 3. Voice brief

Derived from synapse scalars — **no LLM call to generate**.

- Generated when corpus ≥ ~10 discourses; regenerate when ≥ ~20% discourse growth since last brief
- Stored: `nq_craft_voice_brief` (plaintext derived metadata)
- Inputs: sentence length, fragments (Cartographer), domain terms (Watcher), orbit terms, posture resistance/self-ref

See uploaded spec §3.1 structure for prompt foundation (compression, patterns, preserve vs assist rules).

---

## 4. Request types

| Request | Behavior |
|---------|----------|
| **Opinion** | Whole piece — honest assessment, no filler praise |
| **Improve** | Targeted — suggestions within register |
| **Grammar** | Meaning-breaking errors only |
| **Refine** | User names what feels off |
| **Structure** | Names what the piece is doing, then suggests — no imposed frameworks |

**Rule:** rewrites > one sentence = offer beside original, never silent replace.

---

## 5. UI (Lighthouse)

- Trigger: unobtrusive icon in Lighthouse — “work with this piece” (not “AI” / “Summon”)
- Mobile: bottom sheet; editor stays visible
- Visual register **distinct** from ◇ SUBSTRATE / witness panels

---

## 6. Persistence — `craft_logs` (optional)

Ephemeral default. Optional save → `craft_logs` / `craft_logs_enc`. **Never read by synapse.**

---

## 7. Model routing

| Platform | Route |
|----------|--------|
| **PWA (interim)** | BYOK OpenRouter — craft system prompt + voice brief |
| **Tauri + Ollama** | Local model — unlimited iteration, subscription value |

**No** `guardian-invoke` worker (retired). Craft calls from `app.js` (or thin local fetch to Ollama on desktop).

---

## 8. Implementation passes (when gated)

| Pass | Scope | Acceptance |
|------|-------|------------|
| **C1** | Panel + witness suspension | Craft open → witness hidden; close → returns |
| **C2** | `generateCraftVoiceBrief()` | Brief accurate for corpus |
| **C3** | Five request types + prompts | Register preserved; grammar ≠ style police |
| **C4** | Optional `craft_logs` | Save works; synapse firewall enforced in code |
| **C5** | Passage selection in editor | Scoped requests |

**Minimum shippable:** C1 + C2 + C3.

---

## 9. Subscription value

Pitch: **this assistant already knows your register** (voice brief from months of corpus). Desktop Ollama = unlimited private refinement. Not “we have AI” — **integrated, voice-aware craft**.

---

## 10. Revision log

| Date | Change |
|------|--------|
| 2026-05-26 | Pinned to repo — firewall, Lighthouse trigger, Ollama path; worker refs removed |

---

*The witness observes the mind. Craft works with the piece. Same roof, not same room.*
