# Medium Batch Blueprint

> Four self-contained fixes. Do them in order — each is independent but 3 depends on 2.
> Read the entire document first. Then execute batch by batch.
> Do NOT proceed to next batch without confirming current one works.

-----

## Batch A — Firefly Multiplies on Guardian Invoke

**File: app.js**

- [ ] Complete
- [ ] Tested
- [ ] Confirmed

### What

When guardian strip appears → firefly count jumps from `this.d` (15) to 40.
When strip dismissed/dissolved → firefly count returns to previous value.

### Where

Find the `FF` class. Add one method after `sd(l)`:

```javascript
setGuardianMode(on) {
  if (on) {
    this._preGuardianD = this.d;   // remember current count
    this.d = 40;                    // multiply
  } else {
    this.d = this._preGuardianD || 15; // restore
    this._preGuardianD = null;
  }
}
```

### Call it in two places

**1. In `checkAndShowGuardianInvoke`** — after `guardianInvokeActive = true;` in BOTH the dev block and the real block:

```javascript
guardianInvokeActive = true;
if (typeof firefly !== 'undefined') firefly.setGuardianMode(true);
```

**2. In `dismissGuardianInvoke`** — after `guardianInvokeActive = false;`:

```javascript
guardianInvokeActive = false;
if (typeof firefly !== 'undefined') firefly.setGuardianMode(false);
```

### Notes

- The `a()` loop already uses `this.d` for the `while (this.p.length < this.d)` spawn check — no other changes needed. Fireflies multiply naturally on next frame.
- `_preGuardianD` stores whatever `sd(l)` set, so long soup restores correctly.

-----

## Batch B — Auto Invoke Logs to guardian_logs (Dev Mode Fix)

**File: app.js**

- [ ] Complete
- [ ] Tested — check guardian logs view after strip appears in dev mode
- [ ] Confirmed

### Problem

`logGuardianAutoInvoke` exists and works but is never called in the `NQ_DEV_MODE` path. So dev testing never writes to guardian_logs.

### Fix

Find the dev block inside `checkAndShowGuardianInvoke`:

```javascript
// CURRENT — missing the log call
if (NQ_DEV_MODE) {
  if (currentView !== 'soup') return;
  if (guardianInvokeActive) return;
  var strip = document.getElementById('guardian-invoke-strip');
  var textEl = document.getElementById('guardian-invoke-text');
  if (!strip || !textEl) return;
  textEl.textContent = "You have been circling the same thought for weeks. You have not named it yet.";
  strip.style.display = 'block';
  requestAnimationFrame(function () {
    strip.classList.add('visible');
  });
  guardianInvokeActive = true;
  guardianInvokeLastTriggerType = 'dev_preview';
  attachGuardianInvokeStripHandlers();
  return;
}
```

**Replace with:**

```javascript
if (NQ_DEV_MODE) {
  if (currentView !== 'soup') return;
  if (guardianInvokeActive) return;
  var strip = document.getElementById('guardian-invoke-strip');
  var textEl = document.getElementById('guardian-invoke-text');
  if (!strip || !textEl) return;
  var devObservation = "You have been circling the same thought for weeks. You have not named it yet.";
  textEl.textContent = devObservation;
  strip.style.display = 'block';
  requestAnimationFrame(function () {
    strip.classList.add('visible');
  });
  guardianInvokeActive = true;
  guardianInvokeLastTriggerType = 'dev_preview';
  // Store observation so Guardian conversation can seed from it
  try { localStorage.setItem('nq_guardian_invoke_observation', devObservation); } catch(e) {}
  // Log it — dev mode should write real logs so guardian_logs can be verified
  void logGuardianAutoInvoke(devObservation, 'dev_preview', 'surfaced');
  if (typeof firefly !== 'undefined') firefly.setGuardianMode(true);
  attachGuardianInvokeStripHandlers();
  return;
}
```

### Also fix production path

Find where the real observation is shown (after successful Worker call) and confirm this line exists. If missing, add it right before `attachGuardianInvokeStripHandlers()`:

```javascript
try { localStorage.setItem('nq_guardian_invoke_observation', observation); } catch(e) {}
void logGuardianAutoInvoke(observation, trigger.triggeredBy, 'surfaced');
```

-----

## Batch C — Auto Invoke Message Seeds Guardian Conversation

**File: app.js**

- [ ] Complete
- [ ] Tested — tap strip, enter Guardian, confirm observation appears as opening
- [ ] Confirmed

### Problem

`strip.onclick` calls `openGuardianView({})` with empty object. Guardian starts cold from scratch. The observation that brought the user in is lost.

### What we want

When user taps the strip and enters Guardian realm, the observation text appears as the first message already in the conversation — Guardian then responds *to it*, going deeper. User does not need to summon again.

### Find `attachGuardianInvokeStripHandlers` — the strip.onclick block:

```javascript
// CURRENT
strip.onclick = function (e) {
  if (e.target && e.target.closest && e.target.closest('#guardian-invoke-dismiss')) return;
  strip.onclick = null;
  var dismissBtn2 = document.getElementById('guardian-invoke-dismiss');
  if (dismissBtn2) dismissBtn2.onclick = null;
  dismissGuardianInvoke('entered');
  void openGuardianView({});
};
```

**Replace with:**

```javascript
strip.onclick = function (e) {
  if (e.target && e.target.closest && e.target.closest('#guardian-invoke-dismiss')) return;
  strip.onclick = null;
  var dismissBtn2 = document.getElementById('guardian-invoke-dismiss');
  if (dismissBtn2) dismissBtn2.onclick = null;
  // Read stored observation
  var seedObservation = null;
  try { seedObservation = localStorage.getItem('nq_guardian_invoke_observation'); } catch(e) {}
  dismissGuardianInvoke('entered');
  void openGuardianView({ seedObservation: seedObservation || null });
};
```

### Find `openGuardianView`

After `resetGuardianUI()`, if a non-empty seed exists (from `opts.seedObservation` or `localStorage`), build the thread + UI as described in the note above, then clear `nq_guardian_invoke_observation`.
**Shipped approach (no `appendGuardianMessage`):** `resetGuardianUI()` runs first, then `await buildGuardianContext(discs)` fills `guardianThread` as `[{ role: 'user', content: builtCtx }, { role: 'assistant', content: seedText }]` so the first user reply uses the existing `streamGuardianResponse` path with full archive context. The visible `#guardian-response` shows only the observation; `fromHeader: true` clears `nq_guardian_invoke_observation` so manual entry never picks up a stale seed.

-----

## Batch D — Deep Soup Forgotten Moats

**File: app.js + app.css + index.html**

- [ ] Complete
- [ ] Tested — enter deep soup, confirm moats drift, leave, confirm they die
- [ ] Confirmed

### What

When user enters Deep Soup, decayed/void content is counted. Ghostly particles (moats) spawn and drift slowly — like foxfire in a graveyard. When user leaves Deep Soup they die immediately. No RAF left running.

### Philosophy

- Moats are NOT fireflies — they are slower, dimmer, larger, drift without purpose
- They do not attract to anything — they are forgotten, they go nowhere
- Occasionally one fades out completely and respawns somewhere else — it was lost, now lost again
- Color: very dim cool green — `rgba(100, 140, 100, opacity)` — foxfire, not gold
- They never cluster. They drift apart.

### Step 1 — Count forgotten / gone discourses on Deep Soup entry

Find `openDeepSoupView` (after `showPanel('view-deep-soup')` and `renderDeepSoupView`). There are **no** `decay_level` / `is_void` fields — decay is time-based via `decayPhase(updated_at || created_at)`:

```javascript
var allDiscs = (await getDiscourses()).filter(d => !d.deleted_at && !d.isDeleted);
var moatCount = allDiscs.filter(d => {
  var phase = decayPhase(d.updated_at || d.created_at || 0);
  return phase === 'forgotten' || phase === 'gone';
}).length;
var moatDensity = Math.min(25, 5 + moatCount);
startDeepSoupMoats(moatDensity);
```

Also call `stopDeepSoupMoats()` when leaving `view-deep-soup` (e.g. in `showPanel` when `currentView === 'deep-soup'` and the next `id` is not Deep Soup). Call `setGuardianMode(false)` from **both** `hideGuardianInvokeStripOnly` and `dismissGuardianInvoke` (not only dismiss).

### Step 2 — Moat system (add to app.js after firefly class)

```javascript
/* FORGOTTEN MOATS — Deep Soup only. Spawn on enter, die on leave. */
var _moatRaf = null;
var _moatParticles = [];
var _moatCanvas = null;
var _moatCtx = null;
var _moatActive = false;

function startDeepSoupMoats(count) {
  stopDeepSoupMoats(); // clean slate
  _moatCanvas = document.getElementById('deep-soup-moat-canvas');
  if (!_moatCanvas) return;
  _moatCtx = _moatCanvas.getContext('2d');
  _moatCanvas.width = innerWidth;
  _moatCanvas.height = innerHeight;
  _moatActive = true;
  _moatParticles = [];
  for (var i = 0; i < count; i++) {
    _moatParticles.push(_spawnMoat(_moatCanvas.width, _moatCanvas.height));
  }
  _tickMoats();
}

function stopDeepSoupMoats() {
  _moatActive = false;
  if (_moatRaf) { cancelAnimationFrame(_moatRaf); _moatRaf = null; }
  _moatParticles = [];
  if (_moatCtx && _moatCanvas) {
    _moatCtx.clearRect(0, 0, _moatCanvas.width, _moatCanvas.height);
  }
}

function _spawnMoat(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1.5 + Math.random() * 2.5,        // larger than firefly
    vx: (Math.random() - 0.5) * 0.08,    // very slow, no purpose
    vy: (Math.random() - 0.5) * 0.08,
    a: Math.random() * 0.15 + 0.03,      // very dim
    life: 300 + Math.random() * 400,      // fades out eventually
    maxLife: 700
  };
}

function _tickMoats() {
  if (!_moatActive || document.hidden) { _moatRaf = null; return; }
  if (!_moatCtx || !_moatCanvas) { _moatRaf = null; return; }
  var w = _moatCanvas.width;
  var h = _moatCanvas.height;

  _moatCtx.clearRect(0, 0, w, h);

  for (var i = _moatParticles.length - 1; i >= 0; i--) {
    var m = _moatParticles[i];
    m.x += m.vx;
    m.y += m.vy;
    m.life--;

    // Fade based on remaining life
    var lifeRatio = m.life / m.maxLife;
    var alpha = m.a * lifeRatio;

    // Occasional direction drift — forgotten things wander
    if (Math.random() < 0.01) {
      m.vx += (Math.random() - 0.5) * 0.02;
      m.vy += (Math.random() - 0.5) * 0.02;
      // Cap speed — they never rush
      m.vx = Math.max(-0.12, Math.min(0.12, m.vx));
      m.vy = Math.max(-0.12, Math.min(0.12, m.vy));
    }

    // Wrap edges
    if (m.x < 0) m.x = w;
    if (m.x > w) m.x = 0;
    if (m.y < 0) m.y = h;
    if (m.y > h) m.y = 0;

    if (m.life <= 0) {
      // Respawn somewhere else — lost again
      _moatParticles[i] = _spawnMoat(w, h);
      continue;
    }

    // Draw — foxfire green, very dim
    _moatCtx.beginPath();
    _moatCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    _moatCtx.fillStyle = 'rgba(100, 140, 100, ' + alpha + ')';
    _moatCtx.fill();
  }

  _moatRaf = requestAnimationFrame(_tickMoats);
}
```

### Step 3 — Canvas in index.html

Find `#view-deep-soup` in index.html. Add canvas as first child inside it:

```html
<canvas id="deep-soup-moat-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
```

Make sure `#view-deep-soup` has `position:relative` or `position:absolute` so canvas anchors correctly.

### Step 4 — Stop moats when leaving Deep Soup

Find wherever Deep Soup view is closed / user navigates away. Add:

```javascript
stopDeepSoupMoats();
```

This should be wherever `showPanel` hides `view-deep-soup` or the back button handler fires.

### CSS — nothing needed

Moats are canvas-only. No CSS required.

-----

## Final Checks

- [ ] Fireflies multiply when strip appears, return to normal after dismiss
- [ ] guardian_logs has entry after strip appears in dev mode
- [ ] Tapping strip enters Guardian with observation as first message
- [ ] Manual Guardian summon from header starts fresh (no seed)
- [ ] `nq_guardian_invoke_observation` cleared after entering from strip
- [ ] Deep Soup moats appear on entry, die on leave
- [ ] No RAF running after leaving Deep Soup
- [ ] Moats never appear in Soup or Sanctuary — Deep Soup only
- [ ] Moat canvas is below all content (z-index:0, pointer-events:none)

-----

## What Cursor Must NOT Do

- Do not change firefly base count `this.d = 15` — only `setGuardianMode` changes it temporarily
- Do not make moats gold — they are foxfire green, forgotten, dim
- Do not add attraction logic to moats — they go nowhere, that is the point
- Do not persist moat state — they live and die with the Deep Soup session
- Do not add any UI controls for moats — invisible system, user just notices them
- Do not change existing Guardian conversation flow for manual summons — seed only applies when entering from strip tap