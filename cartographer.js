/**

- NakedQuantum -- Sovereign NLP Pipeline
- cartographer.js v0.3
- 
- Pure functions. No DOM. No DB. No globals.
- Takes text in, returns rich shape data out.
- Guardian does the interpretation. We do the geometry.
  */

// ── STOPWORDS ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
'the','a','an','is','was','were','be','been','being','have','has','had',
'do','does','did','will','would','shall','should','may','might','must',
'can','could','i','me','my','mine','myself','you','your','yours',
'he','him','his','she','her','hers','it','its','itself',
'we','us','our','ours','they','them','their','theirs',
'this','that','these','those','what','which','who','whom',
'and','but','or','nor','not','so','yet','for','if','to','of','in',
'on','at','by','from','with','about','into','through','during',
'after','above','below','between','out','off','over','under',
'again','further','then','once','here','there','when','where',
'why','how','all','both','each','few','more','most','other','some',
'such','only','own','same','than','too','very','just','now',
'also','even','still','already','always','never','sometimes'
]);

// ── SENTIMENT LEXICONS ────────────────────────────────────────────────────────

const SENTIMENT = {
positive: new Set([
'love','hope','light','warm','open','free','peace','calm','soft',
'gentle','bright','clear','true','whole','heal','grow','bloom',
'rise','reach','hold','safe','trust','grace','grateful',
'alive','present','found','grounded','clean','solid','awake',
'sublime','pure','kiss','touch','connected','persist','move'
]),
negative: new Set([
'fear','pain','dark','cold','close','trapped','heavy','hard',
'sharp','lost','broken','wound','fall','sink','empty','alone',
'silence','never','nothing','hollow','bitter','ache','weight',
'numb','exhausted','stuck','suffocating','invisible','worthless',
'ashamed','rage','frozen','collapse','despair','haunt','scream',
'blind','deaf','cruel','stripped','torn','melting','dissolve'
]),
tentative: new Set([
'perhaps','maybe','sometimes','could','might','seems','almost',
'trying','wondering','question','uncertain','hesitate',
'unsure','vague','confused','sort','kind','wonder','odd','strange'
]),
confessional: new Set([
'truth','honest','admit','confess','real','raw','naked',
'bare','expose','reveal','actually','felt','feel','feeling',
'touched','ache','i','myself','oneself','within','inside'
]),
resolved: new Set([
'accept','chose','decide','finally','enough','done','settle',
'rest','still','quiet','understood','understand','knowing',
'release','complete','peace','closed','capacity','essence'
]),
dissolution: new Set([
'abyss','void','fragment','dissolve','melt','collapse','forget',
'lost','random','unknown','chaos','infinite','separate','torn',
'destroy','fade','drift','shadow','ghost','erasure','nothing'
]),
existence: new Set([
'exist','universe','consciousness','soul','being','presence',
'observer','essence','persist','human','alive','death','born',
'life','infinite','eternal','moment','now','time','self','i'
]),
sensory: new Set([
'touch','smell','taste','hear','see','felt','skin','breath',
'hand','eye','voice','sound','light','dark','warm','cold',
'soft','sharp','bitter','sweet','smell','scent','weight',
'body','blood','bone','heart','pulse','trembling','grazing'
]),
abstract: new Set([
'truth','meaning','concept','theory','idea','principle','logic',
'reason','existence','consciousness','reality','perception',
'universe','infinity','probability','pattern','structure',
'nature','essence','substance','form','relation','cause'
])
};

// ── MARKER SETS ───────────────────────────────────────────────────────────────

const INVERSION_MARKERS = new Set([
'but','yet','unless','except','though','rather','instead',
'however','still','only','while','despite','until','and yet'
]);

const ABSOLUTES = new Set([
'always','never','everyone','nobody','nothing','everything',
'impossible','must','ruined','completely','absolutely','totally',
'forever','all','none','only','exactly','certain','definitely'
]);

// ── EXISTING FUNCTIONS (unchanged) ───────────────────────────────────────────

function extractEdges(text) {
const lines = text.split('\n').filter(l => l.trim().length > 0);
if (lines.length === 0) return { first_line: '', last_line: '' };
return {
first_line: lines[0].trim().slice(0, 200),
last_line: lines[lines.length - 1].trim().slice(0, 200)
};
}

function extractKeyTerms(text, maxTerms = 10) {
const words = text.toLowerCase()
.replace(/[^\w\s']/g, '')
.split(/\s+/)
.filter(w => w.length > 2 && !STOPWORDS.has(w));

const freq = {};
for (const w of words) { freq[w] = (freq[w] || 0) + 1; }

const totalWords = words.length;
const terms = Object.entries(freq)
.map(([term, count]) => ({
term,
count,
tfidf: (count / totalWords) * Math.log(totalWords / (1 + count))
}))
.sort((a, b) => b.tfidf - a.tfidf)
.slice(0, maxTerms);

return terms;
}

function detectInversionDensity(text) {
const sentences = text.split(/[.!?;]+/).filter(s => s.trim().length > 0);
if (!sentences.length) return { label: 'No signal', ratio: 0, count: 0 };
let count = 0;
for (const s of sentences) {
const words = s.toLowerCase().split(/\s+/);
for (const w of words) {
if (INVERSION_MARKERS.has(w)) { count++; break; }
}
}
const ratio = count / sentences.length;
let label;
if (ratio === 0)      label = 'Asserting';
else if (ratio < 0.2) label = 'Occasional inversion';
else if (ratio < 0.4) label = 'Dialectical';
else                  label = 'Perpetual self-argument';
return { label, count, ratio: parseFloat(ratio.toFixed(3)) };
}

function detectParadoxProximity(text) {
const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
const WINDOW = 6;
let paradoxCount = 0;
const paradoxPairs = [];
for (let i = 0; i < words.length; i++) {
const w = words[i];
const inPos = SENTIMENT.positive.has(w) || SENTIMENT.existence.has(w);
const inNeg = SENTIMENT.negative.has(w) || SENTIMENT.dissolution.has(w);
if (!inPos && !inNeg) continue;
for (let j = i + 1; j < Math.min(i + WINDOW, words.length); j++) {
const w2 = words[j];
const w2Pos = SENTIMENT.positive.has(w2) || SENTIMENT.existence.has(w2);
const w2Neg = SENTIMENT.negative.has(w2) || SENTIMENT.dissolution.has(w2);
if ((inPos && w2Neg) || (inNeg && w2Pos)) {
paradoxCount++;
if (paradoxPairs.length < 5) paradoxPairs.push(w + '/' + w2);
break;
}
}
}
const density = paradoxCount / Math.max(words.length / 10, 1);
let label;
if (paradoxCount === 0)  label = 'Uniform';
else if (density < 0.5)  label = 'Occasional tension';
else if (density < 1.5)  label = 'Charged';
else                     label = 'Paradox-dominant';
return { label, count: paradoxCount, pairs: paradoxPairs };
}

function detectRepetitionOrbits(text) {
const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
const meaningful = words.filter(w => w.length > 3 && !STOPWORDS.has(w));
const freq = {};
for (const w of meaningful) { freq[w] = (freq[w] || 0) + 1; }
const orbiting = Object.entries(freq)
.filter(([, count]) => count >= 3)
.sort((a, b) => b[1] - a[1])
.slice(0, 5)
.map(([term, count]) => ({ term, count }));
const label = orbiting.length === 0 ? 'No orbit' :
orbiting.length <= 2  ? 'Single orbit' : 'Multi-orbit';
return { label, orbiting };
}

function detectFragmentRatio(text) {
const sentences = text.split(/[.!?;]+/)
.map(s => s.trim().split(/\s+/).filter(Boolean).length)
.filter(l => l > 0);
if (!sentences.length) return { label: 'No signal', ratio: 0 };
const fragments = sentences.filter(l => l <= 5).length;
const ratio = fragments / sentences.length;
let label;
if (ratio < 0.2)      label = 'Prose';
else if (ratio < 0.4) label = 'Mixed';
else if (ratio < 0.7) label = 'Fragmented';
else                  label = 'Shards';
return { label, ratio: parseFloat(ratio.toFixed(3)) };
}

function detectWritingSignature(text) {
const inversion  = detectInversionDensity(text);
const paradox    = detectParadoxProximity(text);
const orbits     = detectRepetitionOrbits(text);
const fragments  = detectFragmentRatio(text);
const orbitTerms = orbits.orbiting.map(o => o.term).join(', ');
const summaryParts = [
inversion.label,
paradox.label,
orbits.orbiting.length ? 'Orbiting [' + orbitTerms + ']' : 'No orbit',
fragments.label
];
return {
summary: summaryParts.join(' · '),
inversion,
paradox,
orbits,
fragments
};
}

function detectPacing(text) {
const sentences = text.split(/[.!?]+/)
.map(s => s.trim().split(/\s+/).filter(Boolean).length)
.filter(l => l > 0);
if (!sentences.length) return { label: 'Fragmented', avg_words_per_sentence: 0 };
const avg = sentences.reduce((a, b) => a + b, 0) / sentences.length;
let label;
if (avg < 6)       label = 'Staccato';
else if (avg < 14) label = 'Measured';
else if (avg < 25) label = 'Flowing';
else               label = 'Spiraling';
return { label, avg_words_per_sentence: parseFloat(avg.toFixed(1)) };
}

function detectRigidity(text) {
const words = text.toLowerCase().match(/\b\w+\b/g) || [];
let count = 0;
for (const w of words) { if (ABSOLUTES.has(w)) count++; }
const ratio = count / Math.max(words.length, 1);
const label = ratio > 0.02 ? 'Rigid' : ratio > 0.01 ? 'Tense' : 'Fluid';
return { label, absolute_count: count, ratio: parseFloat(ratio.toFixed(4)) };
}

function detectQuestionDensity(text) {
const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
const questions = (text.match(/\?/g) || []).length;
if (!sentences.length) return { label: 'No signal', ratio: 0 };
const ratio = questions / sentences.length;
let label;
if (ratio === 0)      label = 'Declarative';
else if (ratio < 0.1) label = 'Mostly closed';
else if (ratio < 0.3) label = 'Inquiring';
else                  label = 'Unanchored';
return { label, question_count: questions, ratio: parseFloat(ratio.toFixed(3)) };
}

function detectEmotionalArc(text) {
const lines = text.split('\n').filter(l => l.trim().length > 0);
if (lines.length < 3) return {
direction: 'too short',
opening_tone: 'neutral',
closing_tone: 'neutral',
tension_shift: 0
};

const firstThird = lines.slice(0, Math.ceil(lines.length / 3)).join(' ').toLowerCase();
const lastThird  = lines.slice(-Math.ceil(lines.length / 3)).join(' ').toLowerCase();

function score(t, lexicon) {
const words = t.split(/\s+/);
let hits = 0;
for (const w of words) { if (lexicon.has(w)) hits++; }
return hits / Math.max(words.length, 1);
}

const openingTones = [
{ name: 'tentative',    score: score(firstThird, SENTIMENT.tentative) },
{ name: 'confessional', score: score(firstThird, SENTIMENT.confessional) },
{ name: 'negative',     score: score(firstThird, SENTIMENT.negative) },
{ name: 'positive',     score: score(firstThird, SENTIMENT.positive) }
].sort((a, b) => b.score - a.score);

const closingTones = [
{ name: 'resolved',     score: score(lastThird, SENTIMENT.resolved) + score(lastThird, SENTIMENT.positive) },
{ name: 'confessional', score: score(lastThird, SENTIMENT.confessional) },
{ name: 'negative',     score: score(lastThird, SENTIMENT.negative) },
{ name: 'tentative',    score: score(lastThird, SENTIMENT.tentative) }
].sort((a, b) => b.score - a.score);

const openingTone  = openingTones[0].name;
const closingTone  = closingTones[0].name;
const openNeg      = score(firstThird, SENTIMENT.negative);
const closeNeg     = score(lastThird, SENTIMENT.negative);
const tensionShift = openNeg - closeNeg;

let direction;
if (tensionShift > 0.02)       direction = `${openingTone} → resolving`;
else if (tensionShift < -0.02) direction = `${openingTone} → escalating`;
else                           direction = `${openingTone} → ${closingTone}`;

return {
direction,
opening_tone: openingTone,
closing_tone: closingTone,
tension_shift: parseFloat(tensionShift.toFixed(3))
};
}

function extractiveSummary(text, maxSentences = 5) {
const sentences = text
.replace(/([.!?])\s+/g, '$1|')
.split('|')
.filter(s => s.trim().length > 20);

if (sentences.length <= maxSentences) return sentences.join(' ').trim();

const keyTerms   = extractKeyTerms(text, 15);
const keyTermSet = new Set(keyTerms.map(t => t.term));

const scored = sentences.map((s, i) => {
const words = s.toLowerCase().split(/\s+/);
let termScore = 0;
for (const w of words) { if (keyTermSet.has(w)) termScore++; }
const positionBonus = (i === 0 || i === sentences.length - 1) ? 0.5 :
(i < 3 || i > sentences.length - 3) ? 0.2 : 0;
return { sentence: s.trim(), score: (termScore / words.length) + positionBonus, index: i };
});

return scored
.sort((a, b) => b.score - a.score)
.slice(0, maxSentences)
.sort((a, b) => a.index - b.index)
.map(t => t.sentence)
.join(' ')
.trim();
}

// ── NEW FUNCTIONS ─────────────────────────────────────────────────────────────

/**

- detectPronounTrajectory
- 
- Tracks the shift from I → You → We → Nothing across the discourse.
- In aphoristic writing, I→You is confrontation.
- In narrative writing, I→We is intimacy deepening.
- Disappearance of all pronouns = dissolution or transcendence.
  */
  function detectPronounTrajectory(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return { label: 'Too short', trajectory: [], dominant: 'none' };

const thirds = [
lines.slice(0, Math.ceil(lines.length / 3)),
lines.slice(Math.ceil(lines.length / 3), Math.ceil(lines.length * 2 / 3)),
lines.slice(Math.ceil(lines.length * 2 / 3))
];

const I_PRONOUNS  = new Set(['i','me','my','mine','myself']);
const YOU_PRONOUNS = new Set(['you','your','yours','yourself']);
const WE_PRONOUNS = new Set(['we','us','our','ours','ourselves']);

function pronounScore(chunk, set) {
const words = chunk.join(' ').toLowerCase().split(/\s+/);
return words.filter(w => set.has(w)).length / Math.max(words.length, 1);
}

const trajectory = thirds.map((chunk, idx) => ({
position: idx === 0 ? 'opening' : idx === 1 ? 'middle' : 'closing',
I:   parseFloat(pronounScore(chunk, I_PRONOUNS).toFixed(4)),
you: parseFloat(pronounScore(chunk, YOU_PRONOUNS).toFixed(4)),
we:  parseFloat(pronounScore(chunk, WE_PRONOUNS).toFixed(4))
}));

// Dominant arc: what is the overall movement?
const openI   = trajectory[0].I;
const closeI  = trajectory[2].I;
const openYou = trajectory[0].you;
const closeYou= trajectory[2].you;
const openWe  = trajectory[0].we;
const closeWe = trajectory[2].we;

const allLow  = closeI < 0.01 && closeYou < 0.01 && closeWe < 0.01;
const toYou   = closeYou > openYou && closeYou > closeWe;
const toWe    = closeWe  > openWe  && closeWe  > closeYou;
const toI     = closeI   > openI;
const fromI   = openI > 0.02 && closeI < openI * 0.5;

let label;
if (allLow)       label = 'Dissolution -- pronouns vanish';
else if (toYou)   label = 'I → You -- confrontation or address';
else if (toWe)    label = 'I → We -- merging or intimacy';
else if (fromI)   label = 'I receding -- self dissolving';
else if (toI)     label = 'Returning to I -- self reasserting';
else              label = 'Stable -- no significant shift';

// Find overall dominant pronoun across full text
const full = text.toLowerCase().split(/\s+/);
const iCount   = full.filter(w => I_PRONOUNS.has(w)).length;
const youCount = full.filter(w => YOU_PRONOUNS.has(w)).length;
const weCount  = full.filter(w => WE_PRONOUNS.has(w)).length;
const dominant = iCount >= youCount && iCount >= weCount ? 'I' :
youCount >= weCount ? 'you' : 'we';

return { label, trajectory, dominant };
}

/**

- detectSilenceWeight
- 
- Identifies isolated short lines (≤6 words) that appear after
- dense paragraphs (>20 words). These are intentional breath marks --
- not truncated thoughts but held pauses.
- High silence weight = writing that uses negative space as meaning.
  */
  function detectSilenceWeight(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 3) return { label: 'Too short', count: 0, ratio: 0, examples: [] };

const lineLengths = lines.map(l => l.split(/\s+/).filter(Boolean).length);
let silenceCount  = 0;
const examples    = [];

for (let i = 1; i < lines.length; i++) {
const prevLen = lineLengths[i - 1];
const currLen = lineLengths[i];
// A silence: short line (≤6 words) after a dense line (>20 words)
if (prevLen > 20 && currLen <= 6) {
silenceCount++;
if (examples.length < 3) examples.push(lines[i]);
}
}

// Also count standalone single-line stanzas (line before and after are empty in original)
// These are already captured as short lines in the filtered list,
// but we give extra weight to lines of ≤4 words that stand completely alone
const raw = text.split('\n');
for (let i = 1; i < raw.length - 1; i++) {
const prev = raw[i - 1].trim();
const curr = raw[i].trim();
const next = raw[i + 1].trim();
const words = curr.split(/\s+/).filter(Boolean).length;
if (prev === '' && next === '' && words > 0 && words <= 4) {
silenceCount++;
if (examples.length < 3 && !examples.includes(curr)) examples.push(curr);
}
}

const ratio = silenceCount / Math.max(lines.length, 1);
let label;
if (silenceCount === 0)  label = 'No silence markers';
else if (ratio < 0.05)   label = 'Sparse silence';
else if (ratio < 0.15)   label = 'Deliberate breath';
else                     label = 'Silence as structure';

return { label, count: silenceCount, ratio: parseFloat(ratio.toFixed(3)), examples };
}

/**

- detectEntryExitDelta
- 
- Measures the shift between abstract and sensory writing
- from opening to closing third.
- Abstract entry → sensory exit = grounding, embodiment
- Sensory entry → abstract exit = distancing, transcendence
- Both abstract = pure intellectual processing
- Both sensory = stayed in the body
  */
  function detectEntryExitDelta(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 3) return {
  label: 'Too short',
  entry: 'unknown',
  exit: 'unknown',
  delta: 'none'
  };

const opening = lines.slice(0, Math.ceil(lines.length / 3)).join(' ').toLowerCase();
const closing = lines.slice(-Math.ceil(lines.length / 3)).join(' ').toLowerCase();

function densityScore(chunk, lexicon) {
const words = chunk.split(/\s+/).filter(Boolean);
const hits  = words.filter(w => lexicon.has(w)).length;
return hits / Math.max(words.length, 1);
}

const openSensory  = densityScore(opening, SENTIMENT.sensory);
const openAbstract = densityScore(opening, SENTIMENT.abstract);
const closeSensory = densityScore(closing, SENTIMENT.sensory);
const closeAbstract= densityScore(closing, SENTIMENT.abstract);

const entry = openSensory > openAbstract   ? 'sensory'   : 'abstract';
const exit  = closeSensory > closeAbstract ? 'sensory'   : 'abstract';

let delta;
if (entry === 'abstract' && exit === 'sensory') delta = 'abstract → sensory (grounding)';
else if (entry === 'sensory' && exit === 'abstract') delta = 'sensory → abstract (transcending)';
else if (entry === 'abstract' && exit === 'abstract') delta = 'abstract throughout (intellectual)';
else delta = 'sensory throughout (embodied)';

let label;
if (entry === exit) label = entry === 'abstract' ? 'Intellectual' : 'Embodied';
else label = entry === 'abstract' ? 'Grounding' : 'Transcending';

return {
label,
entry,
exit,
delta,
scores: {
open_sensory:   parseFloat(openSensory.toFixed(4)),
open_abstract:  parseFloat(openAbstract.toFixed(4)),
close_sensory:  parseFloat(closeSensory.toFixed(4)),
close_abstract: parseFloat(closeAbstract.toFixed(4))
}
};
}

/**

- detectIncompleteness
- 
- Determines whether the discourse ends in a resolved or
- deliberately open state -- and crucially distinguishes
- intentional incompleteness from abandoned writing.
- 
- Signals of intentional incompleteness:
- - Ends on a question
- - Ends on a fragment (≤5 words)
- - Ends on a dissolution/existence word
- - Final line contains an ellipsis or dash
- 
- Signals of resolution:
- - Ends on a resolved/positive sentiment word
- - Final sentence is declarative and complete (>10 words, no ?)
    */
    function detectIncompleteness(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return { label: 'Empty', type: 'unknown', final_line: '' };

const finalLine  = lines[lines.length - 1].trim();
const finalWords = finalLine.split(/\s+/).filter(Boolean);
const finalLen   = finalWords.length;
const lastWord   = (finalWords[finalWords.length - 1] || '').replace(/[^a-z]/gi, '').toLowerCase();

// Signals
const endsOnQuestion    = finalLine.endsWith('?');
const endsOnFragment    = finalLen <= 5;
const endsOnEllipsis    = finalLine.endsWith('...') || finalLine.endsWith('\u2026');
const endsOnDash        = /[—–-]$/.test(finalLine);
const endsOnDissolution = SENTIMENT.dissolution.has(lastWord) || SENTIMENT.existence.has(lastWord);
const endsOnResolved    = SENTIMENT.resolved.has(lastWord) || SENTIMENT.positive.has(lastWord);
const isFullSentence    = finalLen > 10 && !endsOnQuestion;

// Score intentional incompleteness
let incompleteScore = 0;
if (endsOnQuestion)    incompleteScore += 3;
if (endsOnFragment)    incompleteScore += 2;
if (endsOnEllipsis)    incompleteScore += 2;
if (endsOnDash)        incompleteScore += 2;
if (endsOnDissolution) incompleteScore += 1;

let resolvedScore = 0;
if (endsOnResolved)  resolvedScore += 2;
if (isFullSentence)  resolvedScore += 1;

let type, label;

if (endsOnQuestion) {
type  = 'open_question';
label = 'Ends on question -- deliberately open';
} else if (endsOnEllipsis || endsOnDash) {
type  = 'suspended';
label = 'Suspended -- trails off intentionally';
} else if (incompleteScore > resolvedScore) {
type  = 'incomplete';
label = 'Incomplete -- held open';
} else if (resolvedScore > incompleteScore) {
type  = 'resolved';
label = 'Resolved -- landed';
} else {
type  = 'ambiguous';
label = 'Ambiguous ending';
}

return {
label,
type,
final_line: finalLine,
signals: {
ends_on_question:    endsOnQuestion,
ends_on_fragment:    endsOnFragment,
ends_on_ellipsis:    endsOnEllipsis,
ends_on_dash:        endsOnDash,
ends_on_dissolution: endsOnDissolution,
ends_on_resolved:    endsOnResolved
}
};
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

/**

- generateFastMapData(text)
- 
- The single export. Takes raw text, returns the full shape map.
- No async. No DB. No side effects.
- Call this from generateFastMap() in index.html.
  */
  export function generateFastMapData(text) {
  const words     = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

const edges       = extractEdges(text);
const key_terms   = extractKeyTerms(text, 10);
const emotional_arc     = detectEmotionalArc(text);
const extractive_summary = extractiveSummary(text, 3);
const pacing      = detectPacing(text);
const rigidity    = detectRigidity(text);
const questioning = detectQuestionDensity(text);
const signature   = detectWritingSignature(text);

// New shape dimensions
const pronoun_trajectory = detectPronounTrajectory(text);
const silence_weight     = detectSilenceWeight(text);
const entry_exit_delta   = detectEntryExitDelta(text);
const incompleteness     = detectIncompleteness(text);

return {
// Core
word_count: wordCount,
first_line: edges.first_line,
last_line:  edges.last_line,
// Existing
key_terms,
emotional_arc,
extractive_summary,
pacing,
rigidity,
questioning,
signature,
// New
pronoun_trajectory,
silence_weight,
entry_exit_delta,
incompleteness
};
}
