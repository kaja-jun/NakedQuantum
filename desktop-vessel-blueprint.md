# NakedQuantum — Desktop Vessel Blueprint

*Pin before Tauri work. One vault, one product, one vessel.*

**Last updated:** 31 May 2026  
**Status:** Active contract — not started (pre-laptop gate)  
**Pairs with:** `app-architecture-split-blueprint.md`, `NakedQuantum-intention-blueprint.md` §9, `witness-loop-upgrade-blueprint.md`

-----

## 0. One sentence

Desktop is the product. Same modules, thicker shell, local inference via llama.cpp — no Ollama, no external dependency, no compromised PWA.

-----

## 1. Product surface decision (May 2026)

|Surface                            |Decision                  |Reason                                                                               |
|-----------------------------------|--------------------------|-------------------------------------------------------------------------------------|
|**Desktop (Tauri — Mac first)**    |PRIMARY product           |Full NakedQuantum — witness loop, local inference, full Cartographer + Watcher       |
|**PWA**                            |RETIRED as product surface|Stripping features to fit Safari produces a different app, not a lighter NakedQuantum|
|**iOS (SideStore / LiveContainer)**|Personal dogfood only     |Kaja tests, offers if stable, documents quirks — user decides                        |
|**Android (APK sideload)**         |Future — after Mac stable |Tauri v2 Android + llama.cpp via NDK; full product if inference holds                |
|**Windows**                        |Second desktop target     |Tauri cross-platform — nearly free once Mac stable                                   |

**Philosophy:** A stripped NakedQuantum is not NakedQuantum. One platform done properly beats three platforms done partially.

-----

## 2. Inference architecture — llama.cpp direct (no Ollama)

### 2.1 Why not Ollama

Ollama is a convenient developer wrapper — separate process, localhost HTTP server, external install required. For NakedQuantum distribution it creates:

- User must install Ollama separately before the app works
- Two processes instead of one
- Port conflicts, “is Ollama running” checks
- External dependency outside our control

### 2.2 The llama.cpp path

```
Frontend JS → Tauri IPC command → Rust backend → llama.cpp crate → GGUF model file
```

Inference runs inside the app process. No server. No port. No external install. The GGUF model file lives in `app_data_dir/models/`.

**Rust crate:** `llama-cpp-2` or `llama_cpp` — mature, actively maintained, Metal acceleration on Apple Silicon automatic.

**Tauri commands (typed IPC):**

```rust
#[tauri::command]
async fn witness_pass(snapshot: SynapseSnapshot) -> Result<String, String>

#[tauri::command]  
async fn craft_response(discourse: String, request: CraftRequest, voice_brief: String) -> Result<String, String>

#[tauri::command]
async fn download_model(tier: ModelTier, dest_path: String) -> Result<(), String>
// streams progress events to frontend

#[tauri::command]
async fn load_model(path: String) -> Result<(), String>

#[tauri::command]
fn list_installed_models() -> Vec<ModelInfo>
```

Frontend calls these like any async function. No HTTP fetch. No localhost URL. Cleaner than Ollama was.

### 2.3 Apple Silicon advantage

llama.cpp uses Metal automatically on M-series chips. Inference on M5 with unified memory is fast — a witness pass at 80 tokens completes in under 2 seconds on 4B models. No GPU configuration required. It just works.

-----

## 3. Model tiers

NakedQuantum model names are internal — not exposed as GGUF filenames or Qwen branding in the UI.

|NQ name        |Base model|Quantisation|Size  |Target hardware              |
|---------------|----------|------------|------|-----------------------------|
|**NQ Standard**|Qwen3 4B  |Q4_K_M      |~2.5GB|All supported Macs (8GB+ RAM)|
|**NQ Enhanced**|Qwen3 8B  |Q4_K_M      |~5.1GB|16GB+ RAM recommended        |
|**NQ Deep**    |Qwen3 14B |Q4_K_M      |~9.2GB|32GB+ RAM                    |

**Recommended base:** NQ Standard — pre-selected in onboarding, bundled download prompt on first launch.

**Model selection rationale:** Qwen3 survives the Guardian register test. Other models (Llama 3.2, Gemma 4B) soften observations and trigger safety rails on legitimate introspective content. NQ Standard must hold the witness register without comfort drift. Validate on MacBook Air M5 first week — if 4B drifts, NQ Enhanced becomes the minimum.

**Model file location:** `{app_data_dir}/models/nq-standard.gguf` etc. Never in app bundle — downloaded on demand.

-----

## 4. First-run onboarding flow

```
Download NakedQuantum (~2.5GB with NQ Standard bundled)
↓
Install and launch
↓
Boot detection — model present and valid? → yes → continue
                                          → no  → re-download prompt
↓
Onboarding — shows model tier screen as information
"Your model: NQ Standard
 Upgrade available: NQ Enhanced, NQ Deep"
↓
App opens

```

**Rules:**

- No automatic model selection — user confirms
- System requirements shown honestly before download
- Download is resumable — interrupted download retries from checkpoint on next launch
- No model = no witness pass, no craft mode — app is write + sync only until model present
- BYOK OpenRouter remains available as fallback for users who explicitly prefer cloud

-----

## 5. Model management in witness panel

Model indicator lives in SUBSTRATE — contextual, not buried in settings:

```
◇ SUBSTRATE
WEATHER
  calm
POSTURE
  coherence 1 · resistance 0.82 · ...
...
MODEL
  NQ Standard · Qwen3 4B                    [swap ↓]
```

Tap `[swap ↓]` → tier screen slides in inline:

```
NQ Standard    2.5GB    ✓ installed    [active]
NQ Enhanced    5.1GB    ↓ download
NQ Deep        9.2GB    ↓ download
```

Download progress shown inline. Model swap takes effect after current pass completes — never mid-pass.

**No technical jargon in UI:** no GGUF, no Q4_K_M, no Qwen branding. NQ names only.

-----

## 6. Safeguard floor (minimum, not wellness rails)

NakedQuantum is not a therapist. The witness does not comfort. The blade does not soften.

However: a witness that sees genuine crisis signals and fires a geometric observation is also a choice — and the wrong one.

**The floor:**

One threshold condition added to `runLocalPass()`:

```
crisis_signal_detected → invoke_denied
                       → no weather line
                       → no cues
                       → one quiet line: external resource
                       → witness rests
```

**Crisis signal detection:** a specific cluster in the synapse — not philosophical darkness, not existential writing, not suffering as subject matter (all legitimate). A narrow, high-threshold pattern of specific term clusters that appear in genuine distress contexts.

**What this is not:**

- Content filtering
- Word censoring
- Wellness prompts
- “Are you okay” responses
- Blocking any topic from writing

**What this is:**

- One silence condition
- One external resource line, shown once
- No lecture, no Guardian observation
- The witness knowing when not to speak

This is consistent with the existing philosophy. Silence is already a first-class response. This adds one more condition for silence — the most important one.

**Implementation:** small addition to `witness-synapse.js` crisis cluster detection. One localStorage flag so the resource line doesn’t repeat every session. Cursor task, one pass.

-----

## 7. What laptop unlocks (ordered)

|#|Work                                                                        |Why desktop-first           |
|-|----------------------------------------------------------------------------|----------------------------|
|1|**Tauri shell** — wrap split modules, OPFS path                             |Escape Safari limits        |
|2|**llama.cpp Rust integration** — IPC commands, model loader                 |Replace Ollama entirely     |
|3|**First-run onboarding** — model required screen, download flow             |Stranger first-run          |
|4|**Witness panel WP1–WP5** — sequential render, threshold engine, Review gate|Desktop surface for the loop|
|5|**Lighthouse cockpit** — editor column + witness panel side by side         |Primary writing surface     |
|6|**Craft layer C1–C3** — voice brief, per-discourse help, witness firewall   |Writing collaborator        |
|7|**Sentence matrix (Track B)** — voids, Hebbian locks, phase transitions     |Geometry depth              |
|8|**Background witness passes** — threshold engine between sessions           |Always-on organism          |
|9|**Layer 4 hardening** — KEK/DEK, encrypted Watcher IDB                      |Fortress §18.8              |

**First week on MacBook Air:** items 1–3 only. Get the shell running, inference working, onboarding clean. Write in it. Everything else earns the next sprint.

-----

## 8. Code readiness (before `cargo tauri init`)

|Item                       |Status                                     |
|---------------------------|-------------------------------------------|
|`app.js` module split S0–S6|☑ May 2026 — cache `nq-v25`                |
|WP1 threshold engine       |☑ console-only (`dogfoodWitnessThresholds`)|
|`witness-weather.js`       |☑ shipped                                  |
|WP2+ witness panel UI      |☐ after Tauri shell stable                 |
|Summon → Review migration  |☐ WP7 — after panel dogfood                |
|Craft layer                |☐ C1 after WP2                             |

**Gate:** module split complete — Tauri wraps split files, not a monolith. ☑ cleared.

-----

## 9. Tauri stack

|Layer      |Choice                      |Notes                                                                  |
|-----------|----------------------------|-----------------------------------------------------------------------|
|Shell      |**Tauri 2**                 |Native webview; same `index.html` entry                                |
|Bundler    |**Vite** (dev only)         |Desktop envelope only — acceptable build step                          |
|Assets     |Copy from repo root         |All split modules + cartographer + weather                             |
|DB         |Tauri fs path to `nq.db`    |Same sql.js WASM; OPFS → Tauri fs path migration documented before ship|
|Inference  |**llama.cpp via Rust crate**|No Ollama — IPC commands from frontend                                 |
|Model files|`app_data_dir/models/`      |Downloaded on demand, never bundled in binary                          |
|OS keychain|`keyring` Rust crate        |BYOK keys off localStorage, into OS keychain                           |
|Touch ID   |Tauri biometric plugin      |WebAuthn PRF → Touch ID on desktop                                     |

-----

## 10. Sanctuary boundary (non-negotiable)

Nothing in the desktop shell reads Sanctuary chat, Forge, or Memory Vault. Witness + Lighthouse + Soup only. Same rule as PWA. Same rule forever.

-----

## 11. Mac WebKit QA checklist (first week)

Before building any new desktop feature — verify existing PWA surfaces render correctly in Tauri’s Mac WebKit:

- [ ] All realm transitions
- [ ] Abyss canvas settle physics
- [ ] SUBSTRATE panel rendering
- [ ] Guardian view + log detail
- [ ] Soup mesh + gravity cards
- [ ] Sanctuary chat flow
- [ ] Settings + BYOK key entry
- [ ] Sync indicators

Mac WebKit ≠ iOS WebKit ≠ Chrome. CSS that looks correct in dev may need adjustment. QA pass before building new surfaces.

-----

## 12. Windows path (after Mac stable)

Tauri builds for Windows via cross-compilation or Windows CI runner. WebView2 is pre-installed on Windows 11. The Rust backend is already cross-platform. A Windows build is primarily:

- CI pipeline addition (`windows-latest` runner)
- WebView2 runtime check on older Windows
- llama.cpp CUDA support for Nvidia GPU users (optional, significant inference speedup)
- Code signing for Windows distribution

No separate codebase. Same modules. Same inference architecture. Windows users with Nvidia GPUs get better inference performance than Apple Silicon — CUDA vs Metal.

-----

## 13. Android path (after Windows stable)

- Tauri v2 Android support — maturing
- llama.cpp via Android NDK — feasible on high-end devices (8GB+ RAM)
- APK sideload distribution — no Play Store, one-toggle install
- Full NakedQuantum on Pixel 8 / Samsung S24 class devices

**Not a companion surface.** If inference holds on Android — full product. If it doesn’t — wait for better hardware.

-----

## 14. Revision log

|Date      |Change                                                                                                                                                                                                            |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|2026-05-18|Initial pin — PWA + Tauri two surfaces, Ollama sidecar                                                                                                                                                            |
|2026-05-30|S0–S6 split shipped — gate cleared                                                                                                                                                                                |
|2026-05-31|**Major revision** — PWA retired as product surface; Ollama replaced by llama.cpp direct; in-app model management; safeguard floor added; Android as full product target; Windows CI path; Mac WebKit QA checklist|

-----

*One product. One vessel. Done properly.*
