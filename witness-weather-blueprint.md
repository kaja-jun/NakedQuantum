# NakedQuantum — Witness Weather & Cues Blueprint

*Architecture and content for `witness-weather.js` — atmospheric state + witness cue matrix.*

**Last updated:** 18 May 2026  
**Status:** **SHIPPED** — `witness-weather.js` live as of May 2026.  
**Creative content (§3–§6):** authoritative question bank (weather states, voice buckets, cues matrix).  
**Implementation detail (§7–§9):** historical reference only.  
**File:** `witness-weather.js` (standalone, pure utility)  
**Depends on:** `buildSynapseSnapshot()` output from `app.js`  
**Pairs with:** `witness-panel-blueprint.md` (weather = first line; cues = after Guardian)  
**Detachable:** yes — delete file + remove two function calls = clean removal

---

## 0. One sentence

The weather reads atmospheric conditions before the pass; the cues leave one to three quiet questions on the desk — from the witness, not a philosophy panel. Dismiss releases the question; we do not hold you to it again.

---

## 1. Philosophy

| Principle | Meaning |
|-----------|---------|
| **Weather senses** | Conditions before the user arrives — not a feature flag |
| **Cues invite** | Questions about *this* unresolved signal — not prompts, not homework |
| **Witness voice** | Questions feel like they came from the loop — **no labels, no names, no tap-for-attribution** |
| **Silence valid** | User ignores cue — fine. No nag copy |
| **Dismiss = release** | One gesture → retire `(signal_type, term)` permanently. **No hold.** Geometry may still read the term; we stop asking |
| **Reach not aggression** | High-intensity voice bucket = ceiling-stare reach — not confrontational trope |
| **Detachable** | Dogfood wrong → delete file. Nothing else changes |

NQ may make you uncomfortable. It is not here to cling to grief, trauma, or identity shed.

**Not:** philosophy seminar, wellness prompts, chat thread, appearance ledger stalking `{term}`.

---

## 2. File structure

```javascript
// witness-weather.js
// Pure utility — no DOM access, no DB calls, no imports from app.js
// Receives synapseSnapshot object, returns data only

const WEATHER_STATES = { ... }        // §3
const VOICE_BUCKETS = { ... }         // §5.2 — internal keys only, never UI
const CUES_MATRIX = { ... }           // §6
const MAX_CUES = 3

function computeWeatherState(snap) { ... }     // §4
function selectVoice(intensity, opts) { ... }  // §5
function generateWitnessCues(snap, opts) { ... } // §7
function cueRetireKey(type, term) { ... }      // §8.1
```

No other exports. Two entry points for the panel: `computeWeatherState`, `generateWitnessCues`.

---

## 3. Weather states

| State | Label | Condition |
|-------|-------|-----------|
| `calm` | *(nothing renders)* | coherence ≥ 0.85, resistance < 0.3, 0 open bridges, no resurgence |
| `front` | `front moving in` | resistance shifted ≥ 0.3 since last session |
| `pressure` | `pressure building` | open bridges ≥ 2 OR orbit terms ≥ 3 deepening |
| `electrical` | `electrical` | half-life resurgence — dormant term returned |
| `after_storm` | `after the storm` | previous session high turbulence, posture recalibrating |
| `drought` | `long silence` | gap since last write ≥ 14 days |

**Priority when multiple qualify:**  
`electrical` → `pressure` → `front` → `after_storm` → `drought` → `calm`

**Intensity scalar (0–1):** strength of the qualifying condition — not a separate computation.

**Rendering:**

- `calm` → nothing. Panel opens into silence.
- All others → one atmospheric label. Bold serif. Realm accent. First line before READING CORPUS.
- `post_craft: true` → skip weather entirely.

---

## 4. `computeWeatherState(snap)` — return shape

```javascript
{
  state: 'calm' | 'front' | 'pressure' | 'electrical' | 'after_storm' | 'drought',
  label: string | null,
  intensity: 0–1
}
```

---

## 5. Voice selection (internal keys — never shown)

Matrix uses **voice keys** for authoring and bucket routing only. The UI renders **`question_text` alone**.

### 5.1 Registers (implementation reference)

| Key | Register |
|-----|----------|
| `weil` | Attention, weight, what costs — full hold without flinching |
| `rilke` | Unlived, not-yet-speakable, readiness without forcing resolution |
| `rovelli` | Stable → process; thing vs event; time, scale, observer |
| `socrates` | Assumption underneath the claim |
| `descartes` | Foundation, doubt, what remains |
| `camus` | Absurdity, revolt, tension without resolution |
| `einstein` | Coordinate reframe, observer position |
| `spinoza` | Deeper necessity, what could not be otherwise |
| `laotzu` | Yielding, effortless, natural movement |
| `wittgenstein` | Language limits, what the word hides |

**Retired keys:** `nietzsche`, `kierkegaard` — too easily read as confrontational in ambient cues.

### 5.2 Intensity buckets

**High = reach** (ceiling stare), not volume:

```javascript
const VOICE_BUCKETS = {
  high: ['weil', 'rilke', 'rovelli'],
  mid:  ['socrates', 'descartes', 'camus'],
  low:  ['einstein', 'spinoza', 'laotzu', 'wittgenstein']
}
```

**Selection:** `intensity > 0.66` → high · `0.33–0.66` → mid · `< 0.33` → low. Random within bucket.

**Optional gate (dogfood):** first cue ever on a `(type, term)` → **mid or low only** until user has engaged once. High reach is earned, not ambush.

**Cue weather gate (recommended v1):** no cues when weather is `calm` or `drought` — atmospheric read only.

---

## 6. The matrix — CUES_MATRIX

**Structure:** `CUES_MATRIX[signal_type][voice_key]` → array of 4–6 strings with `{term}` slot.

**5 signal types:** `orbit` · `bridge` · `resurgence` · `denial` · `absence`  
**10 voice keys:** as §5.1  
**50 intersections** · ~250 questions total · **hardcoded only** — no LLM generation

---

### ORBIT (perpetual orbit — term circled repeatedly, no register shift)

**orbit × rilke**

```
"What is {term} waiting for you to become before it will open?"
"What would it mean to live {term} as a question rather than solve it as a problem?"
"What in {term} is trying to become possible that is not yet possible?"
"How long have you been standing outside {term} — and what would it mean to go in?"
"What is {term} protecting that is still too young to be exposed?"
"What would change if you stopped trying to understand {term} and simply stayed near it?"
```

**orbit × rovelli**

```
"Is your relationship with {term} a thing or an event — and which answer changes more?"
"What is {term} made of when you get close enough to look?"
"What does {term} look like from the future looking back at this moment?"
"What would {term} look like if time moved differently around it?"
"Is {term} something you have or something that is happening to you?"
"What is {term} doing when you are not writing about it?"
```

**orbit × weil**

```
"What in {term} are you refusing to look at without flinching?"
"What would full attention to {term} require you to give up?"
"Is your circling of {term} attention or avoidance wearing attention's shape?"
"What is the weight of {term} that you keep setting down before it is fully held?"
"What would it mean to give {term} your complete attention — not understanding, just attention?"
"What does {term} look like when you stop trying to do something with it and simply look?"
```

**orbit × socrates**

```
"What are you assuming about {term} that you have never examined?"
"What would have to be true for {term} to finally hold still?"
"If {term} is the answer — what was the question you are avoiding?"
"What does {term} cost you to believe?"
"Who taught you that {term} means what you think it means?"
"What changes if {term} turns out to be something simpler than you made it?"
```

**orbit × descartes**

```
"What is the one thing about {term} you are completely certain of?"
"If you doubted {term} entirely — what in you remains?"
"What are you taking on faith about {term} that you have never tested?"
"Strip {term} back to what cannot be questioned — what is left?"
"What would {term} look like rebuilt from nothing?"
```

**orbit × camus**

```
"If {term} has no resolution — what would it mean to keep circling anyway?"
"What absurdity are you protecting yourself from by never landing on {term}?"
"What would revolt against {term}'s unresolvability look like?"
"Is the circling of {term} itself the answer you have been looking for?"
"What if {term} is not a problem to solve but a tension to inhabit?"
```

**orbit × einstein**

```
"What does {term} look like from the position you keep forgetting to write from?"
"If {term} is relative — relative to what exactly?"
"What frame of reference are you using for {term} that you have never named?"
"What would {term} look like if you changed the observer?"
"What is the simplest version of {term} that still preserves what matters?"
```

**orbit × spinoza**

```
"What necessary function does your circling of {term} serve?"
"What deeper order is {term}'s unresolvability part of?"
"What would it mean if your return to {term} could not have been otherwise?"
"What is {term} expressing that could not be expressed another way?"
"Where does {term} fit in the larger necessity you have not yet named?"
```

**orbit × laotzu**

```
"What would {term} become if you stopped trying to resolve it?"
"Where does your effort around {term} create the very resistance you are fighting?"
"What is the natural movement of {term} that your thinking keeps interrupting?"
"What would happen to {term} if you simply left it alone for a while?"
"What does {term} want to do that you keep preventing?"
```

**orbit × wittgenstein**

```
"What are you using the word {term} to avoid saying more precisely?"
"Where does your language about {term} end and the thing itself begin?"
"What would it look like if {term} meant the opposite of what you intend?"
"Is {term} a description of something or a decision you keep remaking?"
"What cannot be said about {term} — and is that the thing worth saying?"
```

---

### BRIDGE (open bridge — user challenged prior witness theory)

**bridge × rilke**

```
"What is the disagreement about {term} asking you to grow into?"
"What would it mean to hold both sides of {term} without needing one to win?"
"What is unresolved in {term} that is not yet ready to be resolved?"
"What would you need to have lived to close the gap in {term}?"
"What is the open space of {term} protecting that a closed answer would end?"
"What is {term} becoming in the tension between what was said and what you believe?"
```

**bridge × rovelli**

```
"What would {term} look like measured from the other side of the disagreement?"
"What is changing in {term} that your position requires to stay still?"
"If {term} is a process and not a thing — what process is it exactly?"
"What does the gap in {term} look like at a different scale — closer, further, longer?"
"What is {term} doing that neither position in the disagreement can account for?"
"What would {term} look like to an observer who existed outside the disagreement entirely?"
```

**bridge × weil**

```
"What would full attention to the position you rejected actually feel like?"
"What is the weight of being wrong about {term} that you are not yet carrying?"
"Where does your rejection of {term} come from attention and where from self-protection?"
"What would it cost you to look at the other side of {term} without immediately defending?"
"What is {term} asking of you that genuine attention — not argument — would reveal?"
"What would you see in {term} if you looked at it the way you look at something you love?"
```

**bridge × socrates**

```
"What are you assuming in your disagreement with {term} that you have not examined?"
"What would have to be true for the original claim about {term} to be right?"
"What is the belief underneath your rejection of {term}?"
"If you are wrong about {term} — what does that change?"
"What does your disagreement about {term} reveal about what you value?"
```

**bridge × descartes**

```
"What is the one thing about {term} you are certain of in this disagreement?"
"If you stripped {term} back to what cannot be doubted — do you still disagree?"
"What are you taking on faith in your rejection of {term}?"
"What would your position on {term} look like rebuilt from first principles?"
"What cannot be questioned in your stance on {term}?"
```

**bridge × camus**

```
"If neither position on {term} can be proven — what would it mean to choose one anyway?"
"What absurdity are you protecting yourself from by keeping this bridge open?"
"What would revolt against the irresolvability of {term} look like?"
"Is keeping {term} unresolved a form of honesty or a form of avoidance?"
"What if the disagreement about {term} is not the problem but the most honest thing in the map?"
```

**bridge × einstein**

```
"What does the disagreement about {term} look like from the position you are not occupying?"
"What changes about {term} if you shift the frame of reference entirely?"
"What is the coordinate system you are using to judge {term} — and is it the only one?"
"What would {term} look like to an observer who held neither position?"
"What is the simplest version of the disagreement about {term}?"
```

**bridge × spinoza**

```
"What necessary tension does the open bridge on {term} serve?"
"What would it mean if your disagreement about {term} could not have been otherwise?"
"What deeper pattern is the gap in {term} expressing?"
"Where does the unresolved bridge on {term} fit in the larger necessity of your map?"
"What is the open bridge on {term} protecting that a closed one would destroy?"
```

**bridge × laotzu**

```
"What would resolve itself in {term} if you stopped pushing against it?"
"Where does your disagreement about {term} come from holding what cannot be held?"
"What is the natural resolution of {term} that your resistance is preventing?"
"What would happen to the bridge on {term} if you simply stopped defending your position?"
"What does {term} want to become that neither position is allowing?"
```

**bridge × wittgenstein**

```
"What are you using the word {term} to mean that differs from what was meant?"
"Where does the disagreement about {term} come from language rather than the thing itself?"
"What would the disagreement about {term} look like without any of the words you are using?"
"Is the gap in {term} a difference of fact or a difference of definition?"
"What cannot be said in this disagreement about {term} — and is that what the disagreement is really about?"
```

---

### RESURGENCE (half-life — dormant ≥ 14d, returned this session)

**resurgence × rilke**

```
"What have you become that {term} can now return to?"
"What is {term} bringing back with it that it did not carry when it left?"
"What does the return of {term} know about you that you have not yet told yourself?"
"What is {term} asking you to be ready for this time?"
"What changed in the room while {term} was gone?"
"What would it mean to welcome {term} back without asking it to explain itself?"
```

**resurgence × rovelli**

```
"What does the return of {term} tell you about the direction time is moving in you?"
"What was {term} doing during the silence — and does that change what it is?"
"Is the {term} that returned the same {term} that left — or is that the wrong question?"
"What does the gap in {term}'s presence reveal about how you measure change?"
"What would {term} look like if you mapped it across the whole arc rather than this moment?"
"What is the simplest honest description of what {term} actually does when it is present?"
```

**resurgence × weil**

```
"What does the return of {term} ask of you that you were not ready for before?"
"What weight does {term} carry now that it did not carry when it went quiet?"
"What in {term} have you been avoiding that its return makes unavoidable?"
"What would full attention to {term} now require that it would not have required before?"
"What is the cost of {term}'s return that you have not yet acknowledged?"
"What would it mean to receive {term}'s return without immediately trying to place it?"
```

**resurgence × socrates**

```
"What assumption about {term} did you leave unexamined when it disappeared?"
"What does the return of {term} reveal that its absence was hiding?"
"What question about {term} did you forget to ask the last time it was here?"
"What has changed in you that {term} could return now?"
"What will you do differently with {term} this time?"
```

**resurgence × descartes**

```
"What is the one thing about {term} that remained true while it was gone?"
"What doubts about {term} did the silence not resolve?"
"What is more certain about {term} now than it was before?"
"What did you build in the absence of {term} that now needs testing against it?"
"What cannot be doubted about {term}'s return?"
```

**resurgence × camus**

```
"What absurdity does the return of {term} make unavoidable?"
"If {term} keeps returning without resolution — what would it mean to welcome it?"
"What does {term}'s persistence despite the silence tell you about the nature of the question?"
"What would revolt against {term}'s unresolvability look like now?"
"Is the return of {term} a burden or proof that something in you is still alive?"
```

**resurgence × einstein**

```
"What changed in the coordinate system that allowed {term} to return?"
"What does {term} look like now that you are observing it from a different position?"
"What is the same about {term} and what is different — and which difference matters?"
"What frame of reference disappeared when {term} went quiet and has now returned?"
"What would {term} look like to the version of you who last wrote about it?"
```

**resurgence × spinoza**

```
"What necessity brought {term} back at this moment rather than another?"
"What could not have been otherwise about {term}'s return?"
"What deeper pattern does {term}'s disappearance and return express?"
"What is {term} part of that required it to return now?"
"What would it mean if {term}'s return was inevitable from the beginning?"
```

**resurgence × laotzu**

```
"What did {term} do while you were not writing about it?"
"What returned with {term} that you did not invite?"
"What is {term} teaching by leaving and coming back?"
"Where did {term} go — and what does that place tell you?"
"What would {term} do next if you simply watched without guiding it?"
```

**resurgence × wittgenstein**

```
"Does {term} mean the same thing now as it did before the silence?"
"What new language have you developed that {term} is now inhabiting?"
"What can you say about {term} now that you could not say before?"
"Is the {term} that returned the same {term} that left — or just wearing the same word?"
"What does the gap in {term}'s presence reveal about how you use the word?"
```

---

### DENIAL (denial sediment — 3+ rejections on same signal keys)

**denial × rilke**

```
"What is {term} asking of you that you are not yet willing to give?"
"What would you need to become to stop refusing {term}?"
"What is {term} patiently waiting for on the other side of your refusal?"
"What part of you already knows what {term} is — and what does that part feel?"
"What would it mean to let {term} be difficult without pushing it away?"
"What is your rejection of {term} costing the part of you that already understands it?"
```

**denial × rovelli**

```
"What is {term} doing that your rejection of it cannot stop?"
"What would {term} look like if your resistance to it were part of it rather than separate?"
"If {term} exists regardless of your position on it — what does that change?"
"What is the temperature of your relationship with {term} — and which direction is the heat flowing?"
"What does {term} look like from outside the system you are using to refuse it?"
"What would remain of {term} if you removed yourself from the equation entirely?"
```

**denial × weil**

```
"What in {term} are you protecting yourself from having to feel?"
"What would full attention to {term} — without flinching — cost you?"
"What is the weight of {term} that you keep refusing to carry?"
"What would it mean to look at {term} directly, just once, without defending against it?"
"Where does your refusal of {term} come from genuine disagreement and where from self-protection?"
"What would {term} ask of you if you gave it your complete attention rather than your rejection?"
```

**denial × socrates**

```
"What belief are you protecting by repeatedly refusing {term}?"
"What would have to be true for {term} to be worth examining?"
"What does your consistent rejection of {term} reveal about what you value most?"
"What are you certain of that makes {term} impossible to accept?"
"What question about {term} have you refused to ask?"
```

**denial × descartes**

```
"What are you more certain of than {term} — and have you tested that certainty?"
"What foundation does your rejection of {term} rest on?"
"If you doubted your rejection of {term} — what remains?"
"What would {term} look like if you rebuilt your position from nothing?"
"What cannot be doubted in your refusal of {term}?"
```

**denial × camus**

```
"What absurdity does your rejection of {term} protect you from facing?"
"If {term} cannot be definitively refused or accepted — what would revolt look like?"
"What would it mean to keep living with {term} fully present rather than repeatedly dismissed?"
"Is your refusal of {term} a form of honesty or a form of rebellion against something you cannot control?"
"What if your repeated rejection of {term} is itself the most honest thing in the map?"
```

**denial × einstein**

```
"What frame of reference makes {term} impossible — and is that frame the only one available?"
"What does your rejection of {term} look like from outside the system you are using to judge it?"
"What would {term} look like if you changed the observer?"
"What is the coordinate system your refusal of {term} depends on?"
"What would {term} become in a frame of reference you have not yet tried?"
```

**denial × spinoza**

```
"What necessary function does your refusal of {term} serve in the larger pattern?"
"What would it mean if your rejection of {term} could not have been otherwise?"
"What deeper necessity does the repeated dismissal of {term} express?"
"What is {term}'s persistent appearance — despite rejection — part of?"
"What order does your refusal of {term} belong to that you have not yet named?"
```

**denial × laotzu**

```
"What would {term} do if you stopped refusing it?"
"Where does your resistance to {term} create the very problem you are trying to avoid?"
"What is the natural movement of {term} that your refusal keeps interrupting?"
"What would happen if you simply allowed {term} to be present without judgment?"
"What does {term} want that your repeated rejection keeps preventing?"
```

**denial × wittgenstein**

```
"What are you using the word {term} to mean that makes it rejectable?"
"Where does your refusal of {term} come from the word rather than the thing?"
"What would {term} look like described in completely different language?"
"Is your rejection of {term} a logical position or a linguistic habit?"
"What cannot be said about {term} that your repeated rejection is circling?"
```

---

### ABSENCE (structural absence — implied node missing; **desktop / void_hints — defer PWA v1**)

**absence × rilke**

```
"What is {term} not yet ready to be — in you?"
"What would {term} require you to have lived before it could appear here?"
"Is {term} absent because it has not arrived yet or because you are not yet the person it arrives to?"
"What is {term} becoming in the silence before you can write it?"
"What would it mean to trust that {term} is present even in its absence?"
"What is {term} waiting for before it enters the room?"
```

**absence × rovelli**

```
"What is the shape of the space {term} would occupy if it were here?"
"What does the absence of {term} allow to exist that its presence would displace?"
"Is {term} absent or is it present in a form you do not yet have instruments to measure?"
"What would {term} look like if absence and presence were not opposites but states of the same thing?"
"What is {term} doing in the places in your map that you cannot see?"
"What would change in the whole system if {term} entered it?"
```

**absence × weil**

```
"What would full attention to {term} require you to feel that you are currently not feeling?"
"What is the cost of {term}'s absence that you have arranged not to notice?"
"What in {term} are you refusing to look at by refusing to write about it?"
"What would it mean to give {term} your attention even before you have the words for it?"
"Where does the absence of {term} come from genuine limits and where from careful avoidance?"
"What would {term} look like if you looked at it the way you look at something you are not afraid of?"
```

**absence × socrates**

```
"What assumption about yourself makes the absence of {term} feel natural?"
"What question about {term} have you never allowed yourself to ask?"
"What would examining {term} reveal that you have arranged not to examine?"
"What belief depends on {term} remaining unwritten?"
"What does the absence of {term} in your writing protect you from knowing?"
```

**absence × descartes**

```
"What would remain of your map if {term} were present in it?"
"What are you certain of that requires {term} to stay absent?"
"If you doubted the reasons {term} is not here — what would you find?"
"What foundation of your thinking depends on not writing about {term}?"
"What could not be doubted about {term} if you allowed yourself to think it?"
```

**absence × camus**

```
"What absurdity does the absence of {term} allow you to keep at a distance?"
"If {term} has no comfortable place in your map — what would it mean to include it anyway?"
"What would revolt against {term}'s absence look like?"
"Is the absence of {term} a form of honesty or a form of managed blindness?"
"What if including {term} is not about resolution but about refusing to look away?"
```

**absence × einstein**

```
"What does your map look like from the position that {term} would occupy?"
"What frame of reference makes {term} invisible — and who holds that frame?"
"What changes about the whole map if {term} enters it?"
"What is the coordinate system that excludes {term} — and did you choose it?"
"What would {term} make measurable that is currently unmeasurable in your writing?"
```

**absence × spinoza**

```
"What necessity does the absence of {term} serve in the larger pattern of your map?"
"What would it mean if {term}'s absence could not have been otherwise at this point in your writing?"
"What deeper order is {term}'s absence part of?"
"What is {term} doing by being absent that it could not do by being present?"
"What would the complete version of your map necessarily include — and what does that tell you?"
```

**absence × laotzu**

```
"What would {term} do in your map if you stopped keeping it out?"
"Where does the effort of not writing about {term} cost more than writing about it would?"
"What is the natural presence of {term} that your writing keeps interrupting?"
"What would happen to your map if {term} were simply allowed to enter?"
"What does {term} want to say that you have not yet allowed?"
```

**absence × wittgenstein**

```
"What can you not say because you have no language for {term} yet?"
"Where does the absence of {term} come from the limits of your language rather than the limits of your experience?"
"What word would you need to write about {term} that you do not yet have?"
"Is {term} absent because it is unspeakable or because you have decided not to speak it?"
"What would {term} sound like in your own voice — even approximately?"
```

---

## 7. `generateWitnessCues(snap)` — logic

### 7.1 PWA v1 signal sources

| Signal | Derive from synapse |
|--------|---------------------|
| `orbit` | `perpetual_orbit_terms[0]` |
| `bridge` | first open bridge term from `open_bridges[].signal_keys` |
| `resurgence` | `half_life.resurgent[0]` *(add in synapse build)* |
| `denial` | parse `anomalies` entries `denial_sediment:{term}` |
| `absence` | `void_hints[0]` — full matrix in `witness-weather.js`; **`ENABLE_ABSENCE_CUES = false`** until Track B |

### 7.2 Algorithm

```javascript
function generateWitnessCues(snap, opts) {
  const weather = computeWeatherState(snap);
  const retired = opts?.retiredKeys || {}; // from nq_cue_retired
  const cues = [];
  const usedSignals = new Set();
  const candidates = buildCandidates(snap); // §7.1

  for (const candidate of candidates) {
    if (cues.length >= MAX_CUES) break;
    if (usedSignals.has(candidate.type)) continue;

    const key = cueRetireKey(candidate.type, candidate.term);
    if (retired[key]) continue;

    const voice = selectVoice(weather.intensity, opts);
    const pool = CUES_MATRIX[candidate.type][voice];
    if (!pool?.length) continue;

    const question = pool[Math.floor(Math.random() * pool.length)]
      .replace(/\{term\}/g, candidate.term);

    cues.push({
      source_type: candidate.type,
      source_term: candidate.term,
      question_text: question
      // voice key: internal debug only — never render
    });

    usedSignals.add(candidate.type);
  }

  return cues; // 0–3 items
}
```

**0 cues is valid.** Do not manufacture when no signal qualifies or all retired.

---

## 8. Rendering rules (app.js / witness panel)

- **Weather:** first line before READING CORPUS. Bold serif. Accent color. `calm` = skip.
- **Cues:** bottom of pass, after Guardian observation (or SILENCE). Quieter weight than geometry sections.
- **Cue copy:** `question_text` only — **no philosopher name, no voice label, no tap/hover attribution.**
- **Dismiss:** one gesture, no confirmation. Writes `nq_cue_retired["{type}|{term}"] = true`. Never ask that pair again.
- **Engage (optional v2):** user taps cue or writes toward it — dogfood only; does not open Review thread.
- **`post_craft: true`:** skip weather and cues.
- **Stable pick (optional dogfood):** hash `(term, type, date)` → same question if panel reopens same day.

### 8.1 Cue sovereignty (trauma / grief / dismiss)

| Rule | Behavior |
|------|----------|
| **Dismiss = release** | Retire `(type, term)` permanently in `nq_cue_retired` |
| **No appearance ledger** | Do not count ignores — no `{ term: N }` stalking |
| **Geometry unchanged** | Synapse still reads `{term}`; only the **invitation** stops |
| **Export** | `nq_cue_retired` exports with vault settings export (user owns release choices) |
| **Lighthouse (future)** | Optional “release cues for this discourse” for identity-shed sessions |

**Storage key:** `nq_cue_retired` — JSON `{ "orbit|void": true, ... }`. No question text stored.

---

## 9. What Cursor needs to know

1. `witness-weather.js` — pure utility; no DOM, no DB, no imports from `app.js`
2. Both functions receive `synapseSnapshot` from `buildSynapseSnapshot()`
3. Called from witness panel render pipeline after synapse refresh
4. `CUES_MATRIX` is fully hardcoded — do not LLM-generate questions at runtime
5. No worker involvement
6. **Gate:** ship after witness panel WP2 sequence exists
7. **Detach:** remove two calls in panel render; delete file

---

## 10. What to dogfood first

1. `computeWeatherState()` in console — does calm feel calm?
2. `generateWitnessCues()` — do questions feel like the witness, not a seminar?
3. Weather line — atmospheric or intrusive?
4. Cue placement — note on desk or demand?
5. **Dismiss** — does release feel clean? Term never returns as cue?
6. High bucket on grief `{term}` — still too much? Tune gates before tuning copy.

If any fail — delete file. Nothing else changes.

---

## 11. Revision log

| Date | Change |
|------|--------|
| 2026-05 | Initial blueprint — weather states, matrix, selection logic |
| 2026-05-18 | Pinned — Rilke/Rovelli high bucket; Weil rewrite; no Nietzsche/Kierkegaard; dismiss=release; no UI attribution; PWA signal scope; voice keys internal only |
| 2026-05-18 | **Shipped v0** — `witness-weather.js` (generated from blueprint); SUBSTRATE dogfood; absence unwired |

---

*The weather reads conditions. The witness leaves a question. Dismiss releases it. The map keeps breathing.*
