/**
 * Headless smoke tests for exoskeleton pure logic (Node 18+).
 * Run: node scripts/exoskeleton-smoke-test.mjs
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'vm';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// cartographer is ES module — dynamic import
const carto = await import(join(root, 'cartographer.js'));

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('FAIL:', msg);
  }
}

// CARTO: negation scope (P1-d)
const negText = Array(40).fill('I am not happy but I feel joy enough thought').join(' ');
const negMap = carto.generateFastMapData(negText);
assert(negMap && negMap.word_count >= 35, 'negation sample has enough words');

// Read app.js + witness-synapse.js for function presence (not executing browser app)
const appSrc = readFileSync(join(root, 'app.js'), 'utf8');
const synSrc = readFileSync(join(root, 'witness-synapse.js'), 'utf8');
const abyssSrc = readFileSync(join(root, 'abyss.js'), 'utf8');
const watcherSrc = readFileSync(join(root, 'watcher.js'), 'utf8');
const guardianSrc = readFileSync(join(root, 'guardian.js'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const wiring = [
  ['computeReturnDetections', synSrc],
  ['runDailyRevisitCheck', guardianSrc],
  ['persistWitnessDirectiveLog', guardianSrc],
  ['buildSynapseSnapshot', synSrc],
  ['scoreGuardianPredictionsOnSave', guardianSrc],
  ['refreshWatcherFocus', guardianSrc],
  ['refreshEpistemicMoodCache', appSrc],
  ['formatInterSessionSilenceTier', synSrc],
  ['discourseHasPersistentOrbit', appSrc],
  ['buildGuardianDirectiveRoot', guardianSrc],
  ['GUARDIAN_LEDGER_RECKONING_INSTRUCTION', guardianSrc],
  ['refreshAbyssActiveTint', abyssSrc],
  ['openAbyssView', abyssSrc],
  ['abyssStop', abyssSrc],
  ['summonGuardian', guardianSrc],
  ['openGuardianView', guardianSrc],
  ['buildWitnessLedgerCompactBlock', guardianSrc],
  ['initWatcher', watcherSrc],
  ['injectWatcherFlags', watcherSrc],
  ['queueWatcherEmbed', watcherSrc],
  ['syncWatcherLedStrip', watcherSrc]
];
for (const [name, src] of wiring) {
  var label = 'app.js';
  if (src === synSrc) label = 'witness-synapse.js';
  else if (src === abyssSrc) label = 'abyss.js';
  else if (src === guardianSrc) label = 'guardian.js';
  else if (src === watcherSrc) label = 'watcher.js';
  assert(src.includes(name), label + ' contains ' + name);
}

assert(appSrc.includes('ALTER TABLE guardian_logs ADD COLUMN prediction_tag'), 'prediction_tag migration');
assert(synSrc.includes('mergeCorpusBaseline'), 'corpus_baseline merge helper');
assert(synSrc.includes('corpus_baseline'), 'corpus_baseline on synapse');
assert(synSrc.includes('showWitnessSummonBridgePrompt'), 'inline bridge prompt after summon');
assert(synSrc.includes('witness_ledger_chain'), 'witness ledger chain table');
assert(synSrc.includes('appendWitnessLedgerLink'), 'ledger chain append helper');
assert(synSrc.includes('verifyWitnessLedgerChain'), 'ledger chain verify helper');
assert(synSrc.includes('ensureWitnessLedgerVerified'), 'ledger verify awaited before SUBSTRATE');
assert(appSrc.includes("store === 'witness_ledger_chain'"), 'ledger chain stays plaintext when vault encrypted');
assert(synSrc.includes('detectResurgentTerms'), 'resurgent term detection');
assert(synSrc.includes('isWitnessCorpusNoiseTerm'), 'half-life stopword filter');
assert(synSrc.includes('formatSubstrateSaccadeLine'), 'SUBSTRATE saccade line');
assert(synSrc.includes('runWitnessThresholdEngine'), 'WP1 threshold engine');
assert(synSrc.includes('dogfoodWitnessThresholds'), 'WP1 console dogfood hook');
assert(indexHtml.includes('witness-synapse.js'), 'index.html loads witness-synapse.js');
assert(indexHtml.includes('abyss.js'), 'index.html loads abyss.js');
assert(indexHtml.includes('guardian.js'), 'index.html loads guardian.js');
assert(indexHtml.includes('watcher.js'), 'index.html loads watcher.js');
assert(indexHtml.indexOf('watcher.js') < indexHtml.indexOf('guardian.js'), 'watcher.js before guardian.js');
assert(!appSrc.includes('function openAbyssView'), 'openAbyssView extracted from app.js');
assert(!appSrc.includes('async function summonGuardian'), 'summonGuardian extracted from app.js');
assert(!appSrc.includes('async function initWatcher'), 'initWatcher extracted from app.js');

const wwSrc = readFileSync(join(root, 'witness-weather.js'), 'utf8');
const wwSandbox = { WitnessWeather: null };
vm.runInNewContext(wwSrc, wwSandbox);
const WW = wwSandbox.WitnessWeather;
assert(WW && typeof WW.computeWeatherState === 'function', 'WitnessWeather loads');
var mockSnap = {
  posture_vector: { coherence: 0.5, resistance: 0.7 },
  open_bridges_count: 2,
  perpetual_orbit_terms: ['void'],
  half_life: { resurgent: [] },
  anomalies: ['denial_sediment:mother'],
  denial_sediment_terms: ['mother'],
  corpus_baseline: { last_write_at: Date.now() - 86400000 }
};
var w = WW.computeWeatherState(mockSnap, { resistance_delta: 0.35 });
assert(w.state === 'pressure' || w.state === 'front', 'weather detects turbulence');
var cues = WW.generateWitnessCues(mockSnap, { context: { resistance_delta: 0.35 }, retiredKeys: {} });
assert(Array.isArray(cues) && cues.length > 0, 'cues generated from mock synapse');
assert(!cues[0].philosopher && cues[0].question_text, 'cue has question only');
assert(WW.CUES_MATRIX.absence && WW.CUES_MATRIX.absence.rilke, 'absence matrix present unwired');
assert(WW.ENABLE_ABSENCE_CUES === false, 'absence cues disabled on PWA');

console.log('\nSmoke: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
