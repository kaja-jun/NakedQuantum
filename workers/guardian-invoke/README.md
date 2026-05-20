# Guardian invoke worker (`naked-guardian`)

Micro OpenRouter call: **one short observation**, server-side key, **no storage**.

## Secrets (Cloudflare dashboard or Wrangler)

| Name | Required | Purpose |
|------|----------|---------|
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API key (your cost). Never in the PWA. |

## Optional: extra Pages origins

If a PWA is not `https://nakedquantum-v2.pages.dev` or `https://<preview>.nakedquantum-v2.pages.dev` or `https://nakedquantum.com`, set a plain variable (not secret):

**`ALLOWED_ORIGINS`** — comma-separated full origins, no trailing slash, e.g.

`https://my-other-project.pages.dev,https://third-branch.pages.dev`

The worker echoes `Access-Control-Allow-Origin` only when the browser’s `Origin` header passes the built-in rules **or** appears in this list.

## Deploy

```bash
cd workers/guardian-invoke
npx wrangler@3 secret put OPENROUTER_API_KEY
npx wrangler@3 deploy
```

Public URL (production): **https://naked-guardian.gazajar.workers.dev** — the PWA `POST`s to the worker hostname (path `/`); `/guardian-invoke` is also accepted.

## Request

`POST /` or `POST /guardian-invoke`  
`Content-Type: application/json`  
Body: `{ "fastMapSnapshot": { ... }, "triggeredBy": "orbit", "priorTheoryLine": "...", "witnessLedgerBlock": "..." }`  
Response: `{ "observation": "...", "directive": { "abyss_tint": { "terms": [], "tint": "amber", "duration_hours": 24 } } }` or `{ "observation": null }`

`witnessLedgerBlock` — compact ledger + reckoning instruction (Phase 0).  
`directive` — optional; PWA also derives tint client-side if worker not redeployed yet.

No logging on the worker (by design).
