# OpenRouter proxy (Cloudflare Worker)

Optional HTTPS edge that forwards `/v1/*` to `https://openrouter.ai/api/v1/*` and adds **CORS** headers so a static PWA on another origin can call OpenRouter without browser blocking.

## Configure NakedQuantum

1. Deploy this worker and copy its URL, e.g. `https://nq-openrouter-proxy.your-subdomain.workers.dev/v1`
2. In the app **Data** page → **Neural Gateway** → **OpenRouter proxy (optional)**, paste that URL (must start with `https://` and end with `/v1` or `/v1/`).
3. **Save gateway**. Chat, Guardian, summarisation, and mosaic extract will use the proxy base instead of **OpenRouter base URL** when the field is non-empty.

The API key remains on the device (BYOK); the worker does not store keys.

## Deploy

```bash
cd workers/openrouter-proxy
npx wrangler@3 deploy
```

Requires a Cloudflare account and `wrangler login`.

## Notes

- Restrict who can call your worker (e.g. Cloudflare Access, token query, or rate limits) if the URL is guessable; this template does not add auth.
- Streaming responses pass through unchanged aside from merged CORS headers.
