# Header & Naming Refactor Blueprint

> Single batch. Read everything before touching any code.
> These are precise string replacements and small UI changes. Do not refactor, do not reorganise, do not touch unrelated code.

-----

## 1. Remove NakedQuantum Wordmark

**File: index.html**

Find the `#nq-wordmark` element. Delete it entirely from the HTML.

**File: app.js**

Find every reference to `nq-wordmark` and `wm.textContent` and `wm.innerHTML` and `wm.classList`. Remove those lines. The wordmark no longer exists — do not set text on it, do not toggle classes on it.

**File: app.css**

Find `.nq-wordmark` and all variants (`.nq-wordmark--sanctuary-realm` etc). Delete those rules entirely.

-----

## 2. Make Header Buttons Bigger With Sub-labels

**File: index.html**

The `#header-actions` div holds the buttons. Add this CSS to app.css:

```css
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hdr-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  cursor: pointer;
}
.hdr-btn-wrap .hdr-btn {
  font-size: 20px;
  padding: 6px 8px;
}
.hdr-btn-label {
  font-size: 7px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent);
  opacity: 0.6;
  pointer-events: none;
  white-space: nowrap;
}
```

**File: app.js — in `updateHeaderButtons()`, soup mode only**

Wrap each button in a `hdr-btn-wrap` div with a label beneath. Replace the soup `c.innerHTML` with:

```javascript
c.innerHTML =
  '<div class="hdr-btn-wrap"><button class="hdr-btn" id="hdr-sanctuary" title="Sanctuary">&#8962;</button><span class="hdr-btn-label">Sanctuary</span></div>' +
  '<div class="hdr-btn-wrap"><button class="hdr-btn" id="hdr-guardian" style="font-size:20px;">&#43065;</button><span class="hdr-btn-label">Guardian</span></div>' +
  '<div class="hdr-btn-wrap"><button class="hdr-btn" id="hdr-abyss" title="Abyss">&#9689;</button><span class="hdr-btn-label">Abyss</span></div>' +
  '<div class="hdr-btn-wrap"><button class="hdr-btn" id="hdr-deep-soup" title="Subconscious">꩜</button><span class="hdr-btn-label">Subconscious</span></div>' +
  '<button class="hdr-btn" id="hdr-soup-menu" style="font-size:22px;line-height:1;padding-bottom:2px;" aria-label="Soup menu">⋯</button>';
```

All onclick handlers below this line remain completely unchanged.

-----

## 3. Sanctuary Header — Back Arrow Instead of Home Glyph

**File: app.js — in `updateHeaderButtons()`, sanctuary mode block**

Find where `hdr-sanctuary-home` button is created. Change the button text from `⌂` to `←` and update title/aria-label:

```javascript
// FROM
title="Back to Soup" aria-label="Back to Soup" style="font-size:18px;">⌂
// TO
title="Back" aria-label="Back" style="font-size:18px;">←
```

-----

## 4. Fix Guardian Glyph on Guardian Page and Logs Button

**File: app.js**

Search for every place the Abyss glyph `&#9689;` or `◈` or `⬡` is used inside the Guardian view or Guardian logs button. Replace with the Guardian glyph `&#43065;` to match the header button.

Specifically check:

- Guardian view header/nav button
- Guardian logs render function — any button that opens or references guardian logs
- `openGuardianLogDetail` — any glyph rendered there

Do NOT change the Abyss header button glyph — that stays as is.

-----

## 5. Rename Deep Soup → Subconscious (full string replace)

**Files: app.js, app.css, index.html, cartographer.js**

Exact replacements — do them as find-and-replace, do not retype manually:

|From                   |To                                        |
|-----------------------|------------------------------------------|
|`Deep Soup`            |`Subconscious`                            |
|`deep-soup`            |`subconscious`                            |
|`deepSoup`             |`subconscious` (camelCase: `subconscious`)|
|`deep_soup`            |`subconscious`                            |
|`DEEP_SOUP`            |`SUBCONSCIOUS`                            |
|`openDeepSoupView`     |`openSubconsciousView`                    |
|`view-deep-soup`       |`view-subconscious`                       |
|`deep-soup-surface`    |`subconscious-surface`                    |
|`deep-soup-moat-canvas`|`subconscious-moat-canvas`                |
|`hdr-deep-soup`        |`hdr-subconscious`                        |

After renaming functions, update all call sites. Search for old function names and confirm nothing is left behind.

-----

## 6. Remove “The Soup” Label From Gold Tether Line

**File: app.js**

Find where the breadcrumb/tether line renders the root label. It currently shows “The Soup” or “Soup” as the first node label. Remove that label entirely — the tether line starts from the first node with no root text label.

Search for: `The Soup` and `'Soup'` inside the breadcrumb/tether render function. Remove the text, keep the dot/node if it exists.

-----

## What NOT to Touch

- Do not change any onclick handlers or navigation logic
- Do not change firefly, mycelium, or moat systems
- Do not change Guardian prompt or Guardian conversation flow
- Do not change Abyss, Sanctuary, or Guardian realm names — only Deep Soup → Subconscious
- Do not add animations or transitions
- Do not change any DB schema or localStorage keys (keep old key names for backwards compat)
- localStorage keys like `nq_deep_soup_*` can stay as-is — internal keys, users never see them

-----

## Verify After

- [x] No `nq-wordmark` element or references remain (replaced by `#nq-header-title` for Sanctuary only)
- [x] Header shows 4 labelled buttons + menu in soup view (`#header-right`)
- [x] Sanctuary header shows ← not ⌂
- [x] Guardian page and logs use guardian glyph not abyss glyph
- [x] No instance of “Deep Soup”, “deep-soup”, “deepSoup” visible to user
- [x] Gold tether line has no root text label
- [ ] App loads without console errors (manual)
- [ ] Navigating to Subconscious view works (manual)
- [ ] Subconscious moats still spawn on entry (manual)

## Shipped (cursor/header-naming-refactor-b53a)

- Removed NakedQuantum wordmark; centered **The Sanctuary** via `#nq-header-title` (HTML + `syncNqHeaderForCurrentPanel`).
- Soup header: labeled `hdr-btn-wrap` buttons on `#header-right`.
- Full Deep Soup → Subconscious rename (IDs, views, functions, CSS class).
- Guardian glyphs fixed in `index.html` + log/detail paths in `app.js`.
- Gold tether: root knot dot kept, “The Soup” label removed.