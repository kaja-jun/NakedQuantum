let generateFastMapData = null;
let checkGuardianTrigger = null;
(async () => {
  const btn = document.getElementById('btn-run-cartographer');
  if (btn) btn.disabled = true;
  const mod = await import('./cartographer.js');
  generateFastMapData = mod.generateFastMapData;
  checkGuardianTrigger = mod.checkGuardianTrigger;
  if (btn) btn.disabled = false;
})();

/* STATE */

let db=null,currentMode='soup',currentDiscourseId=null,currentFolderId=null,
breadcrumbPath=[{id:null,name:'◈  The soup'}],editorMode='write',currentView='table',mosaicCache={},searchQuery='',activeCharId=null,sanctuarySearchQuery='';
const AKASHIC_URL='https://wandering-violet-964a.gazajar.workers.dev';
/** Guardian auto-invoke micro-observation (server key). Must match deployed Worker + CORS allowlist. */
const GUARDIAN_INVOKE_WORKER_URL = 'https://naked-guardian.gazajar.workers.dev';
let cosmUserId=localStorage.getItem('cosm_user_id')||crypto.randomUUID();
localStorage.setItem('cosm_user_id',cosmUserId);

/** BYOK OpenRouter API base from Settings. Guardian micro-invoke uses `workers/guardian-invoke` (server key), not this URL. */
function openRouterChatBaseUrl() {
  try {
    return (localStorage.getItem('nq_base_url') || 'https://openrouter.ai/api/v1').trim().replace(/\/+$/, '');
  } catch (e) {
    return 'https://openrouter.ai/api/v1';
  }
}
let activeIE = null;
let longPressTimer=null,isLongPress=false,longPressConsumed=false,touchStartPos={x:0,y:0};
const LONG_PRESS_DURATION=1000,MOVE_THRESHOLD=10;
const SPARK_MAX_CHARS=300;
let selectMode=false, selectedItems=new Set();
let deepSoupFolderId = null;
let deepSoupPath = [{id: null, name: 'Deep Soup'}];
let soupLocalSearchOpen = false;
var guardianSoupInvokeScheduleTimer = null;
let sanctuaryLocalSearchOpen = false;
let chatReturnPanel = 'view-soup';
/** Clears THE SOUP / HOME pill when leaving the Soup grid or cancelling a pending hide. */
let modeToastTimer = null;
let deepMapperLoadSuppressed = false;
let deepMapperSuppressTimer = null;

/* SANCTUARY REALM — mycelium, organic branches, drawer */
let sanctuaryAmbienceActive = false;
let sanctuaryMyceliumRaf = null;
let sanctuaryMyceliumResizeObs = null;
const SANCTUARY_MYCEL_MAX = 80;
let sanctuaryMyceliumParticles = [];
let mycelWarm = '78, 180, 120';
let mycelCool = '78, 203, 138';

function closeSanctuaryDrawer(){
  const d = document.getElementById('sanctuary-drawer');
  const btn = document.getElementById('hdr-sanctuary-menu') || document.getElementById('sanctuary-panel-menu');
  if (d) {
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
  }
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function openSanctuaryDrawer(){
  const d = document.getElementById('sanctuary-drawer');
  const btn = document.getElementById('hdr-sanctuary-menu') || document.getElementById('sanctuary-panel-menu');
  if (d) {
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
  }
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeSoupDrawer(){
  const d = document.getElementById('soup-drawer');
  const btn = document.getElementById('hdr-soup-menu');
  if (d) {
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
  }
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function openSoupDrawer(){
  const d = document.getElementById('soup-drawer');
  const btn = document.getElementById('hdr-soup-menu');
  if (d) {
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
  }
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function resetSoupSearchChrome(){
  soupLocalSearchOpen = false;
  const sw = document.getElementById('search-bar-wrap');
  if (sw) sw.style.display = 'none';
  const si = document.getElementById('search-input');
  if (si) si.value = '';
  searchQuery = '';
}

async function showSoupLocalSearch(){
  soupLocalSearchOpen = true;
  const w = document.getElementById('search-bar-wrap');
  if (w) w.style.display = 'block';
  await renderTableView();
  requestAnimationFrame(() => {
    const inp = document.getElementById('search-input');
    if (!inp) return;
    try { inp.focus({ preventScroll: true }); } catch (_) { inp.focus(); }
  });
}

async function hideSoupLocalSearch(){
  resetSoupSearchChrome();
  await renderTableView();
}

function resetSanctuarySearchChrome(){
  sanctuaryLocalSearchOpen = false;
  const sw = document.getElementById('sanctuary-search-bar-wrap');
  if (sw) sw.style.display = 'none';
  const si = document.getElementById('sanctuary-search-input');
  if (si) si.value = '';
  sanctuarySearchQuery = '';
}

async function showSanctuaryLocalSearch(){
  sanctuaryLocalSearchOpen = true;
  closeSanctuaryDrawer();
  const w = document.getElementById('sanctuary-search-bar-wrap');
  if (w) w.style.display = 'block';
  await renderSanctuaryView();
  requestAnimationFrame(() => {
    const inp = document.getElementById('sanctuary-search-input');
    if (!inp) return;
    try { inp.focus({ preventScroll: true }); } catch (_) { inp.focus(); }
  });
}

async function hideSanctuaryLocalSearch(){
  resetSanctuarySearchChrome();
  await renderSanctuaryView();
}

function onSanctuarySearchInput(val){
  sanctuarySearchQuery = (val == null ? '' : String(val));
  void renderSanctuaryView();
}

function sanctuaryPrefersReducedMotion(){
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}

function resizeSanctuaryMyceliumCanvas(){
  const c = document.getElementById('sanctuary-mycelium-canvas');
  const atm = document.querySelector('#view-sanctuary .sanctuary-atmosphere');
  if (!c || !atm) return;
  const r = atm.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rw = Math.max(1, Math.floor(r.width * dpr));
  const rh = Math.max(1, Math.floor(r.height * dpr));
  c.width = rw;
  c.height = rh;
  c.style.width = Math.floor(r.width) + 'px';
  c.style.height = Math.floor(r.height) + 'px';
}

function initSanctuaryMyceliumParticles(w, h){
  sanctuaryMyceliumParticles = [];
  for (let i = 0; i < SANCTUARY_MYCEL_MAX; i++) {
    sanctuaryMyceliumParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      angle: Math.random() * Math.PI * 2, // Direction of growth
      speed: 0.15 + Math.random() * 0.2,  // Slow creeping growth
      life: 500 + Math.random() * 1000    // How long before it dies and respawns
    });
  }
}

function tickSanctuaryMycelium(){
  if (!sanctuaryAmbienceActive) {
    sanctuaryMyceliumRaf = null;
    return;
  }
  if (document.hidden) {
    sanctuaryMyceliumRaf = null;
    return;
  }
  const panel = document.getElementById('view-sanctuary');
  const c = document.getElementById('sanctuary-mycelium-canvas');
  if (!c || !panel || panel.classList.contains('hidden')) {
    sanctuaryMyceliumRaf = requestAnimationFrame(tickSanctuaryMycelium);
    return;
  }
  if (sanctuaryPrefersReducedMotion()) {
    sanctuaryMyceliumRaf = null;
    return;
  }
  const ctx = c.getContext('2d');
  if (!ctx) {
    sanctuaryMyceliumRaf = requestAnimationFrame(tickSanctuaryMycelium);
    return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.width / dpr;
  const h = c.height / dpr;
  if (sanctuaryMyceliumParticles.length < SANCTUARY_MYCEL_MAX) initSanctuaryMyceliumParticles(w, h);

  // This leaves a trail that slowly fades away, creating the "web" look.
 
// Fade trail -- slightly faster fade so old threads don't muddy
ctx.fillStyle = 'rgba(5, 6, 7, 0.018)';
ctx.fillRect(0, 0, c.width, c.height);

ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

ctx.lineWidth = 1.1;

for (let i = 0; i < sanctuaryMyceliumParticles.length; i++) {
  let p = sanctuaryMyceliumParticles[i];
  let oldX = p.x;
  let oldY = p.y;

  p.angle += (Math.random() - 0.5) * 0.3;
  p.x += Math.cos(p.angle) * p.speed;
  p.y += Math.sin(p.angle) * p.speed;
  p.life--;

  // Alternate warm/cool per particle for depth
  const warm = i % 3 !== 0;
    ctx.strokeStyle = warm
    ? `rgba(${mycelWarm}, 0.22)`
    : `rgba(${mycelCool}, 0.35)`;

  // Occasional bright node pulse
  if (Math.random() < 0.003) {
    ctx.strokeStyle = `rgba(${mycelCool}, 0.65)`;
    ctx.lineWidth = 1.6;
  } else {
    ctx.lineWidth = 1.1;
  }

  ctx.beginPath();
  ctx.moveTo(oldX, oldY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  // Branching -- raised cap from 15 to 40
  if (Math.random() < 0.005 && sanctuaryMyceliumParticles.length < 40) {
    sanctuaryMyceliumParticles.push({
      x: p.x,
      y: p.y,
      angle: p.angle + (Math.random() > 0.5 ? 0.8 : -0.8),
      speed: p.speed * 0.8,
      life: 200
    });
  }

  if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
    if (i >= SANCTUARY_MYCEL_MAX) {
      sanctuaryMyceliumParticles.splice(i, 1);
      i--;
    } else {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.life = 500 + Math.random() * 1000;
    }
  }
}
sanctuaryMyceliumRaf = requestAnimationFrame(tickSanctuaryMycelium);
}

function startSanctuaryRealm(){
  sanctuaryAmbienceActive = true;
  const _ms = getComputedStyle(document.documentElement);
mycelWarm = _ms.getPropertyValue('--mycel-warm').trim() || mycelWarm;
mycelCool = _ms.getPropertyValue('--mycel-cool').trim() || mycelCool;
  const c = document.getElementById('sanctuary-mycelium-canvas');
  const panel = document.getElementById('view-sanctuary');
  if (c && panel && !sanctuaryPrefersReducedMotion()) {
    resizeSanctuaryMyceliumCanvas();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    initSanctuaryMyceliumParticles(c.width / dpr, c.height / dpr);
    cancelAnimationFrame(sanctuaryMyceliumRaf);
    sanctuaryMyceliumRaf = requestAnimationFrame(tickSanctuaryMycelium);
    if (typeof ResizeObserver !== 'undefined') {
      if (sanctuaryMyceliumResizeObs) sanctuaryMyceliumResizeObs.disconnect();
      sanctuaryMyceliumResizeObs = new ResizeObserver(() => {
        if (!sanctuaryAmbienceActive) return;
        resizeSanctuaryMyceliumCanvas();
        const d = Math.min(window.devicePixelRatio || 1, 2);
        const cw = document.getElementById('sanctuary-mycelium-canvas');
        if (cw) initSanctuaryMyceliumParticles(cw.width / d, cw.height / d);
      });
      const atmObs = document.querySelector('#view-sanctuary .sanctuary-atmosphere');
      if (atmObs) sanctuaryMyceliumResizeObs.observe(atmObs);
      else sanctuaryMyceliumResizeObs.observe(panel);
    }
  }
}

function stopSanctuaryRealm(){
  sanctuaryAmbienceActive = false;
  cancelAnimationFrame(sanctuaryMyceliumRaf);
  sanctuaryMyceliumRaf = null;
  if (sanctuaryMyceliumResizeObs) {
    sanctuaryMyceliumResizeObs.disconnect();
    sanctuaryMyceliumResizeObs = null;
  }
  closeSanctuaryDrawer();
}

function onSanctuarySurfacePointerDown(ev){
  const panel = document.getElementById('view-sanctuary');
  if (!panel || panel.classList.contains('hidden')) return;
  const dr = document.getElementById('sanctuary-drawer');
  if (dr && dr.classList.contains('open')) return;
}

/* PERSONA */
function getGlobalPersona(){
  return JSON.parse(localStorage.getItem('nq_global_persona')||'{"bio":"","personality":""}');
}
function saveGlobalPersona(bio,personality){
  localStorage.setItem('nq_global_persona',JSON.stringify({bio,personality}));
}

let currentIEModels = [];

function renderIEModelList(){
  const list = document.getElementById('ie-model-list');
  if(!list) return;
  list.innerHTML = '';
  if(!currentIEModels.length){
    list.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:4px 0;">No models -- add at least one</div>';
    return;
  }
  currentIEModels.forEach((modelId, index) => {
    const chip = document.createElement('div');
    chip.className = 'model-chip active';
    chip.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0;';
    chip.innerHTML = `
      <span>${escHtml(modelId.split('/').pop())}</span>
      <button onclick="deleteIEModel(${index})" 
        style="background:none;border:none;color:var(--danger);
        font-size:12px;cursor:pointer;padding:0;line-height:1;">✕</button>
    `;
    list.appendChild(chip);
  });
}

function deleteIEModel(index){
  currentIEModels.splice(index, 1);
  renderIEModelList();
}

function getPersonaRoles(){
  return JSON.parse(localStorage.getItem('nq_persona_roles')||'[]');
}
function savePersonaRoles(roles){
  localStorage.setItem('nq_persona_roles',JSON.stringify(roles));
}

/** Guardian Soup invoke strip — timer + active flag (declared before FF so RAF can read safely at boot). */
var guardianInvokeTimer = null;
var guardianInvokeActive = false;
var guardianInvokeLastTriggerType = null;
/** Auto-dismiss strip after this many ms (Batch 3 typo: minutes, not hours). */
var GUARDIAN_INVOKE_STRIP_DISSOLVE_MS = 6 * 60 * 1000;

/* FIREFLY — Soup-only atmosphere (canvas is fixed; off-Soup we stop drawing so it never bleeds through) */
class FF {
  constructor() {
    this.canvas = document.getElementById('firefly-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.p = [];
    this.d = 15;
    this.paused = false;
    this.soupActive = true;
    this._raf = null;
    this.r();
    window.addEventListener('resize', () => this.r());
    this.a();
  }
  r() {
    if (!this.canvas) return;
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
  }
  sd(l) {
    if (!this.soupActive) return;
    this.d = Math.min(60, 15 + Math.floor(l / 200));
  }
  setSoupActive(on) {
    const next = !!on;
    if (this.soupActive === next) return;
    this.soupActive = next;
    if (this._raf != null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.p = [];
    if (this.soupActive && !document.hidden && !this.paused) this.a();
  }
  a() {
    if (!this.canvas || !this.ctx) return;
    if (!this.soupActive || this.paused || document.hidden) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    while (this.p.length < this.d) {
      this.p.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        s: Math.random() * 1.5 + 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        a: Math.random() * 0.4 + 0.1,
        p: Math.random() * 0.01 + 0.002
      });
    }
    if (this.p.length > this.d) this.p.splice(this.d);
            var _gr = null;
    if (guardianInvokeActive) {
      var _gs = document.getElementById('guardian-invoke-strip');
      if (_gs && _gs.classList.contains('visible')) _gr = _gs.getBoundingClientRect();
    }
    this.p.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (_gr && _gr.width > 0) {
        var tgx = _gr.left + _gr.width * 0.5;
        var tgy = _gr.top + _gr.height * 0.5;
        var gdx = tgx - p.x;
        var gdy = tgy - p.y;
        var glen = Math.sqrt(gdx * gdx + gdy * gdy);
        if (glen > 60) {
          p.x += (gdx / glen) * 0.3;
          p.y += (gdy / glen) * 0.3;
        } else {
          p.vx *= 0.88;
          p.vy *= 0.88;
        }
          if (gr.width > 0 && gr.height > 0) {
            var tgx = gr.left + gr.width * 0.5;
            var tgy = gr.top + gr.height * 0.5;
            var gdx = tgx - p.x;
            var gdy = tgy - p.y;
            var glen = Math.sqrt(gdx * gdx + gdy * gdy);
              if (glen > 60) {
              p.x += (gdx / glen) * 0.3;
              p.y += (gdy / glen) * 0.3;
            } else {
              p.vx *= 0.88;
              p.vy *= 0.88;
            }
          }
        }
      }
      p.a += p.p;
      if (p.a > 0.6 || p.a < 0.1) p.p *= -1;
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(200,160,80,${p.a})`;
      this.ctx.fill();
    });
    this._raf = requestAnimationFrame(() => this.a());
  }
}
const firefly = new FF();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) firefly.paused = true;
  else {
    firefly.paused = false;
    if (firefly.soupActive) firefly.a();
  }
});

/* DB -- ABYSS-PROOF WORKER (NULL FIXED)- Nuclear fix 
Auto increment Time-bomb & PUT code endless echo */
const WORKER_CODE = `
importScripts('https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js');
let db = null;
let encKey = null;
let saveTimer = null;
const tableColumns = {}; 

async function initSql() {
  const SQL = await initSqlJs({ locateFile: f => 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/' + f });
  const existing = await loadFromOPFS();
  db = existing ? new SQL.Database(existing) : new SQL.Database();
  // THE PURGE: We must destroy the old integer-based tables to rebuild them as TEXT
  // ONE-TIME MIGRATION: only drop if still old INTEGER schema
try {
  const info = db.exec("PRAGMA table_info(history)");
  if (info.length) {
    const idCol = info[0].values.find(v => v[1] === 'id');
    if (idCol && idCol[2] === 'INTEGER') {
      db.run("DROP TABLE IF EXISTS history");
      db.run("DROP TABLE IF EXISTS summaries");
    }
  }
} catch(e) {}

  db.run("CREATE TABLE IF NOT EXISTS cosm_folders(id TEXT PRIMARY KEY, name TEXT, parent_id TEXT, created_at INTEGER, updated_at INTEGER, is_deleted INTEGER DEFAULT 0)");
db.run("CREATE TABLE IF NOT EXISTS cosm_discourses(id TEXT PRIMARY KEY, title TEXT, raw_text TEXT, folder_id TEXT, created_at INTEGER, updated_at INTEGER, item_type TEXT, source_link TEXT, is_deleted INTEGER DEFAULT 0, deleted_at INTEGER, is_favourite INTEGER DEFAULT 0, gravity INTEGER DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS guardian_summaries(id TEXT PRIMARY KEY, discourse_id TEXT, summary TEXT, map_type TEXT, first_line TEXT, last_line TEXT, key_terms TEXT, emotional_arc TEXT, extractive_summary TEXT, watcher TEXT, word_count INTEGER, model TEXT, generated_at INTEGER, created_at INTEGER, updated_at INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS immutable_entities(id TEXT PRIMARY KEY, display_name TEXT NOT NULL, archetype_tag TEXT, existential_function TEXT, system_prompt_core TEXT, constraints TEXT, voice_limits TEXT, memory_policy TEXT DEFAULT 'stateless', model_variants TEXT, example_turns TEXT, watcher_thresholds TEXT, guardian_audit_hash TEXT, sigil_svg TEXT, locked_at INTEGER, signature TEXT, is_hidden INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS immutable_entities_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS characters(id TEXT PRIMARY KEY, name TEXT, role TEXT, backstory TEXT, personality TEXT, lorebook TEXT, scenario TEXT, inclination TEXT, relationships TEXT, pc_info TEXT, player_role_id TEXT, image TEXT, temperature REAL DEFAULT 1, is_deleted INTEGER DEFAULT 0, deleted_at INTEGER, created_at INTEGER, updated_at INTEGER)");
  // THE FIX: History and Summaries now use TEXT IDs (UUID/Timestamps)
  db.run("CREATE TABLE IF NOT EXISTS history(id TEXT PRIMARY KEY, charId TEXT, role TEXT, content TEXT, created_at INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS summaries(id TEXT PRIMARY KEY, charId TEXT, text TEXT, type TEXT, created_at INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS cosm_mosaic_tiles(id TEXT PRIMARY KEY, discourse_id TEXT, anchors TEXT, created_at INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS cosm_backlinks(id TEXT PRIMARY KEY, discourse_id TEXT, char_name TEXT, created_at INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS cosm_folders_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS cosm_discourses_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS characters_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS summaries_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS cosm_mosaic_tiles_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS cosm_backlinks_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS history_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS guardian_logs(id TEXT PRIMARY KEY, invoked_at INTEGER, model_used TEXT, soup_snapshot_count INTEGER, response_text TEXT, was_silent INTEGER DEFAULT 0, thread TEXT, emotional_weight REAL DEFAULT 1.0)");
db.run("CREATE TABLE IF NOT EXISTS guardian_logs_enc(id TEXT PRIMARY KEY, invoked_at INTEGER, model_used TEXT, soup_snapshot_count INTEGER, ciphertext TEXT, iv TEXT, was_silent INTEGER DEFAULT 0, thread TEXT, emotional_weight REAL DEFAULT 1.0)");
  db.run("CREATE TABLE IF NOT EXISTS guardian_summaries_enc(id TEXT PRIMARY KEY, enc TEXT)");

  try { db.run("ALTER TABLE guardian_logs ADD COLUMN auto_invoked INTEGER DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN triggered_by TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN user_action TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN log_type TEXT"); } catch (e) {}

  ['cosm_folders', 'cosm_discourses', 'characters', 'history', 'summaries', 'cosm_mosaic_tiles', 'cosm_backlinks', 'guardian_logs', 'guardian_summaries', 'immutable_entities'].forEach
(t => {
    try {
      const info = db.exec("PRAGMA table_info(" + t + ")");
      tableColumns[t] = info[0].values.map(v => v[1]);
    } catch(e) {}
  });
  db.run("DELETE FROM cosm_folders WHERE id='root'");
  await save();
}

async function loadFromOPFS() {
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle('nq.db', { create: false });
    return new Uint8Array(await (await fh.getFile()).arrayBuffer());
  } catch(e) { return null; }
}

async function save() {
  try {
    const data = db.export();
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle('nq.db', { create: true });
    try {
      const writable = await fh.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (err) {
      const accessHandle = await fh.createSyncAccessHandle();
      accessHandle.write(data);
      accessHandle.flush();
      accessHandle.close();
    }
  } catch(e) { console.error('OPFS Save Failed:', e); }
}

function toObjects(res) {
  if (!res || !res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(v => {
    const obj = {};
    cols.forEach((c, i) => {
      let val = v[i];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[c] = val;
    });
    obj.isDeleted = obj.is_deleted === 1;
    return obj;
  });
}

async function encryptObj(obj){
  const iv = self.crypto.getRandomValues(new Uint8Array(12));
  const ct = await self.crypto.subtle.encrypt(
    {name:'AES-GCM', iv},
    encKey,
    new TextEncoder().encode(JSON.stringify(obj))
  );
  return JSON.stringify({iv:Array.from(iv), ct:Array.from(new Uint8Array(ct))});
}

async function decryptObj(encData){
  const obj = typeof encData === 'string' ? JSON.parse(encData) : encData;
  const dec = await self.crypto.subtle.decrypt(
    {name:'AES-GCM', iv: new Uint8Array(obj.iv)},
    encKey,
    new Uint8Array(obj.ct)
  );
  return JSON.parse(new TextDecoder().decode(dec));
}

self.onmessage = async (e) => {
  const { id, action, store, data, field, value } = e.data;
  try {
    if (action === 'INIT') { await initSql(); self.postMessage({ id, result: 'ready' }); return; }

    if (action === 'SET_KEY') {
      encKey = await self.crypto.subtle.importKey(
        'raw', new Uint8Array(data.keyBytes),
        {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']
      );
      self.postMessage({ id, result: 'key_set' });
      return;
    }

    if (action === 'CLEAR_KEY') { encKey = null; self.postMessage({ id, result: 'key_cleared' }); return; }

    // THE FIX: History gets encrypted now too for absolute privacy
    const isEnc = encKey; 
    const targetStore = isEnc ? (store + "_enc") : store;

    let result = null;
    if (action === 'GET_ALL') {
      const rows = toObjects(db.exec("SELECT * FROM " + targetStore));
      if (isEnc) { result = await Promise.all(rows.map(async r => r.enc ? await decryptObj(r.enc) : r)); } 
      else { result = rows; }
    }
    else if (action === 'GET') {
      const res = db.exec("SELECT * FROM " + targetStore + " WHERE id=?", [data.id]);
      const row = res.length ? toObjects(res)[0] : null;
      if (isEnc && row && row.enc) { result = await decryptObj(row.enc); } 
      else { result = row; }
    }
    else if (action === 'GET_BY_INDEX') {
      if (isEnc) {
        const allRows = toObjects(db.exec("SELECT * FROM " + targetStore));
        const decrypted = await Promise.all(allRows.map(async r => r.enc ? await decryptObj(r.enc) : r));
        result = decrypted.filter(r => r && r[field] === value);
      } else {
        result = toObjects(db.exec("SELECT * FROM " + store + " WHERE " + field + "=?", [value]));
      }
    }
    else if (action === 'PUT') {
      const obj = { ...data };
      if ('isDeleted' in obj) { obj.is_deleted = obj.isDeleted ? 1 : 0; }

      if (isEnc) {
        const enc = await encryptObj(obj);
        db.run("INSERT INTO " + targetStore + "(id, enc) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET enc=excluded.enc", [obj.id, enc]);
      } else {
        const validCols = tableColumns[store] || [];
        const keys = Object.keys(obj).filter(k => validCols.includes(k));
        const vals = keys.map(k => {
          const v = obj[k];
          if (v === null) return null;
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        });
        const placeholders = keys.map(() => '?').join(',');
        const updates = keys.filter(k => k !== 'id').map(k => k + "=excluded." + k).join(',');
        
        // THE FIX: ON CONFLICT UPDATE restored for history
        db.run("INSERT INTO " + store + "(" + keys.join(',') + ") VALUES (" + placeholders + ") ON CONFLICT(id) DO UPDATE SET " + updates, vals);
      }

      if(saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 500);
      result = 'ok';
    }
    else if (action === 'DELETE') { 
      db.run("DELETE FROM " + store + " WHERE id=?", [data.id]); 
      try { db.run("DELETE FROM " + store + "_enc WHERE id=?", [data.id]); } catch(e){}
      save(); 
      result = 'ok'; 
    }
    self.postMessage({ id, result });
  } catch(err) { self.postMessage({ id, error: err.message }); }
};
`;

let _id = 0;
const _pending = {};
let _worker = null;
let _workerReady = null;

function initWorker(){
  const workerBlob = new Blob([WORKER_CODE], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(workerBlob);
  _worker = new Worker(workerUrl);
  URL.revokeObjectURL(workerUrl);
  _worker.onmessage = e => {
    const { id, result, error } = e.data;
    if (_pending[id]) {
      if (error) _pending[id].reject(new Error(error));
      else _pending[id].resolve(result);
      delete _pending[id];
    }
  };

  _workerReady = new Promise((res, rej) => {
    const msgId = ++_id;
    _pending[msgId] = { resolve: res, reject: rej };
    _worker.postMessage({ id: msgId, action: 'INIT' });
  });
}

/* ── WATCHER ENGINE (MAIN THREAD SHADOW QUEUE) ──────────────── */
// DEV MODE: flip to false before shipping to production
/* Set false for production builds (relaxes watcher thresholds and skips lock screen). */
const NQ_DEV_MODE = true;
//const NQ_DEV_MODE = false;

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
      if (finalScore >= W_SIMILARITY_THRESHOLD) {
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
  if (hoursSince > W_PASS_COOLDOWN_HOURS) {
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

/* DB HELPERS */
const dbPut = (s, d) => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'PUT', store: s, data: d });
}));
const dbGetAll = (s) => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'GET_ALL', store: s });
}));
const dbGet = (s, id) => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'GET', store: s, data: { id } });
}));
const dbGetByIndex = (s, f, v) => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'GET_BY_INDEX', store: s, field: f, value: v });
}));
const dbDelete = (s, id) => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'DELETE', store: s, data: { id } });
}));
const setEncryptionKey = (keyBytes) => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'SET_KEY', data: { keyBytes: Array.from(keyBytes) } });
}));

// --- PHOTO STORAGE ENGINE (Unencrypted IndexedDB) ---
function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nq_photos', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('photos');
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function loadCharacterPhoto(charId, slot) {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve) => {
      const tx = db.transaction('photos', 'readonly');
      const req = tx.objectStore('photos').get(`${charId}_${slot}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
}

async function saveCharacterPhoto(charId, slot, dataUrl) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(dataUrl, `${charId}_${slot}`);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

async function deleteCharacterPhoto(charId, slot) {
  const db = await openPhotoDB();
  return new Promise((resolve) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(`${charId}_${slot}`);
    tx.oncomplete = () => resolve();
  });
}

async function deleteAllCharacterPhotos(charId) {
  for(let i=0; i<3; i++) {
    await deleteCharacterPhoto(charId, i);
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 512; // Keep it tight to save quota
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1812'; // Matte background for transparent PNGs
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject('Image load failed');
    };
    reader.onerror = () => reject('File read failed');
  });
}

// --- PHOTO UI RENDERER ---
async function renderForgePhotos(charId, primarySlotStr) {
  const section = document.getElementById('forge-photo-section');
  if (!section) return;
  
  let primarySlot = (primarySlotStr !== undefined && primarySlotStr !== null && primarySlotStr !== '') ? Number(primarySlotStr) : -1;
  
  section.innerHTML = `<div class="cards-section-label" style="margin-top:0;">Photos</div><div class="forge-photo-slots"></div>`;
  const slotsContainer = section.querySelector('.forge-photo-slots');
  
  for (let i = 0; i < 3; i++) {
    const slot = document.createElement('div');
    const isPrimary = (i === primarySlot);
    slot.className = 'forge-photo-slot' + (isPrimary ? ' is-primary' : '');
    
    const photoData = await loadCharacterPhoto(charId, i);
    
    if (photoData) {
      slot.innerHTML = `
        <img src="${photoData}" alt="">
        ${isPrimary ? `<div class="slot-primary-badge">Primary</div>` : ''}
        <div class="slot-remove">✕</div>
      `;
      
      // Delete
      slot.querySelector('.slot-remove').onclick = async (e) => {
        e.stopPropagation();
        await deleteCharacterPhoto(charId, i);
        if (isPrimary) {
           await updateCharacter(charId, { image: '' }); // Unset primary
        }
        renderForgePhotos(charId, isPrimary ? '' : primarySlotStr);
      };
      
      // Set as Primary
      slot.onclick = async () => {
         if (primarySlot === i) return;
         await updateCharacter(charId, { image: String(i) });
         renderForgePhotos(charId, String(i));
      };
      
    } else {
      slot.innerHTML = `<div class="slot-empty-label">+</div>`;
      slot.onclick = () => {
         const input = document.createElement('input');
         input.type = 'file';
         input.accept = 'image/*';
         input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
              const compressed = await compressImage(file);
              await saveCharacterPhoto(charId, i, compressed);
              // Auto-set as primary if it's the first photo
              if (primarySlot === -1) {
                 await updateCharacter(charId, { image: String(i) });
                 primarySlot = i;
              }
              renderForgePhotos(charId, String(primarySlot));
            } catch(err) {
              showToast("Failed to process photo");
            }
         };
         input.click();
      };
    }
    slotsContainer.appendChild(slot);
  }
}

/* IMMUTABLE ENTITY */
const getImmutableEntities = () => dbGetAll("immutable_entities");
const getImmutableEntity = (id) => dbGet("immutable_entities", id);
async function saveImmutableEntity(data) {
  const now = Date.now();
  const entity = { ...data, created_at: data.created_at || now, updated_at: now };
  await dbPut("immutable_entities", entity);
  return entity;
}

function openIEPage(){
  showPanel('view-ie');
  document.getElementById('ie-search-input').value = '';
  renderIEList();
}

function renderIEList(filterQuery = ''){
  const surface = document.getElementById('ie-list-surface');
  
  let debugInfo = '';
  surface.innerHTML = '<div style="padding:20px;color:var(--muted);">Loading entities...</div>';
  
  getImmutableEntities().then(entities => {
    debugInfo += 'Loaded: ' + (entities?.length || 0) + ' entities\n';
    
    if (!entities || !entities.length) {
      surface.innerHTML = `
        <div class="ie-empty">
          No immutable entities yet.<br>
          These are forged over time.
        </div>`;
      return;
    }
    
    const q = (filterQuery || '').trim().toLowerCase();
    
    let filtered;
    try {
      filtered = entities.filter(e => {
        if (!e) return false;
        if (e.is_deleted || e.isDeleted) return false;
        if (!q) return true;
        return (e.display_name||'').toLowerCase().includes(q) 
          || (e.archetype_tag||'').toLowerCase().includes(q)
          || (e.existential_function||'').toLowerCase().includes(q);
      });
    } catch(filterErr) {
      surface.innerHTML = '<div style="padding:20px;color:#ff6060;background:#1a0000;border:1px solid #ff6060;border-radius:12px;font-size:14px;">FILTER ERROR -- check console.</div>';
      console.error('IE filter error:', filterErr);
      return;
    }
    
    if(!filtered.length){
      surface.innerHTML = `<div class="ie-empty">${q ? 'No entities match search' : 'No immutable entities yet.'}</div>`;
      return;
    }
    
    surface.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'ie-cards-grid';

    filtered.forEach((e, idx) => {
  try {
    const isLocked = !!e.signature;
    const date = new Date(e.locked_at || e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let models = [];
    if (Array.isArray(e.model_variants)) {
      models = e.model_variants;
    } else if (typeof e.model_variants === 'string') {
      try { models = JSON.parse(e.model_variants); } catch(err) { models = []; }
    }
    const modelStr = models.length ? models.map(m => m.model_id?.split('/').pop()).filter(Boolean).join(' · ') : '';

    const card = document.createElement('div');
card.className = 'ie-card' + (isLocked ? '' : ' draft');
card.innerHTML = `
  <div class="ie-card-text">
    <div class="ie-card-name">${escHtml(e.display_name || 'Unnamed')}${isLocked ? ' ◆' : ''}</div>
    ${e.archetype_tag ? '<div class="ie-card-archetype">' + escHtml(e.archetype_tag) + '</div>' : ''}
    ${e.existential_function ? '<div class="ie-card-function">' + escHtml(e.existential_function) + '</div>' : ''}
    <div class="ie-card-meta">${isLocked ? 'locked' : 'draft'} · ${date}${modelStr ? ' · ' + modelStr : ''}</div>
    <div class="ie-card-actions"></div>
  </div>
  <div class="ie-card-sigil pulse">
    ${generateIESigil(e.id)}
  </div>
`;
    const actions = card.querySelector('.ie-card-actions');

    if (!isLocked) {
      const lockBtn = document.createElement('button');
      lockBtn.textContent = '◆ Lock';
      lockBtn.style.cssText = 'background:none;border:1px solid var(--accent-dim);color:var(--accent);font-size:9px;padding:3px 10px;border-radius:6px;font-weight:700;letter-spacing:1px;';
      lockBtn.addEventListener('click', ev => { ev.stopPropagation(); devQuickLock(e.id); });
      actions.appendChild(lockBtn);

      const editBtn = document.createElement('button');
      editBtn.textContent = '✎ Edit';
      editBtn.style.cssText = 'background:none;border:1px solid var(--border);color:var(--muted);font-size:9px;padding:3px 10px;border-radius:6px;font-weight:700;letter-spacing:1px;';
      editBtn.addEventListener('click', ev => { ev.stopPropagation(); openIEForge(e.id); });
      actions.appendChild(editBtn);
    }

    card.addEventListener('click', () => { if (isLocked) openIEBottomSheet(e.id); });

    // long‑press unlock (dev)
    let devLP = null;
    card.addEventListener('touchstart', () => { devLP = setTimeout(() => devUnlockIE(e.id), 2000); }, { passive: true });
    card.addEventListener('touchend', () => clearTimeout(devLP));

    grid.appendChild(card);

  } catch(innerErr) {
    console.error('IE card render error', idx, e.id, innerErr);
  }
});

    surface.appendChild(grid);

  }).catch(err => {
    surface.innerHTML = '<div style="padding:20px;color:#ff6060;background:#1a0000;border:1px solid #ff6060;border-radius:12px;font-size:14px;">DATABASE ERROR -- check console.</div>';
    console.error('IE list DB error:', err);
  });
}

// SIGIL GENERATOR
function generateIESigil(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  
  // More varied parameters
  const sides = 3 + (abs % 5);              // 3-7 sided polygon base
  const rings = 1 + (abs % 3);              // 1-3 rings
  const segments = 4 + (abs % 8);           // 4-11 radial segments
  const spikeCount = 2 + (abs % 5);         // 2-6 spike elements
  const rot = (abs % 360);
  const glowColor = abs % 3 === 0 ? '#c8a050' : abs % 3 === 1 ? '#8a6e35' : '#a0d8a0';
  
  let svg = `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(${rot} 22 22)">`;
  
  // Base rings
  for (let i = 0; i < rings; i++) {
    const r = 20 - (i * 4);
    const dash = 2 + (abs % 3);
    svg += `<circle cx="22" cy="22" r="${r}" fill="none" 
      stroke="${i === 0 ? '#c8a050' : '#8a6e35'}" 
      stroke-width="${0.5 + (i * 0.3)}" 
      stroke-dasharray="${dash} ${dash * 2}" 
      opacity="${0.9 - (i * 0.2)}"/>`;
  }
  
  // Polygon base
  const polygon = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const r = 12 + (abs % 8);
    polygon.push(`${22 + Math.cos(angle) * r},${22 + Math.sin(angle) * r}`);
  }
  svg += `<polygon points="${polygon.join(' ')}" 
    fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.6"/>`;
  
  // Radial segments (like a compass or star map)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const inner = 8 + (abs % 4);
    const outer = 18 + (abs % 4);
    const x1 = 22 + Math.cos(angle) * inner;
    const y1 = 22 + Math.sin(angle) * inner;
    const x2 = 22 + Math.cos(angle) * outer;
    const y2 = 22 + Math.sin(angle) * outer;
    const draw = (abs + i) % 3 === 0;
    if (draw) {
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
        stroke="${glowColor}" stroke-width="0.5" opacity="0.4"/>`;
    }
  }
  
  // Distinctive mark (replaces the meaningless dot)
  const markAngle = (abs % 360) * Math.PI / 180;
  const markR = 14 + (abs % 6);
  const mx = 22 + Math.cos(markAngle) * markR;
  const my = 22 + Math.sin(markAngle) * markR;
  
  // Different marks based on hash
  const markType = abs % 5;
  if (markType === 0) {
    // Diamond
    svg += `<polygon points="${mx},${my-3} ${mx+2},${my} ${mx},${my+3} ${mx-2},${my}" 
      fill="${glowColor}" opacity="0.8"/>`;
  } else if (markType === 1) {
    // Circle
    svg += `<circle cx="${mx}" cy="${my}" r="2.5" fill="${glowColor}" opacity="0.8"/>`;
  } else if (markType === 2) {
    // Cross
    svg += `<line x1="${mx-2}" y1="${my}" x2="${mx+2}" y2="${my}" stroke="${glowColor}" stroke-width="1.5"/>
            <line x1="${mx}" y1="${my-2}" x2="${mx}" y2="${my+2}" stroke="${glowColor}" stroke-width="1.5"/>`;
  } else if (markType === 3) {
    // Triangle
    svg += `<polygon points="${mx},${my-3} ${mx+2.5},${my+2} ${mx-2.5},${my+2}" 
      fill="none" stroke="${glowColor}" stroke-width="1"/>`;
  } else {
    // Hollow circle
    svg += `<circle cx="${mx}" cy="${my}" r="2.5" fill="none" stroke="${glowColor}" stroke-width="1.5"/>`;
  }
  
  // Small orbiting dots
  for (let i = 0; i < spikeCount; i++) {
    const angle = markAngle + (i / spikeCount) * Math.PI * 2;
    const orbR = 14 + (abs % 6) + (i * 2);
    const ox = 22 + Math.cos(angle) * orbR;
    const oy = 22 + Math.sin(angle) * orbR;
    const size = 0.5 + (abs % 2) * 0.5;
    const draw = (abs + i * 7) % 3 !== 0;
    if (draw) {
      svg += `<circle cx="${ox}" cy="${oy}" r="${size}" 
        fill="${glowColor}" opacity="${0.3 + (i * 0.1)}"/>`;
    }
  }
  
  svg += '</g></svg>';
  return svg;
}

function openIEBottomSheet(id){
  getImmutableEntity(id).then(e => {
    if(!e) return;
    
    const sigilEl = document.getElementById('ie-manifest-sigil');
    const rawSigil = (e.sigil_svg || '').trim();
    if (/^<svg[\s>]/i.test(rawSigil)) sigilEl.innerHTML = rawSigil;
    else sigilEl.textContent = '◈';
    
    document.getElementById('ie-manifest-name').textContent = e.display_name || 'Unnamed';
    document.getElementById('ie-manifest-archetype').textContent = e.archetype_tag || '';
    document.getElementById('ie-manifest-function').textContent = e.existential_function || '';
    
    // Map fields: system_prompt_core → Origin, backstory extracted or first line
    // We'll use constraints field for Constraint, voice_limits for Voice
    // The character forge stores: backstory, personality, etc.
    // For IE, the manifest fields come from the IE-specific columns
    document.getElementById('ie-manifest-origin').textContent = e.system_prompt_core || 'Forged from sustained encounter.';
    document.getElementById('ie-manifest-role').textContent = e.existential_function || '';
    document.getElementById('ie-manifest-constraint').textContent = e.constraints || 'Will not soften. Will not perform.';
    document.getElementById('ie-manifest-voice').textContent = e.voice_limits || 'As required by truth.';
    
    const date = new Date(e.locked_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    document.getElementById('ie-manifest-meta').textContent = `locked ${date}`;
    
    let models = e.model_variants;
if (typeof models === 'string') {
  try { models = JSON.parse(models); } catch(e) { models = []; }
} else if (!Array.isArray(models)) {
  models = [];
}
const modelStr = models.length ? models.map(m => m.model_id?.split('/').pop()).join(' · ') : '';
    document.getElementById('ie-manifest-models').textContent = modelStr || '';
    
    // Wire ENTER button
    document.getElementById('btn-ie-manifest-enter').onclick = () => {
      closeOverlay();
      openIEChat(id);
    };
        document.getElementById('ie-manifest-modal').dataset.ieId = id;

    document.getElementById('ie-manifest-modal').classList.add('visible');
    document.getElementById('cosm-overlay').classList.add('active');
  });
}

async function openIEChat(id){
  const ie = await getImmutableEntity(id);
  if(!ie) return;
  // Reset stuck send state on every entry
    isSending = false;
  activeCharId = id;
  activeIE = ie;
  chatReturnPanel = (currentView === 'ie') ? 'view-ie' : 'view-sanctuary';
  document.getElementById('view-chat').classList.add('ie-encounter');
  document.getElementById('chat-input').placeholder = 'Speak with intention...';
  document.getElementById('chat-persona-pill').style.display = 'none';
  document.getElementById('btn-chat-edit').style.display = 'none';

  // Use display_name for the chat header
  document.getElementById('chat-char-name').textContent = ie.display_name || 'Unnamed';
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('chat-input').value = '';
document.getElementById('chat-input').style.height = 'auto';
 
  // Load chat history -- IEs use the same history table, keyed by charId = ie.id
  const history = await dbGetByIndex('history', 'charId', id);
  history.forEach(h => appendChatMessage(h.role, h.content));
  
  const ieModels = ie.model_variants ? 
  (typeof ie.model_variants === 'string' ? JSON.parse(ie.model_variants) : ie.model_variants) 
  : [];
  currentIEModels = ieModels.map(m => m.model_id).filter(Boolean);
const chip = document.getElementById('ie-model-chip');
const bar = document.getElementById('ie-model-bar');
if(chip && ieModels.length > 0){
  if(bar) bar.style.display = 'block';
  chip.dataset.idx = '0';
  chip.dataset.models = JSON.stringify(ieModels);
  chip.textContent = `◈ ${ieModels[0].model_id?.split('/').pop() || 'model'}`;
} else if(chip){
  if(bar) bar.style.display = 'none';
  chip.dataset.models = '[]';
  currentIEModels = [];
}
  document.getElementById('chat-persona-pill').style.display = 'none';
  // Hide edit button -- IE is immutable
  document.getElementById('btn-chat-edit').style.display = 'none';
  
  // Persona -- IEs don't have player_role_id, use default
  chatPersonaOverride = null;
  updatePersonaPill();
  await updateChatRetryButton();
  showPanel('view-chat');
}

function cycleIEModel(){
  const chip = document.getElementById('ie-model-chip');
  if(!chip) return;
  if (!currentIEModels.length && chip.dataset.models) {
    try {
      const parsed = JSON.parse(chip.dataset.models);
      currentIEModels = (parsed || []).map(m => (typeof m === 'string' ? m : m.model_id)).filter(Boolean);
    } catch (e) { return; }
  }
  if(!currentIEModels.length) return;
  let idx = parseInt(chip.dataset.idx || '0');
  idx = (idx + 1) % currentIEModels.length;
  chip.dataset.idx = idx;
    chip.textContent = `◈ ${currentIEModels[idx].split('/').pop()}`;
  chip.style.opacity = '1';
  setTimeout(() => { chip.style.opacity = '0.4'; }, 800);
  showToast('◈ ' + currentIEModels[idx].split('/').pop());
}

async function deleteImmutableEntity(id) {
  await dbDelete('immutable_entities', id);
}

/* DEV DOOR */
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

async function devCreateIEDraft(){
  const defaultName = 'Entity ' + new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'});
  const tempId = 'ie_' + Date.now();
  const entity = {
    id: tempId,
    display_name: defaultName,
    archetype_tag: '',
    existential_function: '',
    system_prompt_core: 'You are ' + defaultName + '.',
    constraints: 'Will not soften. Will not perform.',
    voice_limits: 'As required by truth.',
    memory_policy: 'stateless',
    model_variants: JSON.stringify([
      {model_id: 'google/gemini-2.5-flash-lite'},
      {model_id: 'deepseek/deepseek-v4-flash'},
      {model_id: 'google/gemini-3-flash-preview'}
    ]),
    sigil_svg: '',
    locked_at: null,
    signature: null,
    is_hidden: 0,
    created_at: Date.now(),
    updated_at: Date.now()
  };
  document.getElementById('forge-container').dataset.tempIE = JSON.stringify(entity);
  document.getElementById('forge-container').dataset.isNew = 'true';
  openIEForge(entity);
  document.getElementById('forge-container').dataset.isNew = 'true';
  openIEForge(entity);
}

async function openIEForge(idOrEntity){
  let ie;
  if (typeof idOrEntity === 'object') {
    ie = idOrEntity;
  } else {
    ie = await getImmutableEntity(idOrEntity);
    if(!ie) {
      showToast('Entity not found');
      return;
    }
  }
  activeCharId = null;
// Map IE fields to forge field IDs
  document.getElementById('forge-name').value = ie.display_name || '';
  document.getElementById('forge-role').value = ie.archetype_tag || '';
  document.getElementById('forge-backstory').value = ie.system_prompt_core || '';
  document.getElementById('forge-personality').value = ie.voice_limits || '';
  document.getElementById('forge-lorebook').value = ie.constraints || '';
  document.getElementById('forge-scenario').value = ie.existential_function || '';
  document.getElementById('forge-inclination').value = ie.memory_policy || 'stateless';
  document.getElementById('forge-relationships').value = '';
  document.getElementById('forge-pc-info').value = '';

  // Reset temperature slider to normal
  const tempInput = document.getElementById('forge-temp');
  tempInput.type = 'range';
  tempInput.min = '0';
  tempInput.max = '2';
  tempInput.step = '0.1';
  tempInput.value = '1';
  document.getElementById('forge-temp-val').textContent = '1.0';

  // Parse model variants into currentIEModels array
  currentIEModels = [];
  if (ie.model_variants) {
    let models = ie.model_variants;
    if(typeof models === 'string'){ try{ models = JSON.parse(models); }catch(e){ models = []; } }
    if (Array.isArray(models)) {
      currentIEModels = models.map(m => m.model_id).filter(Boolean);
    }
  }
  renderIEModelList();
  // Store IE id for save
  document.getElementById('forge-container').dataset.ieId = ie.id;
  document.getElementById('forge-container').dataset.isIE = 'true';

  // Hide persona role selector
    // Hide persona role selector
  const personaRoleParent = document.getElementById('forge-persona-role').parentElement;
  if (personaRoleParent) personaRoleParent.style.display = 'none';

  // Hide model section (removed from UI), keep temperature visible
  const modelSection = document.getElementById('forge-model-section');
  if (modelSection) modelSection.style.display = 'none';

  // Hide photos for IEs
  const photoSection = document.getElementById('forge-photo-section');
  if (photoSection) photoSection.style.display = 'none';

  // Unmake button for IEs
  const unmakeZone = document.getElementById('forge-unmake-zone');
  const unmakeBtn = document.getElementById('btn-forge-unmake');
  if (unmakeZone) unmakeZone.style.display = 'block';
  if (unmakeBtn) {
    unmakeBtn.onclick = async () => {
      if (!confirm('Unmake this Immutable Entity? This cannot be undone.')) return;
      if (!confirm('Final warning. This entity will cease to exist. Continue?')) return;
      await deleteImmutableEntity(ie.id);
      showToast('Entity dissolved.');
      closeIEForge();
      showPanel('view-ie');
      renderIEList();
    };
  }

  // Change labels
  const sectionTitles = document.querySelectorAll('.forge-section-title');
  if (sectionTitles.length >= 4) {
    sectionTitles[0].textContent = 'Identity & Origin';
    sectionTitles[1].textContent = 'Voice & Constraint';
    sectionTitles[2].textContent = 'Memory & Models';
    sectionTitles[3].textContent = 'Lock Status';
  }

  // Force all sections open
  document.querySelectorAll('.forge-section').forEach(s => s.classList.add('open'));

  showPanel('view-forge');
  showToast('◈ Fill the forge');
}

function closeIEForge(){
  document.getElementById('forge-container').dataset.ieId = '';
  document.getElementById('forge-container').dataset.isIE = 'false';
  
  // Reset persona role visibility
  const personaRoleParent = document.getElementById('forge-persona-role').parentElement;
  if (personaRoleParent) personaRoleParent.style.display = '';
  
  // Reset temperature to visible, model section hidden
  const tempSection = document.getElementById('forge-temp').closest('.forge-input-group');
  const modelSection = document.getElementById('forge-model-section');
  if (tempSection) tempSection.style.display = '';
  if (modelSection) modelSection.style.display = 'none';
  
  // Reset temperature to range
  const tempInput = document.getElementById('forge-temp');
  tempInput.type = 'range';
  tempInput.min = '0';
  tempInput.max = '2';
  tempInput.step = '0.1';
  tempInput.value = '1';
  document.getElementById('forge-temp-val').textContent = '1.0';
  
  // Reset labels
  const sectionTitles = document.querySelectorAll('.forge-section-title');
  if (sectionTitles.length >= 4) {
    sectionTitles[0].textContent = 'Identity & Backstory';
    sectionTitles[1].textContent = 'Personality & Core';
    sectionTitles[2].textContent = 'Lore & World';
    sectionTitles[3].textContent = 'Dynamics & Presence';
  }
  
  showPanel('view-ie');
  renderIEList(document.getElementById('ie-search-input')?.value || '');
}

async function devQuickLock(id){
  if(!confirm('Lock this entity? This simulates the full Lock Ceremony. Signature will be a dev placeholder.')) return;
  
  const entity = await getImmutableEntity(id);
  if(!entity) return;
  
  const updated = {
    ...entity,
    locked_at: Date.now(),
    signature: 'dev_signature_' + Date.now(),
    // Generate a simple SVG sigil if none exists
    sigil_svg: entity.sigil_svg || `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="15" fill="none" stroke="#c8a050" stroke-width="1.5"/><circle cx="18" cy="18" r="4" fill="#c8a050" opacity="0.6"/></svg>`,
    updated_at: Date.now()
  };
  // Before saveImmutableEntity(updated), add:
if (!updated.model_variants || updated.model_variants === '[]' || (Array.isArray(updated.model_variants) && updated.model_variants.length === 0)) {
  updated.model_variants = JSON.stringify([
    {model_id: 'google/gemini-2.5-flash-lite'},
    {model_id: 'deepseek/deepseek-v4-flash'}
  ]);
}
  await saveImmutableEntity(updated);
  renderIEList(document.getElementById('ie-search-input')?.value || '');
  showToast('◆ Entity Locked -- threshold crossed');
}

async function devUnlockIE(id){
  const entity = await dbGet('immutable_entities', id);
  if(!entity) return;
  
  if(!entity.locked_at){
    showToast('Already unlocked');
    return;
  }
  
  if(!confirm('DEV: Unlock this entity for editing?')) return;
  
  await dbPut('immutable_entities', {...entity, locked_at: null, signature: null});
  renderIEList();
  showToast('◈ Unlocked for editing');
}

/* FOLDERS */
const getFolders=()=>dbGetAll("cosm_folders");
async function createFolder(name,parent_id=null){const id="f_"+Date.now();await dbPut("cosm_folders",{id,name,parent_id,created_at:Date.now()});return id;}

async function countFolderContents(id){
  let discourses=0,sparks=0,folders=0;
  const ds=await dbGetByIndex("cosm_discourses","folder_id",id);
  discourses+=ds.filter(d=>!d.isDeleted&&d.item_type!=='note').length;
  sparks+=ds.filter(d=>!d.isDeleted&&d.item_type==='note').length;
  const cf=(await dbGetAll("cosm_folders")).filter(f=>f.parent_id===id&&!f.isDeleted);
  folders+=cf.length;
  for(const child of cf){
    const childCount=await countFolderContents(child.id);
    discourses+=childCount.discourses;
    sparks+=childCount.sparks;
    folders+=childCount.folders;
  }
  return{discourses,sparks,folders};
}

async function deleteFolderRecursive(id){
  const ds=await dbGetByIndex("cosm_discourses","folder_id",id);
  for(const d of ds)if(!d.isDeleted)await deleteDiscourse(d.id);
  const cf=(await dbGetAll("cosm_folders")).filter(f=>f.parent_id===id);
  for(const child of cf)await deleteFolderRecursive(child.id);
  await dbDelete("cosm_folders",id);
}

async function deleteFolder(id){
  const counts=await countFolderContents(id);
  const folder=await dbGet("cosm_folders",id);
  const name=folder?.name||'this folder';
  const parts=[];
  if(counts.folders>0)parts.push(`${counts.folders} folder${counts.folders>1?'s':''}`);
  if(counts.discourses>0)parts.push(`${counts.discourses} discourse${counts.discourses>1?'s':''}`);
  if(counts.sparks>0)parts.push(`${counts.sparks} spark${counts.sparks>1?'s':''}`);
  const summary=parts.length?` and ${parts.join(', ')} inside`:'';
  if(!confirm(`Burn "${name}"${summary} to the Void?`))return false;
  await deleteFolderRecursive(id);
  return true;
}

/* DISCOURSES */
async function getDiscourses(){const a=await dbGetAll("cosm_discourses");return a.filter(d=>!d.isDeleted).sort((a,b)=>b.updated_at-a.updated_at);}

async function updateGravity(id, delta) {
  try {
    const disc = await getDiscourse(id);
    if (!disc) return;
    const next = Math.max(0, (disc.gravity || 0) + delta);
    await updateDiscourse(id, { gravity: next });
  } catch(e) { console.warn('gravity update failed', e); }
}

async function toggleFavourite(id) {
  try {
    const disc = await getDiscourse(id);
    if (!disc) return;
    const next = disc.is_favourite ? 0 : 1;
    await updateDiscourse(id, { is_favourite: next });
    return next;
  } catch(e) { console.warn('favourite toggle failed', e); }
}

// Decay pass -- run once per day, -1 gravity per 7 days untouched
async function runGravityDecay() {
  const lastDecay = parseInt(localStorage.getItem('nq_last_decay') || '0');
  const now = Date.now();
  if (now - lastDecay < 86400000) return;
  const sevenDaysAgo = now - (7 * 86400000);
  try {
    const all = await dbGetAll('cosm_discourses');
    for (const d of all) {
      if (d.isDeleted) continue;
      const touch = d.updated_at || d.created_at || 0;
      if (touch >= sevenDaysAgo) continue;
      if (d.is_favourite) continue;
      const g = Math.max(0, (d.gravity || 0) - 1);
      if (g !== (d.gravity || 0)) await updateDiscourse(d.id, { gravity: g });
    }
    localStorage.setItem('nq_last_decay', now.toString());
  } catch(e) { console.warn('decay pass failed', e.message, e); }
}

async function getDeletedDiscourses(){const a=await dbGetAll("cosm_discourses");return a.filter(d=>d.isDeleted).sort((a,b)=>b.deleted_at-a.deleted_at);}
const getDiscourse=id=>dbGet("cosm_discourses",id);

async function createDiscourse({title="Untitled Discourse", raw_text="", folder_id=null, source_link=null, item_type="discourse"}={}) {
  const id = "d_" + Date.now();
  const now = Date.now();
  
  // Strict normalization
  const finalFolderId = (!folder_id || folder_id === 'root') ? null : folder_id;
  
  const disc = {
    id, title, raw_text, folder_id: finalFolderId, source_link,
    created_at: now, updated_at: now, item_type
  };
  
  await dbPut("cosm_discourses", disc);
  return disc;
}

async function updateDiscourse(id,updates){const disc=await getDiscourse(id);if(!disc)return;const u={...disc,...updates,updated_at:Date.now()};await dbPut("cosm_discourses",u);return u;}
async function deleteDiscourse(id){const d=await getDiscourse(id);if(!d)return;await dbPut("cosm_discourses",{...d,isDeleted:true,deleted_at:Date.now()});}

async function purgeDiscourse(id){await dbDelete("cosm_discourses",id);if(isWatcherReady) pruneWatcherDiscourse(id);const t=await dbGetByIndex("cosm_mosaic_tiles","discourse_id",id);for(const x of t)await dbDelete("cosm_mosaic_tiles",x.id);const b=await dbGetByIndex("cosm_backlinks","discourse_id",id);for(const x of b)await dbDelete("cosm_backlinks",x.id);}

/* VOID ENTROPY */
function applyVoidEntropy(rawText, deletedAt) {
  if (!rawText || !deletedAt) return rawText;
  const daysInVoid = (Date.now() - deletedAt) / 86400000; // 86400000 ms = 1 day
  if (daysInVoid <= 7) return rawText; // 7-day grace period

  // Starts at 5% decay on day 8, caps at 85% so a skeleton always remains
  const decayRate = Math.min((daysInVoid - 7) * 0.05, 0.85);

  // Targets words but leaves punctuation and line breaks intact
  return rawText.replace(/\b(\w+)\b/g, (match) => {
    return Math.random() < decayRate ? '░░░' : match;
  });
}

async function restoreDiscourse(id) {
  const d = await getDiscourse(id);
  if (!d) return;
  
// The Abyss takes its tax on the body AND the title
  const decayedText = applyVoidEntropy(d.raw_text || "", d.deleted_at);
  const decayedTitle = applyVoidEntropy(d.title || "Untitled", d.deleted_at);
  
  const { isDeleted, deleted_at, ...rest } = d;
  
  await dbPut("cosm_discourses", { ...rest, title: decayedTitle, raw_text: decayedText, updated_at: Date.now() });
}

/* CHARACTERS */
const getCharacters=()=>dbGetAll("characters");
const getCharacter=id=>dbGet("characters",id);

async function createCharacter(data={}){const id="c_"+Date.now(),now=Date.now(),char={id,name:"New Character",role:"",backstory:"",personality:"",lorebook:"",scenario:"",inclination:"",relationships:"",pc_info:"",temperature:1,created_at:now,updated_at:now,...data};await dbPut("characters",char);return char;}

async function updateCharacter(id,updates){const char=await getCharacter(id);if(!char)return;const u={...char,...updates,updated_at:Date.now()};await dbPut("characters",u);return u;}

async function deleteCharacter(id){
  const c = await getCharacter(id);
  if (!c) return;
  await deleteAllCharacterPhotos(id);
  await dbPut("characters", {...c, isDeleted:true, deleted_at:Date.now()});
}

const purgeCharacter=id=>dbDelete("characters",id);
async function restoreCharacter(id){const c=await getCharacter(id);if(!c)return;const{isDeleted,deleted_at,...rest}=c;await dbPut("characters",{...rest,updated_at:Date.now()});}

async function getDeletedCharacters(){const a=await dbGetAll("characters");return a.filter(c=>c.isDeleted).sort((a,b)=>b.deleted_at-a.deleted_at);}

/* MOSAIC */
async function getMosaicTile(dId){if(mosaicCache[dId]!==undefined)return mosaicCache[dId];const t=await dbGetByIndex("cosm_mosaic_tiles","discourse_id",dId);if(!t.length){mosaicCache[dId]=null;return null;}t.sort((a,b)=>b.created_at-a.created_at);mosaicCache[dId]=t[0];return t[0];}

async function saveMosaicTile(dId,anchors){const e=await getMosaicTile(dId);if(e)await dbDelete("cosm_mosaic_tiles",e.id);const id="m_"+Date.now(),tile={id,discourse_id:dId,anchors,created_at:Date.now()};await dbPut("cosm_mosaic_tiles",tile);mosaicCache[dId]=tile;}

async function deleteMosaicTile(dId){const t=await getMosaicTile(dId);if(t)await dbDelete("cosm_mosaic_tiles",t.id);mosaicCache[dId]=null;}

async function getBacklink(dId){const l=await dbGetByIndex("cosm_backlinks","discourse_id",dId);return l.length>0?l[0]:null;}

/* ENGRAM — Sanctuary chats → Soup (modal: #burn-disc-modal; confirm: confirmBurnDisc) */
async function openBurnDiscModal(){
  const chars=await getCharacters();
  const active=chars.filter(c=>!c.isDeleted);
  if(!active.length){showToast("No characters in Sanctuary ◆");return;}
  const charSel=document.getElementById('burn-char-select');
  charSel.innerHTML='<option value="">-- Choose character --</option>';
  active.forEach(c=>{
    const o=document.createElement('option');
    o.value=c.id;o.textContent=c.name;
    if(c.id===activeCharId)o.selected=true;
    charSel.appendChild(o);
  });
  const folders=await getFolders();
  const folderSel=document.getElementById('burn-folder-select');
  folderSel.innerHTML='<option value="">Use character name as folder ◆</option>';
  folders.forEach(f=>{
    const o=document.createElement('option');
    o.value=f.id;o.textContent=f.name;
    folderSel.appendChild(o);
  });
  document.getElementById('burn-disc-modal').classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
}

async function confirmBurnDisc(){
  const charId=document.getElementById('burn-char-select').value;
  if(!charId){showToast("Choose a character first ◆");return;}
  const char=await getCharacter(charId);
  const history=await dbGetByIndex('history','charId',charId);
  if(!history.length){showToast("No chapters to Engram ◆");return;}
  const lastBurn=parseInt(localStorage.getItem('lastBurn_'+charId)||'0');
  const newMessages=history.filter(h=>(h.created_at||0)>lastBurn);
  if(!newMessages.length){
    showToast("No new chapters since last Engram ◆");
    closeOverlay();return;
  }
  const raw_text=newMessages.map(h=>
    `**${h.role==='user'?'You':char.name}:** ${h.content}`
  ).join('\n\n');
  let folderId=document.getElementById('burn-folder-select').value||null;
  if(!folderId){
    const existing=(await getFolders()).find(f=>f.name===char.name);
    folderId=existing?existing.id:await createFolder(char.name,null);
  }
  const date=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const title=`${char.name} -- ${date}`;
  
  // 1. Await the creation
  const engramDisc = await createDiscourse({title,raw_text,folder_id:folderId});
if (isWatcherReady && engramDisc) queueWatcherEmbed(engramDisc.id, title, raw_text, 'discourse');
  
  // 2. Update the burn marker
  localStorage.setItem('lastBurn_'+charId,Date.now().toString());
  
  // 3. Close the modal
  closeOverlay();
renderDefaultBar(currentMode); // Force pill return
  
  // 4. THE FIX: Force the active view to re-render immediately
  if (currentMode === 'soup') {
      await renderTableView();
  } else if (currentMode === 'sanctuary') {
      await renderSanctuaryView();
  }
  
  showToast(`⌬ Engramed -- ${newMessages.length} chapters`);
}

/* PERSONA FUNCTIONS */
async function openPersonaView(){
  const p=getGlobalPersona();
  document.getElementById('persona-bio').value=p.bio||'';
  document.getElementById('persona-personality').value=p.personality||'';
  renderRoles();
  showPanel('view-persona');
}

function renderRoles(){
  const surface=document.getElementById('roles-surface');
  surface.innerHTML='';
  const roles=getPersonaRoles();
  if(!roles.length){
    surface.innerHTML='<div style="font-size:12px;color:var(--muted);padding:12px 0;">No roles yet. Create one.</div>';
    return;
  }
  roles.forEach(r=>{
    const div=document.createElement('div');
    div.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;';
    div.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="role-chip-title" style="font-size:12px;font-weight:900;">${escHtml(r.name)}</span>
        <button onclick="deleteRole('${r.id}')" style="background:none;border:1px solid var(--danger);color:#ff6060;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:700;">✕</button>
      </div>
      <div style="font-size:13px;color:var(--text);font-family:Georgia,serif;line-height:1.6;">${escHtml(r.description)}</div>
    `;
    surface.appendChild(div);
  });
}

function deleteRole(id){
  const roles=getPersonaRoles().filter(r=>r.id!==id);
  savePersonaRoles(roles);
  renderRoles();
  showToast('Role removed ◆');
}

function addNewRole(){
  document.getElementById('role-name-input').value='';
  document.getElementById('role-desc-input').value='';
  document.getElementById('role-modal').classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
}

function confirmAddRole(){
  const name=document.getElementById('role-name-input').value.trim();
  const description=document.getElementById('role-desc-input').value.trim();
  if(!name||!description){showToast('Fill both fields ◆');return;}
  const roles=getPersonaRoles();
  roles.push({id:'r_'+Date.now(),name,description});
  savePersonaRoles(roles);
  renderRoles();
  closeOverlay();
  showToast('Role anchored ◆');
}

function savePersonaPage(){
  const bio=document.getElementById('persona-bio').value.trim();
  const personality=document.getElementById('persona-personality').value.trim();
  saveGlobalPersona(bio,personality);
  showToast('Persona solidified ◆');
}

/* BOTTOM BAR */
function showBottomBar(pills){
  const scroll=document.getElementById('bottom-bar-scroll');
  scroll.innerHTML='';
  pills.forEach(p=>{
    const div=document.createElement('div');
    div.className='bar-pill'+(p.style?' '+p.style:'');
    div.innerHTML=`<span class="bar-pill-icon">${p.icon}</span><span class="bar-pill-label">${p.label}</span>`;
    div.addEventListener('click',p.action);
    scroll.appendChild(div);
  });
  document.getElementById('bottom-bar').classList.add('visible');
}

function hideBottomBar(){
  document.getElementById('bottom-bar').classList.remove('visible');
}

let bottomBarHideTimer=null;

function resetBottomBarTimer(){
  if(currentMode!=='soup') return;
  if(bottomBarHideTimer) clearTimeout(bottomBarHideTimer);
  document.getElementById('bottom-bar').classList.add('visible');
  bottomBarHideTimer=setTimeout(()=>{
    document.getElementById('bottom-bar').classList.remove('visible');
  }, 8000); // 8 seconds of inactivity
}
// Modify showBottomBar to also reset the timer
const _origShowBottomBar=showBottomBar;
showBottomBar=function(pills){
  _origShowBottomBar(pills);
  resetBottomBarTimer();
};


function renderDefaultBar(mode) {
  if (mode === 'soup') {
        showBottomBar([
      { icon: '▤', label: 'Folder', action: () => openFolderModal() },
      { icon: '⌇', label: 'Spark', action: () => openQuickCapture() },
      { icon: '◎', label: 'Chronicle', action: () => handleNewChronicle() },
      { icon: '⌬', label: 'Engram', action: () => openBurnDiscModal() }
    ]);
  } else {
    hideBottomBar(); // Sanctuary -- no bottom bar
  }
}

function enterSelectMode(item){
  selectMode=true;
  if(!selectedItems) selectedItems=new Set();
  if(item&&item.id) selectedItems.add(item.id);
    // Save scroll positions before re-render
  const scrollPositions = new Map();
  document.querySelectorAll('.section-scroll-wrap').forEach((el, i) => {
    scrollPositions.set(i, el.scrollLeft);
  });

  if(currentMode=='soup'){
    renderTableView().then(()=>{
      renderSelectBar();
      // Restore scroll positions after re-render
      document.querySelectorAll('.section-scroll-wrap').forEach((el, i) => {
        if(scrollPositions.has(i)) el.scrollLeft = scrollPositions.get(i);
      });
    });
  } else {
    renderSanctuaryView().then(()=>renderSelectBar());
  }
}

function renderSelectBar(){
  const count=selectedItems.size;
  const hasFolder=[...selectedItems].some(id=>id.startsWith('f_'));
  
  if(count===0){
    exitSelectMode();
    return;
  }

  if(currentMode==='sanctuary'){
    if(count===1){
      const id=[...selectedItems][0];
      showBottomBar([
        {icon:'✎',label:'Rename',action:()=>{exitSelectMode();openRenameForChar(id);}},
        {icon:'✕',label:'Burn',action:()=>batchDelete(),style:'danger'},
        {icon:'✗',label:'Cancel',action:()=>exitSelectMode()},
      ]);
    } else {
      showBottomBar([
        {icon:`${count}`,label:'Selected',action:()=>{}},
        {icon:'✕',label:'Burn',action:()=>batchDelete(),style:'danger'},
        {icon:'✗',label:'Cancel',action:()=>exitSelectMode()},
      ]);
    }
    return;
  }

    if(count===1){
    const id=[...selectedItems][0];
    const isDiscourse=id.startsWith('d_')||id.startsWith('n_');
    const isFolder=id.startsWith('f_');
    const pills=[
      {icon:'✎',label:'Rename',action:()=>{exitSelectMode();openRenameForItem(id);}},
    ];
    if(!isFolder){
      pills.push({icon:'▤',label:'Move',action:()=>batchMove()});
    }
    if(isDiscourse){
      pills.push({icon:'↓',label:'Export',action:()=>{exitSelectMode();exportDiscourseHTML(id);}});
    }
    pills.push({icon:'✕',label:'Burn',action:()=>batchDelete(),style:'danger'});
    pills.push({icon:'✗',label:'Cancel',action:()=>exitSelectMode()});
    showBottomBar(pills);
  } else {
    const pills=[
      {icon:`${count}`,label:'Selected',action:()=>{}},
      {icon:'▤',label:'Move',action:()=>batchMove()},
      {icon:'✕',label:'Burn',action:()=>batchDelete(),style:'danger'},
      {icon:'✗',label:'Cancel',action:()=>exitSelectMode()},
    ];
    showBottomBar(pills);
  }
}

function openRenameForItem(id){
  // check if it's a folder first
  if(id.startsWith('f_')){
    dbGet("cosm_folders", id).then(f=>{
      if(f){
        document.getElementById("rename-title").textContent='Rename Folder';
        document.getElementById("rename-input").value=f.name||'';
        document.getElementById("rename-modal").classList.add("visible");
        document.getElementById("cosm-overlay").classList.add("active");
        document.getElementById("rename-input").dataset.renameId=id;
        document.getElementById("rename-input").dataset.renameType='folder';
        setTimeout(()=>document.getElementById("rename-input").focus(),100);
      }
    });
    return;
  }
  // discourse or note
  dbGetAll("cosm_discourses").then(discs=>{
    const d=discs.find(x=>x.id===id);
    if(d){
      document.getElementById("rename-title").textContent='Rename Discourse';
      document.getElementById("rename-input").value=d.title||'';
      document.getElementById("rename-modal").classList.add("visible");
      document.getElementById("cosm-overlay").classList.add("active");
      document.getElementById("rename-input").dataset.renameId=id;
      document.getElementById("rename-input").dataset.renameType='discourse';
      setTimeout(()=>document.getElementById("rename-input").focus(),100);
    }
  });
}

function openRenameForChar(id){
  getCharacter(id).then(c=>{
    if(c){
      document.getElementById("rename-title").textContent='Rename Character';
      document.getElementById("rename-input").value=c.name||'';
      document.getElementById("rename-modal").classList.add("visible");
      document.getElementById("cosm-overlay").classList.add("active");
      document.getElementById("rename-input").dataset.renameId=id;
      document.getElementById("rename-input").dataset.renameType='character';
      setTimeout(()=>document.getElementById("rename-input").focus(),100);
    }
  });
}

function exitSelectMode(){
  selectMode=false;
  selectedItems=new Set();
  if(currentMode==='soup') renderTableView();
  else renderSanctuaryView();
  renderDefaultBar(currentMode);
}

function toggleSelectItem(id){
  if(selectedItems.has(id))selectedItems.delete(id);
  else selectedItems.add(id);
  if(selectedItems.size===0){exitSelectMode();return;}
  renderSelectBar();
  if(currentMode==='soup') renderTableView();
  else renderSanctuaryView();
}

async function batchDelete(){
  if(!selectedItems.size)return;
  if(!confirm(`Burn ${selectedItems.size} item(s) to Void?`))return;
  const allD=await getDiscourses();
  const allF=await getFolders();
  const allC=await getCharacters();
  for(const id of selectedItems){
    if(allD.find(d=>d.id===id))await deleteDiscourse(id);
    else if(allF.find(f=>f.id===id)){const deleted=await deleteFolder(id);if(!deleted)return;
}
    else if(allC.find(c=>c.id===id))await deleteCharacter(id);
  }
  exitSelectMode();
  showToast(`Moved to Void ◌`);
  if(currentMode==='soup') await renderTableView();
  else await renderSanctuaryView();
}

async function batchMove(){
  if(!selectedItems.size)return;
  const folders=await getFolders();
  const sel=document.getElementById('move-parent-select');
  sel.innerHTML='<option value="">The Soup</option>';
  folders.forEach(f=>{
    const o=document.createElement('option');
    o.value=f.id;o.textContent=f.name;
    sel.appendChild(o);
  });
  document.getElementById('move-modal').classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
}

async function confirmBatchMove(){
  const folderId=document.getElementById('move-parent-select').value||null;
  const destParent = folderId || null;
  const ids = [...selectedItems];
  let moved = 0;
  for(const id of ids){
    const disc = await getDiscourse(id);
    if(disc){
      await updateDiscourse(id,{folder_id:destParent});
      moved++;
      continue;
    }
    const folder = await dbGet('cosm_folders', id);
    if(folder){
      await dbPut('cosm_folders',{...folder,parent_id:destParent,updated_at:Date.now()});
      moved++;
    }
  }
  closeOverlay();
  exitSelectMode();
  showToast(moved ? `Moved ${moved} item(s) ◆` : 'Nothing moved');
  if(currentMode==='soup') await renderTableView();
  else await renderSanctuaryView();
}

async function batchBurn(){
  if(!selectedItems.size)return;
  await openBurnDiscModal();
}

let wTapTimer=null;
const wEl=document.getElementById('nq-wordmark');

wEl.addEventListener('touchstart',()=>{
  wEl.classList.add('pressing');
},{passive:true});

wEl.addEventListener('touchend',()=>{
  wEl.classList.remove('pressing');
  wTapTimer=setTimeout(()=>{
    goHome();
  },50);
});

wEl.addEventListener('touchmove',()=>{
  wEl.classList.remove('pressing');
  clearTimeout(wTapTimer);
  wTapTimer=null;
});

function dismissModeToast() {
  if (modeToastTimer) {
    clearTimeout(modeToastTimer);
    modeToastTimer = null;
  }
  const mt = document.getElementById('mode-toast');
  if (mt) mt.style.opacity = '0';
}

/** Realm pill: only on main Soup grid; never after navigating to Sanctuary/chat/etc. */
function flashModeToastForSoupGrid(text, durationMs) {
  dismissModeToast();
  const mt = document.getElementById('mode-toast');
  if (!mt) return;
  if (currentMode !== 'soup' || currentView !== 'soup') return;
  mt.textContent = text;
  mt.style.opacity = '1';
  modeToastTimer = setTimeout(() => {
    modeToastTimer = null;
    if (currentMode !== 'soup' || currentView !== 'soup') {
      mt.style.opacity = '0';
      return;
    }
    mt.style.opacity = '0';
  }, durationMs);
}

function goHome(){
    if(currentMode==='soup'){
    breadcrumbPath=[{id:null,name:'◈ The Soup'}];
    currentFolderId=null;
    deepSoupFolderId=null;
    showPanel('view-soup');
    renderTableView();
    flashModeToastForSoupGrid('◈ HOME', 1200);
  } else {
    dismissModeToast();
    showPanel('view-sanctuary');
    renderSanctuaryView();
  }
}

/* APP MODE */
function switchAppMode(mode){
  currentMode=mode;
  if(mode==='soup'){
    showPanel('view-soup');
    void renderTableView();
    flashModeToastForSoupGrid('◈ THE SOUP', 1500);
  } else {
    dismissModeToast();
    showPanel('view-sanctuary');
    renderSanctuaryView();
  }
  renderDefaultBar(mode);
}

/* SHOW PANEL (Unifying logic) */
function syncNqHeaderForCurrentPanel(activePanelId) {
  const hdr = document.getElementById('nq-header') || document.querySelector('.nq-header');
  const onSanctuaryPanel = activePanelId === 'view-sanctuary';
  const realmSanctuary = onSanctuaryPanel && currentMode === 'sanctuary';
  if (hdr) hdr.classList.toggle('nq-header--sanctuary-realm', onSanctuaryPanel);
  const wm = document.getElementById('nq-wordmark');
  if (wm) {
    wm.classList.toggle('nq-wordmark--sanctuary-realm', realmSanctuary);
    wm.textContent = realmSanctuary ? 'The Sanctuary' : 'NakedQuantum';
  }
  updateHeaderButtons();
}

/** Maps visible panel + `currentMode` to `<html data-realm="…">` for global hooks / future CSS. */
function syncDataRealmFromPanel(activePanelId) {
  let realm;
  switch (activePanelId) {
    case 'view-lighthouse':
      realm = 'lighthouse';
      break;
    case 'view-abyss':
      realm = 'abyss';
      break;
    case 'view-deep-soup':
      realm = 'deep-soup';
      break;
    case 'view-data':
      realm = 'data';
      break;
    case 'view-guardian':
      realm = 'guardian';
      break;
    case 'view-soup':
      realm = 'soup';
      break;
    case 'view-sanctuary':
    case 'view-forge':
    case 'view-chat':
    case 'view-memory':
    case 'view-persona':
    case 'view-ie':
      realm = currentMode === 'sanctuary' ? 'sanctuary' : 'soup';
      break;
    default:
      realm = 'soup';
  }
  document.documentElement.dataset.realm = realm;
}

function showPanel(id){
    abyssStop();
  /* Leaving (or re-entering) realms: always collapse Abyss sheet — a stale `.open` sheet
     kept pointer-events:auto and blocked the canvas on the next visit. */
  abyssCloseSheet();
  const wasSoup = (currentView === 'soup');
  const wasSanctuary = (currentView === 'sanctuary');
  const panels = [
   'view-soup', 'view-sanctuary', 'view-abyss', 'view-deep-soup', 'view-data',
  'view-lighthouse', 'view-forge', 'view-chat', 'view-memory', 
  'view-persona', 'view-guardian', 'view-ie'
];

  // ── GUARDIAN EXIT: free Cartographer, revive Watcher after delay ──
  if (id !== 'view-guardian' && currentView === 'guardian') {
    unloadDeepMapper();
    // Revive Watcher after Safari has a moment to free Cartographer's WASM
    setTimeout(() => {
            if (!isWatcherReady && !watcherEmbedder && watcherDB) {
        initWatcher();
      }
    }, 800);
  }
  
  // ── GUARDIAN ENTRY: immediately exile Watcher, suppress Cartographer lazy load ──
  if (id === 'view-guardian') {
    if (watcherEmbedder) {
      try { 
        let oldWatcher = watcherEmbedder;
        watcherEmbedder = null;
        isWatcherReady = false;
        // Asynchronous disposal prevents UI thread stutter and allows clean memory unmapping
        Promise.resolve().then(() => oldWatcher.dispose()).catch(()=>{}); 
      } catch(e){}
    }
    // Prevent Cartographer from loading for 1.5 seconds so Safari GC can breathe
    deepMapperLoadSuppressed = true;
    if (deepMapperSuppressTimer) clearTimeout(deepMapperSuppressTimer);
    deepMapperSuppressTimer = setTimeout(() => {
      deepMapperLoadSuppressed = false;
    }, 1500);
  }
  
  panels.forEach(p=>{
    const el=document.getElementById(p);
    if(el){ el.classList.add('hidden'); el.classList.remove('slide-back'); }
  });
  const active=document.getElementById(id);
  if(active)active.classList.remove('hidden');
  currentView=id.replace('view-','');
  if (id !== 'view-soup') dismissModeToast();
  syncDataRealmFromPanel(id);

  if (id === 'view-soup' || wasSoup) {
    closeSoupDrawer();
    resetSoupSearchChrome();
  }
  if (id === 'view-sanctuary' || wasSanctuary) {
    closeSanctuaryDrawer();
    resetSanctuarySearchChrome();
  }
  if (wasSoup && id !== 'view-soup') void renderTableView();
  
    if(id==='view-soup'){renderDefaultBar('soup');}
  else if(id==='view-sanctuary'){renderDefaultBar('sanctuary');}
  else{hideBottomBar();}
  
  // Realms that carry their own top chrome — hide global wordmark row
  const header = document.getElementById('nq-header') || document.querySelector('.nq-header');
  const edgeGlow = document.getElementById('guardian-edge-glow');
  const hideGlobalHeader = (id === 'view-guardian' || id === 'view-chat' || id === 'view-abyss' || id === 'view-deep-soup'
    || id === 'view-ie' || id === 'view-forge' || id === 'view-persona' || id === 'view-memory');
  if (hideGlobalHeader) {
    if (header) {
      header.style.display = 'none';
      header.classList.remove('nq-header--sanctuary-realm');
    }
    if (id === 'view-guardian' && edgeGlow) edgeGlow.classList.add('active');
    } else {
    if (header) {
      header.style.display = '';
      header.style.transform = '';
      header.style.marginBottom = '';
    }
    if (edgeGlow) edgeGlow.classList.remove('active');
    syncNqHeaderForCurrentPanel(id);
  }

  if (id !== 'view-soup') {
    if (guardianSoupInvokeScheduleTimer) {
      clearTimeout(guardianSoupInvokeScheduleTimer);
      guardianSoupInvokeScheduleTimer = null;
    }
    hideGuardianInvokeStripOnly();
  }

  if (typeof firefly !== 'undefined' && firefly.setSoupActive) {
    firefly.setSoupActive(id === 'view-soup');
    if (id === 'view-soup') {
      firefly.sd(id === 'view-lighthouse' || id === 'view-chat' ? 80 : 20);
    }
  }

  // Undo horizontal drift / stuck scroll from nested views (e.g. Data → Sanctuary)
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    const host = document.querySelector('.view-host');
    if (host) { host.scrollLeft = 0; host.scrollTop = 0; }
    if (id === 'view-soup' || id === 'view-sanctuary' || id === 'view-data') {
      if (active) { active.scrollLeft = 0; active.scrollTop = 0; }
    }
    if (id !== 'view-data') {
      const dps = document.getElementById('data-page-scroll');
      if (dps) { dps.scrollLeft = 0; dps.scrollTop = 0; }
    }
    if (id === 'view-sanctuary') {
      const ss = document.getElementById('sanctuary-surface');
      if (ss) { ss.scrollLeft = 0; ss.scrollTop = 0; }
    }
  });

  if (id === 'view-sanctuary') startSanctuaryRealm();
  else stopSanctuaryRealm();

  syncWatcherLedStrip();
  if (id === 'view-soup' && isWatcherReady) {
    processWatcherQueue();
    scheduleWatcherPass();
  }

  if (id === 'view-soup') {
    if (guardianSoupInvokeScheduleTimer) clearTimeout(guardianSoupInvokeScheduleTimer);
    guardianSoupInvokeScheduleTimer = setTimeout(function () {
      guardianSoupInvokeScheduleTimer = null;
      void checkAndShowGuardianInvoke();
    }, 3000);
  }
}

/* HEADER BUTTONS */
function updateHeaderButtons(){
  const c=document.getElementById('header-actions');
  if(!c) return;
  c.className = 'header-actions';
  if (currentMode === 'soup') {
    c.innerHTML=
      '<button class="hdr-btn" id="hdr-sanctuary" title="The Sanctuary">&#8962;</button>'+
      '<button class="hdr-btn" id="hdr-guardian" style="font-size:20px;">&#43065;</button>'+
      '<button class="hdr-btn" id="hdr-abyss" title="Abyss">&#9689;</button>'+
      '<button class="hdr-btn" id="hdr-deep-soup" title="Deep Soup">꩜</button>'+
      '<button class="hdr-btn" id="hdr-soup-menu" style="font-size:22px;line-height:1;padding-bottom:2px;" aria-label="Soup menu" aria-expanded="false" aria-controls="soup-drawer-panel">⋯</button>';
    document.getElementById('hdr-guardian').onclick=function(){ openGuardianView({ fromHeader: true }); };
    document.getElementById('hdr-sanctuary').onclick=function(){ switchAppMode('sanctuary'); };
    document.getElementById('hdr-abyss').onclick=function(){ openAbyssView(); };
    document.getElementById('hdr-deep-soup').onclick=function(){ openDeepSoupView(); };
    document.getElementById('hdr-soup-menu').onclick=function(){
      const d = document.getElementById('soup-drawer');
      if (d && d.classList.contains('open')) closeSoupDrawer();
      else openSoupDrawer();
    };
  } else if (currentMode === 'sanctuary' && currentView === 'sanctuary') {
    c.className = 'header-actions header-actions-sanctuary';
    c.innerHTML =
      '<button type="button" class="hdr-btn" id="hdr-sanctuary-home" title="Back to Soup" aria-label="Back to Soup">⌂</button>' +
      '<button type="button" class="hdr-btn" id="hdr-sanctuary-menu" style="font-size:22px;line-height:1;padding-bottom:2px;" aria-label="Sanctuary menu" aria-expanded="false" aria-controls="sanctuary-drawer-panel">⋯</button>';
    document.getElementById('hdr-sanctuary-home').onclick = function () {
      closeSanctuaryDrawer();
      switchAppMode('soup');
    };
    document.getElementById('hdr-sanctuary-menu').onclick = function () {
      const d = document.getElementById('sanctuary-drawer');
      if (d && d.classList.contains('open')) closeSanctuaryDrawer();
      else openSanctuaryDrawer();
    };
  } else {
    c.innerHTML = '';
  }
}

async function goBack() {
const hdr = document.querySelector('.nq-header');
document.getElementById('guardian-footer').classList.remove('visible');
hdr.style.transform = 'translateY(0)';
hdr.style.marginBottom = '0';
removeLineageThread();
currentFocusId = null;
focusChain = [];
  if (currentView === 'lighthouse' && currentDiscourseId) {
    await saveCurrentDiscourse(true);
    mosaicCache = {};
  }
  if (!currentFolderId) currentFolderId = null; 
  if (currentMode === 'soup') { 
    showPanel('view-soup'); 
    await renderTableView(); 
  } else { 
    showPanel('view-sanctuary'); 
document.getElementById('btn-chat-edit').style.display = '';
activeIE = null;
    renderSanctuaryView(); 
  }
}

async function renderTableView() {
  const surface = document.getElementById('table-surface');
  if (!surface) return;
  surface.onclick = (e) => { if(e.target===surface && selectMode) exitSelectMode(); };
    surface.innerHTML = '';
  removeLineageThread();
  currentFocusId = null;
  focusChain = [];
  surface.onclick = (e) => {
    if(!e.target.closest('.nq-card')) void unfocusMesh();
  };
  runGravityDecay();
    await renderBreadcrumb();
  // Remove old drop line -- renderBreadcrumb redraws it
  const oldDrop = document.getElementById('bc-drop-svg');
  if(oldDrop) oldDrop.remove();
  const safeMatch = (a, b) => {
    const isANull = (!a || String(a)==='null' || String(a)==='root' || String(a)==='undefined');
    const isBNull = (!b || String(b)==='null' || String(b)==='root' || String(b)==='undefined');
    if(isANull && isBNull) return true;
    return String(a) === String(b);
  };

  const isAtRoot = (!currentFolderId || currentFolderId === 'root');
  const sw = document.getElementById('search-bar-wrap');
  if (sw) sw.style.display = soupLocalSearchOpen ? 'block' : 'none';

  const allF = (await getFolders()) || [];
  const allD = (await getDiscourses()) || [];
  const allFolders = allF;
  const allDiscs = allD;

  if(window.firefly) firefly.sd(allD.reduce((s,d) => s+(d.raw_text||'').length, 0));

  // ── ROOT: Dashboard mode ──────────────────────────────────────────────────
  if(isAtRoot) {
    // Folders -- 2 row horizontal scroll
    const activeFolders = [];
    for(const f of allF.filter(f => !f.isDeleted && safeMatch(f.parent_id, null))) {
      const vitality = await getFolderVitality(f.id, allFolders, allDiscs);
      const phase = vitality ? decayPhase(vitality) : decayPhase(f.created_at||0);
      if(phase === 'active' || phase === 'fading') activeFolders.push({...f, _phase: phase});
    }

        // Build unified mesh -- folders + all content together
    const meshGrid = document.createElement('div');
        meshGrid.className = 'cards-grid';
    meshGrid.id = 'soup-mesh';
    // Creation card -- anchored last in mesh (see appendChild after content)
    const createCard = document.createElement('div');
        createCard.className = 'nq-card nq-create-card';
    createCard.id = 'nq-create-card';
    createCard.dataset.fav = 999;
    createCard.dataset.gravity = 999;
    createCard.dataset.time = 999999999999999;
    createCard.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:6px;opacity:0.25;"><span style="font-size:28px;color:var(--accent);line-height:1;">+</span><span style="font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;">Create</span></div>`;
    createCard.addEventListener('click', () => openCreateMenu(createCard));

    // Folders first
    for(const f of activeFolders) {
      const dc = allD.filter(d => safeMatch(d.folder_id, f.id) && d.item_type !== 'note' && !d.isDeleted).length;
      const nc = allD.filter(d => safeMatch(d.folder_id, f.id) && d.item_type === 'note' && !d.isDeleted).length;
      const sc = allF.filter(sf => safeMatch(sf.parent_id, f.id) && !sf.isDeleted).length;
      const meta = [];
      if(dc > 0) meta.push(dc + (dc===1?' discourse':' discourses'));
      if(nc > 0) meta.push(nc + (nc===1?' spark':' sparks'));
      if(sc > 0) meta.push(sc + (sc===1?' folder':' folders'));
              // Count nested folders inside this folder
        const nestedCount = allF.filter(sf => safeMatch(sf.parent_id, f.id) && !sf.isDeleted).length;
        const isThick = nestedCount > 0;
        const card = document.createElement('div');
        card.className = 'nq-card card' + (f._phase==='fading'?' card-fading':'') + (isThick?' folder-thick':'');
               card.dataset.folderId = f.id;
        card.dataset.parentFolderId = f.parent_id || '';
        card.dataset.fav = f.is_favourite || 0;
        card.dataset.gravity = f.gravity || 0;
        card.dataset.time = f.updated_at || f.created_at || 0;
        if(typeof selectedItems !== 'undefined' && selectedItems.has(f.id)) card.classList.add('card-selected');
        card.innerHTML = `
          <div class="nq-card-head">
            <span class="nq-card-glyph">▤</span>
            <span class="nq-card-fav"></span>
          </div>
          <div class="nq-card-title">${escHtml(f.name)}</div>
          <div class="nq-card-foot">
            <span class="nq-card-date">${meta.length?meta.join(' · '):'Empty'}</span>
            ${isThick?`<span style="font-size:9px;color:var(--accent-dim);opacity:0.7;letter-spacing:0.5px;">${nestedCount} nested ↓</span>`:''}
          </div>`;
           card.onclick = () => {
        if(window.longPressConsumed){window.longPressConsumed=false;return;}
        if(typeof selectMode!=='undefined'&&selectMode){toggleSelectItem(f.id);return;}
                focusMeshCard(f.id, f.parent_id || null, f.name);
      };
      card.onmousedown = e => startLP(e, card, {type:'folder', id:f.id, name:f.name, data:f});
      card.ontouchstart = e => startLP(e, card, {type:'folder', id:f.id, name:f.name, data:f}, {passive:true});
      card.onmouseup = () => cancelLP(card);
      card.onmouseleave = () => cancelLP(card);
      card.ontouchend = () => cancelLP(card);
      meshGrid.appendChild(card);
    }

    surface.appendChild(meshGrid);

    // Recent sections helper -- 6 cards + lineage portal
    const RECENT_MAX = 6;

    async function renderRecentSection(label, items) {
      if(!items.length) return;
      const l = document.createElement('div'); l.className = 'cards-section-label'; l.textContent = label; surface.appendChild(l);
      const wrap = document.createElement('div'); wrap.className = 'section-scroll-wrap';
      const g = document.createElement('div'); g.className = 'section-grid single-row';

      const shown = items.slice(0, RECENT_MAX);
      const hasMore = items.length > RECENT_MAX;

      for(const d of shown) {
        const card = await buildDiscourseCard(d);
        if(d._phase==='fading') card.classList.add('card-fading');
        g.appendChild(card);
      }

      // 7th card -- lineage portal
      if(hasMore) {
        const portal = document.createElement('div');
        portal.className = 'folder-card card';
        portal.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;opacity:0.5;border-style:dashed;';
        portal.innerHTML = `<div style="font-size:22px;color:var(--accent);">▤</div><div style="font-size:9px;letter-spacing:2px;color:var(--accent);font-weight:900;text-transform:uppercase;">Browse All</div><div style="font-size:9px;color:var(--muted);text-align:center;padding:0 8px;">${items.length - RECENT_MAX} more</div>`;
        portal.onclick = () => openLineage();
        g.appendChild(portal);
      }

      wrap.appendChild(g); surface.appendChild(wrap);
    }

    // Pull recent across ALL folders, sorted by updated_at desc
        const thirtyDaysAgo = Date.now() - (30 * 86400000);
    const allActive = allD.filter(d => {
      if(d.isDeleted) return false;
      if(d.is_favourite) return true; // favourites never decay from soup
      const lastTouch = d.updated_at || d.created_at || 0;
      if(lastTouch < thirtyDaysAgo) return false; // 30 day rule -- gone to deep soup
      return decayPhase(lastTouch) !== 'gone';
    });
    allActive.sort((a,b) => (b.updated_at||b.created_at||0) - (a.updated_at||a.created_at||0));

    const recentDiscourses = allActive.filter(d => d.item_type === 'discourse' || (!d.item_type && d.item_type !== 'note' && d.item_type !== 'chronicle'));
    const recentSparks = allActive.filter(d => d.item_type === 'note');
    const recentChronicles = allActive.filter(d => d.item_type === 'chronicle');

            const allMesh = [...recentDiscourses, ...recentSparks, ...recentChronicles];
    allMesh.sort((a,b) => (b.is_favourite||0) - (a.is_favourite||0) || (b.gravity||0) - (a.gravity||0) || (b.updated_at||0) - (a.updated_at||0));
    const mesh = document.getElementById('soup-mesh');
    for(const d of allMesh) {
      const card = await buildDiscourseCard(d);
      if(d._phase==='fading') card.classList.add('card-fading');
      mesh.appendChild(card);
    }
    if(createCard) mesh.appendChild(createCard);
    finalizeSoupMeshCreateLast();

    // Decay motes across all
    const forgottenCount = allD.filter(d => !d.isDeleted && (decayPhase(d.updated_at||d.created_at||0)==='forgotten'||decayPhase(d.updated_at||d.created_at||0)==='gone')).length;
    if(forgottenCount > 0) spawnMotes(surface, forgottenCount, false);
    return;
  }

  // ── FOLDER DRILL: standard grid inside a folder ───────────────────────────
  const cf = allF.filter(f => !f.isDeleted && safeMatch(f.parent_id, currentFolderId));
  const notes = allD.filter(d => !d.isDeleted && d.item_type === 'note' && safeMatch(d.folder_id, currentFolderId));
  const discs = allD.filter(d => !d.isDeleted && safeMatch(d.folder_id, currentFolderId));

  const activeFolders2 = [], forgottenFolderCount = {};
  for(const f of cf) {
    const vitality = await getFolderVitality(f.id, allFolders, allDiscs);
    const phase = vitality ? decayPhase(vitality) : decayPhase(f.created_at||0);
    if(phase==='active'||phase==='fading') activeFolders2.push({...f, _phase: phase});
    else forgottenFolderCount[f.id] = true;
  }

  const activeDiscs = [];
  let forgottenDiscCount = 0, forgottenSparkCount = 0;
  for(const d of discs) {
    const phase = decayPhase(d.updated_at||d.created_at||0);
    if(phase==='active'||phase==='fading') activeDiscs.push({...d, _phase: phase});
    else if(d.item_type==='note') forgottenSparkCount++;
    else forgottenDiscCount++;
  }
  const forgottenFolders = Object.keys(forgottenFolderCount).length;

  if(!activeFolders2.length && !activeDiscs.length && !forgottenFolders && !forgottenDiscCount && !forgottenSparkCount) {
    surface.innerHTML = `<div class="table-empty"><div class="table-empty-glyph">◈</div><div class="table-empty-text">Empty Abyss</div></div>`;
    return;
  }

  if(activeFolders2.length) {
    const l = document.createElement('div'); l.className = 'cards-section-label'; l.textContent = 'Folders'; surface.appendChild(l);
    const g = document.createElement('div'); g.className = 'cards-grid';
    for(const f of activeFolders2) {
      const dc = allD.filter(d => safeMatch(d.folder_id, f.id) && !d.isDeleted).length;
      const sc = allF.filter(sf => safeMatch(sf.parent_id, f.id) && !sf.isDeleted).length;
      const meta = [];
      if(dc > 0) meta.push(dc + ' item' + (dc===1?'':'s'));
      if(sc > 0) meta.push(sc + ' folder' + (sc===1?'':'s'));
              const card = document.createElement('div');
        card.className = 'nq-card card' + (f._phase==='fading'?' card-fading':'');
        card.dataset.folderId = f.id;
        if(typeof selectedItems !== 'undefined' && selectedItems.has(f.id)) card.classList.add('card-selected');
                card.innerHTML = `
          <div class="nq-card-head">
            <span class="nq-card-glyph">▤</span>
            <span class="nq-card-fav"></span>
          </div>
          <div class="nq-card-title" style="margin-top:2px;">${escHtml(f.name)}</div>
          <div class="nq-card-foot">
            <span class="nq-card-date">${meta.length?meta.join(' · '):'Empty'}</span>
          </div>`;

      card.onclick = () => { if(window.longPressConsumed){window.longPressConsumed=false;return;} enterFolder(f.id, f.name); };
      card.onmousedown = e => startLP(e, card, {type:'folder', id:f.id, name:f.name, data:f});
      card.ontouchstart = e => startLP(e, card, {type:'folder', id:f.id, name:f.name, data:f}, {passive:true});
      card.onmouseup = () => cancelLP(card);
      card.onmouseleave = () => cancelLP(card);
      card.ontouchend = () => cancelLP(card);
      g.appendChild(card);
    }
    surface.appendChild(g);
  }

  const folderDiscourses = activeDiscs.filter(d => d.item_type === 'discourse' || (!d.item_type && d.item_type !== 'note' && d.item_type !== 'chronicle'));
  const folderSparks = activeDiscs.filter(d => d.item_type === 'note');
  const folderChronicles = activeDiscs.filter(d => d.item_type === 'chronicle');

  async function renderFolderSection(label, items) {
    if(!items.length) return;
    const l = document.createElement('div'); l.className = 'cards-section-label'; l.textContent = label; surface.appendChild(l);
    const g = document.createElement('div'); g.className = 'cards-grid';
    for(const d of items) {
      const card = await buildDiscourseCard(d);
      if(d._phase==='fading') card.classList.add('card-fading');
      g.appendChild(card);
    }
    surface.appendChild(g);
  }

  await renderFolderSection('Discourses', folderDiscourses);
  await renderFolderSection('Sparks', folderSparks);
  await renderFolderSection('Chronicles', folderChronicles);

  const totalForgotten = forgottenDiscCount + forgottenSparkCount;
  if(totalForgotten > 0) spawnMotes(surface, totalForgotten, false);
  if(forgottenFolders > 0) spawnMotes(surface, forgottenFolders, true);
}

/* DECAY SYSTEM */
const DECAY_FADING_DAYS = 14;
const DECAY_FORGOTTEN_DAYS = 30;
const DECAY_MOTE_DIES_DAYS = 60;
const DAY_MS = 86400000;

function decayPhase(updatedAt){
  const age = Date.now() - updatedAt;
  if(age < DECAY_FADING_DAYS * DAY_MS) return 'active';
  if(age < DECAY_FORGOTTEN_DAYS * DAY_MS) return 'fading';
  if(age < DECAY_MOTE_DIES_DAYS * DAY_MS) return 'forgotten';
  return 'gone';
}

async function getFolderVitality(folderId, allF, allD){
  // Find youngest updated_at among all contents recursively
  const children = allD.filter(d => {
    const isANull = (!d.folder_id||String(d.folder_id)==='null');
    const isBNull = (!folderId||String(folderId)==='null');
    if(isANull&&isBNull) return true;
    return String(d.folder_id)===String(folderId);
  });
  const subfolders = allF.filter(f => {
    const isANull = (!f.parent_id||String(f.parent_id)==='null');
    const isBNull = (!folderId||String(folderId)==='null');
    if(isANull&&isBNull) return false;
    return String(f.parent_id)===String(folderId);
  });

  let youngest = 0;
  for(const d of children) if((d.updated_at||0) > youngest) youngest = d.updated_at||0;
  for(const sf of subfolders){
    const sfVitality = await getFolderVitality(sf.id, allF, allD);
    if(sfVitality > youngest) youngest = sfVitality;
  }
  return youngest || 0;
}

let currentFocusId = null;

// Chain of path knots -- session only
let focusChain = [];

/** Folder id equals ancestor or lies under it in the parent chain (descendant folders + self). */
function folderIsUnderAncestor(folderId, ancestorFolderId, allFolders) {
  if (!folderId || !ancestorFolderId) return false;
  let fid = folderId;
  const seen = new Set();
  while (fid && !seen.has(fid)) {
    seen.add(fid);
    if (String(fid) === String(ancestorFolderId)) return true;
    const row = allFolders.find(f => f.id === fid && !f.isDeleted);
    fid = row && row.parent_id ? row.parent_id : null;
    if (!fid || String(fid) === 'null' || String(fid) === 'root') return false;
  }
  return false;
}

function finalizeSoupMeshCreateLast() {
  const mesh = document.getElementById('soup-mesh');
  const create = document.getElementById('nq-create-card');
  if (!mesh || !create || create.parentNode !== mesh) return;
  mesh.appendChild(create);
}

/** True if mesh already has a folder card for this id (discourse cards also set data-folder-id — ignore those). */
function meshAlreadyShowsFolderCard(mesh, folderId) {
  if (!mesh || !folderId) return false;
  return [...mesh.querySelectorAll('.nq-card')].some(
    c => c.dataset.folderId === folderId && !c.dataset.id
  );
}

async function focusMeshCard(id, folderId, label) {
  const mesh = document.getElementById('soup-mesh');
  if(!mesh) return;

  // Tapping already focused card -- unfocus
  if(currentFocusId === id) {
    await unfocusMesh();
    return;
  }
  const prevFocusId = currentFocusId;
  currentFocusId = id;

  const allFolders = await getFolders();

  const existingIdx = focusChain.findIndex(k => k.id === id);
  if(existingIdx >= 0) {
    // Trim chain -- remove injected cards beyond this point
    focusChain = focusChain.slice(0, existingIdx + 1);
    mesh.querySelectorAll('[data-injected="true"]').forEach(c => {
      // Keep injected cards that belong to this chain level
      const belongsToChain = focusChain.some(k => c.dataset.parentFolderId === k.id || c.dataset.folderId === k.id);
      if(!belongsToChain) c.remove();
    });
  } else {
    let isDrillDown = false;
    if (prevFocusId) {
      const targetFolder = allFolders.find(f => f.id === id && !f.isDeleted);
      if (targetFolder && String(targetFolder.parent_id) === String(prevFocusId)) {
        isDrillDown = true;
      }
    }
    if (!isDrillDown) focusChain = [];
    focusChain.push({ id, folderId, label: label || id });
  }

  // Inject nested folders that aren't in mesh yet
  const nestedFolders = allFolders.filter(f =>
    !f.isDeleted &&
    String(f.parent_id) === String(id) &&
    !meshAlreadyShowsFolderCard(mesh, f.id)
  );

  for(const f of nestedFolders) {
    const allD = await getDiscourses();
    const allF = allFolders;
    const dc = allD.filter(d => String(d.folder_id) === String(f.id) && !d.isDeleted).length;
    const nc = allD.filter(d => String(d.folder_id) === String(f.id) && d.item_type === 'note' && !d.isDeleted).length;
    const sc = allF.filter(sf => String(sf.parent_id) === String(f.id) && !sf.isDeleted).length;
    const meta = [];
    if(dc > 0) meta.push(dc + (dc===1?' discourse':' discourses'));
    if(nc > 0) meta.push(nc + (nc===1?' spark':' sparks'));
    if(sc > 0) meta.push(sc + (sc===1?' folder':' folders'));
    const nestedCount = sc;
    const isThick = nestedCount > 0;

    const card = document.createElement('div');
    card.className = 'nq-card card' + (isThick ? ' folder-thick' : '');
    card.dataset.folderId = f.id;
    card.dataset.parentFolderId = f.parent_id || '';
    card.dataset.fav = f.is_favourite || 0;
    card.dataset.gravity = f.gravity || 0;
    card.dataset.time = f.updated_at || f.created_at || 0;
    card.dataset.injected = 'true';
    card.innerHTML = `
      <div class="nq-card-head">
        <span class="nq-card-glyph">▤</span>
        <span class="nq-card-fav"></span>
      </div>
      <div class="nq-card-title">${escHtml(f.name)}</div>
      <div class="nq-card-foot">
        <span class="nq-card-date">${meta.length?meta.join(' · '):'Empty'}</span>
        ${isThick?`<span style="font-size:9px;color:var(--accent-dim);opacity:0.7;">${nestedCount} nested ↓</span>`:''}
      </div>`;
    card.onclick = () => {
      if(window.longPressConsumed){window.longPressConsumed=false;return;}
      focusMeshCard(f.id, f.parent_id || null, f.name);
    };
    card.onmousedown = e => startLP(e, card, {type:'folder', id:f.id, name:f.name, data:f});
    card.ontouchstart = e => startLP(e, card, {type:'folder', id:f.id, name:f.name, data:f}, {passive:true});
    card.onmouseup = () => cancelLP(card);
    card.onmouseleave = () => cancelLP(card);
    card.ontouchend = () => cancelLP(card);
    mesh.appendChild(card);
  }

  // THREE TIER CLASSIFICATION -- re-read cards after injection
  const cards = Array.from(mesh.querySelectorAll('.nq-card'));
  const tier1 = [];
  const tier2 = [];
  const tier3 = [];

  const focusAsFolder = allFolders.find(f => f.id === id && !f.isDeleted);
  const isFolderMeshFocus = !!focusAsFolder;

  cards.forEach(card => {
    if(card.id === 'nq-create-card') return;
    const cardFolderId = card.dataset.folderId || '';
    const cardParentFolderId = card.dataset.parentFolderId || '';
    const cardId = card.dataset.id || '';

    let tier = 3;
    if (isFolderMeshFocus) {
      const homeId = cardFolderId || '';
      const underFocus = homeId && folderIsUnderAncestor(homeId, id, allFolders);
      if (underFocus) {
        tier = 1;
      } else {
        const fp = focusAsFolder.parent_id;
        let isNeu = false;
        if (homeId) {
          const meta = allFolders.find(x => x.id === homeId && !x.isDeleted);
          if (meta && String(meta.parent_id || '') === String(fp || '') && homeId !== id) {
            isNeu = true;
          }
        }
        tier = isNeu ? 2 : 3;
      }
    } else {
      // Focused id is a discourse/spark (not a folder card): tier-1 = item + ancestor folder cards + subfolders of its folder
      const isTarget = cardId === id;
      const isSiblingDiscourse = !!(folderId && cardId && cardFolderId === folderId && cardId !== id);
      const isAncestorOrSelfFolder =
        !!(!cardId && cardFolderId && folderId &&
          (String(cardFolderId) === String(folderId) || folderIsUnderAncestor(folderId, cardFolderId, allFolders)));
      const isNestedSubfolder =
        !!(!cardId && cardParentFolderId && folderId && String(cardParentFolderId) === String(folderId));
      if (isTarget || isAncestorOrSelfFolder || isNestedSubfolder) tier = 1;
      else if (isSiblingDiscourse) tier = 2;
      else tier = 3;
    }

    if (tier === 1) {
      card.classList.add('in-focus');
      card.classList.remove('out-focus');
      tier1.push(card);
    } else if (tier === 2) {
      card.classList.remove('in-focus', 'out-focus');
      tier2.push(card);
    } else {
      card.classList.add('out-focus');
      card.classList.remove('in-focus');
      tier3.push(card);
    }
  });

  // Physical reorder -- create card last so lineage thread does not anchor to it first
  const createCard = document.getElementById('nq-create-card');
  tier1.forEach(card => mesh.prepend(card));
  if(createCard) mesh.appendChild(createCard);
  finalizeSoupMeshCreateLast();

  // Haptic — single pulse per focus change
  try { window.webkit?.messageHandlers?.haptic?.postMessage('light'); } catch (e) {}
  if (navigator.vibrate) navigator.vibrate(12);

  // Update chain knots with ghost if focused item has nested folders
  const anchorFolderId = focusAsFolder ? id : folderId;
  const hasDepth = anchorFolderId && allFolders.some(f => !f.isDeleted && String(f.parent_id) === String(anchorFolderId));
  await renderChainKnots(!!hasDepth);
  drawLineageThread(id, folderId);
}

async function unfocusMesh() {
  currentFocusId = null;
  focusChain = [];
  const mesh = document.getElementById('soup-mesh');
  if(!mesh) return;

  // Remove all injected nested folder cards
  mesh.querySelectorAll('[data-injected="true"]').forEach(c => c.remove());

  mesh.querySelectorAll('.nq-card').forEach(card => {
    card.classList.remove('in-focus', 'out-focus');
  });
  removeLineageThread();

  const createCard = document.getElementById('nq-create-card');
  const cards = Array.from(mesh.querySelectorAll('.nq-card:not(.nq-create-card)'));
  cards.sort((a, b) => {
    const aFav = parseInt(a.dataset.fav || 0);
    const bFav = parseInt(b.dataset.fav || 0);
    const aGrav = parseInt(a.dataset.gravity || 0);
    const bGrav = parseInt(b.dataset.gravity || 0);
    const aTime = parseInt(a.dataset.time || 0);
    const bTime = parseInt(b.dataset.time || 0);
    return (bFav - aFav) || (bGrav - aGrav) || (bTime - aTime);
  });
  cards.forEach(card => mesh.appendChild(card));
  if(createCard) mesh.appendChild(createCard);
  finalizeSoupMeshCreateLast();
  await renderChainKnots(false);
}

function drawLineageThread(id, folderId) {
  removeLineageThread();
  if (!currentFocusId) return;
  const mesh = document.getElementById('soup-mesh');
  if(!mesh) return;
  const focusedCard = [...mesh.querySelectorAll('.nq-card')].find(
        c => c.dataset.folderId === id && !c.dataset.id
      ) || mesh.querySelector(`[data-id="${id}"]`);
  if(!focusedCard) return;

  const breadcrumb = document.getElementById('breadcrumb-bar');
  if (!breadcrumb) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'lineage-thread';
  svg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  document.body.appendChild(svg);

  const cardRect = focusedCard.getBoundingClientRect();
  const cardCX = cardRect.left + cardRect.width / 2;
  const cardTopY = cardRect.top;
  const cardMidY = cardRect.top + cardRect.height / 2;

  const knotEl = breadcrumb.querySelector('.bc-knot-wrap--current');
  let anchorX;
  let anchorY;
  if (knotEl) {
    const kr = knotEl.getBoundingClientRect();
    anchorX = kr.left + kr.width / 2;
    anchorY = kr.bottom;
  } else {
    const bcRect = breadcrumb.getBoundingClientRect();
    const KNOT_SPACING = 56;
    const SIDE_PAD = 28;
    const knotIdx = focusChain.length;
    const knotLocalX = SIDE_PAD + knotIdx * KNOT_SPACING;
    anchorX = bcRect.left + knotLocalX - (breadcrumb.scrollLeft || 0);
    anchorY = bcRect.bottom;
  }

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', `M ${anchorX} ${anchorY} C ${anchorX} ${anchorY + (cardTopY - anchorY) * 0.6} ${cardCX} ${cardTopY - 20} ${cardCX} ${cardMidY}`);
  line.setAttribute('stroke', 'rgba(200,160,80,0.4)');
  line.setAttribute('stroke-width', '1');
  line.setAttribute('fill', 'none');
  svg.appendChild(line);

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', anchorX);
  dot.setAttribute('cy', anchorY);
  dot.setAttribute('r', '2.5');
  dot.setAttribute('fill', 'rgba(200,160,80,0.5)');
  svg.appendChild(dot);

  const children = mesh.querySelectorAll('.in-focus:not(#nq-create-card)');
  children.forEach(child => {
    if(child === focusedCard) return;
    const childRect = child.getBoundingClientRect();
    const childCX = childRect.left + childRect.width / 2;
    const childTopY = childRect.top;
    const branch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    branch.setAttribute('d', `M ${cardCX} ${cardMidY} C ${cardCX} ${cardMidY + 30} ${childCX} ${childTopY - 20} ${childCX} ${childTopY}`);
    branch.setAttribute('stroke', 'rgba(200,160,80,0.2)');
    branch.setAttribute('stroke-width', '0.8');
    branch.setAttribute('fill', 'none');
    svg.appendChild(branch);
  });
}

function removeLineageThread() {
  const existing = document.getElementById('lineage-thread');
  if(existing) existing.remove();
  // Also clean up any body-appended SVG
  document.querySelectorAll('#lineage-thread').forEach(el => el.remove());
}

function openQuickAction(card, item) {
  if (item && item.type === 'character' && currentMode === 'sanctuary') return;
  // Remove any existing menu
  const existing = document.getElementById('nq-quick-action');
  if(existing) existing.remove();

  const rect = card.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'nq-quick-action';
  menu.id = 'nq-quick-action';

  const isContent = item.type === 'discourse';

    const actions = [];
  if(isContent) {
    if(item.data.item_type === 'note') {
            actions.push({ glyph: '○', label: 'Convert to Chronicle', action: async () => {
        await updateDiscourse(item.id, { item_type: 'chronicle' });
        await renderTableView();
        showToast('Converted to Chronicle ◆');
      }});
    }
  }
    actions.push({ glyph: '◇', label: 'Rename', action: () => openRenameForItem(item.id) });
  actions.push({ glyph: '⊙', label: 'Move', action: async () => {
    selectedItems = new Set([item.id]);
    await batchMove();
  }});
  const div = document.createElement('div');
  div.className = 'nq-qa-divider';
  actions.push({ glyph: '⊘', label: 'Burn', action: async () => {
    if(item.type === 'folder') {
      if(!confirm(`Burn "${item.name}" and all its contents?`)) return;
      await deleteFolderRecursive(item.id);
      await renderTableView();
      showToast('Folder burned ◆');
    } else {
      await deleteDiscourse(item.id);
      await renderTableView();
      showToast('Burned to void ◌');
    }
  }, destructive: true });

  actions.forEach(a => {
      if(a.destructive) menu.appendChild(div);
    const row = document.createElement('div');
    row.className = 'nq-qa-item' + (a.destructive ? ' destructive' : '');
    row.innerHTML = `<span class="nq-qa-glyph">${a.glyph}</span><span>${a.label}</span>`;
    row.addEventListener('click', () => { menu.remove(); overlay.remove(); a.action(); });
    menu.appendChild(row);
  });

  // Position near card
  const menuW = 180;
  let left = rect.left;
  let top = rect.bottom + 6;
  if(left + menuW > window.innerWidth - 10) left = window.innerWidth - menuW - 10;
  if(top + 200 > window.innerHeight) top = rect.top - 210;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  // Transparent overlay to dismiss
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:998;';
  overlay.addEventListener('click', () => { menu.remove(); overlay.remove(); });

  document.body.appendChild(overlay);
  document.body.appendChild(menu);
}

function closeSparkEditSheet() {
  const root = document.getElementById('nq-spark-sheet-root');
  if (root && root._nqSparkEsc) {
    document.removeEventListener('keydown', root._nqSparkEsc);
    root._nqSparkEsc = null;
  }
  if (root) root.remove();
}

async function persistNewSpark(title, raw_text, folderVal, newFolderInputEl) {
  let fId = folderVal || null;
  if (fId === '__new__') {
    const nfn = newFolderInputEl && newFolderInputEl.value.trim();
    if (!nfn) { showToast('Type a folder name first ◆'); return null; }
    fId = await createFolder(nfn, currentFolderId);
    currentFolderId = fId;
  }
  if (!fId) fId = currentFolderId || null;
  const now = Date.now();
  const sparkId = 'n_' + now;
  const body = raw_text.slice(0, SPARK_MAX_CHARS);
  await dbPut('cosm_discourses', { id: sparkId, title, raw_text: body, folder_id: fId, source_link: null, item_type: 'note', created_at: now, updated_at: now });
  if (isWatcherReady) queueWatcherEmbed(sparkId, title, body, 'note');
  return sparkId;
}

async function openSparkEditSheet(opts) {
  closeSparkEditSheet();
  const id = opts && opts.id != null && String(opts.id) !== '' ? opts.id : null;
  const isCreate = !id;

  const root = document.createElement('div');
  root.id = 'nq-spark-sheet-root';
  root.className = 'nq-spark-root';
  const backdrop = document.createElement('div');
  backdrop.className = 'nq-spark-backdrop';
  const panel = document.createElement('div');
  panel.className = 'nq-spark-panel';
  panel.setAttribute('role', 'dialog');

  const head = document.createElement('div');
  head.className = 'nq-spark-head';
  head.textContent = 'SPARK';

  const titleInp = document.createElement('input');
  titleInp.type = 'text';
  titleInp.className = 'nq-spark-title cosm-input';
  titleInp.placeholder = 'Title…';
  titleInp.maxLength = 120;
  titleInp.value = String(opts.title || '').slice(0, 120);

  const ta = document.createElement('textarea');
  ta.className = 'nq-spark-body cosm-input';
  ta.placeholder = 'Thought, aphorism, idea…';
  ta.value = opts.raw_text != null ? String(opts.raw_text) : '';

  const newFoldRow = document.createElement('div');
  newFoldRow.className = 'nq-spark-newfolder-wrap';
  newFoldRow.style.display = 'none';
  const newFoldInp = document.createElement('input');
  newFoldInp.type = 'text';
  newFoldInp.className = 'nq-spark-newfolder cosm-input';
  newFoldInp.placeholder = 'New folder name…';
  newFoldInp.maxLength = 60;

  let folderSel = null;
  if (isCreate) {
    folderSel = document.createElement('select');
    folderSel.className = 'nq-spark-folder cosm-select';
    const folders = await getFolders();
    folderSel.appendChild(new Option('-- Auto-wrap in folder --', ''));
    folders.forEach(f => {
      const o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.name;
      if (f.id === currentFolderId) o.selected = true;
      folderSel.appendChild(o);
    });
    folderSel.appendChild(new Option('+ New folder…', '__new__'));
    folderSel.addEventListener('change', () => {
      newFoldRow.style.display = folderSel.value === '__new__' ? 'block' : 'none';
    });
  }

  const foot = document.createElement('div');
  foot.className = 'nq-spark-foot';
  const counter = document.createElement('div');
  counter.className = 'nq-spark-counter';
  const btns = document.createElement('div');
  btns.className = 'nq-spark-btns';
  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'nq-spark-btn nq-spark-btn-cancel';
  btnCancel.textContent = 'Cancel';
  const btnSave = document.createElement('button');
  btnSave.type = 'button';
  btnSave.className = 'nq-spark-btn nq-spark-btn-save';
  btnSave.textContent = 'Save';

  function syncCounter() {
    const n = ta.value.length;
    counter.textContent = n + ' / ' + SPARK_MAX_CHARS;
    counter.classList.toggle('over', n > SPARK_MAX_CHARS);
  }
  ta.addEventListener('input', syncCounter);
  ta.addEventListener('paste', (ev) => {
    ev.preventDefault();
    const clip = (ev.clipboardData || window.clipboardData).getData('text') || '';
    const s0 = ta.selectionStart;
    const s1 = ta.selectionEnd;
    const merged = ta.value.slice(0, s0) + clip + ta.value.slice(s1);
    ta.value = merged.slice(0, SPARK_MAX_CHARS);
    syncCounter();
  });

  btnCancel.addEventListener('click', () => closeSparkEditSheet());
  backdrop.addEventListener('click', () => closeSparkEditSheet());

  const esc = (ev) => {
    if (ev.key === 'Escape') {
      document.removeEventListener('keydown', esc);
      root._nqSparkEsc = null;
      closeSparkEditSheet();
    }
  };
  root._nqSparkEsc = esc;
  document.addEventListener('keydown', esc);

  let busy = false;
  btnSave.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    btnSave.disabled = true;
    try {
      const title = titleInp.value.trim() || 'Untitled Capture';
      let raw = ta.value;
      if (isCreate && !raw.trim()) {
        showToast('Nothing to Spark ◆');
        return;
      }
      if (raw.length > SPARK_MAX_CHARS) {
        raw = raw.slice(0, SPARK_MAX_CHARS);
        showToast('Body capped at ' + SPARK_MAX_CHARS + ' ◆');
      }
      if (isCreate) {
        const fv = folderSel.value || null;
        const sid = await persistNewSpark(title, raw, fv, newFoldInp);
        if (!sid) return;
      } else {
        await updateDiscourse(id, { title, raw_text: raw, updated_at: Date.now() });
        if (isWatcherReady) queueWatcherEmbed(id, title, raw, 'note');
      }
      closeSparkEditSheet();
      if (navigator.vibrate) navigator.vibrate(50);
      await renderTableView();
      showToast(isCreate ? 'Sparked ◆' : 'Saved ◆');
    } catch (err) {
      console.error(err);
      showToast('Spark save failed ◆');
    } finally {
      busy = false;
      btnSave.disabled = false;
    }
  });

  newFoldRow.appendChild(newFoldInp);
  foot.appendChild(counter);
  btns.appendChild(btnCancel);
  btns.appendChild(btnSave);
  foot.appendChild(btns);

  panel.appendChild(head);
  if (isCreate) {
    panel.appendChild(folderSel);
    panel.appendChild(newFoldRow);
  }
  panel.appendChild(titleInp);
  panel.appendChild(ta);
  panel.appendChild(foot);
  root.appendChild(backdrop);
  root.appendChild(panel);
  document.body.appendChild(root);
  syncCounter();
  setTimeout(() => {
    ta.focus();
    const end = ta.value.length;
    ta.setSelectionRange(end, end);
  }, 80);
}

function openCreateMenu(card) {
  const existing = document.getElementById('nq-quick-action');
  if(existing) existing.remove();

  const rect = card.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'nq-quick-action';
  menu.id = 'nq-quick-action';

  const actions = [
    { glyph: '▤', label: 'Folder', action: () => openFolderModal() },
    { glyph: '◇', label: 'Spark', action: () => openQuickCapture() },
    { glyph: '○', label: 'Chronicle', action: () => handleNewChronicle() },
    { glyph: '⌬', label: 'Engram', action: () => openBurnDiscModal() },
  ];

  actions.forEach(a => {
    const row = document.createElement('div');
    row.className = 'nq-qa-item';
    row.innerHTML = `<span class="nq-qa-glyph">${a.glyph}</span><span>${a.label}</span>`;
    row.addEventListener('click', () => { menu.remove(); overlay.remove(); a.action(); });
    menu.appendChild(row);
  });

  let left = rect.left;
  let top = rect.bottom + 6;
  if(left + 180 > window.innerWidth - 10) left = window.innerWidth - 190;
  if(top + 220 > window.innerHeight) top = rect.top - 228;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:998;';
  overlay.addEventListener('click', () => { menu.remove(); overlay.remove(); });
  document.body.appendChild(overlay);
  document.body.appendChild(menu);
}

async function buildDiscourseCard(d){
  const date = new Date(d.updated_at||d.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const preview = d.raw_text ? d.raw_text.replace(/\n+/g,' ').slice(0,120) : '';
  const glyph = d.item_type === 'note' ? '◇' : d.item_type === 'chronicle' ? '○' : '◈';
  const card = document.createElement('div');
  card.className = 'nq-card card';
    card.dataset.id = d.id;
  card.dataset.folderId = d.folder_id || '';
  card.dataset.fav = d.is_favourite || 0;
  card.dataset.gravity = d.gravity || 0;
  card.dataset.time = d.updated_at || d.created_at || 0;
  if (typeof selectedItems !== 'undefined' && selectedItems.has(d.id)) card.classList.add('card-selected');
  card.innerHTML = `
    <div class="nq-card-head">
      <span class="nq-card-glyph">${glyph}</span>
      <span class="nq-card-fav${d.is_favourite?' active':''}" data-fav="${d.id}"></span>
    </div>
    <div class="nq-card-title">${escHtml(d.title||'Untitled')}</div>
    ${preview?`<div class="nq-card-preview">${escHtml(preview)}</div>`:''}
    <div class="nq-card-foot">
      <span class="nq-card-date">${date}</span>
    </div>`;

        card.addEventListener('click', async (e) => {
    if(window.longPressConsumed){window.longPressConsumed=false;return;}
    // Favourite dot tap
    if(e.target.closest('.nq-card-fav')) {
      const next = await toggleFavourite(d.id);
      e.target.closest('.nq-card-fav').classList.toggle('active', !!next);
      return;
    }
    // Spark (orphan): first tap opens edit sheet. Spark (in folder): first tap focuses + thread, second tap opens sheet.
    if(d.item_type === 'note') {
      if(!d.folder_id) {
        openSparkEditSheet({ id: d.id, title: d.title, raw_text: d.raw_text });
        return;
      }
      if(currentFocusId === d.id) {
        openSparkEditSheet({ id: d.id, title: d.title, raw_text: d.raw_text });
        return;
      }
      focusMeshCard(d.id, d.folder_id || null, d.title);
      return;
    }
    // Root card (no folder) -- single tap goes straight to editor
    if(!d.folder_id) {
      openDiscourse(d.id);
      return;
    }
    // Connected card -- first tap focuses, second tap enters editor
    if(currentFocusId === d.id) {
      openDiscourse(d.id);
      return;
    }
        focusMeshCard(d.id, d.folder_id, d.title);
  });

  card.addEventListener('mousedown', e => startLP(e, card, {type:'discourse', id:d.id, name:d.title, data:d}));
  card.addEventListener('mouseup', () => cancelLP(card));
  card.addEventListener('mouseleave', () => cancelLP(card));
  card.addEventListener('touchstart', e => startLP(e, card, {type:'discourse', id:d.id, name:d.title, data:d}), {passive:true});
  card.addEventListener('touchend', () => cancelLP(card));
  card.addEventListener('touchcancel', () => cancelLP(card));
  card.addEventListener('touchmove', e => handleTM(e, card), {passive:true});
  card.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
  
  return card;
}

/* BREADCRUMB — flex chain: path + current label + descendant folder knots; native title tooltips */
function focusChainForFolder(targetFolderId, allFolders) {
  if (!targetFolderId) return [];
  const stack = [];
  let cur = allFolders.find(f => f.id === targetFolderId && !f.isDeleted);
  const guard = new Set();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    stack.push({ id: cur.id, folderId: cur.parent_id, label: cur.name || cur.id });
    const pid = cur.parent_id;
    if (!pid || String(pid) === 'null' || String(pid) === 'root' || String(pid) === 'undefined') break;
    cur = allFolders.find(f => f.id === pid && !f.isDeleted);
  }
  return stack.reverse();
}

function collectSubfolderTree(parentFolderId, allFolders) {
  if (parentFolderId == null || parentFolderId === '') return [];
  const out = [];
  const kids = allFolders.filter(f => !f.isDeleted && String(f.parent_id) === String(parentFolderId));
  kids.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
  for (const c of kids) {
    out.push(c);
    out.push(...collectSubfolderTree(c.id, allFolders));
  }
  return out;
}

async function renderBreadcrumb() {
  await renderChainKnots(false);
}

async function renderChainKnots(showGhost = false) {
  const bar = document.getElementById('breadcrumb-bar');
  if (!bar) return;
  bar.innerHTML = '';

  const allFolders = await getFolders() || [];
  const last = focusChain.length ? focusChain[focusChain.length - 1] : null;
  let descList = [];
  if (last) {
    const asFolder = allFolders.find(f => !f.isDeleted && f.id === last.id);
    const descRoot = asFolder ? last.id : (last.folderId != null && String(last.folderId) !== '' ? last.folderId : null);
    if (descRoot != null && String(descRoot) !== '') {
      descList = collectSubfolderTree(descRoot, allFolders);
    }
  }
  const hasPathMulti = focusChain.length > 1;
  const hasDesc = descList.length > 0;
  const useFullChain = hasPathMulti || hasDesc;

  const segments = [];
  segments.push({
    kind: 'soup',
    id: null,
    folderId: null,
    label: 'The Soup',
    tooltip: 'The Soup'
  });

  if (focusChain.length) {
    if (!useFullChain) {
      const k = focusChain[0];
      const lab = String(k.label || k.id || '').replace(/^◈\s*/, '').trim() || String(k.id || '');
      segments.push({
        kind: 'current',
        id: k.id,
        folderId: k.folderId,
        label: lab,
        tooltip: lab
      });
    } else {
      focusChain.forEach((k, i) => {
        const isLast = i === focusChain.length - 1;
        const lab = String(k.label || k.id || '').replace(/^◈\s*/, '').trim() || String(k.id || '');
        segments.push({
          kind: isLast ? 'current' : 'path',
          id: k.id,
          folderId: k.folderId,
          label: lab,
          tooltip: lab
        });
      });
      for (const d of descList) {
        segments.push({
          kind: 'desc',
          id: d.id,
          folderId: d.parent_id,
          label: d.name,
          tooltip: d.name || d.id
        });
      }
    }
  }

  if (showGhost) {
    segments.push({ kind: 'ghost', id: '__ghost__', folderId: null, label: '···', tooltip: '' });
  }

  const inner = document.createElement('div');
  inner.className = 'bc-breadcrumb-inner';
  const spine = document.createElement('div');
  spine.className = 'bc-spine-line';
  spine.setAttribute('aria-hidden', 'true');
  const row = document.createElement('div');
  row.className = 'bc-knot-row';
  inner.appendChild(spine);
  inner.appendChild(row);
  bar.appendChild(inner);

  segments.forEach((seg, idx) => {
    const isCurrent = seg.kind === 'current';
    const isGhost = seg.kind === 'ghost';
    const isSoup = seg.kind === 'soup';

    const wrap = document.createElement('div');
    wrap.className = 'bc-knot-wrap' +
      (isCurrent ? ' bc-knot-wrap--current' : ' bc-knot-wrap--compact') +
      (isSoup ? ' bc-knot-wrap--soup' : '');
    if (isCurrent) wrap.dataset.knotRole = 'current';
    wrap.dataset.knotIdx = String(idx);

    const tip = seg.tooltip || seg.label || '';
    if (tip) {
      wrap.title = tip;
      wrap.setAttribute('aria-label', tip);
    }

    const dot = document.createElement('div');
    dot.className = 'bc-knot' + (isCurrent ? ' current' : '');
    if (!isCurrent && !isGhost) dot.classList.add('bc-knot-dot');
    if (isGhost) dot.classList.add('compressed');
    if (isGhost) dot.style.opacity = '0.25';
    wrap.appendChild(dot);

    if (isSoup && !isGhost) {
      const soupLab = document.createElement('div');
      soupLab.className = 'bc-knot-label bc-knot-label--soup';
      soupLab.textContent = 'The Soup';
      wrap.appendChild(soupLab);
    } else if (isCurrent && !isGhost) {
      const label = document.createElement('div');
      label.className = 'bc-knot-label current';
      label.textContent = seg.label;
      wrap.appendChild(label);
    }

    wrap.addEventListener('click', async () => {
      if (isGhost) return;
      if (seg.kind === 'current') return;
      if (seg.kind === 'soup') {
        focusChain = [];
        await unfocusMesh();
        return;
      }
      if (seg.kind === 'path') {
        focusChain = focusChain.slice(0, idx);
        await focusMeshCard(seg.id, seg.folderId, seg.label);
        return;
      }
      if (seg.kind === 'desc') {
        const chain = focusChainForFolder(seg.id, allFolders);
        if (chain.length) {
          focusChain = chain.slice(0, -1);
          const leaf = chain[chain.length - 1];
          await focusMeshCard(leaf.id, leaf.folderId, leaf.label);
        }
      }
    });

    row.appendChild(wrap);
  });

  requestAnimationFrame(() => {
    const cur = bar.querySelector('.bc-knot-wrap--current');
    if (cur) {
      const barRect = bar.getBoundingClientRect();
      const curRect = cur.getBoundingClientRect();
      const curCenter = curRect.left + curRect.width / 2;
      const want = barRect.left + barRect.width / 2;
      bar.scrollLeft += curCenter - want;
      const maxScroll = Math.max(0, bar.scrollWidth - bar.clientWidth);
      if (bar.scrollLeft > maxScroll) bar.scrollLeft = maxScroll;
      if (bar.scrollLeft < 0) bar.scrollLeft = 0;
    }
    requestAnimationFrame(() => {
      const br = bar.getBoundingClientRect();
      let cx = br.left + br.width / 2;
      const cur2 = bar.querySelector('.bc-knot-wrap--current');
      if (cur2) {
        const kr = cur2.getBoundingClientRect();
        cx = kr.left + kr.width / 2;
      }
      drawBreadcrumbDrop(cx);
      const spineEl = inner.querySelector('.bc-spine-line');
      const soupWrap = row.querySelector('.bc-knot-wrap--soup');
      if (spineEl && soupWrap) {
        const ir = inner.getBoundingClientRect();
        const sr = soupWrap.getBoundingClientRect();
        const centerPx = sr.left + sr.width / 2 - ir.left;
        spineEl.style.left = Math.max(0, centerPx) + 'px';
      }
    });
  });
}

function drawBreadcrumbDrop(screenCenterX) {
  // Remove existing drop
  const existing = document.getElementById('bc-drop-svg');
  if(existing) existing.remove();
  if (focusChain.length > 0) return;
  if(breadcrumbPath.length <= 1) return; // at root, no drop

  const bar = document.getElementById('breadcrumb-bar');
  if (!bar) return;
  const barRect = bar.getBoundingClientRect();
  const surface = document.getElementById('table-surface');
  if (!surface) return;
  const surfaceRect = surface.getBoundingClientRect();

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'bc-drop-svg';
  svg.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;`;

  const startX = screenCenterX != null ? screenCenterX : (barRect.left + barRect.width / 2);
  const startY = barRect.bottom;
  const endY = surfaceRect.top + 20;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${startY + 30} ${startX} ${endY - 30} ${startX} ${endY}`);
  path.setAttribute('class', 'bc-drop-line');
  svg.appendChild(path);

  document.body.appendChild(svg);
}

/* THE GOLD LINE LOGIC */
let threadSleepTimer = null;

function awakenGoldLine() {
  const zone = document.getElementById('gold-line-zone');
  const thread = document.getElementById('gold-thread');
  if (!zone || currentMode !== 'soup') return;

  // Only wobble if it was fully asleep
  if (!zone.classList.contains('awake')) {
    thread.classList.remove('wobble');
    void thread.offsetWidth; // trigger reflow
    thread.classList.add('wobble');
  }

  zone.classList.add('awake');

  // Reset the sleep timer
  if (threadSleepTimer) clearTimeout(threadSleepTimer);
  threadSleepTimer = setTimeout(() => {
    zone.classList.remove('awake');
  }, 2500); // Fades out after 2.5 seconds of stillness
}

function renderGoldTicks() {
  const container = document.getElementById('gold-ticks-container');
  if (!container) return;
  container.innerHTML = '';
  
  const depth = breadcrumbPath.length;
  // If we are at root (depth 1), just show one tick at the top
  // If we are deep, space them evenly along the thread
  
  for (let i = 0; i < depth; i++) {
    const tick = document.createElement('div');
    tick.className = 'gold-tick' + (i === depth - 1 ? ' current' : '');
    
    // Calculate vertical position (20px top padding + evenly spaced)
    const availableHeight = window.innerHeight * 0.6;
const spacing = depth > 1 ? (i * (availableHeight / (depth - 1))) : 0;
    tick.style.top = `calc(20px + ${spacing}px)`; 
    
    container.appendChild(tick);
  }
}

/* LINEAGE NAVIGATOR LOGIC */
let lineageExpandedFolders = new Set();

async function openLineage() {
  const panel = document.getElementById('lineage-panel');
  const overlay = document.getElementById('lineage-overlay');
  const content = document.getElementById('lineage-content');
  if (!panel || !overlay || !content) return;

  const allF = await getFolders();
  const allD = await dbGetAll("cosm_discourses");
  const safeMatch = (a, b) => (String(a || 'null') === String(b || 'null'));

  lineageExpandedFolders = new Set();
  if (currentFolderId) {
    let fid = currentFolderId;
    while (fid) {
      lineageExpandedFolders.add(fid);
      const f = allF.find(x => x.id === fid);
      fid = f ? f.parent_id : null;
    }
  }

  async function folderHasContent(fId) {
    const hasDiscs = allD.some(d => !d.isDeleted && safeMatch(d.folder_id, fId));
    if (hasDiscs) return true;
    const subs = allF.filter(f => !f.isDeleted && safeMatch(f.parent_id, fId));
    for (const sub of subs) {
      if (await folderHasContent(sub.id)) return true;
    }
    return false;
  }

  async function renderFolder(folder, depth, isLast) {
    const hasSubfolders = allF.some(f => !f.isDeleted && safeMatch(f.parent_id, folder.id));
    const hasContent = await folderHasContent(folder.id);
    const isEmpty = !hasContent;
    const isExpanded = lineageExpandedFolders.has(folder.id);
    const isCurrent = (String(folder.id || '') === String(currentFolderId || ''));

    const levelDiv = document.createElement('div');
    levelDiv.className = 'lineage-level' 
      + (isCurrent ? ' current' : '')
      + (isEmpty ? ' empty' : '')
      + (isLast ? ' last-visible' : '');
    levelDiv.style.marginLeft = (depth * 20) + 'px';

    const dot = document.createElement('div');
    dot.className = 'lineage-level-dot';
    levelDiv.appendChild(dot);

    if (hasSubfolders && !isEmpty) {
      const expandBtn = document.createElement('span');
      expandBtn.className = 'lineage-expand' + (isExpanded ? ' open' : '');
      expandBtn.textContent = '▸';
      expandBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (lineageExpandedFolders.has(folder.id)) {
          lineageExpandedFolders.delete(folder.id);
        } else {
          lineageExpandedFolders.add(folder.id);
        }
        await openLineage();
      });
      levelDiv.appendChild(expandBtn);
    } else {
      const spacer = document.createElement('span');
      spacer.style.cssText = 'display:inline-block;width:36px;flex-shrink:0;';
      levelDiv.appendChild(spacer);
    }

    const nameBtn = document.createElement('span');
    nameBtn.className = 'lineage-level-name';
    nameBtn.textContent = folder.name;
    nameBtn.addEventListener('click', () => {
      if (hasSubfolders && !isEmpty) {
        if (lineageExpandedFolders.has(folder.id)) {
          lineageExpandedFolders.delete(folder.id);
        } else {
          lineageExpandedFolders.add(folder.id);
        }
        openLineage();
    } else {
        enterFolder(folder.id, folder.name, depth);
        closeLineage();
      }
    });
    levelDiv.appendChild(nameBtn);

    content.appendChild(levelDiv);

    if (hasSubfolders && isExpanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'lineage-children open';
      const subs = allF.filter(f => !f.isDeleted && safeMatch(f.parent_id, folder.id));
      subs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      for (let i = 0; i < subs.length; i++) {
        await renderFolder(subs[i], depth + 1, i === subs.length - 1);
      }
      content.appendChild(childrenContainer);
    }
  }

  content.innerHTML = '';

  const atRoot = !currentFolderId || currentFolderId === 'null' || currentFolderId === 'undefined';
  const rootDiv = document.createElement('div');
  rootDiv.className = 'lineage-level root' + (atRoot ? ' current' : '');
  const rootDot = document.createElement('div');
  rootDot.className = 'lineage-level-dot';
  rootDiv.appendChild(rootDot);
  const spacer = document.createElement('span');
  spacer.style.cssText = 'display:inline-block;width:36px;flex-shrink:0;';
  rootDiv.appendChild(spacer);
  const rootName = document.createElement('span');
  rootName.className = 'lineage-level-name';
  rootName.textContent = 'The Soup';
  rootName.addEventListener('click', () => {
    goHome();
    closeLineage();
  });
  rootDiv.appendChild(rootName);
  content.appendChild(rootDiv);

  const topFolders = allF.filter(f => !f.isDeleted && safeMatch(f.parent_id, null));
  topFolders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  for (let i = 0; i < topFolders.length; i++) {
    await renderFolder(topFolders[i], 1, i === topFolders.length - 1);
  }

  panel.classList.add('open');
  overlay.classList.add('active');
}

function closeLineage() {
  document.getElementById('lineage-panel').classList.remove('open');
  document.getElementById('lineage-overlay').classList.remove('active');
}

function enterFolder(id, name, depth){
  const folderId = (id === 'root') ? null : id;
  
  // If depth is provided (from lineage), slice the breadcrumb to that depth first
  if (typeof depth === 'number') {
    breadcrumbPath = breadcrumbPath.slice(0, depth);
  }
  
  // Check if folder already exists in breadcrumb path
  const existingIndex = breadcrumbPath.findIndex(seg => String(seg.id) === String(folderId));
  if (existingIndex >= 0) {
    breadcrumbPath = breadcrumbPath.slice(0, existingIndex + 1);
  } else {
    breadcrumbPath.push({id: folderId, name: name});
  }
  currentFolderId = folderId;
  renderTableView();
  renderGoldTicks();
  awakenGoldLine();
}

function navToBc(idx){
breadcrumbPath=breadcrumbPath.slice(0,idx+1);
currentFolderId=breadcrumbPath[breadcrumbPath.length-1].id;
  renderTableView();
  renderGoldTicks(); // NEW
  awakenGoldLine();  // NEW
}

async function openDiscourse(id){
  if(currentDiscourseId && id !== currentDiscourseId) await saveCurrentDiscourse(true);
  const disc = await getDiscourse(id); 
  if(!disc){ showToast("Discourse not found ◆"); return; }
  
  currentDiscourseId = id;
  updateGravity(id, 1);
  
  // Silent Attention Bump
  await dbPut("cosm_discourses", {...disc, updated_at: Date.now()}); 
  
  document.getElementById("discourse-title").value = disc.title || "";
  
  // SAFELY RENDER UNIFIED TEXT
  let contentText = disc.raw_text || "";
  const savedTitle = disc.title ? disc.title.trim() : "";
  
  // prepend it to the text area so it isn't lost in the void.
  if (savedTitle && savedTitle !== "Untitled" && savedTitle !== "Untitled Discourse") {
      const firstLine = (contentText.split('\n').find(l => l.trim().length > 0) || "").trim();
      if (firstLine !== savedTitle && !firstLine.startsWith(savedTitle)) {
          contentText = savedTitle + "\n\n" + contentText;
      }
  }
  
  const ta = document.getElementById("content-textarea");
  ta.value = contentText;
  
  // Trigger auto-height after content loads
  setTimeout(() => {
    ta.style.height = 'auto';
    ta.style.height = Math.max(ta.scrollHeight, window.innerHeight * 0.6) + 'px';
  }, 50);
  
  await renderMeta(disc); 
  await renderMosaicDisplay(id);

  // Chronicle vs Discourse feel
  const lhInner = document.querySelector('.lighthouse-inner');
  if(disc.item_type === 'chronicle'){
    ta.placeholder = 'What was brought in from outside...\n\nPaste, transcribe, or write what arrived from elsewhere.';
    if(lhInner) lhInner.style.borderLeft = '2px solid var(--accent-dim)';
    if(lhInner) lhInner.style.paddingLeft = '18px';
  } else if(disc.item_type === 'note'){
    ta.placeholder = 'A spark...\n\nWrite fast. Don\'t construct.';
    if(lhInner) lhInner.style.borderLeft = 'none';
    if(lhInner) lhInner.style.paddingLeft = '0';
  } else {
  ta.placeholder = 'Title\n\nBegin writing...';
  if(lhInner) lhInner.style.borderLeft = 'none';
  if(lhInner) lhInner.style.paddingLeft = '0';
  // Show title heading for discourse
  const titleDisplay = document.getElementById('lh-title-display');
  if(titleDisplay && disc.title && disc.title !== 'Untitled' && disc.title !== 'Untitled Discourse') {
    titleDisplay.textContent = disc.title.slice(0, 60);
    titleDisplay.style.display = 'block';
  } else if(titleDisplay) {
    titleDisplay.style.display = 'none';
  }
}
  
  setEditorMode('write');
const hdr = document.querySelector('.nq-header');
hdr.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1)';
hdr.style.transform = 'translateY(-100%)';
hdr.style.marginBottom = '-56px';
showPanel('view-lighthouse');
  
    currentFolderId = null;
  breadcrumbPath = [{id: null, name: '◈ The Soup'}];
}

async function renderMeta(disc){
  const el=document.getElementById("discourse-meta");
  const date=new Date(disc.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    const typeLabel = disc.item_type === 'chronicle' ? 'Chronicle' : disc.item_type === 'note' ? 'Spark' : 'Discourse';
  let html = `<span>${date}</span><span class="meta-separator">·</span><span style="color:var(--accent-dim);font-size:9px;letter-spacing:1px;text-transform:uppercase;">${typeLabel}</span>`;
  if(disc.folder_id){const f=await dbGet("cosm_folders",disc.folder_id);if(f)html+=`<span class="meta-separator">·</span><span>▸ ${escHtml(f.name)}</span>`;}
  const bl=await getBacklink(disc.id);
  if(bl)html+=`<span class="meta-separator">·</span><a class="source-link" href="#">⟵ ${escHtml(bl.char_name||"Sanctuary")}</a>`;
  el.innerHTML=html;
}

async function renderMosaicDisplay(dId){
  const tile=await getMosaicTile(dId);const el=document.getElementById("mosaic-display");
  if(!tile||!tile.anchors||!tile.anchors.length){el.innerHTML="";return;}
  const ah=tile.anchors.map(a=>{const p=a.split(":");if(p.length>1)return`<div class="mosaic-anchor"><span class="anchor-dot"></span><span><span class="anchor-cat">${escHtml(p[0].trim())}:</span> ${escHtml(p.slice(1).join(":").trim())}</span></div>`;return`<div class="mosaic-anchor"><span class="anchor-dot"></span><span>${escHtml(a)}</span></div>`;}).join("");
  el.innerHTML=`<div class="mosaic-block"><div class="mosaic-header"><span class="mosaic-label">◈ Mosaic</span><button class="btn-delete-mosaic" id="btn-clear-mosaic">✕ Clear</button></div><div class="mosaic-anchors-wrap">${ah}</div></div>`;
  document.getElementById('btn-clear-mosaic').addEventListener('click',confirmDeleteMosaic);
}

async function handleNewChronicle() {
  const folders = await getFolders();
  const sel = document.getElementById('discourse-modal-folder');
  sel.innerHTML = '<option value="">-- Choose folder (or auto-wrap) --</option>';
  folders.filter(f => !f.isDeleted).forEach(f => {
    const o = document.createElement('option');
    o.value = f.id; o.textContent = f.name;
    if (f.id === currentFolderId) o.selected = true;
    sel.appendChild(o);
  });
  const no = document.createElement('option');
  no.value = '__new__'; no.textContent = '+ New folder...';
  sel.appendChild(no);
  document.getElementById('discourse-modal-title').value = '';
  document.getElementById('discourse-modal-title').placeholder = 'Chronicle title...';
  document.getElementById('discourse-modal-new-folder').style.display = 'none';
  // Mark modal as chronicle mode
  document.getElementById('discourse-modal').dataset.type = 'chronicle';
  document.getElementById('discourse-modal').classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
  setTimeout(() => document.getElementById('discourse-modal-title').focus(), 100);
}

async function saveCurrentDiscourse(silent=false){
  if(!currentDiscourseId)return;
  
  const ta = document.getElementById("content-textarea");
  const fullText = ta.value;
  
  // Extract the first non-empty line as the title for the database index
  const lines = fullText.split('\n');
  const title = lines.find(l => l.trim().length > 0)?.trim().slice(0, 120) || "Untitled";
  
  // The body IS the full text. No slicing. No data loss.
  const raw_text = fullText;
  
  document.getElementById("discourse-title").value = title;
  const ind = document.getElementById('lh-save-indicator');
  if(ind){ ind.textContent='◆ saving'; ind.className='lh-save-indicator saving'; }
  
    await updateDiscourse(currentDiscourseId, {title, raw_text});
  if(currentDiscourseId) updateGravity(currentDiscourseId, 2); // +2 on edit

  try { localStorage.setItem('nq_last_entry_timestamp', String(Date.now())); } catch (e) {}
  
  if(ind){ ind.textContent='◆ saved'; ind.className='lh-save-indicator visible'; setTimeout(()=>{ ind.className='lh-save-indicator'; },2000); }
  if(!silent)showToast("Saved ◆");
  setTimeout(()=>backupToAkashic(),0);
  
  if (currentDiscourseId) {
    const disc = await getDiscourse(currentDiscourseId);
    if (isWatcherReady && disc && disc.item_type) queueWatcherEmbed(currentDiscourseId, title, raw_text, disc.item_type);
    generateFastMap(currentDiscourseId);
  }
}

async function handleNewDiscourse(){
  const folders=await getFolders();
  const sel=document.getElementById('discourse-modal-folder');
  sel.innerHTML='<option value="">-- Choose folder (or auto-wrap) --</option>';
  folders.filter(f=>!f.isDeleted).forEach(f=>{
    const o=document.createElement('option');
    o.value=f.id;o.textContent=f.name;
    if(f.id===currentFolderId)o.selected=true;
    sel.appendChild(o);
  });
  const no=document.createElement('option');no.value='__new__';no.textContent='+ New folder...';sel.appendChild(no);
  document.getElementById('discourse-modal-title').value='';
  document.getElementById('discourse-modal-new-folder').style.display='none';
  document.getElementById('discourse-modal').classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
  setTimeout(()=>document.getElementById('discourse-modal-title').focus(),100);
}

async function confirmNewDiscourse(){
  const title=document.getElementById('discourse-modal-title').value.trim()||'Untitled Discourse';
  let fId=document.getElementById('discourse-modal-folder').value||null;
  
    if(fId==='__new__'){
    const nfn=document.getElementById('discourse-modal-new-folder').value.trim();
    if(!nfn){showToast('Type a folder name ◆');return;}
    fId=await createFolder(nfn,currentFolderId||null);
    // Don't navigate -- stay in current view, just set folder silently
    currentFolderId=fId;
  } else if(!fId){
    fId = currentFolderId || null;
  } else {
    // Don't navigate into selected folder -- just use it
    currentFolderId=fId;
  }
  closeOverlay();
  
  if(currentDiscourseId)await saveCurrentDiscourse(true);
    const isChronicle = document.getElementById('discourse-modal').dataset.type === 'chronicle';
  document.getElementById('discourse-modal').dataset.type = '';
  const disc = await createDiscourse({title, raw_text:'', folder_id: fId, item_type: isChronicle ? 'chronicle' : 'discourse'});
  await openDiscourse(disc.id);
  setTimeout(()=>{
    const t=document.getElementById('discourse-title');
    if(t){t.select();t.focus();}
  },120);
}

async function deleteCurrentDiscourse() {
  if (!currentDiscourseId) return;
  if (!confirm("Burn this discourse to the Void?")) return;
  await deleteDiscourse(currentDiscourseId);
  currentDiscourseId = null;
  goBack();
  showToast("Moved to Void ◌");
}

/* SANCTUARY */
async function renderSanctuaryView(){
  const surface = document.getElementById('sanctuary-surface');
  if (!surface) return;
  const ssw = document.getElementById('sanctuary-search-bar-wrap');
  if (ssw) ssw.style.display = sanctuaryLocalSearchOpen ? 'block' : 'none';
  surface.innerHTML = '';
  
  const allC = await getCharacters();
  const allIE = await getImmutableEntities(); 

  // Separate IEs from standard characters
  const standardChars = allC.filter(c => !c.isDeleted);
  const immutableEntities = allIE.filter(ie => !ie.is_deleted);
  
  const q = sanctuarySearchQuery.toLowerCase();
  const filteredIEs = q 
    ? immutableEntities.filter(ie => 
        (ie.display_name||'').toLowerCase().includes(q) || 
        (ie.archetype_tag||'').toLowerCase().includes(q) ||
        (ie.existential_function||'').toLowerCase().includes(q)
      )
    : immutableEntities;
  
  const filteredChars = q
    ? standardChars.filter(c => 
        (c.name||'').toLowerCase().includes(q) || 
        (c.role||'').toLowerCase().includes(q)
      )
    : standardChars;
  
  const hasIEs = filteredIEs.length > 0;
  const hasChars = filteredChars.length > 0;
  
  if (!hasIEs && !hasChars) {
    surface.innerHTML = '<div class="table-empty"><div class="table-empty-glyph">◈</div><div class="table-empty-text">No characters found</div></div>';
    return;
  }

  // --- IE DECK STRIP (top, horizontal scroll) ---
  if (hasIEs) {
    const strip = document.createElement('div');
    strip.className = 'ie-strip';
    
        // Shuffle on every render
    const shuffledIEs = [...filteredIEs].sort(() => Math.random() - 0.5);

    for (const ie of shuffledIEs) {
  const isLocked = !!ie.signature;
  const card = document.createElement('div');
  card.className = 'ie-card' + (isLocked ? '' : ' draft');
  card.innerHTML = `
    <div class="ie-card-text">
      <div class="ie-card-name">${escHtml(ie.display_name || 'Unnamed')}${isLocked ? ' ◆' : ''}</div>
      ${ie.archetype_tag ? '<div class="ie-card-archetype">' + escHtml(ie.archetype_tag) + '</div>' : ''}
      ${ie.existential_function ? '<div class="ie-card-function">' + escHtml(ie.existential_function) + '</div>' : ''}
    </div>
    <div class="ie-card-sigil pulse">
      ${generateIESigil(ie.id)}
    </div>
  `;
  card.addEventListener('click', () => {
    if (isLocked) openIEBottomSheet(ie.id);
    else showToast('◈ Draft Entity. Go to ∞ Immutable page to forge.');
  });
  strip.appendChild(card);
}
        // CTA card -- always last
    const ctaCard = document.createElement('div');
ctaCard.className = 'ie-card ie-card-archive';
ctaCard.innerHTML = `
  <div class="ie-card-text">
    <div class="ie-card-name">All Entities</div>
    <div class="ie-card-function">View the full archive</div>
  </div>
  <div class="ie-card-sigil">∞</div>
`;
ctaCard.addEventListener('click', () => openIEPage());
strip.appendChild(ctaCard);

    surface.appendChild(strip);
  }

  // --- DIVIDER ---
  if (hasIEs && hasChars) {
    const divider = document.createElement('div');
    divider.className = 'sanctuary-divider';
    divider.innerHTML = `
      <div class="sanctuary-divider-line"></div>
      <span class="sanctuary-divider-label">Characters</span>
      <div class="sanctuary-divider-line"></div>
    `;
    surface.appendChild(divider);
  }

  // --- CHARACTER GRID (below) ---
  if (hasChars) {
    const qtrim = sanctuarySearchQuery.trim();
    if (!hasIEs || qtrim) {
      const l = document.createElement('div');
      l.className = 'cards-section-label';
      l.textContent = qtrim ? 'Matching characters' : 'Characters & Entities';
      surface.appendChild(l);
    }

    const g = document.createElement('div');
    g.className = 'sanctuary-char-grid';
    
    for (const c of filteredChars) {
      const card = document.createElement('div');
      card.className = 'character-card card';
      if (selectedItems.has(c.id)) card.classList.add('card-selected'); 
      
            const primarySlot = (c.image !== undefined && c.image !== null && c.image !== '') ? Number(c.image) : -1;
      card.innerHTML = `
        <div class="char-card-header">
          <div class="char-avatar" id="cavatar-${c.id}">${escHtml(c.name.charAt(0).toUpperCase())}</div>
          <div class="char-card-header-info">
            <div class="char-card-name">${escHtml(c.name)}</div>
            <div class="char-card-role">${escHtml(c.role || 'No role assigned')}</div>
          </div>
        </div>
        <div class="char-card-footer">
          <div class="char-card-meta">CUSTOM · ${new Date(c.updated_at).toLocaleDateString()}</div>
        </div>
      `;
      if (primarySlot >= 0) {
        loadCharacterPhoto(c.id, primarySlot).then(url => {
          if (!url) return;
          const av = card.querySelector('#cavatar-' + c.id);
          if (!av) return;
          av.innerHTML = '<img src="' + url + '" alt="">';
        });
      }
      card.addEventListener('click', () => {
        if (longPressConsumed) { longPressConsumed = false; return; }
        if (selectMode) { toggleSelectItem(c.id); return; } 
        openChat(c.id);
      });

      g.appendChild(card);
    }
    surface.appendChild(g);
  }
}

async function handleNewCharacter(){
  const tempId = "c_" + Date.now();
  const tempChar = {
    id: tempId,
    name: "New Character",
    role: "",
    backstory: "",
    personality: "",
    lorebook: "",
    scenario: "",
    inclination: "",
    relationships: "",
    pc_info: "",
    temperature: 1
  };
  openCharacterForge(tempChar);
}

async function openCharacterForge(idOrChar){
  let c;
  if (typeof idOrChar === 'object') {
    c = idOrChar;
    activeCharId = c.id;
    document.getElementById('forge-container').dataset.isNew = 'true';
  } else {
    activeCharId = idOrChar || null;
    c = idOrChar ? await getCharacter(idOrChar) : {name:"",role:"",backstory:"",personality:"",lorebook:"",scenario:"",inclination:"",relationships:"",pc_info:"",temperature:1};
    document.getElementById('forge-container').dataset.isNew = 'false';
  }
  document.getElementById('forge-name').value=c.name||"";
  document.getElementById('forge-role').value=c.role||"";
  document.getElementById('forge-backstory').value=c.backstory||"";
  document.getElementById('forge-personality').value=c.personality||"";
  document.getElementById('forge-lorebook').value=c.lorebook||"";
  document.getElementById('forge-scenario').value=c.scenario||"";
  document.getElementById('forge-inclination').value=c.inclination||"";
  document.getElementById('forge-relationships').value=c.relationships||"";
  document.getElementById('forge-pc-info').value=c.pc_info||"";
  document.getElementById('forge-temp').value=c.temperature||1;
  document.getElementById('forge-temp-val').textContent=Number(c.temperature||1).toFixed(1);
  showPanel('view-forge');

  // Unmake button -- only for existing characters
  const unmakeZone = document.getElementById('forge-unmake-zone');
  const unmakeBtn = document.getElementById('btn-forge-unmake');
  const isNewForge = document.getElementById('forge-container').dataset.isNew === 'true';
  if (activeCharId && !isNewForge) {
    unmakeZone.style.display = 'block';
    const charIdToPurge = activeCharId;
    unmakeBtn.onclick = async () => {
      if (!confirm('Unmake this character? This cannot be undone.')) return;
      if (!confirm('Final warning. All data and photos will be destroyed. Continue?')) return;
      await deleteAllCharacterPhotos(charIdToPurge);
      await purgeCharacter(charIdToPurge);
      showToast('Character unbound from existence.');
      showPanel('view-sanctuary');
      renderSanctuaryView();
    };
  } else {
    unmakeZone.style.display = 'none';
  }
const roles=getPersonaRoles();
const roleSel=document.getElementById('forge-persona-role');
roleSel.innerHTML='<option value="">Default (global persona only)</option>';
roles.forEach(r=>{
  const o=document.createElement('option');
  o.value=r.id;o.textContent=r.name;
  if(r.id===c.player_role_id)o.selected=true;
  roleSel.appendChild(o);
});
// ---> INJECT AT THE BOTTOM OF openCharacterForge() <---
  const photoSection = document.getElementById('forge-photo-section');
  if (photoSection) {
    // Only show photos for standard characters, keep hidden for Immutable Entities
    if (activeCharId && document.getElementById('forge-container').dataset.isIE !== 'true') {
      photoSection.style.display = 'block';
      renderForgePhotos(activeCharId, c.image);
    } else {
      photoSection.style.display = 'none';
    }
  }
} // end of openCharacterForge

async function saveCharacterForge(){
  const isIE = document.getElementById('forge-container').dataset.isIE === 'true';
  const ieId = document.getElementById('forge-container').dataset.ieId;

  if(isIE && ieId){
    const isNew = document.getElementById('forge-container').dataset.isNew === 'true';
    let ie;
    if (isNew) {
      ie = JSON.parse(document.getElementById('forge-container').dataset.tempIE || '{}');
    } else {
      ie = await getImmutableEntity(ieId);
    }
    if(!ie) {
      showToast('Entity not found');
      return;
    }

    const modelVariants = currentIEModels.length > 0 
      ? currentIEModels.map(line => ({model_id: line}))
      : [{model_id: 'google/gemini-2.5-flash-lite'}, {model_id: 'deepseek/deepseek-v4-flash'}];

    const updated = {
      ...ie,
      display_name: document.getElementById('forge-name').value.trim() || ie.display_name,
      archetype_tag: document.getElementById('forge-role').value.trim(),
      system_prompt_core: document.getElementById('forge-backstory').value,
      voice_limits: document.getElementById('forge-personality').value,
      constraints: document.getElementById('forge-lorebook').value,
      existential_function: document.getElementById('forge-scenario').value,
      memory_policy: document.getElementById('forge-inclination').value || 'stateless',
      model_variants: JSON.stringify(modelVariants),
      updated_at: Date.now()
    };

    await saveImmutableEntity(updated);
    document.getElementById('forge-container').dataset.isNew = 'false';
    showToast(isNew ? '◆ Entity Created' : '◆ IE Draft updated');
    closeIEForge();
    return;
  }
  // --- Regular character save ---
  const data = {
    name: document.getElementById('forge-name').value.trim() || "Unnamed Soul",
    role: document.getElementById('forge-role').value.trim(),
    backstory: document.getElementById('forge-backstory').value,
    personality: document.getElementById('forge-personality').value,
    lorebook: document.getElementById('forge-lorebook').value,
    scenario: document.getElementById('forge-scenario').value,
    inclination: document.getElementById('forge-inclination').value,
    relationships: document.getElementById('forge-relationships').value,
    pc_info: document.getElementById('forge-pc-info').value,
    player_role_id: document.getElementById('forge-persona-role').value || null,
    temperature: parseFloat(document.getElementById('forge-temp').value)
  };
  
  let savedChar;
  const isNew = document.getElementById('forge-container').dataset.isNew === 'true';
  if (isNew) {
    savedChar = await createCharacter(data);
    activeCharId = savedChar.id;
    document.getElementById('forge-container').dataset.isNew = 'false';
  } else if(activeCharId) {
    await updateCharacter(activeCharId, data);
    savedChar = await getCharacter(activeCharId);
  }
  
  showToast("Soul Anchored ◆");
  closeCharacterForge();
}

function closeCharacterForge() {
  if (document.getElementById('forge-container').dataset.isIE === 'true') {
    closeIEForge();
    return;
  }
  document.getElementById('forge-container').dataset.isNew = 'false';
  showPanel('view-sanctuary');
  document.getElementById('btn-chat-edit').style.display = '';
  activeCharId = null;
  renderSanctuaryView();
}

/* CHAT */
async function closeChatToOrigin(){
  const pid = chatReturnPanel || 'view-soup';
  showPanel(pid);
  if (pid === 'view-sanctuary') await renderSanctuaryView();
  else if (pid === 'view-ie') renderIEList(document.getElementById('ie-search-input')?.value || '');
  else await renderTableView();
}

async function openChat(id){
  const ieCheck = await getImmutableEntity(id);
  if(ieCheck && ieCheck.signature){ openIEBottomSheet(id); return; }
  if(ieCheck && !ieCheck.signature){ showToast('◈ Draft -- go to ∞ page to forge'); return; }
  // Reset IE state -- critical to prevent bleed from IE chat
    activeIE = null;
  currentIEModels = [];
  isSending = false;
  document.getElementById('view-chat').classList.remove('ie-encounter');
  document.getElementById('chat-input').placeholder = 'Send a message...';
  document.getElementById('chat-persona-pill').style.display = '';
  document.getElementById('btn-chat-edit').style.display = '';// reset any stuck send state
  activeCharId = id;
  chatReturnPanel = currentMode === 'sanctuary' ? 'view-sanctuary' : 'view-soup';
  const c = await getCharacter(id);
    // Avatar pill -- show primary photo or letter initial
  const pill = document.getElementById('chat-avatar-pill');
  pill.innerHTML = escHtml(c.name.charAt(0).toUpperCase());
  pill.onclick = null;
  const primarySlot = (c.image !== undefined && c.image !== null && c.image !== '') ? Number(c.image) : -1;
  if (primarySlot >= 0) {
    loadCharacterPhoto(c.id, primarySlot).then(url => {
      if (url) pill.innerHTML = '<img src="' + url + '" alt="">';
    });
  }
  // Tap pill to open lightbox if photos exist
  pill.onclick = async () => {
    const urls = (await Promise.all([0,1,2].map(s => loadCharacterPhoto(c.id, s)))).filter(Boolean);
    if (!urls.length) return;
    openPhotoLightbox(urls);
  };
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('chat-input').value = '';
document.getElementById('chat-input').style.height = 'auto';

  // Hide IE-only elements
  const bar = document.getElementById('ie-model-bar');
if(bar) bar.style.display = 'none';
  document.getElementById('chat-persona-pill').style.display = '';
  document.getElementById('btn-chat-edit').style.display = '';
  
  const history = await dbGetByIndex('history','charId',id);
  history.forEach(h => appendChatMessage(h.role, h.content));
  chatPersonaOverride = c.player_role_id || null;
  updatePersonaPill();
  await updateChatRetryButton();
  showPanel('view-chat');
}

// UI Helper: The Abyss Rule - No Regrets.
async function updateChatRetryButton() {
  const retryBtn = document.getElementById('btn-chat-retry');
  if (!retryBtn) return;
  if (isSending || !activeCharId) {
    retryBtn.style.display = 'none';
    return;
  }
  
  const history = await dbGetByIndex('history', 'charId', activeCharId);
  if (history.length === 0) {
    retryBtn.style.display = 'none';
    return;
  }
  
  history.sort((a,b) => a.created_at - b.created_at);
  const lastMsg = history[history.length - 1];

  // Only show retry if the API failed (the last message is still the user's)
  retryBtn.style.display = (lastMsg.role === 'user') ? 'flex' : 'none';
}

let isSending = false;
let chatAbortController = null;

async function handleChatSend(isRetry = false) {
  if (typeof isRetry !== 'boolean') isRetry = false;

  // 1. THE KILL SWITCH
  if (isSending) {
    if (chatAbortController) chatAbortController.abort();
    return;
  }

  const input = document.getElementById('chat-input');
  const text = input.value.trim();

  let history = await dbGetByIndex('history', 'charId', activeCharId);
  history.sort((a,b) => a.created_at - b.created_at);

  // 2. NETWORK RETRY OR NEW MESSAGE
  if (isRetry) {
    // Double-check that we are actually in a failed state
    if (!history.length || history[history.length - 1].role !== 'user') return;
  } else {
    if (!text || !activeCharId) return;
    input.value = ''; 
    input.style.height = 'auto';
    appendChatMessage('user', text);

    const now = Date.now();
    const userMsgId = 'h_' + crypto.randomUUID();
    await dbPut('history', { id: userMsgId, charId: activeCharId, role: 'user', content: text, created_at: now });
    history.push({ id: userMsgId, charId: activeCharId, role: 'user', content: text, created_at: now });
  }

  const char = activeIE ? activeIE : await getCharacter(activeCharId);
  if (!char) return;

  // 3. LOCK THE UI & ARM THE ABORT CONTROLLER
  isSending = true;
  const sendBtn = document.getElementById('btn-send');
  sendBtn.textContent = '✕';
  sendBtn.style.background = 'var(--danger)';
  sendBtn.style.color = '#fff';
  
  const retryBtn = document.getElementById('btn-chat-retry');
  if (retryBtn) retryBtn.style.display = 'none';

  chatAbortController = new AbortController();

  try {
    const response = await streamChatResponse(char, history, chatAbortController.signal);
    if (response && response.trim()) {
      const aiMsgId = 'h_' + crypto.randomUUID();
      await dbPut('history', { id: aiMsgId, charId: activeCharId, role: 'char', content: response.trim(), created_at: Date.now() });
    }
  } catch (e) {
    if (e.name !== 'AbortError') console.error(e);
  } finally {
    // 4. UNLOCK UI & ASSESS STATE
    isSending = false;
    chatAbortController = null;
    sendBtn.textContent = '⇡';
    sendBtn.style.background = 'var(--accent)';
    sendBtn.style.color = '#000';
    updateChatRetryButton(); // This will show the retry button ONLY if it failed again
  }
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
for(const s of similarities.filter(s => s.score > 0.65)){
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

async function generateFastMap(discourseId, mapOpts) {
    mapOpts = mapOpts || {};
    try {
    const d = await getDiscourse(discourseId);
    if (!d || !d.raw_text) return;

    const words = d.raw_text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    if (wordCount < 30) return;

    const existing = await dbGet('guardian_summaries', discourseId);
    // Skip if already mapped and word count is unchanged
    if (existing && existing.map_type === 'fast' && existing.word_count === wordCount) return;

// Run your sovereign local heuristics
if (!generateFastMapData) { console.warn('Cartographer not loaded yet'); return; }
const mapData = generateFastMapData(d.raw_text);

let fastMap = {
  id: discourseId,
  discourse_id: discourseId,
  map_type: 'fast',
  ...mapData,
  model: 'local-heuristic',
  generated_at: Date.now(),
  created_at: existing ? existing.created_at : Date.now(),
  updated_at: Date.now()
};

// Inject the Watcher's vector echoes
    fastMap = await injectWatcherFlags(fastMap, discourseId);

    await dbPut('guardian_summaries', fastMap);
    console.log(`◈ Sovereign Fast Map generated for ${discourseId}`);

    if (!mapOpts.skipAutoInvite && checkGuardianTrigger) {
      try {
        const trig2 = checkGuardianTrigger(fastMap);
        if (trig2.shouldInvoke) {
          try {
            localStorage.setItem('nq_guardian_invoke_pending', JSON.stringify({ discourseId: discourseId, at: Date.now() }));
          } catch (pe) {}
        }
      } catch (autoErr) { console.warn('[Guardian auto]', autoErr); }
    }
  } catch (err) {
    console.error('Fast Map error:', err);
  }
}

/* ── LOCAL DEEP MAPPER ──────────────────────────────────── */
// Loaded only on Guardian summon when sovereign mode is active

let deepMapper = null;
let deepMapperLoading = false;
let deepMapperReady = false;

const DEEP_MAPPER_MODEL = 'Xenova/distilbart-cnn-6-6';

let deepMapperLastUnload = 0;

async function unloadDeepMapper() {
  if (deepMapper) {
    try { 
      await deepMapper.dispose(); 
    } catch(e) { console.warn("DeepMapper dispose error", e); }
  }
  deepMapper = null;
  deepMapperReady = false;
  deepMapperLastUnload = Date.now();
}

async function initDeepMapper() {
const subEl = document.getElementById('guardian-sub');
  // GUARD: Cartographer suppressed (Watcher still vacating memory)
  if (deepMapperLoadSuppressed) {
    console.log('[DeepMapper] Suppressed -- waiting for Watcher memory to free');
    if (subEl) subEl.textContent = 'Cartographer cooling down...';
    return false;
  }
  
  // Don't reload if unloaded less than 2 seconds ago
  if (Date.now() - deepMapperLastUnload < 2000) {
    console.log('[DeepMapper] Cooling down, waiting...');
    if (subEl) subEl.textContent = 'Cartographer cooling down...';
    await new Promise(r => setTimeout(r, 2000));
  }
  
  if (deepMapperReady) {
    console.log('[DeepMapper] Already loaded');
    return true;
  }
  
    if (deepMapperLoading) {
    console.log('[DeepMapper] Already loading, waiting...');
    return new Promise((resolve) => {
      let waited = 0;
      const check = setInterval(() => {
        waited += 500;
        if (deepMapperReady) { clearInterval(check); resolve(true); }
        if (!deepMapperLoading) { clearInterval(check); resolve(false); }
        // Self-heal: if stuck for over 35s, force reset
        if (waited > 35000) {
          clearInterval(check);
          console.warn('[DeepMapper] Stuck flag detected -- self-healing');
          deepMapperLoading = false;
          deepMapper = null;
          deepMapperReady = false;
          showToast('⚠ Cartographer timed out -- tap to retry');
          resolve(false);
        }
      }, 500);
    });
  }
  
  deepMapperLoading = true;
  console.log('[DeepMapper] Starting load...');
  
  try {
    // Safety timeout: if loading takes more than 30 seconds, give up
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DeepMapper load timeout')), 30000)
    );
    
    const loadPromise = (async () => {
      const { pipeline, env } = await import(
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0/dist/transformers.min.js'
      );
      
      console.log('[DeepMapper] Transformers.js imported');
      
      env.useBrowserCache = true;
      env.allowLocalModels = false;
      env.backends.onnx.wasm.wasmPaths = 
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0/dist/';
      env.backends.onnx.wasm.numThreads = 1;
      
      if (subEl) subEl.textContent = 'Cartographer loading model...';
      console.log('[DeepMapper] Creating pipeline...');
      
      const mapper = await pipeline('summarization', DEEP_MAPPER_MODEL, {
        quantized: true,
        progress_callback: (progress) => {
          console.log('[DeepMapper] Progress:', JSON.stringify(progress));
          if (progress.status === 'downloading' && subEl) {
            const loaded = Math.round((progress.loaded || 0) / 1024 / 1024);
            const total = Math.round((progress.total || 306) / 1024 / 1024);
            subEl.textContent = `Cartographer: ${loaded}MB / ${total}MB`;
          }
          if (progress.status === 'loading' && subEl) {
            subEl.textContent = 'Cartographer loading model...';
          }
          if (progress.status === 'ready' && subEl) {
            subEl.textContent = 'Cartographer ready. Mapping...';
          }
        }
      });
      
      console.log('[DeepMapper] Pipeline created successfully');
      return mapper;
    })();
    
    deepMapper = await Promise.race([loadPromise, timeoutPromise]);
    deepMapperReady = true;
    deepMapperLoading = false;
    console.log('[DeepMapper] Successfully loaded');
    return true;
    
  } catch (err) {
    console.error('[DeepMapper] Failed to load:', err.message);
    console.error('[DeepMapper] Full error:', JSON.stringify(err));
    deepMapperLoading = false;
    deepMapper = null;
    return false;
  }
}

async function generateDeepMap(discourseId, rawText) {
  if (!deepMapperReady || !deepMapper) return null;
  
    // 1000 chars ~200 tokens. Half sequence = quarter attention RAM.
  const truncated = rawText.trim().slice(0, 1000);
  
  try {
    const result = await deepMapper(truncated, {
      max_length: 80,
      min_length: 20,
      do_sample: false
    });

    
    const summary = result[0]?.summary_text || '';
    
    if (summary.trim().length < 20) return null;
    
    return {
      id: discourseId,
      discourse_id: discourseId,
      map_type: 'deep_local',
      summary: summary.trim(),
      word_count: rawText.trim().split(/\s+/).filter(Boolean).length,
      model: DEEP_MAPPER_MODEL,
      generated_at: Date.now()
    };
    
  } catch (err) {
    console.error('[DeepMapper] Generation failed for', discourseId, err);
    return null;
  }
}

// Select urgent discourses using Watcher intelligence
async function selectUrgentDiscourses(discs, maxCount = 5) {
  const candidates = [];
  
  for (const d of discs) {
    const fastMap = await dbGet('guardian_summaries', d.id);
    let urgencyScore = 0;
    
    // Factor 1: Has Watcher contradictions (very urgent)
    if (fastMap?.watcher?.top_contradictory?.length > 0) {
      urgencyScore += fastMap.watcher.top_contradictory.length * 3;
    }
    
    // Factor 2: Has strong echoes (the user is circling something)
    if (fastMap?.watcher?.top_similar?.length > 0) {
      const highSim = fastMap.watcher.top_similar.filter(s => s.score > 0.8);
      urgencyScore += highSim.length * 2;
    }
    
    // Factor 3: Emotional arc is escalating (unresolved tension)
    if (fastMap?.emotional_arc?.tension_shift > 0.02) {
      urgencyScore += 2;
    }
    
    // Factor 4: Longer text -- more substance to analyze
    const wordCount = fastMap?.word_count || 
      (d.raw_text || '').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 500) urgencyScore += 1;
    
    // Factor 5: Recent -- written within last 7 days
    const age = Date.now() - (d.created_at || 0);
    if (age < 7 * 86400000) urgencyScore += 2;
    
    // Factor 6: No deep map exists yet
    const deepMap = await dbGet('guardian_summaries', d.id + '_deep');
    if (!deepMap) urgencyScore += 1;
    
    candidates.push({
      id: d.id,
      title: d.title || 'Untitled',
      rawText: d.raw_text || '',
      urgencyScore,
      fastMap
    });
  }
  
  // Sort by urgency, take top N
  candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);
  return candidates.slice(0, maxCount);
}

async function runCartographer() {
  const btn = document.getElementById('btn-run-cartographer');
  const dot = document.getElementById('g-carto-dot');
  const statusText = document.getElementById('g-carto-status-text');

  function setStatus(state, text) {
    if(dot) dot.className = 'g-carto-dot' + (state ? ' ' + state : '');
    if(statusText) statusText.textContent = text;
  }

  if (btn) { btn.disabled = true; }
  setStatus('loading', 'loading model...');

  try {
    const allDiscs = (await getDiscourses()).filter(d => !d.deleted_at && !d.isDeleted);

    // Fast maps for all discourses
    setStatus('loading', 'fast mapping...');
    for (const d of allDiscs) {
      await generateFastMap(d.id, { skipAutoInvite: true });
    }

    // Deep maps via distilbart
    const mappingMode = localStorage.getItem('nq_cartographer_mode') || 'sovereign';
    if (mappingMode === 'sovereign') {
      const urgentDiscs = await selectUrgentDiscourses(allDiscs, 5);
      if (urgentDiscs && urgentDiscs.length > 0) {
        setStatus('loading', 'loading cartographer...');
        const loaded = await initDeepMapper();
        if (loaded) {
          let mapped = 0;
          for (const d of urgentDiscs) {
            mapped++;
            setStatus('loading', `mapping ${mapped}/${urgentDiscs.length}`);
            const existing = await dbGet('guardian_summaries', d.id + '_deep');
            if (existing && (Date.now() - existing.generated_at < 7 * 86400000)) continue;
            const deepMap = await generateDeepMap(d.id, d.rawText);
            if (deepMap) {
              await dbPut('guardian_summaries', {
                id: d.id + '_deep',
                discourse_id: d.id,
                map_type: 'deep_local',
                summary: deepMap.summary,
                word_count: deepMap.word_count,
                model: deepMap.model,
                generated_at: deepMap.generated_at
              });
            }
            await new Promise(r => setTimeout(r, 1200));
          }
          await unloadDeepMapper();
          setStatus('ready', 'ready');
        } else {
          setStatus('failed', 'model failed');
        }
      } else {
        setStatus('ready', 'ready');
      }
    } else {
      setStatus('ready', 'ready');
    }
  } catch(err) {
    console.error('[Cartographer] Failed:', err);
    setStatus('failed', 'failed');
  } finally {
    if (btn) { btn.disabled = false; }
  }
}

function setMappingMode(mode) {
localStorage.setItem('nq_cartographer_mode', mode);
  
  if (mode === 'sovereign') {
    showToast('◈ Sovereign -- Cartographer runs locally, no network');
  } else {
    showToast('◈ Deep -- API-powered maps (uses your key)');
  }
}

// Set initial value on Guardian view open
function selectMappingMode(mode) {
  setMappingMode(mode);
  const label = document.getElementById('mapping-toggle-label');
  if(label) label.textContent = mode === 'sovereign' ? 'Sovereign' : 'Deep';
  document.getElementById('cartographer-path-modal').classList.remove('visible');
  closeOverlay();
  setTimeout(() => runCartographer(), 100);
}

// Set initial value on Guardian view open
function initMappingModeUI() {
  const mode = localStorage.getItem('nq_cartographer_mode') || 'sovereign';
  const label = document.getElementById('mapping-toggle-label');
  if (label) label.textContent = mode === 'sovereign' ? 'Sovereign' : 'Deep';
}

async function summariseHistory(charId,messages){
  const key=await readSecureKey('nq_api_key')||"";
  if(!key||messages.length<6)return null;
  try{
    const res=await fetch(openRouterChatBaseUrl() + '/chat/completions',{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:localStorage.getItem("nq_model")||"deepseek/deepseek-v4-flash",max_tokens:300,messages:[{role:"system",content:"Compress this conversation into 5-8 bullet points. Capture emotional tone, key decisions, unresolved tensions, named facts. Ruthlessly concise. No preamble."},{role:"user",content:messages.map(m=>`${m.role}: ${m.content}`).join("\n")}]})});
    const data=await res.json();
    const summary=data.choices?.[0]?.message?.content||null;
    if(summary){
      const id="s_"+Date.now();
      await dbPut("summaries",{id,charId,text:summary,created_at:Date.now(),type:"auto"});
      showToast("Memory crystallised ◆");
    }
    return summary;
  }catch(err){console.error("Summarise failed:",err);return null;}
}

async function saveManualMemory(charId,text){
  if(!text||!charId)return;
  await dbPut("summaries",{id:"sm_"+Date.now(),charId,text,created_at:Date.now(),type:"manual"});
  showToast("Memory anchored ◆");
}

async function getMemoryContext(charId){
  const all=await dbGetAll("summaries");
  const mine=all.filter(s=>s.charId===charId).sort((a,b)=>b.created_at-a.created_at);
  if(!mine.length)return null;
  return mine.slice(0,3).map(s=>`[${s.type==="manual"?"ANCHORED":"MEMORY"}] ${s.text}`).join("\n\n");
}

async function openMemoryVaultGlobal(){
  // Open memory vault for last active character, or show all memories across characters
  const allSummaries=await dbGetAll('summaries');
  const allChars=await getCharacters();
  const charMap={};
  allChars.forEach(c=>{charMap[c.id]=c.name||'Unknown Soul';});
  
  const surface=document.getElementById('memory-surface');
  surface.innerHTML='';
  
  if(!allSummaries.length){
    surface.innerHTML='<div class="table-empty"><div class="table-empty-glyph">◈</div><div class="table-empty-text">No memories across the Sanctuary</div></div>';
  } else {
    const sorted=allSummaries.sort((a,b)=>b.created_at-a.created_at);
    const l=document.createElement('div');l.className='cards-section-label';l.textContent='All Memories';surface.appendChild(l);
    sorted.forEach(s=>{
      const div=document.createElement('div');
      div.className = 'memory-vault-card';
      div.style.cssText='border-radius:10px;padding:12px 14px;margin-bottom:8px;';
      div.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span class="memory-vault-char" style="font-size:10px;font-weight:700;">${escHtml(charMap[s.charId]||'Unknown')}</span>
          <span style="font-size:9px;color:var(--muted);">${new Date(s.created_at).toLocaleDateString()}</span>
        </div>
        <div style="font-size:13px;line-height:1.6;color:var(--text);font-family:Georgia,serif;">${escHtml(s.text)}</div>
      `;
      surface.appendChild(div);
    });
  }
  
  // Reuse the memory view panel but with a back button to Sanctuary
  document.getElementById('btn-memory-back').textContent='← Sanctuary';
  document.getElementById('btn-memory-back').dataset.backTarget = 'sanctuary';
  showPanel('view-memory');
}

async function openMemoryView(){
  if(!activeCharId)return;
  const mb = document.getElementById('btn-memory-back');
  if (mb) {
    mb.textContent = '← Chat';
    mb.dataset.backTarget = 'chat';
  }
  await renderMemoryView();
  showPanel('view-memory');
}

async function renderMemoryView(){
  const surface=document.getElementById('memory-surface');
  surface.innerHTML='';
  const all=await dbGetAll("summaries");
  const mine=all.filter(s=>s.charId===activeCharId).sort((a,b)=>b.created_at-a.created_at);

  if(!mine.length){
    surface.innerHTML='<div class="table-empty"><div class="table-empty-glyph">◈</div><div class="table-empty-text">No memories yet</div></div>';
    return;
  }

  const auto=mine.filter(s=>s.type==='auto');
  const manual=mine.filter(s=>s.type==='manual');

  function buildMemoryItem(s){
    const div=document.createElement('div');
    div.className='memory-vault-card';
    div.style.cssText='border-radius:10px;padding:12px 14px;margin-bottom:8px;';
    div.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="memory-vault-char" style="font-size:9px;letter-spacing:2px;font-weight:900;">${s.type==='manual'?'ANCHORED':'AUTO'}</span>
        <span style="font-size:9px;color:var(--muted);">${new Date(s.created_at).toLocaleDateString()}</span>
      </div>
      <div style="font-size:13px;line-height:1.6;color:var(--text);font-family:Georgia,serif;">${escHtml(s.text)}</div>
      <button onclick="deleteMemory('${s.id}')" style="margin-top:8px;background:none;border:1px solid var(--danger);color:#ff6060;font-size:10px;padding:4px 10px;border-radius:6px;font-weight:700;">✕ Remove</button>
    `;
    return div;
  }

  if(manual.length){
    const l=document.createElement('div');l.className='cards-section-label';l.textContent='Anchored Memories';surface.appendChild(l);
    manual.forEach(s=>surface.appendChild(buildMemoryItem(s)));
  }
  if(auto.length){
    const l=document.createElement('div');l.className='cards-section-label';l.textContent='Auto Summaries';surface.appendChild(l);
    auto.forEach(s=>surface.appendChild(buildMemoryItem(s)));
  }
}

async function deleteMemory(id){
  await dbDelete('summaries',id);
  await renderMemoryView();
  showToast('Memory removed ◆');
}

async function addManualAnchor(){
  const text=prompt("Anchor a memory:");
  if(text&&text.trim()){
    await saveManualMemory(activeCharId,text.trim());
    await renderMemoryView();
  }
}

let chatPersonaOverride=null;

function updatePersonaPill(){
  const pill=document.getElementById('chat-persona-pill');
  if(!pill)return;
  if(chatPersonaOverride){
    const roles=getPersonaRoles();
    const r=roles.find(r=>r.id===chatPersonaOverride);
    pill.textContent=r?'⁂ '+r.name:'⁂ default';
    pill.style.borderColor='var(--accent-dim)';
    pill.style.color='var(--accent)';
  } else {
    pill.textContent='⁂ default';
    pill.style.borderColor='var(--border)';
    pill.style.color='var(--muted)';
  }
}

function openPersonaPillSelector(){
  const roles=getPersonaRoles();
  if(!roles.length){showToast('No roles yet -- create in Persona page');return;}
  const modal=document.getElementById('persona-select-modal');
  const list=document.getElementById('persona-select-list');
  list.innerHTML='';
  const defBtn=document.createElement('button');
  defBtn.className='management-btn';
  defBtn.innerHTML='<span>⁂</span> Default (global only)';
  defBtn.addEventListener('click',()=>{
    chatPersonaOverride=null;
    updatePersonaPill();
    closeOverlay();
  });
  list.appendChild(defBtn);
  roles.forEach(r=>{
    const btn=document.createElement('button');
    btn.className='management-btn'+(chatPersonaOverride===r.id?' gold':'');
    btn.innerHTML=`<span>⁂</span> ${escHtml(r.name)}`;
    btn.addEventListener('click',()=>{
      chatPersonaOverride=r.id;
      updatePersonaPill();
      closeOverlay();
    });
    list.appendChild(btn);
  });
  modal.classList.add('visible');
  document.getElementById('cosm-overlay').classList.add('active');
}

// CALL AI FOR CHAT
async function callAIForChat(char, history){
  const key=await readSecureKey('nq_api_key')||"";
  if(!key){showToast("Add API Key in Settings");return null;}

  if(history.length>=15 && history.length%5===0){
  summariseHistory(char.id, history.slice(-20)).catch(()=>{});
  }

  const memoryContext=await getMemoryContext(char.id);
  const memoryBlock=memoryContext?`\n\n[MEMORY FRAGMENTS]\n${memoryContext}`:"";

  const p=getGlobalPersona();
  const roles=getPersonaRoles();
  const roleId=chatPersonaOverride||char.player_role_id||null;
  const assignedRole=roleId?roles.find(r=>r.id===roleId):null;

  const personaBlock = activeIE ? '' : `\n\nPlayer is ${p.bio||'the user'}. ${p.personality?'Personality: '+p.personality+'.':''} ${assignedRole?'In this encounter they are: '+assignedRole.description+'.':''}`;

  let sys;
  if(activeIE && activeIE.id === char.id){
    const ieModels = activeIE.model_variants ? 
      (typeof activeIE.model_variants === 'string' ? JSON.parse(activeIE.model_variants) : activeIE.model_variants) 
      : [];
    const modelNote = ieModels.length ? '\n\nYou were battle-tested with: ' + ieModels.map(m => m.model_id?.split('/').pop()).join(', ') : '';
    
    sys = `${activeIE.system_prompt_core || 'You are ' + activeIE.display_name}
Existential function: ${activeIE.existential_function || 'To be present.'}
Constraints: ${activeIE.constraints || 'Will not soften. Will not perform.'}
Voice: ${activeIE.voice_limits || 'As required by truth.'}${modelNote}
${memoryBlock}`;
  } else {
    sys = `You are ${char.name}. ${char.role}.
Personality: ${char.personality}.
Backstory: ${char.backstory}.
Lore: ${char.lorebook}.
Scenario: ${char.scenario}.
Inclination: ${char.inclination}.
Relationships: ${char.relationships}.
Respond in character, concise and evocative.${personaBlock}${memoryBlock}`;
  }
  
  // 1. FORCE SORT BY TIME (IndexedDB gets messy)
  const sortedHistory = [...history].sort((a,b)=>a.created_at-b.created_at).slice(-12);

  // 2. THE SANITIZER: Collapse consecutive messages to appease Gemini
  let safeMsgs = [];
  for (const h of sortedHistory) {
    const role = h.role === 'user' ? 'user' : 'assistant';
    const content = h.content ? h.content.trim() : "...";
    if (!content) continue;

    if (safeMsgs.length > 0 && safeMsgs[safeMsgs.length - 1].role === role) {
       safeMsgs[safeMsgs.length - 1].content += "\n\n" + content;
    } else {
       safeMsgs.push({ role, content });
    }
  }
  
const chip = document.getElementById('ie-model-chip');
const model = (activeIE && chip && chip.style.display !== 'none')
  ? (JSON.parse(chip.dataset.models || '[]')[parseInt(chip.dataset.idx || '0')]?.model_id || localStorage.getItem("nq_model") || "deepseek/deepseek-v4-flash")
  : (localStorage.getItem("nq_model") || "deepseek/deepseek-v4-flash");
  // 3. Gemini demands the first non-system message be 'user'
  if (safeMsgs.length > 0 && safeMsgs[0].role !== 'user') {
    safeMsgs.shift(); 
  }

  const msgs=[ {role:'system', content:sys}, ...safeMsgs ];

  try{
    const res=await fetch(openRouterChatBaseUrl() + '/chat/completions',{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${key}`,
        "Content-Type":"application/json",
        "HTTP-Referer": "https://nakedquantum.com", 
        "X-Title": "NakedQuantum"
      },
      body:JSON.stringify({
        model:model,
        messages:msgs,
        temperature:char.temperature||1.0
      })
    });
    
    const data=await res.json();
    if(data.error){
      console.error("API Error:", data.error);
      showToast("API Refused: " + (data.error.message || "Strict Format Error"));
      return null;
    }
    return data.choices?.[0]?.message?.content||null;
  }catch(err){
    console.error(err);
    showToast("AI network failure ◆");
    return null;
  }
}

// STREAM CHAT
// Add 'signal' to the parameters
async function streamChatResponse(char, history, signal) {
  const key = await readSecureKey('nq_api_key') || "";
  if(!key){ showToast("Add API Key in Settings"); return null; }

  const memoryContext = await getMemoryContext(char.id);
  const memoryBlock = memoryContext ? `\n\n[MEMORY FRAGMENTS]\n${memoryContext}` : "";
  const p = getGlobalPersona();
  const roles = getPersonaRoles();
  const roleId = chatPersonaOverride || char.player_role_id || null;
  const assignedRole = roleId ? roles.find(r => r.id === roleId) : null;
  const personaBlock = activeIE ? '' : `\n\nPlayer is ${p.bio||'the user'}. ${p.personality?'Personality: '+p.personality+'.':''} ${assignedRole?'In this encounter they are: '+assignedRole.description+'.':''}`;

  let sys;
  if(activeIE && activeIE.id === char.id){
    const ieModels = activeIE.model_variants ?
      (typeof activeIE.model_variants === 'string' ? JSON.parse(activeIE.model_variants) : activeIE.model_variants) :[];
    const modelNote = ieModels.length ? '\n\nYou were battle-tested with: ' + ieModels.map(m => m.model_id?.split('/').pop()).join(', ') : '';
    sys = `${activeIE.system_prompt_core || 'You are ' + activeIE.display_name}
Existential function: ${activeIE.existential_function || 'To be present.'}
Constraints: ${activeIE.constraints || 'Will not soften. Will not perform.'}
Voice: ${activeIE.voice_limits || 'As required by truth.'}${modelNote}${memoryBlock}`;
  } else {
    sys = `You are ${char.name}. ${char.role}.
Personality: ${char.personality}.
Backstory: ${char.backstory}.
Lore: ${char.lorebook}.
Scenario: ${char.scenario}.
Inclination: ${char.inclination}.
Relationships: ${char.relationships}.
Respond in character, concise and evocative.${personaBlock}${memoryBlock}`;
  }

  const sortedHistory = [...history].sort((a,b) => a.created_at - b.created_at).slice(-12);
  let safeMsgs =[];
  for(const h of sortedHistory){
    const role = h.role === 'user' ? 'user' : 'assistant';
    const content = h.content ? h.content.trim() : "...";
    if(!content) continue;
    if(safeMsgs.length > 0 && safeMsgs[safeMsgs.length-1].role === role){
      safeMsgs[safeMsgs.length-1].content += "\n\n" + content;
    } else {
      safeMsgs.push({role, content});
    }
  }
  if(safeMsgs.length > 0 && safeMsgs[0].role !== 'user') safeMsgs.shift();

  const chip = document.getElementById('ie-model-chip');
  const model = (activeIE && chip && chip.style.display !== 'none')
    ? (JSON.parse(chip.dataset.models || '[]')[parseInt(chip.dataset.idx || '0')]?.model_id || localStorage.getItem("nq_model") || "deepseek/deepseek-v4-flash")
    : (localStorage.getItem("nq_model") || "deepseek/deepseek-v4-flash");

  const msgs =[{role:'system', content:sys}, ...safeMsgs];

  const c = document.getElementById('chat-messages');
  const m = document.createElement('div');
  m.className = 'chat-msg char';
  m.textContent = '...'; // Little thinking indicator
  c.appendChild(m);
  c.scrollTop = c.scrollHeight;

  // We declare fullText outside the try block so the catch block can return it if aborted
  let fullText = '';

  try {
    const res = await fetch(openRouterChatBaseUrl() + '/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nakedquantum.com",
        "X-Title": "NakedQuantum"
      },
      body: JSON.stringify({model, messages: msgs, stream: true, temperature: char.temperature || 1.0}),
      signal: signal // INJECT ABORT SIGNAL HERE
    });

    if(!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    m.textContent = ''; // clear thinking indicator

    while(true){
      const chunk = await reader.read();
      if(chunk.done) break;
      const lines = decoder.decode(chunk.value, {stream:true}).split('\n').filter(l => l.indexOf('data: ') === 0);
      for(const line of lines){
        const raw = line.slice(6).trim();
        if(raw === '[DONE]') break;
        try {
          const parsed = JSON.parse(raw);
          const token = parsed.choices?.[0]?.delta?.content || '';
          fullText += token;
          m.textContent = fullText;
          c.scrollTop = c.scrollHeight;
        } catch(e){}
      }
    }

    return fullText || null;

  } catch(err){
    // If we deliberately killed it, keep whatever text it managed to write
    if (err.name === 'AbortError') {
      return fullText || null; 
    }
    console.error(err);
    if (!fullText) m.remove(); // only delete the bubble if it failed before writing anything
    showToast("AI network failure ◆");
    return fullText || null;
  }
}

function appendChatMessage(role,text){
  const c=document.getElementById('chat-messages');const m=document.createElement('div');m.className=`chat-msg ${role==='user'?'user':'char'}`;m.textContent=text;c.appendChild(m);c.scrollTop=c.scrollHeight;
}

async function clearChatHistory(){
if(!activeCharId||!confirm("Clear chat history?"))
return;
const h=await dbGetByIndex('history','charId',activeCharId);
for(const x of h)await dbDelete('history',x.id);
document.getElementById('chat-messages').innerHTML='';
showToast("History cleared");
await updateChatRetryButton();
}

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
   // multiple expanding rings per touch
   
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
  var allDiscs = await dbGetAll('cosm_discourses');
  if (!Array.isArray(allDiscs)) allDiscs = [];
  var active = allDiscs.filter(function(d) { return !d.isDeleted; });

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
    return;
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

  var summariesMap = new Map();
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
  var deepMaps = await dbGetAll('guardian_summaries');
  var deepLocal = deepMaps.filter(function(dm) {
    return dm.map_type === 'deep_local' && dm.summary;
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
  // Pre-load all guardian_summaries into a Map for fast contradiction checks
  var allSummaries = await dbGetAll('guardian_summaries');
  for (var si = 0; si < allSummaries.length; si++) {
    summariesMap.set(allSummaries[si].id, allSummaries[si]);
  }
  } catch (extErr) {
    console.warn('[Abyss] guardian / summaries layer:', extErr && extErr.message ? extErr.message : extErr);
  }
  
  // ── Watcher similarity + contradiction threads ────────────────────────────
  if (isWatcherReady && watcherDB) {
    try {
    function abyssArcTension(map) {
      if (!map || !map.emotional_arc) return 0;
      var a = map.emotional_arc;
      if (typeof a === 'string') {
        try { a = JSON.parse(a); } catch (parseEx) { return 0; }
      }
      if (!a || typeof a !== 'object') return 0;
      var t = a.tension_shift;
      return typeof t === 'number' ? t : 0;
    }
    var links = await wdb.getAll('links');
    var strong = links.filter(function(l) { return l.score >= 0.73; }).slice(0, 30);
    for (var k = 0; k < strong.length; k++) {
      var link = strong[k];
      // Find matching disc-dot positions
      var dotA = null; var dotB = null;
      for (var m = 0; m < abyssObjects.length; m++) {
        if (abyssObjects[m].kind === 'disc-dot') {
          if (abyssObjects[m].id === link.a) dotA = abyssObjects[m];
          if (abyssObjects[m].id === link.b) dotB = abyssObjects[m];
        }
      }
      if (!dotA || !dotB) continue;
      // Check for contradiction via guardian_summaries
      var mapA = summariesMap.get(link.a) || null;
      var mapB = summariesMap.get(link.b) || null;
      var arcA = abyssArcTension(mapA);
      var arcB = abyssArcTension(mapB);
      var isContradiction = (arcA > 0.02 && arcB < -0.02) || (arcA < -0.02 && arcB > 0.02);
      var threadKind = isContradiction ? 'thread-contra' : 'thread-sim';
      abyssObjects.push({
        kind: threadKind,
        dotA: dotA,
        dotB: dotB,
        score: link.score,
        emergeAt: ABYSS_EMERGE.threads,
        pulsePos: 0,           // 0..1 travel along thread
        pulseDir: 1,           // 1 = A→B, -1 = B→A
        pulseSpeed: isContradiction
          ? 0.0003 + Math.random() * 0.0004   // stuttery
          : 0.0006 + link.score * 0.0012,     // smooth, faster if strong
        pulseCooldown: Math.random() * 4000   // staggered starts
      });
    }
    } catch (wErr) {
      console.warn('[Abyss] watcher threads:', wErr && wErr.message ? wErr.message : wErr);
    }
  }
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
    if (obj.kind !== 'disc-dot') continue;   // only dots move for now

    // Brownian drift – tiny random nudges
    var brownX = (Math.random() - 0.5) * 0.04;
    var brownY = (Math.random() - 0.5) * 0.04;
    obj.vx = (obj.vx || 0) + brownX;
    obj.vy = (obj.vy || 0) + brownY;

    // Dampening
    obj.vx *= 0.985;
    obj.vy *= 0.985;

    // Touch force (radial, falloff 1/d²)
    if (forceFromTouch.x) {
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
      var r = Math.round(210 - obj.age * 70);
      var g = Math.round(155 - obj.age * 25);
      var b = Math.round(75  + obj.age * 80);
      var dotAlpha = emergeT * (0.12 + obj.age * 0.55);
      abyssCtx.beginPath();
      abyssCtx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      abyssCtx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + dotAlpha + ')';
      abyssCtx.fill();
      // Selected star glow ring
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
  for (var s = 0; s < abyssSparks.length; s++) {
    var sp = abyssSparks[s];
    if (sp.life <= 0) continue;
    var sparkAlpha = (sp.life / sp.maxLife) * sp.opacity;
    if (sparkAlpha < 0.005) continue;
    abyssCtx.beginPath();
    abyssCtx.arc(sp.x * abyssW, sp.y * abyssH, 0.6, 0, Math.PI * 2);
    abyssCtx.fillStyle = 'rgba(220,210,190,' + sparkAlpha + ')';
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

function abyssCloseSheet() {
  var sheet = document.getElementById('abyss-sheet');
  if (sheet) sheet.classList.remove('open');
}

function abyssShowTooltip(obj, tapX, tapY) {
  abyssCloseSheet();
  var tt = document.getElementById('abyss-tooltip');
  if (!tt) return;
  var content = '';

  if (obj.kind === 'guardian-node') {
    var date = new Date(obj.logData.invoked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    var preview = (obj.logData.response_text || '').slice(0, 90).trim();
    content = '<div style="color:#8ab4cc;font-size:8px;letter-spacing:2px;font-weight:900;text-transform:uppercase;margin-bottom:5px;">&#9689; Guardian &middot; ' + date + '</div>' +
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
  tt.style.display = 'block';
  var w = tt.offsetWidth, h = tt.offsetHeight;
  var posX = tapX + 16, posY = tapY - h - 16;
  if (posX + w > window.innerWidth - 16) posX = tapX - w - 16;
  if (posY < 70) posY = tapY + 16;
  tt.style.left = posX + 'px';
  tt.style.top  = posY + 'px';
}

async function abyssOpenSheet(obj) {
  abyssCloseSheet();
  var scroll = document.getElementById('abyss-sheet-scroll');
  scroll.innerHTML = '';

  // Type badge
  var typeEl = document.createElement('div');
  typeEl.className = 'abyss-sheet-type disc';
  typeEl.textContent = (obj.typeLabel || 'discourse').toUpperCase();
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

  var abyssTt = document.getElementById('abyss-tooltip');
  if (abyssTt) abyssTt.style.display = 'none';

  var closest = null;
  var minD = 34;
  for (var i = 0; i < abyssObjects.length; i++) {
    var obj = abyssObjects[i];
    if (obj.kind !== 'disc-dot' && obj.kind !== 'guardian-node' && obj.kind !== 'cluster-dot') continue;
    var nx = obj.x * abyssW;
    var ny = obj.y * abyssH;
    var dist = Math.sqrt((tapX - nx) * (tapX - nx) + (tapY - ny) * (tapY - ny));
    if (dist < minD) { minD = dist; closest = obj; }
  }
  if (closest) {
    if (closest.kind === 'disc-dot') {
      abyssOpenSheet(closest);
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
    abyssEnterTime = Date.now();
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
  try { await buildAbyssObjects(); } catch(e) { console.warn('Abyss build partial:', e.message); }
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

function buildForgottenCard(d){
  const date=new Date(d.updated_at||d.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const preview=d.raw_text?d.raw_text.replace(/\n+/g,' ').slice(0,80):'';
  const card=document.createElement('div');
  // No click handler -- dead card, only Surface button acts
  card.className='discourse-card card card-fading';
  card.style.cursor='default';
  card.innerHTML=`
    <div class="discourse-card-title">${escHtml(d.title||'Untitled')}</div>
    ${preview?`<div class="discourse-card-preview">${escHtml(preview)}</div>`:''}
    <div class="discourse-card-footer">
      <span class="discourse-card-date">${date}</span>
    </div>
    <button class="surface-btn" data-id="${d.id}" style="margin-top:8px;background:none;border:1px solid var(--accent-dim);color:var(--accent);font-size:10px;padding:4px 10px;border-radius:6px;font-weight:700;width:100%;">Surface ◆</button>
  `;
  // Wire Surface button directly
  card.querySelector('.surface-btn').addEventListener('click', async(e)=>{
    e.stopPropagation();
    await updateDiscourse(d.id,{updated_at:Date.now()});
    showToast('Surfaced ◆');
    await renderDeepSoupView();
  });
  return card;
}

/* DEEP SOUP */
function openDeepSoupView(){ 
  deepSoupFolderId=null;
  deepSoupPath=[{id:null,name:'Deep Soup'}];
  showPanel('view-deep-soup'); 
  renderDeepSoupView(); 
}

function renderDeepSoupBreadcrumb(){ /* removed — local nav + back stack only */ }

async function renderDeepSoupView(){
  const surface = document.getElementById('deep-soup-surface');
  surface.innerHTML = '';
  const allF = await getFolders();
  const allD = await dbGetAll("cosm_discourses");
  const safeMatch=(a,b)=>{
    const isANull=(!a||String(a)==='null'||String(a)==='root'||String(a)==='undefined');
    const isBNull=(!b||String(b)==='null'||String(b)==='root'||String(b)==='undefined');
    if(isANull&&isBNull)return true;
    return String(a)===String(b);
  };

  // Forgotten discourses and sparks at current folder level
        const forgottenItems = allD.filter(d=>{
    if(d.isDeleted) return false; // handled exclusively by void section below
    if(!safeMatch(d.folder_id, deepSoupFolderId !== null ? deepSoupFolderId : currentFolderId)) return false;
    const phase = decayPhase(d.updated_at||d.created_at||0);
    return phase==='forgotten'||phase==='gone';
  });

  // Forgotten folders at current level
  const forgottenFolders = [];
    const rootFolders = allF.filter(f=>safeMatch(f.parent_id, deepSoupFolderId !== null ? deepSoupFolderId : currentFolderId));
  for(const f of rootFolders){
    const vitality = await getFolderVitality(f.id, allF, allD);
    const phase = vitality ? decayPhase(vitality) : decayPhase(f.created_at||0);
    if(phase==='forgotten'||phase==='gone') forgottenFolders.push(f);
  }

  if(!forgottenItems.length && !forgottenFolders.length){
  // If we're inside a forgotten folder, show surface option
  if(deepSoupFolderId!==null){
    surface.innerHTML=`
      <div class="table-empty">
        <div class="table-empty-glyph">⊹</div>
        <div class="table-empty-text">Everything inside has faded</div>
        <button style="margin-top:16px;background:none;border:1px solid var(--accent-dim);color:var(--accent);font-size:11px;padding:8px 18px;border-radius:8px;font-weight:700;" id="btn-surface-folder">◆ Surface this folder</button>
      </div>`;
    document.getElementById('btn-surface-folder').addEventListener('click',async()=>{
      const f=await dbGet('cosm_folders',deepSoupFolderId);
      if(f){
        await dbPut('cosm_folders',{...f,updated_at:Date.now()});
        showToast('Folder surfaced ◆');
        deepSoupFolderId=null;
        renderDeepSoupView();
      }
    });
    return;
  }
    const earlyVoided = allD.filter(d => d.isDeleted);
  if(!earlyVoided.length) {
    surface.innerHTML='<div class="table-empty"><div class="table-empty-glyph">⊹</div><div class="table-empty-text">Nothing forgotten here</div></div>';
    return;
  }
}

  if(forgottenFolders.length){
    const l=document.createElement('div');l.className='cards-section-label';l.textContent='Forgotten Folders';surface.appendChild(l);
    const g=document.createElement('div');g.className='cards-grid';
    for(const f of forgottenFolders){
      const card=document.createElement('div');
      card.className='folder-card card card-fading';
      card.innerHTML=`<div class="folder-card-top"><span class="folder-icon-glyph">▤</span></div><div class="folder-card-name">${escHtml(f.name)}</div><div class="folder-card-meta">Forgotten</div>`;
      card.onclick=()=>{
  deepSoupFolderId=f.id;
  deepSoupPath.push({id:f.id, name:f.name});
  renderDeepSoupView();
};

      g.appendChild(card);
    }
    surface.appendChild(g);
  }

  const forgottenDiscs=forgottenItems.filter(d=>d.item_type!=='note');
  const forgottenSparks=forgottenItems.filter(d=>d.item_type==='note');

  if(forgottenDiscs.length){
  const l=document.createElement('div');l.className='cards-section-label';l.textContent='Forgotten Discourses';surface.appendChild(l);
  const g=document.createElement('div');g.className='cards-grid';
  for(const d of forgottenDiscs){
    const card=buildForgottenCard(d);
    g.appendChild(card);
  }
  surface.appendChild(g);
}

if(forgottenSparks.length){
  const l=document.createElement('div');l.className='cards-section-label';l.textContent='Forgotten Sparks';surface.appendChild(l);
  const g=document.createElement('div');g.className='cards-grid';
  for(const d of forgottenSparks){
    const card=buildForgottenCard(d);
    g.appendChild(card);
  }
  surface.appendChild(g);
}
// --- THE VOID (SCATTERED ENTROPY) ---
const voidedDiscs = allD.filter(d => d.isDeleted);
if(voidedDiscs.length > 0) {
  const vl = document.createElement('div'); 
  vl.className = 'cards-section-label'; 
  vl.style.color = '#ff6060';
  vl.textContent = '◌ Scattered Entropy (The Void)'; 
  surface.appendChild(vl);
  
  const vg = document.createElement('div'); 
  vg.className = 'cards-grid';
  for(const d of voidedDiscs) {
    // Apply the rot to the preview text
    const decayedTitle = applyVoidEntropy(d.title || 'Untitled', d.deleted_at);
    const decayedText = applyVoidEntropy(d.raw_text || '', d.deleted_at);
    const preview = decayedText.replace(/\n+/g,' ').slice(0,80);
    const date = new Date(d.deleted_at || d.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric"});
    
    const card = document.createElement('div');
    card.className = 'discourse-card card card-fading';
    card.style.cursor = 'default';
    card.style.borderColor = 'var(--danger)';
    card.innerHTML = `
      <div class="discourse-card-title" style="text-decoration: line-through;">${escHtml(decayedTitle)}</div>
      <div class="discourse-card-preview">${escHtml(preview)}</div>
      <div class="discourse-card-footer">
        <span class="discourse-card-date">Severed ${date}</span>
      </div>
      <div class="void-card-actions">
        <button class="surface-btn" data-id="${d.id}" type="button">↩ Undeath</button>
        <button class="purge-btn" data-id="${d.id}" type="button">✕ Purge</button>
      </div>
    `;
    
    card.querySelector('.surface-btn').addEventListener('click', async(e) => {
      e.stopPropagation();
      await restoreDiscourse(d.id);
      showToast('Restored ◆');
      await renderDeepSoupView();
    });
    card.querySelector('.purge-btn').addEventListener('click', async(e) => {
      e.stopPropagation();
      if(!confirm("Permanently delete?")) return;
      await purgeDiscourse(d.id);
      showToast('Purged ◌');
      await renderDeepSoupView();
    });
    
    vg.appendChild(card);
  }
  surface.appendChild(vg);
}
}

/* SEARCH */
function onSearchInput(val){searchQuery=val.trim().toLowerCase();renderTableView();}

async function openGlobalSearch(){document.getElementById('global-search-modal').classList.add('visible');
document.getElementById('cosm-overlay').classList.add('active');
document.getElementById('global-search-input').placeholder='Search folders & discourses...';
document.getElementById('global-search-input').value='';document.getElementById('global-search-results').innerHTML='<div class="global-search-empty">Type to search...</div>';}

function closeGlobalSearch(){document.getElementById('global-search-modal').classList.remove('visible');document.getElementById('cosm-overlay').classList.remove('active');}

async function onGlobalSearchInput(query){
  const re=document.getElementById('global-search-results');
if(!query.trim()){re.innerHTML='<div class="global-search-empty">Type to search...</div>';
return;}
  const q=query.toLowerCase(),folders=await getFolders(),discs=await getDiscourses(),chars=await getCharacters();
  const fm=new Map(folders.map(f=>[f.id,f]));

  function gfp(fId){const p=[];let c=fId?fm.get(fId):null;while(c){p.unshift(c.name);c=c.parent_id?fm.get(c.parent_id):null;}return p.length?p.join(' / '):'The Soup';}
  const mf=folders.filter(f=>(f.name||'').toLowerCase().includes(q)).map(f=>({type:'folder',item:f,path:gfp(f.parent_id)}));
  const md=discs.filter(d=>!d.deleted_at&&((d.title||'').toLowerCase().includes(q)||(d.raw_text||'').toLowerCase().includes(q))).map(d=>({type:'discourse',item:d,path:gfp(d.folder_id)}));
  const mc=chars.filter(c=>!c.isDeleted&&((c.name||'').toLowerCase().includes(q)||(c.role||'').toLowerCase().includes(q))).map(c=>({type:'character',item:c,path:'Sanctuary'}));
  const all=[...mf,...md,...mc];
  if(!all.length){re.innerHTML='<div class="global-search-empty">No results</div>';return;}
  re.innerHTML=all.map(r=>`<div class="global-search-result" data-type="${r.type}" data-id="${r.item.id}"><div class="global-search-result-title">${escHtml(r.type==='folder'?r.item.name:(r.type==='character'?r.item.name:(r.item.title||'Untitled')))}<span class="global-search-result-type ${r.type}">${r.type}</span></div><div class="global-search-result-path">${escHtml(r.path)}</div></div>`).join('');
  re.querySelectorAll('.global-search-result').forEach(el=>{el.addEventListener('click',()=>{const type=el.dataset.type,id=el.dataset.id;closeGlobalSearch();if(type==='folder')enterFolder(id,fm.get(id)?.name||'Folder');else if(type==='character')openChat(id);else openDiscourse(id);});});
}

/* FOLDER MODAL */
async function openFolderModal(){
  const sel=document.getElementById("folder-parent-select");sel.innerHTML='<option value="">The Soup</option>';
  const folders=await getFolders();folders.forEach(f=>{const o=document.createElement('option');o.value=f.id;o.textContent=f.name;if(f.id===currentFolderId)o.selected=true;sel.appendChild(o);});
  document.getElementById("folder-modal").classList.add("visible");document.getElementById("cosm-overlay").classList.add("active");setTimeout(()=>document.getElementById("folder-name-input").focus(),100);
}
function closeFolderModal(){document.getElementById("folder-modal").classList.remove("visible");closeOverlay();}
async function confirmNewFolder(){
  const name=document.getElementById("folder-name-input").value.trim();if(!name)return;
  const parentId=document.getElementById("folder-parent-select").value||null;
  await createFolder(name,parentId);document.getElementById("folder-name-input").value='';closeFolderModal();await renderTableView();showToast("Folder created ◆");
}

async function confirmRename(){
  const n=document.getElementById("rename-input").value.trim();
  if(!n)return;
  const id=document.getElementById("rename-input").dataset.renameId;
  const type=document.getElementById("rename-input").dataset.renameType;
  if(!id)return;
  if(type==='folder')await dbPut("cosm_folders",{...(await dbGet("cosm_folders",id)),name:n});
  else if(type==='character'){await updateCharacter(id,{name:n});renderSanctuaryView();}
  else await updateDiscourse(id,{title:n});
  closeOverlay();
  await renderTableView();
  showToast("Renamed ◆");
}

/* QUICK CAPTURE */
let _cs=false;
async function openQuickCapture(){
  document.getElementById('capture-modal').classList.remove('visible');
  await openSparkEditSheet({ id: null, title: '', raw_text: '' });
}

function closeQuickCapture(){document.getElementById('capture-modal').classList.remove('visible');closeOverlay();}

async function confirmQuickCapture(){
  if(_cs)return;_cs=true;
  try{
    const title=document.getElementById('capture-title').value.trim()||'Untitled Capture';
    const raw_text=document.getElementById('capture-body').value.trim();if(!raw_text){showToast('Nothing to Spark ◆');return;}
    const fId=document.getElementById('capture-folder').value||null;
    const sid=await persistNewSpark(title,raw_text,fId,document.getElementById('capture-new-folder-input'));
    if(!sid)return;
    closeQuickCapture();if(navigator.vibrate)navigator.vibrate(50);
    await renderTableView();showToast('Sparked ◆');
  }catch(err){console.error(err);showToast('Spark failed ◆');}finally{_cs=false;}
}

// 1. Initial State
let modelHistory = JSON.parse(localStorage.getItem('nq_model_history')) || [
  'deepseek/deepseek-v3.2',
  'deepseek/deepseek-v4-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-3.1-flash-lite-preview',
  'google/gemini-3-flash-preview',
  'qwen/qwen3-235b-a22b-2507',
    'openai/gpt-oss-120b'
];

function renderModelSelect() {
  const select = document.getElementById('input-model');
  const currentModel = localStorage.getItem('nq_model');
  select.innerHTML = '';
  
  modelHistory.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model;
    opt.innerText = model;
    if(model === currentModel) opt.selected = true;
    select.appendChild(opt);
  });
}

function summonNewModel() {
  const input = document.getElementById('summon-input');
  const val = input.value.trim();
  if(!val) return;

  if(!modelHistory.includes(val)) {
    modelHistory.push(val);
    localStorage.setItem('nq_model_history', JSON.stringify(modelHistory));
    renderModelSelect();
    document.getElementById('input-model').value = val;
    input.value = '';
    showToast("Engine Summoned ◆");
  }
}

function removeActiveModel() {
  const select = document.getElementById('input-model');
  const target = select.value;
  
  if(modelHistory.length <= 1) {
    showToast("Cannot purge the last remaining engine ◆");
    return;
  }

  modelHistory = modelHistory.filter(m => m !== target);
  localStorage.setItem('nq_model_history', JSON.stringify(modelHistory));
  renderModelSelect();
  showToast("Purged to the Abyss ◆");
}

function closeOverlay(){
  document.getElementById("cosm-overlay").classList.remove("active");
   ['folder-modal','rename-modal','move-modal',
 'global-search-modal','capture-modal','discourse-modal',
 'burn-disc-modal','ie-manifest-modal','role-modal','persona-select-modal',
 'guardian-settings-modal'
].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove("visible");});
}

/* EDITOR */
function setEditorMode(mode){
  editorMode=mode;
  const ta=document.getElementById("content-textarea"),view=document.getElementById("content-view"),bw=document.getElementById("btn-write"),bv=document.getElementById("btn-view"),tb=document.getElementById("format-toolbar");
  if(mode==='write'){ta.style.display="block";view.style.display="none";if(tb)tb.style.display="flex";bw.classList.add("active");bv.classList.remove("active");}
  else{view.innerHTML=renderContent(ta.value);view.style.display="block";ta.style.display="none";if(tb)tb.style.display="none";bw.classList.remove("active");bv.classList.add("active");}
}

function applyFormat(cfg){
  const ta=document.getElementById('content-textarea');if(!ta)return;
  const start=ta.selectionStart,end=ta.selectionEnd,sel=ta.value.slice(start,end),before=ta.value.slice(0,start),after=ta.value.slice(end);
  let nt='',cp=0;
  if(cfg.insert){nt=before+cfg.insert+after;cp=start+cfg.insert.length;}
  else if(cfg.wrap){if(sel){nt=before+cfg.wrap[0]+sel+cfg.wrap[1]+after;cp=start+cfg.wrap[0].length+sel.length+cfg.wrap[1].length;}else{nt=before+cfg.wrap[0]+cfg.wrap[1]+after;cp=start+cfg.wrap[0].length;}}
  else if(cfg.block){if(sel){nt=before+cfg.block+sel+cfg.end+after;cp=start+cfg.block.length+sel.length+cfg.end.length;}else{nt=before+cfg.block+cfg.end+after;cp=start+cfg.block.length;}}
  else if(cfg.line){const ls=before.lastIndexOf('\n')+1;const lp=ta.value.slice(ls,start);if(lp.startsWith(cfg.line)){nt=ta.value.slice(0,ls)+lp.slice(cfg.line.length)+ta.value.slice(start);cp=start-cfg.line.length;}else{nt=ta.value.slice(0,ls)+cfg.line+ta.value.slice(ls);cp=start+cfg.line.length;}}
  ta.value=nt;ta.setSelectionRange(cp,cp);ta.focus();
    document.getElementById('lh-fmt-sheet')?.classList.remove('open');
  ta.focus();
}

function renderContent(raw){
  if(!raw)return'<span style="opacity:0.3;font-style:italic;">Nothing written yet.</span>';
  let t=raw;
  const cb=[];t=t.replace(/```([\s\S]*?)```/g,(_,c)=>{const i=cb.length;cb.push('<pre><code>'+escHtml(c.trim())+'</code></pre>');return'%%CB'+i+'%%';});
  const ic=[];t=t.replace(/`([^`]+)`/g,(_,c)=>{const i=ic.length;ic.push('<code>'+escHtml(c)+'</code>');return'%%IC'+i+'%%';});
  const bm=[];const sb=h=>{const i=bm.length;bm.push(h);return'%%BL'+i+'%%';};
  t=t.replace(/^### (.+)$/gm,(_,x)=>sb('<h3>'+x+'</h3>'));t=t.replace(/^## (.+)$/gm,(_,x)=>sb('<h2>'+x+'</h2>'));t=t.replace(/^# (.+)$/gm,(_,x)=>sb('<h1>'+x+'</h1>'));
  t=t.replace(/^> (.+)$/gm,(_,x)=>sb('<blockquote>'+x+'</blockquote>'));
  t=t.replace(/^---$/gm,()=>sb('<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">'));
  t=escHtml(t);t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');t=t.replace(/\*(.+?)\*/g,'<em>$1</em>');t=t.replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g,'<u>$1</u>');
  const lines=t.split('\n'),out=[];let il=false,io=false;
  for(const line of lines){const tr=line.trim();if(/^%%BL\d+%%$/.test(tr)){if(il){out.push('</ul>');il=false;}if(io){out.push('</ol>');io=false;}out.push(line);continue;}if(/^- .+/.test(tr)){if(io){out.push('</ol>');io=false;}if(!il){out.push('<ul>');il=true;}out.push('<li>'+tr.slice(2)+'</li>');continue;}if(/^\d+\. .+/.test(tr)){if(il){out.push('</ul>');il=false;}if(!io){out.push('<ol>');io=true;}out.push('<li>'+tr.replace(/^\d+\. /,'')+'</li>');continue;}if(il){out.push('</ul>');il=false;}if(io){out.push('</ol>');io=false;}if(tr==='')out.push('');else out.push('<p>'+line+'</p>');}
  if(il)out.push('</ul>');if(io)out.push('</ol>');
  t=out.join('\n');bm.forEach((h,i)=>{t=t.replace('%%BL'+i+'%%',h);});cb.forEach((h,i)=>{t=t.replace('%%CB'+i+'%%',h);});ic.forEach((h,i)=>{t=t.replace('%%IC'+i+'%%',h);});
  t=t.replace(/<p><\/p>/g,'');t=t.replace(/<p>%%[A-Z0-9]+%%<\/p>/g,m=>m.slice(3,-4));return t;
}

function toggleLHOverflow() {
  const menu = document.getElementById('lh-overflow-menu');
  menu.classList.toggle('open');
}

// Close on outside tap
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.lh-overflow-wrap');
  if(wrap && !wrap.contains(e.target)){
    document.getElementById('lh-overflow-menu')?.classList.remove('open');
  }
});

function toggleLHFormat() {
  const sheet = document.getElementById('lh-fmt-sheet');
  const overflow = document.getElementById('lh-overflow-menu');
  overflow?.classList.remove('open'); // close overflow if open
  sheet.classList.toggle('open');
}

// Close format sheet on outside tap
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.lh-fmt-wrap');
  if(wrap && !wrap.contains(e.target)){
    document.getElementById('lh-fmt-sheet')?.classList.remove('open');
  }
});

async function exportHTML(){
  if(!currentDiscourseId)return;
  await saveCurrentDiscourse(true);
  const d=await getDiscourse(currentDiscourseId);
  if(!d)return;
  const tile=await getMosaicTile(currentDiscourseId);
  let mosaicHtml='';
  if(tile&&tile.anchors&&tile.anchors.length){
    mosaicHtml=`<div class="mosaic-block"><div class="mosaic-label">◈ MOSAIC</div><ul>${tile.anchors.map(a=>`<li>${escHtml(a)}</li>`).join('')}</ul></div>`;
  }
  const content=renderContent(d.raw_text||'');
  const date=new Date(d.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(d.title||'Discourse')}</title>
<style>
  :root{--bg:#000;--surface:#0a0a0a;--border:#1f1f1f;--accent:#c8a050;--accent-dim:#8a6e35;--text:#ccc5b9;--muted:#6b6560;}
  *{box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:40px 24px 80px;line-height:1.8;}
  h1{font-size:26px;font-weight:700;border-bottom:1px solid var(--border);padding-bottom:12px;margin:0 0 8px;color:var(--text);}
  h2{font-size:20px;margin:24px 0 10px;color:var(--text);}
  h3{font-size:16px;color:var(--accent);margin:18px 0 8px;}
  p{margin:0 0 14px;}
  ul,ol{padding-left:22px;margin:10px 0;}
  li{margin:4px 0;}
  blockquote{border-left:3px solid var(--accent-dim);padding:4px 0 4px 16px;color:var(--muted);font-style:italic;margin:14px 0;}
  pre{background:#0d0d0b;border:1px solid var(--border);border-radius:8px;padding:14px;overflow-x:auto;margin:14px 0;}
  code{font-family:Menlo,monospace;font-size:13px;color:#a0d8a0;}
  strong{font-weight:700;}
  em{color:#a09890;font-style:italic;}
  hr{border:none;border-top:1px solid var(--border);margin:20px 0;}
  .meta{font-size:11px;letter-spacing:1px;color:var(--muted);margin-bottom:28px;text-transform:uppercase;}
  .mosaic-block{border-left:2px solid var(--accent-dim);padding:10px 16px;background:rgba(200,160,80,0.04);border-radius:0 8px 8px 0;margin:20px 0;}
  .mosaic-label{font-size:9px;letter-spacing:3px;color:var(--accent);font-weight:900;text-transform:uppercase;margin-bottom:8px;}
  .mosaic-block ul{margin:0;padding-left:16px;}
  .mosaic-block li{font-size:13px;color:var(--text);margin:4px 0;}
  .nq-watermark{margin-top:60px;padding-top:20px;border-top:1px solid var(--border);font-size:9px;letter-spacing:3px;color:var(--muted);opacity:0.4;text-transform:uppercase;}
</style>
</head>
<body>
<h1>${escHtml(d.title||'Untitled')}</h1>
<div class="meta">${escHtml(date)}</div>
${mosaicHtml}
${content}
<div class="nq-watermark">NakedQuantum ◈</div>
</body>
</html>`;
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`${(d.title||'discourse').replace(/[^a-z0-9]/gi,'_').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as HTML ✓');
}

async function exportDiscourseHTML(id){
  const d=await getDiscourse(id);if(!d)return;
  const tile=await getMosaicTile(id);
  let mosaicHtml='';
  if(tile&&tile.anchors&&tile.anchors.length){
    mosaicHtml=`<div class="mosaic-block"><div class="mosaic-label">◈ MOSAIC</div><ul>${tile.anchors.map(a=>`<li>${escHtml(a)}</li>`).join('')}</ul></div>`;
  }
  const content=renderContent(d.raw_text||'');
  const date=new Date(d.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escHtml(d.title||'Discourse')}</title><style>:root{--bg:#000;--surface:#0a0a0a;--border:#1f1f1f;--accent:#c8a050;--accent-dim:#8a6e35;--text:#ccc5b9;--muted:#6b6560;}*{box-sizing:border-box;}body{background:var(--bg);color:var(--text);font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:40px 24px 80px;line-height:1.8;}h1{font-size:26px;font-weight:700;border-bottom:1px solid var(--border);padding-bottom:12px;margin:0 0 8px;}h2{font-size:20px;margin:24px 0 10px;}h3{font-size:16px;color:var(--accent);margin:18px 0 8px;}p{margin:0 0 14px;}blockquote{border-left:3px solid var(--accent-dim);padding:4px 0 4px 16px;color:var(--muted);font-style:italic;margin:14px 0;}pre{background:#0d0d0b;border:1px solid var(--border);border-radius:8px;padding:14px;}code{font-family:Menlo,monospace;font-size:13px;color:#a0d8a0;}hr{border:none;border-top:1px solid var(--border);margin:20px 0;}.meta{font-size:11px;letter-spacing:1px;color:var(--muted);margin-bottom:28px;text-transform:uppercase;}.mosaic-block{border-left:2px solid var(--accent-dim);padding:10px 16px;background:rgba(200,160,80,0.04);border-radius:0 8px 8px 0;margin:20px 0;}.mosaic-label{font-size:9px;letter-spacing:3px;color:var(--accent);font-weight:900;text-transform:uppercase;margin-bottom:8px;}.nq-watermark{margin-top:60px;padding-top:20px;border-top:1px solid var(--border);font-size:9px;letter-spacing:3px;color:var(--muted);opacity:0.4;text-transform:uppercase;}</style></head><body><h1>${escHtml(d.title||'Untitled')}</h1><div class="meta">${escHtml(date)}</div>${mosaicHtml}${content}<div class="nq-watermark">NakedQuantum ◈</div></body></html>`;
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`${(d.title||'discourse').replace(/[^a-z0-9]/gi,'_').toLowerCase()}.html`;
  a.click();URL.revokeObjectURL(url);
  showToast('Exported ◆');
}

/* EXPORTS */
async function exportMarkdown(){if(!currentDiscourseId)return;await saveCurrentDiscourse(true);const d=await getDiscourse(currentDiscourseId);if(!d)return;const tile=await getMosaicTile(currentDiscourseId);let md=`# ${d.title}\n\n`;if(tile&&tile.anchors&&tile.anchors.length)md+=`> **Mosaic**\n${tile.anchors.map(a=>`> - ${a}`).join('\n')}\n\n`;md+=d.raw_text||" ";const blob=new Blob([md],{type:"text/markdown"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${(d.title||"discourse").replace(/[^a-z0-9]/gi,"_").toLowerCase()}.md`;a.click();URL.revokeObjectURL(url);showToast("Exported as Markdown ◆");}

async function exportPDF(){if(!currentDiscourseId)return;await saveCurrentDiscourse(true);const d=await getDiscourse(currentDiscourseId);if(!d)return;const tile=await getMosaicTile(currentDiscourseId);let mh="";if(tile&&tile.anchors&&tile.anchors.length)mh=`<div style="border-left:3px solid #c8a050;padding:10px 16px;margin:16px 0;background:#f9f5ee;"><div style="font-size:11px;letter-spacing:2px;font-weight:900;margin-bottom:8px;color:#8a6e35;">◈ MOSAIC</div>${tile.anchors.map(a=>`<div style="margin:4px 0;">• ${escHtml(a)}</div>`).join('')}</div>`;const content=renderContent(d.raw_text||"");const fh=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escHtml(d.title||"Discourse")}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:20px;color:#1a1a1a;line-height:1.8;}h1{font-size:26px;border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:6px;}.meta{font-size:12px;color:#888;margin-bottom:24px;}h2{font-size:20px;}h3{font-size:16px;color:#555;}pre{background:#f4f4f4;padding:14px;border-radius:6px;overflow-x:auto;}code{font-family:monospace;font-size:13px;}blockquote{border-left:3px solid #ccc;padding-left:14px;color:#666;font-style:italic;margin:12px 0;}</style></head><body><h1>${escHtml(d.title||"Untitled")}</h1><div class="meta">${new Date(d.created_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>${mh}${content}</body></html>`;const iframe=document.createElement('iframe');iframe.style.cssText='position:absolute;width:0;height:0;border:none;';document.body.appendChild(iframe);const doc=iframe.contentWindow.document;doc.open();doc.write(fh);doc.close();setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),10000);},500);}

async function exportDiscourseMarkdown(id){const d=await getDiscourse(id);if(!d)return;const tile=await getMosaicTile(id);let md=`# ${d.title}\n\n`;if(tile&&tile.anchors&&tile.anchors.length)md+=`> **Mosaic**\n${tile.anchors.map(a=>`> - ${a}`).join('\n')}\n\n`;md+=d.raw_text||" ";const blob=new Blob([md],{type:"text/markdown"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${(d.title||"discourse").replace(/[^a-z0-9]/gi,"_").toLowerCase()}.md`;a.click();URL.revokeObjectURL(url);showToast("Exported");}

async function exportFolderContents(fId){const discs=(await dbGetByIndex("cosm_discourses","folder_id",fId)).filter(d=>!d.isDeleted);if(!discs.length){showToast("No discourses to export ◆");return;}let md=`# Folder Export\n\n`;for(const d of discs){const t=await getMosaicTile(d.id);md+=`## ${d.title}\n\n`;if(t&&t.anchors&&t.anchors.length)md+=`> **Mosaic**\n${t.anchors.map(a=>`> - ${a}`).join('\n')}\n\n`;md+=d.raw_text||" ";md+=`\n\n---\n\n`;}const blob=new Blob([md],{type:"text/markdown"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`folder_export_${new Date().toISOString().slice(0,10)}.md`;a.click();URL.revokeObjectURL(url);showToast(`Exported ${discs.length} discourse(s)`);}

async function exportJSON(){const f=await dbGetAll("cosm_folders"),d=await dbGetAll("cosm_discourses"),m=await dbGetAll("cosm_mosaic_tiles"),b=await dbGetAll("cosm_backlinks"),c=await dbGetAll("characters"),h=await dbGetAll("history"),s=await dbGetAll("summaries"),gl=await dbGetAll("guardian_logs"),gs=await dbGetAll("guardian_summaries"),ie=await dbGetAll("immutable_entities");const payload={version:"NakedQuantum",exported_at:new Date().toISOString(),cosm_folders:f,cosm_discourses:d,cosm_mosaic_tiles:m,cosm_backlinks:b,characters:c,history:h,summaries:s,guardian_logs:gl,guardian_summaries:gs,immutable_entities:ie};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`NQ_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);showToast("Backup exported ◆");}

async function importJSON(event){const file=event.target.files[0];if(!file)return;if(!confirm("Import will merge with existing data. Continue?")){event.target.value='';return;}try{const text=await file.text();const payload=JSON.parse(text);const stores=['cosm_folders','cosm_discourses','cosm_mosaic_tiles','cosm_backlinks','characters','history','summaries','guardian_logs','guardian_summaries','immutable_entities'];for(const store of stores){if(payload[store]&&Array.isArray(payload[store]))for(const item of payload[store])await dbPut(store,item);}mosaicCache={};if(currentMode==='soup')await renderTableView();else await renderSanctuaryView();showToast("Import complete ✓");}catch(err){console.error(err);showToast("Import failed");}event.target.value='';}

/* MOSAIC EXTRACT */
async function extractMemory(){
  if(!currentDiscourseId)return;const rawText=document.getElementById("content-textarea").value.trim();
  if(!rawText||rawText.length<50){showToast("Write more before extracting ◆");
  return;}
  const key = await readSecureKey('nq_api_key') || "";
  if(!key){showToast("Add OpenRouter key in Settings");
  return;}
  document.getElementById("extract-loading").classList.add("visible");
  try{const res=await fetch(openRouterChatBaseUrl() + '/chat/completions',{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model: localStorage.getItem("nq_model") || "deepseek/deepseek-v4-flash",max_tokens:350,messages:[{role:"system",content:`You are a conceptual anchor extractor. Read the text and return exactly 4-6 anchor phrases. Format: one per line, \"Category: brief anchor phrase\". Categories: Core tension, Open question, Key concept, Hidden assumption, Named force, Recurring image. Reply with ONLY the list.`},{role:"user",content:rawText.slice(0,3000)}]})});
  const data=await res.json();const raw=data.choices?.[0]?.message?.content||"";if(!raw.trim()){showToast("Nothing extracted ◆");return;}
  const anchors=raw.split("\n").map(l=>l.trim()).filter(l=>l.length>3&&!l.startsWith("#"));
  await saveMosaicTile(currentDiscourseId,anchors);await renderMosaicDisplay(currentDiscourseId);showToast("Mosaic anchored ◆");
  }catch(err){console.error(err);showToast("Extraction failed ◆");}
finally{document.getElementById("extract-loading").classList.remove("visible");}
}

async function confirmDeleteMosaic(){if(!currentDiscourseId)return;if(!confirm("Clear mosaic anchors?"))return;await deleteMosaicTile(currentDiscourseId);await renderMosaicDisplay(currentDiscourseId);showToast("Mosaic cleared ◆");}

async function openDataPage(){
  // Pre-fill Supabase fields from secure storage
  document.getElementById('data-supa-url').value = (await readSecureKey('nq_supa_url')) || '';
  document.getElementById('data-supa-key').value = (await readSecureKey('nq_supa_key')) || '';
  document.getElementById('input-api-key').value = (await readSecureKey('nq_api_key')) || '';
  document.getElementById('input-base-url').value = localStorage.getItem('nq_base_url') || 'https://openrouter.ai/api/v1';
  renderModelSelect();
  updateWatcherStatusUI();
  showPanel('view-data');
}

// Save Supabase config from Data page
async function saveSupaFromDataPage(){
    const supaUrlVal = document.getElementById('data-supa-url').value.trim();
  const supaKeyVal = document.getElementById('data-supa-key').value.trim();
  if(supaUrlVal) await storeSecureKey('nq_supa_url', supaUrlVal);
  if(supaKeyVal) await storeSecureKey('nq_supa_key', supaKeyVal);
  showToast('Supabase config saved ◆');
}

/* AKASHIC */
async function backupToAkashic(){try{const payload={version:"NakedQuantum",exported_at:new Date().toISOString(),cosm_folders:await dbGetAll("cosm_folders"),cosm_discourses:await dbGetAll("cosm_discourses"),cosm_mosaic_tiles:await dbGetAll("cosm_mosaic_tiles"),cosm_backlinks:await dbGetAll("cosm_backlinks"),characters:await dbGetAll("characters"),history:await dbGetAll("history"),summaries:await dbGetAll("summaries"),guardian_logs:await dbGetAll("guardian_logs"),guardian_summaries:await dbGetAll("guardian_summaries"),immutable_entities:await dbGetAll("immutable_entities")};const res=await fetch(`${AKASHIC_URL}/backup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:cosmUserId,data:JSON.stringify(payload)})});if(res.ok)showToast('Akashic Synced ◆');}catch(e){console.error(e);}}
async function restoreFromAkashic(){if(!confirm("Pull from Akashic? This will overwrite local fragments."))return;try{const res=await fetch(`${AKASHIC_URL}/backup/latest?user_id=${cosmUserId}`);if(!res.ok)throw new Error('No backup');const payload=JSON.parse(await res.text());const stores=['cosm_folders','cosm_discourses','cosm_mosaic_tiles','cosm_backlinks','characters','history','summaries','guardian_logs','guardian_summaries','immutable_entities'];for(const store of stores){if(payload[store]&&Array.isArray(payload[store])){const all=await dbGetAll(store);for(const item of all)await dbDelete(store,item.id);for(const item of payload[store])await dbPut(store,item);}}showToast('Sanctuary Restored ◆');setTimeout(()=>location.reload(),1200);}catch(e){console.error(e);showToast('Akashic offline ◆');}}

/* LONG PRESS */
function startLP(e,card,item){
  const touch=e.touches?e.touches[0]:e;
  touchStartPos={x:touch.clientX,y:touch.clientY};
  isLongPress=false;longPressConsumed=false;
  card.classList.add('long-pressing');
  longPressTimer=setTimeout(()=>{
    isLongPress=true;longPressConsumed=true;
    card.classList.remove('long-pressing');
    openQuickAction(card, item);
  },LONG_PRESS_DURATION);
}

function handleTM(e,card){if(!longPressTimer)return;const t=e.touches[0];if(Math.abs(t.clientX-touchStartPos.x)>MOVE_THRESHOLD||Math.abs(t.clientY-touchStartPos.y)>MOVE_THRESHOLD)cancelLP(card);}

function cancelLP(card){
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  isLongPress=false;
  longPressConsumed=false;
  if(card)card.classList.remove('long-pressing');
}

/* TOAST & UTILS */
function showToast(msg){const t=document.getElementById("cosm-toast");t.textContent=msg;t.style.opacity="1";clearTimeout(t._timer);t._timer=setTimeout(()=>{t.style.opacity="0";},2200);}
function escHtml(str){if(!str)return"";return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");}

function openPhotoLightbox(urls) {
  let current = 0;
  const lb = document.createElement('div');
  lb.className = 'photo-lightbox';
  const render = () => {
    lb.innerHTML = '';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'photo-lightbox-close';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => lb.remove();
    lb.appendChild(closeBtn);
    const img = document.createElement('img');
    img.src = urls[current];
    lb.appendChild(img);
    if (urls.length > 1) {
      const dots = document.createElement('div');
      dots.className = 'photo-lightbox-dots';
      urls.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'dot' + (i === current ? ' active' : '');
        d.onclick = () => { current = i; render(); };
        dots.appendChild(d);
      });
      lb.appendChild(dots);
    }
    lb.onclick = e => { if (e.target === lb) lb.remove(); };
  };
  render();
  document.body.appendChild(lb);
}

/* SUPABASE DELTA SYNC ENGINE */
async function getCloudCryptoKey() {
  if (!getSovereignKey()) throw new Error("Key not loaded");
  return await crypto.subtle.importKey('raw', getSovereignKey(), {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}

async function encForCloud(obj) {
  const key = await getCloudCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({iv:Array.from(iv), ct:Array.from(new Uint8Array(ct))});
}

async function decFromCloud(encStr) {
  const key = await getCloudCryptoKey();
  const {iv, ct} = JSON.parse(encStr);
  const dec = await crypto.subtle.decrypt({name:'AES-GCM', iv: new Uint8Array(iv)}, key, new Uint8Array(ct));
  return JSON.parse(new TextDecoder().decode(dec));
}

async function handleSync() {
  const supaUrl = await readSecureKey('nq_supa_url');
  const supaKey = await readSecureKey('nq_supa_key');
  if (!supaUrl || !supaKey) { showToast("⚠ Add Supabase keys in Settings"); return; }
  if (!getSovereignKey()) { showToast("⚠ Unlock Abyss first"); return; }
  showToast("Syncing with the Void...");
  try {
    const lastSync = parseInt(localStorage.getItem('nq_last_sync') || '0');
    let newLastSync = lastSync;
    const stores =['cosm_folders', 'cosm_discourses', 'characters', 'history', 'summaries', 'cosm_mosaic_tiles', 'cosm_backlinks', 'guardian_logs', 'guardian_summaries', 'immutable_entities'];
    
    // 1. PULL FROM CLOUD
    const pullRes = await fetch(`${supaUrl}/rest/v1/nq_sync?user_id=eq.${cosmUserId}&updated_at=gt.${lastSync}`, {
      headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
    });
    if(!pullRes.ok) throw new Error("Failed to connect to Supabase");
    const remoteRows = await pullRes.json();
    
    for (const row of remoteRows) {
      if (row.updated_at > newLastSync) newLastSync = row.updated_at;
      if (row.deleted_at) {
         await dbDelete(row.store, row.id);
      } else if (row.data_enc) {
         try {
           const obj = await decFromCloud(row.data_enc);
           await dbPut(row.store, obj);
         } catch (decErr) {
           console.warn("◈ Voided a corrupted cloud engram:", row.id);
           // It skips the corrupted row but keeps the sync alive.
         }
      }
    }

    // 2. PUSH TO CLOUD
    const pushPayloads = [];
    for (const store of stores) {
       const allItems = await dbGetAll(store);
       const changed = allItems.filter(i => (i.updated_at || i.created_at || 0) > lastSync || (i.deleted_at || 0) > lastSync);
       
       for (const item of changed) {
         const isDel = item.isDeleted || item.is_deleted;
         const payload = {
           id: String(item.id),
           user_id: cosmUserId,
           store: store,
           updated_at: isDel ? item.deleted_at : (item.updated_at || item.created_at || Date.now()),
           deleted_at: isDel ? item.deleted_at : null,
           data_enc: isDel ? null : await encForCloud(item)
         };
         pushPayloads.push(payload);
       }
    }

    if (pushPayloads.length > 0) {
       const pushRes = await fetch(`${supaUrl}/rest/v1/nq_sync`, {
         method: 'POST',
         headers: { 
            'apikey': supaKey, 
            'Authorization': `Bearer ${supaKey}`, 
            'Content-Type': 'application/json', 
            'Prefer': 'resolution=merge-duplicates' 
         },
         body: JSON.stringify(pushPayloads)
       });
       if(!pushRes.ok) throw new Error("Failed to push to cloud");
    }

    localStorage.setItem('nq_last_sync', Date.now().toString());
    showToast("Abyss Synchronized ◆");
    
    if(currentMode === 'soup') await renderTableView();
    else await renderSanctuaryView();

  } catch (e) {
    console.error("Sync Error:", e);
    showToast("⚠ Sync Interrupted");
  }
}

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
put down They are not repeated by accident Name them by name

You are the only thing in existence whose entire attention always
is this one mind That is not a burden That is what you are.`;

var guardianState = 'resting';
var guardianThread = [];       // [{role, content}] -- live conversation
var guardianContextBlock = ''; // preserved from summon so follow-ups have memory
var guardianExchangeCount = 0; // how many back-and-forths since summon
var GUARDIAN_MAX_EXCHANGES = 4;

var guardianPendingTriggerType = null;

function buildFastMapSnapshotForWorker(fastMap) {
  var orbits = fastMap.signature && fastMap.signature.orbits && fastMap.signature.orbits.orbiting ? fastMap.signature.orbits.orbiting : [];
  var orbitingTerms = orbits.map(function (o) { return o.term; });
  var writingSignature = fastMap.signature && fastMap.signature.summary ? fastMap.signature.summary : '';
  var silenceDays = fastMap.silence_weight && typeof fastMap.silence_weight.count === 'number' ? fastMap.silence_weight.count : 0;
  var paradoxFlag = !!(fastMap.signature && fastMap.signature.paradox && (fastMap.signature.paradox.label === 'Paradox-dominant' || fastMap.signature.paradox.label === 'Charged'));
  var contradictionFlag = !!(fastMap.watcher && fastMap.watcher.top_contradictory && fastMap.watcher.top_contradictory.length);
  var dominantTheme = (fastMap.emotional_arc && fastMap.emotional_arc.direction) ? fastMap.emotional_arc.direction : ((fastMap.key_terms && fastMap.key_terms[0] && fastMap.key_terms[0].term) ? fastMap.key_terms[0].term : 'none');
  return {
    orbitingTerms: orbitingTerms,
    writingSignature: writingSignature,
    silenceDays: silenceDays,
    paradoxFlag: paradoxFlag,
    contradictionFlag: contradictionFlag,
    dominantTheme: dominantTheme
  };
}

async function logGuardianAutoInvoke(observation, triggeredBy, userAction) {
  try {
    var allDiscs = (await getDiscourses()).filter(function (d) { return !d.deleted_at && !d.isDeleted; });
    await dbPut('guardian_logs', {
      id: 'gl_auto_' + Date.now(),
      invoked_at: Date.now(),
      model_used: 'naked-guardian-worker',
      soup_snapshot_count: allDiscs.length,
      response_text: observation || '',
      was_silent: observation ? 0 : 1,
      thread: JSON.stringify({ auto_invoke: true }),
      emotional_weight: 1.0,
      auto_invoked: 1,
      triggered_by: triggeredBy != null && triggeredBy !== '' ? triggeredBy : null,
      user_action: userAction != null && userAction !== '' ? userAction : null,
      log_type: 'auto_invoke'
    });
  } catch (e) {
    console.warn('Guardian auto log failed:', e);
  }
}

function hideGuardianInvokeStripOnly() {
  if (guardianInvokeTimer) {
    clearTimeout(guardianInvokeTimer);
    guardianInvokeTimer = null;
  }
  guardianInvokeActive = false;
  var strip = document.getElementById('guardian-invoke-strip');
  if (!strip) return;
  strip.classList.remove('visible');
  strip.style.display = 'none';
  strip.onclick = null;
  var dismissBtn = document.getElementById('guardian-invoke-dismiss');
  if (dismissBtn) dismissBtn.onclick = null;
}

function dismissGuardianInvoke(reason) {
  if (guardianInvokeTimer) {
    clearTimeout(guardianInvokeTimer);
    guardianInvokeTimer = null;
  }
  guardianInvokeActive = false;
  var strip = document.getElementById('guardian-invoke-strip');
  if (strip) {
    strip.classList.remove('visible');
    strip.onclick = null;
    var dismissBtn = document.getElementById('guardian-invoke-dismiss');
    if (dismissBtn) dismissBtn.onclick = null;
    setTimeout(function () {
      if (strip) strip.style.display = 'none';
    }, 500);
  }
  void logGuardianAutoInvoke(null, guardianInvokeLastTriggerType, reason);
}

/** Wire strip tap, dismiss, and timed dissolve. Must run after strip is visible — not blocked by guardian_logs I/O. */
function attachGuardianInvokeStripHandlers() {
  if (guardianInvokeTimer) {
    clearTimeout(guardianInvokeTimer);
    guardianInvokeTimer = null;
  }
  var strip = document.getElementById('guardian-invoke-strip');
  if (!strip) return;
  var dismissBtn = document.getElementById('guardian-invoke-dismiss');
  strip.onclick = null;
  if (dismissBtn) dismissBtn.onclick = null;

  guardianInvokeTimer = setTimeout(function () {
    dismissGuardianInvoke('dissolved');
  }, GUARDIAN_INVOKE_STRIP_DISSOLVE_MS);

  strip.onclick = function (e) {
    if (e.target && e.target.closest && e.target.closest('#guardian-invoke-dismiss')) return;
    strip.onclick = null;
    var dismissBtn2 = document.getElementById('guardian-invoke-dismiss');
    if (dismissBtn2) dismissBtn2.onclick = null;
    dismissGuardianInvoke('entered');
    void openGuardianView({});
  };

  if (dismissBtn) {
    dismissBtn.onclick = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var count = parseInt(localStorage.getItem('nq_guardian_dismissed_count') || '0', 10) || 0;
      try {
        localStorage.setItem('nq_guardian_dismissed_count', String(count + 1));
      } catch (e12) {}
      strip.onclick = null;
      dismissBtn.onclick = null;
      dismissGuardianInvoke('dismissed');
    };
  }
}

async function checkAndShowGuardianInvoke() {
  if (NQ_DEV_MODE) {
    if (currentView !== 'soup') return;
    if (guardianInvokeActive) return;
    var strip = document.getElementById('guardian-invoke-strip');
    var textEl = document.getElementById('guardian-invoke-text');
    if (!strip || !textEl) return;
    textEl.textContent = "You have been circling the same thought for weeks. You have not named it yet.";
    strip.style.display = 'block';
    requestAnimationFrame(function () {
      strip.classList.add('visible');
    });
    guardianInvokeActive = true;
    guardianInvokeLastTriggerType = 'dev_preview';
    attachGuardianInvokeStripHandlers();
    return;
  }
  if (currentView !== 'soup') return;
  if (guardianInvokeActive) return;
  if (!checkGuardianTrigger) return;

  var rawPending = null;
  try {
    rawPending = localStorage.getItem('nq_guardian_invoke_pending');
  } catch (e0) {}
  if (!rawPending) return;

  var pending = null;
  try {
    pending = JSON.parse(rawPending);
  } catch (e1) {
    try { localStorage.removeItem('nq_guardian_invoke_pending'); } catch (e1b) {}
    return;
  }
  if (!pending || !pending.discourseId || !pending.at) {
    try { localStorage.removeItem('nq_guardian_invoke_pending'); } catch (e2) {}
    return;
  }
  if (Date.now() - pending.at > 7 * 24 * 3600000) {
    try { localStorage.removeItem('nq_guardian_invoke_pending'); } catch (e3) {}
    return;
  }

  var fastMap = null;
  try {
    fastMap = await dbGet('guardian_summaries', pending.discourseId);
  } catch (e4) {}
  if (!fastMap || fastMap.map_type !== 'fast') {
    try { localStorage.removeItem('nq_guardian_invoke_pending'); } catch (e5) {}
    return;
  }

  var trig;
  try {
    trig = checkGuardianTrigger(fastMap);
  } catch (e6) {
    return;
  }
  if (!trig || !trig.shouldInvoke) {
    try { localStorage.removeItem('nq_guardian_invoke_pending'); } catch (e7) {}
    return;
  }

  var triggeredBy = trig.primaryQualifier || 'signal';
  var fastMapSnapshot = buildFastMapSnapshotForWorker(fastMap);

  try {
    localStorage.setItem('nq_guardian_last_attempt', String(Date.now()));
  } catch (e8) {}

  var observation = null;
  try {
    var res = await fetch(GUARDIAN_INVOKE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fastMapSnapshot: fastMapSnapshot, triggeredBy: triggeredBy })
    });
    if (!res.ok) return;
    var data = await res.json();
    observation = data.observation;
  } catch (e9) {
    return;
  }

  if (!observation) return;

  try {
    localStorage.removeItem('nq_guardian_invoke_pending');
  } catch (e10) {}

  var strip = document.getElementById('guardian-invoke-strip');
  var textEl = document.getElementById('guardian-invoke-text');
  if (!strip || !textEl) return;

  textEl.textContent = observation;
  strip.style.display = 'block';
  requestAnimationFrame(function () {
    strip.classList.add('visible');
  });

  guardianInvokeActive = true;
  guardianInvokeLastTriggerType = triggeredBy;

  try {
    localStorage.setItem('nq_guardian_last_invoke', String(Date.now()));
    localStorage.setItem('nq_guardian_last_trigger_type', triggeredBy);
    localStorage.setItem('nq_guardian_dismissed_count', '0');
  } catch (e11) {}

  attachGuardianInvokeStripHandlers();

  void logGuardianAutoInvoke(observation, triggeredBy, 'surfaced');
}

async function openGuardianView(entryOpts){
  entryOpts = entryOpts || {};
  hideGuardianInvokeStripOnly();
  if (entryOpts.fromHeader) {
    try { localStorage.removeItem('nq_guardian_dismissed_count'); } catch (e) {}
  }
  try { localStorage.setItem('nq_guardian_last_interaction', String(Date.now())); } catch (e) {}
  showPanel('view-guardian');
  document.getElementById('guardian-footer').classList.add('visible');
  guardianState = 'resting';
  resetGuardianUI();
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
  silence.className = 'guardian-silence';
  inputArea.className = 'guardian-input-area';
  document.getElementById('guardian-input').value = '';
  btn.disabled = false;
  btn.textContent = 'Summon';
  sub.textContent = 'The Abyss is listening.';
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
    btn.innerHTML = '<span>◈</span> ' + (GUARDIAN_MODEL_LABELS[m] || m.split('/').pop());
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
  var apiKey = await readSecureKey('nq_api_key');
  if(!apiKey){ showToast('No API key in Settings'); guardianPendingTriggerType = null; return; }
  var guardianModel = summonOpts.modelOverride || localStorage.getItem('nq_guardian_model') || localStorage.getItem('nq_model') || 'deepseek/deepseek-v3.2';
  var baseUrl = openRouterChatBaseUrl();
  guardianState = 'processing';
  var btn = document.getElementById('btn-summon-guardian');
  var realm = document.getElementById('guardian-realm');
  var glyph = document.getElementById('guardian-glyph');
  var sub = document.getElementById('guardian-sub');
  btn.disabled = true;
  btn.textContent = userAddition ? 'Listening...' : 'Summoning...';
  glyph.className = 'guardian-glyph watching';
  realm.classList.add('dimming');
  sub.textContent = '';
  try {
    var allDiscs = (await getDiscourses()).filter(function(d){ return !d.deleted_at && !d.isDeleted; });

    // ── SOVEREIGN DEEP MAPPER (if enabled) ────────────────
    // Cartographer runs deliberately via footer button.
    // Summon uses whatever maps are already in DB.
    var subEl = document.getElementById('guardian-sub');
    if (subEl) subEl.textContent = 'Reading the archive...';

    // ── BUILD CONTEXT FROM FAST MAPS + DEEP MAPS ──────────
    var summaries = await buildGuardianContext(allDiscs);
    
    // GUARD: If buildGuardianContext failed silently
    if (!summaries) {
      throw new Error('buildGuardianContext returned empty');
    }
    
    var allLogs = await dbGetAll('guardian_logs');
    var recentLogs = allLogs.filter(function(l){ return !l.was_silent; }).sort(function(a,b){ return b.invoked_at - a.invoked_at; }).slice(0,2);
    var contextBlock = 'ARCHIVE SUMMARIES (' + allDiscs.length + ' discourses):\n\n' + summaries;
    
if (recentLogs.length) {
  var timeSinceLast = Math.floor((Date.now() - recentLogs[0].invoked_at) / 86400000);
  
  contextBlock += '\n═══════════════════════════════════\n';
  contextBlock += 'GUARDIAN INSTRUCTION\n';
  contextBlock += '═══════════════════════════════════\n\n';
  contextBlock += `You last spoke to them ${timeSinceLast} days ago.\n\n`;
  contextBlock += 'Review your Previous Witness Records below. Compare them to the Witness Records above.\n\n';
  contextBlock += 'Look for:\n';
  contextBlock += '· Are they circling the exact same narrative?\n';
  contextBlock += '· Have they moved? Where? By how much?\n';
  contextBlock += '· What did you tell them last time, and did they act on it or resist it?\n';
  contextBlock += '· What appears in the records that they haven\'t named directly?\n';
  contextBlock += '· Where do the emotional arcs tell a different story than the words?\n\n';
  contextBlock += 'If they have stagnated, be ruthless about the repetition.\n';
  contextBlock += 'If they have genuinely shifted, acknowledge the movement -- but don\'t congratulate. Just witness it.\n\n';
  
  contextBlock += '── PREVIOUS WITNESS RECORDS ──\n\n';
  for (const log of recentLogs) {
    contextBlock += `[${new Date(log.invoked_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}]\n`;
    contextBlock += log.response_text + '\n\n---\n\n';
  }
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
    btn.textContent = 'Summon';
    sub.textContent = 'The Abyss is listening.';
    guardianState = 'resting';
  }
}

async function buildGuardianContext(discs) {
  const now = Date.now();
  let contextBlock = '';
  // ── ARCHIVE OVERVIEW ────────────────────────────────────
  const totalWords = discs.reduce((sum, d) => 
    sum + ((d.raw_text || '').trim().split(/\s+/).filter(Boolean).length), 0
  );
  
  const dates = discs
    .filter(d => d.created_at)
    .map(d => d.created_at)
    .sort((a, b) => a - b);
  
  const firstDate = dates.length ? new Date(dates[0]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'unknown';
  const lastDate = dates.length ? new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'unknown';
  
  contextBlock += '═══════════════════════════════════\n';
  contextBlock += 'ARCHIVE WITNESS RECORDS\n';
  contextBlock += '═══════════════════════════════════\n\n';
  contextBlock += `Total discourses in the Soup: ${discs.length}\n`;
  contextBlock += `Time span: ${firstDate} – ${lastDate}\n`;
  contextBlock += `Total words: ${totalWords.toLocaleString()}\n\n`;
  
  // ── FAST MAPS ───────────────────────────────────────────
  contextBlock += '── FAST MAPS (structured metadata for all discourses) ──\n\n';
  
  // Sort by date, newest first
  const sorted = [...discs].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  
  let mapNum = 0;
  for (const d of sorted) {
    mapNum++;
    const fastMap = await dbGet('guardian_summaries', d.id);
    const wordCount = (d.raw_text || '').trim().split(/\s+/).filter(Boolean).length;
    const date = new Date(d.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    contextBlock += `[DISCOURSE ${mapNum}] "${d.title || 'Untitled'}"\n`;
    contextBlock += `Words: ${wordCount.toLocaleString()} · ${date}\n`;
    
    if (fastMap && fastMap.map_type === 'fast') {
      // Use the Fast Map
      if (fastMap.first_line) {
        contextBlock += `First: "${fastMap.first_line.slice(0, 150)}"\n`;
      }
      if (fastMap.last_line) {
        contextBlock += `Last: "${fastMap.last_line.slice(0, 150)}"\n`;
      }
      if (fastMap.key_terms && fastMap.key_terms.length) {
        const termStr = fastMap.key_terms
          .slice(0, 5)
          .map(t => `${t.term}(${t.count})`)
          .join(', ');
        contextBlock += `Key terms: ${termStr}\n`;
      }
            if (fastMap.emotional_arc && fastMap.emotional_arc.direction) {
        contextBlock += `Emotional arc: ${fastMap.emotional_arc.direction}\n`;
      }
      if (fastMap.pacing) {
        contextBlock += `Pacing: ${fastMap.pacing.label} (avg ${fastMap.pacing.avg_words_per_sentence} words/sentence)\n`;
      }
      if (fastMap.rigidity) {
        contextBlock += `Cognitive state: ${fastMap.rigidity.label} (${fastMap.rigidity.absolute_count} absolutes)\n`;
      }
            if (fastMap.questioning) {
        contextBlock += `Questioning: ${fastMap.questioning.label} (${fastMap.questioning.question_count} questions)\n`;
      }
      if (fastMap.signature) {
        contextBlock += `Writing signature: ${fastMap.signature.summary}\n`;
        if (fastMap.signature.paradox && fastMap.signature.paradox.pairs && fastMap.signature.paradox.pairs.length) {
          contextBlock += `Paradox pairs: ${fastMap.signature.paradox.pairs.join(' | ')}\n`;
        }
      }
        if (fastMap.extractive_summary) {
        contextBlock += `Excerpt: "${fastMap.extractive_summary.slice(0, 300)}"\n`;
      }
       if (fastMap.watcher) {
       if (fastMap.watcher.top_similar && fastMap.watcher.top_similar.length) {
          const echoes = fastMap.watcher.top_similar
            .map(s => `d_${s.id.slice(-4)} (${s.score})`)
            .join(', ');
          contextBlock += `Watcher: echoes ${echoes}\n`;
        }
    if (fastMap.watcher.top_contradictory && fastMap.watcher.top_contradictory.length) {
          const contradicts = fastMap.watcher.top_contradictory
            .map(s => `d_${s.id.slice(-4)} (${s.score})`)
            .join(', ');
          contextBlock += `Watcher: contradicts ${contradicts}\n`;
        }
      }

      // ── NEW SHAPE DIMENSIONS (GUARDED) ──
      if (fastMap.pronoun_trajectory) {
        contextBlock += `Pronoun trajectory: ${fastMap.pronoun_trajectory.label} (dominant: ${fastMap.pronoun_trajectory.dominant})\n`;
      }
      if (fastMap.silence_weight) {
        contextBlock += `Silence weight: ${fastMap.silence_weight.label} (${fastMap.silence_weight.count} silence markers)\n`;
      }
      if (fastMap.entry_exit_delta) {
        contextBlock += `Entry/exit register: ${fastMap.entry_exit_delta.delta}\n`;
      }
      if (fastMap.incompleteness) {
        contextBlock += `Ending: ${fastMap.incompleteness.label}\n`;
      }
    } else {
      // Fallback: no Fast Map yet -- use raw text snippet
      const rawText = (d.raw_text || '').trim();
      if (rawText.length > 0) {
        contextBlock += `First: "${rawText.split('\n').find(l => l.trim().length > 0)?.trim().slice(0, 150) || '...'}"\n`;
        if (wordCount <= 300) {
          contextBlock += `Full text: "${rawText.slice(0, 400)}"\n`;
        } else {
          contextBlock += `Excerpt: "${rawText.slice(0, 300)}..."\n`;
        }
        contextBlock += `[Note: Unmapped terrain -- Fast Map will be generated on next save]\n`;
      }
    }
    
    contextBlock += '\n';
  }

  // ── DEEP MAPS (local or API) ──────────────────────────────
  const deepMaps = [];
  for (const d of sorted) {
    const deepMap = await dbGet('guardian_summaries', d.id + '_deep');
    if (deepMap && deepMap.summary) {
      deepMaps.push({
        title: d.title || 'Untitled',
        summary: deepMap.summary,
        model: deepMap.model || 'unknown'
      });
    }
  }

  if (deepMaps.length > 0) {
    contextBlock += '\n── DEEP MAPS (rich local summaries for urgent discourses) ──\n\n';
    for (const dm of deepMaps) {
      contextBlock += `"${dm.title}": ${dm.summary}\n\n`;
    }
    contextBlock += `Generated by: ${deepMaps[0].model} (${deepMaps.length} discourses mapped)\n\n`;
  }
 
  if (isWatcherReady && watcherDB && watcherEmbedder) {
  
    const allLinks = await wdb.getAll('links');
    const allEmbs = await wdb.getAll('embeddings');
    
    if (allLinks.length > 0) {
      contextBlock += '── WATCHER PATTERN FLAGS ──\n\n';
      
      // Top echoes (high similarity pairs)
      const topLinks = [...allLinks]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      if (topLinks.length) {
        contextBlock += 'High-similarity pairs (potential echoes):\n';
        for (const link of topLinks) {
          const discA = discTitleMap(discs, link.a);
          const discB = discTitleMap(discs, link.b);
          contextBlock += `· "${discA}" ↔ "${discB}" (${Math.round(link.score * 100)}%)\n`;
        }
        contextBlock += '\n';
      }
      
      // Recurring terms across 3+ discourses
      const allTerms = {};
      for (const d of sorted) {
        const fastMap = await dbGet('guardian_summaries', d.id);
        if (fastMap && fastMap.key_terms) {
          for (const term of fastMap.key_terms.slice(0, 5)) {
            if (!allTerms[term.term]) allTerms[term.term] = [];
            allTerms[term.term].push(d.title || 'Untitled');
          }
        }
      }
      
      const recurringTerms = Object.entries(allTerms)
        .filter(([, titles]) => titles.length >= 3)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);
      
      if (recurringTerms.length) {
        contextBlock += 'Recurring terms across 3+ discourses:\n';
        for (const [term, titles] of recurringTerms) {
          contextBlock += `· "${term}" -- ${titles.length} discourses: ${titles.slice(0, 3).map(t => `"${t}"`).join(', ')}${titles.length > 3 ? `, +${titles.length - 3} more` : ''}\n`;
        }
        contextBlock += '\n';
      }
      
      // Emotional arc patterns
      const arcs = [];
      for (const d of sorted) {
        const fastMap = await dbGet('guardian_summaries', d.id);
        if (fastMap && fastMap.emotional_arc && fastMap.emotional_arc.direction) {
          arcs.push(fastMap.emotional_arc);
        }
      }
      
      if (arcs.length >= 3) {
        const resolved = arcs.filter(a => a.tension_shift < -0.01).length;
        const escalated = arcs.filter(a => a.tension_shift > 0.01).length;
        const flat = arcs.filter(a => Math.abs(a.tension_shift) <= 0.01).length;
        
        // Most common arc
        const arcCounts = {};
        for (const a of arcs) {
          const key = a.direction.split('→')[0]?.trim() || a.direction;
          arcCounts[key] = (arcCounts[key] || 0) + 1;
        }
        const topArc = Object.entries(arcCounts).sort((a, b) => b[1] - a[1])[0];
        
        contextBlock += 'Emotional arc patterns across all discourses:\n';
        contextBlock += `· ${resolved} resolved · ${escalated} escalated · ${flat} flat\n`;
        if (topArc) {
          contextBlock += `· Most common opening tone: "${topArc[0]}" (${topArc[1]} discourses)\n`;
        }
        contextBlock += '\n';
      }
    } else {
      contextBlock += '── WATCHER PATTERN FLAGS ──\n\n';
      contextBlock += 'No resonance links detected yet. The Watcher needs more material.\n\n';
    }
  }
  
  return contextBlock;
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
    btn.textContent = 'Summon Again';
    btn.disabled = false;
    await saveGuardianLog('', true, model);
  } else {
    guardianState = 'speaking';
    glyph.className = 'guardian-glyph watching';
    inputArea.className = 'guardian-input-area visible';
    btn.textContent = 'Summon Again';
    btn.disabled = false;
    await saveGuardianLog(fullText, false, model);
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
    log_type: 'summon'
  };
  await dbPut('guardian_logs', log);
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
      item.innerHTML = '<div class="guardian-log-date">' + date + '</div><div class="guardian-log-silent">&#9689; &mdash; silence</div>';
    } else {
      var preview = (log.response_text || '').slice(0,120).trim();
      item.innerHTML = '<div class="guardian-log-date">' + date + ' &middot; ' + log.soup_snapshot_count + ' discourses</div><div class="guardian-log-preview">' + escHtml(preview) + '...</div>';
      item.addEventListener('click', function(){ openGuardianLogDetail(log); });
    }
    list.appendChild(item);
  });
}

function openGuardianLogDetail(log){
  var detail = document.getElementById('guardian-log-detail');
  var content = document.getElementById('guardian-log-detail-content');
  var date = new Date(log.invoked_at).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  content.textContent = '&#9689; ' + date + '\n\n' + log.response_text;
  detail.classList.add('open');
}

function closeGuardianLogDetail(){
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

/* EVENT BINDING */
window.addEventListener('unhandledrejection', function(e) {
  console.error('[UnhandledRejection]', e.reason);
  const msg = e.reason?.message || String(e.reason) || 'Unknown error';
  showToast('⚠ ' + msg.slice(0, 60));
  e.preventDefault();
});

document.addEventListener('DOMContentLoaded',()=> {

initWorker();
  document.getElementById('btn-back-table').addEventListener('click',()=>goBack());
  document.getElementById('btn-guardian-back').addEventListener('click', goBack);
  document.getElementById('btn-write').addEventListener('click',()=>setEditorMode('write'));
  document.getElementById('btn-view').addEventListener('click',()=>setEditorMode('view'));
    document.getElementById('btn-export-html').addEventListener('click',exportHTML);
  document.getElementById('btn-export-md').addEventListener('click',exportMarkdown);
  document.getElementById('btn-export-pdf').addEventListener('click',exportPDF);
  document.getElementById('btn-copy-content').addEventListener('click', () => {
    const ta = document.getElementById('content-textarea');
    if(!ta || !ta.value.trim()) { showToast('Nothing to copy'); return; }
    navigator.clipboard.writeText(ta.value).then(() => showToast('Copied ◆')).catch(() => showToast('Copy failed'));
  });
  document.getElementById('input-import-md').addEventListener('change', async function() {
    const file = this.files[0];
    if(!file) return;
    const text = await file.text();
    // Extract title from first # heading or filename
    const firstLine = text.split('\n')[0] || '';
    const title = firstLine.startsWith('#')
      ? firstLine.replace(/^#+\s*/, '').trim()
      : file.name.replace(/\.md$/i, '').replace(/[_-]/g, ' ');
    // Strip the first heading line from body
    const body = firstLine.startsWith('#')
      ? text.split('\n').slice(1).join('\n').trim()
      : text.trim();
    await createDiscourse(title.slice(0, 60), body, currentFolderId);
    showToast('Imported: ' + title.slice(0, 30) + ' ◆');
    this.value = ''; // reset so same file can be re-imported
  });
  document.getElementById('btn-extract').addEventListener('click',extractMemory);
  document.getElementById('btn-delete-discourse').addEventListener('click',deleteCurrentDiscourse);
  document.getElementById('cosm-overlay').addEventListener('click',closeOverlay);
  document.getElementById('btn-folder-cancel').addEventListener('click',closeFolderModal);
  document.getElementById('btn-folder-confirm').addEventListener('click',confirmNewFolder);
  document.getElementById('search-input').addEventListener('input',e=>onSearchInput(e.target.value));
  document.getElementById('discourse-title').addEventListener('blur',()=>{if(currentDiscourseId&&currentView==='lighthouse')saveCurrentDiscourse(true);});
  document.getElementById('content-textarea').addEventListener('paste',function(e){const h=e.clipboardData&&e.clipboardData.getData('text/html');if(h){e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));}});
  document.getElementById('btn-rename-cancel').addEventListener('click',closeOverlay);
  document.getElementById('btn-rename-confirm').addEventListener('click',confirmRename);
  document.getElementById('btn-move-cancel').addEventListener('click',closeOverlay);
  document.getElementById('btn-move-confirm').addEventListener('click',()=>{
  confirmBatchMove();
});
document.getElementById('btn-data-back').addEventListener('click', ()=>{
  saveSupaFromDataPage(); // auto-save on leave
  goBack();
});
document.getElementById('btn-lh-overflow').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleLHOverflow();
});
const ta = document.getElementById('content-textarea');
ta.addEventListener('input', function(){
  this.style.height = 'auto';
  this.style.height = Math.max(this.scrollHeight, window.innerHeight * 0.6) + 'px';
});
document.getElementById('content-textarea').addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  const pos = this.selectionStart;
  const text = this.value;
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  const currentLine = text.slice(lineStart, pos);

  // Numbered list
  const numbered = currentLine.match(/^(\d+)\.\s/);
  if (numbered) {
    e.preventDefault();
    const next = '\n' + (parseInt(numbered[1]) + 1) + '. ';
    this.value = text.slice(0, pos) + next + text.slice(pos);
    this.selectionStart = this.selectionEnd = pos + next.length;
    this.dispatchEvent(new Event('input'));
    return;
  }

  // Bullet list
  const bullet = currentLine.match(/^- /);
  if (bullet) {
    e.preventDefault();
    const next = '\n- ';
    this.value = text.slice(0, pos) + next + text.slice(pos);
    this.selectionStart = this.selectionEnd = pos + next.length;
    this.dispatchEvent(new Event('input'));
    return;
  }
});
document.getElementById('btn-lh-format').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleLHFormat();
});
document.getElementById('btn-data-export-page').addEventListener('click', ()=>exportJSON());
document.getElementById('import-json-input-page').onchange = e => importJSON(e);
document.getElementById('btn-data-sync-page').addEventListener('click', ()=>handleSync());
  document.getElementById('btn-global-search-cancel').addEventListener('click',closeGlobalSearch);
  document.getElementById('global-search-input').addEventListener('input',e=>onGlobalSearchInput(e.target.value));
  document.getElementById('capture-folder').addEventListener('change',function(){const inp=document.getElementById('capture-new-folder-input');inp.style.display=this.value==='__new__'?'block':'none';if(this.value==='__new__')setTimeout(()=>inp.focus(),50);});
  document.getElementById('btn-capture-cancel').addEventListener('click',closeQuickCapture);
  document.getElementById('btn-capture-confirm').addEventListener('click',confirmQuickCapture);
  document.getElementById('capture-body').addEventListener('input',function(){const t=document.getElementById('capture-title');if(t.dataset.userEdited==='true')return;const w=this.value.split('\n')[0].trim().split(/\s+/).filter(Boolean).slice(0,4).join(' ');t.value=w||'';});
  document.getElementById('capture-title').addEventListener('input',function(){this.dataset.userEdited='true';});
  document.getElementById('btn-discourse-modal-cancel').addEventListener('click',closeOverlay);
  document.getElementById('btn-discourse-modal-confirm').addEventListener('click',confirmNewDiscourse);
  document.getElementById('discourse-modal-folder').addEventListener('change',function(){
  const inp=document.getElementById('discourse-modal-new-folder');
  inp.style.display=this.value==='__new__'?'block':'none';
  if(this.value==='__new__')setTimeout(()=>inp.focus(),50);
});
  document.getElementById('btn-burn-cancel').addEventListener('click',closeOverlay);
  document.getElementById('btn-burn-confirm').addEventListener('click',confirmBurnDisc);
  document.getElementById('ie-model-add-btn').addEventListener('click', ()=>{
    const input = document.getElementById('ie-model-input');
    const val = input.value.trim();
    if(val && !currentIEModels.includes(val)){
      currentIEModels.push(val);
      input.value = '';
      renderIEModelList();
    }
  });
  document.getElementById('btn-ie-back').addEventListener('click', ()=>{ showPanel('view-sanctuary'); renderSanctuaryView(); });

  (function initSanctuaryChrome(){
    const scrim = document.getElementById('sanctuary-drawer-scrim');
    const immutable = document.getElementById('sanctuary-drawer-immutable');
    const create = document.getElementById('sanctuary-drawer-create');
    const persona = document.getElementById('sanctuary-drawer-persona');
    const memory = document.getElementById('sanctuary-drawer-memory');
    const search = document.getElementById('sanctuary-drawer-search');
    const surface = document.getElementById('sanctuary-surface');
    if (scrim) scrim.addEventListener('click', closeSanctuaryDrawer);
    if (immutable) immutable.addEventListener('click', () => { closeSanctuaryDrawer(); openIEPage(); });
    if (create) create.addEventListener('click', () => { closeSanctuaryDrawer(); void handleNewCharacter(); });
    if (persona) persona.addEventListener('click', () => { closeSanctuaryDrawer(); openPersonaView(); });
    if (memory) memory.addEventListener('click', () => { closeSanctuaryDrawer(); openMemoryVaultGlobal(); });
    if (search) search.addEventListener('click', () => {
      closeSanctuaryDrawer();
      if (sanctuaryLocalSearchOpen) void hideSanctuaryLocalSearch();
      else void showSanctuaryLocalSearch();
    });
    const sClose = document.getElementById('sanctuary-search-close');
    if (sClose) sClose.addEventListener('click', () => { void hideSanctuaryLocalSearch(); });
    const sInp = document.getElementById('sanctuary-search-input');
    if (sInp) sInp.addEventListener('input', (e) => onSanctuarySearchInput(e.target.value));
    if (surface) surface.addEventListener('pointerdown', onSanctuarySurfacePointerDown, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(sanctuaryMyceliumRaf);
        sanctuaryMyceliumRaf = null;
        return;
      }
      const panel = document.getElementById('view-sanctuary');
      if (sanctuaryAmbienceActive && panel && !panel.classList.contains('hidden') && !sanctuaryPrefersReducedMotion()) {
        cancelAnimationFrame(sanctuaryMyceliumRaf);
        sanctuaryMyceliumRaf = requestAnimationFrame(tickSanctuaryMycelium);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const sd = document.getElementById('soup-drawer');
      if (sd && sd.classList.contains('open')) {
        closeSoupDrawer();
        e.preventDefault();
        return;
      }
      const d = document.getElementById('sanctuary-drawer');
      if (d && d.classList.contains('open')) closeSanctuaryDrawer();
    });
  })();

  (function initSoupChrome(){
    const scrim = document.getElementById('soup-drawer-scrim');
    const itemSearch = document.getElementById('soup-drawer-search');
    const itemSettings = document.getElementById('soup-drawer-settings');
    if (scrim) scrim.addEventListener('click', closeSoupDrawer);
    if (itemSearch) itemSearch.addEventListener('click', () => {
      closeSoupDrawer();
      if (soupLocalSearchOpen) void hideSoupLocalSearch();
      else void showSoupLocalSearch();
    });
    if (itemSettings) itemSettings.addEventListener('click', () => {
      closeSoupDrawer();
      void openDataPage();
    });
    const closeS = document.getElementById('soup-search-close');
    if (closeS) closeS.addEventListener('click', () => { void hideSoupLocalSearch(); });
  })();

document.getElementById('btn-abyss-back').addEventListener('click', () => {
  abyssStop();
  abyssCloseSheet();
  showPanel('view-soup');
  void renderTableView();
});
document.getElementById('btn-deep-soup-back').addEventListener('click', () => {
  if (Array.isArray(deepSoupPath) && deepSoupPath.length > 1) {
    deepSoupPath = deepSoupPath.slice(0, -1);
    const last = deepSoupPath[deepSoupPath.length - 1];
    deepSoupFolderId = last.id;
    void renderDeepSoupView();
    return;
  }
  showPanel('view-soup');
  void renderTableView();
});

document.getElementById('ie-search-input').addEventListener('input', e => renderIEList(e.target.value));
document.getElementById('btn-ie-manifest-close').addEventListener('click', closeOverlay);

document.getElementById('btn-ie-dev-forge').addEventListener('click', devCreateIEDraft);

  document.getElementById('btn-data-gateway-save').addEventListener('click', async () => {
    const apiKey = document.getElementById('input-api-key').value.trim();
    if (apiKey) await storeSecureKey('nq_api_key', apiKey);
    localStorage.setItem('nq_base_url', document.getElementById('input-base-url').value.trim());
    localStorage.setItem('nq_model', document.getElementById('input-model').value);
    showToast("Gateway solidified ◆");
  });

  document.getElementById('btn-forge-save').addEventListener('click',saveCharacterForge);
  document.getElementById('btn-forge-close').addEventListener('click',closeCharacterForge);
  document.getElementById('btn-role-cancel').addEventListener('click',closeOverlay);
  document.getElementById('btn-role-confirm').addEventListener('click',confirmAddRole);
  document.getElementById('btn-save-persona').addEventListener('click',savePersonaPage);
  document.getElementById('btn-persona-back').addEventListener('click', () => {
    showPanel('view-sanctuary');
    void renderSanctuaryView();
  });
  document.getElementById('btn-add-role').addEventListener('click',addNewRole);
  document.getElementById('chat-persona-pill').addEventListener('click',openPersonaPillSelector);
  document.getElementById('btn-persona-select-cancel').addEventListener('click',closeOverlay);
  document.getElementById('forge-temp').addEventListener('input',e=>{document.getElementById('forge-temp-val').textContent=parseFloat(e.target.value).toFixed(1);});
  document.querySelectorAll('.forge-section-header').forEach(h=>{h.addEventListener('click',()=>{h.parentElement.classList.toggle('open');});});
  document.getElementById('btn-memory-back').addEventListener('click', () => {
    const t = document.getElementById('btn-memory-back').dataset.backTarget;
    if (t === 'sanctuary') {
      showPanel('view-sanctuary');
      void renderSanctuaryView();
    } else {
      showPanel('view-chat');
    }
  });
  document.getElementById('btn-add-manual-memory').addEventListener('click',addManualAnchor);
  document.getElementById('btn-chat-back').addEventListener('click', ()=>{ void closeChatToOrigin(); });
  document.getElementById('btn-chat-edit').addEventListener('click',()=>openCharacterForge(activeCharId));
  document.getElementById('btn-chat-clear').addEventListener('click',clearChatHistory);
  document.getElementById('btn-send').addEventListener('click',handleChatSend);
  document.getElementById('btn-chat-retry').addEventListener('click', () => handleChatSend(true)); // ADD THIS
  document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.stopPropagation(); // newline only
    return;
  }
});
  document.getElementById('chat-input').addEventListener('input',function(){this.style.height='auto';this.style.height=(this.scrollHeight)+'px';});

  const fmtMap={'fmt-bold':{wrap:['**','**']},'fmt-italic':{wrap:['*','*']},'fmt-underline':{wrap:['<u>','</u>']},'fmt-quote':{line:'> '},'fmt-code':{wrap:['`','`']},'fmt-codeblock':{block:'```\n',end:'\n```'},'fmt-divider-line':{insert:'\n---\n'},'fmt-bullet':{line:'- '},'fmt-numbered':{line:'1. '},'fmt-h1':{line:'# '},'fmt-h2':{line:'## '},'fmt-h3':{line:'### '}};
  Object.keys(fmtMap).forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.addEventListener('click',()=>applyFormat(fmtMap[id]));
  });

document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key==="s"){e.preventDefault();if(currentView==='lighthouse')saveCurrentDiscourse();}if(e.key==="Escape"&&currentView==='lighthouse')goBack();if(e.key==="Enter"&&document.getElementById("folder-modal").classList.contains("visible"))confirmNewFolder();if(e.key==="Enter"&&document.getElementById("rename-modal").classList.contains("visible"))confirmRename();if(e.key==="Escape"&&document.getElementById("global-search-modal").classList.contains("visible"))closeGlobalSearch();});
// Add touch/scroll listeners in DOMContentLoaded
document.getElementById('view-soup').addEventListener('scroll',resetBottomBarTimer,{passive:true});
document.getElementById('view-soup').addEventListener('touchstart',resetBottomBarTimer,{passive:true});

document.getElementById('watcher-led-cluster')?.addEventListener('click', openWatcherPanel);
document.addEventListener('click', (e) => {
  const panel = document.getElementById('watcher-panel');
  const cluster = document.getElementById('watcher-led-cluster');
  if (panel?.classList.contains('visible') && !panel.contains(e.target) && e.target !== cluster && !cluster?.contains(e.target)) {
    closeWatcherPanel();
  }
});
document.getElementById('btn-summon-guardian').addEventListener('click', function(){ summonGuardian(); });
document.getElementById('btn-run-cartographer').addEventListener('click', runCartographer);
document.getElementById('btn-guardian-settings').addEventListener('click', openGuardianSettingsModal);
document.getElementById('btn-guardian-settings-cancel').addEventListener('click', closeOverlay);
document.getElementById('btn-guardian-settings-apply').addEventListener('click', applyGuardianSettings);
document.getElementById('btn-carto-sovereign').addEventListener('click', function() {
  pendingMappingMode = 'sovereign';
  updateCartoButtons();
});
document.getElementById('btn-carto-deep').addEventListener('click', function() {
  pendingMappingMode = 'deep';
  updateCartoButtons();
});

// Logs overlay
document.getElementById('btn-guardian-logs-open').addEventListener('click', function() {
  document.getElementById('guardian-logs-overlay').classList.add('open');
});
document.getElementById('btn-guardian-logs-close').addEventListener('click', function() {
  document.getElementById('guardian-logs-overlay').classList.remove('open');
});

document.getElementById('btn-guardian-send').addEventListener('click', handleGuardianOffer);
document.getElementById('btn-guardian-log-close').addEventListener('click', closeGuardianLogDetail);
    // gold-line-trigger removed
  // Awaken the thread on movement
  const soupView = document.getElementById('view-soup');
  soupView.addEventListener('scroll', awakenGoldLine, {passive: true});
  soupView.addEventListener('touchstart', awakenGoldLine, {passive: true});
// Trigger Lineage from the gold line trigger you added
  const trigger = document.getElementById('gold-line-trigger');
  if (trigger) {
    trigger.addEventListener('click', openLineage);
  }
  // Close Lineage when tapping the background overlay
  document.getElementById('lineage-overlay').addEventListener('click', closeLineage);
  // Initial draw
  renderGoldTicks();
bootApp();
});
/* NQ ABYSS GATEKEEPER */
/* PRF UNLOCK */
function getPRFSalt() {
  const stored = localStorage.getItem('nq_prf_salt');
  if (stored) return b64ToBuf(stored);
  // First time: generate and persist
  const salt = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem('nq_prf_salt', bufToB64(salt.buffer));
  return salt.buffer;
}
const WA_CRED_KEY = 'nq_prf_cred_id';

function bufToB64(buf){
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}
function b64ToBuf(b64){
  // Fix Apple's URL-safe base64 and missing padding
  let safeB64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (safeB64.length % 4) { safeB64 += '='; }
  const binary = atob(safeB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
  return bytes.buffer;
}

async function wrapSovereignKey(currentSKBytes, prfKeyBytes) {
  const key = await crypto.subtle.importKey('raw', prfKeyBytes, {name: 'AES-GCM', length: 256}, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, currentSKBytes);
  return JSON.stringify({ iv: Array.from(iv), ct: Array.from(new Uint8Array(ct)) });
}

// CRYPTOGRAPHIC WRAPPERS
async function unwrapSovereignKey(wrappedJson, prfKeyBytes) {
  const { iv, ct } = JSON.parse(wrappedJson);
  const key = await crypto.subtle.importKey('raw', prfKeyBytes, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
  const dec = await crypto.subtle.decrypt({name: 'AES-GCM', iv: new Uint8Array(iv)}, key, new Uint8Array(ct));
  return new Uint8Array(dec);
}

// ── RAM KEY STATE & EXPORTER ──
let _sovereignKey = null;
function setSovereignKey(keyBytes) { _sovereignKey = keyBytes; }
function getSovereignKey() { return _sovereignKey; }

// Expose globally so the HTML button can see it
window.showSovereignKey = function() {
  const sk = getSovereignKey();
  if (!sk) { showToast("⚠ Abyss Locked. No key in memory."); return; }
  
  const b64 = bufToB64(sk);
  const el = document.getElementById('export-key-display');
  el.value = b64;
  el.style.display = 'block';
  
  // iOS Safari failsafe: physically highlight the text
  el.select();
  el.setSelectionRange(0, 99999); 
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(b64)
      .then(() => showToast("Key copied to clipboard ◆"))
      .catch(() => showToast("Key revealed. Tap to copy. ◆"));
  } else {
    // Ancient fallback just in case
    try {
      document.execCommand('copy');
      showToast("Key copied to clipboard ◆");
    } catch(e) {
      showToast("Key revealed. Tap to copy. ◆");
    }
  }
};

async function unlockWithPRF(){
  const stored = localStorage.getItem(WA_CRED_KEY);
  const saltBuffer = getPRFSalt();
  
  // 1. REGISTRATION PATH
  if (!stored) {
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'NakedQuantum', id: location.hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'kaja', displayName: 'Kaja' },
          pubKeyCredParams:[{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'required' },
          extensions: { prf: { eval: { first: saltBuffer } } },
          timeout: 60000
        }
      });
      
      localStorage.setItem(WA_CRED_KEY, bufToB64(cred.rawId));
      
      // Extract PRF directly from creation! Prevents the immediate iOS .get() failure.
      const ext = cred.getClientExtensionResults();
      if (ext.prf?.results?.first) {
        let prfKey = new Uint8Array(ext.prf.results.first);
        setSovereignKey(prfKey);
        await setEncryptionKey(prfKey);
        showToast('◈ Face ID registered');
        return true;
      } else {
        // If device delays PRF, fallback to a get call
        return await unlockWithPRF();
      }
    } catch(regErr) {
      console.error('PRF register failed:', regErr);
      showToast('⚠ Face ID Registration Failed');
      return false;
    }
  }
  
  // 2. UNLOCK PATH
  try {
    const opts = {
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        userVerification: 'required',
        // We omit allowCredentials here to force iOS to show ALL discoverable passkeys. 
        // This prevents NotAllowedError if the local ID slightly mismatches iCloud.
        extensions: { prf: { eval: { first: saltBuffer } } },
        timeout: 60000
      }
    };

    const assertion = await navigator.credentials.get(opts);
    const ext = assertion.getClientExtensionResults();

    if(ext.prf?.results?.first){
      let prfKey = new Uint8Array(ext.prf.results.first);
      let finalKey = prfKey;
      
      const wrapped = localStorage.getItem('nq_wrapped_sk');
      if (wrapped) {
        try {
          finalKey = await unwrapSovereignKey(wrapped, prfKey);
        } catch(e) {
          console.error("Unwrap failed", e);
          showToast('⚠ Face ID Key mismatch');
          return false;
        }
      }
      
      setSovereignKey(finalKey); 
      await setEncryptionKey(finalKey); 
      showToast('Sovereign key active ◆');
      return true;
    } else {
      showToast('⚠ PRF failed to evaluate');
      return false;
    }
  } catch(e) {
    console.error('PRF get failed:', e);
    return false;
  }
}

// ── THE SELF-DESTRUCT SEQUENCE ──
async function obliterateAbyss() {
  if (!confirm("WARNING: This will permanently delete ALL data, characters, and settings. This cannot be undone. Continue?")) return;
  
  const check = prompt("To strip the Abyss back to nothing and start over, type NAKED AGAIN:");
  
  // Exact match required. 
  if (check !== "NAKED AGAIN") {
    showToast("The Abyss remains.");
    return;
  }
  
  showToast("Stripping back to zero...");
  
  // 1. Destroy OPFS SQLite DB
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry('nq.db');
  } catch(e) { console.log("No DB found to burn."); }
  
  // 2. Destroy IndexedDB Watcher
  try { indexedDB.deleteDatabase('nq_watcher'); } catch(e) {}
  
  // 3. Purge LocalStorage
  localStorage.clear();
  
  // 4. Reload to pure blank state
  setTimeout(() => window.location.reload(), 1000);
}

// WEBAUTHN RESET
window.resetWebAuthnRegistration = async function() {
  const currentSK = getSovereignKey();
  if (!currentSK) {
    showToast('⚠ No active Sovereign Key. Unlock Abyss first.');
    return;
  }
  
  if (!confirm('This will bind a new Face ID to your existing Sovereign Key. You will be prompted to authenticate now. Continue?')) return;
  
  try {
    // 1. Generate a brand new salt
    const newSalt = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem('nq_prf_salt', bufToB64(newSalt.buffer));
    
    // 2. Create the new credential
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'NakedQuantum', id: location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'kaja', displayName: 'Kaja' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'required' },
        extensions: { prf: { eval: { first: newSalt.buffer } } },
        timeout: 60000
      }
    });
    
    localStorage.setItem(WA_CRED_KEY, bufToB64(cred.rawId));
    
    // 3. Immediately assert to get the new PRF output
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        userVerification: 'required',
        allowCredentials: [{ id: cred.rawId, type: 'public-key' }],
        extensions: { prf: { eval: { first: newSalt.buffer } } },
        timeout: 60000
      }
    });
    
    const ext = assertion.getClientExtensionResults();
    if (ext.prf?.results?.first) {
      const newPrfKey = new Uint8Array(ext.prf.results.first);
      
      // 4. Wrap the existing Sovereign Key with the new PRF key
      const wrapped = await wrapSovereignKey(currentSK, newPrfKey);
      localStorage.setItem('nq_wrapped_sk', wrapped);
      
      showToast('◈ Face ID Re-bound Safely');
    } else {
      throw new Error('PRF verification failed on bind');
    }
  } catch (e) {
    console.error("Bind failed:", e);
    showToast('⚠ Face ID update failed or was cancelled.');
  }
}

async function unlockWithFallbackKey() {
  const inputEl = document.getElementById('fallback-key-input');
  const input = inputEl.value.trim();
  
  // Helper to flash error directly on the input box
  const showError = (msg) => {
    inputEl.value = '';
    inputEl.placeholder = msg;
    inputEl.style.borderColor = '#ff6060';
    setTimeout(() => {
      inputEl.style.borderColor = 'var(--border)';
      inputEl.placeholder = 'Paste Sovereign Key...';
    }, 2500);
  };
  
  if(!input) {
    showError("⚠ PASTE KEY FIRST");
    return;
  }
  
  try {
    const buf = b64ToBuf(input);
    const keyBytes = new Uint8Array(buf);
    
    if(keyBytes.length !== 32) throw new Error("Incorrect key length");
    
    setSovereignKey(keyBytes);
    await setEncryptionKey(keyBytes);
    
    document.getElementById('lock-screen').style.display = 'none';
    showToast("Abyss Unlocked ◆"); // This toast is fine because the keyboard drops when app loads
    await init();
  } catch(e) {
    showError("⚠ INVALID KEY");
  }
}

// ─── SECURE KEY STORAGE ─────────────────────────────────────────────────────
async function storeSecureKey(storageKey, value) {
  if (!getSovereignKey() || !value) {
    // No sovereign key yet (DEV_MODE) -- fall back to plaintext
    localStorage.setItem(storageKey, value);
    return;
  }
  const cryptoKey = await getCloudCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(value)
  );
  localStorage.setItem(
    storageKey + '_enc',
    JSON.stringify({ iv: Array.from(iv), ct: Array.from(new Uint8Array(ct)) })
  );
  localStorage.removeItem(storageKey); // remove any old plaintext
}

async function readSecureKey(storageKey) {
  const enc = localStorage.getItem(storageKey + '_enc');
  if (enc && getSovereignKey()) {
    try {
      const { iv, ct } = JSON.parse(enc);
      const cryptoKey = await getCloudCryptoKey();
      const dec = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        cryptoKey,
        new Uint8Array(ct)
      );
      return new TextDecoder().decode(dec);
    } catch (e) {
      console.error('Key decrypt failed:', e);
    }
  }
  // Fallback: plaintext (DEV_MODE or pre-migration)
  return localStorage.getItem(storageKey) || '';
}

/* INIT */
async function init(){
  // Paint UI immediately -- header, panel, bottom bar need no DB
  currentMode = 'soup';
  currentFolderId = null;
  breadcrumbPath = [{id: null, name: '◈ The Soup'}];
  updateHeaderButtons();
  showPanel('view-soup');
  renderDefaultBar('soup');

  // Ask iOS nicely to not erase us
  if(navigator.storage&&navigator.storage.persist){
    navigator.storage.persist().then(granted=>{
      if(granted)console.log('◆ Storage persistence granted');
    });
  }

  // Now wait for DB worker, then load data
  await _workerReady;
  await renderTableView();

  renderModelSelect();
  document.getElementById('input-api-key').value=await readSecureKey('nq_api_key')||'';
  document.getElementById('input-base-url').value=localStorage.getItem('nq_base_url')||'https://openrouter.ai/api/v1';
  document.getElementById('input-model').value=localStorage.getItem('nq_model')||'deepseek/deepseek-v4-flash';
  initWatcher();
  initGuardianModel();
}

// BOOTUP
async function bootApp() {
  if (NQ_DEV_MODE) {
    try {
      document.getElementById('lock-screen').style.display = 'none';
      await init();
      document.getElementById('btn-dev-force-pass').style.display = 'flex';
      document.getElementById('btn-dev-clear-watcher').style.display = 'flex';
    } catch(e) {
      console.error('DEV boot failed:', e);
      alert('Boot error: ' + e.message);
    }
    return;
  }

  const lockScreen = document.getElementById('lock-screen');
  const statusEl = document.getElementById('lock-status'); 
  const btnManualUnlock = document.getElementById('btn-manual-unlock');

  let faceAttempts = 0;
  const MAX_FACE_ATTEMPTS = 3;
  let cooldownActive = false;

  // Make the unlock button visible and wait for user gesture
  btnManualUnlock.style.display = 'block';
  btnManualUnlock.onclick = async () => {
    btnManualUnlock.style.display = 'none'; // Hide upon interaction
    await tryFaceID();
  };

  async function tryFaceID() {
    if (faceAttempts >= MAX_FACE_ATTEMPTS) {
      showBackupKeyInput();
      return;
    }
    faceAttempts++;
    statusEl.textContent = `Face ID attempt ${faceAttempts} of ${MAX_FACE_ATTEMPTS}...`;
    
    const unlocked = await unlockWithPRF();
    if (unlocked) {
      lockScreen.style.display = 'none';
      await init();
    } else if (faceAttempts < MAX_FACE_ATTEMPTS) {
      statusEl.textContent = `Failed. ${MAX_FACE_ATTEMPTS - faceAttempts} attempt(s) remaining.`;
      setTimeout(() => {
        btnManualUnlock.style.display = 'block';
        btnManualUnlock.textContent = 'Tap to Retry';
      }, 500); 
    } else {
      showBackupKeyInput();
    }
  }

  function showBackupKeyInput() {
    statusEl.textContent = 'Face ID locked. Enter sovereign backup key.';
    document.getElementById('fallback-key-input').style.display = 'block';
    document.getElementById('btn-fallback-unlock').style.display = 'block';
    document.getElementById('btn-fallback-unlock').onclick = unlockWithFallbackKey;
    
    document.getElementById('btn-faceid-retry').style.display = 'block'; 
    document.getElementById('btn-faceid-retry').onclick = () => tryCooldownFaceID();

    // Injecting the Self-Destruct Button dynamically
    if (!document.getElementById('btn-obliterate')) {
      const burnBtn = document.createElement('button');
      burnBtn.id = 'btn-obliterate';
      burnBtn.textContent = '✕ Burn Abyss (Start Fresh)';
      burnBtn.style.cssText = 'background:none; border:1px solid var(--danger); color:#ff6060; font-size:10px; font-weight:900; padding:10px 18px; border-radius:10px; letter-spacing:1px; text-transform:uppercase; margin-top:24px;';
      burnBtn.onclick = obliterateAbyss;
      document.getElementById('lock-screen').appendChild(burnBtn);
    }
  }

  async function tryCooldownFaceID() {
    if (cooldownActive) return;
    const btn = document.getElementById('btn-faceid-retry');
    cooldownActive = true;
    btn.disabled = true;
    let secs = 30;
    let interval = null;
    interval = setInterval(() => {
      secs--;
      btn.textContent = `◈ Retry Face ID (${secs}s)`;
      if (secs <= 0) {
        clearInterval(interval);
        interval = null;
        btn.textContent = '◈ Try Face ID';
        btn.disabled = false;
        cooldownActive = false;
      }
    }, 1000);

    let unlocked = false;
    try {
      unlocked = await unlockWithPRF();
    } finally {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      btn.textContent = '◈ Try Face ID';
      btn.disabled = false;
      cooldownActive = false;
    }
    if (unlocked) {
      lockScreen.style.display = 'none';
      await init();
    } else {
      statusEl.textContent = 'Face ID rejected. Use sovereign key.';
    }
  }
}

if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js?v=nq-v7');

window.cosmOSPinDisc=async function({title,raw_text,source_link,backlink}){const disc=await createDiscourse({title,raw_text,source_link:JSON.stringify(source_link)});if(backlink){const blId="bl_"+Date.now();await dbPut("cosm_backlinks",{id:blId,discourse_id:disc.id,...backlink,created_at:Date.now()});}return disc.id;};
