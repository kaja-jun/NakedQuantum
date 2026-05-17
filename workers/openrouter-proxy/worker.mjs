/* jshint esversion: 11 */
/* global Response, Request, URL, Headers, fetch */
/**
 * Transparent OpenRouter forward with CORS for browser PWAs.
 *
 * Set in NakedQuantum Data page → OpenRouter proxy:
 *   https://<your-worker>.workers.dev/v1
 *
 * The app calls `${base}/chat/completions`, so this worker receives
 * `/v1/chat/completions` and forwards to `https://openrouter.ai/api/v1/chat/completions`.
 * The client still sends Authorization: Bearer <OpenRouter key> (BYOK).
 */

function corsHeaders(req) {
  const h = new Headers();
  const origin = req.headers.get('Origin');
  h.set('Access-Control-Allow-Origin', origin || '*');
  h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, HTTP-Referer, X-Title');
  h.set('Access-Control-Max-Age', '86400');
  return h;
}

function addCors(resp, req) {
  const nh = new Headers(resp.headers);
  const ch = corsHeaders(req);
  ch.forEach(function (v, k) {
    nh.set(k, v);
  });
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: nh
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/v1/')) {
      const msg = JSON.stringify({
        error: { message: 'Path must start with /v1/ (proxy base should end with /v1)' }
      });
      return addCors(
        new Response(msg, { status: 400, headers: { 'Content-Type': 'application/json' } }),
        request
      );
    }
    const upstreamUrl = 'https://openrouter.ai/api' + url.pathname + url.search;
    const ih = new Headers(request.headers);
    ih.delete('Host');
    const init = {
      method: request.method,
      headers: ih,
      redirect: 'follow'
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }
    const ures = await fetch(upstreamUrl, init);
    return addCors(ures, request);
  }
};
