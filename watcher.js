/* jshint esversion: 11 */
/* global window, localStorage, document, crypto, IDBKeyRange, requestIdleCallback, setTimeout, NQ_DEV_MODE, WATCHER_FOCUS_DEFAULT_THRESHOLD, currentMode, currentView, getDiscourses, getDiscourse, dbGet, showToast, openDiscourse, getEpistemicMoodCached */
/**
 * Watcher embeddings shadow queue, similarity pass, LED strip (#watcher-led-strip).
 * See app-architecture-split-blueprint.md (S4).
 * Loads after app.js — uses shell globals; guardian/abyss/cartographer call at runtime.
 */

/* ── WATCHER ENGINE (MAIN THREAD SHADOW QUEUE) ──────────────── */

const W_MODEL_ID = 'Xenova/bge-base-en-v1.5';
const W_SIMILARITY_THRESHOLD = NQ_DEV_MODE ? 0.50 : 0.73;
const W_DECAY_ACTIVE_DAYS = 25;
const W_LINK_EXPIRY_DAYS = 60;
const W_SILENT_PERIOD_HOURS = NQ_DEV_MODE ? 0 : 48;
const W_MIN_RICH_DISCOURSES = NQ_DEV_MODE ? 1 : 5;
const W_TITLE_WEIGHT = 0.3;
const W_BODY_WEIGHT = 0.7;
const W_SPARK_BOOST = 1.1;
const W_DAY_MS = 86400000;
const W_PASS_COOLDOWN_HOURS = NQ_DEV_MODE ? 0 : 20;

let watcherEmbedder = null;
let watcherDB = null;
let isWatcherReady = false;
let watcherQueue = [];
let isWatcherProcessing = false;
let isRunningPass = false;
let watcherModelLoading = false;
let watcherInitFailed = false;
let _watcherDotAnchor = -1;
let _watcherHasLinks = false;
let _watcherCurrentLinks = [];


/** Lowered Watcher similarity threshold from watcher_focus directive. */
var watcherFocusActive = null;

function getWatcherSimilarityThreshold() {
  var base = NQ_DEV_MODE ? W_SIMILARITY_THRESHOLD : 0.73;
  if (watcherFocusActive && Date.now() < watcherFocusActive.expires_at) {
    return Math.min(base, watcherFocusActive.threshold || WATCHER_FOCUS_DEFAULT_THRESHOLD);
  }
  return base;
}


function isWatcherSoupContext() {
  return currentMode === 'soup' && currentView === 'soup';
}

/** Watcher user toasts only on the main Soup grid (not Sanctuary, sub-views, or forge). */
function showWatcherSoupToast(msg) {
  if (!isWatcherSoupContext()) return;
  showToast(msg);
}

/** Soup-only LED strip + cluster button (resonance when links exist). */
function syncWatcherLedStrip() {
  const strip = document.getElementById('watcher-led-strip');
  const cluster = document.getElementById('watcher-led-cluster');
  const ledA = document.getElementById('watcher-led-active');
  const ledI = document.getElementById('watcher-led-idle');
  const ledO = document.getElementById('watcher-led-offline');
  if (!strip || !ledA || !ledI || !ledO) return;
  ledA.classList.remove('is-lit', 'is-pulse');
  ledI.classList.remove('is-lit', 'is-pulse');
  ledO.classList.remove('is-lit', 'is-pulse');
  if (!isWatcherSoupContext()) {
    strip.classList.add('hidden');
    if (cluster) cluster.disabled = true;
    return;
  }
  strip.classList.remove('hidden');
  const indexing = !!(watcherModelLoading || isWatcherProcessing || isRunningPass);
  const onlineReady = !!(isWatcherReady && watcherEmbedder);
  if (!watcherDB) {
    ledO.classList.add('is-lit');
  } else if (watcherInitFailed && !watcherModelLoading && !onlineReady) {
    ledO.classList.add('is-lit');
  } else if (indexing) {
    ledA.classList.add('is-lit', 'is-pulse');
  } else if (onlineReady) {
    ledI.classList.add('is-lit');
  } else {
    ledO.classList.add('is-lit');
  }
  if (cluster) {
    const canOpen = !!(_watcherHasLinks && !indexing);
    cluster.disabled = !canOpen;
  }
}

function hideWatcherDot() {
  syncWatcherLedStrip();
}

function openWatcherDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nq_watcher', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('embeddings')) {
        const emb = db.createObjectStore('embeddings', { keyPath: 'id' });
        emb.createIndex('last_seen_active', 'last_seen_active', { unique: false });
      }
      if (!db.objectStoreNames.contains('links')) {
        const lnk = db.createObjectStore('links', { keyPath: 'id' });
        lnk.createIndex('created_at', 'created_at', { unique: false });
        lnk.createIndex('a', 'a', { unique: false });
        lnk.createIndex('b', 'b', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

const wdb = {
  get: (store, key) => new Promise((res) => { const r = watcherDB.transaction(store, 'readonly').objectStore(store).get(key); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }),
  put: (store, obj) => new Promise((res, rej) => { const r = watcherDB.transaction(store, 'readwrite').objectStore(store).put(obj); r.onsuccess = () => res(); r.onerror = (e) => rej(e.target.error); }),
  delete: (store, key) => new Promise((res) => { const r = watcherDB.transaction(store, 'readwrite').objectStore(store).delete(key); r.onsuccess = () => res(); r.onerror = () => res(); }),
  getAll: (store) => new Promise((res) => { const r = watcherDB.transaction(store, 'readonly').objectStore(store).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }),
  deleteOlderThan: (store, indexName, cutoff) => new Promise((res) => {
    const range = IDBKeyRange.upperBound(cutoff);
    const req = watcherDB.transaction(store, 'readwrite').objectStore(store).index(indexName).openCursor(range);
    req.onsuccess = (e) => { const cursor = e.target.result; if (cursor) { cursor.delete(); cursor.continue(); } else res(); };
    req.onerror = () => res();
  })
};

async function watcherSha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function watcherCosine(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function showWatcherLoading() {
  watcherModelLoading = true;
  watcherInitFailed = false;
  syncWatcherLedStrip();
}

function hideWatcherLoading() {
  watcherModelLoading = false;
  syncWatcherLedStrip();
}

function updateWatcherLoading(loaded, total) {
  syncWatcherLedStrip();
}

async function updateWatcherStatusUI() {
  if (!watcherDB) return;
  const embs = await wdb.getAll('embeddings');
  const links = await wdb.getAll('links');
  const rich = embs.filter(e => (e.word_count || 0) >= 80);
  const dot = document.getElementById('watcher-dot-indicator');
  const text = document.getElementById('watcher-status-text');
  const detail = document.getElementById('watcher-detail');
  
  if (!text) return;
  if (embs.length === 0) {
    if (dot) dot.style.opacity = '0.3';
    text.textContent = 'Slumbering';
    if (detail) detail.textContent = 'Waiting for enough material to observe';
  } else if (rich.length < 5) {
    if (dot) dot.style.opacity = '0.3';
    text.textContent = 'Slumbering';
    if (detail) detail.textContent = 'Waiting for enough material to observe';
  } else if (rich.length < 5) {
    if (dot) dot.style.opacity = '0.6';
    text.textContent = 'Accumulating';
    if (detail) detail.textContent = rich.length + ' Deep · ' + embs.length + ' Total · threshold not met';
  } else {
    if (dot) dot.style.opacity = '1';
    text.textContent = 'Watching';
    if (detail) detail.textContent = embs.length + ' Engrams · ' + links.length + ' Connections · threshold met';
  }
  syncWatcherLedStrip();
}

async function shouldWatcherShow() {
  if (!watcherDB) return false;
  const embs = await wdb.getAll('embeddings');
  const rich = embs.filter(e => (e.word_count || 0) >= 80);
  return rich.length >= W_MIN_RICH_DISCOURSES;

}

async function initWatcher() {
  try {
    watcherInitFailed = false;
    watcherDB = await openWatcherDB();
    // Fast path -- model already loaded, just reconnect
    if (watcherEmbedder) {
      isWatcherReady = true;
      updateWatcherStatusUI();
      await refreshWatcherDot();
      if (isWatcherSoupContext()) scheduleWatcherPass();
      syncWatcherLedStrip();
      return;
    }
    showWatcherLoading();
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0/dist/transformers.min.js');
    env.useBrowserCache = true;
    env.allowLocalModels = false;
    env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0/dist/';
    env.backends.onnx.wasm.numThreads = 1; // ABYSS FIX: Stop iOS Safari from RAM-crashing
    watcherEmbedder = await pipeline('feature-extraction', W_MODEL_ID, {
      quantized: true,
      progress_callback: (progress) => {
        if (progress.status === 'downloading') {
          updateWatcherLoading(Math.round((progress.loaded || 0) / 1024 / 1024), Math.round((progress.total || 136 * 1024 * 1024) / 1024 / 1024));
        }
      }
    });
    isWatcherReady = true;
    localStorage.removeItem('nq_watcher_offline_since');
    const firstAwakening = !localStorage.getItem('nq_watcher_awakened');
    if (firstAwakening) {
      showWatcherSoupToast('◈ The Watcher has awakened');
      // One-time reindex of all existing content
      setTimeout(async () => {
        if (!isWatcherSoupContext()) return;
        const discs = await getDiscourses();
        if (!isWatcherSoupContext()) return;
        let count = 0;
        for (const d of discs) {
          if (d.raw_text && d.raw_text.trim().length > 0) {
            queueWatcherEmbed(d.id, d.title || 'Untitled', d.raw_text, d.item_type || 'discourse');
            count++;
          }
        }
        if (count > 0) showWatcherSoupToast('◈ Indexing ' + count + ' engrams...');
      }, 5000);
    }
    if (firstAwakening) localStorage.setItem('nq_watcher_awakened', '1');
    hideWatcherLoading();
    updateWatcherStatusUI();
    await refreshWatcherDot();
    if (isWatcherSoupContext()) scheduleWatcherPass();
    syncWatcherLedStrip();
  } catch (err) {
    watcherInitFailed = true;
    console.warn('[Watcher] Init Failed:', err);
    hideWatcherLoading();
    syncWatcherLedStrip();
  }
}

function queueWatcherEmbed(id, title, body, itemType) {
  if (!isWatcherReady) return;
  watcherQueue.push({ id, title, body, itemType, lastSeenActive: Date.now() });
  if (!isWatcherProcessing && isWatcherSoupContext()) processWatcherQueue();
}

async function processWatcherQueue() {
  if (isWatcherProcessing || watcherQueue.length === 0) return;
  if (!isWatcherSoupContext()) return;
  isWatcherProcessing = true;
  while (watcherQueue.length > 0) {
        // If Watcher was torn down mid-yield (e.g. Guardian view entry),
    // leave remaining items in queue so they are processed after reinit.
    if (!isWatcherSoupContext()) break;
    if (!isWatcherReady || !watcherEmbedder) break;
    const item = watcherQueue.shift();
    try { await embedDiscourseMain(item.id, item.title, item.body, item.itemType, item.lastSeenActive); }
    catch (e) { console.warn('Watcher Embed Error', e); }
    
    // Yield entirely to the UI so typing never stutters.
    await new Promise(r => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setTimeout(r, 100), { timeout: 2000 });
      } else {
        setTimeout(r, 400);
      }
    });
  }
  updateWatcherStatusUI();
  refreshWatcherDot(); // NEW
  isWatcherProcessing = false;
  syncWatcherLedStrip();
}

async function embedDiscourseMain(id, title, body, itemType, lastSeenActive) {
  if (!watcherEmbedder) return;
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const titleText = 'Represent this sentence: ' + title.trim().toLowerCase();
  const bodyText = 'Represent this sentence: ' + body.trim().toLowerCase().slice(0, 2000);
  const hash = await watcherSha256(titleText + '|||' + bodyText);
  const existing = await wdb.get('embeddings', id);
  if (existing && existing.hash === hash) {
    await wdb.put('embeddings', { ...existing, last_seen_active: lastSeenActive, word_count: wordCount });
    return;
  }
  const titleEmb = await watcherEmbedder(titleText, { pooling: 'mean', normalize: true });
  await new Promise(r => setTimeout(r, 10));
  const bodyEmb = await watcherEmbedder(bodyText, { pooling: 'mean', normalize: true });
  const tv = titleEmb.data, bv = bodyEmb.data;
  const combined = new Float32Array(tv.length);
  for (let i = 0; i < tv.length; i++) combined[i] = W_TITLE_WEIGHT * tv[i] + W_BODY_WEIGHT * bv[i];
  let norm = 0;
  for (let i = 0; i < combined.length; i++) norm += combined[i] * combined[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < combined.length; i++) combined[i] /= norm;
  await wdb.put('embeddings', { id, vector: Array.from(combined), hash, created_at: existing ? existing.created_at : Date.now(), last_seen_active: lastSeenActive, item_type: itemType, word_count: wordCount });
}

async function runSimilarityPassMain() {
  if (!isWatcherSoupContext()) return;
  if (isRunningPass) return;
  isRunningPass = true;
  try {
  const now = Date.now();
  const activeCutoff = now - (W_DECAY_ACTIVE_DAYS * W_DAY_MS);
  const linkExpiryCutoff = now - (W_LINK_EXPIRY_DAYS * W_DAY_MS);
  const silentCutoff = now - (W_SILENT_PERIOD_HOURS * 3600000);
  const allEmbeddings = await wdb.getAll('embeddings');
  
  // Constraint 1 -- only rich content (80+ words)
  const active = allEmbeddings.filter(e => 
    e.last_seen_active > activeCutoff && 
    (e.word_count || 0) >= 80
  );
  if (active.length < 2) return;

  // Constraint 2 -- setA max 20 recent items
  const setA = active
    .filter(e => e.last_seen_active > (now - (7 * W_DAY_MS)) && e.created_at < silentCutoff)
    .slice(0, 20);

  // Constraint 3 -- setB max 200 items, prioritise richest content
  const setB = active
    .sort((a, b) => (b.word_count || 0) - (a.word_count || 0))
    .slice(0, 200);

  for (let i = 0; i < setA.length; i++) {
    const a = setA[i];
    const vecA = new Float32Array(a.vector);
    for (let j = 0; j < setB.length; j++) {
      const b = setB[j];
      if (a.id === b.id) continue;
      const score = watcherCosine(vecA, new Float32Array(b.vector));
      const finalScore = score * (a.item_type === 'note' || b.item_type === 'note' ? W_SPARK_BOOST : 1.0);
      if (finalScore >= getWatcherSimilarityThreshold()) {
        const linkId = [a.id, b.id].sort().join('_');
        await wdb.put('links', { id: linkId, a: a.id, b: b.id, score: Math.round(finalScore * 1000) / 1000, created_at: now });
      }
    }
    // Breathe every 5 items
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 20));
  }

  await wdb.deleteOlderThan('links', 'created_at', linkExpiryCutoff);
  for (const e of active) { await wdb.put('embeddings', { ...e, last_seen_active: now }); }
  localStorage.setItem('nq_watcher_last_pass', now.toString());
  updateWatcherStatusUI();
  refreshWatcherDot();
    } finally {
    isRunningPass = false;
    syncWatcherLedStrip();
  }
}

function scheduleWatcherPass() {
  if (!isWatcherReady) return;
  if (!isWatcherSoupContext()) return;
  const lastRun = parseInt(localStorage.getItem('nq_watcher_last_pass') || '0');
  const hoursSince = (Date.now() - lastRun) / 3600000;
  const mood = getEpistemicMoodCached();
  const passHours = mood && typeof mood.watcherPassHours === 'number' ? mood.watcherPassHours : W_PASS_COOLDOWN_HOURS;
  if (hoursSince > passHours) {
    setTimeout(() => runSimilarityPassMain(), 10000);
  }
}

/* ── WATCHER LED strip (Soup only) ─────────────────────────── */

async function refreshWatcherDot() {
  if (!watcherDB) {
    _watcherCurrentLinks = [];
    _watcherHasLinks = false;
    syncWatcherLedStrip();
    return;
  }
  const allLinks = await wdb.getAll('links');
  _watcherCurrentLinks = allLinks;
  _watcherHasLinks = allLinks.length > 0;
  syncWatcherLedStrip();
}

async function openWatcherPanel() {
  const panel = document.getElementById('watcher-panel');
  const list = document.getElementById('watcher-links-list');
  if (!panel || !list) return;
  list.innerHTML = '';
  if (!_watcherCurrentLinks.length) { syncWatcherLedStrip(); return; }
  const top5 = [..._watcherCurrentLinks].sort((a,b) => b.score - a.score).slice(0,5);
  for (const link of top5) {
    const discA = await getDiscourse(link.a);
    const discB = await getDiscourse(link.b);
    if (!discA || !discB) continue;
    const item = document.createElement('div');
    item.className = 'watcher-link-item';
    item.innerHTML = `
      <div class="watcher-link-title">${escHtml(discA.title || 'Untitled')}</div>
      <div class="watcher-link-score">↔ ${escHtml(discB.title || 'Untitled')} · ${Math.round(link.score * 100)}%</div>
    `;
    item.addEventListener('click', () => { closeWatcherPanel(); openDiscourse(link.a); });
    list.appendChild(item);
  }
  if (!list.childElementCount) { syncWatcherLedStrip(); return; }
    const anchor = document.getElementById('watcher-led-cluster');
  const dotRect = anchor?.getBoundingClientRect();
  if (dotRect) {
    const panelW = 260;
    const panelH = 200;
    const margin = 8;
    let left = dotRect.left > window.innerWidth / 2
      ? dotRect.left - panelW - 10
      : dotRect.right + 10;
    let top = dotRect.top - panelH / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelW - margin));
    top = Math.max(70, Math.min(top, window.innerHeight - panelH - 100));
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    panel.style.right = 'auto';
  }
  
  panel.classList.add('visible');
}

function closeWatcherPanel() {
  const panel = document.getElementById('watcher-panel');
  if (panel) panel.classList.remove('visible');
}

async function pruneWatcherDiscourse(id) {
  if (!watcherDB) return;
  await wdb.delete('embeddings', id);
  const all = await wdb.getAll('links');
  for (const link of all) { if (link.a === id || link.b === id) await wdb.delete('links', link.id); }
  updateWatcherStatusUI();
}

/* DEV DOOR (Watcher) */
async function devForcePass() {
  if (!isWatcherReady) { showWatcherSoupToast('Watcher not ready yet'); return; }
  localStorage.removeItem('nq_watcher_last_pass');
  showWatcherSoupToast('Running pass...');
  await runSimilarityPassMain();
  await updateWatcherStatusUI();
  await refreshWatcherDot();
  showWatcherSoupToast('Pass complete');
}

async function devClearWatcher() {
  if (!watcherDB) { showWatcherSoupToast('No watcher DB'); return; }
  const embs = await wdb.getAll('embeddings');
  const links = await wdb.getAll('links');
  for (const e of embs) await wdb.delete('embeddings', e.id);
  for (const l of links) await wdb.delete('links', l.id);
  localStorage.removeItem('nq_watcher_last_pass');
  localStorage.removeItem('nq_watcher_awakened');
  _watcherHasLinks = false;
  _watcherCurrentLinks = [];
  hideWatcherDot();
  await updateWatcherStatusUI();
  showWatcherSoupToast('Watcher index cleared');
}

async function injectWatcherFlags(fastMap, discourseId) {
  if (!isWatcherReady || !watcherDB) return fastMap;
  
  const current = await wdb.get('embeddings', discourseId);
  if (!current || !current.vector) return fastMap;
  
  const allEmbeds = await wdb.getAll('embeddings');
  const currentVec = new Float32Array(current.vector);
  
  const similarities = [];
  for (const e of allEmbeds) {
    if (e.id === discourseId) continue;
    const sim = watcherCosine(currentVec, new Float32Array(e.vector));
    similarities.push({ id: e.id, score: sim });
  }
  
  similarities.sort((a, b) => b.score - a.score);
  
  // Top similar (exclude self)
  const topSimilar = similarities.slice(0, 3);
  
  // Potential contradictions: high similarity but need to check emotional arc
  // Simplified: flag any with similarity > 0.7
  const topContradictory = [];
for(const s of similarities.filter(s => s.score > getWatcherSimilarityThreshold() * 0.9)){
  const otherMap = await dbGet('guardian_summaries', s.id);
  if(!otherMap) continue;
  const currentArc = fastMap.emotional_arc?.tension_shift || 0;
  const otherArc = otherMap.emotional_arc?.tension_shift || 0;
  // Opposite directions = one resolving, one escalating
    if((currentArc > 0.02 && otherArc < -0.02) || (currentArc < -0.02 && otherArc > 0.02)){
    topContradictory.push(s);
  }
}

  // Resolve discourse titles
  async function resolveTitle(id) {
    const d = await getDiscourse(id);
    return d ? d.title || 'Untitled' : 'Unknown';
  }
  
  fastMap.watcher = {
    top_similar: await Promise.all(topSimilar.map(async s => ({
      id: s.id,
      score: parseFloat(s.score.toFixed(3)),
      title: await resolveTitle(s.id)
    }))),
    top_contradictory: await Promise.all(topContradictory.map(async s => ({
      id: s.id,
      score: parseFloat(s.score.toFixed(3)),
      title: await resolveTitle(s.id)
    })))
  };
  
  return fastMap;
}

