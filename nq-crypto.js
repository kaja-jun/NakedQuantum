/* jshint esversion: 11 */
/* global window, localStorage, document, crypto, navigator, indexedDB, setTimeout, setInterval, clearInterval, confirm, prompt, alert, NQ_DEV_MODE, setEncryptionKey, showToast, init */
/**
 * Quantum fortress — sovereign key, WebAuthn PRF, secure BYOK storage, cloud sync crypto.
 * See app-architecture-split-blueprint.md (S5).
 * Loads after nq-db.js — calls setEncryptionKey to arm the SQL worker.
 */

/* NQ ABYSS GATEKEEPER */

/* Cloud sync envelope (Supabase delta) */
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

