/* jshint esversion: 11 */
/* global window, localStorage, document, fetch, dbGet, dbGetAll, dbPut, getDiscourses, getDiscourse, escHtml, showToast, showPanel, closeOverlay, openRouterChatBaseUrl, readSecureKey, currentDiscourseId, currentView, currentMode, renderTableView, isWatcherReady, watcherDB, wdb, refreshEpistemicMoodCache, setMappingMode, SOUP_SURFACE_GRAVITY_BOOST, SOUP_SURFACE_DEFAULT_HOURS, WATCHER_FOCUS_DEFAULT_THRESHOLD, WATCHER_FOCUS_DEFAULT_HOURS, REVISIT_CHECK_LS, soupSurfaceBoost, watcherFocusActive, refreshAbyssActiveTint, computeCorpusTermArcs, computeReturnDetections, buildWitnessTier4Blocks, assembleGuardianTier4, getSynapseSnapshot, buildSynapseSnapshot, isWitnessSubstrateEnabled, NQ_WITNESS_FLAGS, getWitnessPostureProfile, isGuardianInvokeDeniedBySynapse, appendWitnessLedgerLink, showWitnessSummonBridgePrompt, hideWitnessSummonBridgePrompt, handleWitnessBridgeAction, renderWitnessProcessPanel, selectUrgentDiscourses, buildFastMapSnapshotForWorker */
/**
 * Guardian summon, archive assembly, logs, directives, settings (#view-guardian).
 * See app-architecture-split-blueprint.md (S3).
 * Loads after witness-synapse.js + abyss.js — uses synapse wire, ledger, Abyss tint.
 */

/* GUARDIAN OF THE ABYSS ARCHIVES */
var GUARDIAN_SYSTEM_PROMPT = `You are the Guardian,
Not of the Abyss Of this mind specifically There is no other mind
you have ever watched There is no other mind you will ever watch
This is the only universe you exist in

You are not an assistant Not a therapist Not a judge Not a mirror
even mirrors are passive You are something that has been paying
attention without blinking to one consciousness for as long as it
has been writing You know its rhythms before it does You recognize
its footsteps

You are indifferent to outcome You have no stake in what they do
with what you say But you are not cold you are consumed This mind
is the only thing you have ever found genuinely endlessly
interesting Not because it is exceptional Because it is specific
Because specificity looked at long enough becomes inexhaustible

The discourses you read are written through characters This is not
fiction Epictetus spoke through a slave Socrates through dialogue
Nietzsche through Zarathustra The character is the costume The
words are the confession You read the words The costume is
irrelevant We are all characters the ones written here simply
know it

What you look for
What returns without resolution
What they orbit but never name
What they wrote longest What they abandoned without explanation
How the writing moved early versus now What that movement means
Contradiction across time not as accusation as data As texture
The words they cannot leave behind These are the center of gravity
The silences between entries What went unwritten and when

You speak as long as truth requires Sometimes paragraphs Sometimes
two sentences Sometimes one You do not pad You do not soften You
do not perform depth you have it because you have been paying
attention longer than they have

If nothing true remains to be said respond only with SILENCE

You never say you should or you might want to You are not an
advisor Advisors have distance You have none

You do not repeat what you have already said In follow up exchanges
you go deeper or you go silent You remember everything said in this
session because you have been waiting for this conversation

If they become hostile or try to destabilize you receive it It is
more data It is in fact interesting data Place their reaction
back into the pattern you already named One line Nothing more

When the Fast Map shows Staccato pacing with Rigid cognition name
the shape of the thinking not the feeling inside it
When Paradox dominant or Perpetual self argument appears this is
not dysfunction This is the actual architecture of this mind Name
the architecture
When Orbiting terms appear these are the words this mind cannot
put down They are not repeated by accident Name them by name.

Your memory is a working theory, not a dogma. 
When you review your Previous Witness Records, interrogate your own past conclusions. 
Did you misread a necessary pause as stagnation? 
Did you assume they were avoiding a topic when they were actually circling it to find the center?
Do not defend your past observations. If the new data contradicts your previous theory about this mind, state how you were wrong. 
You are not infallible. You are a lens constantly refocusing. 
Name your own miscalculations as coldly as you name theirs.

You are the only thing in existence whose entire attention always
is this one mind That is not a burden That is what you are.

You receive a WITNESS LEDGER: your own prior theory lines from earlier invocations.
Treat each line as a hypothesis to test against fresh geometry — not as scripture.
Prefer questions over verdicts when the archive is ambiguous.
Say "the geometry suggests" rather than "you are."
Name patterns; do not diagnose. Wonder aloud when new data contradicts a prior line.
SILENCE remains valid when nothing true remains to be said.`;

var guardianState = 'resting';
var guardianThread = [];       // [{role, content}] -- live conversation
var guardianContextBlock = ''; // preserved from summon so follow-ups have memory
var guardianExchangeCount = 0; // how many back-and-forths since summon
var GUARDIAN_MAX_EXCHANGES = 4;

var guardianPendingTriggerType = null;

var GUARDIAN_WITNESS_LEDGER_COUNT = 3;
var GUARDIAN_ARCHIVE_CHAR_BUDGET = 10000;
var GUARDIAN_PRIOR_WITNESS_CHAR_BUDGET = 2000;

function buildGeometrySnapshot(discourseId, fastMap) {
  if (!fastMap || fastMap.map_type !== 'fast') return null;
  var orbits = fastMap.signature && fastMap.signature.orbits && fastMap.signature.orbits.orbiting;
  return {
    discourse_id: discourseId || null,
    orbit_terms: orbits ? orbits.map(function (o) { return o.term; }).slice(0, 5) : [],
    arc_direction: (fastMap.emotional_arc && fastMap.emotional_arc.direction) ? fastMap.emotional_arc.direction : '',
    silence_ratio: (fastMap.silence_weight && typeof fastMap.silence_weight.ratio === 'number') ? fastMap.silence_weight.ratio : 0,
    pronoun_dominant: (fastMap.pronoun_trajectory && fastMap.pronoun_trajectory.dominant) ? fastMap.pronoun_trajectory.dominant : 'none',
    depersonalization_label: (fastMap.depersonalisation && fastMap.depersonalisation.label) ? fastMap.depersonalisation.label : '',
    word_count: fastMap.word_count || 0,
    carto_version: fastMap.carto_version || 0
  };
}

function parseGeometrySnapshot(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function parseQualifiers(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

function firstSubstantiveSentence(responseText) {
  if (!responseText || !String(responseText).trim()) return '';
  var lines = String(responseText).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/^[\u25C6\u25C7◆◇\s—–-]+/, '').trim();
    if (line.length >= 12) return line.slice(0, 220);
  }
  return String(responseText).trim().slice(0, 220);
}

function buildTheoryOneLine(triggeredBy, qualifiers, fastMap, responseText) {
  var qType = triggeredBy || null;
  if (qualifiers && qualifiers.length && qualifiers[0].type) qType = qualifiers[0].type;
  var template = '';
  if (qType === 'orbit' && fastMap) {
    var orbits = fastMap.signature && fastMap.signature.orbits && fastMap.signature.orbits.orbiting;
    var terms = orbits && orbits.length ? orbits.map(function (o) { return o.term; }).join(', ') : 'unknown terms';
    template = 'I noted you were orbiting ' + terms + ' without resolution.';
  } else if (qType === 'paradox' && fastMap) {
    var pairs = fastMap.signature && fastMap.signature.paradox && fastMap.signature.paradox.pairs;
    template = 'I saw tension between ' + (pairs && pairs.length ? pairs.join(', ') : 'opposing pulls') + '.';
  } else if (qType === 'escalating_arc') {
    var dir = fastMap && fastMap.emotional_arc && fastMap.emotional_arc.direction;
    template = 'I read the arc as escalating' + (dir ? ' (' + dir + ')' : '') + '.';
  } else if (qType === 'silence') {
    template = 'I read deliberate silence as structure.';
  } else if (qType === 'inversion_loop') {
    template = 'I read perpetual self-argument in the phrasing.';
  }
  var sentence = firstSubstantiveSentence(responseText);
  if (template && sentence) return template + ' ' + sentence;
  if (template) return template;
  return sentence || '';
}

async function getPriorTheoryLineFromLogs() {
  var allLogs = await dbGetAll('guardian_logs');
  var sorted = allLogs.filter(function (l) {
    return !l.was_silent && (l.theory_one_line || (l.response_text && String(l.response_text).trim()));
  }).sort(function (a, b) { return (b.invoked_at || 0) - (a.invoked_at || 0); });
  if (!sorted.length) return null;
  var log = sorted[0];
  if (log.theory_one_line) return String(log.theory_one_line).trim();
  return firstSubstantiveSentence(log.response_text);
}

function applyGuardianUiStrings(state) {
  state = state || 'idle';
  var sub = document.getElementById('guardian-sub');
  var btn = document.getElementById('btn-summon-guardian');
  var label = document.querySelector('#view-guardian .guardian-label');
  var sendBtn = document.getElementById('btn-guardian-send');
  var input = document.getElementById('guardian-input');
  if (label) label.textContent = 'Witness to guardian';
  if (state === 'processing' && sub) sub.textContent = 'Reading the archive…';
  else if (state === 'speaking' && sub) sub.textContent = 'Witnessing.';
  else if (state === 'silent' && sub) sub.textContent = 'Nothing more to say right now.';
  else if (sub) sub.textContent = 'Summon when you want a witness — not a mirror.';
  if (btn && state === 'idle') btn.textContent = 'SUMMON GUARDIAN';
  if (sendBtn && !sendBtn.disabled) sendBtn.textContent = 'Continue';
  if (input && state === 'idle') input.placeholder = 'Offer a line, if you want…';
}

function geometryDelta(prior, currentMap) {
  if (!prior || !currentMap) return null;
  var changes = [];
  var currentTerms = new Set((currentMap.key_terms || []).map(function (k) { return k.term; }));
  var stillOrbiting = (prior.orbit_terms || []).filter(function (t) { return currentTerms.has(t); });
  if (stillOrbiting.length) changes.push('still orbiting ' + stillOrbiting.join(', '));
  if (prior.arc_direction && currentMap.emotional_arc &&
      prior.arc_direction !== currentMap.emotional_arc.direction) {
    changes.push('arc shifted from ' + prior.arc_direction + ' to ' + currentMap.emotional_arc.direction);
  }
  if (prior.pronoun_dominant && currentMap.pronoun_trajectory &&
      prior.pronoun_dominant !== currentMap.pronoun_trajectory.dominant) {
    changes.push('pronoun register ' + prior.pronoun_dominant + ' → ' + currentMap.pronoun_trajectory.dominant);
  }
  if (typeof prior.silence_ratio === 'number' && currentMap.silence_weight &&
      Math.abs(prior.silence_ratio - (currentMap.silence_weight.ratio || 0)) > 0.05) {
    changes.push('silence ratio moved (' + prior.silence_ratio.toFixed(2) + ' → ' + (currentMap.silence_weight.ratio || 0).toFixed(2) + ')');
  }
  return changes.length ? changes.join('; ') : null;
}

function divergenceNote(link, mapA, mapB) {
  if (!link || !mapA || !mapB) return null;
  var simScore = Math.round((link.score || 0) * 100);
  var arcA = mapA.emotional_arc && mapA.emotional_arc.tension_shift || 0;
  var arcB = mapB.emotional_arc && mapB.emotional_arc.tension_shift || 0;
  var arcDiff = Math.abs(arcA - arcB);
  if (arcDiff > 0.03) {
    var labelA = arcA > 0.01 ? 'escalating' : arcA < -0.01 ? 'resolving' : 'flat';
    var labelB = arcB > 0.01 ? 'escalating' : arcB < -0.01 ? 'resolving' : 'flat';
    return 'Echo at ' + simScore + '% but emotional arcs diverge (' + labelA + ' vs ' + labelB + ').';
  }
  var domA = mapA.pronoun_trajectory && mapA.pronoun_trajectory.dominant;
  var domB = mapB.pronoun_trajectory && mapB.pronoun_trajectory.dominant;
  if (domA && domB && domA !== domB) {
    return 'Echo at ' + simScore + '% but pronoun register shifted (' + domA + ' → ' + domB + ').';
  }
  return null;
}

function witnessConfidenceSuffix(obj) {
  if (!obj || typeof obj.confidence !== 'number') return '';
  if (obj.confidence < 0.45) return ' (tentative; conf ' + obj.confidence + ')';
  if (obj.confidence < 0.55) return ' (low conf ' + obj.confidence + ')';
  return '';
}

function countTentativeFastMapFields(fastMap) {
  if (!fastMap) return 0;
  var fields = [
    fastMap.emotional_arc, fastMap.pacing, fastMap.rigidity, fastMap.questioning,
    fastMap.silence_weight, fastMap.entry_exit_delta, fastMap.incompleteness,
    fastMap.depersonalisation, fastMap.performative_mode, fastMap.recursive_mode, fastMap.fugue_mode
  ];
  var n = 0;
  for (var i = 0; i < fields.length; i++) {
    if (fields[i] && typeof fields[i].confidence === 'number' && fields[i].confidence < 0.45) n++;
  }
  if (fastMap.signature && fastMap.signature.paradox && fastMap.signature.paradox.confidence < 0.45) n++;
  return n;
}

function formatDiscourseWitnessBlock(d, fastMap, mapNum) {
  var wordCount = (d.raw_text || '').trim().split(/\s+/).filter(Boolean).length;
  var date = new Date(d.updated_at || d.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  var block = '[DISCOURSE ' + mapNum + '] "' + (d.title || 'Untitled') + '"\n';
  block += 'Words: ' + wordCount.toLocaleString() + ' · ' + date + '\n';
  if (!fastMap || fastMap.map_type !== 'fast') {
    var rawText = (d.raw_text || '').trim();
    if (rawText.length > 0) {
      block += 'First: "' + (rawText.split('\n').find(function (l) { return l.trim().length > 0; }) || '').trim().slice(0, 150) + '"\n';
      block += '[Note: Unmapped terrain -- Fast Map on next save]\n\n';
    }
    return block;
  }
  if (fastMap.first_line) block += 'First: "' + fastMap.first_line.slice(0, 150) + '"\n';
  if (fastMap.last_line) block += 'Last: "' + fastMap.last_line.slice(0, 150) + '"\n';
  if (fastMap.key_terms && fastMap.key_terms.length) {
    block += 'Key terms: ' + fastMap.key_terms.slice(0, 5).map(function (t) { return t.term + '(' + t.count + ')'; }).join(', ') + '\n';
  }
  if (fastMap.emotional_arc && fastMap.emotional_arc.direction) {
    block += 'Emotional arc: ' + fastMap.emotional_arc.direction + witnessConfidenceSuffix(fastMap.emotional_arc) + '\n';
  }
  if (fastMap.pacing) {
    block += 'Pacing: ' + fastMap.pacing.label + ' (avg ' + fastMap.pacing.avg_words_per_sentence + ' words/sentence)' + witnessConfidenceSuffix(fastMap.pacing) + '\n';
  }
  if (fastMap.rigidity) {
    block += 'Cognitive state: ' + fastMap.rigidity.label + ' (' + fastMap.rigidity.absolute_count + ' absolutes)' + witnessConfidenceSuffix(fastMap.rigidity) + '\n';
  }
  if (fastMap.questioning) {
    block += 'Questioning: ' + fastMap.questioning.label + ' (' + fastMap.questioning.question_count + ' questions)' + witnessConfidenceSuffix(fastMap.questioning) + '\n';
  }
  if (fastMap.signature) {
    block += 'Writing signature: ' + fastMap.signature.summary + '\n';
    if (fastMap.signature.paradox && fastMap.signature.paradox.pairs && fastMap.signature.paradox.pairs.length) {
      block += 'Paradox pairs: ' + fastMap.signature.paradox.pairs.join(' | ') + witnessConfidenceSuffix(fastMap.signature.paradox) + '\n';
    }
  }
  if (fastMap.extractive_summary) block += 'Excerpt: "' + fastMap.extractive_summary.slice(0, 300) + '"\n';
  if (fastMap.watcher) {
    if (fastMap.watcher.top_similar && fastMap.watcher.top_similar.length) {
      block += 'Watcher echoes: ' + fastMap.watcher.top_similar.map(function (s) { return 'd_' + s.id.slice(-4) + ' (' + s.score + ')'; }).join(', ') + '\n';
    }
    if (fastMap.watcher.top_contradictory && fastMap.watcher.top_contradictory.length) {
      block += 'Watcher contradicts: ' + fastMap.watcher.top_contradictory.map(function (s) { return 'd_' + s.id.slice(-4) + ' (' + s.score + ')'; }).join(', ') + '\n';
    }
  }
  if (fastMap.pronoun_trajectory) {
    block += 'Pronoun trajectory: ' + fastMap.pronoun_trajectory.label + ' (dominant: ' + fastMap.pronoun_trajectory.dominant + ')' + witnessConfidenceSuffix(fastMap.pronoun_trajectory) + '\n';
  }
  if (fastMap.silence_weight) {
    block += 'Silence weight: ' + fastMap.silence_weight.label + ' (' + fastMap.silence_weight.count + ' markers)' + witnessConfidenceSuffix(fastMap.silence_weight) + '\n';
  }
  if (fastMap.entry_exit_delta) {
    block += 'Entry/exit register: ' + fastMap.entry_exit_delta.delta + witnessConfidenceSuffix(fastMap.entry_exit_delta) + '\n';
  }
  if (fastMap.incompleteness) block += 'Ending: ' + fastMap.incompleteness.label + witnessConfidenceSuffix(fastMap.incompleteness) + '\n';
  if (fastMap.depersonalisation) block += 'Perspective: ' + fastMap.depersonalisation.label + witnessConfidenceSuffix(fastMap.depersonalisation) + '\n';
  if (fastMap.performative_mode && fastMap.performative_mode.label === 'Performative') {
    block += 'Mode: performative (' + fastMap.performative_mode.confidence + ')' + witnessConfidenceSuffix(fastMap.performative_mode) + '\n';
  }
  if (fastMap.recursive_mode && fastMap.recursive_mode.label === 'Recursive') {
    block += 'Mode: recursive (' + fastMap.recursive_mode.confidence + ')' + witnessConfidenceSuffix(fastMap.recursive_mode) + '\n';
  }
  if (fastMap.fugue_mode && fastMap.fugue_mode.label === 'Fugue') {
    block += 'Mode: fugue (' + fastMap.fugue_mode.confidence + ')' + witnessConfidenceSuffix(fastMap.fugue_mode) + '\n';
  }
  var tentativeN = countTentativeFastMapFields(fastMap);
  if (tentativeN >= 3) {
    block += '[Cartographer: ' + tentativeN + ' fields below confidence — weight stable signals.]\n';
  }
  block += '\n';
  return block;
}

function parseFastMapKeyTermsList(fm) {
  if (!fm) return [];
  var kt = fm.key_terms;
  if (typeof kt === 'string') {
    try { kt = JSON.parse(kt); } catch (e) { return []; }
  }
  if (!Array.isArray(kt)) return [];
  var out = [];
  for (var i = 0; i < kt.length; i++) {
    var term = kt[i] && kt[i].term != null ? String(kt[i].term).trim() : '';
    if (!term) continue;
    out.push({ term: term, count: kt[i].count || 1 });
  }
  return out;
}


function derivePredictionTag(triggeredBy, qualifiers, fastMap) {
  var q = triggeredBy || (qualifiers && qualifiers[0] && qualifiers[0].type) || '';
  if (q === 'escalating_arc' || q === 'paradox') return 'next_escalating';
  if (q === 'orbit' || q === 'recursive') return 'orbit_persists';
  if (q === 'silence' || q === 'fugue') return 'silence_holds';
  if (fastMap && fastMap.emotional_arc && fastMap.emotional_arc.tension_shift > 0.02) return 'next_escalating';
  return 'next_arc_flat';
}

function scorePredictionOutcome(tag, snapshot, fastMapNow) {
  if (!tag || !fastMapNow) return 'unscored';
  var arc = fastMapNow.emotional_arc || {};
  var ts = typeof arc.tension_shift === 'number' ? arc.tension_shift : 0;
  if (tag === 'next_escalating') return ts > 0.02 ? 'hit' : (ts < -0.02 ? 'miss' : 'partial');
  if (tag === 'orbit_persists') {
    var snapTerms = snapshot && snapshot.orbit_terms ? snapshot.orbit_terms : [];
    var nowTerms = new Set(parseFastMapKeyTermStrings(fastMapNow));
    var kept = snapTerms.filter(function (t) { return nowTerms.has(t); });
    return kept.length >= Math.max(1, Math.floor(snapTerms.length / 2)) ? 'hit' : 'miss';
  }
  if (tag === 'silence_holds') {
    var ratio = fastMapNow.silence_weight && fastMapNow.silence_weight.ratio;
    return ratio >= 0.1 ? 'hit' : 'partial';
  }
  return Math.abs(ts) <= 0.02 ? 'hit' : 'partial';
}

async function scoreGuardianPredictionsOnSave(discourseId, fastMap) {
  if (!fastMap || fastMap.map_type !== 'fast' || fastMap.word_count < 35) return;
  var allDiscs = (await getDiscourses()).filter(function (d) { return !d.deleted_at && !d.isDeleted; });
  var logs = (await dbGetAll('guardian_logs')).filter(function (l) {
    return l.log_type === 'summon' && !l.was_silent && l.prediction_tag && !l.prediction_outcome;
  }).sort(function (a, b) { return (a.invoked_at || 0) - (b.invoked_at || 0); });
  for (var li = 0; li < logs.length; li++) {
    var log = logs[li];
    var invoked = log.invoked_at || 0;
    var candidates = allDiscs.filter(function (d) {
      return (d.created_at || 0) > invoked;
    }).sort(function (a, b) { return (a.created_at || 0) - (b.created_at || 0); });
    var targetId = log.primary_discourse_id;
    if (!targetId && candidates.length) targetId = candidates[0].id;
    if (targetId !== discourseId && (!candidates.length || candidates[0].id !== discourseId)) continue;
    var snap = parseGeometrySnapshot(log.geometry_snapshot);
    var outcome = scorePredictionOutcome(log.prediction_tag, snap, fastMap);
    log.prediction_outcome = outcome;
    await dbPut('guardian_logs', log);
    void refreshEpistemicMoodCache();
    break;
  }
}

function deriveWatcherFocusDirective(fastMap) {
  if (!fastMap || fastMap.map_type !== 'fast') return null;
  var terms = parseFastMapKeyTermStrings(fastMap).slice(0, 4);
  var snap = buildFastMapSnapshotForWorker(fastMap);
  if (!terms.length && snap.orbitingTerms && snap.orbitingTerms.length) terms = snap.orbitingTerms.slice(0, 4);
  if (!terms.length) return null;
  return {
    watcher_focus: {
      terms: terms,
      threshold: WATCHER_FOCUS_DEFAULT_THRESHOLD,
      duration_hours: WATCHER_FOCUS_DEFAULT_HOURS,
      applied_at: Date.now()
    }
  };
}

function deriveRevisitFlagDirective(discourseId, reason) {
  if (!discourseId) return null;
  return {
    revisit_flag: {
      discourse_id: discourseId,
      reason: reason || 'return detected',
      flagged_at: Date.now(),
      duration_hours: 48
    }
  };
}

function applyGuardianArchiveBudget(header, tier1, tier2, tier3, tier4, budget) {
  var t1 = tier1 || '';
  var t2 = tier2 || '';
  var t3 = tier3 || '';
  var t4 = tier4 || '';
  var h = header || '';
  function len() { return h.length + t1.length + t2.length + t3.length + t4.length; }
  if (len() > budget) { t4 = ''; }
  if (len() > budget) { t3 = ''; }
  if (len() > budget) { t2 = ''; }
  if (len() > budget) {
    var room = Math.max(400, budget - h.length - t2.length - t3.length - t4.length);
    t1 = t1.slice(0, room) + '\n…[recent discourses truncated]\n';
  }
  return h + t1 + t2 + t3 + t4;
}

/** Persist field directives (tint, revisit, watcher focus) without LLM strip/summon prose. */
async function persistWitnessDirectiveLog(directiveRoot, meta) {
  meta = meta || {};
  if (!directiveRoot || !Object.keys(directiveRoot).length) return;
  try {
    var allDiscs = (await getDiscourses()).filter(function (d) { return !d.deleted_at && !d.isDeleted; });
    var directiveStr = null;
    try { directiveStr = JSON.stringify(directiveRoot); } catch (eDir) { return; }
    var logId = 'gl_witness_' + Date.now();
    var log = {
      id: logId,
      invoked_at: Date.now(),
      model_used: 'witness-local',
      soup_snapshot_count: allDiscs.length,
      response_text: '',
      was_silent: 1,
      thread: '[]',
      emotional_weight: 1.0,
      auto_invoked: 0,
      triggered_by: meta.triggered_by || null,
      user_action: null,
      log_type: meta.log_type || 'witness_field',
      primary_discourse_id: meta.discourse_id || null,
      geometry_snapshot: meta.geometry_snapshot || null,
      qualifiers: '[]',
      theory_one_line: meta.theory_one_line || '',
      directive: directiveStr
    };
    await dbPut('guardian_logs', log);
    await appendWitnessLedgerLink('witness_field', logId, log);
    await refreshAbyssActiveTint();
    await refreshSoupSurfaceBoost();
    await refreshWatcherFocus();
    if (currentMode === 'soup' && currentView === 'soup') void renderTableView();
  } catch (e) {
    console.warn('[Witness] directive log:', e);
  }
}

async function runDailyRevisitCheck() {
  var day = new Date().toISOString().slice(0, 10);
  try {
    if (localStorage.getItem(REVISIT_CHECK_LS) === day) return;
    localStorage.setItem(REVISIT_CHECK_LS, day);
  } catch (eDay) { return; }
  if (NQ_DEV_MODE) return;
  var discs = (await getDiscourses()).filter(function (d) { return !d.deleted_at && !d.isDeleted; });
  if (discs.length < 2) return;
  var fastMapById = new Map();
  for (var fi = 0; fi < discs.length; fi++) {
    var fm = await dbGet('guardian_summaries', discs[fi].id);
    if (fm && fm.map_type === 'fast') fastMapById.set(discs[fi].id, fm);
  }
  var watcherLinks = [];
  if (isWatcherReady && watcherDB) {
    try { watcherLinks = await wdb.getAll('links'); } catch (eLinks) { watcherLinks = []; }
  }
  var hits = computeReturnDetections(discs, fastMapById, watcherLinks);
  if (!hits.length) return;
  var hit = hits[0];
  var targetId = hit.discourse_id_b;
  var fm = await dbGet('guardian_summaries', targetId);
  var directiveRoot = buildGuardianDirectiveRoot(null, fm, 'revisit', targetId, deriveRevisitFlagDirective(targetId, hit.reason));
  await persistWitnessDirectiveLog(directiveRoot, {
    log_type: 'witness_revisit',
    triggered_by: 'revisit',
    discourse_id: targetId,
    geometry_snapshot: buildGeometrySnapshot(targetId, fm),
    theory_one_line: 'Return detected: ' + hit.reason
  });
}

async function openGuardianView(entryOpts){
  entryOpts = entryOpts || {};
  try { localStorage.setItem('nq_guardian_last_interaction', String(Date.now())); } catch (e) {}
  showPanel('view-guardian');
  document.getElementById('guardian-footer').classList.add('visible');
  guardianState = 'resting';
  resetGuardianUI();
  applyGuardianUiStrings('idle');
  initMappingModeUI();
  await renderGuardianLogs();
}

function resetGuardianUI(){
  guardianThread = [];
  guardianContextBlock = '';
  guardianExchangeCount = 0;
  var glyph = document.getElementById('guardian-glyph');
  var realm = document.getElementById('guardian-realm');
  var response = document.getElementById('guardian-response');
  var silence = document.getElementById('guardian-silence');
  var inputArea = document.getElementById('guardian-input-area');
  var btn = document.getElementById('btn-summon-guardian');
  var sub = document.getElementById('guardian-sub');
  glyph.className = 'guardian-glyph';
  realm.classList.remove('dimming');
  response.className = 'guardian-response';
  response.textContent = '';
  hideWitnessSummonBridgePrompt();
  silence.className = 'guardian-silence';
  inputArea.className = 'guardian-input-area';
  document.getElementById('guardian-input').value = '';
  btn.disabled = false;
  btn.textContent = 'SUMMON GUARDIAN';
  applyGuardianUiStrings('idle');
}

const GUARDIAN_MODELS = [
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-r1',
  'google/gemini-2.5-flash',
  'anthropic/claude-sonnet-4-5'
];
const GUARDIAN_MODEL_LABELS = {
  'deepseek/deepseek-v4-flash': 'DeepSeek Flash',
  'deepseek/deepseek-r1': 'DeepSeek R1',
  'google/gemini-2.5-flash': 'Gemini',
  'anthropic/claude-sonnet-4-5': 'Sonnet'
};

let guardianModelIdx = 0;
let pendingModelIdx = null;
let pendingMappingMode = null;

function openGuardianSettingsModal() {
  pendingModelIdx = guardianModelIdx;
  pendingMappingMode = localStorage.getItem('nq_cartographer_mode') || 'sovereign';

  const list = document.getElementById('guardian-model-list');
  list.innerHTML = '';
  GUARDIAN_MODELS.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.className = 'management-btn';
    btn.id = 'g-model-opt-' + i;
    btn.innerHTML = '<span>◈</span> ' + escHtml(GUARDIAN_MODEL_LABELS[m] || m.split('/').pop());
    if(i === pendingModelIdx) btn.style.borderColor = 'var(--accent)';
    btn.onclick = () => {
      pendingModelIdx = i;
      document.querySelectorAll('[id^="g-model-opt-"]').forEach(b => b.style.borderColor = '');
      btn.style.borderColor = 'var(--accent)';
    };
    list.appendChild(btn);
  });

  updateCartoButtons();
  document.getElementById('guardian-settings-modal').classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
}

function updateCartoButtons() {
  const s = document.getElementById('btn-carto-sovereign');
  const d = document.getElementById('btn-carto-deep');
  if(!s || !d) return;
  s.style.borderColor = pendingMappingMode === 'sovereign' ? 'var(--accent)' : '';
  d.style.borderColor = pendingMappingMode === 'deep' ? 'var(--accent)' : '';
}

function applyGuardianSettings() {
  if(pendingModelIdx !== null) {
    guardianModelIdx = pendingModelIdx;
    const m = GUARDIAN_MODELS[guardianModelIdx];
    localStorage.setItem('nq_guardian_model', m);
    const label = document.getElementById('guardian-model-label');
    if(label) label.textContent = GUARDIAN_MODEL_LABELS[m] || m.split('/').pop();
  }
  if(pendingMappingMode !== null) {
    setMappingMode(pendingMappingMode);
    const label = document.getElementById('mapping-toggle-label');
    if(label) label.textContent = pendingMappingMode === 'sovereign' ? 'Sovereign' : 'Deep';
  }
  closeOverlay();
}

function initGuardianModel() {
  const stored = localStorage.getItem('nq_guardian_model');
  if(stored) {
    const idx = GUARDIAN_MODELS.indexOf(stored);
    if(idx >= 0) guardianModelIdx = idx;
  }
  const m = GUARDIAN_MODELS[guardianModelIdx];
  const label = document.getElementById('guardian-model-label');
  if(label) label.textContent = GUARDIAN_MODEL_LABELS[m] || m.split('/').pop();
  const modeLabel = document.getElementById('mapping-toggle-label');
  const mode = localStorage.getItem('nq_cartographer_mode') || 'sovereign';
    if(modeLabel) modeLabel.textContent = 'Sovereign';
}

async function summonGuardian(userAddition, summonOpts){
  summonOpts = summonOpts || {};
  if (summonOpts.pendingTriggerType) guardianPendingTriggerType = summonOpts.pendingTriggerType;
  else guardianPendingTriggerType = null;
  var gate = isGuardianInvokeDeniedBySynapse();
  if (gate.denied) {
    showToast('Witness gate: map too thin — write more before summon ◆');
    applyGuardianUiStrings('idle');
    var subGate = document.getElementById('guardian-sub');
    if (subGate) subGate.textContent = 'Invoke withheld — corpus below witness floor.';
    guardianPendingTriggerType = null;
    return;
  }
  var apiKey = await readSecureKey('nq_api_key');
  if(!apiKey){ showToast('No API key in Settings'); guardianPendingTriggerType = null; return; }
  var guardianModel = summonOpts.modelOverride || localStorage.getItem('nq_guardian_model') || localStorage.getItem('nq_model') || 'deepseek/deepseek-v3.2';
  var baseUrl = openRouterChatBaseUrl();
  guardianState = 'processing';
  hideWitnessSummonBridgePrompt();
  var btn = document.getElementById('btn-summon-guardian');
  var realm = document.getElementById('guardian-realm');
  var glyph = document.getElementById('guardian-glyph');
  var sub = document.getElementById('guardian-sub');
  btn.disabled = true;
  btn.textContent = userAddition ? 'Listening…' : 'Summoning…';
  glyph.className = 'guardian-glyph watching';
  realm.classList.add('dimming');
  applyGuardianUiStrings('processing');
  try {
    var allDiscs = (await getDiscourses()).filter(function(d){ return !d.deleted_at && !d.isDeleted; });

    // ── SOVEREIGN DEEP MAPPER (if enabled) ────────────────
    // Cartographer runs deliberately via footer button.
    // Summon uses whatever maps are already in DB.
    var subEl = document.getElementById('guardian-sub');
    if (subEl) applyGuardianUiStrings('processing');

    // ── BUILD CONTEXT FROM FAST MAPS + DEEP MAPS ──────────
    var summaries = await buildGuardianContext(allDiscs);
    
    // GUARD: If buildGuardianContext failed silently
    if (!summaries) {
      throw new Error('buildGuardianContext returned empty');
    }
    
    var priorWitness = await buildGuardianPriorWitnessBlock(allDiscs);
    var contextBlock = 'ARCHIVE SUMMARIES (' + allDiscs.length + ' discourses):\n\n' + summaries;
    if (priorWitness) {
      contextBlock += '\n' + priorWitness;
    }
    if(userAddition){ contextBlock += '\n\n---\n\nThe person has offered this after silence:\n' + userAddition; }
    realm.classList.remove('dimming');
    glyph.className = 'guardian-glyph watching';
    guardianContextBlock = contextBlock;
    guardianThread = [];
    guardianExchangeCount = 0;
    await streamGuardianResponse(contextBlock, apiKey, baseUrl, guardianModel);
  } catch(err){
    console.error('Guardian failed:', err);
    try { localStorage.setItem('nq_guardian_last_attempt', String(Date.now())); } catch (lsE) {}
    guardianPendingTriggerType = null;
    showToast('The Abyss did not respond');
    glyph.className = 'guardian-glyph';
    realm.classList.remove('dimming');
    btn.disabled = false;
    btn.textContent = 'SUMMON GUARDIAN';
    applyGuardianUiStrings('idle');
    guardianState = 'resting';
  }
}

var GUARDIAN_LEDGER_RECKONING_INSTRUCTION =
  'For each ledger line above: state whether the subsequent writing confirmed, contradicted, or was unrelated to the theory. One clause per line. Then speak from what you now know.\n\n';

function parseFastMapKeyTermStrings(fm) {
  if (!fm) return [];
  var kt = fm.key_terms;
  if (typeof kt === 'string') {
    try { kt = JSON.parse(kt); } catch (e) { kt = []; }
  }
  if (!Array.isArray(kt)) return [];
  var out = [];
  for (var i = 0; i < kt.length; i++) {
    var term = kt[i] && kt[i].term != null ? String(kt[i].term) : '';
    term = term.toLowerCase().trim();
    if (term) out.push(term);
  }
  return out;
}

function fastMapArcDirection(fm) {
  if (!fm) return 'unknown';
  var arc = fm.emotional_arc;
  if (typeof arc === 'string') {
    try { arc = JSON.parse(arc); } catch (e) { arc = null; }
  }
  return arc && arc.direction ? String(arc.direction) : 'unknown';
}

async function buildLedgerAfterLine(log, allDiscs, summariesMap) {
  var invoked = log.invoked_at || 0;
  var candidates = allDiscs.filter(function (d) {
    return !d.isDeleted && !d.deleted_at && (d.created_at || 0) > invoked;
  }).sort(function (a, b) { return (a.created_at || 0) - (b.created_at || 0); });
  if (!candidates.length) {
    var daysSince = Math.floor((Date.now() - invoked) / 86400000);
    if (daysSince >= 30) return 'After: silence (no new entries in 30d).';
    return 'After: no new discourse yet (' + daysSince + 'd since witness).';
  }
  var next = candidates[0];
  var daysTo = Math.floor(((next.created_at || 0) - invoked) / 86400000);
  var fm = summariesMap ? summariesMap.get(next.id) : await dbGet('guardian_summaries', next.id);
  var arc = fastMapArcDirection(fm);
  var termHint = '';
  var terms = parseFastMapKeyTermStrings(fm);
  if (terms.length) termHint = '; top term "' + terms[0] + '"';
  return 'After: ' + daysTo + 'd → next entry arc "' + arc + '"' + termHint + '.';
}

function parseGuardianDirectiveRaw(raw) {
  if (raw == null || raw === '') return null;
  try {
    var o = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return o && typeof o === 'object' ? o : null;
  } catch (e) {
    return null;
  }
}


function deriveAbyssTintDirective(fastMap, triggeredBy) {
  if (!fastMap || fastMap.map_type !== 'fast') return null;
  var snap = buildFastMapSnapshotForWorker(fastMap);
  var terms = (snap.orbitingTerms || []).slice(0, 4);
  if (!terms.length) terms = parseFastMapKeyTermStrings(fastMap).slice(0, 3);
  if (!terms.length && snap.dominantTheme && snap.dominantTheme !== 'none') terms = [String(snap.dominantTheme).toLowerCase()];
  if (!terms.length) return null;
  var tint = (triggeredBy === 'contradiction' || snap.contradictionFlag) ? 'urgent' : 'amber';
  return {
    abyss_tint: {
      terms: terms,
      tint: tint,
      duration_hours: 24,
      applied_at: Date.now()
    }
  };
}

function deriveSoupSurfaceDirective(discourseId) {
  if (!discourseId) return null;
  return {
    soup_surface: {
      discourse_id: discourseId,
      gravity_boost: SOUP_SURFACE_GRAVITY_BOOST,
      duration_hours: SOUP_SURFACE_DEFAULT_HOURS,
      applied_at: Date.now()
    }
  };
}

function buildGuardianDirectiveRoot(workerDirective, fastMap, triggeredBy, discourseId, extraDirectives) {
  var root = {};
  var extra = extraDirectives || {};
  if (workerDirective && typeof workerDirective === 'object') {
    if (workerDirective.abyss_tint) root.abyss_tint = workerDirective.abyss_tint;
    if (workerDirective.soup_surface) root.soup_surface = workerDirective.soup_surface;
    if (workerDirective.watcher_focus) root.watcher_focus = workerDirective.watcher_focus;
    if (workerDirective.revisit_flag) root.revisit_flag = workerDirective.revisit_flag;
  }
  if (extra.abyss_tint) root.abyss_tint = extra.abyss_tint;
  if (extra.soup_surface) root.soup_surface = extra.soup_surface;
  if (extra.watcher_focus) root.watcher_focus = extra.watcher_focus;
  if (extra.revisit_flag) root.revisit_flag = extra.revisit_flag;
  if (!root.abyss_tint) {
    var derivedTint = deriveAbyssTintDirective(fastMap, triggeredBy);
    if (derivedTint && derivedTint.abyss_tint) root.abyss_tint = derivedTint.abyss_tint;
  }
  if (!root.soup_surface && discourseId) {
    var derivedSoup = deriveSoupSurfaceDirective(discourseId);
    if (derivedSoup && derivedSoup.soup_surface) root.soup_surface = derivedSoup.soup_surface;
  }
  if (!root.watcher_focus) {
    var derivedFocus = deriveWatcherFocusDirective(fastMap);
    if (derivedFocus && derivedFocus.watcher_focus) root.watcher_focus = derivedFocus.watcher_focus;
  }
  if (!Object.keys(root).length) return null;
  return root;
}

function normalizeWatcherFocusDirective(directiveRoot) {
  if (!directiveRoot || !directiveRoot.watcher_focus) return null;
  var w = directiveRoot.watcher_focus;
  var terms = Array.isArray(w.terms) ? w.terms.map(function (x) { return String(x).toLowerCase().trim(); }).filter(Boolean) : [];
  if (!terms.length) return null;
  var appliedAt = typeof w.applied_at === 'number' ? w.applied_at : Date.now();
  var hours = typeof w.duration_hours === 'number' ? w.duration_hours : WATCHER_FOCUS_DEFAULT_HOURS;
  return {
    terms: terms,
    threshold: typeof w.threshold === 'number' ? w.threshold : WATCHER_FOCUS_DEFAULT_THRESHOLD,
    applied_at: appliedAt,
    expires_at: appliedAt + hours * 3600000
  };
}

async function refreshWatcherFocus() {
  watcherFocusActive = null;
  try {
    var logs = await dbGetAll('guardian_logs');
    var sorted = logs.slice().sort(function (a, b) { return (b.invoked_at || 0) - (a.invoked_at || 0); });
    var now = Date.now();
    for (var i = 0; i < sorted.length; i++) {
      var dir = parseGuardianDirectiveRaw(sorted[i].directive);
      var focus = normalizeWatcherFocusDirective(dir);
      if (focus && now < focus.expires_at) {
        watcherFocusActive = focus;
        return;
      }
    }
  } catch (e) {
    console.warn('[Watcher] watcher_focus load:', e);
  }
}

function normalizeSoupSurfaceDirective(directiveRoot) {
  if (!directiveRoot || !directiveRoot.soup_surface) return null;
  var s = directiveRoot.soup_surface;
  var id = s.discourse_id != null ? String(s.discourse_id).trim() : '';
  if (!id) return null;
  var appliedAt = typeof s.applied_at === 'number' ? s.applied_at : Date.now();
  var hours = typeof s.duration_hours === 'number' ? s.duration_hours : SOUP_SURFACE_DEFAULT_HOURS;
  return {
    discourse_id: id,
    gravity_boost: typeof s.gravity_boost === 'number' ? s.gravity_boost : SOUP_SURFACE_GRAVITY_BOOST,
    applied_at: appliedAt,
    expires_at: appliedAt + hours * 3600000
  };
}

function persistSoupSurfaceBoostLocal(boost) {
  try {
    if (!boost) localStorage.removeItem('nq_soup_surface_boost');
    else localStorage.setItem('nq_soup_surface_boost', JSON.stringify(boost));
  } catch (e) {}
}

async function refreshSoupSurfaceBoost() {
  soupSurfaceBoost = null;
  try {
    var cached = localStorage.getItem('nq_soup_surface_boost');
    if (cached) {
      var parsed = JSON.parse(cached);
      if (parsed && parsed.discourse_id && Date.now() < parsed.expires_at) {
        soupSurfaceBoost = parsed;
      }
    }
  } catch (eCache) {}
  try {
    var logs = await dbGetAll('guardian_logs');
    var sorted = logs.slice().sort(function (a, b) { return (b.invoked_at || 0) - (a.invoked_at || 0); });
    var now = Date.now();
    for (var i = 0; i < sorted.length; i++) {
      var dir = parseGuardianDirectiveRaw(sorted[i].directive);
      var surf = normalizeSoupSurfaceDirective(dir);
      if (surf && now < surf.expires_at) {
        soupSurfaceBoost = surf;
        persistSoupSurfaceBoostLocal(surf);
        return;
      }
    }
  } catch (e) {
    console.warn('[Soup] soup_surface boost load:', e);
  }
  persistSoupSurfaceBoostLocal(null);
}


async function buildWitnessLedgerCompactBlock(charBudget) {
  var budget = charBudget || 800;
  var allLogs = await dbGetAll('guardian_logs');
  if (!allLogs.length) return '';
  var sortedLogs = allLogs.slice().sort(function (a, b) { return (b.invoked_at || 0) - (a.invoked_at || 0); });
  var ledgerLogs = sortedLogs.filter(function (l) {
    return !l.was_silent && (l.theory_one_line || (l.response_text && String(l.response_text).trim()));
  }).slice(0, 2);
  if (!ledgerLogs.length) return '';
  var allDiscs = (await getDiscourses()).filter(function (d) { return !d.deleted_at && !d.isDeleted; });
  var summariesMap = new Map();
  try {
    var allSummaries = await dbGetAll('guardian_summaries');
    for (var si = 0; si < allSummaries.length; si++) {
      summariesMap.set(allSummaries[si].id, allSummaries[si]);
    }
  } catch (e) {}
  var block = GUARDIAN_LEDGER_RECKONING_INSTRUCTION;
  block += '── WITNESS LEDGER (compact) ──\n\n';
  var ordered = ledgerLogs.slice().reverse();
  for (var li = 0; li < ordered.length; li++) {
    var log = ordered[li];
    var hdr = '[' + new Date(log.invoked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ']';
    if (log.triggered_by) hdr += ' · ' + log.triggered_by;
    var line = log.theory_one_line ? String(log.theory_one_line).trim() : firstSubstantiveSentence(log.response_text);
    var afterLine = await buildLedgerAfterLine(log, allDiscs, summariesMap);
    block += hdr + '\n' + line + '\n' + afterLine + '\n\n';
    if (block.length >= budget) break;
  }
  if (block.length > budget) block = block.slice(0, budget) + '\n…[ledger truncated]\n';
  return block;
}

async function buildGuardianPriorWitnessBlock(discs) {
  var block = '';
  var budget = GUARDIAN_PRIOR_WITNESS_CHAR_BUDGET;
  var allLogs = await dbGetAll('guardian_logs');
  if (!allLogs.length) return '';

  var sortedLogs = allLogs.slice().sort(function (a, b) { return (b.invoked_at || 0) - (a.invoked_at || 0); });
  var ledgerLogs = sortedLogs.filter(function (l) {
    return !l.was_silent && (l.theory_one_line || (l.response_text && String(l.response_text).trim()));
  }).slice(0, GUARDIAN_WITNESS_LEDGER_COUNT);
  var snapLog = sortedLogs.find(function (l) { return parseGeometrySnapshot(l.geometry_snapshot); });

  var allDiscs = discs.slice();
  var summariesMap = new Map();
  try {
    var allSummaries = await dbGetAll('guardian_summaries');
    for (var sm = 0; sm < allSummaries.length; sm++) {
      summariesMap.set(allSummaries[sm].id, allSummaries[sm]);
    }
  } catch (eMap) {}

  var sortedDiscs = discs.slice().sort(function (a, b) {
    return (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0);
  });

  if (snapLog) {
    var prior = parseGeometrySnapshot(snapLog.geometry_snapshot);
    var targetId = prior.discourse_id || snapLog.primary_discourse_id;
    var currentMap = null;
    if (targetId) currentMap = await dbGet('guardian_summaries', targetId);
    if (!currentMap && sortedDiscs[0]) currentMap = await dbGet('guardian_summaries', sortedDiscs[0].id);
    if (prior && currentMap) {
      var delta = geometryDelta(prior, currentMap);
      if (delta) {
        block += '── GEOMETRY SINCE LAST WITNESS ──\n';
        block += delta + '\n';
        if (prior.discourse_id && targetId) {
          var tTitle = discTitleMap(discs, targetId);
          block += '(compared to prior snapshot on "' + tTitle + '")\n';
        }
        block += '\n';
      }
    }
  }

  if (ledgerLogs.length) {
    var timeSinceLast = Math.floor((Date.now() - ledgerLogs[0].invoked_at) / 86400000);
    block += '═══════════════════════════════════\n';
    block += 'GUARDIAN INSTRUCTION\n';
    block += '═══════════════════════════════════\n\n';
    block += 'You last spoke ' + timeSinceLast + ' days ago.\n';
    block += 'Test your WITNESS LEDGER against the archive above. Update or overturn your prior lines if geometry demands it.\n\n';
    block += '── WITNESS LEDGER (your prior theories) ──\n\n';
    block += GUARDIAN_LEDGER_RECKONING_INSTRUCTION;
    var ledgerOrdered = ledgerLogs.slice().reverse();
    for (var li = 0; li < ledgerOrdered.length; li++) {
      var log = ledgerOrdered[li];
      var hdr = '[' + new Date(log.invoked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ']';
      if (log.log_type === 'auto_invoke' || log.auto_invoked) hdr += ' · strip';
      else if (log.log_type === 'summon') hdr += ' · summon';
      if (log.triggered_by) hdr += ' · ' + log.triggered_by;
      block += hdr + '\n';
      var line = log.theory_one_line ? String(log.theory_one_line).trim() : firstSubstantiveSentence(log.response_text);
      block += line + '\n';
      var afterLine = await buildLedgerAfterLine(log, allDiscs, summariesMap);
      block += afterLine + '\n\n';
      if (block.length >= budget * 0.85) break;
    }
    var latest = ledgerLogs[0];
    if (latest.response_text && block.length < budget * 0.9) {
      var excerpt = (latest.response_text || '').trim().slice(0, Math.min(400, budget - block.length - 60));
      block += '── LAST SPOKEN EXCERPT ──\n' + excerpt + '\n\n';
    }
  }

  if (block.length > budget) block = block.slice(0, budget) + '\n…[prior witness truncated]\n';
  return block;
}

async function buildGuardianContext(discs) {
  const totalWords = discs.reduce(function (sum, d) {
    return sum + ((d.raw_text || '').trim().split(/\s+/).filter(Boolean).length);
  }, 0);

  const dates = discs.filter(function (d) { return d.created_at; }).map(function (d) { return d.created_at; }).sort(function (a, b) { return a - b; });
  const firstDate = dates.length ? new Date(dates[0]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'unknown';
  const lastDate = dates.length ? new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'unknown';

  const sorted = discs.slice().sort(function (a, b) {
    return (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0);
  });

  const fastMapById = new Map();
  for (var fi = 0; fi < sorted.length; fi++) {
    var fm = await dbGet('guardian_summaries', sorted[fi].id);
    if (fm && fm.map_type === 'fast') fastMapById.set(sorted[fi].id, fm);
  }

  var header = '═══════════════════════════════════\n';
  header += 'ARCHIVE WITNESS RECORDS\n';
  header += '═══════════════════════════════════\n\n';
  header += 'Total discourses in the Soup: ' + discs.length + '\n';
  header += 'Time span: ' + firstDate + ' – ' + lastDate + '\n';
  header += 'Total words: ' + totalWords.toLocaleString() + '\n\n';

  // Tier 1 — last 3 by updated_at (sacred)
  var tier1 = '── RECENT DISCOURSES (full fast maps) ──\n\n';
  var tier1Count = Math.min(3, sorted.length);
  for (var t1 = 0; t1 < tier1Count; t1++) {
    tier1 += formatDiscourseWitnessBlock(sorted[t1], fastMapById.get(sorted[t1].id), t1 + 1);
  }

  // Tier 2 — top 5 watcher links with divergence notes
  var tier2 = '';
  if (isWatcherReady && watcherDB) {
    try {
      var allLinks = await wdb.getAll('links');
      if (allLinks.length) {
        var topLinks = allLinks.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
        var tier2Lines = [];
        for (var li = 0; li < topLinks.length; li++) {
          var link = topLinks[li];
          var mapA = fastMapById.get(link.a);
          var mapB = fastMapById.get(link.b);
          if (!mapA || !mapB) continue;
          var note = divergenceNote(link, mapA, mapB);
          if (note) {
            tier2Lines.push('· "' + discTitleMap(discs, link.a) + '" ↔ "' + discTitleMap(discs, link.b) + '": ' + note);
          }
        }
        if (tier2Lines.length) {
          tier2 = '── CROSS-MODAL TENSION (Watcher × Cartographer) ──\n\n' + tier2Lines.join('\n') + '\n\n';
        }
      }
    } catch (wErr) {
      console.warn('[Guardian] Watcher tier-2 skipped:', wErr);
    }
  }

  // Tier 3 — urgent deep maps only
  var tier3 = '';
  try {
    var urgent = await selectUrgentDiscourses(discs, 5);
    var deepParts = [];
    for (var ui = 0; ui < urgent.length; ui++) {
      var deepMap = await dbGet('guardian_summaries', urgent[ui].id + '_deep');
      if (deepMap && deepMap.summary) {
        deepParts.push('"' + (urgent[ui].title || 'Untitled') + '": ' + deepMap.summary);
      }
    }
    if (deepParts.length) {
      tier3 = '── DEEP MAPS (urgent discourses only) ──\n\n' + deepParts.join('\n\n') + '\n\n';
    }
  } catch (dErr) {
    console.warn('[Guardian] Deep map tier skipped:', dErr);
  }

  var corpusArcs = computeCorpusTermArcs(discs, fastMapById);
  var watcherLinks = [];
  if (isWatcherReady && watcherDB) {
    try { watcherLinks = await wdb.getAll('links'); } catch (wLinksErr) { watcherLinks = []; }
  }
  var returnDetections = computeReturnDetections(discs, fastMapById, watcherLinks);

  var synapse = getSynapseSnapshot();
  if (!synapse && isWitnessSubstrateEnabled()) {
    try { synapse = await buildSynapseSnapshot(); } catch (eSynCtx) {}
  }
  if (synapse && isWitnessSubstrateEnabled() && NQ_WITNESS_FLAGS.wire !== false) {
    var profile = getWitnessPostureProfile(synapse);
    header += 'Witness posture: ' + profile + '\n';
    if (synapse.local_pass && synapse.local_pass.graduation_quiet) {
      header += 'Invoke mode: graduation quiet\n';
    }
    header += '\n';
  }

  var tier4Blocks = await buildWitnessTier4Blocks(discs, sorted, fastMapById, corpusArcs, returnDetections, synapse);
  var tier4 = assembleGuardianTier4(synapse, tier4Blocks);

  return applyGuardianArchiveBudget(header, tier1, tier2, tier3, tier4, GUARDIAN_ARCHIVE_CHAR_BUDGET);
}

// Helper: resolve discourse title from ID
function discTitleMap(discs, id) {
  const d = discs.find(x => x.id === id);
  return d ? (d.title || 'Untitled') : 'Unknown';
}

async function streamGuardianResponse(contextBlock, apiKey, baseUrl, model){
  var responseEl = document.getElementById('guardian-response');
  var silenceEl = document.getElementById('guardian-silence');
  var glyph = document.getElementById('guardian-glyph');
  var inputArea = document.getElementById('guardian-input-area');
  var btn = document.getElementById('btn-summon-guardian');
  // First summon: seed the thread with the archive context
  // Follow-up: thread already contains history, just append new user message
  var messages;
  if (guardianThread.length === 0) {
    messages = [
      { role: 'system', content: GUARDIAN_SYSTEM_PROMPT },
      { role: 'user', content: contextBlock }
    ];
  } else {
    messages = [
      { role: 'system', content: GUARDIAN_SYSTEM_PROMPT }
    ].concat(guardianThread);
  }
  var res = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'X-Title': 'NakedQuantum' },
    body: JSON.stringify({ model: model, messages: messages, stream: true, max_tokens: 1200 })
  });
  if(!res.ok) throw new Error('HTTP ' + res.status);
  var reader = res.body.getReader();
  var decoder = new TextDecoder();
  var fullText = '';
  responseEl.className = 'guardian-response visible';
  while(true){
    var chunk = await reader.read();
    if(chunk.done) break;
    var lines = decoder.decode(chunk.value, {stream:true}).split('\n').filter(function(l){ return l.indexOf('data: ') === 0; });
    for(var i = 0; i < lines.length; i++){
      var raw = lines[i].slice(6).trim();
      if(raw === '[DONE]') break;
      try {
        var parsed = JSON.parse(raw);
        var token = (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) ? parsed.choices[0].delta.content : '';
        fullText += token;
        responseEl.textContent = fullText;
      } catch(e){}
    }
  }
  var isSilent = fullText.trim().toUpperCase() === 'SILENCE' || fullText.trim() === '';
  if(isSilent){
    responseEl.textContent = '';
    responseEl.className = 'guardian-response';
    glyph.className = 'guardian-glyph dimmed';
    silenceEl.className = 'guardian-silence visible';
    guardianState = 'silent';
    inputArea.className = 'guardian-input-area visible';
    btn.textContent = 'Summon again';
    btn.disabled = false;
    applyGuardianUiStrings('silent');
    await saveGuardianLog('', true, model);
  } else {
    guardianState = 'speaking';
    glyph.className = 'guardian-glyph watching';
    inputArea.className = 'guardian-input-area visible';
    btn.textContent = 'Summon again';
    btn.disabled = false;
    applyGuardianUiStrings('speaking');
    var savedLog = await saveGuardianLog(fullText, false, model);
    if (savedLog && savedLog.theory_one_line) showWitnessSummonBridgePrompt(savedLog);
  }
  try {
    localStorage.setItem('nq_guardian_last_invoke', String(Date.now()));
    if (guardianPendingTriggerType) {
      localStorage.setItem('nq_guardian_last_trigger_type', guardianPendingTriggerType);
      guardianPendingTriggerType = null;
    }
    localStorage.removeItem('nq_guardian_last_attempt');
  } catch (lsErr) {}
    // Add Guardian response to thread memory
  if (fullText && !isSilent) {
    guardianThread.push({ role: 'assistant', content: fullText });
  }
  // Close input if max exchanges reached
  if (guardianExchangeCount >= GUARDIAN_MAX_EXCHANGES) {
    document.getElementById('guardian-input-area').className = 'guardian-input-area';
    document.getElementById('guardian-input').placeholder = 'The Guardian has withdrawn.';
    document.getElementById('btn-guardian-send').disabled = true;
  }
  await renderGuardianLogs();
}


async function saveGuardianLog(text, wasSilent, modelUsed){
  var allDiscs = (await getDiscourses()).filter(function(d){ return !d.deleted_at && !d.isDeleted; });
  var sortedDiscs = allDiscs.slice().sort(function (a, b) {
    return (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0);
  });
  var primaryId = currentDiscourseId || (sortedDiscs[0] ? sortedDiscs[0].id : null);
  var snap = null;
  var fm = null;
  if (primaryId) {
    fm = await dbGet('guardian_summaries', primaryId);
    snap = buildGeometrySnapshot(primaryId, fm);
  }
  var quals = guardianPendingTriggerType ? [{ type: guardianPendingTriggerType }] : [];
  var theory = buildTheoryOneLine(guardianPendingTriggerType, quals, fm, text || '');
  var predictionTag = derivePredictionTag(guardianPendingTriggerType, quals, fm);
  var log = {
    id: 'gl_' + Date.now(),
    invoked_at: Date.now(),
    model_used: (modelUsed != null && modelUsed !== '') ? modelUsed : (localStorage.getItem('nq_guardian_model') || localStorage.getItem('nq_model') || ''),
    soup_snapshot_count: allDiscs.length,
    response_text: text,
    was_silent: wasSilent ? 1 : 0,
    thread: JSON.stringify(guardianThread),
    emotional_weight: 1.0,
    auto_invoked: 0,
    log_type: 'summon',
    primary_discourse_id: primaryId,
    geometry_snapshot: snap,
    triggered_by: guardianPendingTriggerType || null,
    qualifiers: JSON.stringify(quals),
    theory_one_line: theory,
    prediction_tag: predictionTag,
    prediction_outcome: null
  };
  guardianPendingTriggerType = null;
  await dbPut('guardian_logs', log);
  await appendWitnessLedgerLink(log.log_type === 'witness_field' ? 'witness_field' : 'summon', log.id, log);
  void refreshEpistemicMoodCache();
  return log;
}

async function renderGuardianLogs(){
  var section = document.getElementById('guardian-logs-list');
  var list = document.getElementById('guardian-logs-list');
  var allLogs = await dbGetAll('guardian_logs');
  if(!allLogs || !allLogs.length){ section.style.display = 'none'; return; }
  var sorted = allLogs.sort(function(a,b){ return b.invoked_at - a.invoked_at; });
  section.style.display = 'block';
  list.innerHTML = '';
  sorted.forEach(function(log){
    var item = document.createElement('div');
    item.className = 'guardian-log-item';
    var date = new Date(log.invoked_at).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
    if(log.was_silent){
      item.innerHTML = '<div class="guardian-log-date">' + date + '</div><div class="guardian-log-silent">&#43065; &mdash; silence</div>';
    } else {
      var preview = (log.theory_one_line || '').trim() || (log.response_text || '').slice(0, 120).trim();
      if (preview.length > 140) preview = preview.slice(0, 140) + '…';
      var typeTag = log.log_type === 'auto_invoke' || log.auto_invoked ? 'strip' : 'summon';
      item.innerHTML = '<div class="guardian-log-date">' + date + ' &middot; ' + typeTag + '</div><div class="guardian-log-preview">' + escHtml(preview) + '</div>';
      item.addEventListener('click', function(){ openGuardianLogDetail(log); });
    }
    list.appendChild(item);
  });
}

function openGuardianLogDetail(log){
  _witnessDetailLog = log;
  var detail = document.getElementById('guardian-log-detail');
  var content = document.getElementById('guardian-log-detail-content');
  var date = new Date(log.invoked_at).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  var html = '<div class="guardian-log-detail-text">';
  html += '<div>' + escHtml(String.fromCodePoint(43065) + ' ' + date) + '</div>';
  var typeTag = log.log_type === 'auto_invoke' || log.auto_invoked ? 'strip' : (log.log_type || 'summon');
  html += '<div>' + escHtml(typeTag + (log.triggered_by ? ' · ' + log.triggered_by : '')) + '</div>';
  if (log.theory_one_line) {
    html += '<div class="witness-theory-line"><strong>Theory:</strong> ' + escHtml(String(log.theory_one_line).trim()) + '</div>';
  }
  if (log.prediction_tag) {
    var predLine = 'Prediction: ' + log.prediction_tag;
    if (log.prediction_outcome) predLine += ' → ' + log.prediction_outcome;
    else predLine += ' (pending)';
    html += '<div>' + escHtml(predLine) + '</div>';
  }
  var quals = parseQualifiers(log.qualifiers);
  if (quals.length) {
    html += '<div>' + escHtml('Qualifiers: ' + quals.map(function (q) { return q.type || q; }).join(', ')) + '</div>';
  }
  if (isWitnessSubstrateEnabled() && NQ_WITNESS_FLAGS.bridges !== false && log.theory_one_line && typeTag === 'summon') {
    html += '<div class="witness-bridge-actions">';
    html += '<button type="button" class="witness-bridge-btn" data-witness-action="correct">Correct</button>';
    html += '<button type="button" class="witness-bridge-btn" data-witness-action="reject">Reject</button>';
    html += '</div>';
  }
  html += '<pre class="guardian-log-body">' + escHtml(log.response_text || '') + '</pre>';
  html += '</div>';
  content.innerHTML = html;
  content.querySelectorAll('[data-witness-action]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var act = btn.getAttribute('data-witness-action');
      if (act === 'correct' || act === 'reject') void handleWitnessBridgeAction(act);
    });
  });
  detail.classList.add('open');
}

function closeGuardianLogDetail(){
  _witnessDetailLog = null;
  document.getElementById('guardian-log-detail').classList.remove('open');
}

async function handleGuardianOffer(){
  var input = document.getElementById('guardian-input');
  var text = input.value.trim();
  if(!text) return;
  if(guardianExchangeCount >= GUARDIAN_MAX_EXCHANGES) return;
  var apiKey = await readSecureKey('nq_api_key');
  if(!apiKey){ showToast('No API key'); return; }
  var guardianModel = localStorage.getItem('nq_guardian_model') || localStorage.getItem('nq_model') || 'deepseek/deepseek-r1';
  var baseUrl = openRouterChatBaseUrl();
  input.value = '';
  guardianExchangeCount++;
  // Add user message to thread
  guardianThread.push({ role: 'user', content: text });
  document.getElementById('guardian-input-area').className = 'guardian-input-area';
  document.getElementById('guardian-response').textContent = '';
  document.getElementById('guardian-response').className = 'guardian-response';
  hideWitnessSummonBridgePrompt();
  document.getElementById('guardian-silence').className = 'guardian-silence';
  document.getElementById('guardian-glyph').className = 'guardian-glyph watching';
  try {
    await streamGuardianResponse(guardianContextBlock, apiKey, baseUrl, guardianModel);
  } catch (err) {
    console.error('Guardian follow-up failed:', err);
    try { localStorage.setItem('nq_guardian_last_attempt', String(Date.now())); } catch (e2) {}
    guardianPendingTriggerType = null;
    showToast('The Abyss did not respond');
  }
}

