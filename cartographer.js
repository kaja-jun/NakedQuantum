/**

- NakedQuantum -- Sovereign NLP Pipeline
- cartographer.js v0.4 (C1 stemmer, C2 negation, carto_version 4)
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
'blind','deaf','cruel','stripped','torn','melting','dissolve',
'gutted','devastated','shattered','crushed','hopeless','brokenness'
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
avoidance: new Set([
'perhaps', 'maybe', 'somehow', 'later', 'busy', 'distracted', 
'forget', 'ignore', 'anyway', 'regardless', 'whatever', 'tired'
]),
surrender: new Set([
'done', 'stop', 'yield', 'release', 'empty', 'pointless', 
'useless', 'resigned', 'letting', 'washed', 'carried'
]),
fixation: new Set([
'must', 'cannot', 'always', 'never', 'loop', 
'stuck', 'again', 'circling', 'obsessed', 'bound', 'tied'
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
'however','still','only','while','despite','until'
]);

const ABSOLUTES = new Set([
'always','never','everyone','nobody','nothing','everything',
'impossible','must','ruined','completely','absolutely','totally',
'forever','all','none','only','exactly','certain','definitely'
]);

// ── NORMALIZATION ───────────────────────────────────────────────────────────

const LEMMA_MAP = new Map([
  // positive
  ['loving','love'], ['loved','love'], ['loves','love'],
  ['hoping','hope'], ['hoped','hope'], ['hopes','hope'],
  ['healing','heal'], ['healed','heal'], ['heals','heal'],
  ['growing','grow'], ['grew','grow'], ['grown','grow'],
  ['blooming','bloom'], ['bloomed','bloom'],
  ['rising','rise'], ['rose','rise'], ['risen','rise'],
  // negative
  ['feared','fear'], ['fearing','fear'], ['fears','fear'],
  ['pained','pain'], ['paining','pain'],
  ['trapped','trap'],
  ['broken','break'], ['breaking','break'], ['breaks','break'],
  ['falling','fall'], ['fell','fall'], ['fallen','fall'],
  ['sinking','sink'], ['sank','sink'], ['sunk','sink'],
  ['aching','ache'], ['ached','ache'], ['aches','ache'],
  ['screaming','scream'], ['screamed','scream'],
  // dissolution / existence
  ['dissolving','dissolve'], ['dissolved','dissolve'],
  ['melting','melt'], ['melted','melt'],
  ['collapsing','collapse'], ['collapsed','collapse'],
  ['forgetting','forget'], ['forgot','forget'], ['forgotten','forget'],
  // sensory
  ['touched','touch'], ['touching','touch'], ['touches','touch'],
  ['smelling','smell'], ['smelled','smell'],
  ['tasting','taste'], ['tasted','taste'],
  ['hearing','hear'], ['heard','hear'],
  ['seeing','see'], ['saw','see'], ['seen','see'],
  ['feeling','feel'], ['felt','feel'],
  ['breathing','breath'], ['breathed','breath']
]);

const CONTRACTION_FORMS = {
  "don't": 'dont', "doesn't": 'doesnt', "didn't": 'didnt', "won't": 'wont',
  "wouldn't": 'wouldnt', "couldn't": 'couldnt', "shouldn't": 'shouldnt',
  "can't": 'cant', "isn't": 'isnt', "aren't": 'arent', "wasn't": 'wasnt',
  "weren't": 'werent', "hasn't": 'hasnt', "haven't": 'havent', "hadn't": 'hadnt',
  "mustn't": 'mustnt', "needn't": 'neednt', "ain't": 'aint'
};

const NEGATORS = new Set([
  'not', 'never', 'no', 'nor', 'neither', 'none', 'without', 'hardly', 'barely',
  'cannot', 'cant', 'dont', 'doesnt', 'didnt', 'wont', 'wouldnt', 'couldnt',
  'shouldnt', 'isnt', 'arent', 'wasnt', 'werent', 'hasnt', 'havent', 'hadnt',
  'mustnt', 'neednt', 'aint'
]);

function buildLexiconWords() {
  const s = new Set();
  for (const key of Object.keys(SENTIMENT)) {
    for (const w of SENTIMENT[key]) s.add(w);
  }
  for (const w of INVERSION_MARKERS) s.add(w);
  for (const w of ABSOLUTES) s.add(w);
  return s;
}

const LEXICON_WORDS = buildLexiconWords();

const VALID_STEMS = (function () {
  const s = new Set(LEXICON_WORDS);
  for (const [k, v] of LEMMA_MAP) { s.add(k); s.add(v); }
  return s;
})();

function normalizeContractions(w) {
  if (CONTRACTION_FORMS[w]) return CONTRACTION_FORMS[w];
  if (w.endsWith("n't") && w.length > 3) return w.slice(0, -3) + 'nt';
  if (w.endsWith("'re")) return w.slice(0, -3);
  if (w.endsWith("'ve")) return w.slice(0, -3);
  if (w.endsWith("'ll")) return w.slice(0, -3);
  if (w.endsWith("'d") && w.length > 2) return w.slice(0, -2);
  if (w.endsWith("'m")) return w.slice(0, -2);
  if (w.endsWith("'s") && w.length > 2) return w.slice(0, -2);
  return w;
}

function safeSuffixStem(w) {
  if (LEXICON_WORDS.has(w)) return w;
  if (w.length > 4 && w.endsWith('ing')) {
    const stem = w.slice(0, -3);
    if (stem.length >= 3 && VALID_STEMS.has(stem)) return stem;
  }
  if (w.length > 3 && w.endsWith('ed')) {
    const stem = w.slice(0, -2);
    if (stem.length >= 2 && VALID_STEMS.has(stem)) return stem;
  }
  if (w.length > 3 && w.endsWith('es')) {
    const stem = w.slice(0, -2);
    if (stem.length >= 2 && VALID_STEMS.has(stem)) return stem;
  }
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) {
    const stem = w.slice(0, -1);
    if (stem.length >= 2 && VALID_STEMS.has(stem)) return stem;
  }
  return w;
}

function normalizeToken(raw) {
  if (!raw) return '';
  let w = raw.toLowerCase();
  w = w.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  w = w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
  if (!w) return '';
  w = normalizeContractions(w);
  if (STOPWORDS.has(w)) return w;
  if (LEMMA_MAP.has(w)) return LEMMA_MAP.get(w);
  return safeSuffixStem(w);
}

function isNegated(words, index) {
  for (let k = Math.max(0, index - 2); k < index; k++) {
    if (NEGATORS.has(words[k])) return true;
  }
  return false;
}

/** Count lexicon hits; negated hits are excluded (e.g. "not happy" → no positive hit). */
function lexiconHitRate(textOrWords, lexicon) {
  const words = Array.isArray(textOrWords) ? textOrWords : tokenize(textOrWords);
  if (!words.length) return 0;
  let hits = 0;
  for (let i = 0; i < words.length; i++) {
    if (lexicon.has(words[i]) && !isNegated(words, i)) hits++;
  }
  return hits / words.length;
}

/** Polarity for paradox / tension: pos | neg | null */
function wordSentimentPolarity(words, index) {
  const w = words[index];
  const negated = isNegated(words, index);
  const pos = SENTIMENT.positive.has(w) || SENTIMENT.existence.has(w);
  const neg = SENTIMENT.negative.has(w) || SENTIMENT.dissolution.has(w);
  if (pos && !neg) return negated ? 'neg' : 'pos';
  if (neg && !pos) return negated ? 'pos' : 'neg';
  if (pos && neg) return negated ? null : 'pos';
  return null;
}

function lexiconHitNegated(words, index, lexicon) {
  return lexicon.has(words[index]) && !isNegated(words, index);
}

function tokenize(text) {
  if (!text) return [];
  // split on whitespace, normalize each token, drop empties
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
}

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
const words = tokenize(text).filter(w => w.length > 2 && !STOPWORDS.has(w));

const freq = {};
for (const w of words) { freq[w] = (freq[w] || 0) + 1; }

const totalWords = words.length;
const terms = Object.entries(freq)
.map(([term, count]) => ({
term,
count,
keyness: (count / totalWords) * Math.log(totalWords / (1 + count))
}))
.sort((a, b) => b.keyness - a.keyness)
.slice(0, maxTerms);

return terms;
}

function detectInversionDensity(text) {
  const sentences = text.split(/[.!?;]+/).filter(s => s.trim().length > 0);
  if (!sentences.length) return { label: 'No signal', ratio: 0, count: 0 };
  let count = 0;
  for (const s of sentences) {
    const words = tokenize(s);
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
const words = tokenize(text);
const WINDOW = 6;
let paradoxCount = 0;
const paradoxPairs = [];
for (let i = 0; i < words.length; i++) {
const polA = wordSentimentPolarity(words, i);
if (!polA) continue;
for (let j = i + 1; j < Math.min(i + WINDOW, words.length); j++) {
const polB = wordSentimentPolarity(words, j);
if ((polA === 'pos' && polB === 'neg') || (polA === 'neg' && polB === 'pos')) {
const w = words[i];
const w2 = words[j];
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
const words = tokenize(text);
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
  const words = tokenize(text);
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

  const firstThird = lines.slice(0, Math.ceil(lines.length / 3)).join(' ');
  const lastThird = lines.slice(-Math.ceil(lines.length / 3)).join(' ');

  function score(t, lexicon) {
    return lexiconHitRate(t, lexicon);
  }

  const openingTones = [
    { name: 'tentative', score: score(firstThird, SENTIMENT.tentative) },
    { name: 'confessional', score: score(firstThird, SENTIMENT.confessional) },
    { name: 'negative', score: score(firstThird, SENTIMENT.negative) },
    { name: 'positive', score: score(firstThird, SENTIMENT.positive) }
  ].sort((a, b) => b.score - a.score);

  const closingTones = [
    { name: 'resolved', score: score(lastThird, SENTIMENT.resolved) + score(lastThird, SENTIMENT.positive) },
    { name: 'confessional', score: score(lastThird, SENTIMENT.confessional) },
    { name: 'negative', score: score(lastThird, SENTIMENT.negative) },
    { name: 'tentative', score: score(lastThird, SENTIMENT.tentative) }
  ].sort((a, b) => b.score - a.score);

  const openingTone = openingTones[0].name;
  const closingTone = closingTones[0].name;
  const openNeg = score(firstThird, SENTIMENT.negative);
  const closeNeg = score(lastThird, SENTIMENT.negative);
  const tensionShift = openNeg - closeNeg;

  let direction;
  if (tensionShift > 0.02) direction = `${openingTone} → resolving`;
  else if (tensionShift < -0.02) direction = `${openingTone} → escalating`;
  else direction = `${openingTone} → ${closingTone}`;

  return {
    direction,
    opening_tone: openingTone,
    closing_tone: closingTone,
    tension_shift: parseFloat(tensionShift.toFixed(3))
  };
}

function detectDepersonalization(text) {
  const words = tokenize(text);
  if (words.length < 20) return { label: 'Too short', ratio: 0 };
  const personal = new Set(['i', 'me', 'my', 'mine']);
  const abstract = new Set(['one', 'it', 'they', 'people', 'society', 'nature', 'mind']);
  let personalCount = 0;
  let abstractCount = 0;
  for (const w of words) {
    if (personal.has(w)) personalCount++;
    if (abstract.has(w)) abstractCount++;
  }
  const ratio = abstractCount / Math.max(personalCount, 1);
  let label;
  if (personalCount === 0 && abstractCount > 0) label = 'Completely detached (Observer state)';
  else if (ratio > 3) label = 'Highly depersonalized (Hiding in the abstract)';
  else if (ratio < 0.5) label = 'Deeply subjective (Anchored in the I)';
  else label = 'Balanced perspective';
  return { label, abstract_to_personal_ratio: parseFloat(ratio.toFixed(2)) };
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
const words = tokenize(s);
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
  const words = tokenize(chunk.join(' '));
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
const full = tokenize(text);
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
  const counted = new Set();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 3) return { label: 'Too short', count: 0, ratio: 0, examples: [] };

const lineLengths = lines.map(l => tokenize(l).length);
let silenceCount  = 0;
const examples    = [];

for (let i = 1; i < lines.length; i++) {
const prevLen = lineLengths[i - 1];
const currLen = lineLengths[i];
// A silence: short line (≤6 words) after a dense line (>20 words)
if (prevLen > 20 && currLen <= 6) {
  const key = lines[i];
  if (!counted.has(key)) {
    counted.add(key);
    silenceCount++;
    if (examples.length < 3) examples.push(lines[i]);
  }
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
const words = tokenize(curr).length;
if (prev === '' && next === '' && words > 0 && words <= 4) {
  if (!counted.has(curr)) {
    counted.add(curr);
    silenceCount++;
    if (examples.length < 3) examples.push(curr);
  }
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

const opening = lines.slice(0, Math.ceil(lines.length / 3)).join(' ');
const closing = lines.slice(-Math.ceil(lines.length / 3)).join(' ');

function densityScore(chunk, lexicon) {
return lexiconHitRate(chunk, lexicon);
}

const openSensory  = densityScore(opening, SENTIMENT.sensory);
const openAbstract = densityScore(opening, SENTIMENT.abstract);
const closeSensory = densityScore(closing, SENTIMENT.sensory);
const closeAbstract= densityScore(closing, SENTIMENT.abstract);

const entry = openSensory > openAbstract ? 'sensory' : openSensory === openAbstract ? 'balanced' : 'abstract';
const exit  = closeSensory > closeAbstract ? 'sensory' : closeSensory === closeAbstract ? 'balanced' : 'abstract';

  let delta;
if (entry === 'abstract' && exit === 'sensory') delta = 'abstract → sensory (grounding)';
else if (entry === 'sensory' && exit === 'abstract') delta = 'sensory → abstract (transcending)';
else if (entry === 'abstract' && exit === 'abstract') delta = 'abstract throughout (intellectual)';
else if (entry === 'balanced' || exit === 'balanced') delta = 'balanced -- no clear pull';
else delta = 'sensory throughout (embodied)';

let label;
if (entry === 'balanced' || exit === 'balanced') label = 'Balanced';
else if (entry === exit) label = entry === 'abstract' ? 'Intellectual' : 'Embodied';
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
const finalWords = tokenize(finalLine);
const finalLen   = finalWords.length;
const lastWord   = finalWords[finalWords.length - 1] || '';

// Signals
const endsOnQuestion    = finalLine.endsWith('?');
const endsOnFragment    = finalLen <= 5;
const endsOnEllipsis    = finalLine.endsWith('...') || finalLine.endsWith('\u2026');
const endsOnDash        = /[—–-]$/.test(finalLine);
const lastIdx = finalLen - 1;
const endsOnDissolution = lastIdx >= 0 && (
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.dissolution) ||
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.existence));
const endsOnResolved = lastIdx >= 0 && (
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.resolved) ||
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.positive));
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

/** Bump when stemmer, lexicon, or fast-map schema changes (triggers re-map in app.js). */
export const CARTO_VERSION = 4;

/**

- generateFastMapData(text)
- 
- Primary cartography export. Takes raw text, returns the full shape map.
- No async. No DB. No side effects.
- Call this from generateFastMap() in app.js.
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
const depersonalisation  = detectDepersonalization(text);

return {
// Core
carto_version: CARTO_VERSION,
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
incompleteness,
depersonalisation
};
}

// ── GUARDIAN AUTO-TRIGGER (Batch 1) ───────────────────────────────────────────
// Read-only: inspects localStorage clocks (when present) and Fast Map geometry.
// Later batches own writes to these keys; this function never mutates storage.

const GUARDIAN_TRIGGER_LS = {
last_entry: 'nq_last_entry_timestamp',
last_interaction: 'nq_guardian_last_interaction',
last_invoke: 'nq_guardian_last_invoke',
last_attempt: 'nq_guardian_last_attempt',
dismissed_count: 'nq_guardian_dismissed_count',
last_trigger_type: 'nq_guardian_last_trigger_type'
};

const GUARDIAN_DEFAULT_COOLDOWN_MS = 6 * 60 * 1000;
const GUARDIAN_POST_ATTEMPT_MS = 2 * 60 * 1000;
const GUARDIAN_POST_USER_SESSION_MS = 90 * 1000;
const GUARDIAN_MIN_WORDS = 35;

function parseGuardianStoredMs(raw) {
if (raw == null) return null;
if (typeof raw === 'number' && Number.isFinite(raw)) {
return raw > 0 && raw < 1e11 ? raw * 1000 : raw;
}
const s = String(raw).trim();
if (!s) return null;
const n = Number(s);
if (Number.isFinite(n) && n > 0) return n < 1e11 ? n * 1000 : n;
const d = Date.parse(s);
return Number.isFinite(d) ? d : null;
}

function readGuardianTriggerLocalStorage() {
const out = {
last_entry_ms: null,
last_interaction_ms: null,
last_invoke_ms: null,
last_attempt_ms: null,
dismissed_count: 0,
last_trigger_type: ''
};
if (typeof localStorage === 'undefined' || !localStorage) return out;
try {
out.last_entry_ms = parseGuardianStoredMs(localStorage.getItem(GUARDIAN_TRIGGER_LS.last_entry));
out.last_interaction_ms = parseGuardianStoredMs(localStorage.getItem(GUARDIAN_TRIGGER_LS.last_interaction));
out.last_invoke_ms = parseGuardianStoredMs(localStorage.getItem(GUARDIAN_TRIGGER_LS.last_invoke));
out.last_attempt_ms = parseGuardianStoredMs(localStorage.getItem(GUARDIAN_TRIGGER_LS.last_attempt));
const dc = localStorage.getItem(GUARDIAN_TRIGGER_LS.dismissed_count);
out.dismissed_count = dc == null || dc === '' ? 0 : Math.max(0, parseInt(dc, 10) || 0);
out.last_trigger_type = String(localStorage.getItem(GUARDIAN_TRIGGER_LS.last_trigger_type) || '').trim();
} catch (e) {
/* private mode / blocked storage */
}
return out;
}

function collectFastMapQualifiers(map) {
const q = [];
const sig = map.signature;
if (sig && sig.orbits) {
const orb = sig.orbits;
const heavy = orb.orbiting && orb.orbiting.some(function (o) { return o.count >= 5; });
if (orb.label === 'Multi-orbit' || heavy) {
q.push({ type: 'orbit', label: orb.label, orbiting: orb.orbiting });
}
}
if (sig && sig.paradox) {
const px = sig.paradox;
if (px.label === 'Paradox-dominant' || px.label === 'Charged') {
q.push({ type: 'paradox', label: px.label, count: px.count });
}
}
if (sig && sig.inversion && sig.inversion.label === 'Perpetual self-argument') {
q.push({ type: 'inversion_loop', label: sig.inversion.label });
}
const sw = map.silence_weight;
if (sw && (sw.label === 'Silence as structure' || (typeof sw.ratio === 'number' && sw.ratio >= 0.12))) {
q.push({ type: 'silence', label: sw.label, ratio: sw.ratio, count: sw.count });
}
const arc = map.emotional_arc;
if (arc && typeof arc.direction === 'string' && arc.direction.indexOf('escalating') !== -1) {
q.push({ type: 'escalating_arc', direction: arc.direction });
}
return q;
}

/**

- checkGuardianTrigger(fastMapOrText, options?)
- 
- Decides whether an automatic Guardian pass is warranted from **geometry alone**
- plus optional **read-only** clock keys (localStorage) when available in the host.
- 
- `fastMapOrText`: raw entry string **or** an object already shaped like
- `generateFastMapData` output (must include `word_count`).
- `options`: `{ cooldownMs, minWords, requireFreshEntryMs }` — all optional.
- 
- Returns `{ shouldInvoke, reason, qualifiers, primaryQualifier, fastMap, clocks }`.
- Never writes to storage. Does not call network.
  */
export function checkGuardianTrigger(fastMapOrText, options) {
const opts = options || {};
var cooldownMs = GUARDIAN_DEFAULT_COOLDOWN_MS;
if (typeof opts.cooldownMs === 'number' && opts.cooldownMs >= 0) cooldownMs = opts.cooldownMs;
var minWords = GUARDIAN_MIN_WORDS;
if (typeof opts.minWords === 'number' && opts.minWords >= 0) minWords = opts.minWords;
var requireFreshEntryMs = null;
if (typeof opts.requireFreshEntryMs === 'number' && opts.requireFreshEntryMs > 0) {
requireFreshEntryMs = opts.requireFreshEntryMs;
}

const now = Date.now();
const clocks = readGuardianTriggerLocalStorage();

if (clocks.last_invoke_ms != null && now - clocks.last_invoke_ms < cooldownMs) {
return {
shouldInvoke: false,
reason: 'cooldown',
qualifiers: [],
primaryQualifier: null,
fastMap: null,
clocks,
meta: { ms_until_cooldown: cooldownMs - (now - clocks.last_invoke_ms) }
};
}

if (clocks.last_interaction_ms != null && now - clocks.last_interaction_ms < GUARDIAN_POST_USER_SESSION_MS) {
return {
shouldInvoke: false,
reason: 'recent_user_guardian_session',
qualifiers: [],
primaryQualifier: null,
fastMap: null,
clocks,
meta: {}
};
}

if (clocks.last_attempt_ms != null && now - clocks.last_attempt_ms < GUARDIAN_POST_ATTEMPT_MS) {
return {
shouldInvoke: false,
reason: 'recent_attempt_backoff',
qualifiers: [],
primaryQualifier: null,
fastMap: null,
clocks,
meta: { ms_until_backoff: GUARDIAN_POST_ATTEMPT_MS - (now - clocks.last_attempt_ms) }
};
}

if (requireFreshEntryMs != null && clocks.last_entry_ms != null) {
if (now - clocks.last_entry_ms > requireFreshEntryMs) {
return {
shouldInvoke: false,
reason: 'stale_entry_timestamp',
qualifiers: [],
primaryQualifier: null,
fastMap: null,
clocks,
meta: {}
};
}
}

var fastMap = null;
if (typeof fastMapOrText === 'string') {
var trimmed = fastMapOrText.trim();
if (!trimmed.length) {
return {
shouldInvoke: false,
reason: 'empty_text',
qualifiers: [],
primaryQualifier: null,
fastMap: null,
clocks,
meta: {}
};
}
fastMap = generateFastMapData(trimmed);
} else if (fastMapOrText && typeof fastMapOrText === 'object' && typeof fastMapOrText.word_count === 'number') {
fastMap = fastMapOrText;
} else {
return {
shouldInvoke: false,
reason: 'invalid_input',
qualifiers: [],
primaryQualifier: null,
fastMap: null,
clocks,
meta: {}
};
}

if (fastMap.word_count < minWords) {
return {
shouldInvoke: false,
reason: 'too_short',
qualifiers: [],
primaryQualifier: null,
fastMap,
clocks,
meta: { word_count: fastMap.word_count, minWords }
};
}

var qualifiers = collectFastMapQualifiers(fastMap);
var dismissed = clocks.dismissed_count;

if (dismissed >= 10) {
return {
shouldInvoke: false,
reason: 'dismissed_cap',
qualifiers,
primaryQualifier: null,
fastMap,
clocks,
meta: { dismissed_count: dismissed }
};
}
if (dismissed >= 5 && qualifiers.length < 2) {
return {
shouldInvoke: false,
reason: 'dismissed_backoff',
qualifiers,
primaryQualifier: null,
fastMap,
clocks,
meta: { dismissed_count: dismissed }
};
}

var shouldInvoke = qualifiers.length > 0;
var primaryQualifier = shouldInvoke && qualifiers[0] ? qualifiers[0].type : null;

if (shouldInvoke && clocks.last_trigger_type) {
if (qualifiers.length === 1 && primaryQualifier === clocks.last_trigger_type) {
return {
shouldInvoke: false,
reason: 'repeat_trigger_type',
qualifiers: qualifiers,
primaryQualifier: null,
fastMap: fastMap,
clocks: clocks,
meta: {
word_count: fastMap.word_count,
cooldownMs: cooldownMs,
last_trigger_type: clocks.last_trigger_type
}
};
}
if (primaryQualifier === clocks.last_trigger_type) {
var qi = 1;
while (qi < qualifiers.length && qualifiers[qi].type === clocks.last_trigger_type) qi++;
if (qi < qualifiers.length) primaryQualifier = qualifiers[qi].type;
}
}

return {
shouldInvoke: shouldInvoke,
reason: shouldInvoke ? 'qualified' : 'no_signal',
qualifiers: qualifiers,
primaryQualifier: primaryQualifier,
fastMap: fastMap,
clocks: clocks,
meta: {
word_count: fastMap.word_count,
cooldownMs: cooldownMs,
last_trigger_type: clocks.last_trigger_type
}
};
}
