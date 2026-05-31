/* jshint esversion: 11 */
/* global Worker, Blob, URL */
/**
 * OPFS SQLite worker + main-thread db bridge.
 * See app-architecture-split-blueprint.md (S6).
 * Loads after app.js — exposes dbGet/dbPut/setEncryptionKey/_workerReady globals.
 */

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
  db.run("CREATE TABLE IF NOT EXISTS bridge_rows(id TEXT PRIMARY KEY, opened_at INTEGER, source_log_id TEXT, prior_theory TEXT, user_action TEXT, user_note TEXT, signal_keys TEXT, geometry_at_open TEXT, status TEXT, checks INTEGER DEFAULT 0, last_check_at INTEGER, closed_at INTEGER, closure_reason TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS bridge_rows_enc(id TEXT PRIMARY KEY, enc TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS witness_ledger_chain(id TEXT PRIMARY KEY, seq INTEGER NOT NULL, event_type TEXT NOT NULL, event_id TEXT NOT NULL, payload_hash TEXT NOT NULL, prev_hash TEXT NOT NULL, link_hash TEXT NOT NULL, created_at INTEGER NOT NULL)");

  try { db.run("ALTER TABLE guardian_logs ADD COLUMN auto_invoked INTEGER DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN triggered_by TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN user_action TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN log_type TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN geometry_snapshot TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN primary_discourse_id TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN theory_one_line TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN qualifiers TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN directive TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN prediction_tag TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE guardian_logs ADD COLUMN prediction_outcome TEXT"); } catch (e) {}

  ['cosm_folders', 'cosm_discourses', 'characters', 'history', 'summaries', 'cosm_mosaic_tiles', 'cosm_backlinks', 'guardian_logs', 'guardian_summaries', 'immutable_entities', 'bridge_rows', 'witness_ledger_chain'].forEach
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

    // Hash-only witness ledger — always plaintext table (no witness_ledger_chain_enc)
    function ledgerStore(store, isEnc) {
      if (store === 'witness_ledger_chain') return store;
      return isEnc ? (store + '_enc') : store;
    }
    function storeUsesEnc(store, isEnc) {
      return isEnc && store !== 'witness_ledger_chain';
    }

    const isEnc = encKey;
    const targetStore = ledgerStore(store, isEnc);
    const useEnc = storeUsesEnc(store, isEnc);

    let result = null;
    if (action === 'GET_ALL') {
      const rows = toObjects(db.exec("SELECT * FROM " + targetStore));
      if (useEnc) { result = await Promise.all(rows.map(async r => r.enc ? await decryptObj(r.enc) : r)); }
      else { result = rows; }
    }
    else if (action === 'GET') {
      const res = db.exec("SELECT * FROM " + targetStore + " WHERE id=?", [data.id]);
      const row = res.length ? toObjects(res)[0] : null;
      if (useEnc && row && row.enc) { result = await decryptObj(row.enc); }
      else { result = row; }
    }
    else if (action === 'GET_BY_INDEX') {
      if (useEnc) {
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

      if (useEnc) {
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
const clearEncryptionKey = () => _workerReady.then(() => new Promise((res, rej) => {
  const msgId = ++_id; _pending[msgId] = { resolve: res, reject: rej };
  _worker.postMessage({ id: msgId, action: 'CLEAR_KEY' });
}));

