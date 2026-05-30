/* jshint esversion: 11 */
/* global window, document, requestAnimationFrame, cancelAnimationFrame, ResizeObserver, setTimeout, NQ_DEV_MODE, W_SIMILARITY_THRESHOLD, dbGet, dbGetAll, getDiscourse, getDiscourses, escHtml, showToast, closeOverlay, openSparkEditSheet, openDiscourse, parseFastMapKeyTermStrings, parseGuardianDirectiveRaw, isWatcherReady, watcherDB, wdb, watcherCosine, currentView, showPanel */
/**
 * Abyss canvas engine + interaction (#abyss-canvas).
 * See app-architecture-split-blueprint.md (S2).
 * Loads after app.js — uses global db helpers, Watcher, Guardian parse, realm routing.
 */

// ── ABYSS ENGINE ─────────────────────────────────────────────────────────────
var abyssAnimFrame = null;
var abyssRunning = false;
var abyssObjects = [];
var abyssCanvas = null;
var abyssCtx = null;
var abyssW = 0;
var abyssH = 0;
var abyssEnterTime = 0;
var abyssTouchX = -9999;
var abyssTouchY = -9999;
var abyssLastFrame = 0;
var ABYSS_FPS = 30; // calm, consistent
var ABYSS_FRAME_MS = 1000 / ABYSS_FPS;
var abyssSparks = [];          // background noise particles
var abyssPulses = [];          // traveling dots on threads
var abyssFiringDot = null;     // currently firing disc-dot
var abyssFiringTimer = 0;      // countdown to next spontaneous fire
var abyssTouchRipples = [];   // multiple expanding rings per touch
var abyssNeuralSignals = [];  // living electric signals between nodes
var abyssThreadAlpha = new Map(); // thread id → current opacity (birth/death)
var abyssLastSignalTime = 0;
var NEURAL_SIGNAL_INTERVAL = 1800; // ms between new signals
var NEURAL_MAX_SIGNALS = 12;       // max concurrent signals
var NEURAL_CASCADE_DEPTH = 3;      // max hops per cascade
var abyssWeather = 'neutral';
/** Active guardian directive tint for Abyss disc-dots (refreshed on open + after witness field log). */
var abyssActiveTint = null;

function getAbyssLinkThreshold() {
  return NQ_DEV_MODE ? W_SIMILARITY_THRESHOLD : 0.73;
}

function abyssArcTension(mapRow) {
  if (!mapRow || !mapRow.emotional_arc) return 0;
  var a = mapRow.emotional_arc;
  if (typeof a === 'string') {
    try { a = JSON.parse(a); } catch (parseEx) { return 0; }
  }
  if (!a || typeof a !== 'object') return 0;
  var t = a.tension_shift;
  return typeof t === 'number' ? t : 0;
}

function abyssLinkIsContradiction(mapA, mapB) {
  var arcA = abyssArcTension(mapA);
  var arcB = abyssArcTension(mapB);
  return (arcA > 0.02 && arcB < -0.02) || (arcA < -0.02 && arcB > 0.02);
}

function buildAbyssDna(fm) {
  var dna = {
    paradox: 0,
    arcDir: 'flat',
    silenceRatio: 0,
    dominantTone: 'neutral',
    depersonalLabel: '',
    driftScale: 0.04
  };
  if (!fm || fm.map_type !== 'fast') return dna;
  var arc = fm.emotional_arc;
  if (typeof arc === 'string') {
    try { arc = JSON.parse(arc); } catch (e) { arc = null; }
  }
  var sig = fm.signature;
  if (sig && sig.paradox) dna.paradox = sig.paradox.count || 0;
  if (arc && arc.direction) dna.arcDir = arc.direction;
  if (fm.silence_weight && typeof fm.silence_weight.ratio === 'number') {
    dna.silenceRatio = fm.silence_weight.ratio;
  }
  if (fm.depersonalisation && fm.depersonalisation.label) {
    dna.depersonalLabel = String(fm.depersonalisation.label);
  }
  var ts = arc && typeof arc.tension_shift === 'number' ? arc.tension_shift : 0;
  if (ts > 0.02) {
    dna.dominantTone = 'escalating';
    dna.driftScale = 0.045;
  } else if (ts < -0.02) {
    dna.dominantTone = 'resolving';
    dna.driftScale = 0.025;
  } else if (dna.paradox >= 3) {
    dna.dominantTone = 'charged';
  }
  dna.keyTerms = parseFastMapKeyTermStrings(fm);
  return dna;
}

function abyssComputeWeather(summariesMap) {
  var arcScores = [];
  summariesMap.forEach(function (fm) {
    if (!fm || fm.map_type !== 'fast') return;
    var t = abyssArcTension(fm);
    if (typeof t === 'number') arcScores.push(t);
  });
  if (arcScores.length < 3) return 'neutral';
  var avg = arcScores.reduce(function (a, b) { return a + b; }, 0) / arcScores.length;
  if (avg > 0.025) return 'charged';
  if (avg < -0.025) return 'resolving';
  return 'neutral';
}

async function abyssSettle(iterations, strongLinks) {
  var discDots = [];
  for (var i = 0; i < abyssObjects.length; i++) {
    if (abyssObjects[i].kind === 'disc-dot') discDots.push(abyssObjects[i]);
  }
  if (discDots.length < 3) return;

  if (discDots.length > 80) iterations = 100;

  var vectors = {};
  if (isWatcherReady && watcherDB) {
    try {
      var embeds = await wdb.getAll('embeddings');
      for (var ei = 0; ei < embeds.length; ei++) {
        if (embeds[ei].vector) vectors[embeds[ei].id] = embeds[ei].vector;
      }
    } catch (embErr) {}
  }

  var SETTLE_DAMPING = 0.82;
  var SETTLE_VX = {};
  var SETTLE_VY = {};
  var discById = {};
  for (var di = 0; di < discDots.length; di++) {
    var dd = discDots[di];
    SETTLE_VX[dd.id] = 0;
    SETTLE_VY[dd.id] = 0;
    discById[dd.id] = dd;
  }

  var sparsePairs = discDots.length > 50;
  strongLinks = strongLinks || [];

  for (var iter = 0; iter < iterations; iter++) {
    if (!abyssRunning) return;
    if (iter > 0 && iter % 20 === 0) {
      await new Promise(function (r) { setTimeout(r, 0); });
    }

    for (var i = 0; i < discDots.length; i++) {
      for (var j = i + 1; j < discDots.length; j++) {
        var a = discDots[i];
        var b = discDots[j];
        var vA = vectors[a.id];
        var vB = vectors[b.id];
        if (!vA || !vB) continue;
        var sim = watcherCosine(new Float32Array(vA), new Float32Array(vB));
        if (sparsePairs && sim < 0.55) continue;
        var restLen = 0.15 + (1 - sim) * 0.55;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        var force = (dist - restLen) * 0.004 * sim;
        SETTLE_VX[a.id] += (dx / dist) * force;
        SETTLE_VY[a.id] += (dy / dist) * force;
        SETTLE_VX[b.id] -= (dx / dist) * force;
        SETTLE_VY[b.id] -= (dy / dist) * force;
      }
    }

    for (var li = 0; li < strongLinks.length; li++) {
      var link = strongLinks[li];
      var dotA = discById[link.a];
      var dotB = discById[link.b];
      if (!dotA || !dotB) continue;
      var dx2 = dotB.x - dotA.x;
      var dy2 = dotB.y - dotA.y;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 0.001;
      var f = link.isContra ? -0.012 : link.score * 0.018;
      SETTLE_VX[dotA.id] += (dx2 / dist2) * f;
      SETTLE_VY[dotA.id] += (dy2 / dist2) * f;
      SETTLE_VX[dotB.id] -= (dx2 / dist2) * f;
      SETTLE_VY[dotB.id] -= (dy2 / dist2) * f;
    }

    for (var i2 = 0; i2 < discDots.length; i2++) {
      for (var j2 = i2 + 1; j2 < discDots.length; j2++) {
        var a2 = discDots[i2];
        var b2 = discDots[j2];
        var dx3 = b2.x - a2.x;
        var dy3 = b2.y - a2.y;
        var dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3) + 0.001;
        if (dist3 < 0.18) {
          var rep = 0.003 / (dist3 * dist3);
          SETTLE_VX[a2.id] -= (dx3 / dist3) * rep;
          SETTLE_VY[a2.id] -= (dy3 / dist3) * rep;
          SETTLE_VX[b2.id] += (dx3 / dist3) * rep;
          SETTLE_VY[b2.id] += (dy3 / dist3) * rep;
        }
      }
    }

    for (var ai = 0; ai < discDots.length; ai++) {
      var d = discDots[ai];
      if (!vectors[d.id]) continue;
      SETTLE_VX[d.id] *= SETTLE_DAMPING;
      SETTLE_VY[d.id] *= SETTLE_DAMPING;
      d.x = Math.min(0.90, Math.max(0.10, d.x + SETTLE_VX[d.id]));
      d.y = Math.min(0.90, Math.max(0.10, d.y + SETTLE_VY[d.id]));
    }
  }

  for (var oi = 0; oi < discDots.length; oi++) {
    var od = discDots[oi];
    if (vectors[od.id]) continue;
    abyssBiasPresenceToRim(od);
  }
}

function abyssBiasPresenceToRim(obj) {
  var odx = obj.x - 0.5;
  var ody = obj.y - 0.5;
  var olen = Math.sqrt(odx * odx + ody * ody) + 0.001;
  var rad = 0.35 + (abyssHash(String(obj.id) + 'rim') % 150) / 1000;
  obj.x = Math.min(0.90, Math.max(0.10, 0.5 + (odx / olen) * rad));
  obj.y = Math.min(0.90, Math.max(0.10, 0.5 + (ody / olen) * rad));
}
   
var ABYSS_EMERGE = {
  anchors:    1500,   // ms -- oldest ring + newest dot
  dots:       4000,   // discourse presence dots
  threads:    9000,   // similarity + contradiction threads
  clusters:   13000,  // deep map clusters
  full:       16000   // full sky
};

function abyssEased(t) {
  // Smooth ease-in for opacity ramps
  return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
}

function abyssAge(ts) {
  // Returns 0.0 (ancient) to 1.0 (brand new) -- 90-day window
  var days = (Date.now() - ts) / 86400000;
  return Math.max(0, 1 - days / 90);
}

async function buildAbyssObjects() {
  abyssObjects = [];
  var strongLinks = [];
  var summariesMap = new Map();
  var linkThreshold = getAbyssLinkThreshold();

  try {
    var allSummaries = await dbGetAll('guardian_summaries');
    for (var si0 = 0; si0 < allSummaries.length; si0++) {
      summariesMap.set(allSummaries[si0].id, allSummaries[si0]);
    }
  } catch (mapErr) {
    console.warn('[Abyss] summaries preload:', mapErr && mapErr.message ? mapErr.message : mapErr);
  }

  var allDiscs = await dbGetAll('cosm_discourses');
  if (!Array.isArray(allDiscs)) allDiscs = [];
  var active = allDiscs.filter(function (d) {
    return !d.isDeleted && !d.deleted_at;
  });

  if (!active.length) {
    abyssObjects.push({
      kind: 'anchor-old',
      x: 0.14,
      y: 0.16,
      ts: Date.now() - 86400000,
      emergeAt: 0
    });
    abyssObjects.push({
      kind: 'anchor-new',
      x: 0.86,
      y: 0.84,
      ts: Date.now(),
      emergeAt: 0
    });
    abyssWeather = 'neutral';
    return { strongLinks: strongLinks };
  }

  // ── Chronological anchors ─────────────────────────────────────────────────
  var times = active.map(function(d) { return d.created_at || 0; });
  var minT = Math.min.apply(null, times);
  var maxT = Math.max.apply(null, times);

  // Oldest -- faint unlabelled ring at edge
  abyssObjects.push({
    kind: 'anchor-old',
    x: 0.12 + Math.random() * 0.06,
    y: 0.12 + Math.random() * 0.06,
    ts: minT,
    emergeAt: ABYSS_EMERGE.anchors
  });

  // Newest -- slightly brighter point, fades after 60s in Abyss
  abyssObjects.push({
    kind: 'anchor-new',
    x: 0.82 + Math.random() * 0.06,
    y: 0.82 + Math.random() * 0.06,
    ts: maxT,
    emergeAt: ABYSS_EMERGE.anchors
  });

  // ── Discourse presence dots ───────────────────────────────────────────────
  // Position seeded by discourse id hash so layout is consistent
  for (var i = 0; i < active.length; i++) {
    var d = active[i];
    var hash = abyssHash(d.id);
    var x = 0.08 + ((hash & 0xFFF) / 0xFFF) * 0.84;
    var y = 0.08 + (((hash >> 12) & 0xFFF) / 0xFFF) * 0.84;
    var age = abyssAge(d.updated_at || d.created_at || 0);
    abyssObjects.push({
      kind: 'disc-dot',
      id: d.id,
      title: d.title || 'Untitled',         
  typeLabel: d.item_type || 'discourse',
      x: x,
      y: y,
      age: age,
      vx: 0, vy: 0,  // for later Brownian motion
      emergeAt: ABYSS_EMERGE.dots
    });
  }

  try {
  // ── Guardian log fragments ────────────────────────────────────────────────
  var logs = await dbGetAll('guardian_logs');
  var recentLogs = logs
    .filter(function(l) { return !l.was_silent && l.response_text; })
    .sort(function(a, b) { return b.invoked_at - a.invoked_at; })
    .slice(0, 10);

  // ── Guardian echo nodes (ringed dots instead of text) ──────────────────
  for (var j = 0; j < recentLogs.length; j++) {
    var log = recentLogs[j];
    var logAge = abyssAge(log.invoked_at);
    var nodeOpacity = 0.08 + logAge * 0.52;   // 0.08 → 0.60
    var hash2 = abyssHash(log.id);
    var x2 = 0.1 + ((hash2 & 0xFFF) / 0xFFF) * 0.8;
    var y2 = 0.1 + (((hash2 >> 12) & 0xFFF) / 0xFFF) * 0.8;
    abyssObjects.push({
      kind: 'guardian-node',
      id: log.id,
      x: x2,
      y: y2,
      age: logAge,
      baseOpacity: nodeOpacity,
      ringPhase: Math.random() * Math.PI * 2,
      shimmerOffset: Math.random() * 1000,
      emergeAt: ABYSS_EMERGE.anchors,
      logData: log                  // full log object for tap-to-open
    });
  }
  
// ── Deep map clusters ─────────────────────────────────────────────────────
  var deepLocal = [];
  summariesMap.forEach(function (dm) {
    if (dm.map_type === 'deep_local' && dm.summary) deepLocal.push(dm);
  });
  
  for (var di = 0; di < deepLocal.length; di++) {
    var dm = deepLocal[di];
    // Find the parent discourse dot
    var parentDot = null;
    for (var pi = 0; pi < abyssObjects.length; pi++) {
      if (abyssObjects[pi].kind === 'disc-dot' && abyssObjects[pi].id === dm.discourse_id) {
        parentDot = abyssObjects[pi];
        break;
      }
    }
    if (!parentDot) continue;
    
    var nodeCount = 5 + (abyssHash(dm.id) % 4);  // 5–8 tiny dots
    var baseAngle = (abyssHash(dm.id + 'angle') % 628) / 100; // 0–2π
    var clusterRadius = 0.012 + (abyssHash(dm.id + 'rad') % 8) / 1000; // tiny orbit
    var isRecent = (Date.now() - (dm.generated_at || 0)) < 7 * 86400000;
    
    for (var ci = 0; ci < nodeCount; ci++) {
      var orbitAngle = baseAngle + (ci / nodeCount) * Math.PI * 2;
      abyssObjects.push({
        kind: 'cluster-dot',
        parentId: dm.discourse_id,
        parentDot: parentDot,
        orbitAngle: orbitAngle,
        orbitRadius: clusterRadius,
        orbitSpeed: 0.0003 + Math.random() * 0.0004,
        summary: dm.summary,
        isRecent: isRecent,
        emergeAt: ABYSS_EMERGE.clusters
      });
    }
  }
  } catch (extErr) {
    console.warn('[Abyss] guardian / summaries layer:', extErr && extErr.message ? extErr.message : extErr);
  }

  try {
    var chars = await dbGetAll('characters');
    if (!Array.isArray(chars)) chars = [];
    var activeChars = chars.filter(function (c) {
      return !c.is_deleted && !c.isDeleted;
    });
    for (var ci = 0; ci < activeChars.length; ci++) {
      var ch = activeChars[ci];
      var chHash = abyssHash(ch.id + 'sanctuary');
      var chX = 0.08 + ((chHash & 0xFFF) / 0xFFF) * 0.84;
      var chY = 0.08 + (((chHash >> 12) & 0xFFF) / 0xFFF) * 0.84;
      var chAge = abyssAge(ch.updated_at || ch.created_at || 0);
      var sp = {
        kind: 'sanctuary-presence',
        id: ch.id,
        name: ch.name || 'Presence',
        x: chX,
        y: chY,
        age: chAge,
        vx: 0,
        vy: 0,
        brownianScale: 0.012,
        emergeAt: ABYSS_EMERGE.dots
      };
      abyssBiasPresenceToRim(sp);
      abyssObjects.push(sp);
    }
  } catch (sanctErr) {
    console.warn('[Abyss] Sanctuary layer:', sanctErr && sanctErr.message ? sanctErr.message : sanctErr);
  }

  for (var dpi = 0; dpi < abyssObjects.length; dpi++) {
    if (abyssObjects[dpi].kind === 'disc-dot') {
      abyssObjects[dpi].dna = buildAbyssDna(summariesMap.get(abyssObjects[dpi].id));
    }
  }

  abyssWeather = abyssComputeWeather(summariesMap);

  if (isWatcherReady && watcherDB) {
    try {
      var links = await wdb.getAll('links');
      var strong = links.filter(function (l) { return l.score >= linkThreshold; }).slice(0, 30);
      for (var k = 0; k < strong.length; k++) {
        var link = strong[k];
        var dotA = null;
        var dotB = null;
        for (var m = 0; m < abyssObjects.length; m++) {
          if (abyssObjects[m].kind === 'disc-dot') {
            if (abyssObjects[m].id === link.a) dotA = abyssObjects[m];
            if (abyssObjects[m].id === link.b) dotB = abyssObjects[m];
          }
        }
        if (!dotA || !dotB) continue;
        var mapA = summariesMap.get(link.a) || null;
        var mapB = summariesMap.get(link.b) || null;
        var isContradiction = abyssLinkIsContradiction(mapA, mapB);
        strongLinks.push({
          a: link.a,
          b: link.b,
          score: link.score,
          isContra: isContradiction
        });
        var threadKind = isContradiction ? 'thread-contra' : 'thread-sim';
        abyssObjects.push({
          kind: threadKind,
          dotA: dotA,
          dotB: dotB,
          score: link.score,
          emergeAt: ABYSS_EMERGE.threads,
          pulsePos: 0,
          pulseDir: 1,
          pulseSpeed: isContradiction
            ? 0.0003 + Math.random() * 0.0004
            : 0.0006 + link.score * 0.0012,
          pulseCooldown: Math.random() * 4000
        });
      }
    } catch (wErr) {
      console.warn('[Abyss] watcher threads:', wErr && wErr.message ? wErr.message : wErr);
    }
  }

  return { strongLinks: strongLinks };
}

function abyssGetThreadFrom(node, excludeNode) {
  var candidates = [];
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind !== 'thread-sim' && obj.kind !== 'thread-contra') continue;
    if ((obj.currentAlpha || 0) < 0.02) continue;
    var isA = obj.dotA.id === node.id;
    var isB = obj.dotB.id === node.id;
    if (!isA && !isB) continue;
    var other = isA ? obj.dotB : obj.dotA;
    if (excludeNode && other.id === excludeNode.id) continue;
    candidates.push(obj);
  }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function abyssHash(str) {
  // Simple deterministic hash for stable positioning
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function abyssTick() {
  if (!abyssRunning || !abyssCtx) return;
  abyssAnimFrame = requestAnimationFrame(abyssTick);
  try {
    var now = performance.now();
    if (now - abyssLastFrame < ABYSS_FRAME_MS) return;
    abyssLastFrame = now;

    var elapsed = Date.now() - abyssEnterTime;
    abyssUpdate(elapsed);      // move everything
    abyssCtx.fillStyle = '#000000';
    abyssCtx.fillRect(0, 0, abyssW, abyssH);
    abyssDraw(elapsed);        // paint everything
  } catch (err) {
    console.error('[Abyss] tick', err);
  }
}

/* ── Physics & motion ── */
function abyssUpdate(elapsed) {
  var forceFromTouch = { x: 0, y: 0 };
  if (abyssTouchX > -9998) {
    // touch active – compute repulsion / attraction
    forceFromTouch.x = abyssTouchX;
    forceFromTouch.y = abyssTouchY;
  }

  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind !== 'disc-dot' && obj.kind !== 'sanctuary-presence') continue;

    var driftScale = 0.04;
    if (obj.kind === 'sanctuary-presence') {
      driftScale = obj.brownianScale || 0.012;
    } else {
      driftScale = (obj.dna && obj.dna.driftScale) ? obj.dna.driftScale : 0.04;
    }
    var brownX = (Math.random() - 0.5) * driftScale;
    var brownY = (Math.random() - 0.5) * driftScale;
    obj.vx = (obj.vx || 0) + brownX;
    obj.vy = (obj.vy || 0) + brownY;

    obj.vx *= 0.985;
    obj.vy *= 0.985;

    if (obj.kind === 'disc-dot' && forceFromTouch.x) {
      var dx = (obj.x * abyssW) - forceFromTouch.x;
      var dy = (obj.y * abyssH) - forceFromTouch.y;
      var dist = Math.sqrt(dx * dx + dy * dy) + 1; // avoid div 0
      var strength = 4000 / (dist * dist);           // actually felt now
      var pushX = (dx / dist) * strength;
      var pushY = (dy / dist) * strength;
      obj.vx += pushX * 1.0;
      obj.vy += pushY * 1.0;
    }

    // Clamp velocity
    var speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
   if (speed > 2.0) { obj.vx *= 2.0 / speed; obj.vy *= 2.0 / speed; }

    obj.x += obj.vx / abyssW;
    obj.y += obj.vy / abyssH;

    // Soft boundaries – keep inside the inner 85% of canvas
    obj.x = Math.min(0.92, Math.max(0.08, obj.x));
    obj.y = Math.min(0.92, Math.max(0.08, obj.y));
  }
  
// ── Deep map cluster orbit ──
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind !== 'cluster-dot') continue;
    var parent = obj.parentDot;
    if (!parent) continue;
    obj.orbitAngle += obj.orbitSpeed;
    obj.x = parent.x + Math.cos(obj.orbitAngle) * obj.orbitRadius;
    obj.y = parent.y + Math.sin(obj.orbitAngle) * obj.orbitRadius;
    
    // Touch: approach if recent
    if (abyssTouchX > -9998 && obj.isRecent) {
      var cdx = (obj.x * abyssW) - abyssTouchX;
      var cdy = (obj.y * abyssH) - abyssTouchY;
      var cdist = Math.sqrt(cdx * cdx + cdy * cdy) + 1;
      var cpull = 600 / (cdist * cdist);
      obj.x -= (cdx / cdist) * cpull / abyssW;
      obj.y -= (cdy / cdist) * cpull / abyssH;
    }
  }
  
  // ── Similarity / contradiction drift ──
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind === 'thread-sim') {
      // pull dots gently toward each other
      var a = obj.dotA, b = obj.dotB;
      var dx2 = (b.x - a.x) * abyssW;
      var dy2 = (b.y - a.y) * abyssH;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
      var pull = obj.score * 0.00015;  // very soft
      a.vx += (dx2 / dist2) * pull;
      a.vy += (dy2 / dist2) * pull;
      b.vx -= (dx2 / dist2) * pull;
      b.vy -= (dy2 / dist2) * pull;
    } else if (obj.kind === 'thread-contra') {
      // push dots apart slowly
      var a = obj.dotA, b = obj.dotB;
      var dx2 = (b.x - a.x) * abyssW;
      var dy2 = (b.y - a.y) * abyssH;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
      var push = 0.00008;
      a.vx -= (dx2 / dist2) * push;
      a.vy -= (dy2 / dist2) * push;
      b.vx += (dx2 / dist2) * push;
      b.vy += (dy2 / dist2) * push;
    }
  }
  // ── Background sparks ──
  var nowMs = performance.now();
  for (var s = 0; s < abyssSparks.length; s++) {
    var sp = abyssSparks[s];
    if (sp.life > 0) {
      sp.life -= 16.67;  // one frame at ~60fps reference
      if (sp.life < 0) sp.life = 0;
    } else {
      sp.cooldown -= 16.67;
      if (sp.cooldown <= 0) {
        sp.life = sp.maxLife;
        sp.cooldown = 300 + Math.random() * 4000;
        sp.x = Math.random();
        sp.y = Math.random();
      }
    }
  }

    // ── Thread alpha breathing (birth and death) ──
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind !== 'thread-sim' && obj.kind !== 'thread-contra') continue;
    if (!obj.threadId) obj.threadId = obj.dotA.id + '_' + obj.dotB.id;
    if (!obj.targetAlpha) obj.targetAlpha = 0.08 + Math.random() * 0.15;
    if (!obj.currentAlpha) obj.currentAlpha = 0;
    if (!obj.alphaSpeed) obj.alphaSpeed = 0.0003 + Math.random() * 0.0005;
    if (!obj.dormantTimer) obj.dormantTimer = 8000 + Math.random() * 20000;
    obj.dormantTimer -= 16.67;
    if (obj.dormantTimer <= 0) {
      // Flip between visible and dormant
      obj.targetAlpha = obj.targetAlpha > 0.02
        ? 0
        : 0.06 + Math.random() * 0.18;
      obj.dormantTimer = 6000 + Math.random() * 18000;
    }
    // Lerp toward target
    obj.currentAlpha += (obj.targetAlpha - obj.currentAlpha) * obj.alphaSpeed * 16.67;
  }

  // ── Neural signals ──
  var nowMs2 = performance.now();
  // Age and remove dead signals
  for (var si = abyssNeuralSignals.length - 1; si >= 0; si--) {
    var sig = abyssNeuralSignals[si];
    sig.pos += sig.speed;
    if (sig.pos >= 1.0) {
      // Arrived at target -- maybe cascade
      if (sig.depth < NEURAL_CASCADE_DEPTH && Math.random() < 0.55) {
        // Find another thread from target node
        var nextThread = abyssGetThreadFrom(sig.toNode, sig.fromNode);
        if (nextThread) {
          abyssNeuralSignals.push({
            thread: nextThread,
            fromNode: sig.toNode,
            toNode: nextThread.dotA.id === sig.toNode.id ? nextThread.dotB : nextThread.dotA,
            pos: 0,
            speed: 0.008 + Math.random() * 0.012,
            depth: sig.depth + 1,
            contra: nextThread.kind === 'thread-contra',
            life: 1.0,
            arc: (Math.random() - 0.5) * 0.4  // slight arc offset
          });
        }
      }
      // Flash arrival node
      sig.toNode._flashLife = 400;
      abyssNeuralSignals.splice(si, 1);
    } else {
      sig.life = Math.min(1.0, sig.life);
    }
  }

  // Spawn new signals periodically
  if (nowMs2 - abyssLastSignalTime > NEURAL_SIGNAL_INTERVAL
      && abyssNeuralSignals.length < NEURAL_MAX_SIGNALS) {
    var threads = [];
    for (var i = 0; i < abyssObjects.length; i++) {
      if (abyssObjects[i].kind === 'thread-sim' || abyssObjects[i].kind === 'thread-contra') {
        if ((abyssObjects[i].currentAlpha || 0) > 0.02) threads.push(abyssObjects[i]);
      }
    }
    if (threads.length > 0) {
      var t = threads[Math.floor(Math.random() * threads.length)];
      var fromNode = Math.random() < 0.5 ? t.dotA : t.dotB;
      var toNode = fromNode === t.dotA ? t.dotB : t.dotA;
      abyssNeuralSignals.push({
        thread: t,
        fromNode: fromNode,
        toNode: toNode,
        pos: 0,
        speed: 0.007 + Math.random() * 0.01,
        depth: 0,
        contra: t.kind === 'thread-contra',
        life: 1.0,
        arc: (Math.random() - 0.5) * 0.35
      });
      abyssLastSignalTime = nowMs2;
      // Touch nearby: fire extra burst
      if (abyssTouchX > -9998) {
        var tdx = (fromNode.x * abyssW) - abyssTouchX;
        var tdy = (fromNode.y * abyssH) - abyssTouchY;
        if (Math.sqrt(tdx*tdx + tdy*tdy) < 180) {
          abyssLastSignalTime -= NEURAL_SIGNAL_INTERVAL * 0.7; // fire sooner
        }
      }
    }
  }

  // Node flash decay
  for (var i = 0; i < abyssObjects.length; i++) {
    if (abyssObjects[i]._flashLife > 0) {
      abyssObjects[i]._flashLife -= 16.67;
    }
  }

  // ── Spontaneous dot firing (kept for touch feel) ──
  abyssFiringTimer -= 16.67;
  if (abyssFiringTimer <= 0) {
    var discDots = [];
    for (var i = 0; i < abyssObjects.length; i++) {
      if (abyssObjects[i].kind === 'disc-dot') discDots.push(abyssObjects[i]);
    }
    if (discDots.length > 0) {
      var chosenDot = discDots[Math.floor(Math.random() * discDots.length)];
      if (abyssTouchX > -9998) {
        var nearby = discDots.filter(function(dot) {
          var dx = (dot.x * abyssW) - abyssTouchX;
          var dy = (dot.y * abyssH) - abyssTouchY;
          return Math.sqrt(dx*dx + dy*dy) < 150;
        });
        if (nearby.length) chosenDot = nearby[Math.floor(Math.random() * nearby.length)];
      }
      abyssFiringDot = { dot: chosenDot, life: 800 };
    }
    abyssFiringTimer = 8000 + Math.random() * 20000; // more frequent now
  }
  if (abyssFiringDot) {
    abyssFiringDot.life -= 16.67;
    if (abyssFiringDot.life <= 0) abyssFiringDot = null;
  }

    // ── Touch ripple decay ──
  for (var ri = abyssTouchRipples.length - 1; ri >= 0; ri--) {
    abyssTouchRipples[ri].life -= 16.67;
    if (abyssTouchRipples[ri].life <= 0) abyssTouchRipples.splice(ri, 1);
  }
}

/* ── Rendering (unchanged logic, just lifted out) ── */
function abyssDraw(elapsed) {
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    var emergeElapsed = elapsed - obj.emergeAt;
    if (emergeElapsed < 0) continue;
    var emergeT = abyssEased(Math.min(emergeElapsed / 2000, 1));
    if (emergeT <= 0) continue;

    var cx = obj.x * abyssW;
    var cy = obj.y * abyssH;

    if (obj.kind === 'anchor-old') {
      var alpha = emergeT * 0.18;
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 18, 0, Math.PI * 2);
      abyssCtx.strokeStyle = 'rgba(180,160,100,' + alpha + ')';
      abyssCtx.lineWidth = 0.5;
      abyssCtx.stroke();

    } else if (obj.kind === 'anchor-new') {
      var newFade = Math.max(0, 1 - (elapsed - ABYSS_EMERGE.anchors) / 60000);
      var alpha2 = emergeT * newFade * 0.7;
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      abyssCtx.fillStyle = 'rgba(220,190,110,' + alpha2 + ')';
      abyssCtx.fill();

        } else if (obj.kind === 'disc-dot') {
      var dna = obj.dna || {};
      var r;
      var g;
      var b;
      if (dna.dominantTone === 'escalating') {
        r = 230; g = 140; b = 70;
      } else if (dna.dominantTone === 'resolving') {
        r = 160; g = 200; b = 180;
      } else if (dna.dominantTone === 'charged') {
        r = 200; g = 160; b = 210;
      } else {
        r = Math.round(210 - obj.age * 70);
        g = Math.round(155 - obj.age * 25);
        b = Math.round(75 + obj.age * 80);
      }
      var dep = (dna.depersonalLabel || '').toLowerCase();
      if (dep.indexOf('dissolv') !== -1 || dep.indexOf('detach') !== -1) {
        r = Math.round(r * 0.85 + 120 * 0.15);
        g = Math.round(g * 0.85 + 175 * 0.15);
        b = Math.round(b * 0.85 + 200 * 0.15);
      }
      var dotAlpha = emergeT * (0.12 + obj.age * 0.55);
      if (dna.silenceRatio > 0.1) dotAlpha *= 0.75;
      if (abyssActiveTint && abyssDotMatchesActiveTint(dna)) {
        var tr = abyssTintRgb(abyssActiveTint.tint);
        r = Math.round(r * 0.45 + tr.r * 0.55);
        g = Math.round(g * 0.45 + tr.g * 0.55);
        b = Math.round(b * 0.45 + tr.b * 0.55);
        dotAlpha = Math.min(1, dotAlpha * 1.35);
      }
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      abyssCtx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + dotAlpha + ')';
      abyssCtx.fill();
      if (abyssActiveTint && abyssDotMatchesActiveTint(dna)) {
        var ringA = emergeT * 0.42;
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 5, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + ringA + ')';
        abyssCtx.lineWidth = 0.8;
        abyssCtx.stroke();
      }
      if (dna.paradox >= 3) {
        var pAlpha = emergeT * 0.18 * Math.min(1, dna.paradox / 6);
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + pAlpha + ')';
        abyssCtx.lineWidth = 0.5;
        abyssCtx.stroke();
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 7, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (pAlpha * 0.4) + ')';
        abyssCtx.lineWidth = 0.3;
        abyssCtx.stroke();
      }
      if (abyssSelectedNode && abyssSelectedNode.id === obj.id) {
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 6, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.35)';
        abyssCtx.lineWidth = 1;
        abyssCtx.stroke();
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 10, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.12)';
        abyssCtx.lineWidth = 0.5;
        abyssCtx.stroke();
      }

    } else if (obj.kind === 'sanctuary-presence') {
      var sAlpha = emergeT * (0.08 + obj.age * 0.28);
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 1.2, 0, Math.PI * 2);
      abyssCtx.fillStyle = 'rgba(78,200,138,' + sAlpha + ')';
      abyssCtx.fill();
      var sPulse = 0.5 + Math.sin(performance.now() * 0.0003 + obj.x * 6) * 0.5;
      var sRingAlpha = sAlpha * 0.3 * sPulse;
      if (sRingAlpha > 0.01) {
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 4 + sPulse * 2, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(78,200,138,' + sRingAlpha + ')';
        abyssCtx.lineWidth = 0.4;
        abyssCtx.stroke();
      }
      if (abyssSelectedNode && abyssSelectedNode.id === obj.id) {
        abyssCtx.beginPath();
        abyssCtx.arc(cx, cy, 5, 0, Math.PI * 2);
        abyssCtx.strokeStyle = 'rgba(78,200,138,0.35)';
        abyssCtx.lineWidth = 0.8;
        abyssCtx.stroke();
      }

    } else if (obj.kind === 'cluster-dot') {
      var clAlpha = emergeT * 0.35;
      if (clAlpha < 0.02) continue;
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 0.7, 0, Math.PI * 2);
      abyssCtx.fillStyle = 'rgba(200,180,120,' + clAlpha + ')';
      abyssCtx.fill();
   } else if (obj.kind === 'guardian-node') {
      var nodeAlpha = emergeT * obj.baseOpacity;
      if (nodeAlpha < 0.03) continue;

      // Inner quiet dot
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      abyssCtx.fillStyle = 'rgba(195,175,145,' + nodeAlpha + ')';
      abyssCtx.fill();

      // Rotating ring – fades with age
      var ringAlpha = nodeAlpha * 0.65;
      var ringRadius = 7;
      var ringArc;
      if (obj.age > 0.7) {            // ancient
        ringArc = 0.4;
      } else if (obj.age > 0.3) {     // older
        ringArc = Math.PI * (1 - obj.age);
      } else {                        // recent
        ringArc = Math.PI * 2;
      }

      var ringStart = obj.ringPhase + (performance.now() * 0.0004);  // slow turn
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, ringRadius, ringStart, ringStart + ringArc);
      abyssCtx.strokeStyle = 'rgba(195,175,145,' + ringAlpha + ')';
      abyssCtx.lineWidth = 0.6;
      abyssCtx.stroke();
           } else if (obj.kind === 'thread-sim' || obj.kind === 'thread-contra') {
      var tAlpha = emergeT * (obj.currentAlpha || 0.08);
      if (tAlpha < 0.005) continue;
      var ax = obj.dotA.x * abyssW;
      var ay = obj.dotA.y * abyssH;
      var bx = obj.dotB.x * abyssW;
      var by = obj.dotB.y * abyssH;
      // Slight curve via quadratic bezier -- midpoint offset
      var mx = (ax + bx) / 2 + (ay - by) * 0.08;
      var my = (ay + by) / 2 + (bx - ax) * 0.08;
      abyssCtx.beginPath();
      abyssCtx.moveTo(ax, ay);
      abyssCtx.quadraticCurveTo(mx, my, bx, by);
      abyssCtx.strokeStyle = obj.kind === 'thread-contra'
        ? 'rgba(138,180,210,' + tAlpha + ')'
        : 'rgba(210,155,100,' + tAlpha + ')';
      abyssCtx.lineWidth = 0.5;
      abyssCtx.stroke();
    }
  }
  // ── Background neural sparks ──
  var sparkR = 220;
  var sparkG = 210;
  var sparkB = 190;
  if (abyssWeather === 'charged') { sparkR = 240; sparkG = 180; sparkB = 120; }
  else if (abyssWeather === 'resolving') { sparkR = 140; sparkG = 190; sparkB = 220; }
  for (var s = 0; s < abyssSparks.length; s++) {
    var sp = abyssSparks[s];
    if (sp.life <= 0) continue;
    var sparkAlpha = (sp.life / sp.maxLife) * sp.opacity;
    if (sparkAlpha < 0.005) continue;
    abyssCtx.beginPath();
    abyssCtx.arc(sp.x * abyssW, sp.y * abyssH, 0.6, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(' + sparkR + ',' + sparkG + ',' + sparkB + ',' + sparkAlpha + ')';
    abyssCtx.fill();
  }
    // ── Touch ripples -- cosmic membrane ──
  for (var ri = 0; ri < abyssTouchRipples.length; ri++) {
    var rp = abyssTouchRipples[ri];
    if (rp.life <= 0) continue;
    var rProgress = 1 - (rp.life / rp.maxLife);   // 0 = just born, 1 = dying
    var rRadius = rp.startRadius + rProgress * rp.expandTo;
    var rAlpha = (1 - rProgress) * rp.peakAlpha;
    if (rAlpha < 0.004) continue;

    abyssCtx.beginPath();
    abyssCtx.arc(rp.x, rp.y, rRadius, 0, Math.PI * 2);

    // Each ring has a slightly different hue shift -- cold outer, warm inner
    var rr = rp.cold ? 140 : 210;
    var rg = rp.cold ? 180 : 155;
    var rb = rp.cold ? 220 : 100;
    abyssCtx.strokeStyle = 'rgba(' + rr + ',' + rg + ',' + rb + ',' + rAlpha + ')';
    abyssCtx.lineWidth = rp.lineWidth * (1 - rProgress * 0.6);
    abyssCtx.stroke();
  }

  // ── Center flash on fresh touch ──
  for (var ri = 0; ri < abyssTouchRipples.length; ri++) {
    var rp = abyssTouchRipples[ri];
    if (!rp.isFirst) continue;
    var flashLife = rp.life / rp.maxLife;
    if (flashLife < 0.7) continue;
    var flashAlpha = (flashLife - 0.7) / 0.3 * 0.5;
    var flashRadius = (1 - flashLife) * 12;
    abyssCtx.beginPath();
    abyssCtx.arc(rp.x, rp.y, flashRadius, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(220,200,160,' + flashAlpha + ')';
    abyssCtx.fill();
  }

    // ── Neural signals ──
  for (var si = 0; si < abyssNeuralSignals.length; si++) {
    var sig = abyssNeuralSignals[si];
    var t = sig.pos;
    var ax = sig.fromNode.x * abyssW;
    var ay = sig.fromNode.y * abyssH;
    var bx = sig.toNode.x * abyssW;
    var by = sig.toNode.y * abyssH;
    // Arc control point -- perpendicular offset for organic curve
    var mx = (ax + bx) / 2 + (ay - by) * sig.arc;
    var my = (ay + by) / 2 + (bx - ax) * sig.arc;
    // Quadratic bezier point at t
    var px = (1-t)*(1-t)*ax + 2*(1-t)*t*mx + t*t*bx;
    var py = (1-t)*(1-t)*ay + 2*(1-t)*t*my + t*t*by;

    var sigColor = sig.contra
      ? 'rgba(138,180,210,'
      : 'rgba(240,180,100,';

    // Trail -- draw fading segments behind signal
    var trailSteps = 6;
    for (var tr = trailSteps; tr >= 0; tr--) {
      var tBack = Math.max(0, t - tr * 0.025);
      var trx = (1-tBack)*(1-tBack)*ax + 2*(1-tBack)*tBack*mx + tBack*tBack*bx;
      var trY = (1-tBack)*(1-tBack)*ay + 2*(1-tBack)*tBack*my + tBack*tBack*by;
      var trAlpha = (1 - tr / trailSteps) * 0.4;
      var trRadius = 1.2 * (1 - tr / trailSteps);
      abyssCtx.beginPath();
      abyssCtx.arc(trx, trY, trRadius, 0, Math.PI * 2);
      abyssCtx.fillStyle = sigColor + trAlpha + ')';
      abyssCtx.fill();
    }

    // Signal head
    abyssCtx.beginPath();
    abyssCtx.arc(px, py, 2.2, 0, Math.PI * 2);
    abyssCtx.fillStyle = sigColor + '0.9)';
    abyssCtx.fill();
    // Glow
    abyssCtx.beginPath();
    abyssCtx.arc(px, py, 5, 0, Math.PI * 2);
    abyssCtx.fillStyle = sigColor + '0.18)';
    abyssCtx.fill();
  }

  // ── Node arrival flash ──
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (!obj._flashLife || obj._flashLife <= 0) continue;
    var fl = obj._flashLife / 400;
    var fcx = obj.x * abyssW;
    var fcy = obj.y * abyssH;
    abyssCtx.beginPath();
    abyssCtx.arc(fcx, fcy, 2 + (1 - fl) * 8, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(255,220,140,' + fl * 0.7 + ')';
    abyssCtx.fill();
    abyssCtx.beginPath();
    abyssCtx.arc(fcx, fcy, 4 + (1 - fl) * 14, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(255,220,140,' + fl * 0.15 + ')';
    abyssCtx.fill();
  }

  // ── Spontaneous dot firing ──
  if (abyssFiringDot && abyssFiringDot.life > 0) {
    var fDot = abyssFiringDot.dot;
    var fLifeRatio = abyssFiringDot.life / 800;
    var fAlpha = fLifeRatio * 0.8;
    var fRadius = 1.5 + (1 - fLifeRatio) * 7;
    abyssCtx.beginPath();
    abyssCtx.arc(fDot.x * abyssW, fDot.y * abyssH, fRadius, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(240,210,130,' + fAlpha + ')';
    abyssCtx.fill();
    abyssCtx.beginPath();
    abyssCtx.arc(fDot.x * abyssW, fDot.y * abyssH, fRadius + 3, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(240,210,130,' + fAlpha * 0.2 + ')';
    abyssCtx.fill();
  }
}

// ── ABYSS INTERACTION ────────────────────────────────────────────────────────

var abyssSelectedNode = null;

function abyssHideTooltip() {
  var tt = document.getElementById('abyss-tooltip');
  if (!tt) return;
  tt.style.display = 'none';
  tt.className = '';
}

function abyssFormatDiscTypeLabel(typeLabel) {
  var t = String(typeLabel || 'discourse').toLowerCase();
  if (t === 'note') return 'Spark Note';
  if (t === 'chronicle') return 'Chronicle';
  if (t === 'discourse') return 'Discourse';
  return typeLabel || 'Discourse';
}

function abyssGetViewAbyssRect() {
  var view = document.getElementById('view-abyss');
  if (view) return view.getBoundingClientRect();
  return {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/** Position fixed/absolute overlay in viewport coords; clamp inside #view-abyss. */
function abyssPositionOverlayEl(el, clientX, clientY, opts) {
  opts = opts || {};
  var margin = typeof opts.margin === 'number' ? opts.margin : 12;
  var edgePad = typeof opts.edgePad === 'number' ? opts.edgePad : 10;
  var navSafe = typeof opts.navSafe === 'number' ? opts.navSafe : 54;
  var offset = typeof opts.offset === 'number' ? opts.offset : 14;
  var preferBelow = !!opts.preferBelow;

  var viewRect = abyssGetViewAbyssRect();
  el.style.display = 'block';
  el.style.maxWidth = Math.min(260, Math.max(160, viewRect.width - edgePad * 2)) + 'px';
  el.style.visibility = 'hidden';
  var w = el.offsetWidth;
  var h = el.offsetHeight;
  el.style.visibility = '';

  var minX = viewRect.left + edgePad;
  var maxX = viewRect.right - edgePad - w;
  var minY = viewRect.top + navSafe;
  var maxY = viewRect.bottom - edgePad - h;

  var posX = clientX + offset;
  var posY = preferBelow ? clientY + offset : clientY - h - offset;

  if (posX + w > viewRect.right - edgePad) posX = clientX - w - offset;
  if (posY < minY) posY = clientY + offset;
  if (posY + h > viewRect.bottom - edgePad) posY = viewRect.bottom - edgePad - h;

  if (maxX < minX) posX = viewRect.left + (viewRect.width - w) / 2;
  else {
    if (posX < minX) posX = minX;
    if (posX > maxX) posX = maxX;
  }
  if (maxY < minY) posY = viewRect.top + navSafe;
  else {
    if (posY < minY) posY = minY;
    if (posY > maxY) posY = maxY;
  }

  el.style.left = Math.round(posX) + 'px';
  el.style.top = Math.round(posY) + 'px';
}

function abyssCanvasPointToClient(canvasX, canvasY) {
  var rect = abyssGetRect();
  return { x: rect.left + canvasX, y: rect.top + canvasY };
}

function abyssCloseSheet() {
  var sheet = document.getElementById('abyss-sheet');
  if (sheet) sheet.classList.remove('open');
}

function abyssShowTooltip(obj, canvasTapX, canvasTapY) {
  abyssCloseSheet();
  var tt = document.getElementById('abyss-tooltip');
  if (!tt) return;
  tt.className = '';
  var content = '';

  if (obj.kind === 'guardian-node') {
    var date = new Date(obj.logData.invoked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    var preview = (obj.logData.response_text || '').slice(0, 90).trim();
    content = '<div style="color:#8ab4cc;font-size:8px;letter-spacing:2px;font-weight:900;text-transform:uppercase;margin-bottom:5px;">&#43065; Guardian &middot; ' + date + '</div>' +
              '<div style="color:var(--muted);font-size:11px;font-family:Georgia,serif;font-style:italic;line-height:1.5;">' + escHtml(preview) + '&hellip;</div>';
  } else if (obj.kind === 'cluster-dot') {
    var parentTitle = '';
    for (var i = 0; i < abyssObjects.length; i++) {
      if (abyssObjects[i].kind === 'disc-dot' && abyssObjects[i].id === obj.parentId) {
        parentTitle = abyssObjects[i].title || 'Untitled';
        break;
      }
    }
    content = '<div style="color:var(--accent-dim);font-size:8px;letter-spacing:2px;font-weight:900;text-transform:uppercase;margin-bottom:5px;">Deep Map Fragment</div>' +
              '<div style="color:var(--muted);font-size:11px;font-family:Georgia,serif;font-style:italic;line-height:1.5;">' + escHtml((obj.summary || '').slice(0, 80)) + '&hellip;</div>' +
              (parentTitle ? '<div style="color:var(--muted);font-size:9px;margin-top:5px;opacity:0.5;">fragment of ' + escHtml(parentTitle) + '</div>' : '');
  }

  tt.innerHTML = content;
  var client = abyssCanvasPointToClient(canvasTapX, canvasTapY);
  abyssPositionOverlayEl(tt, client.x, client.y);
}

function abyssAppendDiscSheetEnter(scroll, obj) {
  var wrap = document.createElement('div');
  wrap.className = 'abyss-sheet-enter-wrap';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'abyss-sheet-enter';
  btn.textContent = 'Enter ◈';
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    void abyssEnterDiscFromSheet(obj);
  });
  wrap.appendChild(btn);
  scroll.appendChild(wrap);
}

async function abyssEnterDiscFromSheet(obj) {
  if (!obj || !obj.id) return;
  abyssCloseSheet();
  abyssHideTooltip();
  var disc = await getDiscourse(obj.id);
  if (!disc) {
    showToast('Not found ◆');
    return;
  }
  if (disc.item_type === 'note') {
    openSparkEditSheet({ id: disc.id, title: disc.title, raw_text: disc.raw_text });
    return;
  }
  await openDiscourse(obj.id);
}


function abyssShowSanctuaryTooltip(obj, canvasTapX, canvasTapY) {
  abyssCloseSheet();
  var tt = document.getElementById('abyss-tooltip');
  if (!tt) return;
  tt.className = '';

  var dateStr = '';
  if (obj.age > 0) {
    dateStr = new Date(Date.now() - (1 - obj.age) * 90 * 86400000).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  }

  tt.innerHTML =
    '<div style="color:rgba(78,200,138,0.7);font-size:8px;letter-spacing:2px;font-weight:900;text-transform:uppercase;margin-bottom:4px;">Sanctuary</div>' +
    '<div style="color:var(--text);font-size:12px;font-family:Georgia,serif;line-height:1.35;word-break:break-word;">' +
      escHtml(obj.name || 'Presence') +
    '</div>' +
    (dateStr ? '<div style="color:var(--muted);font-size:9px;margin-top:3px;opacity:0.6;">' + escHtml(dateStr) + '</div>' : '');

  var client = abyssCanvasPointToClient(canvasTapX, canvasTapY);
  abyssPositionOverlayEl(tt, client.x, client.y);
}

async function abyssOpenSheet(obj) {
  abyssHideTooltip();
  abyssCloseSheet();
  var scroll = document.getElementById('abyss-sheet-scroll');
  scroll.innerHTML = '';

  // Type badge
  var typeEl = document.createElement('div');
  typeEl.className = 'abyss-sheet-type disc';
  typeEl.textContent = abyssFormatDiscTypeLabel(obj.typeLabel).toUpperCase();
  scroll.appendChild(typeEl);

  // Title
  var titleEl = document.createElement('div');
  titleEl.className = 'abyss-sheet-title';
  titleEl.textContent = obj.title || 'Untitled';
  scroll.appendChild(titleEl);

  // Pull fast map data
  var fastMap = null;
  try { fastMap = await dbGet('guardian_summaries', obj.id); } catch(e) {}

  // Date
  if (fastMap && fastMap.generated_at) {
    var dateEl = document.createElement('div');
    dateEl.className = 'abyss-sheet-date';
    // Get discourse date from disc object
    var discDate = '';
    var allD = await dbGetAll('cosm_discourses');
    for (var i = 0; i < allD.length; i++) {
      if (allD[i].id === obj.id) {
        discDate = new Date(allD[i].created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        break;
      }
    }
    dateEl.textContent = discDate;
    scroll.appendChild(dateEl);
  }

  // Excerpt
  if (fastMap && fastMap.extractive_summary) {
    var excerptEl = document.createElement('div');
    excerptEl.className = 'abyss-sheet-excerpt';
    excerptEl.textContent = fastMap.extractive_summary.slice(0, 200);
    scroll.appendChild(excerptEl);
  } else if (fastMap && fastMap.first_line) {
    var excerptEl = document.createElement('div');
    excerptEl.className = 'abyss-sheet-excerpt';
    excerptEl.textContent = fastMap.first_line.slice(0, 160);
    scroll.appendChild(excerptEl);
  }

  // Emotional arc
  if (fastMap && fastMap.emotional_arc && fastMap.emotional_arc.direction) {
    var arcEl = document.createElement('div');
    arcEl.className = 'abyss-sheet-arc';
    arcEl.textContent = 'arc: ' + fastMap.emotional_arc.direction;
    scroll.appendChild(arcEl);
  }

  // Key terms
  if (fastMap && fastMap.key_terms && fastMap.key_terms.length) {
    var termsWrap = document.createElement('div');
    termsWrap.className = 'abyss-sheet-terms';
    fastMap.key_terms.slice(0, 6).forEach(function(t) {
      var pill = document.createElement('div');
      pill.className = 'abyss-term-pill';
      pill.textContent = t.term;
      termsWrap.appendChild(pill);
    });
    scroll.appendChild(termsWrap);
  }

  // Watcher echoes (similar)
  if (fastMap && fastMap.watcher && fastMap.watcher.top_similar && fastMap.watcher.top_similar.length) {
    var divider = document.createElement('div');
    divider.className = 'abyss-sheet-divider';
    scroll.appendChild(divider);

    var echoLabel = document.createElement('div');
    echoLabel.className = 'abyss-sheet-section-label';
    echoLabel.textContent = 'Echoes';
    scroll.appendChild(echoLabel);

    fastMap.watcher.top_similar.slice(0, 3).forEach(function(s) {
      var row = document.createElement('div');
      row.className = 'abyss-echo-row';
      var titleSpan = document.createElement('div');
      titleSpan.className = 'abyss-echo-title';
      // Find title from abyssObjects
      var t = 'Untitled';
      for (var i = 0; i < abyssObjects.length; i++) {
        if (abyssObjects[i].kind === 'disc-dot' && abyssObjects[i].id === s.id) { t = abyssObjects[i].title; break; }
      }
      titleSpan.textContent = t;
      var barWrap = document.createElement('div');
      barWrap.className = 'abyss-echo-bar-wrap';
      var barFill = document.createElement('div');
      barFill.className = 'abyss-echo-bar-fill sim';
      barFill.style.width = Math.round(s.score * 100) + '%';
      barWrap.appendChild(barFill);
      row.appendChild(titleSpan);
      row.appendChild(barWrap);
      scroll.appendChild(row);
    });
  }

  // Watcher contradictions
  if (fastMap && fastMap.watcher && fastMap.watcher.top_contradictory && fastMap.watcher.top_contradictory.length) {
    var divider2 = document.createElement('div');
    divider2.className = 'abyss-sheet-divider';
    scroll.appendChild(divider2);

    var contraLabel = document.createElement('div');
    contraLabel.className = 'abyss-sheet-section-label';
    contraLabel.textContent = 'In Tension With';
    scroll.appendChild(contraLabel);

    fastMap.watcher.top_contradictory.slice(0, 3).forEach(function(s) {
      var row = document.createElement('div');
      row.className = 'abyss-echo-row';
      var titleSpan = document.createElement('div');
      titleSpan.className = 'abyss-echo-title';
      titleSpan.style.color = '#8ab4cc';
      var t = 'Untitled';
      for (var i = 0; i < abyssObjects.length; i++) {
        if (abyssObjects[i].kind === 'disc-dot' && abyssObjects[i].id === s.id) { t = abyssObjects[i].title; break; }
      }
      titleSpan.textContent = t;
      var barWrap = document.createElement('div');
      barWrap.className = 'abyss-echo-bar-wrap';
      var barFill = document.createElement('div');
      barFill.className = 'abyss-echo-bar-fill contra';
      barFill.style.width = Math.round(s.score * 100) + '%';
      barWrap.appendChild(barFill);
      row.appendChild(titleSpan);
      row.appendChild(barWrap);
      scroll.appendChild(row);
    });
  }

  abyssAppendDiscSheetEnter(scroll, obj);
  document.getElementById('abyss-sheet').classList.add('open');
}

async function abyssOpenThreadSheet(obj) {
  abyssCloseSheet();
  var scroll = document.getElementById('abyss-sheet-scroll');
  scroll.innerHTML = '';
  var isContra = obj.kind === 'thread-contra';

  // Type badge
  var typeEl = document.createElement('div');
  typeEl.className = 'abyss-sheet-type ' + (isContra ? 'contra' : 'sim');
  typeEl.textContent = isContra ? 'In Tension' : 'In Resonance';
  scroll.appendChild(typeEl);

  // Description
  var descEl = document.createElement('div');
  descEl.className = 'abyss-sheet-excerpt';
  descEl.style.marginBottom = '16px';
  descEl.textContent = isContra
    ? 'These two thoughts pull against each other.'
    : 'These two thoughts orbit the same space.';
  scroll.appendChild(descEl);

  // The two nodes
  var pair = document.createElement('div');
  pair.className = 'abyss-thread-pair';

  function makeNode(dotObj, label) {
    var wrap = document.createElement('div');
    wrap.className = 'abyss-thread-node';
    if (isContra) wrap.style.borderColor = '#1a2530';
    var labelEl = document.createElement('div');
    labelEl.className = 'abyss-thread-node-label';
    labelEl.textContent = label;
    var titleEl = document.createElement('div');
    titleEl.className = 'abyss-thread-node-title';
    titleEl.textContent = dotObj.title || 'Untitled';
    wrap.appendChild(labelEl);
    wrap.appendChild(titleEl);
    return wrap;
  }

  var connector = document.createElement('div');
  connector.className = 'abyss-thread-connector ' + (isContra ? 'contra' : 'sim');
  connector.textContent = isContra ? '--- tension ---' : '--- echo ---';

  pair.appendChild(makeNode(obj.dotA, 'Thought'));
  pair.appendChild(connector);
  pair.appendChild(makeNode(obj.dotB, 'Thought'));
  scroll.appendChild(pair);

  // Score bar
  var scoreWrap = document.createElement('div');
  scoreWrap.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:4px;';
  var scoreLabel = document.createElement('div');
  scoreLabel.className = 'abyss-sheet-section-label';
  scoreLabel.style.margin = '0';
  scoreLabel.textContent = isContra ? 'Tension strength' : 'Resonance strength';
  var barWrap = document.createElement('div');
  barWrap.className = 'abyss-echo-bar-wrap';
  barWrap.style.width = '80px';
  var barFill = document.createElement('div');
  barFill.className = 'abyss-echo-bar-fill ' + (isContra ? 'contra' : 'sim');
  barFill.style.width = Math.round((obj.score || 0.5) * 100) + '%';
  barWrap.appendChild(barFill);
  scoreWrap.appendChild(scoreLabel);
  scoreWrap.appendChild(barWrap);
  scroll.appendChild(scoreWrap);

  // Shared key terms if both have fast maps
  try {
    var mapA = await dbGet('guardian_summaries', obj.dotA.id);
    var mapB = await dbGet('guardian_summaries', obj.dotB.id);
    if (mapA && mapB && mapA.key_terms && mapB.key_terms) {
      var termsA = mapA.key_terms.map(function(t) { return t.term; });
      var termsB = mapB.key_terms.map(function(t) { return t.term; });
      var shared = termsA.filter(function(t) { return termsB.indexOf(t) >= 0; });
      if (shared.length) {
        var divider = document.createElement('div');
        divider.className = 'abyss-sheet-divider';
        scroll.appendChild(divider);
        var sharedLabel = document.createElement('div');
        sharedLabel.className = 'abyss-sheet-section-label';
        sharedLabel.textContent = 'Shared territory';
        scroll.appendChild(sharedLabel);
        var termsWrap = document.createElement('div');
        termsWrap.className = 'abyss-sheet-terms';
        shared.slice(0, 5).forEach(function(term) {
          var pill = document.createElement('div');
          pill.className = 'abyss-term-pill';
          pill.style.borderColor = isContra ? '#1a2530' : '#2a2218';
          pill.textContent = term;
          termsWrap.appendChild(pill);
        });
        scroll.appendChild(termsWrap);
      }
    }
  } catch(e) {}

  document.getElementById('abyss-sheet').classList.add('open');
}

function abyssResize() {
  if (!abyssCanvas) return;
  var w = abyssCanvas.clientWidth || abyssCanvas.offsetWidth;
  var h = abyssCanvas.clientHeight || abyssCanvas.offsetHeight;
  if (!w || !h) {
    var host = document.getElementById('view-abyss');
    if (host) {
      var br = host.getBoundingClientRect();
      w = Math.max(1, Math.floor(br.width));
      h = Math.max(1, Math.floor(br.height - 48));
    }
  }
  abyssW = Math.max(1, w | 0);
  abyssH = Math.max(1, h | 0);
  abyssCanvas.width = abyssW;
  abyssCanvas.height = abyssH;
}

function abyssGetRect() {
  return abyssCanvas ? abyssCanvas.getBoundingClientRect() : { left: 0, top: 0 };
}

function abyssStop() {
  abyssRunning = false;
  if (abyssAnimFrame) { cancelAnimationFrame(abyssAnimFrame); abyssAnimFrame = null; }
  if (window.__nqAbyssRO) {
    try { window.__nqAbyssRO.disconnect(); } catch (roErr) {}
  }
}

var abyssTouchStartX = -9999;
var abyssTouchStartY = -9999;
var abyssMouseTracking = false;

function abyssBeginPress(clientX, clientY) {
  var rect = abyssGetRect();
  abyssTouchX = clientX - rect.left;
  abyssTouchY = clientY - rect.top;
  abyssTouchStartX = abyssTouchX;
  abyssTouchStartY = abyssTouchY;
  var rx = abyssTouchX;
  var ry = abyssTouchY;
  var ringDefs = [
    { delay: 0,   maxLife: 700,  expandTo: 55,  startRadius: 2,  peakAlpha: 0.45, lineWidth: 1.2, cold: false, isFirst: true  },
    { delay: 60,  maxLife: 900,  expandTo: 90,  startRadius: 1,  peakAlpha: 0.18, lineWidth: 0.7, cold: false, isFirst: false },
    { delay: 120, maxLife: 1200, expandTo: 140, startRadius: 0,  peakAlpha: 0.10, lineWidth: 0.5, cold: true,  isFirst: false },
    { delay: 200, maxLife: 1600, expandTo: 200, startRadius: 0,  peakAlpha: 0.06, lineWidth: 0.4, cold: true,  isFirst: false },
  ];
  ringDefs.forEach(function(def) {
    setTimeout(function() {
      if (!abyssRunning) return;
      abyssTouchRipples.push({
        x: rx, y: ry,
        life: def.maxLife,
        maxLife: def.maxLife,
        expandTo: def.expandTo,
        startRadius: def.startRadius,
        peakAlpha: def.peakAlpha,
        lineWidth: def.lineWidth,
        cold: def.cold,
        isFirst: def.isFirst
      });
    }, def.delay);
  });
}

function abyssTouchStart(e) {
  e.preventDefault();
  if (!e.touches || !e.touches[0]) return;
  var t = e.touches[0];
  abyssBeginPress(t.clientX, t.clientY);
}

function abyssTouchMove(e) {
  e.preventDefault();
  if (!e.touches || !e.touches[0]) return;
  var t = e.touches[0];
  var rect = abyssGetRect();
  abyssTouchX = t.clientX - rect.left;
  abyssTouchY = t.clientY - rect.top;
}

function abyssMouseMoveWin(e) {
  if (!abyssMouseTracking) return;
  var rect = abyssGetRect();
  abyssTouchX = e.clientX - rect.left;
  abyssTouchY = e.clientY - rect.top;
}

function abyssMouseUpWin() {
  if (!abyssMouseTracking) return;
  abyssMouseTracking = false;
  window.removeEventListener('mousemove', abyssMouseMoveWin);
  window.removeEventListener('mouseup', abyssMouseUpWin);
  abyssTouchEndCore();
}

function abyssMouseDown(e) {
  if (!abyssCanvas || e.button !== 0) return;
  e.preventDefault();
  abyssMouseTracking = true;
  abyssBeginPress(e.clientX, e.clientY);
  window.addEventListener('mousemove', abyssMouseMoveWin);
  window.addEventListener('mouseup', abyssMouseUpWin);
}

function abyssTouchEnd(e) {
  e.preventDefault();
  abyssTouchEndCore();
}

function abyssTouchEndCore() {
  var tapX = abyssTouchStartX;
  var tapY = abyssTouchStartY;
  var movedX = Math.abs(abyssTouchX - tapX);
  var movedY = Math.abs(abyssTouchY - tapY);
  abyssTouchX = -9999;
  abyssTouchY = -9999;
  abyssTouchStartX = -9999;
  abyssTouchStartY = -9999;

  if (movedX > 10 || movedY > 10) return;

  abyssHideTooltip();

  var closest = null;
  var minD = 34;
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind !== 'disc-dot' && obj.kind !== 'guardian-node' && obj.kind !== 'cluster-dot' && obj.kind !== 'sanctuary-presence') continue;
    var nx = obj.x * abyssW;
    var ny = obj.y * abyssH;
    var dist = Math.sqrt((tapX - nx) * (tapX - nx) + (tapY - ny) * (tapY - ny));
    if (dist < minD) { minD = dist; closest = obj; }
  }
  if (closest) {
    if (closest.kind === 'disc-dot') {
      void abyssOpenSheet(closest);
    } else if (closest.kind === 'sanctuary-presence') {
      abyssShowSanctuaryTooltip(closest, tapX, tapY);
    } else if (closest.kind === 'guardian-node') {
      abyssShowTooltip(closest, tapX, tapY);
    } else if (closest.kind === 'cluster-dot') {
      abyssShowTooltip(closest, tapX, tapY);
    }
    abyssSelectedNode = closest;
    return;
  }

  var closestThread = null;
  var minThreadD = 18;
  for (var j = 0; j < abyssObjects.length; j++) {
    var obj2 = abyssObjects[j];
    if (obj2.kind !== 'thread-sim' && obj2.kind !== 'thread-contra') continue;
    var ax = obj2.dotA.x * abyssW, ay = obj2.dotA.y * abyssH;
    var bx = obj2.dotB.x * abyssW, by = obj2.dotB.y * abyssH;
    var dx = bx - ax, dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    var tt = lenSq > 0 ? Math.max(0, Math.min(1, ((tapX - ax) * dx + (tapY - ay) * dy) / lenSq)) : 0;
    var px = ax + tt * dx - tapX;
    var py = ay + tt * dy - tapY;
    var d = Math.sqrt(px * px + py * py);
    if (d < minThreadD) { minThreadD = d; closestThread = obj2; }
  }
  if (closestThread) {
    abyssOpenThreadSheet(closestThread);
    abyssSelectedNode = null;
    return;
  }

  abyssHideTooltip();
  abyssCloseSheet();
  abyssSelectedNode = null;
}

async function openAbyssView() {
  closeOverlay();
  if (typeof closeSparkEditSheet === 'function') closeSparkEditSheet();
  showPanel('view-abyss');
  abyssStop();
  abyssCanvas = document.getElementById('abyss-canvas');
  if (!abyssCanvas) {
    console.error('[Abyss] #abyss-canvas missing from DOM');
    return;
  }
  abyssCtx = abyssCanvas.getContext('2d');
  if (!abyssCtx) {
    console.error('[Abyss] Canvas 2D context unavailable');
    return;
  }
  // Wait for panel transition to settle before reading dimensions
    await new Promise(r => setTimeout(r, 120));
  abyssResize();
  // Poll until canvas has real dimensions -- handles post-unlock paint delay
  if (!abyssW || !abyssH) {
    await new Promise(r => {
      let attempts = 0;
      const poll = () => {
        abyssResize();
        if (abyssW && abyssH) { r(); return; }
        if (++attempts > 20) { r(); return; } // give up after ~1s
        setTimeout(poll, 50);
      };
      poll();
    });
  }
  // Remove old listeners before adding fresh ones
abyssCanvas.removeEventListener('touchstart', abyssTouchStart);
abyssCanvas.removeEventListener('touchmove',  abyssTouchMove);
abyssCanvas.removeEventListener('touchend',   abyssTouchEnd);
abyssCanvas.removeEventListener('touchcancel',abyssTouchEnd);
abyssCanvas.removeEventListener('mousedown', abyssMouseDown);
  window.removeEventListener('resize', abyssResize);
  window.removeEventListener('mousemove', abyssMouseMoveWin);
  window.removeEventListener('mouseup', abyssMouseUpWin);
  abyssMouseTracking = false;
abyssCanvas.addEventListener('touchstart',  abyssTouchStart,  { passive: false });
abyssCanvas.addEventListener('touchmove',   abyssTouchMove,   { passive: false });
abyssCanvas.addEventListener('touchend',    abyssTouchEnd,    { passive: false });
abyssCanvas.addEventListener('touchcancel', abyssTouchEnd);
abyssCanvas.addEventListener('mousedown', abyssMouseDown);
  window.addEventListener('resize', abyssResize);
  requestAnimationFrame(function() { abyssResize(); });

  abyssRunning = true;
  var abyssBuild = { strongLinks: [] };
  try {
    abyssBuild = await buildAbyssObjects();
    if (!abyssBuild) abyssBuild = { strongLinks: [] };
  } catch (e) {
    console.warn('Abyss build partial:', e.message);
  }
  var settleIters = 200;
  var discCount = 0;
  for (var sci = 0; sci < abyssObjects.length; sci++) {
    if (abyssObjects[sci].kind === 'disc-dot') discCount++;
  }
  if (discCount > 80) settleIters = 100;
  try {
    await abyssSettle(settleIters, abyssBuild.strongLinks || []);
  } catch (settleErr) {
    console.warn('[Abyss] settle:', settleErr && settleErr.message ? settleErr.message : settleErr);
  }
  await refreshAbyssActiveTint();
  abyssEnterTime = Date.now();
  // Seed background neural noise
  abyssSparks = [];
  for (var s = 0; s < 40; s++) {
    var smax = 80 + Math.random() * 400;
    abyssSparks.push({
      x: Math.random(),
      y: Math.random(),
      life: 30 + Math.random() * (smax * 0.5),
      maxLife: smax,
      cooldown: 0,
      opacity: 0.02 + Math.random() * 0.04
    });
  }
  abyssPulses = [];
  abyssFiringDot = null;
  abyssFiringTimer = 30000 + Math.random() * 60000; // first fire in 30-90s
  abyssLastFrame = 0;
  if (typeof ResizeObserver !== 'undefined') {
    if (!window.__nqAbyssRO) {
      window.__nqAbyssRO = new ResizeObserver(function() {
        if (currentView !== 'abyss' || !abyssRunning || !abyssCanvas) return;
        abyssResize();
      });
    } else {
      try { window.__nqAbyssRO.disconnect(); } catch (e2) {}
    }
    var vab = document.getElementById('view-abyss');
    if (vab) window.__nqAbyssRO.observe(vab);
  }
  abyssTick();
}

function normalizeAbyssTintDirective(directiveRoot) {
  if (!directiveRoot || !directiveRoot.abyss_tint) return null;
  var t = directiveRoot.abyss_tint;
  var terms = Array.isArray(t.terms) ? t.terms.map(function (x) { return String(x).toLowerCase().trim(); }).filter(Boolean) : [];
  if (!terms.length) return null;
  var appliedAt = typeof t.applied_at === 'number' ? t.applied_at : Date.now();
  var hours = typeof t.duration_hours === 'number' ? t.duration_hours : 24;
  return {
    terms: terms,
    tint: t.tint === 'urgent' ? 'urgent' : 'amber',
    applied_at: appliedAt,
    expires_at: appliedAt + hours * 3600000
  };
}

async function refreshAbyssActiveTint() {
  abyssActiveTint = null;
  try {
    var logs = await dbGetAll('guardian_logs');
    var sorted = logs.slice().sort(function (a, b) { return (b.invoked_at || 0) - (a.invoked_at || 0); });
    var now = Date.now();
    for (var i = 0; i < sorted.length; i++) {
      var dir = parseGuardianDirectiveRaw(sorted[i].directive);
      var tint = normalizeAbyssTintDirective(dir);
      if (tint && now < tint.expires_at) {
        abyssActiveTint = tint;
        return;
      }
    }
  } catch (e) {
    console.warn('[Abyss] directive tint load:', e);
  }
}

function abyssDotMatchesActiveTint(dna) {
  if (!abyssActiveTint || !dna || !dna.keyTerms || !dna.keyTerms.length) return false;
  for (var ti = 0; ti < abyssActiveTint.terms.length; ti++) {
    var needle = abyssActiveTint.terms[ti];
    for (var ki = 0; ki < dna.keyTerms.length; ki++) {
      var hay = dna.keyTerms[ki];
      if (hay === needle || hay.indexOf(needle) !== -1 || needle.indexOf(hay) !== -1) return true;
    }
  }
  return false;
}

function abyssTintRgb(tintName) {
  if (tintName === 'urgent') return { r: 220, g: 100, b: 90 };
  return { r: 230, g: 180, b: 80 };
}

