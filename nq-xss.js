/* jshint esversion: 11 */
/* global document, DOMParser, XMLSerializer */
/**
 * XSS helpers — load before app.js (Quantum Fortress F1).
 * Zero npm; native DOM APIs only.
 */

var SVG_SAFE_TAGS = {
  svg: 1, g: 1, path: 1, circle: 1, ellipse: 1, line: 1, polyline: 1, polygon: 1,
  rect: 1, defs: 1, title: 1, desc: 1
};

var SVG_SAFE_ATTRS = {
  viewbox: 1, xmlns: 1, width: 1, height: 1, fill: 1, stroke: 1, 'stroke-width': 1,
  d: 1, cx: 1, cy: 1, r: 1, rx: 1, ry: 1, x: 1, y: 1, x1: 1, y1: 1, x2: 1, y2: 1,
  points: 1, opacity: 1, transform: 1, class: 1
};

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return escHtml(str);
}

function safeImgSrc(url) {
  if (!url) return '';
  var s = String(url).trim();
  if (/^(blob:|data:image\/)/i.test(s)) return s;
  return '';
}

function sanitizeSvg(raw) {
  var src = String(raw || '').trim();
  if (!/^<svg[\s>]/i.test(src)) return '';
  try {
    var doc = new DOMParser().parseFromString(src, 'image/svg+xml');
    var root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg') return '';

    function walk(el) {
      if (!el || el.nodeType !== 1) return null;
      var tag = el.tagName.toLowerCase();
      if (!SVG_SAFE_TAGS[tag]) return null;
      var out = document.createElementNS('http://www.w3.org/2000/svg', tag);
      var i, attr, n, v;
      for (i = 0; i < el.attributes.length; i++) {
        attr = el.attributes[i];
        n = attr.name.toLowerCase();
        if (!SVG_SAFE_ATTRS[n]) continue;
        v = attr.value;
        if (/javascript:|data:text/i.test(v)) continue;
        out.setAttribute(attr.name, v);
      }
      for (i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3) {
          out.appendChild(document.createTextNode(el.childNodes[i].textContent));
        } else if (el.childNodes[i].nodeType === 1) {
          var child = walk(el.childNodes[i]);
          if (child) out.appendChild(child);
        }
      }
      return out;
    }

    var clean = walk(root);
    if (!clean) return '';
    return new XMLSerializer().serializeToString(clean);
  } catch (e) {
    return '';
  }
}
