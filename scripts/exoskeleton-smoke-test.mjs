/**
 * Headless smoke tests for exoskeleton pure logic (Node 18+).
 * Run: node scripts/exoskeleton-smoke-test.mjs
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

console.log('\nSmoke: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
