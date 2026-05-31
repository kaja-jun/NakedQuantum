/* jshint esversion: 11 */
/* global window, localStorage, crypto, WitnessWeather, NQ_DEV_MODE, W_MIN_RICH_DISCOURSES */
/**
 * Witness synapse, SUBSTRATE panel, ledger chain, bridges, tier-4 wire.
 * See app-architecture-split-blueprint.md §4 (S1).
 * Loads after app.js — uses global dbGet, getDiscourses, escHtml, buildGeometrySnapshot, etc.
 */

/** Align with cartographer.js STOPWORDS — filter noise from half-life / orbit reads. */
var WITNESS_CORPUS_STOPWORDS = {
  the: 1, a: 1, an: 1, is: 1, was: 1, were: 1, be: 1, been: 1, being: 1, have: 1, has: 1, had: 1,
  do: 1, does: 1, did: 1, will: 1, would: 1, shall: 1, should: 1, may: 1, might: 1, must: 1,
  can: 1, could: 1, i: 1, me: 1, my: 1, mine: 1, myself: 1, you: 1, your: 1, yours: 1,
  he: 1, him: 1, his: 1, she: 1, her: 1, hers: 1, it: 1, its: 1, itself: 1,
  we: 1, us: 1, our: 1, ours: 1, they: 1, them: 1, their: 1, theirs: 1,
  this: 1, that: 1, these: 1, those: 1, what: 1, which: 1, who: 1, whom: 1,
  and: 1, but: 1, or: 1, nor: 1, not: 1, so: 1, yet: 1, for: 1, if: 1, to: 1, of: 1, in: 1,
  on: 1, at: 1, by: 1, from: 1, with: 1, about: 1, into: 1, through: 1, during: 1,
  after: 1, above: 1, below: 1, between: 1, out: 1, off: 1, over: 1, under: 1,
  again: 1, further: 1, then: 1, once: 1, here: 1, there: 1, when: 1, where: 1,
  why: 1, how: 1, all: 1, both: 1, each: 1, few: 1, more: 1, most: 1, other: 1, some: 1,
  such: 1, only: 1, own: 1, same: 1, than: 1, too: 1, very: 1, just: 1, now: 1,
  also: 1, even: 1, still: 1, already: 1, always: 1, never: 1, sometimes: 1
};

function isWitnessCorpusNoiseTerm(term) {
  var t = String(term || '').toLowerCase().trim();
  if (t.length < 4) return true;
  return WITNESS_CORPUS_STOPWORDS[t] === 1;
}

function computeCorpusTermArcs(discs, fastMapById) {
  var termMap = {};
  var now = Date.now();
  for (var di = 0; di < discs.length; di++) {
    var d = discs[di];
    if (d.isDeleted || d.deleted_at) continue;
    var fm = fastMapById.get(d.id);
    if (!fm || fm.map_type !== 'fast') continue;
    var created = d.created_at || 0;
    var arc = fastMapArcDirection(fm);
    var terms = parseFastMapKeyTermsList(fm);
    for (var ti = 0; ti < Math.min(6, terms.length); ti++) {
      var term = terms[ti].term.toLowerCase();
      if (isWitnessCorpusNoiseTerm(term)) continue;
      if (!termMap[term]) termMap[term] = { appearances: [], registers: {} };
      var orbitCount = terms[ti].count || 0;
      if (d.raw_text && orbitCount < 2) {
        try {
          var re = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
          var m = d.raw_text.match(re);
          if (m) orbitCount = m.length;
        } catch (reErr) { /* skip bad pattern */ }
      }
      termMap[term].appearances.push({
        discourse_id: d.id,
        date: created,
        arc_direction: arc,
        orbit_count: orbitCount
      });
      termMap[term].registers[arc] = true;
    }
  }
  var out = {};
  Object.keys(termMap).forEach(function (term) {
    var t = termMap[term];
    if (t.appearances.length < 2) return;
    t.appearances.sort(function (a, b) { return a.date - b.date; });
    var last = t.appearances[t.appearances.length - 1];
    t.last_seen_days_ago = Math.floor((now - last.date) / 86400000);
    var peakApp = t.appearances[0];
    for (var pi = 1; pi < t.appearances.length; pi++) {
      if (t.appearances[pi].orbit_count > peakApp.orbit_count) peakApp = t.appearances[pi];
    }
    t.peak_date = peakApp.date;
    t.emotional_registers = Object.keys(t.registers);
    t.register_shift = t.emotional_registers.length >= 2;
    if (t.last_seen_days_ago > 14) t.trajectory = 'declining';
    else if (t.appearances.length >= 3 && t.appearances[t.appearances.length - 1].orbit_count >= t.appearances[0].orbit_count) {
      t.trajectory = 'rising';
    } else {
      t.trajectory = 'declining';
    }
    out[term] = t;
  });
  return out;
}

function formatCorpusTermArcsTier(arcsMap, topN) {
  topN = topN || 5;
  var keys = Object.keys(arcsMap);
  if (!keys.length) return '';
  var entries = keys.map(function (k) {
    return { term: k, arc: arcsMap[k], n: arcsMap[k].appearances.length };
  });
  entries.sort(function (a, b) {
    if (!!b.arc.register_shift !== !!a.arc.register_shift) return (b.arc.register_shift ? 1 : 0) - (a.arc.register_shift ? 1 : 0);
    return b.n - a.n;
  });
  var lines = [];
  for (var i = 0; i < Math.min(topN, entries.length); i++) {
    var e = entries[i];
    var shiftFlag = e.arc.register_shift ? ' · register shift' : '';
    lines.push(
      '· "' + e.term + '" — ' + e.arc.appearances.length + ' appearances, last ' + e.arc.last_seen_days_ago +
      'd ago, ' + e.arc.trajectory + shiftFlag + ' (registers: ' + e.arc.emotional_registers.join(', ') + ')'
    );
  }
  return '── TERM ARCS (corpus shape, top ' + Math.min(topN, entries.length) + ') ──\n\n' + lines.join('\n') + '\n\n';
}

function fastMapQualifierBucket(fm) {
  if (!fm) return 'none';
  if (fm.performative_mode && fm.performative_mode.label === 'Performative') return 'performative';
  if (fm.recursive_mode && fm.recursive_mode.label === 'Recursive') return 'recursive';
  if (fm.fugue_mode && fm.fugue_mode.label === 'Fugue') return 'fugue';
  var sig = fm.signature;
  if (typeof sig === 'string') { try { sig = JSON.parse(sig); } catch (e) { sig = null; } }
  if (sig && sig.paradox && (sig.paradox.label === 'Paradox-dominant' || sig.paradox.label === 'Charged')) return 'paradox';
  if (sig && sig.orbits && (sig.orbits.label === 'Multi-orbit' || (sig.orbits.orbiting && sig.orbits.orbiting.some(function (o) { return o.count >= 5; })))) return 'orbit';
  if (fm.silence_weight && (fm.silence_weight.label === 'Silence as structure' || (fm.silence_weight.ratio || 0) >= 0.12)) return 'silence';
  if (fm.emotional_arc && String(fm.emotional_arc.direction || '').indexOf('escalating') !== -1) return 'escalating';
  return 'neutral';
}

function sharedKeyTermsBetween(mapA, mapB) {
  var a = new Set(parseFastMapKeyTermStrings(mapA).slice(0, 5));
  var shared = [];
  parseFastMapKeyTermStrings(mapB).slice(0, 5).forEach(function (t) {
    if (a.has(t)) shared.push(t);
  });
  return shared;
}

function computeReturnDetections(discs, fastMapById, watcherLinks) {
  var out = [];
  var seen = {};
  function pushHit(hit) {
    var key = [hit.discourse_id_a, hit.discourse_id_b].sort().join('_');
    if (seen[key]) return;
    seen[key] = true;
    out.push(hit);
  }
  var discById = {};
  for (var di = 0; di < discs.length; di++) discById[discs[di].id] = discs[di];

  if (watcherLinks && watcherLinks.length) {
    for (var wi = 0; wi < watcherLinks.length; wi++) {
      var link = watcherLinks[wi];
      if ((link.score || 0) < 0.55) continue;
      var mapA = fastMapById.get(link.a);
      var mapB = fastMapById.get(link.b);
      if (!mapA || !mapB) continue;
      var arcA = fastMapArcDirection(mapA);
      var arcB = fastMapArcDirection(mapB);
      var bucketA = fastMapQualifierBucket(mapA);
      var bucketB = fastMapQualifierBucket(mapB);
      var discA = discById[link.a];
      var discB = discById[link.b];
      var daysApart = discA && discB ? Math.abs((discA.created_at || 0) - (discB.created_at || 0)) / 86400000 : 0;
      if (daysApart < 3) continue;
      var arcShift = arcA !== arcB && arcA !== 'unknown' && arcB !== 'unknown';
      var qualShift = bucketA !== bucketB && bucketA !== 'neutral' && bucketB !== 'neutral';
      if (!arcShift && !qualShift) continue;
      var reason = arcShift ? ('arc shifted ' + arcA + ' → ' + arcB) : ('qualifier ' + bucketA + ' → ' + bucketB);
      pushHit({
        discourse_id_a: link.a,
        discourse_id_b: link.b,
        score: link.score,
        reason: reason,
        arc_a: arcA,
        arc_b: arcB,
        days_apart: Math.floor(daysApart),
        shared_terms: sharedKeyTermsBetween(mapA, mapB)
      });
    }
  }

  var arcsMap = computeCorpusTermArcs(discs, fastMapById);
  Object.keys(arcsMap).forEach(function (term) {
    var arc = arcsMap[term];
    if (!arc.register_shift || arc.appearances.length < 2) return;
    var first = arc.appearances[0];
    var last = arc.appearances[arc.appearances.length - 1];
    if (first.discourse_id === last.discourse_id) return;
    var days = Math.floor((last.date - first.date) / 86400000);
    if (days < 7) return;
    pushHit({
      discourse_id_a: first.discourse_id,
      discourse_id_b: last.discourse_id,
      score: 0.6,
      reason: 'term "' + term + '" returned with register shift',
      arc_a: first.arc_direction,
      arc_b: last.arc_direction,
      days_apart: days,
      shared_terms: [term]
    });
  });

  out.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  return out;
}

function formatReturnDetectionsTier(detections, topN) {
  topN = topN || 4;
  if (!detections || !detections.length) return '';
  var lines = [];
  for (var i = 0; i < Math.min(topN, detections.length); i++) {
    var d = detections[i];
    lines.push(
      '· Return: d_' + String(d.discourse_id_b).slice(-4) + ' ↔ d_' + String(d.discourse_id_a).slice(-4) +
      ' (' + Math.round((d.score || 0) * 100) + '%) — ' + d.reason + ', ' + d.days_apart + 'd apart'
    );
  }
  return '── RETURN DETECTIONS (semantic cluster, shifted register) ──\n\n' + lines.join('\n') + '\n\n';
}

function formatInterSessionSilenceTier(arcsMap) {
  var dormant = Object.keys(arcsMap).map(function (k) {
    return { term: k, arc: arcsMap[k] };
  }).filter(function (e) {
    return e.arc.last_seen_days_ago >= 21 && (e.arc.trajectory === 'declining' || e.arc.trajectory === 'dormant');
  });
  if (!dormant.length) return '';
  dormant.sort(function (a, b) { return b.arc.last_seen_days_ago - a.arc.last_seen_days_ago; });
  var lines = dormant.slice(0, 6).map(function (e) {
    return '· "' + e.term + '" — absent ' + e.arc.last_seen_days_ago + 'd (' + e.arc.trajectory + ')';
  });
  return '── INTER-SESSION SILENCE (topics that went quiet) ──\n\n' + lines.join('\n') + '\n\n';
}

function formatSilentAttractorsTier(arcsMap, topN) {
  topN = topN || 5;
  var entries = Object.keys(arcsMap).map(function (k) {
    return { term: k, arc: arcsMap[k] };
  }).filter(function (e) {
    return e.arc.appearances.length >= 3 && e.arc.last_seen_days_ago > 14;
  });
  if (!entries.length) return '';
  entries.sort(function (a, b) { return b.arc.last_seen_days_ago - a.arc.last_seen_days_ago; });
  var lines = [];
  for (var i = 0; i < Math.min(topN, entries.length); i++) {
    var e = entries[i];
    lines.push(
      '· "' + e.term + '" — ' + e.arc.appearances.length + '×, silent ' + e.arc.last_seen_days_ago +
      'd, ' + e.arc.trajectory
    );
  }
  return '── SILENT ATTRACTORS (absent but recurring) ──\n\n' + lines.join('\n') + '\n\n';
}

/* ── WITNESS SUBSTRATE (W1) ───────────────────────────────── */
var SYNAPSE_VERSION = '1';
var SYNAPSE_LS = 'nq_synapse_latest';
var BRIDGE_MAX_CHECKS = 5;
var BRIDGE_MAX_OPEN_MS = 14 * 86400000;
var WITNESS_RESISTANCE_LEXICON = ['refuse', 'deny', 'wrong', 'against', 'resist', 'defend', 'never', 'always', 'must', 'should', 'ought', 'fight', 'no '];

var NQ_WITNESS_FLAGS = {
  enabled: true,
  bridges: true,
  synapse: true,
  invoke_gate: true,
  process_panel: true,
  wire: true,
  ledger_chain: true,
  weather_cues: true
};
var WITNESS_CUE_RETIRED_LS = 'nq_cue_retired';
var WITNESS_WEATHER_CTX_LS = 'nq_witness_weather_ctx';
var WITNESS_CHAIN_LS_ID = 'nq_witness_chain_id';
var WITNESS_CHAIN_GENESIS_AT = 'nq_witness_chain_genesis_at';
var WITNESS_LEDGER_KEY_FP = 'nq_witness_ledger_key_fp';
var _witnessLedgerStatus = { ok: null, length: 0, breakAt: null, dormant: false, reanchored: false };
var _witnessLedgerVerifyPromise = null;

function isWitnessSubstrateEnabled() {
  return NQ_WITNESS_FLAGS.enabled !== false;
}

function parseJsonField(raw, fallback) {
  if (raw == null) return fallback;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

function parseSynapseSnapshot(raw) {
  if (!raw) return null;
  var blob = typeof raw === 'string' ? parseJsonField(raw, null) : raw;
  if (!blob || blob.synapse_version !== SYNAPSE_VERSION) return null;
  return blob;
}

function getSynapseSnapshot() {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.synapse === false) return null;
  try {
    var stored = localStorage.getItem(SYNAPSE_LS);
    var parsed = parseSynapseSnapshot(stored);
    if (parsed) return parsed;
  } catch (eLs) {}
  return null;
}

async function loadWitnessCorpusMaps() {
  var discs = (await getDiscourses()).filter(function (d) { return !d.deleted_at && !d.isDeleted; });
  var fastMapById = new Map();
  for (var i = 0; i < discs.length; i++) {
    var fm = await dbGet('guardian_summaries', discs[i].id);
    if (fm && fm.map_type === 'fast') fastMapById.set(discs[i].id, fm);
  }
  return { discs: discs, fastMapById: fastMapById };
}

function detectPerpetualOrbitTerms(arcsMap) {
  var out = [];
  Object.keys(arcsMap || {}).forEach(function (term) {
    if (isWitnessCorpusNoiseTerm(term)) return;
    var arc = arcsMap[term];
    if (!arc || arc.appearances.length < 3) return;
    if (arc.register_shift) return;
    if (arc.last_seen_days_ago > 21) return;
    var first = arc.appearances[0];
    var last = arc.appearances[arc.appearances.length - 1];
    if (last.orbit_count >= 2 && last.orbit_count >= first.orbit_count * 0.7) {
      out.push(term);
    }
  });
  return out;
}

function computeTermHalfLife(arcsMap) {
  var now = Date.now();
  var lambda = 0.05;
  var terms = {};
  Object.keys(arcsMap || {}).forEach(function (term) {
    if (isWitnessCorpusNoiseTerm(term)) return;
    var arc = arcsMap[term];
    if (!arc.appearances.length) return;
    var last = arc.appearances[arc.appearances.length - 1];
    var days = Math.max(0, (now - (last.date || now)) / 86400000);
    var weight = Math.exp(-lambda * days);
    terms[term] = { weight: parseFloat(weight.toFixed(3)), last_reinforced_at: last.date || now };
  });
  return { terms: terms };
}

function mergeCorpusBaseline(prevBaseline, totalDiscourses, lastWriteAt) {
  var baseline = prevBaseline || {};
  var builtAt = baseline.built_at || Date.now();
  var prevTotal = baseline.total_discourses || 0;
  var organicSince = baseline.organic_writes_since || 0;
  if (totalDiscourses > prevTotal) {
    organicSince += (totalDiscourses - prevTotal);
  }
  return {
    built_at: builtAt,
    total_discourses: totalDiscourses,
    organic_writes_since: organicSince,
    last_write_at: lastWriteAt != null ? lastWriteAt : (baseline.last_write_at || builtAt)
  };
}

function detectResurgentTerms(arcsMap) {
  var now = Date.now();
  var out = [];
  Object.keys(arcsMap || {}).forEach(function (term) {
    if (isWitnessCorpusNoiseTerm(term)) return;
    var arc = arcsMap[term];
    if (!arc || !arc.appearances || arc.appearances.length < 2) return;
    var last = arc.appearances[arc.appearances.length - 1];
    var prev = arc.appearances[arc.appearances.length - 2];
    var gapMs = (last.date || now) - (prev.date || now);
    var daysSinceLast = (now - (last.date || now)) / 86400000;
    if (gapMs >= 14 * 86400000 && daysSinceLast <= 10 && !isWitnessCorpusNoiseTerm(term)) out.push(term);
  });
  return out;
}

function loadWitnessCueRetired() {
  try {
    return JSON.parse(localStorage.getItem(WITNESS_CUE_RETIRED_LS) || '{}');
  } catch (eCr) {
    return {};
  }
}

function buildWitnessWeatherContext(snap) {
  var prev = {};
  try {
    prev = JSON.parse(localStorage.getItem(WITNESS_WEATHER_CTX_LS) || '{}');
  } catch (ePrev) {}
  var resistance = (snap.posture_vector && snap.posture_vector.resistance) || 0;
  var resistanceDelta = prev.resistance != null ? resistance - prev.resistance : 0;
  var turbulentStates = { front: true, pressure: true, electrical: true };
  var prevTurbulent = turbulentStates[prev.last_weather] === true;
  var lastWrite = (snap.corpus_baseline && snap.corpus_baseline.last_write_at) || snap.built_at || Date.now();
  var daysSinceWrite = (Date.now() - lastWrite) / 86400000;
  var ctx = {
    post_craft: snap.post_craft === true,
    resistance_delta: resistanceDelta,
    previous_weather_turbulent: prevTurbulent,
    days_since_write: daysSinceWrite
  };
  if (typeof WitnessWeather !== 'undefined') {
    var weather = WitnessWeather.computeWeatherState(snap, ctx);
    try {
      localStorage.setItem(WITNESS_WEATHER_CTX_LS, JSON.stringify({
        resistance: resistance,
        coherence: (snap.posture_vector && snap.posture_vector.coherence) || 0,
        last_weather: weather.state,
        last_built_at: snap.built_at || Date.now()
      }));
    } catch (eStore) {}
  }
  return ctx;
}

function formatWitnessWeatherSubstrateLine(weather, cues, snap, retiredKeys) {
  var stateText = weather.label || weather.state || 'unknown';
  if (cues && cues.length) {
    return 'weather: ' + stateText + ' · cues: ' + cues.length + ' active';
  }
  if (weather.state === 'calm') {
    return 'weather: calm · cues: none — map quiet, no qualifying signals';
  }
  if (weather.state === 'drought') {
    return 'weather: ' + stateText + ' · cues: none — long silence gate';
  }
  if (typeof WitnessWeather !== 'undefined') {
    var candidates = WitnessWeather.buildCandidates(snap);
    if (!candidates.length) {
      return 'weather: ' + stateText + ' · cues: none — no orbit, bridge, resurgence, or denial signal';
    }
    var allRetired = candidates.every(function (c) {
      return retiredKeys && retiredKeys[WitnessWeather.cueRetireKey(c.type, c.term)];
    });
    if (allRetired) {
      return 'weather: ' + stateText + ' · cues: none — released signals';
    }
  }
  return 'weather: ' + stateText + ' · cues: none — quiet weather gate';
}

function dismissWitnessCue(type, term) {
  if (typeof WitnessWeather === 'undefined') return;
  var key = WitnessWeather.cueRetireKey(type, term);
  var retired = loadWitnessCueRetired();
  retired[key] = true;
  try {
    localStorage.setItem(WITNESS_CUE_RETIRED_LS, JSON.stringify(retired));
  } catch (eDs) {}
  void renderWitnessProcessPanel();
}

function formatSynapseAgeRelative(ts) {
  if (!ts) return 'unknown';
  var ms = Date.now() - ts;
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm ago';
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h ago';
  return Math.floor(ms / 86400000) + 'd ago';
}

function formatSubstrateSaccadeLine(saccade) {
  if (!saccade) return 'no saccade log — rebuild synapse';
  var fix = (saccade.fixation_ids || []).map(function (id) { return 'd_' + String(id).slice(-4); });
  var line = 'fixation: ' + (fix.length ? fix.join(', ') : 'none');
  if (saccade.blind_spot) {
    line += ' · blind spot: ' + saccade.blind_spot + ' (' + (saccade.reason || '') + ')';
  } else {
    line += ' · blind spot: none';
  }
  return line;
}

function formatHalfLifePanelLines(halfLife) {
  var terms = halfLife && halfLife.terms ? halfLife.terms : {};
  var entries = Object.keys(terms).map(function (t) {
    return { term: t, weight: terms[t].weight != null ? terms[t].weight : 0 };
  }).filter(function (e) { return !isWitnessCorpusNoiseTerm(e.term); });
  if (!entries.length) {
    return { top: 'no term weights yet — need mapped discourses with arcs', bottom: 'no decayed orbits yet' };
  }
  entries.sort(function (a, b) { return b.weight - a.weight; });
  var top5 = entries.slice(0, 5);
  var bottom3 = entries.slice(Math.max(0, entries.length - 3));
  return {
    top: top5.map(function (e) { return '"' + e.term + '" (' + e.weight + ')'; }).join(', '),
    bottom: bottom3.map(function (e) { return '"' + e.term + '" (' + e.weight + ')'; }).join(', ')
  };
}

function isWitnessLedgerChainEnabled() {
  return isWitnessSubstrateEnabled() && NQ_WITNESS_FLAGS.ledger_chain !== false;
}

function stableWitnessStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableWitnessStringify).join(',') + ']';
  var keys = Object.keys(obj).sort();
  return '{' + keys.map(function (k) {
    return JSON.stringify(k) + ':' + stableWitnessStringify(obj[k]);
  }).join(',') + '}';
}

async function witnessSha256Hex(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function getWitnessLedgerHmacKey() {
  var sk = getSovereignKey();
  if (!sk) return null;
  return crypto.subtle.importKey('raw', sk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function witnessHmacSha256Hex(message) {
  var key = await getWitnessLedgerHmacKey();
  if (!key) return null;
  var sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(message)));
  return Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function ensureWitnessChainId() {
  try {
    var id = localStorage.getItem(WITNESS_CHAIN_LS_ID);
    if (id) return id;
    id = 'wc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(WITNESS_CHAIN_LS_ID, id);
    return id;
  } catch (e) {
    return 'wc_local';
  }
}

async function getWitnessChainGenesisHash() {
  return witnessSha256Hex('nq-witness-genesis:' + ensureWitnessChainId());
}

function canonicalWitnessLogPayload(row) {
  var evt = row.log_type === 'witness_field' ? 'witness_field' : 'summon';
  return {
    event_type: evt,
    id: row.id,
    invoked_at: row.invoked_at || 0,
    was_silent: row.was_silent ? 1 : 0,
    theory_one_line: String(row.theory_one_line || ''),
    primary_discourse_id: row.primary_discourse_id || null,
    triggered_by: row.triggered_by || null,
    prediction_tag: row.prediction_tag || null
  };
}

function canonicalWitnessBridgeOpenPayload(row) {
  return {
    event_type: 'bridge_open',
    id: row.id,
    opened_at: row.opened_at || 0,
    source_log_id: row.source_log_id || null,
    user_action: row.user_action || '',
    prior_theory: String(row.prior_theory || ''),
    status: row.status || 'open'
  };
}

function canonicalWitnessBridgeClosePayload(row) {
  return {
    event_type: 'bridge_close',
    id: row.id,
    status: row.status || '',
    closed_at: row.closed_at || 0,
    closure_reason: row.closure_reason || null
  };
}

function witnessCanonicalPayload(eventType, row) {
  if (eventType === 'bridge_open') return canonicalWitnessBridgeOpenPayload(row);
  if (eventType === 'bridge_close') return canonicalWitnessBridgeClosePayload(row);
  if (eventType === 'witness_field') return canonicalWitnessLogPayload(row);
  return canonicalWitnessLogPayload(row);
}

async function getWitnessLedgerChainSorted() {
  var rows = await dbGetAll('witness_ledger_chain');
  return rows.slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
}

async function resetWitnessLedgerChain(reason) {
  if (!isWitnessLedgerChainEnabled()) return;
  try {
    var rows = await dbGetAll('witness_ledger_chain');
    for (var i = 0; i < rows.length; i++) {
      await dbDelete('witness_ledger_chain', rows[i].id);
    }
    localStorage.removeItem(WITNESS_CHAIN_LS_ID);
    localStorage.removeItem(WITNESS_CHAIN_GENESIS_AT);
    localStorage.removeItem(WITNESS_LEDGER_KEY_FP);
    _witnessLedgerStatus = { ok: null, length: 0, breakAt: null, dormant: false, reanchored: true, reason: reason || null };
  } catch (eReset) {
    console.warn('[Witness] ledger reset:', eReset);
  }
}

async function appendWitnessLedgerLink(eventType, eventId, row) {
  if (!isWitnessLedgerChainEnabled() || !getSovereignKey()) return null;
  try {
    var chain = await getWitnessLedgerChainSorted();
    for (var ci = 0; ci < chain.length; ci++) {
      if (chain[ci].event_id === eventId) return chain[ci];
    }
    var payload = witnessCanonicalPayload(eventType, row);
    var payloadHash = await witnessSha256Hex(stableWitnessStringify(payload));
    var prevHash = chain.length ? chain[chain.length - 1].link_hash : await getWitnessChainGenesisHash();
    var seq = chain.length ? (chain[chain.length - 1].seq + 1) : 1;
    if (seq === 1) {
      try { localStorage.setItem(WITNESS_CHAIN_GENESIS_AT, String(Date.now())); } catch (eGen) {}
      try {
        if (typeof getSovereignKeyFingerprint === 'function') {
          var fp = await getSovereignKeyFingerprint();
          if (fp) localStorage.setItem(WITNESS_LEDGER_KEY_FP, fp);
        }
      } catch (eFp) {}
    }
    var linkMsg = seq + '|' + eventType + '|' + eventId + '|' + payloadHash + '|' + prevHash;
    var linkHash = await witnessHmacSha256Hex(linkMsg);
    if (!linkHash) return null;
    var link = {
      id: 'wlc_' + seq,
      seq: seq,
      event_type: eventType,
      event_id: eventId,
      payload_hash: payloadHash,
      prev_hash: prevHash,
      link_hash: linkHash,
      created_at: Date.now()
    };
    await dbPut('witness_ledger_chain', link);
    _witnessLedgerStatus.ok = true;
    _witnessLedgerStatus.length = seq;
    _witnessLedgerStatus.breakAt = null;
    _witnessLedgerStatus.dormant = false;
    _witnessLedgerStatus.reanchored = false;
    return link;
  } catch (eAppend) {
    console.warn('[Witness] ledger append:', eAppend);
    return null;
  }
}

async function witnessLedgerKeyChanged() {
  var ledgerFp = localStorage.getItem(WITNESS_LEDGER_KEY_FP);
  if (!ledgerFp || typeof getSovereignKeyFingerprint !== 'function') return false;
  var currentFp = await getSovereignKeyFingerprint();
  return !!(currentFp && ledgerFp !== currentFp);
}

async function verifyWitnessLedgerChain() {
  if (!isWitnessLedgerChainEnabled()) {
    _witnessLedgerStatus = { ok: null, length: 0, breakAt: null, dormant: true, reanchored: false };
    return _witnessLedgerStatus;
  }
  if (!getSovereignKey()) {
    _witnessLedgerStatus = { ok: null, length: 0, breakAt: null, dormant: true, reanchored: false };
    return _witnessLedgerStatus;
  }
  try {
    var chain = await getWitnessLedgerChainSorted();
    if (!chain.length) {
      _witnessLedgerStatus = { ok: true, length: 0, breakAt: null, dormant: false, reanchored: false };
      return _witnessLedgerStatus;
    }
    var expectedPrev = await getWitnessChainGenesisHash();
    for (var i = 0; i < chain.length; i++) {
      var link = chain[i];
      if (link.prev_hash !== expectedPrev) {
        var keyChangedPrev = await witnessLedgerKeyChanged();
        _witnessLedgerStatus = { ok: false, length: chain.length, breakAt: link.seq, dormant: false, reanchored: false, error: keyChangedPrev ? 'key_changed' : 'prev_hash_mismatch', keyChanged: keyChangedPrev };
        return _witnessLedgerStatus;
      }
      var linkMsg = link.seq + '|' + link.event_type + '|' + link.event_id + '|' + link.payload_hash + '|' + link.prev_hash;
      var expectedLink = await witnessHmacSha256Hex(linkMsg);
      if (!expectedLink || expectedLink !== link.link_hash) {
        var keyChangedLink = await witnessLedgerKeyChanged();
        _witnessLedgerStatus = { ok: false, length: chain.length, breakAt: link.seq, dormant: false, reanchored: false, error: keyChangedLink ? 'key_changed' : 'link_hash_mismatch', keyChanged: keyChangedLink };
        return _witnessLedgerStatus;
      }
      expectedPrev = link.link_hash;
    }
    _witnessLedgerStatus = { ok: true, length: chain.length, breakAt: null, dormant: false, reanchored: false };
    return _witnessLedgerStatus;
  } catch (eVerify) {
    console.warn('[Witness] ledger verify:', eVerify);
    _witnessLedgerStatus = { ok: false, length: 0, breakAt: null, dormant: false, reanchored: false, error: String(eVerify && eVerify.message ? eVerify.message : eVerify) };
    return _witnessLedgerStatus;
  }
}

function ensureWitnessLedgerVerified(force) {
  if (!isWitnessLedgerChainEnabled()) return Promise.resolve(_witnessLedgerStatus);
  if (force) _witnessLedgerVerifyPromise = null;
  if (!_witnessLedgerVerifyPromise || _witnessLedgerStatus.ok === null) {
    _witnessLedgerVerifyPromise = verifyWitnessLedgerChain();
  }
  return _witnessLedgerVerifyPromise;
}

function formatWitnessLedgerStatusLine() {
  var st = _witnessLedgerStatus || {};
  if (st.dormant) return 'ledger: dormant — unlock required';
  if (st.reanchored) return 'ledger: re-anchored after import — pre-chain history unlinked';
  if (st.length === 0 && st.ok) return 'ledger: 0 links · verified (pre-chain logs unlinked)';
  if (st.ok === false && st.keyChanged) return 'ledger: key changed — re-anchor or restore backup key';
  if (st.ok === false && st.breakAt) {
    return 'ledger: break at seq ' + st.breakAt + ' — possible tamper';
  }
  if (st.ok === false) {
    return 'ledger: verify failed — ' + (st.error ? String(st.error).slice(0, 48) : 'retry unlock');
  }
  if (st.ok) return 'ledger: ' + st.length + ' links · verified';
  return 'ledger: verifying…';
}

function computeDenialSediment(bridgeRows) {
  var counts = {};
  (bridgeRows || []).forEach(function (br) {
    if (br.user_action !== 'reject') return;
    var keys = parseJsonField(br.signal_keys, {});
    (keys.terms || []).forEach(function (t) {
      var term = String(t).toLowerCase();
      if (!term) return;
      counts[term] = (counts[term] || 0) + 1;
    });
  });
  var anomalies = [];
  Object.keys(counts).forEach(function (t) {
    if (counts[t] >= 3) anomalies.push('denial_sediment:' + t);
  });
  return anomalies;
}

function computePostureVector(discs, fastMapById, arcsMap) {
  var selfHits = 0;
  var pronounHits = 0;
  var resistanceHits = 0;
  var resistanceTotal = 0;
  var termCounts = {};
  var mapped = 0;
  fastMapById.forEach(function (fm) {
    mapped++;
    var text = '';
    if (fm.pronoun_trajectory && fm.pronoun_trajectory.dominant) {
      var dom = String(fm.pronoun_trajectory.dominant).toLowerCase();
      if (dom === 'i' || dom === 'me' || dom === 'my') selfHits++;
      pronounHits++;
    }
    var disc = null;
    for (var di = 0; di < discs.length; di++) {
      if (discs[di].id === fm.id || discs[di].id === fm.discourse_id) { disc = discs[di]; break; }
    }
    if (disc && disc.raw_text) {
      var lower = disc.raw_text.toLowerCase();
      resistanceTotal += Math.min(lower.length, 4000);
      for (var ri = 0; ri < WITNESS_RESISTANCE_LEXICON.length; ri++) {
        if (lower.indexOf(WITNESS_RESISTANCE_LEXICON[ri]) !== -1) resistanceHits++;
      }
    }
    parseFastMapKeyTermStrings(fm).slice(0, 5).forEach(function (t) {
      termCounts[t] = (termCounts[t] || 0) + 1;
    });
  });
  var topTermN = 0;
  var totalTermN = 0;
  Object.keys(termCounts).forEach(function (t) {
    totalTermN += termCounts[t];
    if (termCounts[t] > topTermN) topTermN = termCounts[t];
  });
  var attractor = totalTermN ? topTermN / totalTermN : 0;
  var selfRef = pronounHits ? selfHits / pronounHits : 0;
  var resistanceDenom = Math.max(12, mapped * 1.5);
  var resistance = resistanceTotal ? Math.min(1, resistanceHits / resistanceDenom) : 0;
  var coherence = mapped ? Math.min(1, mapped / Math.max(1, discs.length)) : 0;
  if (Object.keys(arcsMap || {}).length >= 4) coherence = Math.min(1, coherence + 0.15);
  return {
    coherence: parseFloat(coherence.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(2)),
    self_ref_ratio: parseFloat(selfRef.toFixed(2)),
    attractor_concentration: parseFloat(attractor.toFixed(2))
  };
}

function collectWitnessAnomalies(arcsMap, perpetual, bridgeRows) {
  var anomalies = computeDenialSediment(bridgeRows);
  perpetual.forEach(function (t) { anomalies.push('perpetual_orbit:' + t); });
  Object.keys(arcsMap || {}).forEach(function (term) {
    if (isWitnessCorpusNoiseTerm(term)) return;
    var arc = arcsMap[term];
    if (arc && arc.last_seen_days_ago >= 21 && arc.appearances.length >= 3) {
      anomalies.push('silent_attractor:' + term);
    }
  });
  return anomalies;
}

function buildSaccadeLogV1(discs, fastMapById) {
  var sorted = discs.slice().sort(function (a, b) {
    return (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0);
  });
  var fixation = sorted.slice(0, 2).map(function (d) { return d.id; });
  var mapped = 0;
  fastMapById.forEach(function () { mapped++; });
  var blind = mapped < discs.length ? 'unmapped_discourses' : null;
  return {
    fixation_ids: fixation,
    blind_spot: blind,
    reason: blind ? 'not_all_fast_mapped' : 'none'
  };
}

async function buildSynapseSnapshot() {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.synapse === false) return null;
  var corpus = await loadWitnessCorpusMaps();
  var discs = corpus.discs;
  var fastMapById = corpus.fastMapById;
  var arcsMap = computeCorpusTermArcs(discs, fastMapById);
  var bridgeRows = NQ_WITNESS_FLAGS.bridges === false ? [] : await dbGetAll('bridge_rows');
  var perpetual = detectPerpetualOrbitTerms(arcsMap);
  var posture = computePostureVector(discs, fastMapById, arcsMap);
  var halfLife = computeTermHalfLife(arcsMap);
  halfLife.resurgent = detectResurgentTerms(arcsMap);
  var lastWriteAt = 0;
  discs.forEach(function (d) {
    var t = d.updated_at || d.created_at || 0;
    if (t > lastWriteAt) lastWriteAt = t;
  });
  var openBridges = bridgeRows.filter(function (br) { return br.status === 'open'; }).map(function (br) {
    var keys = parseJsonField(br.signal_keys, {});
    return { id: br.id, status: br.status, terms: keys.terms || [] };
  });
  var elaborationDelta = computeElaborationDelta(discs, bridgeRows);
  var anomalies = collectWitnessAnomalies(arcsMap, perpetual, bridgeRows);
  var prevSyn = null;
  var prevBaseline = null;
  try {
    var prevStored = localStorage.getItem(SYNAPSE_LS);
    prevSyn = parseSynapseSnapshot(prevStored);
    if (prevSyn && prevSyn.corpus_baseline) prevBaseline = prevSyn.corpus_baseline;
  } catch (ePrev) {}
  var corpusBaseline = mergeCorpusBaseline(prevBaseline, discs.length, lastWriteAt);
  var denialTerms = [];
  anomalies.forEach(function (a) {
    if (typeof a === 'string' && a.indexOf('denial_sediment:') === 0) {
      denialTerms.push(a.slice('denial_sediment:'.length));
    }
  });
  var synapse = {
    synapse_version: SYNAPSE_VERSION,
    built_at: Date.now(),
    corpus_baseline: corpusBaseline,
    posture_vector: posture,
    half_life: halfLife,
    perpetual_orbit_terms: perpetual,
    open_bridges: openBridges,
    open_bridges_count: openBridges.length,
    denial_sediment_terms: denialTerms,
    elaboration_delta: elaborationDelta,
    saccade_log: buildSaccadeLogV1(discs, fastMapById),
    anomalies: anomalies,
    local_pass: { invoke_denied: false, graduation_quiet: false, deny_reason: null }
  };
  synapse.local_pass = runLocalPass(synapse, discs, fastMapById);
  var thresholdResult = runWitnessThresholdEngine(synapse, prevSyn, bridgeRows, arcsMap);
  synapse.threshold_engine = {
    picked: thresholdResult.picked ? thresholdResult.picked.id : null,
    candidates: thresholdResult.candidates.map(function (c) { return c.id; }),
    queue_len: thresholdResult.queue.length,
    forming: thresholdResult.forming || []
  };
  if (typeof w5EnrichSynapse === 'function') {
    await w5EnrichSynapse(synapse, prevSyn, bridgeRows, arcsMap, fastMapById);
  }
  try {
    localStorage.setItem(SYNAPSE_LS, JSON.stringify(synapse));
  } catch (eStore) {}
  if (NQ_DEV_MODE) {
    console.log('[Witness] synapse', synapse);
    if (thresholdResult.picked) console.log('[Witness] threshold picked', thresholdResult.picked.id, thresholdResult);
  }
  return synapse;
}

function runLocalPass(synapse, discs, fastMapById) {
  var out = { invoke_denied: false, graduation_quiet: false, deny_reason: null };
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.invoke_gate === false) return out;
  if (NQ_DEV_MODE) return out;
  var mapped = 0;
  fastMapById.forEach(function () { mapped++; });
  var minRich = W_MIN_RICH_DISCOURSES;
  if (mapped < minRich) {
    out.invoke_denied = true;
    out.deny_reason = 'thin_map';
    return out;
  }
  var posture = synapse.posture_vector || {};
  if ((posture.coherence || 0) >= 0.85 && (synapse.open_bridges || []).length === 0 && (posture.resistance || 0) < 0.25) {
    out.graduation_quiet = true;
  }
  return out;
}

function isGuardianInvokeDeniedBySynapse() {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.invoke_gate === false) return { denied: false };
  var syn = getSynapseSnapshot();
  if (!syn || !syn.local_pass) return { denied: false };
  if (syn.local_pass.invoke_denied) {
    return { denied: true, reason: syn.local_pass.deny_reason || 'thin_map' };
  }
  return { denied: false };
}

function discourseSentenceComplexity(rawText) {
  var text = String(rawText || '').trim();
  if (!text) return 0;
  var sentences = text.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (!sentences.length) return text.split(/\s+/).filter(Boolean).length;
  var words = text.split(/\s+/).filter(Boolean).length;
  return words / sentences.length;
}

function computeElaborationDelta(discs, bridgeRows) {
  var open = (bridgeRows || []).filter(function (br) { return br.status === 'open'; });
  if (!open.length) return null;
  var openedAt = Math.min.apply(null, open.map(function (br) { return br.opened_at || Date.now(); }));
  var baseline = [];
  var post = [];
  for (var i = 0; i < discs.length; i++) {
    var c = discourseSentenceComplexity(discs[i].raw_text);
    if (!c) continue;
    baseline.push(c);
    if ((discs[i].updated_at || discs[i].created_at || 0) >= openedAt) post.push(c);
  }
  if (baseline.length < 2 || post.length < 1) return null;
  baseline.sort(function (a, b) { return a - b; });
  post.sort(function (a, b) { return a - b; });
  var baseMed = baseline[Math.floor(baseline.length / 2)];
  var postMed = post[Math.floor(post.length / 2)];
  if (!baseMed) return null;
  var ratio = postMed / baseMed;
  return {
    baseline_median: parseFloat(baseMed.toFixed(2)),
    post_bridge_median: parseFloat(postMed.toFixed(2)),
    ratio: parseFloat(ratio.toFixed(2)),
    spike: ratio >= 3
  };
}

function getWitnessPostureProfile(synapse) {
  var pv = synapse && synapse.posture_vector ? synapse.posture_vector : {};
  var coh = pv.coherence || 0;
  var res = pv.resistance || 0;
  var selfRef = pv.self_ref_ratio || 0;
  var att = pv.attractor_concentration || 0;
  if (coh >= 0.85 && res < 0.25) return 'graduation';
  if (res >= 0.45 && coh >= 0.5) return 'resistance_eloquent';
  if (att >= 0.5 && selfRef < 0.35) return 'single_attractor';
  return 'default';
}

function getWitnessTier4BlockOrder(profile, synapse) {
  var hasOpen = synapse && synapse.open_bridges && synapse.open_bridges.length;
  if (profile === 'graduation') {
    return ['graduation_quiet', 'term_arcs', 'returns', 'silent', 'inter_session', 'rollup'];
  }
  if (profile === 'resistance_eloquent') {
    var r = [];
    if (hasOpen) { r.push('open_bridges', 'elaboration_delta'); }
    r.push('perpetual_orbit', 'term_arcs', 'returns', 'silent', 'inter_session', 'rollup');
    return r;
  }
  if (profile === 'single_attractor') {
    return ['signal_reality', 'term_arcs', 'returns', 'silent', 'rollup'];
  }
  var d = ['term_arcs', 'returns', 'geometry_delta', 'silent', 'inter_session', 'rollup'];
  if (hasOpen) d.unshift('open_bridges');
  return d;
}

function getWitnessStripReadOrder(profile, synapse) {
  if (profile === 'graduation') {
    return ['graduation_quiet', 'term_arcs', 'prior_witness', 'orbiting_terms', 'silence_markers'];
  }
  if (profile === 'resistance_eloquent') {
    var r = ['open_bridges', 'elaboration_delta', 'perpetual_orbit', 'prior_witness', 'orbiting_terms', 'paradox'];
    return r;
  }
  if (profile === 'single_attractor') {
    return ['signal_coordinate', 'orbiting_terms', 'writing_signature', 'prior_witness'];
  }
  var d = ['term_arcs_summary', 'open_bridges', 'prior_witness', 'orbiting_terms', 'returns_hint'];
  if (synapse && synapse.saccade_log && synapse.saccade_log.blind_spot) d.push('blind_spot');
  return d;
}

function formatWitnessOpenBridgesTier(openRows) {
  if (!openRows || !openRows.length) return '';
  var lines = [];
  for (var i = 0; i < openRows.length; i++) {
    var br = openRows[i];
    var keys = parseJsonField(br.signal_keys, {});
    var terms = (keys.terms || []).join(', ');
    lines.push('· [' + br.user_action + '] ' + (terms || '—') + ' — ' + String(br.prior_theory || '').slice(0, 100));
  }
  return '── OPEN BRIDGES (user correction active) ──\n\n' + lines.join('\n') + '\n\n';
}

function formatWitnessElaborationTier(delta) {
  if (!delta) return '';
  var line = 'Baseline median complexity: ' + delta.baseline_median + ' words/sentence';
  line += ' · post-bridge: ' + delta.post_bridge_median + ' (×' + delta.ratio + ')';
  if (delta.spike) line += ' · SPIKE (≥3×)';
  return '── ELABORATION DELTA ──\n\n' + line + '\n\n';
}

function formatWitnessPerpetualOrbitTier(terms) {
  if (!terms || !terms.length) return '';
  return '── PERPETUAL ORBIT ──\n\n· ' + terms.map(function (t) { return '"' + t + '"'; }).join('\n· ') + '\n\n';
}

function formatWitnessGraduationQuietTier() {
  return '── GRADUATION QUIET ──\n\nMap reads stable across sessions. Witness invoke appetite reduced — write if the register shifts, not from habit.\n\n';
}

function formatWitnessSignalRealityTier(sorted, fastMapById) {
  if (!sorted.length) return '';
  var d = sorted[0];
  var fm = fastMapById.get(d.id);
  var terms = parseFastMapKeyTermStrings(fm).slice(0, 3);
  var line = 'One coordinate: "' + (d.title || 'Untitled') + '"';
  if (terms.length) line += ' · signal terms: ' + terms.join(', ');
  if (fm && fm.emotional_arc && fm.emotional_arc.direction) line += ' · arc: ' + fm.emotional_arc.direction;
  return '── SIGNAL REALITY (single attractor) ──\n\n' + line + '\n\n';
}

function formatWitnessSaccadeTier(saccade) {
  if (!saccade) return '';
  var fix = (saccade.fixation_ids || []).map(function (id) { return 'd_' + String(id).slice(-4); }).join(', ');
  var line = 'Fixation: ' + (fix || 'none');
  if (saccade.blind_spot) line += ' · blind spot: ' + saccade.blind_spot + ' (' + (saccade.reason || '') + ')';
  return '── SACCADE LOG ──\n\n' + line + '\n\n';
}

async function buildWitnessTier4Blocks(discs, sorted, fastMapById, corpusArcs, returnDetections, synapse) {
  var blocks = {};
  blocks.returns = formatReturnDetectionsTier(returnDetections, 4);
  blocks.silent = formatSilentAttractorsTier(corpusArcs, 5);
  blocks.inter_session = formatInterSessionSilenceTier(corpusArcs);
  blocks.term_arcs = formatCorpusTermArcsTier(corpusArcs, 5);
  blocks.geometry_delta = blocks.returns;
  if (synapse && synapse.perpetual_orbit_terms && synapse.perpetual_orbit_terms.length) {
    blocks.perpetual_orbit = formatWitnessPerpetualOrbitTier(synapse.perpetual_orbit_terms);
  }
  if (synapse && synapse.elaboration_delta) {
    blocks.elaboration_delta = formatWitnessElaborationTier(synapse.elaboration_delta);
  }
  blocks.graduation_quiet = formatWitnessGraduationQuietTier();
  blocks.signal_reality = formatWitnessSignalRealityTier(sorted, fastMapById);
  if (synapse && synapse.open_bridges && synapse.open_bridges.length && NQ_WITNESS_FLAGS.bridges !== false) {
    var allBr = await dbGetAll('bridge_rows');
    var openIds = {};
    synapse.open_bridges.forEach(function (ob) { openIds[ob.id] = true; });
    var openRows = allBr.filter(function (br) { return openIds[br.id] || br.status === 'open'; });
    blocks.open_bridges = formatWitnessOpenBridgesTier(openRows);
  }
  var mappedCount = 0;
  fastMapById.forEach(function () { mappedCount++; });
  var rollup = '── ARCHIVE ROLLUP ──\n\n';
  rollup += 'Fast-mapped discourses: ' + mappedCount + ' / ' + discs.length + '\n';
  var allTerms = {};
  for (var ri = 0; ri < sorted.length; ri++) {
    var rfm = fastMapById.get(sorted[ri].id);
    if (rfm && rfm.key_terms) {
      for (var ti = 0; ti < Math.min(5, rfm.key_terms.length); ti++) {
        var term = rfm.key_terms[ti].term;
        if (!allTerms[term]) allTerms[term] = 0;
        allTerms[term]++;
      }
    }
  }
  var recurring = Object.keys(allTerms).filter(function (t) { return allTerms[t] >= 3; }).sort(function (a, b) { return allTerms[b] - allTerms[a]; }).slice(0, 8);
  if (recurring.length) {
    rollup += 'Recurring terms (3+ discourses): ' + recurring.map(function (t) { return '"' + t + '" (' + allTerms[t] + ')'; }).join(', ') + '\n';
  }
  var arcs = [];
  fastMapById.forEach(function (fm) {
    if (fm.emotional_arc && fm.emotional_arc.direction) arcs.push(fm.emotional_arc);
  });
  if (arcs.length >= 3) {
    var resolved = arcs.filter(function (a) { return a.tension_shift < -0.01; }).length;
    var escalated = arcs.filter(function (a) { return a.tension_shift > 0.01; }).length;
    var flat = arcs.filter(function (a) { return Math.abs(a.tension_shift) <= 0.01; }).length;
    rollup += 'Arc patterns: ' + resolved + ' resolving · ' + escalated + ' escalating · ' + flat + ' flat\n';
  }
  var tier1Count = Math.min(3, sorted.length);
  if (discs.length > tier1Count) {
    rollup += 'Older discourses (' + (discs.length - tier1Count) + ') omitted from detail; see rollup + recent three above.\n';
  }
  rollup += '\n';
  blocks.rollup = rollup;
  return blocks;
}

function assembleGuardianTier4(synapse, blocks) {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.wire === false || !synapse) {
    var legacy = (blocks.returns || '') + (blocks.silent || '') + (blocks.inter_session || '') +
      (blocks.term_arcs || '') + (blocks.rollup || '');
    return legacy;
  }
  var profile = getWitnessPostureProfile(synapse);
  var order = getWitnessTier4BlockOrder(profile, synapse);
  var tier4 = formatWitnessSaccadeTier(synapse.saccade_log);
  var usedReturns = false;
  for (var i = 0; i < order.length; i++) {
    var key = order[i];
    if (key === 'geometry_delta' && usedReturns) continue;
    if (key === 'returns') usedReturns = true;
    if (blocks[key]) tier4 += blocks[key];
  }
  return tier4;
}

function signalKeysFromLog(log, fastMap) {
  var terms = parseFastMapKeyTermStrings(fastMap).slice(0, 6);
  if (!terms.length && log.theory_one_line) {
    var words = String(log.theory_one_line).toLowerCase().match(/[a-z]{4,}/g) || [];
    terms = words.slice(0, 4);
  }
  var discourseIds = log.primary_discourse_id ? [log.primary_discourse_id] : [];
  return { terms: terms, discourse_ids: discourseIds };
}

async function openBridgeRow(sourceLog, userAction, userNote) {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.bridges === false) return null;
  var fm = null;
  if (sourceLog.primary_discourse_id) {
    fm = await dbGet('guardian_summaries', sourceLog.primary_discourse_id);
  }
  var openSame = (await dbGetAll('bridge_rows')).filter(function (br) {
    return br.status === 'open' && br.source_log_id === sourceLog.id;
  });
  if (openSame.length) return openSame[0];
  var keys = signalKeysFromLog(sourceLog, fm);
  var geom = buildGeometrySnapshot(sourceLog.primary_discourse_id, fm);
  var row = {
    id: 'br_' + Date.now(),
    opened_at: Date.now(),
    source_log_id: sourceLog.id,
    prior_theory: sourceLog.theory_one_line || '',
    user_action: userAction,
    user_note: userNote || '',
    signal_keys: JSON.stringify(keys),
    geometry_at_open: JSON.stringify(geom || {}),
    status: 'open',
    checks: 0,
    last_check_at: Date.now(),
    closed_at: null,
    closure_reason: null
  };
  await dbPut('bridge_rows', row);
  await appendWitnessLedgerLink('bridge_open', row.id, row);
  await refreshWitnessSubstrate();
  var synAfter = getSynapseSnapshot();
  if (typeof w5PinOnBridgeOpen === 'function') await w5PinOnBridgeOpen(synAfter, row);
  return row;
}

async function closeBridgeRow(row, status, reason) {
  row.status = status;
  row.closure_reason = reason || status;
  row.closed_at = Date.now();
  await dbPut('bridge_rows', row);
  await appendWitnessLedgerLink('bridge_close', row.id + '_close_' + (row.closed_at || Date.now()), row);
  if (status === 'relapsed' && typeof w5PinOnBridgeRelapse === 'function') {
    var synRel = getSynapseSnapshot();
    if (!synRel) {
      try { synRel = await refreshWitnessSubstrate(); } catch (ePin) {}
    }
    await w5PinOnBridgeRelapse(synRel, row);
  }
}

async function evaluateBridgeRelapse() {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.bridges === false) return;
  var corpus = await loadWitnessCorpusMaps();
  var arcsMap = computeCorpusTermArcs(corpus.discs, corpus.fastMapById);
  var perpetual = detectPerpetualOrbitTerms(arcsMap);
  var rows = await dbGetAll('bridge_rows');
  var now = Date.now();
  for (var i = 0; i < rows.length; i++) {
    var br = rows[i];
    if (br.status !== 'open') continue;
    br.checks = (br.checks || 0) + 1;
    br.last_check_at = now;
    var keys = parseJsonField(br.signal_keys, {});
    var terms = keys.terms || [];
    var termRelapse = terms.some(function (t) { return perpetual.indexOf(String(t).toLowerCase()) !== -1; });
    var shifted = terms.some(function (t) {
      var arc = arcsMap[String(t).toLowerCase()];
      return arc && arc.register_shift;
    });
    if (br.user_action === 'correct' && shifted) {
      await closeBridgeRow(br, 'verified', 'geometry_shift');
      continue;
    }
    if (br.user_action === 'reject' && !termRelapse && br.checks >= 2) {
      await closeBridgeRow(br, 'verified', 'reject_hold');
      continue;
    }
    if (termRelapse && br.checks >= 2) {
      await closeBridgeRow(br, 'relapsed', 'attractor_returned');
      continue;
    }
    if (br.checks >= BRIDGE_MAX_CHECKS || (now - (br.opened_at || now)) > BRIDGE_MAX_OPEN_MS) {
      await closeBridgeRow(br, 'relapsed', 'window_exhausted');
      continue;
    }
    await dbPut('bridge_rows', br);
  }
}

async function refreshWitnessSubstrate() {
  if (!isWitnessSubstrateEnabled()) return null;
  if (typeof w5BackfillPinsFromBridges === 'function') {
    try { await w5BackfillPinsFromBridges(); } catch (eBf) { console.warn('[W5] backfill:', eBf); }
  }
  try {
    await evaluateBridgeRelapse();
  } catch (eBr) {
    console.warn('[Witness] bridge evaluate:', eBr);
  }
  try {
    return await buildSynapseSnapshot();
  } catch (eSyn) {
    console.warn('[Witness] synapse:', eSyn);
    return null;
  }
}

async function renderWitnessProcessPanel() {
  var panel = document.getElementById('witness-process-content');
  if (!panel || !isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.process_panel === false) return;
  if (isWitnessLedgerChainEnabled()) {
    await ensureWitnessLedgerVerified();
  }
  var syn = getSynapseSnapshot();
  if (!syn) syn = await refreshWitnessSubstrate();
  var bridges = await dbGetAll('bridge_rows');
  var openN = bridges.filter(function (b) { return b.status === 'open'; }).length;
  var html = '';
  if (!syn) {
    panel.innerHTML = '<div class="witness-process-line muted">Substrate not built yet.</div>';
    return;
  }
  if (NQ_WITNESS_FLAGS.weather_cues !== false && typeof WitnessWeather !== 'undefined') {
    var wctx = buildWitnessWeatherContext(syn);
    var weather = WitnessWeather.computeWeatherState(syn, wctx);
    var retiredKeys = loadWitnessCueRetired();
    var cues = WitnessWeather.generateWitnessCues(syn, {
      context: wctx,
      retiredKeys: retiredKeys
    });
    html += '<div class="witness-process-section witness-weather-section"><div class="witness-process-h">Weather</div>';
    if (weather.label) {
      html += '<div class="witness-weather-line">' + escHtml(weather.label) + '</div>';
    }
    html += '<div class="witness-process-line witness-weather-status muted">' +
      escHtml(formatWitnessWeatherSubstrateLine(weather, cues, syn, retiredKeys)) + '</div>';
    if (cues.length) {
      html += '<div class="witness-cues-section-inner">';
      cues.forEach(function (cue) {
        html += '<div class="witness-cue-row">';
        html += '<p class="witness-cue-text">' + escHtml(cue.question_text) + '</p>';
        html += '<button type="button" class="witness-cue-dismiss" data-cue-type="' + escAttr(cue.source_type) +
          '" data-cue-term="' + escAttr(cue.source_term) + '">release</button>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
  }
  var cb = syn.corpus_baseline || {};
  html += '<div class="witness-process-section"><div class="witness-process-h">Baseline</div>';
  html += '<div class="witness-process-line">baseline: ' + (cb.total_discourses != null ? cb.total_discourses : '—') +
    ' discourses · ' + (cb.organic_writes_since != null ? cb.organic_writes_since : '0') + ' organic since</div></div>';
  if (typeof w5GetAllPins === 'function') {
    var w5Pins = await w5GetAllPins();
    html += '<div class="witness-process-section"><div class="witness-process-h">Anchors held</div>';
    html += '<div class="witness-process-line">' + escHtml(w5FormatAnchorsHeldLine(w5Pins)) + '</div>';
    if (w5Pins.length && typeof w5FormatAnchorDiffHtml === 'function') {
      html += w5FormatAnchorDiffHtml(syn, w5Pins);
    }
    html += '</div>';
  }
  var formingLine = '';
  if (syn.threshold_engine && syn.threshold_engine.forming && typeof w5FormatFormingLine === 'function') {
    formingLine = w5FormatFormingLine(syn.threshold_engine.forming);
  }
  if (formingLine) {
    html += '<div class="witness-process-section"><div class="witness-process-h">Forming</div>';
    html += '<div class="witness-process-line muted">' + escHtml(formingLine) + '</div></div>';
  }
  var pv = syn.posture_vector || {};
  html += '<div class="witness-process-section"><div class="witness-process-h">Posture</div>';
  html += '<div class="witness-process-line">coherence ' + (pv.coherence != null ? pv.coherence : '—') +
    ' · resistance ' + (pv.resistance != null ? pv.resistance : '—') +
    ' · self-ref ' + (pv.self_ref_ratio != null ? pv.self_ref_ratio : '—') +
    ' · attractor ' + (pv.attractor_concentration != null ? pv.attractor_concentration : '—') + '</div></div>';
  html += '<div class="witness-process-section"><div class="witness-process-h">Invoke gate</div>';
  if (syn.local_pass && syn.local_pass.invoke_denied) {
    html += '<div class="witness-process-line witness-process-deny">denied — ' + escHtml(syn.local_pass.deny_reason || 'thin_map') + '</div>';
  } else if (syn.local_pass && syn.local_pass.graduation_quiet) {
    html += '<div class="witness-process-line">graduation quiet — map stable; voluntary summon only</div>';
  } else {
    html += '<div class="witness-process-line">open — voluntary summon available</div>';
  }
  html += '</div>';
  if (NQ_WITNESS_FLAGS.wire !== false) {
    var prof = getWitnessPostureProfile(syn);
    html += '<div class="witness-process-section"><div class="witness-process-h">Wire (W2)</div>';
    html += '<div class="witness-process-line">profile: ' + escHtml(prof) + ' · wire order: ' +
      escHtml(getWitnessStripReadOrder(prof, syn).join(' → ')) + '</div>';
    if (syn.elaboration_delta) {
      html += '<div class="witness-process-line">elaboration ×' + syn.elaboration_delta.ratio +
        (syn.elaboration_delta.spike ? ' (spike)' : '') + '</div>';
    } else {
      html += '<div class="witness-process-line muted">no elaboration delta — no open bridge window</div>';
    }
    html += '</div>';
  }
  html += '<div class="witness-process-section"><div class="witness-process-h">Saccade</div>';
  html += '<div class="witness-process-line">' + escHtml(formatSubstrateSaccadeLine(syn.saccade_log)) + '</div></div>';
  if (syn.w5_confidence && typeof w5FormatConfidenceLine === 'function') {
    html += '<div class="witness-process-section"><div class="witness-process-h">Witness confidence</div>';
    html += '<div class="witness-process-line muted">' + escHtml(w5FormatConfidenceLine(syn.w5_confidence)) + '</div></div>';
  }
  if (syn.w5_encoding_mismatch && typeof w5FormatEncodingMismatchLine === 'function') {
    html += '<div class="witness-process-section"><div class="witness-process-h">Encoding context</div>';
    html += '<div class="witness-process-line">' + escHtml(w5FormatEncodingMismatchLine(syn.w5_encoding_mismatch)) + '</div></div>';
  }
  html += '<div class="witness-process-section"><div class="witness-process-h">Bridges</div>';
  if (openN || bridges.length) {
    html += '<div class="witness-process-line">' + openN + ' open · ' + bridges.length + ' total</div>';
  } else {
    html += '<div class="witness-process-line muted">0 open · 0 total — correction loop dormant</div>';
  }
  html += '</div>';
  html += '<div class="witness-process-section"><div class="witness-process-h">Perpetual orbit</div>';
  if (syn.perpetual_orbit_terms && syn.perpetual_orbit_terms.length) {
    html += '<div class="witness-process-line">' + escHtml(syn.perpetual_orbit_terms.join(', ')) + '</div>';
  } else {
    html += '<div class="witness-process-line muted">no orbit yet — need 3+ cross-discourse appearances</div>';
  }
  html += '</div>';
  html += '<div class="witness-process-section"><div class="witness-process-h">Anomalies</div>';
  if (syn.anomalies && syn.anomalies.length) {
    html += '<div class="witness-process-line">' + escHtml(syn.anomalies.slice(0, 8).join(' · ')) + '</div>';
  } else {
    html += '<div class="witness-process-line muted">no anomalies — map reading clean</div>';
  }
  html += '</div>';
  var hl = formatHalfLifePanelLines(syn.half_life);
  html += '<div class="witness-process-section"><div class="witness-process-h">Half-life</div>';
  html += '<div class="witness-process-line">top: ' + escHtml(hl.top) + '</div>';
  html += '<div class="witness-process-line">decayed: ' + escHtml(hl.bottom) + '</div></div>';
  if (isWitnessLedgerChainEnabled()) {
    html += '<div class="witness-process-section"><div class="witness-process-h">Ledger chain</div>';
    html += '<div class="witness-process-line">' + escHtml(formatWitnessLedgerStatusLine()) + '</div></div>';
  }
  var recent = bridges.slice().sort(function (a, b) { return (b.opened_at || 0) - (a.opened_at || 0); }).slice(0, 4);
  html += '<div class="witness-process-section"><div class="witness-process-h">Recent bridges</div>';
  if (recent.length) {
    recent.forEach(function (br) {
      html += '<div class="witness-process-line">' + escHtml(br.status) + ' · ' + escHtml(br.user_action || '') +
        (br.prior_theory ? ' — ' + escHtml(String(br.prior_theory).slice(0, 60)) : '') + '</div>';
    });
  } else {
    html += '<div class="witness-process-line muted">none yet — summon friction unlocks mythril</div>';
  }
  html += '</div>';
  html += '<div class="witness-process-section witness-process-footer"><div class="witness-process-line muted">synapse built: ' +
    escHtml(formatSynapseAgeRelative(syn.built_at)) + '</div>';
  if (typeof w5FormatContainerAckLine === 'function') {
    html += '<div class="witness-process-line muted witness-umwelt-line">' + escHtml(w5FormatContainerAckLine()) + '</div>';
  }
  html += '</div>';
  panel.innerHTML = html;
  panel.querySelectorAll('.witness-cue-dismiss').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dismissWitnessCue(btn.getAttribute('data-cue-type'), btn.getAttribute('data-cue-term'));
    });
  });
}

async function dogfoodWitnessWeather() {
  if (typeof WitnessWeather === 'undefined') {
    console.warn('[Witness] witness-weather.js not loaded');
    return null;
  }
  var syn = getSynapseSnapshot();
  if (!syn) syn = await refreshWitnessSubstrate();
  if (!syn) return null;
  var ctx = buildWitnessWeatherContext(syn);
  var weather = WitnessWeather.computeWeatherState(syn, ctx);
  var cues = WitnessWeather.generateWitnessCues(syn, { context: ctx, retiredKeys: loadWitnessCueRetired() });
  console.log('[Witness] weather', weather, 'cues', cues);
  return { weather: weather, cues: cues, synapse: syn };
}
window.dogfoodWitnessWeather = dogfoodWitnessWeather;

/* ── WP1 threshold engine (console-only — no panel UI yet) ── */
var WITNESS_THRESHOLD_QUEUE_LS = 'nq_witness_threshold_queue';
var WITNESS_THRESHOLD_LAST_FIRE_LS = 'nq_witness_threshold_last_fire';
var WITNESS_THRESHOLD_PRIORITY = [
  'thin_map',
  'bridge_relapsed',
  'denial_sediment',
  'half_life_resurgence',
  'resistance_shift',
  'orbit_deepened',
  'graduation_quiet'
];

function witnessThresholdPriorityIndex(id) {
  var i = WITNESS_THRESHOLD_PRIORITY.indexOf(id);
  return i === -1 ? 999 : i;
}

function loadWitnessThresholdQueue() {
  try {
    return JSON.parse(localStorage.getItem(WITNESS_THRESHOLD_QUEUE_LS) || '[]');
  } catch (eQ) {
    return [];
  }
}

function saveWitnessThresholdQueue(queue) {
  try {
    localStorage.setItem(WITNESS_THRESHOLD_QUEUE_LS, JSON.stringify(queue));
  } catch (eSq) {}
}

function detectWitnessThresholdCandidates(synapse, prevSyn, bridgeRows, arcsMap) {
  if (!synapse) return [];
  var out = [];
  var lp = synapse.local_pass || {};
  if (lp.invoke_denied) {
    out.push({ id: 'thin_map', detail: lp.deny_reason || 'thin_map' });
  }
  var since = (prevSyn && prevSyn.built_at) || (synapse.built_at - 86400000);
  (bridgeRows || []).forEach(function (br) {
    if (br.status === 'relapsed' && (br.closed_at || 0) >= since) {
      out.push({ id: 'bridge_relapsed', detail: br.closure_reason || 'relapsed', bridge_id: br.id });
    }
  });
  if ((synapse.denial_sediment_terms || []).length) {
    out.push({
      id: 'denial_sediment',
      detail: synapse.denial_sediment_terms.slice(0, 3).join(', ')
    });
  }
  var resurgent = ((synapse.half_life && synapse.half_life.resurgent) || []).filter(function (t) {
    return !isWitnessCorpusNoiseTerm(t);
  });
  if (resurgent.length) {
    out.push({ id: 'half_life_resurgence', detail: resurgent.slice(0, 3).join(', ') });
  }
  var res = (synapse.posture_vector && synapse.posture_vector.resistance) || 0;
  var prevRes = prevSyn && prevSyn.posture_vector ? prevSyn.posture_vector.resistance : null;
  if (prevRes == null) {
    try {
      var wctx = JSON.parse(localStorage.getItem(WITNESS_WEATHER_CTX_LS) || '{}');
      if (wctx.resistance != null) prevRes = wctx.resistance;
    } catch (eW) {}
  }
  if (prevRes != null && Math.abs(res - prevRes) >= 0.3) {
    out.push({ id: 'resistance_shift', detail: 'Δ ' + (res - prevRes).toFixed(2) });
  }
  var deepOrbits = [];
  Object.keys(arcsMap || {}).forEach(function (term) {
    if (isWitnessCorpusNoiseTerm(term)) return;
    var arc = arcsMap[term];
    if (arc && arc.appearances.length >= 5) deepOrbits.push(term);
  });
  if (deepOrbits.length) {
    out.push({ id: 'orbit_deepened', detail: deepOrbits.slice(0, 3).join(', ') });
  }
  if (lp.graduation_quiet) {
    out.push({
      id: 'graduation_quiet',
      detail: 'coherence ' + ((synapse.posture_vector && synapse.posture_vector.coherence) || 0)
    });
  }
  return out;
}

function pickWitnessThreshold(candidates) {
  if (!candidates.length) return { picked: null, queued: [] };
  var sorted = candidates.slice().sort(function (a, b) {
    return witnessThresholdPriorityIndex(a.id) - witnessThresholdPriorityIndex(b.id);
  });
  return { picked: sorted[0], queued: sorted.slice(1) };
}

function runWitnessThresholdEngine(synapse, prevSyn, bridgeRows, arcsMap) {
  var candidates = detectWitnessThresholdCandidates(synapse, prevSyn, bridgeRows, arcsMap);
  var forming = [];
  var eligible = candidates;
  if (typeof w5FilterThresholdCandidates === 'function') {
    var gated = w5FilterThresholdCandidates(candidates);
    forming = gated.forming;
    eligible = gated.eligible;
  }
  var pick = pickWitnessThreshold(eligible);
  var mergedQueue = pick.queued.concat(loadWitnessThresholdQueue().filter(function (q) {
    return !candidates.some(function (c) { return c.id === q.id; });
  }));
  saveWitnessThresholdQueue(mergedQueue.slice(0, 12));
  if (pick.picked) {
    try {
      localStorage.setItem(WITNESS_THRESHOLD_LAST_FIRE_LS, JSON.stringify({
        id: pick.picked.id,
        at: Date.now(),
        detail: pick.picked.detail
      }));
    } catch (eLf) {}
  }
  return { candidates: candidates, picked: pick.picked, queue: mergedQueue.slice(0, 12), forming: forming };
}

async function dogfoodWitnessThresholds() {
  var syn = getSynapseSnapshot();
  if (!syn) syn = await refreshWitnessSubstrate();
  if (!syn) return null;
  var corpus = await loadWitnessCorpusMaps();
  var arcsMap = computeCorpusTermArcs(corpus.discs, corpus.fastMapById);
  var bridgeRows = await dbGetAll('bridge_rows');
  var live = runWitnessThresholdEngine(syn, null, bridgeRows, arcsMap);
  var lastFire = null;
  try {
    lastFire = JSON.parse(localStorage.getItem(WITNESS_THRESHOLD_LAST_FIRE_LS) || 'null');
  } catch (eLf) {}
  var out = {
    synapse_built_at: syn.built_at,
    stored: syn.threshold_engine || null,
    live: live,
    queue: loadWitnessThresholdQueue(),
    last_fire: lastFire
  };
  console.log('[Witness] thresholds', out);
  return out;
}
window.dogfoodWitnessThresholds = dogfoodWitnessThresholds;

var _witnessDetailLog = null;
var _witnessSummonLog = null;

function hideWitnessSummonBridgePrompt() {
  _witnessSummonLog = null;
  var el = document.getElementById('witness-summon-bridge-prompt');
  if (!el) return;
  el.classList.add('hidden');
  el.innerHTML = '';
}

function showWitnessSummonBridgePrompt(log) {
  if (!isWitnessSubstrateEnabled() || NQ_WITNESS_FLAGS.bridges === false) return;
  if (!log || !log.theory_one_line) return;
  if (log.log_type === 'auto_invoke' || log.auto_invoked) return;
  var el = document.getElementById('witness-summon-bridge-prompt');
  if (!el) return;
  _witnessSummonLog = log;
  el.innerHTML = '<div class="witness-summon-bridge-line">theory logged · correct or reject?</div>' +
    '<div class="witness-bridge-actions">' +
    '<button type="button" class="witness-bridge-btn" data-witness-action="correct">Correct</button>' +
    '<button type="button" class="witness-bridge-btn" data-witness-action="reject">Reject</button>' +
    '</div>';
  el.classList.remove('hidden');
  el.querySelectorAll('[data-witness-action]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var act = btn.getAttribute('data-witness-action');
      if (act === 'correct' || act === 'reject') void handleWitnessBridgeAction(act);
    });
  });
}

async function handleWitnessBridgeAction(action) {
  var log = _witnessDetailLog || _witnessSummonLog;
  if (!log) return;
  await openBridgeRow(log, action, '');
  showToast(action === 'correct' ? 'Bridge opened (correct) ◆' : 'Bridge opened (reject) ◆');
  hideWitnessSummonBridgePrompt();
  closeGuardianLogDetail();
  void renderWitnessProcessPanel();
}
