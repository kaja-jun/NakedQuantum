/* jshint esversion: 11 */
/* global Response, Request, URL, Headers, fetch */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-v4-flash';

/**
 * @param {string | null} origin
 * @param {{ ALLOWED_ORIGINS?: string }} env
 * @returns {string | null} origin to echo in ACAO, or null if forbidden
 */
function resolveAllowedOrigin(origin, env) {
  if (!origin) return null;
  if (origin === 'https://nakedquantum-v2.pages.dev') return origin;
  if (/^https:\/\/[a-z0-9-]+\.nakedquantum-v2\.pages\.dev$/i.test(origin)) return origin;
  if (origin === 'https://nakedquantum.com') return origin;
  const extras = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(function (s) { return s.trim().replace(/\/+$/, ''); })
    .filter(Boolean);
  if (extras.indexOf(origin) !== -1) return origin;
  return null;
}

/**
 * @param {string | null} allowed
 * @returns {Headers}
 */
function corsHeaders(allowed) {
  const h = new Headers();
  if (allowed) {
    h.set('Access-Control-Allow-Origin', allowed);
    h.set('Vary', 'Origin');
  }
  h.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type');
  h.set('Access-Control-Max-Age', '86400');
  return h;
}

/**
 * @param {unknown} body
 * @param {number} status
 * @param {string | null} allowed
 */
function jsonResponse(body, status, allowed) {
  const h = corsHeaders(allowed);
  h.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { status: status, headers: h });
}

function parseWorkerJsonContent(raw) {
  if (!raw) return null;
  var text = String(raw).trim();
  var start = text.indexOf('{');
  var end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = resolveAllowedOrigin(origin, env);

    if (request.method === 'OPTIONS') {
      if (!allowed) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(allowed) });
    }

    const url = new URL(request.url);
    const pathOk =
      url.pathname === '/' ||
      url.pathname === '/guardian-invoke' ||
      url.pathname === '/guardian-invoke/';
    if (!pathOk) {
      return new Response('Not found', { status: 404 });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse({ observation: null, error: 'OPENROUTER_API_KEY not set' }, 500, allowed);
    }

    var payload;
    try {
      payload = await request.json();
    } catch (e) {
      return jsonResponse({ observation: null }, 400, allowed);
    }

    var fastMapSnapshot = payload.fastMapSnapshot || {};
    var triggeredBy = payload.triggeredBy || 'unknown';
    var priorTheoryLine = payload.priorTheoryLine ? String(payload.priorTheoryLine).trim() : '';
    var witnessLedgerBlock = payload.witnessLedgerBlock ? String(payload.witnessLedgerBlock).trim() : '';
    var synapseStrip = payload.synapseStrip && typeof payload.synapseStrip === 'object' ? payload.synapseStrip : null;

    var orbitStr = 'none';
    if (Array.isArray(fastMapSnapshot.orbitingTerms) && fastMapSnapshot.orbitingTerms.length) {
      orbitStr = fastMapSnapshot.orbitingTerms.join(', ');
    }

    var priorBlock = '';
    if (witnessLedgerBlock) {
      priorBlock = witnessLedgerBlock + '\n\n';
    } else if (priorTheoryLine) {
      priorBlock =
        'Your prior theory line (test it — wonder if geometry still supports it; do not repeat it verbatim):\n' +
        priorTheoryLine + '\n\n';
    }

    var tintTerms = Array.isArray(fastMapSnapshot.orbitingTerms) && fastMapSnapshot.orbitingTerms.length
      ? fastMapSnapshot.orbitingTerms.slice(0, 4)
      : (fastMapSnapshot.dominantTheme && fastMapSnapshot.dominantTheme !== 'none' ? [fastMapSnapshot.dominantTheme] : []);

    var synapseBlock = '';
    if (synapseStrip) {
      synapseBlock = 'Witness synapse (read in this order — sequenced truth, not softer truth):\n';
      var readOrder = Array.isArray(synapseStrip.strip_read_order) ? synapseStrip.strip_read_order : [];
      for (var ri = 0; ri < readOrder.length; ri++) {
        synapseBlock += (ri + 1) + '. ' + readOrder[ri] + '\n';
      }
      synapseBlock += '- Posture profile: ' + (synapseStrip.posture_profile || 'default') + '\n';
      if (synapseStrip.posture_vector) {
        var pv = synapseStrip.posture_vector;
        synapseBlock += '- Coherence: ' + (pv.coherence != null ? pv.coherence : '—') +
          ' · resistance: ' + (pv.resistance != null ? pv.resistance : '—') +
          ' · self-ref: ' + (pv.self_ref_ratio != null ? pv.self_ref_ratio : '—') +
          ' · attractor: ' + (pv.attractor_concentration != null ? pv.attractor_concentration : '—') + '\n';
      }
      if (Array.isArray(synapseStrip.open_bridges) && synapseStrip.open_bridges.length) {
        synapseBlock += '- Open bridges: ' + synapseStrip.open_bridges.map(function (b) {
          return (b.terms || []).join('/') || b.id;
        }).join('; ') + '\n';
      }
      if (synapseStrip.elaboration_delta) {
        var ed = synapseStrip.elaboration_delta;
        synapseBlock += '- Elaboration delta: ×' + (ed.ratio != null ? ed.ratio : '?') +
          (ed.spike ? ' (spike after correction)' : '') + '\n';
      }
      if (Array.isArray(synapseStrip.perpetual_orbit_terms) && synapseStrip.perpetual_orbit_terms.length) {
        synapseBlock += '- Perpetual orbit: ' + synapseStrip.perpetual_orbit_terms.join(', ') + '\n';
      }
      if (synapseStrip.saccade_log && synapseStrip.saccade_log.blind_spot) {
        synapseBlock += '- Blind spot: ' + synapseStrip.saccade_log.blind_spot + '\n';
      }
      if (Array.isArray(synapseStrip.anomalies) && synapseStrip.anomalies.length) {
        synapseBlock += '- Anomalies: ' + synapseStrip.anomalies.join(' · ') + '\n';
      }
      if (synapseStrip.posture_profile === 'graduation') {
        synapseBlock += 'Graduation quiet: map stable — prefer silence or one quiet question; do not escalate.\n';
      }
      synapseBlock += '\n';
    }

    var prompt =
      'You are the Guardian. Reply with ONLY valid JSON (no markdown):\n' +
      '{"observation":"one observation, max 3 sentences","directive":{"abyss_tint":{"terms":["term1"],"tint":"amber","duration_hours":24}}}\n\n' +
      'observation: Guardian voice — not warm, not cold. Prefer questions over verdicts when uncertain.\n' +
      'directive.abyss_tint.terms: 1-4 terms from orbiting/dominant theme to highlight in the sky; tint "amber" or "urgent" if contradiction.\n\n' +
      synapseBlock +
      priorBlock +
      'Fast Map data:\n' +
      '- Triggered by: ' + triggeredBy + '\n' +
      '- Orbiting terms: ' + orbitStr + '\n' +
      '- Writing signature: ' + (fastMapSnapshot.writingSignature || 'unknown') + '\n' +
      '- Silence markers: ' + (fastMapSnapshot.silenceMarkers != null ? fastMapSnapshot.silenceMarkers : (fastMapSnapshot.silenceDays != null ? fastMapSnapshot.silenceDays : 0)) + '\n' +
      '- Dominant theme: ' + (fastMapSnapshot.dominantTheme || 'none') + '\n' +
      '- Paradox present: ' + (fastMapSnapshot.paradoxFlag ? 'true' : 'false') + '\n' +
      '- Contradiction present: ' + (fastMapSnapshot.contradictionFlag ? 'true' : 'false') + '\n';

    var upstream;
    try {
      upstream = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.OPENROUTER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 180,
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } catch (e) {
      return jsonResponse({ observation: null }, 200, allowed);
    }

    var data;
    try {
      data = await upstream.json();
    } catch (e2) {
      return jsonResponse({ observation: null }, 200, allowed);
    }

    var observation = null;
    var directive = null;
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      var parsed = parseWorkerJsonContent(data.choices[0].message.content);
      if (parsed && parsed.observation) {
        observation = String(parsed.observation).trim() || null;
        if (parsed.directive && parsed.directive.abyss_tint) {
          directive = parsed.directive;
        }
      } else {
        observation = String(data.choices[0].message.content).trim() || null;
      }
    }

    if (!directive && tintTerms.length) {
      directive = {
        abyss_tint: {
          terms: tintTerms,
          tint: fastMapSnapshot.contradictionFlag ? 'urgent' : 'amber',
          duration_hours: 24
        }
      };
    }

    return jsonResponse({ observation: observation, directive: directive }, 200, allowed);
  }
};
