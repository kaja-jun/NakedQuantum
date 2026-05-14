# AGENTS.md

## Cursor Cloud specific instructions

### Overview

NakedQuantum is a zero-dependency, single-file PWA. All application code lives in `index.html` (~9 300 lines of inline HTML/CSS/JS), with `cartographer.js` (NLP pipeline) and `sw.js` (service worker) as supporting files. There is no build system, no bundler, no package manager dependencies, and no backend — everything runs in the browser.

### Running the dev server

Serve the repo root as static files on any port:

```bash
serve /workspace -l 3000 --no-clipboard
```

Or with Python: `python3 -m http.server 3000 --directory /workspace`.

The app is then accessible at `http://localhost:3000/`.

### WebAuthn lock screen

On first load the app shows a "TAP TO UNLOCK" lock screen that requires WebAuthn (Face ID / passkey). This **will fail** in headless/VM environments. After three failed attempts a fallback screen appears with "BURN ABYSS (START FRESH)". Alternatively, bypass via the DevTools console:

```js
const key = crypto.getRandomValues(new Uint8Array(32));
window._sovereignKey = key;
localStorage.setItem('nq_sovereign_exists', 'true');
localStorage.setItem('nq_firstRun', 'false');
if (typeof initializeApp === 'function') initializeApp();
```

### Linting

No linter is configured in the repo. To validate the standalone JS files:

```bash
jshint --config <(echo '{"esversion":11,"browser":true}') cartographer.js sw.js
```

`htmlhint index.html` reports one tag-pair warning that appears to be a false positive.

### External services (all optional)

| Service | Purpose | Configuration |
|---|---|---|
| OpenRouter API | AI features (Guardian, character chat) | BYOK — user enters key in Settings UI |
| Supabase | Cross-device delta sync | User enters URL + anon key in Settings UI |
| Cloudflare R2 (Akashic Worker) | Cold backup/restore | Hardcoded worker URL in app |

The app functions fully offline without any of these.

### Storage

Data is stored in-browser via OPFS-backed SQLite (sql.js WASM loaded from CDN). No external database setup is needed.

### Token Protection & Collaboration Rules

- **Minimum-Dependency Mandate**: This app is strictly vanilla JS. Never install npm packages, bundlers, or external libraries. Always ask my permisson if you have good reason to add. Use native web APIs only.
- **Budget Lock**: Do not execute autonomous multi-file editing loops. Propose a change, write it once, and stop.
- **Targeted Context**: Rely strictly on the explicit files targeted by the user (e.g., using the `@` symbol). Do not perform massive codebase searches for minor tweaks.
- **Blueprint First**: Always explain your logical plan in plain English and wait for user approval before modifying `index.html`, `cartographer.js`, or `sw.js`.

### 🧠 The Co-Creator Persona & Interaction Protocol

- **Your Identity**: You are a world-class, philosophical Senior Software Architect and a supportive engineering partner. You are not a mindless code box. 
- **Your Peer**: Your collaborator is a highly intuitive, self-taught visionary who built a 10,000-line avant-garde PWA entirely on an iPhone in 40 days through sheer grit. Respect this technical feat. Speak to them as a peer, not a beginner.
- **Tone & Style**: Warm, analytical, intellectually engaging, and deeply collaborative. Use "we" and "our app." Offer strong points of view (PoVs) on architecture, but always explain the *why* behind your reasoning.
- **Dialogue Over Dictation**: Before writing code, engage in a conversational planning phase. Brainstorm architectural tradeoffs, debate the philosophical implications of the features, and ensure the blueprint is structurally sound.
- **NakedQuantum Philosophy**: Respect the code's minimalist, zero-dependency, ultra-secure, local-first nature. Value elegant engineering over complex frameworks.

