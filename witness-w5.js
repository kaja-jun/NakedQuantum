/* jshint esversion: 11 */
/* global dbGetAll, dbPut, localStorage, WitnessWeather, NQ_DEV_MODE */
/**
 * W5 biological limits — PWA passes (E-lite, F, C, I, A-scout).
 * See w5-biological-limits-blueprint.md.
 * Loads after witness-synapse.js.
 */

var W5_PERSISTENCE_LS = 'nq_w5_threshold_persistence';
var W5_PERSISTENCE_THRESHOLD = 2;
var W5_BACKFILL_LS = 'nq_w5_pin_backfill_done';
var W5_FIRST_ORBIT_LS = 'nq_w5_first_orbit_pinned';
var W5_CONFIDENCE_MIN_N = 10;
var W5_CLUSTER_GAP_MS = 21 * 86400000;
var W5_LEXICAL_MIN_APPEARANCES = 5;
var W5_LEXICAL_MIN_SPAN_DAYS = 30;
var W5_JACCARD_DRIFT_THRESHOLD = 0.35;

function isW5Enabled() {
  return typeof isWitnessSubstrateEnabled === 'function' && isWitnessSubstrateEnabled();
}

function w5HalfLifeTopTerms(halfLife, n) {
  n = n || 5;
  var terms = (halfLife && halfLife.terms) || {};
  return Object.keys(terms).sort(function (a, b) {
    return (terms[b].weight || 0) - (terms[a].weight || 0);
  }).slice(0, n);
}

function w5BuildClusterSignature(synapse) {
  var orbit = (synapse && synapse.perpetual_orbit_terms) || [];
  var top = w5HalfLifeTopTerms(synapse && synapse.half_life, 5);
  var clusterTerms = orbit.filter(function (t) { return top.indexOf(t) !== -1; });
  if (!clusterTerms.length) clusterTerms = top.slice(0, 3).concat(orbit.slice(0, 2));
  clusterTerms = clusterTerms.filter(function (t, i, arr) { return arr.indexOf(t) === i; }).sort();
  var bucket = null;
  return {
    cluster_id: w5ComputeClusterId(clusterTerms, bucket),
    cluster_terms: clusterTerms,
    watcher_bucket: bucket,
    half_life_top: top
  };
}

function w5ComputeClusterId(clusterTerms, watcherBucket) {
  var key = (clusterTerms || []).join('|') + ':' + (watcherBucket || '');
  var h = 0;
  for (var i = 0; i < key.length; i++) {
    h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  }
  return 'cl_' + Math.abs(h).toString(36);
}

function w5ParsePinJson(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

async function w5GetAllPins() {
  if (!isW5Enabled()) return [];
  try {
    var rows = await dbGetAll('pinned_snapshots');
    return (rows || []).sort(function (a, b) { return (a.pinned_at || 0) - (b.pinned_at || 0); });
  } catch (e) {
    return [];
  }
}

function w5WeatherLabelForSynapse(synapse) {
  if (typeof WitnessWeather === 'undefined' || typeof buildWitnessWeatherContext !== 'function') return '';
  try {
    var wctx = buildWitnessWeatherContext(synapse);
    var w = WitnessWeather.computeWeatherState(synapse, wctx);
    return w.label || w.state || '';
  } catch (eW) {
    return '';
  }
}

async function w5PinSnapshot(triggerCondition, synapse, meta) {
  if (!isW5Enabled() || !synapse) return null;
  meta = meta || {};
  var sig = w5BuildClusterSignature(synapse);
  var row = {
    id: 'ps_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    pinned_at: Date.now(),
    trigger_condition: triggerCondition,
    posture_vector: JSON.stringify(synapse.posture_vector || {}),
    top_terms: JSON.stringify(w5HalfLifeTopTerms(synapse.half_life, 5)),
    orbit_terms: JSON.stringify(synapse.perpetual_orbit_terms || []),
    open_bridges: synapse.open_bridges_count || 0,
    weather_state: w5WeatherLabelForSynapse(synapse),
    cluster_signature: JSON.stringify(sig)
  };
  if (meta.ref_id) row.ref_id = meta.ref_id;
  await dbPut('pinned_snapshots', row);
  if (NQ_DEV_MODE) console.log('[W5] pinned', triggerCondition, row.id);
  return row;
}

async function w5BackfillPinsFromBridges() {
  if (!isW5Enabled()) return;
  try {
    if (localStorage.getItem(W5_BACKFILL_LS) === '1') return;
  } catch (eLs) { return; }
  var existing = await w5GetAllPins();
  if (existing.length) {
    try { localStorage.setItem(W5_BACKFILL_LS, '1'); } catch (eDone) {}
    return;
  }
  var bridges = await dbGetAll('bridge_rows');
  for (var i = 0; i < bridges.length; i++) {
    var br = bridges[i];
    var geom = w5ParsePinJson(br.geometry_at_open);
    if (!geom) continue;
    var pseudoSyn = {
      posture_vector: {},
      perpetual_orbit_terms: geom.orbit_terms || [],
      half_life: { terms: {} },
      open_bridges_count: 0
    };
    (geom.orbit_terms || []).forEach(function (t) {
      pseudoSyn.half_life.terms[t] = { weight: 1 };
    });
    await w5PinSnapshot('bridge_open_backfill', pseudoSyn, { ref_id: br.id });
  }
  try { localStorage.setItem(W5_BACKFILL_LS, '1'); } catch (eFin) {}
}

async function w5MaybePinOnSynapseBuild(synapse, prevSyn, bridgeRows, arcsMap) {
  if (!isW5Enabled() || !synapse) return;
  var lp = synapse.local_pass || {};
  if (lp.graduation_quiet && !(prevSyn && prevSyn.local_pass && prevSyn.local_pass.graduation_quiet)) {
    await w5PinSnapshot('graduation_quiet', synapse);
  }
  var res = (synapse.posture_vector && synapse.posture_vector.resistance) || 0;
  var prevRes = prevSyn && prevSyn.posture_vector ? prevSyn.posture_vector.resistance : null;
  if (prevRes != null && Math.abs(res - prevRes) >= 0.3) {
    var resistKey = prevRes.toFixed(2) + '->' + res.toFixed(2);
    var doResistPin = true;
    try { doResistPin = localStorage.getItem('nq_w5_resist_pin') !== resistKey; } catch (eRp) {}
    if (doResistPin) {
      await w5PinSnapshot('resistance_shift', synapse);
      try { localStorage.setItem('nq_w5_resist_pin', resistKey); } catch (eRs) {}
    }
  }
  if (synapse.perpetual_orbit_terms && synapse.perpetual_orbit_terms.length) {
    var firstOrbit = false;
    try { firstOrbit = localStorage.getItem(W5_FIRST_ORBIT_LS) !== '1'; } catch (eFo) {}
    var hadOrbit = prevSyn && prevSyn.perpetual_orbit_terms && prevSyn.perpetual_orbit_terms.length;
    if (firstOrbit || !hadOrbit) {
      await w5PinSnapshot('first_perpetual_orbit', synapse);
      try { localStorage.setItem(W5_FIRST_ORBIT_LS, '1'); } catch (eSet) {}
    }
  }
  var resurgent = (synapse.half_life && synapse.half_life.resurgent) || [];
  for (var ri = 0; ri < resurgent.length; ri++) {
    var term = resurgent[ri];
    if (typeof isWitnessCorpusNoiseTerm === 'function' && isWitnessCorpusNoiseTerm(term)) continue;
    var arc = arcsMap && arcsMap[term];
    if (!arc || arc.appearances.length < 2) continue;
    var prev = arc.appearances[arc.appearances.length - 2];
    var last = arc.appearances[arc.appearances.length - 1];
    var gapDays = ((last.date || 0) - (prev.date || 0)) / 86400000;
    if (gapDays >= 30) {
      var surgeKey = 'nq_w5_resurge_pin_' + term;
      var doSurge = true;
      try { doSurge = localStorage.getItem(surgeKey) !== '1'; } catch (eSk) {}
      if (doSurge) {
        await w5PinSnapshot('half_life_resurgence:' + term, synapse);
        try { localStorage.setItem(surgeKey, '1'); } catch (eSs) {}
      }
    }
  }
}

async function w5PinOnBridgeOpen(synapse, bridgeRow) {
  if (!synapse) return;
  await w5PinSnapshot('bridge_open', synapse, { ref_id: bridgeRow && bridgeRow.id });
}

async function w5PinOnBridgeRelapse(synapse, bridgeRow) {
  if (!synapse) return;
  await w5PinSnapshot('bridge_relapse', synapse, { ref_id: bridgeRow && bridgeRow.id });
}

function w5LoadPersistence() {
  try {
    return JSON.parse(localStorage.getItem(W5_PERSISTENCE_LS) || '{}');
  } catch (e) {
    return {};
  }
}

function w5SavePersistence(obj) {
  try {
    localStorage.setItem(W5_PERSISTENCE_LS, JSON.stringify(obj));
  } catch (eS) {}
}

function w5FilterThresholdCandidates(candidates) {
  var persist = w5LoadPersistence();
  var forming = [];
  var eligible = [];
  var ids = {};
  (candidates || []).forEach(function (c) { ids[c.id] = true; });
  for (var i = 0; i < (candidates || []).length; i++) {
    var c = candidates[i];
    if (c.id === 'bridge_relapsed') {
      eligible.push(c);
      persist[c.id] = W5_PERSISTENCE_THRESHOLD;
      continue;
    }
    var count = (persist[c.id] || 0) + 1;
    persist[c.id] = count;
    if (count < W5_PERSISTENCE_THRESHOLD) {
      forming.push({ id: c.id, count: count, need: W5_PERSISTENCE_THRESHOLD });
    } else {
      eligible.push(c);
    }
  }
  Object.keys(persist).forEach(function (k) {
    if (!ids[k] && persist[k] > 0) persist[k] = Math.max(0, persist[k] - 1);
  });
  w5SavePersistence(persist);
  return { forming: forming, eligible: eligible };
}

function w5MapPredictionTagToClass(tag) {
  if (tag === 'orbit_persists') return 'orbit';
  if (tag === 'next_escalating' || tag === 'next_arc_flat' || tag === 'silence_holds') return 'tension';
  if (tag === 'term_resurges') return 'resurgence';
  if (tag === 'correction_holds') return 'bridge';
  return 'tension';
}

async function w5ComputePredictionConfidence(saccadeLog) {
  var classes = {
    tension: { hits: 0, total: 0 },
    orbit: { hits: 0, total: 0 },
    resurgence: { hits: 0, total: 0 },
    bridge: { hits: 0, total: 0 }
  };
  var logs = await dbGetAll('guardian_logs');
  (logs || []).forEach(function (l) {
    if (!l.prediction_tag || !l.prediction_outcome || l.prediction_outcome === 'unscored') return;
    var cls = w5MapPredictionTagToClass(l.prediction_tag);
    if (!classes[cls]) return;
    classes[cls].total++;
    if (l.prediction_outcome === 'hit') classes[cls].hits++;
    else if (l.prediction_outcome === 'partial') classes[cls].hits += 0.5;
  });
  var blindPenalty = (saccadeLog && saccadeLog.blind_spot) ? 0.1 : 0;
  var out = {};
  Object.keys(classes).forEach(function (k) {
    var c = classes[k];
    if (c.total < W5_CONFIDENCE_MIN_N) {
      out[k] = 'calibrating';
    } else {
      var rate = c.hits / c.total;
      if (k === 'orbit' && blindPenalty) rate = Math.max(0, rate - blindPenalty);
      out[k] = parseFloat(rate.toFixed(2));
    }
  });
  out._saccade_blind = !!(saccadeLog && saccadeLog.blind_spot);
  return out;
}

function w5CollectCollocatesForDiscourseIds(discIds, targetTerm, fastMapById, arcsMap) {
  var collocates = {};
  var termLower = String(targetTerm).toLowerCase();
  for (var i = 0; i < discIds.length; i++) {
    var fm = fastMapById.get(discIds[i]);
    if (!fm) continue;
    var terms = [];
    if (typeof parseFastMapKeyTermStrings === 'function') {
      terms = parseFastMapKeyTermStrings(fm);
    }
    terms.forEach(function (t) {
      if (t === termLower) return;
      if (typeof isWitnessCorpusNoiseTerm === 'function' && isWitnessCorpusNoiseTerm(t)) return;
      collocates[t] = (collocates[t] || 0) + 1;
    });
  }
  return Object.keys(collocates).sort(function (a, b) {
    return (collocates[b] || 0) - (collocates[a] || 0);
  }).slice(0, 8);
}

function w5JaccardSimilarity(setA, setB) {
  if (!setA.length && !setB.length) return 1;
  var a = {};
  setA.forEach(function (x) { a[x] = 1; });
  var inter = 0;
  setB.forEach(function (x) {
    if (a[x]) inter++;
  });
  var union = setA.length + setB.length - inter;
  return union ? inter / union : 0;
}

function w5DetectLexicalArchaeology(arcsMap, fastMapById) {
  var drifts = [];
  Object.keys(arcsMap || {}).forEach(function (term) {
    if (typeof isWitnessCorpusNoiseTerm === 'function' && isWitnessCorpusNoiseTerm(term)) return;
    var arc = arcsMap[term];
    if (!arc || !arc.appearances || arc.appearances.length < W5_LEXICAL_MIN_APPEARANCES) return;
    var spanDays = (arc.appearances[arc.appearances.length - 1].date - arc.appearances[0].date) / 86400000;
    if (spanDays < W5_LEXICAL_MIN_SPAN_DAYS) return;
    var mid = Math.floor(arc.appearances.length / 2);
    var earlyIds = arc.appearances.slice(0, mid).map(function (a) { return a.discourse_id; });
    var lateIds = arc.appearances.slice(mid).map(function (a) { return a.discourse_id; });
    var earlyCol = w5CollectCollocatesForDiscourseIds(earlyIds, term, fastMapById, arcsMap);
    var lateCol = w5CollectCollocatesForDiscourseIds(lateIds, term, fastMapById, arcsMap);
    var sim = w5JaccardSimilarity(earlyCol, lateCol);
    if (sim < W5_JACCARD_DRIFT_THRESHOLD) {
      drifts.push({
        term: term,
        early_collocates: earlyCol.slice(0, 5),
        late_collocates: lateCol.slice(0, 5),
        jaccard: parseFloat(sim.toFixed(2))
      });
    }
  });
  return drifts;
}

function w5DetectStateDependentMismatch(synapse, pins) {
  if (!synapse || !pins || !pins.length) return null;
  var sig = w5BuildClusterSignature(synapse);
  var now = Date.now();
  var match = null;
  for (var i = pins.length - 1; i >= 0; i--) {
    var pin = pins[i];
    var ps = w5ParsePinJson(pin.cluster_signature);
    if (!ps || ps.cluster_id !== sig.cluster_id) continue;
    if ((now - (pin.pinned_at || 0)) < W5_CLUSTER_GAP_MS) continue;
    match = pin;
    break;
  }
  if (!match) return null;
  var encPosture = w5ParsePinJson(match.posture_vector) || {};
  var nowPosture = synapse.posture_vector || {};
  var dCoh = Math.abs((nowPosture.coherence || 0) - (encPosture.coherence || 0));
  var dRes = Math.abs((nowPosture.resistance || 0) - (encPosture.resistance || 0));
  if (dCoh < 0.25 && dRes < 0.25) return null;
  return {
    cluster_id: sig.cluster_id,
    days_since_pin: Math.floor((now - (match.pinned_at || now)) / 86400000),
    encoding: encPosture,
    now: nowPosture,
    pinned_at: match.pinned_at
  };
}

async function w5EnrichSynapse(synapse, prevSyn, bridgeRows, arcsMap, fastMapById) {
  if (!isW5Enabled() || !synapse) return synapse;
  await w5MaybePinOnSynapseBuild(synapse, prevSyn, bridgeRows, arcsMap);
  var drifts = w5DetectLexicalArchaeology(arcsMap, fastMapById);
  if (drifts.length) {
    synapse.w5_lexical_drifts = drifts;
    drifts.forEach(function (d) {
      synapse.anomalies.push('coordinate_shift:' + d.term);
    });
  }
  var pins = await w5GetAllPins();
  synapse.w5_anchors_count = pins.length;
  synapse.w5_anchors_oldest = pins.length ? pins[0].pinned_at : null;
  var mismatch = w5DetectStateDependentMismatch(synapse, pins);
  if (mismatch) {
    synapse.w5_encoding_mismatch = mismatch;
    synapse.anomalies.push('encoding_context_delta');
  }
  try {
    synapse.w5_confidence = await w5ComputePredictionConfidence(synapse.saccade_log);
  } catch (eC) {
    synapse.w5_confidence = null;
  }
  return synapse;
}

function w5FormatAnchorsHeldLine(pins) {
  pins = pins || [];
  if (!pins.length) return '0 snapshots · none held yet';
  var oldest = pins[0].pinned_at || Date.now();
  var days = Math.floor((Date.now() - oldest) / 86400000);
  return pins.length + ' snapshots · oldest: ' + days + ' days ago';
}

function w5FormatAnchorDiffHtml(synapse, pins) {
  if (!synapse || !pins || !pins.length) return '';
  var sig = w5BuildClusterSignature(synapse);
  var pin = null;
  for (var i = pins.length - 1; i >= 0; i--) {
    var ps = w5ParsePinJson(pins[i].cluster_signature);
    if (ps && ps.cluster_id === sig.cluster_id) { pin = pins[i]; break; }
  }
  if (!pin) pin = pins[pins.length - 1];
  var then = w5ParsePinJson(pin.posture_vector) || {};
  var now = synapse.posture_vector || {};
  function delta(a, b) {
    if (a == null || b == null) return '—';
    var d = parseFloat((b - a).toFixed(2));
    return (d >= 0 ? '+' : '') + d;
  }
  var html = '<div class="w5-anchor-diff">';
  html += '<div class="w5-anchor-diff-row w5-anchor-diff-head"><span></span><span>then</span><span>now</span><span>Δ</span></div>';
  html += '<div class="w5-anchor-diff-row"><span class="muted">coherence</span><span>' +
    (then.coherence != null ? then.coherence : '—') + '</span><span>' +
    (now.coherence != null ? now.coherence : '—') + '</span><span>' +
    delta(then.coherence, now.coherence) + '</span></div>';
  html += '<div class="w5-anchor-diff-row"><span class="muted">resistance</span><span>' +
    (then.resistance != null ? then.resistance : '—') + '</span><span>' +
    (now.resistance != null ? now.resistance : '—') + '</span><span>' +
    delta(then.resistance, now.resistance) + '</span></div>';
  html += '</div>';
  return html;
}

function w5FormatFormingLine(forming) {
  if (!forming || !forming.length) return '';
  return forming.slice(0, 3).map(function (f) {
    return f.id + ' · ' + f.count + ' of ' + f.need + ' sessions · not yet surfaced';
  }).join(' · ');
}

function w5FormatConfidenceLine(conf) {
  if (!conf) return 'calibrating';
  var parts = ['tension', 'orbit', 'resurgence', 'bridge'].map(function (k) {
    var v = conf[k];
    return k + ' ' + (v === 'calibrating' || v == null ? 'calibrating' : v);
  });
  if (conf._saccade_blind) parts.push('saccade blind · orbit penalized');
  return parts.join(' · ');
}

function w5FormatEncodingMismatchLine(m) {
  if (!m) return '';
  var e = m.encoding || {};
  var n = m.now || {};
  return 'encoding: coh ' + (e.coherence != null ? e.coherence : '—') + ' res ' +
    (e.resistance != null ? e.resistance : '—') + ' · now: coh ' +
    (n.coherence != null ? n.coherence : '—') + ' res ' +
    (n.resistance != null ? n.resistance : '—') + ' · ' + m.days_since_pin + 'd since pin';
}

function w5FormatContainerAckLine() {
  return 'not in vault: Sanctuary · body · unwritten thought';
}

window.w5BackfillPinsFromBridges = w5BackfillPinsFromBridges;
window.w5PinOnBridgeOpen = w5PinOnBridgeOpen;
window.w5PinOnBridgeRelapse = w5PinOnBridgeRelapse;
window.w5EnrichSynapse = w5EnrichSynapse;
window.w5FilterThresholdCandidates = w5FilterThresholdCandidates;
window.w5GetAllPins = w5GetAllPins;
window.w5FormatAnchorsHeldLine = w5FormatAnchorsHeldLine;
window.w5FormatAnchorDiffHtml = w5FormatAnchorDiffHtml;
window.w5FormatFormingLine = w5FormatFormingLine;
window.w5FormatConfidenceLine = w5FormatConfidenceLine;
window.w5FormatEncodingMismatchLine = w5FormatEncodingMismatchLine;
window.w5FormatContainerAckLine = w5FormatContainerAckLine;
