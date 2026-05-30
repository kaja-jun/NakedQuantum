# NakedQuantum — Desktop Vessel Blueprint

*Pin before Tauri + Ollama work. One vault, two envelopes.*

**Last updated:** 18 May 2026  
**Status:** Active contract — **not started** (pre-laptop gate)  
**Pairs with:** `lighthouse-cockpit-blueprint.md`, `app-architecture-split-blueprint.md`, `NakedQuantum-intention-blueprint.md` §9

---

## 0. One sentence

The **PWA stays the reliability surface**; **Tauri desktop** is the power surface — same `nq.db`, same witness loop contract, thicker walls and local Ollama, not a fork of the soul.

---

## 1. Two surfaces (not two products)

| Surface | Role | LLM |
|---------|------|-----|
| **PWA (iPhone / browser)** | Daily carry: write, mesh, summon, SUBSTRATE dogfood | BYOK OpenRouter when user summons |
| **Desktop (Tauri)** | Write cockpit, live strip, background witness passes, sentence matrix | Ollama localhost — optional, sovereign |

**Principle:** PWA must not bloat into desktop. Desktop must not fork schema or break Sanctuary/Soup walls.

---

## 2. What laptop unlocks (ordered)

| # | Work | Why desktop-first |
|---|------|-------------------|
| 1 | **Tauri shell** — load same static assets + OPFS `nq.db` path | Escape Safari limits; sidecar process |
| 2 | **Ollama sidecar** — analyst pass after local geometry | No CORS; no cloud required for Guardian voice |
| 3 | **Lighthouse cockpit** — write column + live marginalia strip | `lighthouse-cockpit-blueprint.md` |
| 4 | **Sentence matrix (Track B)** — echoes/voids in synapse JSON | Geometry depth phone browsers won't carry |
| 5 | **Background witness passes** — threshold engine → panel (WP2+) | Between-session without tab open |
| 6 | **Wave 2/3 Ollama** — analyst then mirror | Language only after math |
| 7 | **Layer 4 hardening** — encrypt Watcher IDB, KEK/DEK (optional) | `NakedQuantum-quantum-fortress.md` §18.8 |

**Not blocking mythril on phone:** items 1–3 are the laptop milestone; 4–7 follow dogfood.

---

## 3. Code readiness (before `cargo tauri init`)

| Item | Status |
|------|--------|
| `app.js` module split S0–S1 | ☑ `witness-weather.js`, `witness-synapse.js` |
| S2–S6 split (`abyss`, `guardian`, `watcher`, crypto, db) | ☐ phased on `app-architecture-split-blueprint.md` |
| WP1 threshold engine | ☑ console-only (`dogfoodWitnessThresholds`) |
| WP2+ witness panel UI | ☐ after laptop |
| Summon → Review migration | ☐ WP7 — not before panel dogfood |

**Gate:** finish **S2–S4 split** (or agreed subset) so Tauri wraps files, not a 10k monolith.

---

## 4. Tauri stack (when Kaja gates)

| Layer | Choice | Notes |
|-------|--------|-------|
| Shell | **Tauri 2** | Native webview; same `index.html` entry |
| Bundler | **Vite** (dev only) | Build step acceptable **only** for desktop envelope — PWA on Pages stays zero-build |
| Assets | Copy from repo root | `app.js`, `witness-synapse.js`, `cartographer.js`, `app.css`, `sw.js` optional offline |
| DB | OPFS or Tauri fs path to `nq.db` | Same sql.js WASM; migration story documented before ship |
| Ollama | Localhost sidecar | Guardian prose channel; synapse/threshold still local-first |

**Do not:** rewrite realms in Rust. **Do:** thicker file access, sidecar IPC, optional build for desktop dev loop.

---

## 5. Sanctuary boundary (non-negotiable)

Nothing in the desktop shell reads Sanctuary chat, Forge, or Memory Vault content. Witness + Lighthouse + Soup only. Same as PWA.

---

## 6. Shipped log

| Date | Item | Notes |
|------|------|-------|
| 2026-05-18 | **Blueprint pinned** | Pre-laptop contract; links cockpit + split + intention §9 |

---

*Same organism. Thicker shell.*
