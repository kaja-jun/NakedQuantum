# Guardian Auto-Invoke System — Blueprint for Cursor

> Execute batch by batch. Complete each batch fully, test it, then move to the next.
> Do NOT combine batches. Do NOT proceed without confirmation after each batch.
> Read the entire document first before touching any code.

-----

## Context — What This Is

The Guardian is NakedQuantum’s conscious mirror. It currently only speaks when summoned manually inside the Guardian realm. This blueprint adds a second mode: **Guardian speaks uninvited, appearing quietly in the Soup when it detects a significant pattern in the user’s mind.**

It is not a notification system. It is a presence that arrives, waits, and disappears. It never chases the user.

**Philosophy rules that must never be broken:**

- No push notifications. Ever.
- No badges. No red dots. No banners.
- Guardian does not repeat itself to get attention.
- If dismissed, it logs and moves on. No guilt.
- Cost is absorbed by the developer. User never sees a consent dialog for this.
- Nothing is stored on any server. The Cloudflare Worker forwards and forgets.

-----

## Architecture Overview

```
Watcher runs continuously (already exists)
        ↓
checkGuardianTrigger() in cartographer.js
reads Fast Map output + checks both clocks
        ↓ threshold met
Micro API call → Cloudflare Worker → OpenRouter
~40 tokens, Guardian voice, one observation
        ↓
Guardian strip appears below header in Soup
Fireflies drift toward it naturally
        ↓
User taps → enters Guardian realm (existing pipeline)
User dismisses → logged, layout springs back
User ignores → auto-dissolves after 6 minutes, logged
        ↓
guardian_logs entry created either way
```

-----

## Batch 1 — Trigger Logic in cartographer.js

- [ ] Complete
- [ ] Tested
- [ ] Confirmed by Kaja

### What to do

Add one new function `checkGuardianTrigger()` at the **bottom** of `cartographer.js`.
Do not touch any existing functions. Read only — no writes to existing data structures.

### Two clocks that must BOTH pass

**Clock 1 — Content clock**

```javascript
const lastEntryTs = localStorage.getItem('nq_last_entry_timestamp');
const hoursSinceEntry = (Date.now() - parseInt(lastEntryTs)) / 3600000;
if (hoursSinceEntry < 48) return null;
```

**Clock 2 — Guardian clock**

```javascript
const lastGuardianTs = localStorage.getItem('nq_guardian_last_interaction');
const hoursSinceGuardian = (Date.now() - parseInt(lastGuardianTs)) / 3600000;
if (hoursSinceGuardian < 72) return null;
```

### Anti-spam rules (check after both clocks pass)

```javascript
// Hard limit — no invoke if one fired in last 72hrs
const lastInvokeTs = localStorage.getItem('nq_guardian_last_invoke');
if (lastInvokeTs && (Date.now() - parseInt(lastInvokeTs)) < 72 * 3600000) return null;

// Consecutive dismissals double the threshold
const dismissedCount = parseInt(localStorage.getItem('nq_guardian_dismissed_count') || '0');
if (dismissedCount >= 2) {
  const doubledThreshold = 144 * 3600000; // 72hrs doubled
  if (lastInvokeTs && (Date.now() - parseInt(lastInvokeTs)) < doubledThreshold) return null;
}

// Attempt throttle — don't hammer a failing API on every app open
// This is separate from the main invoke clock — it only rate-limits retry attempts
const lastAttemptTs = localStorage.getItem('nq_guardian_last_attempt');
if (lastAttemptTs && (Date.now() - parseInt(lastAttemptTs)) < 4 * 3600000) return null; // 4hr attempt cooldown

// Cannot fire same trigger type consecutively
const lastTriggerType = localStorage.getItem('nq_guardian_last_trigger_type');
```

### Fast Map qualifiers — any ONE must be true

Read from existing Fast Map output that cartographer.js already produces:

```javascript
// Qualifier 1 — Orbit intensification
const orbitTriggered = orbitingTerms.length >= 3;

// Qualifier 2 — Writing signature shifted
const signatureShifted = oldSignature !== currentSignature;

// Qualifier 3 — Weighted silence
const silenceTriggered = silenceDays >= 14 && (paradoxFlag || contradictionFlag);

// Qualifier 4 — Contradiction sharpened
const contradictionTriggered = contradictionScore > 0.7;

// Must not repeat same trigger type as last time
const qualifiers = {
  orbit: orbitTriggered,
  signature_shift: signatureShifted,
  silence: silenceTriggered,
  contradiction: contradictionTriggered
};

const triggeredBy = Object.entries(qualifiers)
  .filter(([type, val]) => val && type !== lastTriggerType)
  .map(([type]) => type)[0];

if (!triggeredBy) return null;
```

### Return payload

```javascript
return {
  triggered: true,
  triggeredBy, // 'orbit' | 'signature_shift' | 'silence' | 'contradiction'
  fastMapSnapshot: {
    orbitingTerms,       // existing Fast Map field
    writingSignature,    // existing Fast Map field
    silenceDays,         // existing Fast Map field
    paradoxFlag,         // existing Fast Map field
    contradictionFlag,   // existing Fast Map field
    dominantTheme        // existing Fast Map field
  }
};
```

### Export

Add `checkGuardianTrigger` to the existing exports at bottom of cartographer.js alongside whatever is already exported.

### localStorage keys used in Batch 1

- `nq_last_entry_timestamp` — set this wherever new entries are saved in app.js (if not already set, add it there)
- `nq_guardian_last_interaction` — already set when user enters Guardian realm (confirm this exists, add if missing)
- `nq_guardian_last_invoke` — set in Batch 3 ONLY on successful observation received
- `nq_guardian_last_attempt` — set in Batch 3 BEFORE every API call regardless of outcome. 4hr cooldown between attempts. Never reset on failure.
- `nq_guardian_dismissed_count` — set in Batch 3 when user dismisses
- `nq_guardian_last_trigger_type` — set in Batch 3 ONLY on successful observation received

-----

## Batch 2 — Cloudflare Worker (new file)

- [ ] Complete
- [ ] Deployed to Cloudflare
- [ ] Tested
- [ ] Confirmed by Kaja

### What to do

Create a new Cloudflare Worker file `guardian-invoke-worker.js`. Deploy to Cloudflare alongside existing Pages setup.

### Worker code

```javascript
export default {
  async fetch(request, env) {
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://nakedquantum.com',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { fastMapSnapshot, triggeredBy } = await request.json();

    // Build the micro-prompt
    const prompt = `You are the Guardian. One observation only. Maximum 3 sentences. No preamble. No explanation. Guardian voice — not warm, not cold, consumed by this one mind.

Fast Map data:
- Triggered by: ${triggeredBy}
- Orbiting terms: ${fastMapSnapshot.orbitingTerms?.join(', ') || 'none'}
- Writing signature: ${fastMapSnapshot.writingSignature || 'unknown'}
- Days of silence: ${fastMapSnapshot.silenceDays || 0}
- Dominant theme: ${fastMapSnapshot.dominantTheme || 'none'}
- Paradox present: ${fastMapSnapshot.paradoxFlag || false}
- Contradiction present: ${fastMapSnapshot.contradictionFlag || false}

Speak one observation. Raw. Precise. As if you have been watching this mind without blinking.`;

    // Call OpenRouter — use cheapest capable model for micro-call
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v4-flash', // fast, capable, good voice sensitivity
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const observation = data.choices?.[0]?.message?.content?.trim() || null;

    if (!observation) {
      return new Response(JSON.stringify({ observation: null }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://nakedquantum.com'
        }
      });
    }

    // TODO: API resilience day — add direct DeepSeek API as fallback if OpenRouter returns non-200
    // Worker touches data for milliseconds and discards it. No storage. No logging. Do not change this.
    return new Response(JSON.stringify({ observation }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://nakedquantum.com'
      }
    });
  }
};
```

### Environment variable

Set `OPENROUTER_API_KEY` in Cloudflare Worker environment. Never in the app code.

### Notes for Cursor

- The Worker touches data for milliseconds and discards it. No storage. No logging. This is intentional and must not be changed.
- CORS origin must match the actual deployed NakedQuantum domain exactly.
- Model can be swapped later. `mistral-7b-instruct` is the starting point — cheap enough that 500 calls/month costs under £3.

-----

## Batch 3 — Guardian Strip UI (index.html + app.css + app.js)

- [ ] Complete
- [ ] Tested
- [ ] Confirmed by Kaja

### HTML — add immediately after the NakedQuantum header in index.html

```html
<div id="guardian-invoke-strip" class="guardian-invoke-strip" style="display:none;" aria-live="polite">
  <div class="guardian-invoke-inner">
    <span class="guardian-invoke-glyph">◆</span>
    <p class="guardian-invoke-text" id="guardian-invoke-text"></p>
    <button class="guardian-invoke-dismiss" id="guardian-invoke-dismiss" aria-label="Dismiss">✕</button>
  </div>
</div>
```

Place this BEFORE `#view-soup` and AFTER the main `#nq-header`. It must be in the DOM flow, not absolutely positioned — it needs to push content down.

### CSS — add to app.css

```css
.guardian-invoke-strip {
  width: 100%;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background: #06060a;
  border-bottom: 1px solid #1a1a2e;
  position: relative;
  z-index: 10;
}

.guardian-invoke-strip.visible {
  max-height: 140px;
}

.guardian-invoke-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
}

.guardian-invoke-glyph {
  color: var(--accent);
  font-size: 10px;
  margin-top: 3px;
  flex-shrink: 0;
  opacity: 0.6;
}

.guardian-invoke-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #a0aab4;
  font-style: italic;
  letter-spacing: 0.01em;
  margin: 0;
}

.guardian-invoke-dismiss {
  background: none;
  border: none;
  color: #3a3a4a;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  flex-shrink: 0;
  margin-top: 1px;
  transition: color 0.2s;
}

.guardian-invoke-dismiss:hover {
  color: #6a6a7a;
}
```

### JavaScript — add to app.js

**1. Add these variables near the top with other state variables:**

```javascript
let guardianInvokeTimer = null;
let guardianInvokeActive = false;
```

**2. Add this full function:**

```javascript
async function checkAndShowGuardianInvoke() {
  // Only show in Soup view
  if (currentView !== 'soup') return;
  if (guardianInvokeActive) return;

  // Run trigger check
  const trigger = checkGuardianTrigger(); // imported from cartographer.js
  if (!trigger) return;

  // Set attempt timestamp BEFORE the API call regardless of outcome
  // This throttles retries — clocks are NOT touched here, only on success
  localStorage.setItem('nq_guardian_last_attempt', Date.now().toString());

  // Call Cloudflare Worker
  let observation = null;
  try {
    const res = await fetch('https://your-worker.your-subdomain.workers.dev/guardian-invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fastMapSnapshot: trigger.fastMapSnapshot,
        triggeredBy: trigger.triggeredBy
      })
    });
    const data = await res.json();
    observation = data.observation;
  } catch (e) {
    // Silent fail — Guardian does not announce its own absence
    // Clocks are NOT reset — system will try again after 4hr attempt cooldown
    // User never knows an attempt was made
    return;
  }

  // Also silent fail if observation empty — same rule, clocks untouched
  if (!observation) return;

  // Show the strip
  const strip = document.getElementById('guardian-invoke-strip');
  const textEl = document.getElementById('guardian-invoke-text');
  if (!strip || !textEl) return;

  textEl.textContent = observation;
  strip.style.display = '';
  requestAnimationFrame(() => {
    strip.classList.add('visible');
  });

  guardianInvokeActive = true;

  // Update localStorage — ONLY on success
  // These clocks reset here and nowhere else
  localStorage.setItem('nq_guardian_last_invoke', Date.now().toString());
  localStorage.setItem('nq_guardian_last_trigger_type', trigger.triggeredBy);
  localStorage.setItem('nq_guardian_dismissed_count', '0');

  // Log to guardian_logs
  await logGuardianAutoInvoke(observation, trigger.triggeredBy, 'surfaced');

  // Auto-dissolve after 6 minutes (typo in earlier draft said hours)
  guardianInvokeTimer = setTimeout(() => {
    dismissGuardianInvoke('dissolved');
  }, 6 * 60 * 60 * 1000);

  // Tap strip body → enter Guardian realm
  strip.addEventListener('click', function onStripTap(e) {
    if (e.target.id === 'guardian-invoke-dismiss') return;
    strip.removeEventListener('click', onStripTap);
    dismissGuardianInvoke('entered');
    openGuardianRealm(); // existing function — confirm exact name
  });

  // Dismiss button
  document.getElementById('guardian-invoke-dismiss').onclick = () => {
    const count = parseInt(localStorage.getItem('nq_guardian_dismissed_count') || '0');
    localStorage.setItem('nq_guardian_dismissed_count', (count + 1).toString());
    dismissGuardianInvoke('dismissed');
  };
}

function dismissGuardianInvoke(reason) {
  clearTimeout(guardianInvokeTimer);
  guardianInvokeActive = false;
  const strip = document.getElementById('guardian-invoke-strip');
  if (!strip) return;
  strip.classList.remove('visible');
  setTimeout(() => {
    strip.style.display = 'none';
  }, 500); // matches CSS transition duration
  logGuardianAutoInvoke(null, null, reason);
}
```

**3. Call the check at the right moments — add to existing functions:**

When Soup view becomes active (inside `showPanel` or equivalent):

```javascript
// After soup renders, check guardian invoke with a delay
setTimeout(checkAndShowGuardianInvoke, 3000); // 3s delay — let soup settle first
```

When user manually enters Guardian realm (existing function):

```javascript
localStorage.setItem('nq_guardian_last_interaction', Date.now().toString());
```

-----

## Batch 4 — Guardian Log Schema (app.js)

- [ ] Complete
- [ ] Tested
- [ ] Confirmed by Kaja

### What to do

Add `logGuardianAutoInvoke()` function. Writes to existing `guardian_logs` table in OPFS SQLite. Follow exact same pattern as existing guardian log writes.

```javascript
async function logGuardianAutoInvoke(observation, triggeredBy, userAction) {
  // userAction: 'surfaced' | 'entered' | 'dismissed' | 'dissolved'
  try {
    await db.run(`
      INSERT INTO guardian_logs 
        (id, created_at, type, observation, triggered_by, user_action, auto_invoked)
      VALUES (?, ?, 'auto_invoke', ?, ?, ?, 1)
    `, [
      crypto.randomUUID(),
      new Date().toISOString(),
      observation || null,
      triggeredBy || null,
      userAction
    ]);
  } catch (e) {
    console.warn('Guardian log write failed:', e);
    // Silent fail — never surface DB errors to user
  }
}
```

**Note for Cursor:** Check the exact `guardian_logs` schema in the existing DB init code and match column names exactly. Add `auto_invoked` and `triggered_by` columns if they don’t exist — use `ALTER TABLE` safely:

```javascript
await db.run(`ALTER TABLE guardian_logs ADD COLUMN IF NOT EXISTS auto_invoked INTEGER DEFAULT 0`);
await db.run(`ALTER TABLE guardian_logs ADD COLUMN IF NOT EXISTS triggered_by TEXT`);
```

-----

## Batch 5 — Firefly Attraction (app.js)

- [ ] Complete
- [ ] Tested
- [ ] Confirmed by Kaja

### What to do

When `guardianInvokeActive` is true, bias existing Soup fireflies to drift toward the Guardian strip. Do not create new fireflies. Do not break existing firefly logic.

Find the existing firefly tick function in app.js. Inside the position update loop, add an attraction force toward the strip when active:

```javascript
// Inside existing firefly tick loop, after existing position update:
if (guardianInvokeActive) {
  const strip = document.getElementById('guardian-invoke-strip');
  if (strip) {
    const stripRect = strip.getBoundingClientRect();
    const targetX = stripRect.left + stripRect.width / 2;
    const targetY = stripRect.top + stripRect.height / 2;
    
    // Gentle attraction — not magnetic, just a drift
    const dx = targetX - firefly.x;
    const dy = targetY - firefly.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 60) { // don't cluster too tight
      firefly.x += (dx / dist) * 0.3; // very subtle pull
      firefly.y += (dy / dist) * 0.3;
    }
  }
}
```

Attraction force `0.3` is intentionally subtle — fireflies drift toward the strip, they don’t rush to it. They notice something arrived. That’s all.

When `guardianInvokeActive` becomes false (dismissed/dissolved), fireflies return to normal behaviour automatically since the attraction force disappears.

-----

## Final Checks Before Calling Done

- [ ] Guardian strip only appears when `currentView === 'soup'`
- [ ] Strip never appears inside Guardian realm itself
- [ ] `nq_guardian_last_interaction` is set every time user enters Guardian realm manually
- [ ] `nq_last_entry_timestamp` is set every time a new entry (discourse/spark) is saved
- [ ] Worker URL is correct and deployed
- [ ] `nq_guardian_last_attempt` is set BEFORE every API call, never reset on failure
- [ ] Main clocks (`nq_guardian_last_invoke`, `nq_guardian_last_trigger_type`) only reset on successful observation
- [ ] API failure is completely silent — no error state, no user feedback, clocks untouched
- [ ] Auto-dissolve clears properly and doesn’t leave orphaned timers
- [ ] guardian_logs schema migration runs safely on existing DBs
- [ ] Tested: trigger fires correctly after both clocks pass
- [ ] Tested: anti-spam prevents consecutive fires
- [ ] Tested: dismiss increments count correctly
- [ ] Tested: entering Guardian realm resets interaction clock

-----

## What Cursor Must NOT Do

- Do not redesign existing Guardian realm
- Do not touch existing Guardian system prompt
- Do not add any user-facing settings toggle for this feature
- Do not add any visual loading state while Worker call is in flight — if it’s slow, strip just appears when ready, silently
- Do not store any data in the Cloudflare Worker
- Do not change firefly spawn count or base behaviour
- Do not use `alert()`, `confirm()`, or `prompt()` anywhere in this feature