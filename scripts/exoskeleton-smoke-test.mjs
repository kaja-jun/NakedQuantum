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

// Read app.js snippets via regex for function presence (not executing browser app)
const appSrc = readFileSync(join(root, 'app.js'), 'utf8');
const wiring = [
  'computeReturnDetections',
  'runDailyRevisitCheck',
  'persistWitnessDirectiveLog',
  'buildSynapseSnapshot',
  'scoreGuardianPredictionsOnSave',
  'refreshWatcherFocus',
  'refreshEpistemicMoodCache',
  'formatInterSessionSilenceTier',
  'discourseHasPersistentOrbit',
  'buildGuardianDirectiveRoot',
  'GUARDIAN_LEDGER_RECKONING_INSTRUCTION',
  'refreshAbyssActiveTint',
  'buildWitnessLedgerCompactBlock'
];
for (const name of wiring) {
  assert(appSrc.includes(name), 'app.js contains ' + name);
}

assert(appSrc.includes('ALTER TABLE guardian_logs ADD COLUMN prediction_tag'), 'prediction_tag migration');
assert(appSrc.includes('mergeCorpusBaseline'), 'corpus_baseline merge helper');
assert(appSrc.includes('corpus_baseline'), 'corpus_baseline on synapse');
assert(appSrc.includes('showWitnessSummonBridgePrompt'), 'inline bridge prompt after summon');
assert(appSrc.includes('witness_ledger_chain'), 'witness ledger chain table');
assert(appSrc.includes('appendWitnessLedgerLink'), 'ledger chain append helper');
assert(appSrc.includes('verifyWitnessLedgerChain'), 'ledger chain verify helper');
assert(appSrc.includes('dogfoodWitnessWeather'), 'witness weather dogfood hook');
assert(appSrc.includes('detectResurgentTerms'), 'resurgent term detection');

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
